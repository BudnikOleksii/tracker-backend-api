## MODIFIED Requirements

### Requirement: TransactionResponseDto matches TransactionInfo shape

A `TransactionResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `categoryId`, `type`, `amount`, `currencyCode`, `date`, `description`, `recurringTransactionId`, `createdAt`, `updatedAt`, and `category`. The `category` field SHALL be typed as `CategoryInfoDto` and decorated with `@ApiProperty`.

#### Scenario: POST /transactions returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /transactions`
- **THEN** the response schema for status 201 SHALL reference `TransactionResponseDto` including the nested `category` object

#### Scenario: GET /transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `TransactionResponseDto` including the nested `category` object

#### Scenario: PATCH /transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `TransactionResponseDto` including the nested `category` object

### Requirement: RecurringTransactionResponseDto matches RecurringTransactionInfo shape

A `RecurringTransactionResponseDto` class SHALL exist with `@ApiProperty` decorators on all fields: `id`, `userId`, `categoryId`, `type`, `amount`, `currencyCode`, `description`, `frequency`, `interval`, `startDate`, `endDate`, `nextOccurrenceDate`, `status`, `createdAt`, `updatedAt`, and `category`. The `category` field SHALL be typed as `CategoryInfoDto` and decorated with `@ApiProperty`.

#### Scenario: POST /recurring-transactions returns typed response

- **WHEN** the OpenAPI spec is generated for `POST /recurring-transactions`
- **THEN** the response schema for status 201 SHALL reference `RecurringTransactionResponseDto` including the nested `category` object

#### Scenario: GET /recurring-transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /recurring-transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionResponseDto` including the nested `category` object

#### Scenario: PATCH /recurring-transactions/:id returns typed response

- **WHEN** the OpenAPI spec is generated for `PATCH /recurring-transactions/:id`
- **THEN** the response schema for status 200 SHALL reference `RecurringTransactionResponseDto` including the nested `category` object

## ADDED Requirements

### Requirement: CategoryInfoDto for embedded category details

A shared `CategoryInfoDto` class SHALL exist in `src/shared/dtos/` with `@ApiProperty` decorators on: `id` (string), `name` (string), and `parentCategory` (typed as `ParentCategoryInfoDto` or null). A `ParentCategoryInfoDto` class SHALL exist with `@ApiProperty` decorators on: `id` (string) and `name` (string).

#### Scenario: CategoryInfoDto properties are fully decorated

- **WHEN** `CategoryInfoDto` is inspected
- **THEN** every property SHALL have `@ApiProperty` with non-empty `description` and `example`

#### Scenario: ParentCategoryInfoDto properties are fully decorated

- **WHEN** `ParentCategoryInfoDto` is inspected
- **THEN** every property SHALL have `@ApiProperty` with non-empty `description` and `example`
