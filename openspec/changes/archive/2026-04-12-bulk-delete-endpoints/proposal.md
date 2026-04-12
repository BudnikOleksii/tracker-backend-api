## Why

Users currently delete records one at a time via individual `DELETE /:id` endpoints. When cleaning up data — removing old transactions, expired budgets, or unused categories — this requires N sequential API calls, creating a poor UX and unnecessary network overhead. Bulk delete endpoints let the client send a single request to remove multiple records at once.

## What Changes

- Add `DELETE /batch` endpoints to **transactions**, **budgets**, **transaction-categories**, and **recurring-transactions** modules
- Accept an array of UUIDs in the request body, validate ownership, and delete as many as possible
- Return detailed results: which records were deleted, which failed and why (not found, constraint violation, etc.)
- Enforce a maximum batch size (100 items per request) to prevent abuse
- Respect existing cascade/restrict constraints (e.g., categories with transactions cannot be deleted)
- Shared `BulkDeleteDto` for request validation and `BulkDeleteResponseDto` for responses

## Capabilities

### New Capabilities

- `bulk-delete`: Shared bulk delete request/response contracts, batch size limits, partial-success semantics, and per-ID failure reporting across modules

### Modified Capabilities

- `transactions-crud`: Adding bulk delete endpoint to transactions
- `budgets-crud`: Adding bulk delete endpoint to budgets
- `transaction-categories-crud`: Adding bulk delete endpoint to transaction categories (soft delete, skips categories with active transactions)
- `recurring-transactions-crud`: Adding bulk delete endpoint to recurring transactions

## Impact

- **API**: Four new `DELETE /batch` routes added (one per module)
- **Shared DTOs**: New `BulkDeleteDto` and `BulkDeleteResponseDto` (with per-ID failure details) in `src/shared/dtos/`
- **Repository layer**: New `bulkDelete` methods in each module's repository
- **Service layer**: New `bulkDelete` methods with ownership validation and partial-success handling
- **Database**: Deletable records removed in a single transaction; non-deletable records reported as failures
- **Events**: Bulk transaction delete emits `TransactionMutationEvent` for budget cache coherence
- **Swagger**: New endpoint documentation for each bulk delete route
