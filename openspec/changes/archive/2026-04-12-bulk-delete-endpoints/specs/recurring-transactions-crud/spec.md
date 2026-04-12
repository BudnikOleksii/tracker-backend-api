## ADDED Requirements

### Requirement: Bulk delete recurring transactions

The system SHALL allow an authenticated user to cancel multiple recurring transactions in a single request by sending `DELETE /recurring-transactions/batch` with a body containing an array of recurring transaction IDs. The system SHALL set the status to CANCELLED on all matching recurring transactions owned by the user, regardless of current status (matching existing single-delete behavior). IDs that are not found, not owned, or already CANCELLED SHALL be reported as failures. Previously materialized transactions SHALL NOT be affected.

#### Scenario: Successful bulk cancellation

- **WHEN** an authenticated user sends `DELETE /recurring-transactions/batch` with `{ "ids": ["rt-1", "rt-2"] }` and both are ACTIVE recurring transactions owned by the user
- **THEN** the system sets status to CANCELLED on both and returns `{ "deleted": 2, "failed": [], "message": "2 recurring transactions deleted successfully" }`

#### Scenario: Mix of ACTIVE and PAUSED

- **WHEN** a user sends a bulk delete with one ACTIVE and one PAUSED recurring transaction
- **THEN** the system cancels both and returns the count of cancelled records

#### Scenario: Already cancelled recurring transaction

- **WHEN** a user sends a bulk delete with an ID that is already CANCELLED
- **THEN** the system skips that ID and reports it as failed with reason "Already cancelled"

#### Scenario: Some recurring transactions not found

- **WHEN** a user sends a bulk delete with IDs where some do not exist or belong to another user
- **THEN** the system cancels the valid ones and reports not-found IDs with reason "Not found"

#### Scenario: Cache invalidation after bulk delete

- **WHEN** recurring transactions are successfully bulk-cancelled (deleted > 0)
- **THEN** the system invalidates cached recurring transaction queries for that user
