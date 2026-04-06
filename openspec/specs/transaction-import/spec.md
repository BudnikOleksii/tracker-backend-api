### Requirement: File upload endpoint

The system SHALL expose `POST /transactions/import` that accepts `multipart/form-data` with a `file` field. The endpoint SHALL require JWT authentication. The endpoint SHALL return HTTP 201 on success with an import summary.

#### Scenario: Successful JSON import

- **WHEN** an authenticated user uploads a valid `.json` file containing an array of transaction objects
- **THEN** the system creates all transactions and returns HTTP 201 with counts of created transactions, categories, and subcategories

#### Scenario: Successful CSV import

- **WHEN** an authenticated user uploads a valid `.csv` file with headers `Date,Category,Type,Amount,Currency,Subcategory`
- **THEN** the system parses the CSV, creates all transactions, and returns HTTP 201 with the import summary

#### Scenario: No file provided

- **WHEN** the request has no file attached
- **THEN** the system returns HTTP 400 with error message indicating a file is required

#### Scenario: Unsupported file format

- **WHEN** the user uploads a file with an extension other than `.json` or `.csv`
- **THEN** the system returns HTTP 400 with error message indicating only JSON and CSV are supported

#### Scenario: File exceeds size limit

- **WHEN** the uploaded file exceeds 5MB
- **THEN** the system returns HTTP 400 with an error about file size

### Requirement: JSON parsing

The system SHALL parse JSON files as an array of objects with the following fields: `Date` (string, `MM/DD/YYYY HH:mm:ss`), `Category` (string), `Type` (string, `Expense` or `Income`), `Amount` (number), `Currency` (string, ISO currency code), `Subcategory` (string, optional).

#### Scenario: Valid JSON structure

- **WHEN** the JSON file contains a valid array of transaction objects with all required fields
- **THEN** the system parses all entries into normalized transaction records

#### Scenario: Invalid JSON structure

- **WHEN** the JSON file is not a valid JSON array or contains objects missing required fields
- **THEN** the system returns HTTP 400 with a description of the validation error

#### Scenario: Invalid field values

- **WHEN** a JSON entry has an invalid `Type` value (not `Expense` or `Income`), invalid date format, negative amount, or unrecognized currency code
- **THEN** the system returns HTTP 400 indicating which row and field failed validation

### Requirement: CSV file parsing

The system SHALL parse uploaded CSV files using the async streaming `csv-parse` API. The `parseCsvFile` method SHALL accept a `Buffer` and return a `Promise<ParsedTransactionRow[]>`. The method signature changes from synchronous to asynchronous.

#### Scenario: Successful CSV import

- **WHEN** a user uploads a valid CSV file
- **THEN** the file SHALL be parsed asynchronously using streaming csv-parse
- **AND** the parsed rows SHALL be validated and inserted as transactions

#### Scenario: Import with parse error

- **WHEN** a user uploads a CSV file with invalid format
- **THEN** a `BadRequestException` SHALL be thrown with an appropriate error message

### Requirement: Category auto-resolution

The system SHALL resolve categories by matching `(name, type, userId)`. If a matching category does not exist, the system SHALL create it. For entries with a `Subcategory`, the system SHALL resolve or create the subcategory under the resolved parent category.

#### Scenario: Existing category matches

- **WHEN** the import data references a category name and type that already exist for the user
- **THEN** the system uses the existing category's ID for the transaction

#### Scenario: New category created

- **WHEN** the import data references a category name and type that do not exist for the user
- **THEN** the system creates a new category with that name, type, and the user's ID, then uses it for the transaction

#### Scenario: Subcategory resolution under parent

- **WHEN** an import entry has both `Category` and `Subcategory` fields
- **THEN** the system resolves or creates the parent category first, then resolves or creates the subcategory with `parentCategoryId` pointing to the parent

#### Scenario: Same category name different types

- **WHEN** the import has entries with the same category name but different types (one Expense, one Income)
- **THEN** the system creates separate categories for each type, matching the unique constraint `(userId, name, type, parentCategoryId)`

### Requirement: Atomic bulk insert

The system SHALL create all categories and transactions within a single database transaction. If any step fails, the entire import SHALL be rolled back — no partial data is persisted.

#### Scenario: All entries valid

- **WHEN** all entries in the file pass validation and category resolution succeeds
- **THEN** all transactions are inserted in a single DB transaction and the summary is returned

#### Scenario: Failure mid-import

- **WHEN** an error occurs during category creation or transaction insertion
- **THEN** the entire database transaction is rolled back and an error response is returned with no data persisted

### Requirement: Row limit

The system SHALL reject imports with more than 1000 rows.

#### Scenario: File within row limit

- **WHEN** the parsed data contains 1000 or fewer entries
- **THEN** the import proceeds normally

#### Scenario: File exceeds row limit

- **WHEN** the parsed data contains more than 1000 entries
- **THEN** the system returns HTTP 400 indicating the maximum row limit was exceeded

### Requirement: Import summary response

The system SHALL return an import summary containing: `transactionsCreated` (number), `categoriesCreated` (number), `subcategoriesCreated` (number).

#### Scenario: Import with new and existing categories

- **WHEN** an import creates 50 transactions, 3 new parent categories, and 2 new subcategories (other categories already existed)
- **THEN** the response contains `{ transactionsCreated: 50, categoriesCreated: 3, subcategoriesCreated: 2 }`

### Requirement: Cache invalidation after import

The system SHALL clear cached data for `transactions`, `transactions-analytics`, `budgets`, and `categories` modules for the importing user after a successful import.

#### Scenario: Cache cleared on success

- **WHEN** an import completes successfully
- **THEN** the cache prefixes for `transactions`, `transactions-analytics`, `budgets`, and `categories` are invalidated for the user
