## MODIFIED Requirements

### Requirement: Unique index prevents duplicate default root categories

The unique index on `DefaultTransactionCategory(name, type, parentDefaultTransactionCategoryId)` SHALL use `NULLS NOT DISTINCT` so that two default root categories with the same `name` and `type` are rejected by the database.

#### Scenario: Attempt to create duplicate default root category

- **WHEN** an admin creates a default category with `name='Food'`, `type='EXPENSE'`, `parentDefaultTransactionCategoryId=NULL` and one already exists
- **THEN** the database rejects the insert with a unique constraint violation
