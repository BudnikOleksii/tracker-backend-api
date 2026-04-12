## ADDED Requirements

### Requirement: List transaction categories

The system SHALL return a paginated list of the authenticated user's transaction categories, excluding soft-deleted records. The endpoint SHALL support filtering by `type` (EXPENSE/INCOME) and `parentCategoryId`.

#### Scenario: List all categories

- **WHEN** an authenticated user sends `GET /api/transaction-categories`
- **THEN** the system SHALL return a paginated list of the user's categories with `object: 'list'`, `data`, `total`, `page`, `pageSize`, and `hasMore` fields

#### Scenario: Filter by type

- **WHEN** an authenticated user sends `GET /api/transaction-categories?type=EXPENSE`
- **THEN** the system SHALL return only categories with type EXPENSE belonging to that user

#### Scenario: Filter by parent category

- **WHEN** an authenticated user sends `GET /api/transaction-categories?parentCategoryId=<uuid>`
- **THEN** the system SHALL return only direct subcategories of the specified parent

#### Scenario: List root categories only

- **WHEN** an authenticated user sends `GET /api/transaction-categories?root=true`
- **THEN** the system SHALL return only categories where `parentCategoryId` is null

#### Scenario: Unauthenticated request

- **WHEN** a request is sent without a valid JWT
- **THEN** the system SHALL respond with HTTP 401 Unauthorized

### Requirement: Get a single transaction category

The system SHALL return a single transaction category by ID, only if it belongs to the authenticated user.

#### Scenario: Category found

- **WHEN** an authenticated user sends `GET /api/transaction-categories/:id` with a valid category ID they own
- **THEN** the system SHALL return the category details

#### Scenario: Category not found

- **WHEN** an authenticated user sends `GET /api/transaction-categories/:id` with an ID that does not exist or belongs to another user
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Create a transaction category

The system SHALL allow authenticated users to create a new transaction category with a name, type, and optional parent category.

#### Scenario: Successful creation

- **WHEN** an authenticated user sends `POST /api/transaction-categories` with a valid `name`, `type`, and optional `parentCategoryId`
- **THEN** the system SHALL create the category scoped to the user and return it with HTTP 201

#### Scenario: Duplicate category

- **WHEN** an authenticated user sends a create request with a `name`, `type`, and `parentCategoryId` combination that already exists for that user
- **THEN** the system SHALL respond with HTTP 409 Conflict

#### Scenario: Invalid parent category

- **WHEN** an authenticated user sends a create request with a `parentCategoryId` that does not exist or belongs to another user
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Update a transaction category

The system SHALL allow authenticated users to update the name or parent category of a category they own.

#### Scenario: Successful update

- **WHEN** an authenticated user sends `PATCH /api/transaction-categories/:id` with valid update fields
- **THEN** the system SHALL update the category and return the updated record

#### Scenario: Category not owned

- **WHEN** an authenticated user sends an update request for a category they do not own
- **THEN** the system SHALL respond with HTTP 404 Not Found

#### Scenario: Duplicate name after update

- **WHEN** an update would result in a duplicate `(name, type, parentCategoryId)` for the user
- **THEN** the system SHALL respond with HTTP 409 Conflict

### Requirement: Delete a transaction category

The system SHALL soft-delete a transaction category by setting `deletedAt`, only if it belongs to the authenticated user.

#### Scenario: Successful deletion

- **WHEN** an authenticated user sends `DELETE /api/transaction-categories/:id` for a category they own with no active transactions
- **THEN** the system SHALL set `deletedAt` and return HTTP 200 with a success message

#### Scenario: Category has active transactions

- **WHEN** an authenticated user sends a delete request for a category that has associated transactions
- **THEN** the system SHALL respond with HTTP 409 Conflict with a message indicating the category is in use

#### Scenario: Category not found

- **WHEN** an authenticated user sends a delete request for a non-existent or unowned category
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Unique index prevents duplicate root categories

The unique index on `TransactionCategory(userId, name, type, parentCategoryId)` SHALL use `NULLS NOT DISTINCT` so that two root categories (where `parentCategoryId IS NULL`) with the same `userId`, `name`, and `type` are rejected by the database.

#### Scenario: Attempt to create duplicate root category

- **WHEN** a user creates a category with `name='Food'`, `type='EXPENSE'`, `parentCategoryId=NULL` and one already exists
- **THEN** the database rejects the insert with a unique constraint violation

### Requirement: Transaction category list sorting

The `GET /api/transaction-categories` endpoint SHALL accept optional `sortBy` and `sortOrder` query parameters. Allowed `sortBy` values: `name`, `createdAt`. Default sort: `name` ascending.

#### Scenario: Sort categories by name descending

- **WHEN** a client calls `GET /api/transaction-categories?sortBy=name&sortOrder=desc`
- **THEN** categories are returned sorted by name descending

#### Scenario: Sort categories by creation date

- **WHEN** a client calls `GET /api/transaction-categories?sortBy=createdAt&sortOrder=desc`
- **THEN** categories are returned sorted by creation date descending

#### Scenario: Default category sort

- **WHEN** a client calls `GET /api/transaction-categories` without sort parameters
- **THEN** categories are returned sorted by `name` ascending

### Requirement: Bulk delete transaction categories

The system SHALL allow an authenticated user to soft-delete multiple transaction categories in a single request by sending `DELETE /transaction-categories/batch` with a body containing an array of category IDs. The system SHALL validate all IDs, check each category for active (non-deleted) transactions and active children, soft-delete those that pass validation, and report failures with specific reasons. The system SHALL NOT auto-cascade to child categories -- matching existing single-delete behavior.

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
