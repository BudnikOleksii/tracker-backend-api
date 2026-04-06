## MODIFIED Requirements

### Requirement: Controllers use shared pagination helper

All 7 paginated list endpoints SHALL use `buildPaginatedResponse()` instead of inline pagination calculation. The `@UseEnvelope()` decorator and `TransformInterceptor` SHALL be removed entirely (global registration in `main.ts`, interceptor file, decorator file, and all 7 usages).

#### Scenario: Controller returns paginated response via helper

- **WHEN** a paginated list endpoint (e.g., `GET /api/transactions`) is called
- **THEN** the controller delegates pagination envelope construction to `buildPaginatedResponse(query, result)` and returns its output

#### Scenario: TransformInterceptor and UseEnvelope are removed

- **WHEN** the codebase is searched for `TransformInterceptor` or `UseEnvelope`
- **THEN** no references exist in any source file
