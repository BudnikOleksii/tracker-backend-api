## ADDED Requirements

### Requirement: Shared sort order type

The system SHALL define a shared `SortOrder` type (`'asc' | 'desc'`) and `SORT_ORDERS` constant array in `src/shared/constants/sort.constants.ts`. All modules SHALL import `SortOrder` from this shared location.

#### Scenario: Sort order values

- **WHEN** a client sends `sortOrder=asc` or `sortOrder=desc` on any collection endpoint
- **THEN** the system accepts the value and applies the corresponding ordering direction

#### Scenario: Invalid sort order rejected

- **WHEN** a client sends `sortOrder=invalid` on any collection endpoint
- **THEN** the system returns a 400 validation error

### Requirement: Per-entity sort field constants

Each module with a collection endpoint SHALL define a `SORT_BY_FIELDS` constant array and a `SortByField` type in its own `<module>.constants.ts` file. The allowed fields SHALL correspond to indexed or low-cost columns on that entity.

#### Scenario: Valid sort field accepted

- **WHEN** a client sends a `sortBy` value that exists in the entity's `SORT_BY_FIELDS`
- **THEN** the system applies ORDER BY on the corresponding database column

#### Scenario: Invalid sort field rejected

- **WHEN** a client sends a `sortBy` value not in the entity's `SORT_BY_FIELDS`
- **THEN** the system returns a 400 validation error

### Requirement: Sort parameters are optional with defaults

All `sortBy` and `sortOrder` query parameters SHALL be optional. When omitted, the repository SHALL apply a default sort that matches the current hardcoded ordering for backwards compatibility.

#### Scenario: No sort parameters provided

- **WHEN** a client calls a collection endpoint without `sortBy` or `sortOrder`
- **THEN** the response is ordered by the entity's default sort (same as current behavior)

#### Scenario: Only sortOrder provided

- **WHEN** a client provides `sortOrder` but not `sortBy`
- **THEN** the system uses the default `sortBy` field with the provided `sortOrder`

### Requirement: Repository sort column map

Each repository SHALL define a `SORT_COLUMN_MAP` object that maps allowed `sortBy` string values to Drizzle column references. Only mapped columns SHALL be sortable, preventing arbitrary column access.

#### Scenario: Sort column mapping

- **WHEN** the repository receives `sortBy='createdAt'`
- **THEN** it resolves to the Drizzle schema's `createdAt` column via `SORT_COLUMN_MAP` and applies ORDER BY on it
