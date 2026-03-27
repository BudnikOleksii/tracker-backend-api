## ADDED Requirements

### Requirement: TransactionResponseDto matches TransactionInfo shape

A `TransactionResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `categoryId`, `type`, `amount`, `currencyCode`, `date`, `description`, `recurringTransactionId`, `createdAt`, `updatedAt`.

#### Scenario: POST /transactions returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /transactions`
- **THEN** the response schema for status 201 SHALL reference `TransactionResponseDto`

#### Scenario: GET /transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `TransactionResponseDto`

#### Scenario: PATCH /transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `TransactionResponseDto`

### Requirement: CategoryResponseDto matches CategoryInfo shape

A `CategoryResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `name`, `type`, `parentCategoryId`, `createdAt`, `updatedAt`.

#### Scenario: POST /transaction-categories returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /transaction-categories`
- **THEN** the response schema for status 201 SHALL reference `CategoryResponseDto`

#### Scenario: GET /transaction-categories/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transaction-categories/:id`
- **THEN** the response schema for status 200 SHALL reference `CategoryResponseDto`

#### Scenario: PATCH /transaction-categories/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /transaction-categories/:id`
- **THEN** the response schema for status 200 SHALL reference `CategoryResponseDto`

### Requirement: BudgetResponseDto matches BudgetInfo shape

A `BudgetResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `userId`, `categoryId`, `amount`, `currencyCode`, `period`, `startDate`, `endDate`, `status`, `description`, `createdAt`, `updatedAt`.

#### Scenario: POST /budgets returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /budgets`
- **THEN** the response schema for status 201 SHALL reference `BudgetResponseDto`

#### Scenario: GET /budgets/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /budgets/:id`
- **THEN** the response schema for status 200 SHALL reference `BudgetResponseDto`

#### Scenario: PATCH /budgets/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /budgets/:id`
- **THEN** the response schema for status 200 SHALL reference `BudgetResponseDto`

### Requirement: BudgetProgressResponseDto matches BudgetProgress shape

A `BudgetProgressResponseDto` class SHALL exist with `@ApiProperty` decorators on: `budget` (typed as `BudgetResponseDto`), `spentAmount`, `remainingAmount`, `percentUsed`.

#### Scenario: GET /budgets/:id/progress returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /budgets/:id/progress`
- **THEN** the response schema for status 200 SHALL reference `BudgetProgressResponseDto`

### Requirement: RecurringTransactionResponseDto matches RecurringTransactionInfo shape

A `RecurringTransactionResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `userId`, `categoryId`, `type`, `amount`, `currencyCode`, `description`, `frequency`, `interval`, `startDate`, `endDate`, `nextOccurrenceDate`, `status`, `createdAt`, `updatedAt`.

#### Scenario: POST /recurring-transactions returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /recurring-transactions`
- **THEN** the response schema for status 201 SHALL reference `RecurringTransactionResponseDto`

#### Scenario: GET /recurring-transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /recurring-transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionResponseDto`

#### Scenario: PATCH /recurring-transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /recurring-transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionResponseDto`

#### Scenario: POST /recurring-transactions/:id/pause returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /recurring-transactions/:id/pause`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionResponseDto`

#### Scenario: POST /recurring-transactions/:id/resume returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /recurring-transactions/:id/resume`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionResponseDto`

### Requirement: UserResponseDto matches UserInfo shape

A `UserResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `email`, `role`, `createdAt`, `updatedAt`.

#### Scenario: GET /users/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /users/:id`
- **THEN** the response schema for status 200 SHALL reference `UserResponseDto`

#### Scenario: PATCH /users/:id/role returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /users/:id/role`
- **THEN** the response schema for status 200 SHALL reference `UserResponseDto`

### Requirement: AuditLogResponseDto matches AuditLogRecord shape

An `AuditLogResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `action`, `actorId`, `actorEmail`, `resourceType`, `resourceId`, `detail`, `ipAddress`, `userAgent`, `requestId`, `createdAt`.

#### Scenario: Audit log item DTO has all fields decorated

- **WHEN** `AuditLogResponseDto` is inspected
- **THEN** every property SHALL have an `@ApiProperty` decorator with `description` and `example`

### Requirement: MessageResponseDto for simple message responses

A shared `MessageResponseDto` SHALL exist in `src/shared/dtos/` with a single `message` field decorated with `@ApiProperty`.

#### Scenario: DELETE /transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `DELETE /transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `MessageResponseDto`

#### Scenario: DELETE /transaction-categories/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `DELETE /transaction-categories/:id`
- **THEN** the response schema for status 200 SHALL reference `MessageResponseDto`

#### Scenario: DELETE /budgets/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `DELETE /budgets/:id`
- **THEN** the response schema for status 200 SHALL reference `MessageResponseDto`

#### Scenario: DELETE /recurring-transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `DELETE /recurring-transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `MessageResponseDto`

#### Scenario: DELETE /users/:id returns no content

- **WHEN** the OpenAPI spec is generated for `DELETE /users/:id`
- **THEN** the response for status 204 SHALL have no body schema

### Requirement: All response DTOs have ApiProperty with description and example

Every property on every newly created response DTO SHALL have an `@ApiProperty` decorator with both a `description` and an `example` value.

#### Scenario: TransactionResponseDto properties are fully decorated

- **WHEN** `TransactionResponseDto` is inspected
- **THEN** every property SHALL have `@ApiProperty` with non-empty `description` and `example`

#### Scenario: BudgetResponseDto properties are fully decorated

- **WHEN** `BudgetResponseDto` is inspected
- **THEN** every property SHALL have `@ApiProperty` with non-empty `description` and `example`
