## Why

The comprehensive audit identified 6 small-effort P2 improvements covering code duplication, dead code, security exposure, validation inconsistency, and missing database constraints. These are low-risk, high-value cleanups that harden the codebase and improve maintainability before larger changes.

## What Changes

- **Extract pagination helper** — Replace identical pagination envelope logic duplicated across 7 controllers with a shared `buildPaginatedResponse()` utility
- **Remove no-op TransformInterceptor** — Delete the `TransformInterceptor` (returns data unchanged in both branches) and the `@UseEnvelope()` decorator, plus all 7 usages and the global registration in `main.ts`
- **Disable Swagger/Scalar in production** — Gate `setupSwagger()` behind `NODE_ENV !== 'production'` so `/swagger`, `/docs`, and `/openapi.yaml` are not exposed in production
- **Standardize validator decorators** — Replace raw `class-validator` decorators in 6 DTOs (`RevokeRefreshTokenDto`, `UserQueryDto`, `AnalyticsQueryDto`, `DailySpendingQueryDto`, `TopCategoriesQueryDto`, `TrendsQueryDto`) with project-standard `*Field()` wrappers that carry `ErrorCode` context
- **Add database CHECK constraints** — Add `CHECK (amount > 0)` on `Transaction` and `CHECK ("endDate" > "startDate")` on `Budget` to prevent invalid data at the DB level
- **Fix NULLS NOT DISTINCT on unique indexes** — Apply `NULLS NOT DISTINCT` to the unique indexes on `TransactionCategory(userId, name, type, parentCategoryId)` and `DefaultTransactionCategory(name, type, parentDefaultTransactionCategoryId)` to prevent duplicate root categories

## Capabilities

### New Capabilities

- `pagination-helper`: Shared utility function for building paginated response envelopes from query params and repository results

### Modified Capabilities

- `paginated-response-dtos`: Controllers switch from inline pagination logic to the new helper
- `swagger-response-coverage`: Swagger setup becomes environment-conditional
- `transaction-categories-crud`: Unique index gains NULLS NOT DISTINCT constraint
- `default-categories-admin`: Unique index gains NULLS NOT DISTINCT constraint
- `transactions-crud`: Transaction schema adds CHECK constraint on amount
- `budget-tracking`: Budget schema adds CHECK constraint on date range

## Impact

- **Files modified:** ~20 files across controllers, DTOs, schemas, interceptors, decorators, and `main.ts`
- **Database:** 2 new CHECK constraints + 2 altered unique indexes → requires `pnpm db:generate` and `pnpm db:migrate`
- **Breaking changes:** None — all changes are internal improvements with no API contract changes
- **Dependencies:** No new packages required
