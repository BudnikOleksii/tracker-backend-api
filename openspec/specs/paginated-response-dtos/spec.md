## ADDED Requirements

### Requirement: Shared paginated list response base fields

All paginated list response DTOs SHALL include the following fields with `@ApiProperty` decorators: `object` (literal `'list'`), `data` (typed array), `total` (number), `page` (number), `pageSize` (number), `hasMore` (boolean).

#### Scenario: Paginated response DTO has all envelope fields

- **WHEN** any paginated list response DTO is inspected
- **THEN** it SHALL have `@ApiProperty` decorators on `object`, `data`, `total`, `page`, `pageSize`, and `hasMore` fields with appropriate types and examples

### Requirement: Transaction list response DTO

A `TransactionListResponseDto` SHALL exist with a `data` field typed as `TransactionResponseDto[]`.

#### Scenario: GET /transactions returns typed paginated response

- **WHEN** the OpenAPI spec is generated for `GET /transactions`
- **THEN** the response schema for status 200 SHALL reference `TransactionListResponseDto` with `data` as an array of `TransactionResponseDto`

### Requirement: Category list response DTO

A `CategoryListResponseDto` SHALL exist with a `data` field typed as `CategoryResponseDto[]`.

#### Scenario: GET /transaction-categories returns typed paginated response

- **WHEN** the OpenAPI spec is generated for `GET /transaction-categories`
- **THEN** the response schema for status 200 SHALL reference `CategoryListResponseDto` with `data` as an array of `CategoryResponseDto`

### Requirement: Budget list response DTO

A `BudgetListResponseDto` SHALL exist with a `data` field typed as `BudgetResponseDto[]`.

#### Scenario: GET /budgets returns typed paginated response

- **WHEN** the OpenAPI spec is generated for `GET /budgets`
- **THEN** the response schema for status 200 SHALL reference `BudgetListResponseDto` with `data` as an array of `BudgetResponseDto`

### Requirement: Recurring transaction list response DTO

A `RecurringTransactionListResponseDto` SHALL exist with a `data` field typed as `RecurringTransactionResponseDto[]`.

#### Scenario: GET /recurring-transactions returns typed paginated response

- **WHEN** the OpenAPI spec is generated for `GET /recurring-transactions`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionListResponseDto` with `data` as an array of `RecurringTransactionResponseDto`

### Requirement: User list response DTO

A `UserListResponseDto` SHALL exist with a `data` field typed as `UserResponseDto[]`.

#### Scenario: GET /users returns typed paginated response

- **WHEN** the OpenAPI spec is generated for `GET /users`
- **THEN** the response schema for status 200 SHALL reference `UserListResponseDto` with `data` as an array of `UserResponseDto`

### Requirement: Audit log list response DTO

An `AuditLogListResponseDto` SHALL exist with a `data` field typed as `AuditLogResponseDto[]`.

#### Scenario: GET /audit-log returns typed paginated response

- **WHEN** the OpenAPI spec is generated for `GET /audit-log`
- **THEN** the response schema for status 200 SHALL reference `AuditLogListResponseDto` with `data` as an array of `AuditLogResponseDto`
