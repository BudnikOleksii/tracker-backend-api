## ADDED Requirements

### Requirement: Shared pagination response builder

The system SHALL provide a `buildPaginatedResponse(query, result)` utility function in `src/shared/utils/pagination.utils.ts` that computes `page`, `pageSize`, `totalPages`, and `hasMore` from pagination query params and a `{ data, total }` result object.

#### Scenario: Build paginated response with defaults

- **WHEN** `buildPaginatedResponse({ page: undefined, pageSize: undefined }, { data: items, total: 50 })` is called
- **THEN** it returns `{ object: 'list', data: items, total: 50, page: 1, pageSize: 20, totalPages: 3, hasMore: true }`

#### Scenario: Build paginated response on last page

- **WHEN** `buildPaginatedResponse({ page: 3, pageSize: 20 }, { data: items, total: 50 })` is called
- **THEN** it returns `{ ..., page: 3, totalPages: 3, hasMore: false }`

#### Scenario: Build paginated response with empty result

- **WHEN** `buildPaginatedResponse({ page: 1, pageSize: 20 }, { data: [], total: 0 })` is called
- **THEN** it returns `{ ..., total: 0, page: 1, totalPages: 0, hasMore: false }`
