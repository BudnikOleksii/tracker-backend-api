## Why

Users need a way to set spending limits and track their spending against those limits. Without budgets, the tracker only records transactions retroactively — there's no forward-looking financial planning. Budgets let users define how much they intend to spend per category (or overall) within a time period and see how they're tracking against that goal.

## What Changes

- Add a new `budgets` database table storing budget definitions (amount, currency, category, period, start/end dates)
- Add a new `budgets` NestJS module with full CRUD endpoints
- Add budget progress/tracking endpoint that calculates spent vs. budgeted amounts by aggregating transactions
- Add a periodic check (cron) to detect budgets that have exceeded their threshold and mark them accordingly
- Support recurring budget periods: monthly, weekly, quarterly, yearly, and custom date ranges

## Capabilities

### New Capabilities

- `budgets-crud`: CRUD operations for creating, reading, updating, and deleting budget definitions
- `budget-tracking`: Progress tracking that aggregates transaction spending against budget limits, including overspend detection

### Modified Capabilities

<!-- No existing spec-level requirement changes needed -->

## Impact

- **Database**: New `budgets` table with FK to `users` and optionally to `transaction_categories`; new `BudgetPeriod` and `BudgetStatus` enums
- **API**: New `/api/budgets` endpoints (GET list, GET by id, POST, PATCH, DELETE) and `/api/budgets/:id/progress` for tracking
- **Modules**: New `budgets` module registered in `AppModule`; depends on `CacheModule` and reads from `transactions` table for progress aggregation
- **Cron**: New scheduled task for overspend detection (reuses `ScheduledTasksModule` pattern)
