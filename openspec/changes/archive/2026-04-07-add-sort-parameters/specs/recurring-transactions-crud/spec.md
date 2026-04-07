## ADDED Requirements

### Requirement: Recurring transaction list sorting

The `GET /api/recurring-transactions` endpoint SHALL accept optional `sortBy` and `sortOrder` query parameters. Allowed `sortBy` values: `amount`, `startDate`, `nextOccurrenceDate`, `createdAt`. Default sort: `createdAt` descending.

#### Scenario: Sort by next occurrence date

- **WHEN** a client calls `GET /api/recurring-transactions?sortBy=nextOccurrenceDate&sortOrder=asc`
- **THEN** recurring transactions are returned sorted by next occurrence date ascending

#### Scenario: Sort by amount descending

- **WHEN** a client calls `GET /api/recurring-transactions?sortBy=amount&sortOrder=desc`
- **THEN** recurring transactions are returned sorted by amount descending

#### Scenario: Default recurring transaction sort

- **WHEN** a client calls `GET /api/recurring-transactions` without sort parameters
- **THEN** recurring transactions are returned sorted by `createdAt` descending
