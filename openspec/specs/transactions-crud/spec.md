### Requirement: Create a transaction

The system SHALL allow an authenticated user to create a transaction by providing a categoryId, type (EXPENSE or INCOME), amount, currencyCode, date, and optional description. The transaction MUST be scoped to the authenticated user. The system SHALL validate that the referenced category belongs to the user, is not soft-deleted, and matches the transaction type. The transaction MAY optionally include a `recurringTransactionId` to link it to a source recurring transaction.

#### Scenario: Successful transaction creation

- **WHEN** an authenticated user sends a POST request to `/transactions` with valid categoryId, type, amount, currencyCode, and date
- **THEN** the system creates the transaction and returns it with HTTP 201

#### Scenario: Category does not exist or belong to user

- **WHEN** the user provides a categoryId that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

#### Scenario: Category type mismatch

- **WHEN** the user provides a category whose type does not match the transaction type
- **THEN** the system returns HTTP 400 with a descriptive error message

#### Scenario: Category is soft-deleted

- **WHEN** the user provides a categoryId that references a soft-deleted category
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: List transactions with pagination

The system SHALL return a paginated list of the authenticated user's transactions. The response MUST include `data`, `total`, `page`, `pageSize`, and `hasMore` fields. The system SHALL support optional `sortBy` (`date`, `amount`, `createdAt`) and `sortOrder` (`asc`, `desc`) query parameters. When omitted, the default sort is `date` descending.

#### Scenario: Default pagination

- **WHEN** an authenticated user sends a GET request to `/transactions` without pagination params
- **THEN** the system returns page 1 with pageSize 20, sorted by date descending

#### Scenario: Custom pagination

- **WHEN** the user provides `page` and `pageSize` query parameters
- **THEN** the system returns the requested page with the specified size (max 100)

#### Scenario: Custom sort order

- **WHEN** the user provides `sortBy` and/or `sortOrder` query parameters
- **THEN** the system returns results sorted by the specified field and direction

### Requirement: Filter transactions

The system SHALL support optional query filters: `type` (EXPENSE/INCOME), `categoryId`, `currencyCode`, `dateFrom`, and `dateTo`.

#### Scenario: Filter by type

- **WHEN** the user provides `type=EXPENSE` query parameter
- **THEN** the system returns only EXPENSE transactions

#### Scenario: Filter by date range

- **WHEN** the user provides `dateFrom` and/or `dateTo` query parameters
- **THEN** the system returns transactions within the specified date range (inclusive)

#### Scenario: Filter by category

- **WHEN** the user provides a `categoryId` query parameter
- **THEN** the system returns only transactions in that category

#### Scenario: Filter by currency

- **WHEN** the user provides a `currencyCode` query parameter
- **THEN** the system returns only transactions with that currency

### Requirement: Get a transaction by ID

The system SHALL return a single transaction by its ID, scoped to the authenticated user. The response SHALL include the `recurringTransactionId` field if the transaction was materialized from a recurring transaction. Soft-deleted transactions SHALL NOT be returned.

#### Scenario: Transaction found

- **WHEN** the user requests GET `/transactions/:id` with a valid ID belonging to them
- **THEN** the system returns the transaction including its recurringTransactionId (null if not from a recurring source)

#### Scenario: Transaction not found

- **WHEN** the user requests a transaction that does not exist, is soft-deleted, or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: Update a transaction

The system SHALL allow an authenticated user to update their transaction's categoryId, type, amount, currencyCode, date, and/or description. All fields are optional. If categoryId or type is updated, the same validation rules as creation apply (ownership, not soft-deleted, type match between category and transaction type).

#### Scenario: Successful partial update

- **WHEN** the user sends a PATCH request to `/transactions/:id` with one or more updatable fields
- **THEN** the system updates only the provided fields and returns the updated transaction

#### Scenario: Update with invalid category

- **WHEN** the user updates categoryId to a category that does not belong to them or is soft-deleted
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

#### Scenario: Transaction not found on update

- **WHEN** the user attempts to update a transaction that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: Delete a transaction

The system SHALL allow an authenticated user to soft-delete their transaction by setting the `deletedAt` timestamp.

#### Scenario: Successful deletion

- **WHEN** the user sends a DELETE request to `/transactions/:id` for their own transaction
- **THEN** the system soft-deletes the transaction and returns HTTP 200 with a success message

#### Scenario: Transaction not found on delete

- **WHEN** the user attempts to delete a transaction that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

### Requirement: Transaction amount CHECK constraint

The `Transaction` table SHALL have a database CHECK constraint enforcing `amount > 0`. Negative or zero amounts MUST be rejected at the database level.

#### Scenario: Insert transaction with positive amount

- **WHEN** a transaction is inserted with `amount = 100.50`
- **THEN** the insert succeeds

#### Scenario: Insert transaction with zero amount

- **WHEN** a transaction is inserted with `amount = 0`
- **THEN** the database rejects the insert with a CHECK constraint violation

#### Scenario: Insert transaction with negative amount

- **WHEN** a transaction is inserted with `amount = -50`
- **THEN** the database rejects the insert with a CHECK constraint violation

### Requirement: Consistent validator decorators in analytics DTOs

`AnalyticsQueryDto`, `DailySpendingQueryDto`, `TopCategoriesQueryDto`, and `TrendsQueryDto` SHALL use project-standard `*Field()` validator wrappers (`IsIntField`, `MinField`, `MaxField`, `IsInField`) instead of raw `class-validator` decorators.

#### Scenario: Validation error includes ErrorCode context

- **WHEN** a request to an analytics endpoint sends an invalid `year` value
- **THEN** the validation error response includes the appropriate `ErrorCode` from the `*Field()` wrapper
