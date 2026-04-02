### Requirement: Sort transactions by field and direction

The system SHALL support optional `sortBy` and `sortOrder` query parameters on `GET /transactions`. The `sortBy` parameter SHALL accept `date`, `amount`, or `createdAt`. The `sortOrder` parameter SHALL accept `asc` or `desc`. When omitted, the system SHALL default to `sortBy=date` and `sortOrder=desc`.

#### Scenario: Default sort order (no params)

- **WHEN** an authenticated user sends a GET request to `/transactions` without `sortBy` or `sortOrder` parameters
- **THEN** the system returns transactions sorted by `date` in descending order

#### Scenario: Sort by date ascending

- **WHEN** an authenticated user sends a GET request to `/transactions?sortBy=date&sortOrder=asc`
- **THEN** the system returns transactions sorted by `date` in ascending order

#### Scenario: Sort by amount descending

- **WHEN** an authenticated user sends a GET request to `/transactions?sortBy=amount&sortOrder=desc`
- **THEN** the system returns transactions sorted by `amount` in descending order (highest first)

#### Scenario: Sort by createdAt ascending

- **WHEN** an authenticated user sends a GET request to `/transactions?sortBy=createdAt&sortOrder=asc`
- **THEN** the system returns transactions sorted by `createdAt` in ascending order (oldest first)

#### Scenario: Sort combined with filters

- **WHEN** an authenticated user sends a GET request with both filter parameters (e.g., `type=EXPENSE`) and sort parameters (e.g., `sortBy=amount&sortOrder=asc`)
- **THEN** the system applies the filters first, then returns the filtered results in the specified sort order

#### Scenario: Invalid sortBy value

- **WHEN** an authenticated user sends a GET request with an invalid `sortBy` value (e.g., `sortBy=name`)
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Invalid sortOrder value

- **WHEN** an authenticated user sends a GET request with an invalid `sortOrder` value (e.g., `sortOrder=random`)
- **THEN** the system returns HTTP 400 with a validation error
