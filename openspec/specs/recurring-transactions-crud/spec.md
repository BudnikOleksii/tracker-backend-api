## ADDED Requirements

### Requirement: Create a recurring transaction

The system SHALL allow an authenticated user to create a recurring transaction by providing a categoryId, type (EXPENSE or INCOME), amount, currencyCode, description (optional), frequency (DAILY, WEEKLY, MONTHLY, or YEARLY), interval (positive integer, default 1), startDate, and optional endDate. The system SHALL validate that the category belongs to the user, is not soft-deleted, and matches the transaction type. The system SHALL set `nextOccurrenceDate` to `startDate` and `status` to `ACTIVE`.

#### Scenario: Successful creation with all fields

- **WHEN** an authenticated user sends a POST request to `/recurring-transactions` with valid categoryId, type, amount, currencyCode, frequency, interval, startDate, and endDate
- **THEN** the system creates the recurring transaction with status ACTIVE, nextOccurrenceDate equal to startDate, and returns it with HTTP 201

#### Scenario: Successful creation with defaults

- **WHEN** an authenticated user sends a POST request with required fields only (no interval, no endDate)
- **THEN** the system creates the recurring transaction with interval defaulting to 1, no endDate, and returns HTTP 201

#### Scenario: Category does not exist or belong to user

- **WHEN** the user provides a categoryId that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

#### Scenario: Category type mismatch

- **WHEN** the user provides a category whose type does not match the recurring transaction type
- **THEN** the system returns HTTP 400 with a descriptive error message

#### Scenario: Category is soft-deleted

- **WHEN** the user provides a categoryId that references a soft-deleted category
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

#### Scenario: endDate before startDate

- **WHEN** the user provides an endDate that is before the startDate
- **THEN** the system returns HTTP 400 with a descriptive error message

### Requirement: List recurring transactions with pagination

The system SHALL return a paginated list of the authenticated user's recurring transactions. The response MUST include `data`, `total`, `page`, `pageSize`, and `hasMore` fields. Each recurring transaction in the `data` array SHALL include a nested `category` object with `id`, `name`, and `parentCategory` (null or `{ id, name }`).

#### Scenario: Default pagination

- **WHEN** an authenticated user sends a GET request to `/recurring-transactions` without pagination params
- **THEN** the system returns page 1 with pageSize 20, with category details on each item

#### Scenario: Custom pagination

- **WHEN** the user provides `page` and `pageSize` query parameters
- **THEN** the system returns the requested page with the specified size (max 100), with category details on each item

### Requirement: Filter recurring transactions

The system SHALL support optional query filters: `status` (ACTIVE, PAUSED, CANCELLED), `type` (EXPENSE/INCOME), `categoryId`, `currencyCode`, and `frequency` (DAILY, WEEKLY, MONTHLY, YEARLY).

#### Scenario: Filter by status

- **WHEN** the user provides `status=ACTIVE` query parameter
- **THEN** the system returns only ACTIVE recurring transactions

#### Scenario: Filter by type

- **WHEN** the user provides `type=EXPENSE` query parameter
- **THEN** the system returns only EXPENSE recurring transactions

#### Scenario: Filter by frequency

- **WHEN** the user provides `frequency=MONTHLY` query parameter
- **THEN** the system returns only recurring transactions with MONTHLY frequency

### Requirement: Get a recurring transaction by ID

The system SHALL return a single recurring transaction by its ID, scoped to the authenticated user.

#### Scenario: Recurring transaction found

- **WHEN** the user requests GET `/recurring-transactions/:id` with a valid ID belonging to them
- **THEN** the system returns the recurring transaction

#### Scenario: Recurring transaction not found

- **WHEN** the user requests a recurring transaction that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: Update a recurring transaction

The system SHALL allow an authenticated user to update their recurring transaction's categoryId, type, amount, currencyCode, description, frequency, interval, startDate, and/or endDate. All fields are optional. If categoryId or type is updated, the same validation rules as creation apply. If frequency, interval, or startDate is changed, the system SHALL recalculate `nextOccurrenceDate`. Only ACTIVE or PAUSED recurring transactions MAY be updated.

#### Scenario: Successful partial update

- **WHEN** the user sends a PATCH request to `/recurring-transactions/:id` with one or more updatable fields
- **THEN** the system updates only the provided fields and returns the updated recurring transaction

#### Scenario: Update frequency recalculates next occurrence

- **WHEN** the user updates the frequency or interval of a recurring transaction
- **THEN** the system recalculates nextOccurrenceDate based on the new schedule from startDate

#### Scenario: Update cancelled recurring transaction

- **WHEN** the user attempts to update a recurring transaction with status CANCELLED
- **THEN** the system returns HTTP 400 with a descriptive error message

#### Scenario: Recurring transaction not found on update

- **WHEN** the user attempts to update a recurring transaction that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: Delete a recurring transaction

The system SHALL allow an authenticated user to delete their recurring transaction by setting its status to CANCELLED. Previously materialized transactions SHALL NOT be affected.

#### Scenario: Successful deletion

- **WHEN** the user sends a DELETE request to `/recurring-transactions/:id` for their own recurring transaction
- **THEN** the system sets status to CANCELLED and returns HTTP 200 with a success message

#### Scenario: Recurring transaction not found on delete

- **WHEN** the user attempts to delete a recurring transaction that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: Pause a recurring transaction

The system SHALL allow an authenticated user to pause an ACTIVE recurring transaction, setting its status to PAUSED.

#### Scenario: Successful pause

- **WHEN** the user sends a PATCH request to `/recurring-transactions/:id/pause` for an ACTIVE recurring transaction
- **THEN** the system sets status to PAUSED and returns the updated recurring transaction

#### Scenario: Pause non-active recurring transaction

- **WHEN** the user attempts to pause a recurring transaction that is not ACTIVE
- **THEN** the system returns HTTP 400 with a descriptive error message

### Requirement: Resume a recurring transaction

The system SHALL allow an authenticated user to resume a PAUSED recurring transaction, setting its status to ACTIVE. If the `nextOccurrenceDate` is in the past, the system SHALL NOT advance it — the next processing run will catch up.

#### Scenario: Successful resume

- **WHEN** the user sends a PATCH request to `/recurring-transactions/:id/resume` for a PAUSED recurring transaction
- **THEN** the system sets status to ACTIVE and returns the updated recurring transaction

#### Scenario: Resume non-paused recurring transaction

- **WHEN** the user attempts to resume a recurring transaction that is not PAUSED
- **THEN** the system returns HTTP 400 with a descriptive error message

### Requirement: Recurring transaction list sorting

The `GET /api/recurring-transactions` endpoint SHALL accept optional `sortBy` and `sortOrder` query parameters. Allowed `sortBy` values: `amount`, `startDate`, `nextOccurrenceDate`, `createdAt`. Default sort: `createdAt` descending.

#### Scenario: Sort by next occurrence date

- **WHEN** a client calls `GET /api/recurring-transactions?sortBy=nextOccurrenceDate&sortOrder=asc`
- **THEN** recurring transactions are returned sorted by next occurrence date ascending

#### Scenario: Sort by amount descending

- **WHEN** a client calls `GET /api/recurring-transactions?sortBy=amount&sortOrder=desc`
- **THEN** recurring transactions are returned sorted by amount descending

#### Scenario: Default recurring transaction sort

- **WHEN** a client calls `GET /api/recurring-transactions` without sort parameters
- **THEN** recurring transactions are returned sorted by `createdAt` descending

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
