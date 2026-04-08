## MODIFIED Requirements

### Requirement: List recurring transactions with pagination

The system SHALL return a paginated list of the authenticated user's recurring transactions. The response MUST include `data`, `total`, `page`, `pageSize`, and `hasMore` fields. Each recurring transaction in the `data` array SHALL include a nested `category` object with `id`, `name`, and `parentCategory` (null or `{ id, name }`).

#### Scenario: Default pagination

- **WHEN** an authenticated user sends a GET request to `/recurring-transactions` without pagination params
- **THEN** the system returns page 1 with pageSize 20, with category details on each item

#### Scenario: Custom pagination

- **WHEN** the user provides `page` and `pageSize` query parameters
- **THEN** the system returns the requested page with the specified size (max 100), with category details on each item
