## ADDED Requirements

### Requirement: List default transaction categories

The system SHALL return a paginated list of all default transaction categories, excluding soft-deleted records. The endpoint SHALL be accessible only to users with ADMIN role or higher.

#### Scenario: List all default transaction categories

- **WHEN** an authenticated admin sends `GET /api/default-transaction-categories`
- **THEN** the system SHALL return a paginated list with `object: 'list'`, `data`, `total`, `page`, `pageSize`, and `hasMore` fields

#### Scenario: Filter by type

- **WHEN** an authenticated admin sends `GET /api/default-categories?type=EXPENSE`
- **THEN** the system SHALL return only default transaction categories with type EXPENSE

#### Scenario: List root default transaction categories only

- **WHEN** an authenticated admin sends `GET /api/default-categories?root=true`
- **THEN** the system SHALL return only default transaction categories where `parentDefaultTransactionCategoryId` is null

#### Scenario: Non-admin user attempts to list

- **WHEN** a user with role USER sends `GET /api/default-transaction-categories`
- **THEN** the system SHALL respond with HTTP 403 Forbidden

#### Scenario: Unauthenticated request

- **WHEN** a request is sent without a valid JWT
- **THEN** the system SHALL respond with HTTP 401 Unauthorized

### Requirement: Get a single default transaction category

The system SHALL return a single default transaction category by ID, accessible only to ADMIN users.

#### Scenario: Default category found

- **WHEN** an authenticated admin sends `GET /api/default-transaction-categories/:id` with a valid ID
- **THEN** the system SHALL return the default transaction category details

#### Scenario: Default category not found

- **WHEN** an authenticated admin sends `GET /api/default-transaction-categories/:id` with a non-existent ID
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Create a default transaction category

The system SHALL allow ADMIN users to create a new default transaction category with a name, type, and optional parent default transaction category.

#### Scenario: Successful creation

- **WHEN** an authenticated admin sends `POST /api/default-transaction-categories` with a valid `name`, `type`, and optional `parentDefaultTransactionCategoryId`
- **THEN** the system SHALL create the default transaction category and return it with HTTP 201

#### Scenario: Duplicate default transaction category

- **WHEN** an admin sends a create request with a `name`, `type`, and `parentDefaultTransactionCategoryId` combination that already exists
- **THEN** the system SHALL respond with HTTP 409 Conflict

#### Scenario: Invalid parent default transaction category

- **WHEN** an admin sends a create request with a `parentDefaultTransactionCategoryId` that does not exist
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Update a default transaction category

The system SHALL allow ADMIN users to update the name or parent of a default transaction category.

#### Scenario: Successful update

- **WHEN** an authenticated admin sends `PATCH /api/default-transaction-categories/:id` with valid update fields
- **THEN** the system SHALL update the default transaction category and return the updated record

#### Scenario: Duplicate name after update

- **WHEN** an update would result in a duplicate `(name, type, parentDefaultTransactionCategoryId)` combination
- **THEN** the system SHALL respond with HTTP 409 Conflict

#### Scenario: Cycle detection

- **WHEN** an update would create a circular parent-child relationship
- **THEN** the system SHALL respond with HTTP 409 Conflict

#### Scenario: Default category not found

- **WHEN** an admin sends an update request for a non-existent default transaction category ID
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Delete a default transaction category

The system SHALL soft-delete a default transaction category by setting `deletedAt`, accessible only to ADMIN users.

#### Scenario: Successful deletion

- **WHEN** an authenticated admin sends `DELETE /api/default-transaction-categories/:id` for a default transaction category with no active children
- **THEN** the system SHALL set `deletedAt` and return HTTP 200 with a success message

#### Scenario: Default category has active children

- **WHEN** an admin sends a delete request for a default transaction category that has active child categories
- **THEN** the system SHALL respond with HTTP 409 Conflict indicating the category has subcategories

#### Scenario: Default category not found

- **WHEN** an admin sends a delete request for a non-existent default transaction category ID
- **THEN** the system SHALL respond with HTTP 404 Not Found
