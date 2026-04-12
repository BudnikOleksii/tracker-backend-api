## ADDED Requirements

### Requirement: Bulk delete budgets

The system SHALL allow an authenticated user to hard-delete multiple budgets in a single request by sending `DELETE /budgets/batch` with a body containing an array of budget IDs. The system SHALL validate all IDs, delete those that exist and belong to the user, and report any not-found IDs as failures.

#### Scenario: Successful bulk hard-delete

- **WHEN** an authenticated user sends `DELETE /budgets/batch` with `{ "ids": ["budget-1", "budget-2"] }` and both IDs belong to the user
- **THEN** the system hard-deletes both budgets and returns `{ "deleted": 2, "failed": [], "message": "2 budgets deleted successfully" }`

#### Scenario: Some budgets not found

- **WHEN** a user sends a bulk delete with 4 IDs where 1 does not exist or belongs to another user
- **THEN** the system deletes the 3 valid budgets, returns `{ "deleted": 3, "failed": [{ "id": "...", "reason": "Not found" }] }`

#### Scenario: Cache invalidation after bulk delete

- **WHEN** budgets are successfully bulk-deleted (deleted > 0)
- **THEN** the system invalidates cached budget queries for that user
