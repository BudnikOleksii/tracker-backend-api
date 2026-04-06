## ADDED Requirements

### Requirement: All auth endpoints have typed ApiResponse decorators

Every endpoint in the auth controller SHALL have `@ApiResponse` decorators specifying the HTTP status code and a typed response DTO class. Endpoints returning inline objects SHALL have dedicated response DTOs created. The `AuthResponseDto` nested `user` object SHALL be extracted into a dedicated `AuthUserDto` class with `@ApiProperty` decorators on `id`, `email`, and `role`.

#### Scenario: Logout endpoint documents response type

- **WHEN** the OpenAPI spec is generated for `POST /auth/logout`
- **THEN** the response schema for status 200 SHALL reference `LogoutResponseDto` with properties `success` (boolean) and `message` (string)

#### Scenario: Revoke single refresh token documents response type

- **WHEN** the OpenAPI spec is generated for `POST /auth/revoke-refresh-token`
- **THEN** the response schema for status 200 SHALL reference `RevokeTokenResponseDto` with properties `success` (boolean) and `message` (string)

#### Scenario: Revoke all refresh tokens documents response type

- **WHEN** the OpenAPI spec is generated for `POST /auth/revoke-refresh-tokens`
- **THEN** the response schema for status 200 SHALL reference `RevokeAllTokensResponseDto` with properties `revokedCount` (number) and `message` (string)

#### Scenario: Get single refresh token documents response type

- **WHEN** the OpenAPI spec is generated for `GET /auth/refresh-token`
- **THEN** the response schema for status 200 SHALL reference a typed DTO describing the refresh token info

#### Scenario: Get all refresh tokens documents response type

- **WHEN** the OpenAPI spec is generated for `GET /auth/refresh-tokens`
- **THEN** the response schema for status 200 SHALL reference a typed DTO describing a list of refresh tokens

#### Scenario: AuthResponseDto user field is a typed class

- **WHEN** `AuthResponseDto` is inspected
- **THEN** the `user` property SHALL have `@ApiProperty({ type: AuthUserDto })` referencing a dedicated class with decorated `id`, `email`, and `role` fields

### Requirement: User summary endpoint has typed ApiResponse decorator

The `GET /users/summary` endpoint SHALL have an `@ApiResponse` decorator with a typed `UserSummaryResponseDto`.

#### Scenario: User summary documents response type

- **WHEN** the OpenAPI spec is generated for `GET /users/summary`
- **THEN** the response schema for status 200 SHALL reference `UserSummaryResponseDto` with properties matching the actual return shape of the endpoint

### Requirement: New response DTOs include ApiProperty descriptions

All newly created response DTOs SHALL have `@ApiProperty` decorators with both `description` and `example` fields on every property.

#### Scenario: LogoutResponseDto has described properties

- **WHEN** `LogoutResponseDto` is inspected
- **THEN** every property SHALL have an `@ApiProperty` decorator with a non-empty `description` and an `example` value

#### Scenario: UserSummaryResponseDto has described properties

- **WHEN** `UserSummaryResponseDto` is inspected
- **THEN** every property SHALL have an `@ApiProperty` decorator with a non-empty `description` and an `example` value

### Requirement: All controller endpoints have typed ApiResponse decorators

Every endpoint across all controllers (transactions, transaction-categories, budgets, recurring-transactions, transactions-analytics, audit-log, users) SHALL have `@ApiResponse` decorators specifying the HTTP status code and a typed response DTO class.

#### Scenario: No untyped ApiResponse decorators remain

- **WHEN** the OpenAPI spec is generated for the entire API
- **THEN** every endpoint SHALL have a response schema with a `$ref` to a named DTO for its success status code

#### Scenario: List endpoints reference paginated response DTOs

- **WHEN** the OpenAPI spec is generated for any list endpoint (GET /transactions, GET /budgets, etc.)
- **THEN** the response schema SHALL reference the module's `*ListResponseDto` containing typed `data`, `total`, `page`, `pageSize`, `hasMore` fields

#### Scenario: Delete endpoints reference MessageResponseDto

- **WHEN** the OpenAPI spec is generated for any delete endpoint (except DELETE /users/:id which is 204)
- **THEN** the response schema SHALL reference `MessageResponseDto` with a `message` string field

### Requirement: Swagger disabled in production

The `setupSwagger()` function SHALL NOT be called when `NODE_ENV` is `'production'`. The `/swagger`, `/docs`, and `/openapi.yaml` routes MUST NOT be registered in production environments.

#### Scenario: Development environment

- **WHEN** the application starts with `NODE_ENV=development`
- **THEN** Swagger UI at `/swagger`, Scalar docs at `/docs`, and OpenAPI YAML at `/openapi.yaml` are available

#### Scenario: Production environment

- **WHEN** the application starts with `NODE_ENV=production`
- **THEN** requests to `/swagger`, `/docs`, and `/openapi.yaml` return 404
