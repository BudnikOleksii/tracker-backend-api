# Feature Plan: Dashboard / Analytics

## Overview

Aggregate endpoints that power charts and summaries on the frontend. No new database tables needed — pure aggregation queries on existing transaction data.

---

## API Endpoints

All under `/transactions-analytics`, protected by `JwtAuthGuard`. `currencyCode` is **required** on all endpoints (can't sum across currencies without exchange rates).

### GET `/transactions-analytics/summary`

Total income, total expenses, net balance for a date range.

Query params: `currencyCode` (required), `dateFrom` (optional, defaults to start of current month), `dateTo` (optional, defaults to now), `categoryId` (optional)

```json
{
  "totalIncome": "5200.00",
  "totalExpenses": "3150.75",
  "netBalance": "2049.25",
  "transactionCount": 42,
  "currencyCode": "USD",
  "dateFrom": "2026-03-01T00:00:00.000Z",
  "dateTo": "2026-03-15T23:59:59.999Z"
}
```

### GET `/transactions-analytics/category-breakdown`

Spending/income grouped by category (pie chart data).

Additional query: `type` (optional — EXPENSE or INCOME)

```json
{
  "currencyCode": "USD",
  "dateFrom": "...",
  "dateTo": "...",
  "breakdown": [
    {
      "categoryId": "uuid",
      "categoryName": "Groceries",
      "type": "EXPENSE",
      "total": "850.00",
      "percentage": 26.98,
      "transactionCount": 12
    }
  ]
}
```

### GET `/transactions-analytics/trends`

Monthly or weekly totals over time (line chart data).

Additional query: `granularity` (required — `weekly` or `monthly`)

```json
{
  "currencyCode": "USD",
  "granularity": "monthly",
  "periods": [
    {
      "periodStart": "2026-01-01",
      "periodEnd": "2026-01-31",
      "totalIncome": "5000.00",
      "totalExpenses": "3200.00",
      "netBalance": "1800.00",
      "transactionCount": 38
    }
  ]
}
```

### GET `/transactions-analytics/top-categories`

Top N spending/income categories for a period.

Additional query: `limit` (optional, default 5, max 20), `type` (optional, default EXPENSE)

```json
{
  "currencyCode": "USD",
  "categories": [
    {
      "rank": 1,
      "categoryId": "uuid",
      "categoryName": "Rent",
      "total": "1500.00",
      "percentage": 47.62,
      "transactionCount": 1
    }
  ]
}
```

### GET `/transactions-analytics/daily-spending`

Daily totals for a given month (calendar view).

Query params: `year` (required), `month` (required, 1-12), `currencyCode` (required), `type` (optional)

Response fills **all days** of the month (including zeros):

```json
{
  "currencyCode": "USD",
  "year": 2026,
  "month": 3,
  "days": [
    { "date": "2026-03-01", "total": "45.50", "transactionCount": 3 },
    { "date": "2026-03-02", "total": "0.00", "transactionCount": 0 }
  ]
}
```

---

## Key Design Decisions

1. **currencyCode required** — no exchange rate data, can't mix currencies
2. **Date defaults** — current calendar month when dateFrom/dateTo omitted (set in service, not DTO)
3. **Soft-deleted categories still shown** — historical data must be preserved; JOIN should NOT filter on deletedAt
4. **All amounts as strings** — preserves numeric(19,2) precision, matches existing convention
5. **Percentages in service layer** — simpler than SQL, small result sets
6. **Weekly granularity** — PostgreSQL `date_trunc('week')` starts on Monday (ISO 8601)

---

## Repository Query Patterns

### Shared `buildBaseConditions()` method

Constructs `SQL[]` filter array from userId, currencyCode, dateFrom, dateTo, type, categoryId.

### Summary

```sql
SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as totalIncome
SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as totalExpenses
SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as netBalance
```

### Category Breakdown

GROUP BY categoryId with INNER JOIN to transactionCategories for name. ORDER BY SUM DESC.

### Trends

`date_trunc('month'|'week', date)` grouping with CASE sums. Service computes periodEnd.

### Top Categories

Same as category breakdown with LIMIT.

### Daily Spending

GROUP BY `date::date`. Service fills missing days with zeros.

---

## Caching Strategy

| Endpoint           | TTL           | Reasoning                      |
| ------------------ | ------------- | ------------------------------ |
| Summary            | 300s (5 min)  | Moderate staleness acceptable  |
| Category breakdown | 300s          | Same                           |
| Trends             | 600s (10 min) | Historical months don't change |
| Top categories     | 300s          | Same as summary                |
| Daily spending     | 300s          | Same as summary                |

**Invalidation:** Add `transactions-analytics` prefix invalidation in `TransactionsService.create/update/delete`:

```ts
await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', userId));
```

---

## Edge Cases

- **Empty data** — returns zeros via COALESCE, not nulls or errors
- **No transactions in currency** — all totals "0.00", transactionCount 0
- **Zero grand total** — all percentages 0 (avoid division by zero)
- **Numeric precision** — all values returned as strings

---

## Module Structure

```text
src/modules/transactions-analytics/
  transactions-analytics.module.ts
  transactions-analytics.controller.ts
  transactions-analytics.service.ts
  transactions-analytics.repository.ts
  dtos/
    analytics-query.dto.ts        # Base: currencyCode (required), dateFrom, dateTo, type, categoryId
    trends-query.dto.ts           # Extends base + granularity (required)
    top-categories-query.dto.ts   # Extends base + limit
    daily-spending-query.dto.ts   # year, month, currencyCode (required), type
```

## Files to Modify

- `src/app.module.ts` — import TransactionsAnalyticsModule
- `src/modules/transactions/transactions.service.ts` — add transactions-analytics cache invalidation
