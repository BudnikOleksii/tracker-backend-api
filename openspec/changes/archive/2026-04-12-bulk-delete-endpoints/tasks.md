## 1. Shared DTOs

- [x] 1.1 Create `BulkDeleteDto` in `src/shared/dtos/` with `ids: string[]` validated as UUID v4 array, `@ArrayMinSize(1)`, `@ArrayMaxSize(100)`, `@ArrayUnique()`
- [x] 1.2 Create `BulkDeleteResponseDto` in `src/shared/dtos/` with `deleted: number`, `failed: { id: string; reason: string }[]`, and `message: string` fields, including Swagger decorators

## 2. Transactions bulk delete

- [x] 2.1 Add `bulkDelete(ids: string[], userId: string)` method to `transactions.repository.ts` — fetch matching records by IDs + userId, hard delete the found set in a DB transaction, return the list of deleted IDs
- [x] 2.2 Add `bulkDelete(ids: string[], userId: string)` method to `transactions.service.ts` — call repository, compute not-found failures, emit `TransactionMutationEvent`, invalidate cache, return `{ deleted, failed, message }`
- [x] 2.3 Add `DELETE /transactions/batch` endpoint to `transactions.controller.ts` using `BulkDeleteDto` and `BulkDeleteResponseDto`, with Swagger decorators

## 3. Budgets bulk delete

- [x] 3.1 Add `bulkDelete(ids: string[], userId: string)` method to `budgets.repository.ts` — fetch matching records by IDs + userId, hard delete the found set in a DB transaction, return the list of deleted IDs
- [x] 3.2 Add `bulkDelete(ids: string[], userId: string)` method to `budgets.service.ts` — call repository, compute not-found failures, invalidate cache, return `{ deleted, failed, message }`
- [x] 3.3 Add `DELETE /budgets/batch` endpoint to `budgets.controller.ts` using shared DTOs with Swagger decorators

## 4. Transaction categories bulk delete

- [x] 4.1 Add `bulkSoftDelete(ids: string[], userId: string)` method to `transaction-categories.repository.ts` — fetch matching records by IDs + userId, batch-check for active transactions and active children across all candidates in single queries, soft-delete the valid set, return deleted IDs and per-ID failure reasons
- [x] 4.2 Add `bulkDelete(ids: string[], userId: string)` method to `transaction-categories.service.ts` — call repository, invalidate cache, return `{ deleted, failed, message }`
- [x] 4.3 Add `DELETE /transaction-categories/batch` endpoint to `transaction-categories.controller.ts` using shared DTOs with Swagger decorators

## 5. Recurring transactions bulk delete

- [x] 5.1 Add `bulkCancel(ids: string[], userId: string)` method to `recurring-transactions.repository.ts` — fetch matching non-CANCELLED records by IDs + userId, set status to CANCELLED, return cancelled IDs and per-ID failure reasons (not found, already cancelled)
- [x] 5.2 Add `bulkDelete(ids: string[], userId: string)` method to `recurring-transactions.service.ts` — call repository, invalidate cache, return `{ deleted, failed, message }`
- [x] 5.3 Add `DELETE /recurring-transactions/batch` endpoint to `recurring-transactions.controller.ts` using shared DTOs with Swagger decorators

## 6. Verification

- [x] 6.1 Run `pnpm check-types` to verify TypeScript compilation passes
- [x] 6.2 Run `pnpm lint:fix` and `pnpm format` to ensure code quality
