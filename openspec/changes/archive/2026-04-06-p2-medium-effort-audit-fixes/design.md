## Context

The tracker backend is a NestJS financial application using Drizzle ORM with PostgreSQL. Four P2 medium-effort audit findings remain: synchronous CSV parsing blocks the event loop, `timestamp` columns cause timezone-boundary bugs, cookie-based auth lacks CSRF protection for cross-domain deployments, and `parseFloat()` on monetary values loses precision.

## Goals / Non-Goals

**Goals:**

- Eliminate event-loop blocking during CSV import by switching to async streaming parser
- Ensure date-range queries produce correct results across timezones by migrating to `timestamptz`
- Protect cookie-reading auth endpoints from CSRF when `SameSite=none`
- Guarantee no floating-point precision loss in financial calculations

**Non-Goals:**

- Changing CSV validation logic or import format
- Adding timezone-aware UI features (backend-only change)
- Protecting non-cookie endpoints with CSRF (JWT Bearer endpoints are immune)
- Rewriting SQL aggregation queries (only fixing JS-side numeric handling)

## Decisions

### 1. Async CSV: streaming `csv-parse` with pipeline

**Decision:** Use `csv-parse` async API with `stream.pipeline` to parse CSV records.

**Why not web streams:** Node.js `stream.pipeline` integrates naturally with the existing Buffer-based flow. The `csv-parse` package already exports an async iterator — we collect records into an array with backpressure handled automatically.

**Why not chunked processing:** The import already validates all rows before inserting. Streaming parse + collect is sufficient to unblock the event loop without restructuring the insert logic.

### 2. Timestamptz: in-place ALTER COLUMN migration

**Decision:** Generate a Drizzle migration that ALTERs 6 columns from `timestamp(3)` to `timestamptz(3)`. Existing data is interpreted as UTC (PostgreSQL default for typeless timestamps).

**Why not add new columns:** ALTER TYPE on timestamp→timestamptz is a metadata-only operation in PostgreSQL — no table rewrite, no downtime. Safe for production.

**Columns:** `transactions.date`, `budgets.startDate`, `budgets.endDate`, `recurring_transactions.startDate`, `recurring_transactions.endDate`, `recurring_transactions.nextOccurrenceDate`.

### 3. CSRF: double-submit cookie pattern with conditional enforcement

**Decision:** Generate a random CSRF token on login/register/refresh, set it as a non-httpOnly cookie (`csrf_token`). Require `x-csrf-token` header on cookie-reading endpoints. Enforce only when `COOKIE_SAME_SITE` is `none` — when `strict` or `lax`, SameSite already prevents CSRF.

**Why double-submit over synchronizer token:** Stateless — no server-side CSRF token storage needed. The refresh token is already rotated per use, so the CSRF token lifecycle matches naturally.

**Why conditional:** SameSite=strict/lax is sufficient CSRF protection. Adding mandatory CSRF tokens for same-site deployments adds friction with no security benefit.

### 4. Decimal arithmetic: `decimal.js` library

**Decision:** Use `decimal.js` for all monetary calculations in service/analytics layers. Convert `numeric` string values from Drizzle to `Decimal` instances, perform arithmetic, and convert back to string/number for responses.

**Why `decimal.js` over `big.js`:** `decimal.js` supports all operations needed (add, subtract, multiply, divide, comparison, rounding) with a cleaner API. Well-maintained, ~32KB minified.

**Why not `pg-numeric`:** Drizzle already returns `numeric` columns as strings. The fix is in the JS arithmetic layer, not the ORM layer.

## Risks / Trade-offs

- **[Timestamptz migration on large tables]** → ALTER TYPE timestamp→timestamptz is metadata-only in PostgreSQL, no table rewrite. Low risk.
- **[CSRF token adds a cookie]** → One additional non-httpOnly cookie. Acceptable trade-off for CSRF protection. Only set when SameSite=none.
- **[Decimal.js bundle size]** → ~32KB. Negligible for a backend service.
- **[Async CSV changes error path]** → Parse errors now surface as stream errors. Must catch and convert to BadRequestException consistently.
- **[Breaking change for cross-domain clients]** → Clients using `SameSite=none` must now send `x-csrf-token` header. Document in API changelog.

## Migration Plan

1. Install `decimal.js` dependency
2. Apply decimal arithmetic changes (no schema change)
3. Apply async CSV parsing changes (no schema change)
4. Add CSRF guard and middleware
5. Run `pnpm db:generate` for timestamptz schema changes, then `pnpm db:migrate`
6. **Rollback:** Revert migration with inverse ALTER TYPE `timestamptz→timestamp`. CSRF and decimal changes are purely code — revert via git.
