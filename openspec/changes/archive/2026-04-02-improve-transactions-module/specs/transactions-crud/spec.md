## MODIFIED Requirements

### Requirement: List transactions with pagination

The system SHALL return a paginated list of the authenticated user's transactions, excluding soft-deleted records. The response MUST include `data`, `total`, `page`, `pageSize`, and `hasMore` fields. The system SHALL support optional `sortBy` (`date`, `amount`, `createdAt`) and `sortOrder` (`asc`, `desc`) query parameters. When omitted, the default sort is `date` descending.

#### Scenario: Default pagination

- **WHEN** an authenticated user sends a GET request to `/transactions` without pagination params
- **THEN** the system returns page 1 with pageSize 20, sorted by date descending

#### Scenario: Custom pagination

- **WHEN** the user provides `page` and `pageSize` query parameters
- **THEN** the system returns the requested page with the specified size (max 100)

#### Scenario: Custom sort order

- **WHEN** the user provides `sortBy` and/or `sortOrder` query parameters
- **THEN** the system returns results sorted by the specified field and direction
