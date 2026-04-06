## MODIFIED Requirements

### Requirement: Unique index prevents duplicate root categories

The unique index on `TransactionCategory(userId, name, type, parentCategoryId)` SHALL use `NULLS NOT DISTINCT` so that two root categories (where `parentCategoryId IS NULL`) with the same `userId`, `name`, and `type` are rejected by the database.

#### Scenario: Attempt to create duplicate root category

- **WHEN** a user creates a category with `name='Food'`, `type='EXPENSE'`, `parentCategoryId=NULL` and one already exists
- **THEN** the database rejects the insert with a unique constraint violation
