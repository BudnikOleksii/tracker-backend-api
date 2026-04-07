## ADDED Requirements

### Requirement: Budget list sorting

The `GET /api/budgets` endpoint SHALL accept optional `sortBy` and `sortOrder` query parameters. Allowed `sortBy` values: `amount`, `startDate`, `endDate`, `createdAt`. Default sort: `createdAt` descending.

#### Scenario: Sort budgets by amount ascending

- **WHEN** a client calls `GET /api/budgets?sortBy=amount&sortOrder=asc`
- **THEN** budgets are returned sorted by amount ascending

#### Scenario: Sort budgets by start date

- **WHEN** a client calls `GET /api/budgets?sortBy=startDate&sortOrder=desc`
- **THEN** budgets are returned sorted by start date descending

#### Scenario: Default budget sort

- **WHEN** a client calls `GET /api/budgets` without sort parameters
- **THEN** budgets are returned sorted by `createdAt` descending
