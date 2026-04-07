## ADDED Requirements

### Requirement: Default transaction category list sorting

The `GET /api/default-transaction-categories` endpoint SHALL accept optional `sortBy` and `sortOrder` query parameters. Allowed `sortBy` values: `name`, `createdAt`. Default sort: `name` ascending.

#### Scenario: Sort default categories by name descending

- **WHEN** a client calls `GET /api/default-transaction-categories?sortBy=name&sortOrder=desc`
- **THEN** default categories are returned sorted by name descending

#### Scenario: Default category sort preserved

- **WHEN** a client calls `GET /api/default-transaction-categories` without sort parameters
- **THEN** default categories are returned sorted by `name` ascending
