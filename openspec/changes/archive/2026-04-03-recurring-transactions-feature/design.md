## Context

The tracker backend currently supports one-off transaction CRUD and analytics. Users must manually create each transaction, even for predictable repeating expenses/income (rent, salary, subscriptions). The existing transactions module, Drizzle schema, and caching infrastructure provide a solid foundation to extend.

## Goals / Non-Goals

**Goals:**

- Allow users to define recurring transaction templates with flexible scheduling (daily, weekly, monthly, yearly at configurable intervals)
- Provide full CRUD for recurring transactions following existing module patterns
- Enable pausing and resuming recurring transactions
- Materialize due recurring transactions into actual transactions via a processing endpoint
- Link materialized transactions back to their source recurring transaction

**Non-Goals:**

- Sub-daily frequencies (hourly, etc.)
- Notifications or reminders about upcoming recurring transactions
- Bulk operations on recurring transactions
- Horizontal-scaling-safe scheduling (see `docs/plans/recurring-transactions-scaling.md` for migration path)

## Decisions

### 1. Recurrence model: next-occurrence tracking

Store `nextOccurrenceDate` on each recurring transaction. When processing fires, find all active records where `nextOccurrenceDate <= today`, materialize a transaction for each, and advance `nextOccurrenceDate` based on frequency/interval.

**Alternatives considered:**

- _RRule/iCal string storage_: More flexible but adds parsing complexity and an external dependency. Our frequencies (daily/weekly/monthly/yearly) don't need it.
- _Compute next date on read_: Requires scanning all history to determine current state. Storing it is simpler and queryable.

### 2. Frequency as enum + interval integer

Define a `recurringFrequencyEnum` with values `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`. Pair with an `interval` integer (default 1). "Every 2 weeks" = frequency WEEKLY, interval 2.

**Alternatives considered:**

- _Cron expression_: Overpowered for our use case, harder for clients to build UIs around.
- _Single enum with all combos (BI_WEEKLY, etc.)_: Inflexible and combinatorial.

### 3. Status enum for lifecycle management

A `recurringTransactionStatusEnum` with values `ACTIVE`, `PAUSED`, `CANCELLED`. Only `ACTIVE` records are processed. `PAUSED` can be resumed. `CANCELLED` is terminal (soft-stop, row persists).

### 4. Processing via in-app cron (@nestjs/schedule)

A `@Cron` task in `ScheduledTasksService` runs daily at midnight and processes all users' due recurring transactions. This is simple, requires no external infrastructure, and works well for single-instance deployments (e.g., Railway).

The processing method is also exposed as `POST /recurring-transactions/process` for manual triggering and testing.

**Alternatives considered:**

- _External scheduler only_: Requires additional infrastructure and a service account/API key. Overkill for single-instance deployment.
- _Database trigger_: Hidden side effects, harder to debug and test.

**Scaling note:** If the app scales to multiple instances, the in-app cron will fire on each instance causing duplicates. See `docs/plans/recurring-transactions-scaling.md` for the migration path to distributed-safe processing.

### 5. Link materialized transactions via nullable foreign key

Add an optional `recurringTransactionId` column to the `transactions` table. This enables querying which transactions came from a recurring source without breaking existing transaction creation flows.

### 6. New module following existing patterns

Create `src/modules/recurring-transactions/` with controller, service, repository, DTOs, and constants — mirroring the transactions module structure. Reuse shared decorators, pagination DTOs, and error codes.

## Risks / Trade-offs

- **[Risk] Processing gaps if endpoint isn't called** → Mitigation: When processing runs, generate all missed occurrences up to today (loop advancing nextOccurrenceDate until it's in the future). This handles weekends/holidays where the scheduler might miss a day.
- **[Risk] Large batch materialization** → Mitigation: Process within a database transaction per recurring record. If one fails, others still succeed. Log failures.
- **[Risk] End date edge cases** → Mitigation: Stop generating when `nextOccurrenceDate > endDate`. Set status to `CANCELLED` automatically when end date is passed.
- **[Trade-off] Single-instance cron** → Simple but not safe for horizontal scaling. Acceptable for current Railway deployment; migration plan documented separately.
- **[Risk] App downtime misses cron window** → Mitigation: Processing catches up all missed occurrences, so a missed cron run is self-healing on the next run.
