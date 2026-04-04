### Requirement: Export transactions as JSON

The system SHALL provide an endpoint `GET /transactions/export?format=json` that returns a downloadable JSON file containing the authenticated user's transactions.

#### Scenario: Export all transactions as JSON

- **WHEN** user sends `GET /transactions/export?format=json` with no filters
- **THEN** system returns a JSON file with `Content-Type: application/json` and `Content-Disposition: attachment; filename="transactions-<date>.json"` containing all user transactions

#### Scenario: JSON output format matches import format

- **WHEN** user exports transactions as JSON
- **THEN** each transaction object SHALL contain fields: `Date` (MM/DD/YYYY HH:mm:ss), `Category` (parent category name), `Type` ("Expense" or "Income"), `Amount` (number), `Currency` (currency code), and optionally `Subcategory` (subcategory name if the transaction's category has a parent)

### Requirement: Export transactions as CSV

The system SHALL provide an endpoint `GET /transactions/export?format=csv` that returns a downloadable CSV file containing the authenticated user's transactions.

#### Scenario: Export all transactions as CSV

- **WHEN** user sends `GET /transactions/export?format=csv` with no filters
- **THEN** system returns a CSV file with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="transactions-<date>.csv"` with headers: Date, Category, Type, Amount, Currency, Subcategory

### Requirement: Filter exports by date range

The system SHALL support optional `dateFrom` and `dateTo` query parameters to filter exported transactions by date.

#### Scenario: Export with date range filter

- **WHEN** user sends `GET /transactions/export?format=json&dateFrom=2026-01-01T00:00:00.000Z&dateTo=2026-01-31T23:59:59.999Z`
- **THEN** system returns only transactions with dates within the specified range

#### Scenario: Export with only dateFrom

- **WHEN** user sends `GET /transactions/export?format=json&dateFrom=2026-01-01T00:00:00.000Z`
- **THEN** system returns only transactions on or after the specified date

### Requirement: Filter exports by category

The system SHALL support an optional `categoryId` query parameter to filter exported transactions by category.

#### Scenario: Export filtered by category

- **WHEN** user sends `GET /transactions/export?format=csv&categoryId=<uuid>`
- **THEN** system returns transactions belonging to that category and all of its subcategories

### Requirement: Format parameter is required

The `format` query parameter SHALL be required and MUST be either `json` or `csv`.

#### Scenario: Missing format parameter

- **WHEN** user sends `GET /transactions/export` without a `format` parameter
- **THEN** system returns a 400 Bad Request error

#### Scenario: Invalid format parameter

- **WHEN** user sends `GET /transactions/export?format=xml`
- **THEN** system returns a 400 Bad Request error

### Requirement: Authentication required

The export endpoint SHALL require JWT authentication, consistent with all other transaction endpoints.

#### Scenario: Unauthenticated export attempt

- **WHEN** an unauthenticated user sends `GET /transactions/export?format=json`
- **THEN** system returns 401 Unauthorized
