## 1. Transaction Sorting

- [x] 1.1 Add `sortBy` (enum: `date`, `amount`, `createdAt`) and `sortOrder` (enum: `asc`, `desc`) fields to `TransactionQueryDto` with class-validator decorators and defaults (`date`, `desc`)
- [x] 1.2 Update `TransactionRepository.findAll` to use the `sortBy` and `sortOrder` params in the ORDER BY clause instead of the hardcoded `transactions.date` sort
- [x] 1.3 Add Swagger decorators to the new query params for OpenAPI documentation
- [x] 1.4 Verify sorting works with existing filters and pagination (run type checks, lint, format)

## 2. Transactions By Category - DTOs

- [x] 2.1 Create `TransactionsByCategoryResponseDto` with the grouped response shape: `{ groups: [{ subcategory: { id, name } | null, transactions: TransactionResponseDto[], totals: [{ currencyCode, total }] }] }`
- [x] 2.2 Add Swagger decorators to the new response DTO for OpenAPI documentation

## 3. Transactions By Category - Repository

- [x] 3.1 Add `findByParentCategory(categoryId, userId)` method to `TransactionRepository` that fetches all transactions for a parent category and its subcategories, joining with the categories table
- [x] 3.2 Add `findCategoryWithSubcategories(categoryId, userId)` method (or extend existing category query) to fetch a parent category with its subcategory IDs and names

## 4. Transactions By Category - Service

- [x] 4.1 Add `getTransactionsByCategory(categoryId, userId)` method to `TransactionsService` that validates the category (exists, belongs to user, not soft-deleted, is a parent category), fetches transactions, groups them by subcategory, and computes per-subcategory totals by currency
- [x] 4.2 Add caching for the new method using the existing cache pattern with appropriate key prefix

## 5. Transactions By Category - Controller

- [x] 5.1 Add `GET /transactions/by-category/:categoryId` endpoint to `TransactionsController` with JWT guard, param validation, and Swagger decorators
- [x] 5.2 Wire the endpoint to `TransactionsService.getTransactionsByCategory`

## 6. Validation & Cleanup

- [x] 6.1 Run `pnpm check-types`, `pnpm lint:fix`, and `pnpm format` to ensure all checks pass
- [x] 6.2 Verify cache invalidation on create/update/delete extends to the new by-category cache keys
