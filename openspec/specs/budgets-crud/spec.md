## ADDED Requirements

### Requirement: Create a budget

The system SHALL allow authenticated users to create a budget by providing an amount, currency code, period (WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM), start date, and optionally a category ID and description. The system SHALL compute the end date automatically for non-CUSTOM periods. For CUSTOM periods, the user MUST provide an end date.

#### Scenario: Create a monthly budget for a category

- **WHEN** user sends POST /api/budgets with amount "500.00", currencyCode "USD", period "MONTHLY", startDate "2026-03-01", and a valid categoryId
- **THEN** system creates the budget with status "ACTIVE", computes endDate as "2026-03-31", and returns the budget with HTTP 201

#### Scenario: Create a custom-period budget without end date

- **WHEN** user sends POST /api/budgets with period "CUSTOM" and no endDate
- **THEN** system returns HTTP 400 with error code "BAD_REQUEST" indicating endDate is required for CUSTOM periods

#### Scenario: Create budget with invalid category

- **WHEN** user sends POST /api/budgets with a categoryId that does not exist or belongs to another user
- **THEN** system returns HTTP 404 with error code "RESOURCE_NOT_FOUND"

#### Scenario: Create budget with overlapping period

- **WHEN** user sends POST /api/budgets with the same categoryId, currencyCode, and a date range that overlaps an existing active budget
- **THEN** system returns HTTP 409 with error code "BAD_REQUEST" indicating a budget already exists for this category and period

### Requirement: List budgets

The system SHALL allow authenticated users to list their budgets with pagination. The system SHALL support filtering by status, period, categoryId, and currencyCode.

#### Scenario: List budgets with default pagination

- **WHEN** user sends GET /api/budgets with no query parameters
- **THEN** system returns a paginated list of the user's budgets ordered by createdAt descending, with page=1, pageSize=20

#### Scenario: List budgets filtered by status

- **WHEN** user sends GET /api/budgets?status=EXCEEDED
- **THEN** system returns only budgets with status "EXCEEDED"

### Requirement: Get budget by ID

The system SHALL allow authenticated users to retrieve a single budget by its ID. The system SHALL return 404 if the budget does not exist or belongs to another user.

#### Scenario: Get existing budget

- **WHEN** user sends GET /api/budgets/:id with a valid budget ID they own
- **THEN** system returns the budget details with HTTP 200

#### Scenario: Get non-existent budget

- **WHEN** user sends GET /api/budgets/:id with an ID that does not exist
- **THEN** system returns HTTP 404 with error code "RESOURCE_NOT_FOUND"

### Requirement: Update a budget

The system SHALL allow authenticated users to update their budget's amount, description, categoryId, and endDate. The system SHALL NOT allow changing period or startDate. The system SHALL re-validate overlap constraints when categoryId or endDate changes.

#### Scenario: Update budget amount

- **WHEN** user sends PATCH /api/budgets/:id with amount "750.00"
- **THEN** system updates the amount and returns the updated budget

#### Scenario: Update budget with overlapping change

- **WHEN** user sends PATCH /api/budgets/:id changing categoryId to one that already has an overlapping budget
- **THEN** system returns HTTP 409 with error code "BAD_REQUEST"

### Requirement: Delete a budget

The system SHALL allow authenticated users to delete their budgets. Deletion SHALL be a hard delete.

#### Scenario: Delete existing budget

- **WHEN** user sends DELETE /api/budgets/:id with a valid budget ID they own
- **THEN** system deletes the budget and returns HTTP 200 with a success message

#### Scenario: Delete non-existent budget

- **WHEN** user sends DELETE /api/budgets/:id with an ID that does not exist
- **THEN** system returns HTTP 404 with error code "RESOURCE_NOT_FOUND"

### Requirement: Budget data model

The budgets table SHALL store: id (UUID, PK), userId (UUID, FK to users with cascade delete), categoryId (UUID, nullable FK to transaction categories), amount (numeric 19,2), currencyCode (CurrencyCode enum), period (BudgetPeriod enum), startDate (timestamp), endDate (timestamp), status (BudgetStatus enum, default ACTIVE), description (text, nullable), createdAt, updatedAt.

#### Scenario: User deletion cascades to budgets

- **WHEN** a user is deleted from the system
- **THEN** all budgets belonging to that user are also deleted

### Requirement: Cache integration

The system SHALL cache read endpoints (list, get by ID) using the existing cache-aside pattern. The system SHALL invalidate budget caches on create, update, and delete operations.

#### Scenario: Cache invalidation on budget create

- **WHEN** user creates a new budget
- **THEN** system invalidates all cached budget queries for that user

### Requirement: Budget list sorting

The `GET /api/budgets` endpoint SHALL accept optional `sortBy` and `sortOrder` query parameters. Allowed `sortBy` values: `amount`, `startDate`, `endDate`, `createdAt`. Default sort: `createdAt` descending.

#### Scenario: Sort budgets by amount ascending

- **WHEN** a client calls `GET /api/budgets?sortBy=amount&sortOrder=asc`
- **THEN** budgets are returned sorted by amount ascending

#### Scenario: Sort budgets by start date

- **WHEN** a client calls `GET /api/budgets?sortBy=startDate&sortOrder=desc`
- **THEN** budgets are returned sorted by start date descending

#### Scenario: Default budget sort

- **WHEN** a client calls `GET /api/budgets` without sort parameters
- **THEN** budgets are returned sorted by `createdAt` descending
