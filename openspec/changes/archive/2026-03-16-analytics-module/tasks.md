## 1. Module Scaffolding

- [x] 1.1 Create `src/modules/analytics/` directory with `analytics.module.ts`, `analytics.controller.ts`, `analytics.service.ts`, `analytics.repository.ts`
- [x] 1.2 Create DTO files: `dtos/analytics-query.dto.ts` (base), `dtos/trends-query.dto.ts`, `dtos/top-categories-query.dto.ts`, `dtos/daily-spending-query.dto.ts`
- [x] 1.3 Register `AnalyticsModule` in `src/app.module.ts`

## 2. DTOs & Validation

- [x] 2.1 Implement `AnalyticsQueryDto` — currencyCode (required), dateFrom (optional), dateTo (optional), type (optional EXPENSE/INCOME), categoryId (optional UUID)
- [x] 2.2 Implement `TrendsQueryDto` — extends base + granularity (required: weekly/monthly)
- [x] 2.3 Implement `TopCategoriesQueryDto` — extends base + limit (optional, default 5, max 20)
- [x] 2.4 Implement `DailySpendingQueryDto` — year (required), month (required, 1-12), currencyCode (required), type (optional)

## 3. Repository Layer

- [x] 3.1 Implement `buildBaseConditions()` private method — shared WHERE clause from userId, currencyCode, dateFrom, dateTo, type, categoryId
- [x] 3.2 Implement `getSummary()` — SUM with CASE for income/expenses/net, COUNT for transactionCount
- [x] 3.3 Implement `getCategoryBreakdown()` — GROUP BY categoryId with JOIN to transactionCategories (no deletedAt filter), ORDER BY total DESC
- [x] 3.4 Implement `getTrends()` — date_trunc grouping with CASE sums, ordered by period
- [x] 3.5 Implement `getTopCategories()` — same as category breakdown with LIMIT
- [x] 3.6 Implement `getDailyTotals()` — GROUP BY date::date, return raw day totals (service fills gaps)

## 4. Service Layer

- [x] 4.1 Implement `getSummary()` — set date defaults (start of month / now), call repository, wrap with caching (TTL 300s)
- [x] 4.2 Implement `getCategoryBreakdown()` — set date defaults, call repository, compute percentages (handle zero total), wrap with caching (TTL 300s)
- [x] 4.3 Implement `getTrends()` — set date defaults, call repository, compute periodEnd from granularity, wrap with caching (TTL 600s)
- [x] 4.4 Implement `getTopCategories()` — set date defaults, call repository, compute percentages and ranks, wrap with caching (TTL 300s)
- [x] 4.5 Implement `getDailySpending()` — compute all days of month, call repository, fill missing days with zeros, wrap with caching (TTL 300s)

## 5. Controller Layer

- [x] 5.1 Implement `GET /analytics/summary` — JwtAuthGuard, extract userId from request, validate query with AnalyticsQueryDto
- [x] 5.2 Implement `GET /analytics/category-breakdown` — same guard, AnalyticsQueryDto
- [x] 5.3 Implement `GET /analytics/trends` — same guard, TrendsQueryDto
- [x] 5.4 Implement `GET /analytics/top-categories` — same guard, TopCategoriesQueryDto
- [x] 5.5 Implement `GET /analytics/daily-spending` — same guard, DailySpendingQueryDto

## 6. Cache Invalidation

- [x] 6.1 Add `await this.cacheService.delByPrefix(buildCachePrefix('analytics', userId))` to `TransactionsService.create()`, `.update()`, and `.delete()`

## 7. Verification

- [x] 7.1 Run `pnpm check-types` — ensure no TypeScript errors
- [x] 7.2 Run `pnpm lint:fix` and `pnpm format` — ensure code style compliance
