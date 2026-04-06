## 1. Extract Pagination Helper

- [x] 1.1 Create `src/shared/utils/pagination.utils.ts` with `buildPaginatedResponse(query, result)` function that computes `page`, `pageSize`, `totalPages`, `hasMore` and returns the standard list envelope
- [x] 1.2 Replace inline pagination logic in all 7 controllers with `buildPaginatedResponse()` call: `audit-log.controller.ts`, `user.controller.ts`, `transactions.controller.ts`, `budgets.controller.ts`, `transaction-categories.controller.ts`, `recurring-transactions.controller.ts`, `default-transaction-categories.controller.ts`

## 2. Remove TransformInterceptor and UseEnvelope

- [x] 2.1 Remove `@UseEnvelope()` decorator usage from all 7 controllers
- [x] 2.2 Remove global `TransformInterceptor` registration from `src/main.ts`
- [x] 2.3 Delete `src/app/interceptors/transform.interceptor.ts` and `src/shared/decorators/use-envelope.decorator.ts`

## 3. Disable Swagger in Production

- [x] 3.1 Wrap `setupSwagger(app)` call in `src/main.ts` with `if (env.NODE_ENV !== 'production')` guard

## 4. Standardize Validator Decorators

- [x] 4.1 Update `src/modules/auth/dtos/revoke-refresh-token.dto.ts`: replace `@IsUUID()` with `@IsUUIDField()`, `@IsNotEmpty()` with `@IsNotEmptyField()`
- [x] 4.2 Update `src/modules/user/dtos/user-query.dto.ts`: replace `@IsString()` with `@IsStringField()`, `@IsIn()` with `@IsInField()`
- [x] 4.3 Update `src/modules/transactions-analytics/dtos/analytics-query.dto.ts`: replace `@IsIn()` with `@IsInField()`
- [x] 4.4 Update `src/modules/transactions-analytics/dtos/daily-spending-query.dto.ts`: replace `@IsInt()` with `@IsIntField()`, `@Min()` with `@MinField()`, `@Max()` with `@MaxField()`, `@IsIn()` with `@IsInField()`
- [x] 4.5 Update `src/modules/transactions-analytics/dtos/top-categories-query.dto.ts`: replace `@IsInt()` with `@IsIntField()`, `@Min()` with `@MinField()`, `@Max()` with `@MaxField()`
- [x] 4.6 Update `src/modules/transactions-analytics/dtos/trends-query.dto.ts`: replace `@IsIn()` with `@IsInField()`

## 5. Add Database CHECK Constraints

- [x] 5.1 Add `CHECK (amount > 0)` to Transaction table in `src/database/schemas/transactions.ts` using Drizzle `.check()` method
- [x] 5.2 Add `CHECK ("endDate" > "startDate")` to Budget table in `src/database/schemas/budgets.ts` using Drizzle `.check()` method

## 6. Fix NULLS NOT DISTINCT on Unique Indexes

- [x] 6.1 Update unique index in `src/database/schemas/transaction-categories.ts` to use `NULLS NOT DISTINCT`
- [x] 6.2 Update unique index in `src/database/schemas/default-transaction-categories.ts` to use `NULLS NOT DISTINCT`

## 7. Finalize

- [x] 7.1 Run `pnpm db:generate` to generate migration for schema changes (tasks 5 + 6)
- [x] 7.2 Run `pnpm check-types && pnpm lint:fix && pnpm format` to verify everything passes
