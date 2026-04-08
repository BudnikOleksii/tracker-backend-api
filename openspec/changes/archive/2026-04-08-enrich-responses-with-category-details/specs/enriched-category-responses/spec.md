## ADDED Requirements

### Requirement: Transaction responses include category details

Transaction GET endpoints SHALL return a nested `category` object alongside the existing `categoryId` field. The `category` object SHALL contain `id` (string), `name` (string), and `parentCategory` (object or null). When the category is a subcategory, `parentCategory` SHALL contain `id` (string) and `name` (string) of the parent category. When the category is a top-level category, `parentCategory` SHALL be null.

#### Scenario: Transaction with a top-level category

- **WHEN** an authenticated user retrieves a transaction whose category has no parentCategoryId
- **THEN** the response SHALL include `category: { id, name, parentCategory: null }` and retain `categoryId` at the top level

#### Scenario: Transaction with a subcategory

- **WHEN** an authenticated user retrieves a transaction whose category has a parentCategoryId
- **THEN** the response SHALL include `category: { id, name, parentCategory: { id, name } }` where parentCategory reflects the parent category's id and name

#### Scenario: Transaction list includes category details

- **WHEN** an authenticated user lists transactions via GET `/transactions`
- **THEN** every item in the `data` array SHALL include the `category` object with the same structure as the detail endpoint

### Requirement: Recurring transaction responses include category details

Recurring transaction GET endpoints SHALL return a nested `category` object alongside the existing `categoryId` field, using the same structure as transaction responses.

#### Scenario: Recurring transaction with a top-level category

- **WHEN** an authenticated user retrieves a recurring transaction whose category has no parentCategoryId
- **THEN** the response SHALL include `category: { id, name, parentCategory: null }`

#### Scenario: Recurring transaction with a subcategory

- **WHEN** an authenticated user retrieves a recurring transaction whose category has a parentCategoryId
- **THEN** the response SHALL include `category: { id, name, parentCategory: { id, name } }`

#### Scenario: Recurring transaction list includes category details

- **WHEN** an authenticated user lists recurring transactions via GET `/recurring-transactions`
- **THEN** every item in the `data` array SHALL include the `category` object

### Requirement: Category details resolved via JOIN

The repository layer SHALL resolve category details using LEFT JOINs on the `TransactionCategory` table within the same query that fetches transactions. The system SHALL NOT make separate queries to resolve category names.

#### Scenario: Single query with JOIN

- **WHEN** the repository executes `findAll` or `findById` for transactions or recurring transactions
- **THEN** the query SHALL use a LEFT JOIN on `TransactionCategory` (and a second LEFT JOIN for parent category resolution) rather than issuing additional queries

### Requirement: Soft-deleted categories still resolve

When a transaction references a category that has been soft-deleted, the category details SHALL still be included in the response. The JOIN SHALL NOT filter on `deletedAt`.

#### Scenario: Transaction references a soft-deleted category

- **WHEN** a transaction's categoryId references a category with a non-null `deletedAt`
- **THEN** the response SHALL still include the category's `id` and `name` in the `category` object
