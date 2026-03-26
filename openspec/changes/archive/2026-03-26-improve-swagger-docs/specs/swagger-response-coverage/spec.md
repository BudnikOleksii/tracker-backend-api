## ADDED Requirements

### Requirement: All auth endpoints have typed ApiResponse decorators

Every endpoint in the auth controller SHALL have `@ApiResponse` decorators specifying the HTTP status code and a typed response DTO class. Endpoints returning inline objects SHALL have dedicated response DTOs created.

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
