## Context

The tracker app has full CRUD for transactions and categories, with Redis caching and prefix-based invalidation already in place. The frontend needs aggregate data for dashboard charts (summaries, breakdowns, trends). All transaction data lives in the `transactions` table with a FK to `transaction_categories`. No exchange rate data exists, so aggregation must be scoped to a single currency.

## Goals / Non-Goals

**Goals:**

- Provide 5 read-only aggregation endpoints that power frontend dashboard charts
- Reuse the existing caching infrastructure (`CacheService`, `buildCacheKey`, `buildCachePrefix`)
- Keep analytics queries efficient with proper SQL aggregation (no application-level iteration)
- Invalidate analytics cache when transactions change

**Non-Goals:**

- Cross-currency aggregation (requires exchange rates — out of scope)
- Real-time streaming or WebSocket updates
- Custom date range presets (e.g., "last 30 days" shortcut) — frontend computes dates
- Export/download of analytics data
- Caching at the HTTP layer (e.g., Cache-Control headers)

## Decisions

### 1. Separate `analytics` module vs extending `transactions`

**Decision:** New `src/modules/analytics/` module.

**Rationale:** Analytics queries are pure aggregation (SUM, GROUP BY, date_trunc) — fundamentally different from CRUD operations. Separate module keeps files focused and testable. The transactions module is already ~550 LOC. The only cross-module dependency is cache invalidation (one line per write method).

**Alternative considered:** Extend transactions module. Rejected because it would nearly double the module size and mix two different concerns (row-level CRUD vs aggregate reporting).

### 2. Analytics repository queries the `transactions` table directly

**Decision:** `AnalyticsRepository` injects `DrizzleDb` and queries `transactions`/`transaction_categories` tables directly rather than going through `TransactionRepository`.

**Rationale:** Analytics queries share the table but not the query logic. Aggregation queries use GROUP BY, SUM with CASE, date_trunc — none of which overlap with CRUD methods. Routing through `TransactionRepository` would force it to expose low-level query builders.

### 3. Shared base query builder within analytics repository

**Decision:** A private `buildBaseConditions()` method in `AnalyticsRepository` constructs the shared WHERE clause (userId, currencyCode, dateFrom, dateTo, type, categoryId).

**Rationale:** All 5 endpoints filter on the same base parameters. Centralizing avoids duplication and ensures consistent filtering.

### 4. Cache invalidation via `delByPrefix` in transactions service

**Decision:** Add `await this.cacheService.delByPrefix(buildCachePrefix('analytics', userId))` to the existing `create`, `update`, and `delete` methods in `TransactionsService`.

**Rationale:** Reuses the existing prefix-based invalidation pattern. No new infrastructure needed. Analytics cache keys use the `analytics:{userId}:` prefix, so a single `delByPrefix` call clears all analytics caches for the affected user.

**Alternative considered:** Event-based invalidation (emit event from transactions, listen in analytics). Rejected as over-engineered for a single `delByPrefix` call — adds complexity without meaningful decoupling benefit.

### 5. Date defaults set in the service layer, not DTOs

**Decision:** When `dateFrom`/`dateTo` are omitted, the service sets defaults (start of current month / now) before passing to the repository.

**Rationale:** DTO layer handles validation only. Default logic that depends on "current time" belongs in the service where it's testable and explicit.

### 6. Amounts returned as strings

**Decision:** All monetary values in responses are strings (e.g., `"5200.00"`).

**Rationale:** Matches existing convention in the transactions module. Preserves `numeric(19,2)` precision without floating-point issues.

### 7. Percentages computed in the service layer

**Decision:** Category breakdown and top-categories percentages are calculated in TypeScript, not SQL.

**Rationale:** Result sets are small (one row per category). TypeScript division is simpler and avoids SQL `CASE WHEN total = 0` complexity. Also allows consistent rounding (2 decimal places).

### 8. Soft-deleted categories still shown in analytics

**Decision:** JOINs to `transaction_categories` do NOT filter on `deletedAt`.

**Rationale:** Historical transactions reference categories that may have been soft-deleted since. Filtering them out would silently drop spending data from analytics results.

## Risks / Trade-offs

- **[Stale cache]** Analytics data may be up to 5-10 minutes stale depending on endpoint TTL. → Acceptable for dashboard use; TTLs are conservative. Invalidation on writes handles the most common staleness scenario.
- **[Query performance on large datasets]** Aggregation queries scan all matching transactions without pagination. → For the expected data volume (thousands of transactions per user), this is fine. If needed later, add DB indexes on `(userId, currencyCode, date)`.
- **[Cross-module cache invalidation coupling]** `TransactionsService` knows about the `analytics` cache prefix. → Minimal coupling (one string constant). If this grows, extract to a shared constants file or introduce events later.
