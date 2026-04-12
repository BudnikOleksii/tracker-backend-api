## ADDED Requirements

### Requirement: Bulk delete transactions

The system SHALL allow an authenticated user to hard-delete multiple transactions in a single request by sending `DELETE /transactions/batch` with a body containing an array of transaction IDs. The system SHALL validate all IDs, delete those that exist and belong to the user, and report any not-found IDs as failures. The system SHALL emit a `TransactionMutationEvent` after successful deletion to trigger budget cache invalidation.

#### Scenario: Successful bulk hard-delete

- **WHEN** an authenticated user sends `DELETE /transactions/batch` with `{ "ids": ["tx-1", "tx-2", "tx-3"] }` and all IDs belong to the user
- **THEN** the system hard-deletes all three transactions and returns `{ "deleted": 3, "failed": [], "message": "3 transactions deleted successfully" }`

#### Scenario: Some transactions not found

- **WHEN** a user sends a bulk delete with 5 IDs where 2 do not exist or belong to another user
- **THEN** the system deletes the 3 valid transactions, returns `{ "deleted": 3, "failed": [{ "id": "...", "reason": "Not found" }, ...] }`

#### Scenario: TransactionMutationEvent emitted

- **WHEN** transactions are successfully bulk-deleted (deleted > 0)
- **THEN** the system emits a `TransactionMutationEvent` to trigger budget cache invalidation

#### Scenario: Cache invalidation after bulk delete

- **WHEN** transactions are successfully bulk-deleted (deleted > 0)
- **THEN** the system invalidates cached transaction queries for that user
