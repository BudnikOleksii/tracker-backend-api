## 1. Module Setup

- [x] 1.1 Create `src/modules/transactions/` directory structure with module, controller, service, repository, constants files and `dtos/` subdirectory
- [x] 1.2 Create `transactions.constants.ts` exporting `TRANSACTION_TYPES`, `CURRENCY_CODES` and their types from the database enums
- [x] 1.3 Create `transactions.module.ts` registering controller, service, and repository

## 2. DTOs

- [x] 2.1 Create `create-transaction.dto.ts` with fields: categoryId (UUID), type (EXPENSE/INCOME), amount (string), currencyCode, date (ISO string), description (optional string)
- [x] 2.2 Create `update-transaction.dto.ts` with all fields optional: categoryId, type, amount, currencyCode, date, description
- [x] 2.3 Create `transaction-query.dto.ts` extending `OffsetPaginationDto` with optional filters: type, categoryId, currencyCode, dateFrom, dateTo

## 3. Repository

- [x] 3.1 Define repository interfaces: `TransactionInfo`, `TransactionListQuery`, `TransactionListResult`, `CreateTransactionData`, `UpdateTransactionData`
- [x] 3.2 Implement `findById(id, userId)` — returns single transaction excluding soft-deleted
- [x] 3.3 Implement `findAll(query)` — paginated list with filters (type, categoryId, currencyCode, dateFrom, dateTo), excluding soft-deleted
- [x] 3.4 Implement `create(data)` — insert and return the new transaction
- [x] 3.5 Implement `update(id, userId, data)` — partial update and return updated transaction
- [x] 3.6 Implement `softDelete(id, userId)` — set `deletedAt` timestamp
- [x] 3.7 Implement `findCategoryByIdAndUserId(categoryId, userId)` — validate category exists, belongs to user, and is not soft-deleted

## 4. Service

- [x] 4.1 Implement `findAll(query)` — delegates to repository
- [x] 4.2 Implement `findById(id, userId)` — returns transaction or throws NotFoundException
- [x] 4.3 Implement `create(data)` — validate category (exists, ownership, type match), then create transaction
- [x] 4.4 Implement `update(id, userId, data)` — validate transaction exists, validate category if changed, then update
- [x] 4.5 Implement `delete(id, userId)` — validate transaction exists, then soft-delete

## 5. Controller

- [x] 5.1 Implement `GET /transactions` — list with pagination and filters
- [x] 5.2 Implement `GET /transactions/:id` — get single transaction
- [x] 5.3 Implement `POST /transactions` — create transaction (HTTP 201)
- [x] 5.4 Implement `PATCH /transactions/:id` — update transaction
- [x] 5.5 Implement `DELETE /transactions/:id` — soft-delete transaction

## 6. Integration

- [x] 6.1 Register `TransactionsModule` in `app.module.ts`
- [x] 6.2 Run `pnpm check-types`, `pnpm lint:fix`, and `pnpm format` to verify everything compiles and passes
