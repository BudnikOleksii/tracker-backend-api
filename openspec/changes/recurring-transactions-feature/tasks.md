## 1. Database Schema

- [x] 1.1 Add `recurringFrequencyEnum` and `recurringTransactionStatusEnum` to `src/database/schemas/enums.ts`
- [x] 1.2 Create `src/database/schemas/recurring-transactions.ts` with the `recurring_transactions` table (id, userId, categoryId, type, amount, currencyCode, description, frequency, interval, startDate, endDate, nextOccurrenceDate, status, createdAt, updatedAt) and relations
- [x] 1.3 Add nullable `recurringTransactionId` foreign key column to the `transactions` table schema and update its relations
- [x] 1.4 Export new schema from `src/database/schemas/index.ts`
- [x] 1.5 Run `pnpm db:generate` and `pnpm db:migrate` to apply schema changes

## 2. Recurring Transactions Module Setup

- [x] 2.1 Create module directory `src/modules/recurring-transactions/` with `recurring-transactions.module.ts`
- [x] 2.2 Create `recurring-transactions.constants.ts` with cache key module name
- [x] 2.3 Register the module in the app module

## 3. DTOs

- [x] 3.1 Create `CreateRecurringTransactionDto` with validation decorators (categoryId, type, amount, currencyCode, description, frequency, interval, startDate, endDate)
- [x] 3.2 Create `UpdateRecurringTransactionDto` with all fields optional
- [x] 3.3 Create `RecurringTransactionQueryDto` extending OffsetPaginationDto with filters (status, type, categoryId, currencyCode, frequency)
- [x] 3.4 Create response DTO / entity info type for recurring transaction responses

## 4. Repository

- [x] 4.1 Create `recurring-transactions.repository.ts` with findAll, findById, create, update methods
- [x] 4.2 Add `findDueRecurringTransactions` method to query ACTIVE records where nextOccurrenceDate <= today for a given user
- [x] 4.3 Add transaction support (optional `tx` parameter on all query methods)

## 5. Service — CRUD

- [x] 5.1 Create `recurring-transactions.service.ts` with findAll (cached), findById (cached), create, update, delete methods
- [x] 5.2 Implement category validation (exists, belongs to user, not soft-deleted, type matches) — reuse pattern from transactions service
- [x] 5.3 Implement pause and resume methods with status validation
- [x] 5.4 Implement endDate >= startDate validation on create and update
- [x] 5.5 Recalculate nextOccurrenceDate when frequency, interval, or startDate changes on update

## 6. Service — Processing

- [x] 6.1 Implement `processRecurringTransactions` method that finds all due active recurring transactions for the user
- [x] 6.2 Implement `advanceNextOccurrenceDate` helper with correct date arithmetic for DAILY, WEEKLY, MONTHLY (month-end handling), YEARLY (leap year handling)
- [x] 6.3 Implement materialization loop: for each due record, create transactions for all missed occurrences up to today within a DB transaction
- [x] 6.4 Auto-cancel recurring transactions when nextOccurrenceDate exceeds endDate after advancing
- [x] 6.5 Invalidate transaction and analytics caches after processing

## 7. Controller

- [x] 7.1 Create `recurring-transactions.controller.ts` with GET / (list), GET /:id, POST / (create), PATCH /:id (update), DELETE /:id endpoints
- [x] 7.2 Add PATCH /:id/pause and PATCH /:id/resume endpoints
- [x] 7.3 Add POST /process endpoint for triggering materialization
- [x] 7.4 Add Swagger decorators and JWT auth guards to all endpoints

## 8. Transactions Module Update

- [x] 8.1 Update transaction response DTO / entity info to include `recurringTransactionId` field
- [x] 8.2 Update transactions repository mapper to include `recurringTransactionId` in output

## 9. Verification

- [x] 9.1 Run `pnpm check-types` and fix any type errors
- [x] 9.2 Run `pnpm lint:fix` and `pnpm format`
- [ ] 9.3 Manually test CRUD endpoints via Swagger/Scalar
- [ ] 9.4 Manually test processing endpoint with various frequency/interval combinations
