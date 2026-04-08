## 1. Shared DTOs

- [x] 1.1 Create `ParentCategoryInfoDto` and `CategoryInfoDto` classes in `src/shared/dtos/category-info.dto.ts` with `@ApiProperty` decorators (id, name, parentCategory)

## 2. Transactions Module — Repository

- [x] 2.1 Add `CategoryDetail` interface to `TransactionInfo` (with `id`, `name`, `parentCategory: { id, name } | null`)
- [x] 2.2 Update `findAll` query to LEFT JOIN `transactionCategories` (aliased) and a second LEFT JOIN for parent category; map joined columns into `category` field
- [x] 2.3 Update `findById` query with the same LEFT JOIN logic
- [x] 2.4 Update `toTransactionInfo` mapper to accept and map the joined category columns

## 3. Transactions Module — DTO & Service

- [x] 3.1 Add `category: CategoryInfoDto` property to `TransactionResponseDto` with `@ApiProperty`
- [x] 3.2 Verify `TransactionsService.findAll` and `findById` pass through the enriched data (no service changes expected — repo returns it)

## 4. Recurring Transactions Module — Repository

- [x] 4.1 Add `CategoryDetail` interface to `RecurringTransactionInfo` (same shape as transactions)
- [x] 4.2 Update `findAll` query to LEFT JOIN `transactionCategories` and parent category
- [x] 4.3 Update `findById` query with the same LEFT JOIN logic
- [x] 4.4 Update `toRecurringTransactionInfo` mapper to accept and map the joined category columns

## 5. Recurring Transactions Module — DTO & Service

- [x] 5.1 Add `category: CategoryInfoDto` property to `RecurringTransactionResponseDto` with `@ApiProperty`
- [x] 5.2 Verify `RecurringTransactionsService.findAll` and `findById` pass through the enriched data

## 6. Verification

- [x] 6.1 Run `pnpm check-types` — all types pass
- [x] 6.2 Run `pnpm lint:fix` and `pnpm format`
- [x] 6.3 Run existing tests to confirm no regressions (N/A — no test files exist)
