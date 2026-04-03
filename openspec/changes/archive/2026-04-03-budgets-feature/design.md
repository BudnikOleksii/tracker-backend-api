## Context

The tracker application currently supports recording transactions and viewing analytics, but lacks forward-looking financial planning. Users can see what they've spent but cannot set spending targets. The existing architecture provides a clear module pattern (controller → service → repository), Redis caching, and transaction-safe writes that the budgets feature will follow.

The transactions table already tracks amounts, categories, currencies, and dates — all the data needed to compute budget progress without any schema changes to existing tables.

## Goals / Non-Goals

**Goals:**

- Allow users to create budgets with spending limits tied to a category, currency, and time period
- Provide real-time progress tracking showing spent vs. budgeted amounts
- Detect and flag overspent budgets via a periodic cron job
- Follow existing architecture patterns (layered modules, cache-aside, transactional writes)

**Non-Goals:**

- Notifications or alerts (email, push) — out of scope for this change
- Multi-currency budget rollups (each budget tracks a single currency)
- Budget templates or auto-creation of budgets for new periods
- Budget sharing between users
- Historical budget snapshots or archiving past periods

## Decisions

### 1. Budget period model: enum-based periods with explicit date range

Budgets store a `period` enum (WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM) plus `startDate` and `endDate`. For standard periods, the service computes the current period window from `startDate` and `period`. For CUSTOM, the user-provided `endDate` is used directly.

**Why over rolling windows**: Explicit periods align with how people think about budgets ("my March grocery budget") and simplify aggregation queries. Rolling windows would require continuous recomputation and make progress harder to reason about.

### 2. Progress computed on-read, not materialized

Budget progress (amount spent) is calculated by aggregating transactions at query time rather than maintaining a running total. The result is cached in Redis.

**Why over materialized counters**: Avoids dual-write complexity and keeps transactions as the single source of truth. The aggregation query is simple (SUM with WHERE on userId, categoryId, currencyCode, date range) and the transactions table is already indexed on these columns. Cache-aside pattern keeps reads fast.

### 3. Overspend detection via cron, status on budget row

A scheduled task periodically scans active budgets, computes progress, and sets `status` to `EXCEEDED` when spending surpasses the budget amount. The budget row carries a `status` enum (ACTIVE, EXCEEDED).

**Why over trigger-based**: A cron job is simpler, observable, and consistent with the existing `ScheduledTasksModule` pattern. Transaction-time triggers would add coupling between the transactions and budgets modules.

### 4. One budget per category+currency+overlapping period per user

A unique constraint prevents users from creating duplicate budgets for the same category, currency, and overlapping date range. This is enforced at the service layer (not DB constraint) because overlap detection requires date range comparison.

**Why service-layer enforcement**: PostgreSQL exclusion constraints on date ranges require the `btree_gist` extension. Service-layer validation is simpler and keeps the DB dependency minimal. The validate-then-write runs inside a transaction to prevent races.

### 5. Category-optional budgets

The `categoryId` field is nullable. A budget with no category represents a total spending budget across all categories for that currency and period.

## Risks / Trade-offs

- **[Aggregation performance at scale]** → The progress query scans transactions within a date range. Mitigated by existing indexes on `(userId, date)` and `(userId, categoryId)`, plus Redis caching. If performance degrades, a materialized view can be added later.
- **[Cron lag for overspend detection]** → Overspend status may lag behind real-time by up to one cron interval. Acceptable for MVP; real-time detection can be added later via event-driven approach.
- **[Overlap validation race condition]** → Two concurrent requests could both pass overlap validation. Mitigated by running validation inside a DB transaction with row-level checks, consistent with existing patterns.
