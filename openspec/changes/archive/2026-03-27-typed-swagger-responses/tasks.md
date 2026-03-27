## 1. Shared DTOs

- [x] 1.1 Create `MessageResponseDto` in `src/shared/dtos/` with `message` field and `@ApiProperty`
- [x] 1.2 Verify existing `OffsetListResponseDto` in `src/shared/dtos/list-response.dto.ts` — no changes needed (concrete DTOs will inline the fields)

## 2. Auth Module Response DTOs

- [x] 2.1 Create `AuthUserDto` class with `@ApiProperty` on `id`, `email`, `role` fields
- [x] 2.2 Update `AuthResponseDto` to reference `AuthUserDto` via `@ApiProperty({ type: AuthUserDto })` on the `user` field

## 3. Transactions Module Response DTOs

- [x] 3.1 Create `TransactionResponseDto` in `src/modules/transactions/dtos/` matching `TransactionInfo` shape
- [x] 3.2 Create `TransactionListResponseDto` with paginated envelope fields and `data: TransactionResponseDto[]`
- [x] 3.3 Update `transactions.controller.ts` — add `type` to all `@ApiResponse` decorators (list, create, get, update, delete)

## 4. Transaction Categories Module Response DTOs

- [x] 4.1 Create `CategoryResponseDto` in `src/modules/transaction-categories/dtos/` matching `CategoryInfo` shape
- [x] 4.2 Create `CategoryListResponseDto` with paginated envelope fields and `data: CategoryResponseDto[]`
- [x] 4.3 Update `transaction-categories.controller.ts` — add `type` to all `@ApiResponse` decorators

## 5. Budgets Module Response DTOs

- [x] 5.1 Create `BudgetResponseDto` in `src/modules/budgets/dtos/` matching `BudgetInfo` shape
- [x] 5.2 Create `BudgetProgressResponseDto` with `budget: BudgetResponseDto`, `spentAmount`, `remainingAmount`, `percentUsed`
- [x] 5.3 Create `BudgetListResponseDto` with paginated envelope fields and `data: BudgetResponseDto[]`
- [x] 5.4 Update `budgets.controller.ts` — add `type` to all `@ApiResponse` decorators (list, create, get, update, delete, progress)

## 6. Recurring Transactions Module Response DTOs

- [x] 6.1 Create `RecurringTransactionResponseDto` in `src/modules/recurring-transactions/dtos/` matching `RecurringTransactionInfo` shape
- [x] 6.2 Create `RecurringTransactionListResponseDto` with paginated envelope fields and `data: RecurringTransactionResponseDto[]`
- [x] 6.3 Update `recurring-transactions.controller.ts` — add `type` to all `@ApiResponse` decorators (list, create, get, update, delete, pause, resume)

## 7. Transactions Analytics Module Response DTOs

- [x] 7.1 Create `SummaryResponseDto` with nested fields for analytics summary
- [x] 7.2 Create `CategoryBreakdownResponseDto` with `CategoryBreakdownItemDto` nested class
- [x] 7.3 Create `TrendsResponseDto` with `TrendPeriodDto` nested class
- [x] 7.4 Create `TopCategoriesResponseDto` with `TopCategoryItemDto` nested class
- [x] 7.5 Create `DailySpendingResponseDto` with `DailySpendingItemDto` nested class
- [x] 7.6 Update `transactions-analytics.controller.ts` — add `type` to all `@ApiResponse` decorators

## 8. User Module Response DTOs

- [x] 8.1 Create `UserResponseDto` in `src/modules/user/dtos/` matching `UserInfo` shape
- [x] 8.2 Create `UserListResponseDto` with paginated envelope fields and `data: UserResponseDto[]`
- [x] 8.3 Update `user.controller.ts` — add `type` to all `@ApiResponse` decorators (list, get, update-role, delete, summary)

## 9. Audit Log Module Response DTOs

- [x] 9.1 Create `AuditLogResponseDto` in `src/modules/audit-log/dtos/` matching `AuditLogRecord` shape
- [x] 9.2 Create `AuditLogListResponseDto` with paginated envelope fields and `data: AuditLogResponseDto[]`
- [x] 9.3 Update `audit-log.controller.ts` — add `type` to `@ApiResponse` decorator

## 10. Verification

- [x] 10.1 Run `pnpm check-types` to verify no type errors
- [x] 10.2 Run `pnpm lint:fix` and `pnpm format`
- [ ] 10.3 Start the app and verify the OpenAPI JSON at `/swagger-json` has response schemas on all endpoints
