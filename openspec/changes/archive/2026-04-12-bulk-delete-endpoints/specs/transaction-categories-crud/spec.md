## ADDED Requirements

### Requirement: Bulk delete transaction categories

The system SHALL allow an authenticated user to soft-delete multiple transaction categories in a single request by sending `DELETE /transaction-categories/batch` with a body containing an array of category IDs. The system SHALL validate all IDs, check each category for active (non-deleted) transactions and active children, soft-delete those that pass validation, and report failures with specific reasons. The system SHALL NOT auto-cascade to child categories — matching existing single-delete behavior.

#### Scenario: Successful bulk soft-delete

- **WHEN** an authenticated user sends `DELETE /transaction-categories/batch` with `{ "ids": ["cat-1", "cat-2"] }` and both categories belong to the user with no active transactions or children
- **THEN** the system sets `deletedAt` on both categories and returns `{ "deleted": 2, "failed": [], "message": "2 categories deleted successfully" }`

#### Scenario: Some categories have active transactions

- **WHEN** a user sends a bulk delete with 4 IDs where 1 category has associated non-deleted transactions
- **THEN** the system soft-deletes the 3 valid categories and returns `{ "deleted": 3, "failed": [{ "id": "...", "reason": "Category has active transactions" }] }`

#### Scenario: Category has active children

- **WHEN** a user sends a bulk delete where one category has active (non-deleted) child categories
- **THEN** the system skips that category and reports it as failed with reason "Category has active children"

#### Scenario: Some categories not found

- **WHEN** a user sends a bulk delete with IDs where some do not exist or belong to another user
- **THEN** the system soft-deletes the valid categories and reports not-found IDs with reason "Not found"

#### Scenario: Batch validation for active transactions

- **WHEN** the system checks categories for active transactions
- **THEN** the system SHALL perform a single batch query across all candidate category IDs to avoid N+1 queries

#### Scenario: Cache invalidation after bulk delete

- **WHEN** categories are successfully bulk-deleted (deleted > 0)
- **THEN** the system invalidates cached category queries for that user
