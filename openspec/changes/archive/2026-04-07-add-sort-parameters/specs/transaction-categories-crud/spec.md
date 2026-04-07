## ADDED Requirements

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
