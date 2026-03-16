## Why

The frontend needs aggregate data to power dashboard charts and summaries (totals, category breakdowns, trends over time). Currently, only raw paginated transaction data is available — clients cannot get spending summaries without fetching and aggregating all records themselves.

## What Changes

- Add a new `analytics` NestJS module with 5 read-only aggregation endpoints under `/analytics`
- All endpoints require `currencyCode` (no cross-currency aggregation without exchange rates)
- All endpoints are protected by `JwtAuthGuard` and scoped to the authenticated user
- New endpoints:
  - `GET /analytics/summary` — total income, expenses, net balance for a date range
  - `GET /analytics/category-breakdown` — spending/income grouped by category (pie chart)
  - `GET /analytics/trends` — weekly or monthly totals over time (line chart)
  - `GET /analytics/top-categories` — top N categories by total amount
  - `GET /analytics/daily-spending` — daily totals for a given month (calendar view)
- Redis caching with 300s–600s TTLs per endpoint
- Analytics cache invalidation triggered on transaction create/update/delete

## Capabilities

### New Capabilities

- `analytics-aggregation`: Core analytics endpoints — summary, category breakdown, trends, top categories, daily spending. Covers query logic, response shapes, date defaults, edge cases (empty data, zero division), and caching strategy.

### Modified Capabilities

- `request-caching`: Analytics cache invalidation must be added to transaction write operations. The existing prefix-based deletion pattern extends to cover `analytics:{userId}:*` in addition to `transactions:{userId}:*`.

## Impact

- **New files**: `src/modules/analytics/` — module, controller, service, repository, DTOs
- **Modified files**:
  - `src/app.module.ts` — import AnalyticsModule
  - `src/modules/transactions/transactions.service.ts` — add analytics cache invalidation on writes
- **Database**: No schema changes — pure aggregation queries on existing `transactions` and `transaction_categories` tables
- **Dependencies**: No new packages
