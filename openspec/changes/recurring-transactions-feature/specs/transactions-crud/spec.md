## MODIFIED Requirements

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

### Requirement: Get a transaction by ID

The system SHALL return a single transaction by its ID, scoped to the authenticated user. Soft-deleted transactions SHALL NOT be returned. The response SHALL include the `recurringTransactionId` field if the transaction was materialized from a recurring transaction.

#### Scenario: Transaction found

- **WHEN** the user requests GET `/transactions/:id` with a valid ID belonging to them
- **THEN** the system returns the transaction including its recurringTransactionId (null if not from a recurring source)

#### Scenario: Transaction not found

- **WHEN** the user requests a transaction that does not exist, is soft-deleted, or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND
