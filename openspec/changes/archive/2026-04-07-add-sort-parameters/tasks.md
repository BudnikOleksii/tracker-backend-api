## 1. Shared Sort Infrastructure

- [x] 1.1 Create `src/shared/constants/sort.constants.ts` with `SORT_ORDERS` array and `SortOrder` type
- [x] 1.2 Refactor `src/modules/transactions/transactions.constants.ts` to import `SortOrder` and `SORT_ORDERS` from shared, remove local definitions (keep `SORT_BY_FIELDS` and `SortByField` local)
- [x] 1.3 Update `TransactionQueryDto` to import `SortOrder` from shared constants

## 2. Budgets Sort Support

- [x] 2.1 Add `SORT_BY_FIELDS`, `SortByField`, and `SORT_COLUMN_MAP` to `src/modules/budgets/budgets.constants.ts` (fields: `amount`, `startDate`, `endDate`, `createdAt`)
- [x] 2.2 Add `sortBy` and `sortOrder` fields to `BudgetQueryDto`
- [x] 2.3 Update `budgets.repository.ts` `findAll` to accept sort params and apply dynamic ORDER BY via `SORT_COLUMN_MAP` (default: `createdAt` desc)
- [x] 2.4 Pass sort params from `BudgetsController.findAll` through service to repository

## 3. Transaction Categories Sort Support

- [x] 3.1 Add `SORT_BY_FIELDS`, `SortByField`, and `SORT_COLUMN_MAP` to `src/modules/transaction-categories/transaction-categories.constants.ts` (fields: `name`, `createdAt`)
- [x] 3.2 Add `sortBy` and `sortOrder` fields to `CategoryQueryDto`
- [x] 3.3 Update `transaction-categories.repository.ts` `findAll` to accept sort params and apply dynamic ORDER BY (default: `name` asc)
- [x] 3.4 Pass sort params from `TransactionCategoriesController.findAll` through service to repository

## 4. Default Transaction Categories Sort Support

- [x] 4.1 Add `SORT_BY_FIELDS`, `SortByField`, and `SORT_COLUMN_MAP` to `src/modules/default-transaction-categories/default-transaction-categories.constants.ts` (fields: `name`, `createdAt`)
- [x] 4.2 Add `sortBy` and `sortOrder` fields to `DefaultTransactionCategoryQueryDto`
- [x] 4.3 Update `default-transaction-categories.repository.ts` `findAll` to accept sort params and apply dynamic ORDER BY (default: `name` asc)
- [x] 4.4 Pass sort params from `DefaultTransactionCategoriesController.findAll` through service to repository

## 5. Recurring Transactions Sort Support

- [x] 5.1 Add `SORT_BY_FIELDS`, `SortByField`, and `SORT_COLUMN_MAP` to `src/modules/recurring-transactions/recurring-transactions.constants.ts` (fields: `amount`, `startDate`, `nextOccurrenceDate`, `createdAt`)
- [x] 5.2 Add `sortBy` and `sortOrder` fields to `RecurringTransactionQueryDto`
- [x] 5.3 Update `recurring-transactions.repository.ts` `findAll` to accept sort params and apply dynamic ORDER BY (default: `createdAt` desc)
- [x] 5.4 Pass sort params from `RecurringTransactionsController.findAll` through service to repository

## 6. User & Audit Log Sort Support

- [x] 6.1 Add `SORT_BY_FIELDS`, `SortByField`, and `SORT_COLUMN_MAP` to `src/modules/user/user.constants.ts` (fields: `email`, `createdAt`)
- [x] 6.2 Add `sortBy` and `sortOrder` fields to `UserQueryDto`
- [x] 6.3 Update `user.repository.ts` `findAll` to accept sort params and apply dynamic ORDER BY (default: `createdAt` desc)
- [x] 6.4 Pass sort params from `UserController.findAll` through service to repository
- [x] 6.5 Add `SORT_BY_FIELDS`, `SortByField`, and `SORT_COLUMN_MAP` to `src/modules/audit-logs/audit-logs.constants.ts` (fields: `createdAt`)
- [x] 6.6 Add `sortBy` and `sortOrder` fields to `AuditLogQueryDto`
- [x] 6.7 Update `audit-logs.repository.ts` `findAll` to accept sort params and apply dynamic ORDER BY (default: `createdAt` desc)
- [x] 6.8 Pass sort params from `AuditLogController.findAll` through service to repository

## 7. Verification

- [x] 7.1 Run `pnpm check-types` — all type checks pass
- [x] 7.2 Run `pnpm lint:fix` and `pnpm format` — no lint/format issues
