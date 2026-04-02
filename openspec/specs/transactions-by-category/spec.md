### Requirement: Get transactions grouped by subcategory

The system SHALL provide a `GET /transactions/by-category/:categoryId` endpoint that returns all transactions for a given parent category, grouped by subcategory. Each group SHALL include the subcategory metadata (id, name) and a list of transactions belonging to that subcategory. Transactions assigned directly to the parent category (not to any subcategory) SHALL appear in a group with `subcategory: null`.

#### Scenario: Successful grouped response

- **WHEN** an authenticated user sends a GET request to `/transactions/by-category/:categoryId` with a valid parent category ID that belongs to them
- **THEN** the system returns a response with groups, where each group contains a `subcategory` object (or null), a `transactions` array, and a `totals` array

#### Scenario: Parent category has subcategories with transactions

- **WHEN** the parent category has subcategories that contain transactions
- **THEN** each subcategory with transactions appears as a separate group with `subcategory: { id, name }`, its `transactions` array, and `totals` per currency code

#### Scenario: Transactions assigned directly to parent category

- **WHEN** some transactions are assigned directly to the parent category (not to any subcategory)
- **THEN** those transactions appear in a group with `subcategory: null`

#### Scenario: Empty category

- **WHEN** the parent category and its subcategories have no transactions
- **THEN** the system returns an empty `groups` array

### Requirement: Per-subcategory totals by currency

Each subcategory group SHALL include a `totals` array containing `{ currencyCode, total }` entries. The total SHALL be the sum of transaction amounts for that subcategory, grouped by currency code. The system SHALL NOT sum across different currencies.

#### Scenario: Single currency totals

- **WHEN** all transactions in a subcategory use the same currency
- **THEN** the `totals` array contains a single entry with that currency code and the sum of amounts

#### Scenario: Multiple currency totals

- **WHEN** transactions in a subcategory use different currencies (e.g., USD and EUR)
- **THEN** the `totals` array contains separate entries for each currency with their respective sums

### Requirement: Category ownership validation

The system SHALL validate that the requested category belongs to the authenticated user and is not soft-deleted. The category MUST be a parent category (parentCategoryId is null).

#### Scenario: Category not found

- **WHEN** the user requests a categoryId that does not exist or belongs to another user
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

#### Scenario: Category is soft-deleted

- **WHEN** the user requests a categoryId that references a soft-deleted category
- **THEN** the system returns HTTP 404 with error code RESOURCE_NOT_FOUND

#### Scenario: Category is a subcategory

- **WHEN** the user requests a categoryId that is itself a subcategory (has a parentCategoryId)
- **THEN** the system returns HTTP 400 indicating the endpoint requires a parent category
