## ADDED Requirements

### Requirement: Authenticated user can update their profile

The system SHALL provide a `PATCH /profile` endpoint that allows the authenticated user to update their `firstName`, `lastName`, `countryCode`, and `baseCurrencyCode` fields. All fields SHALL be optional in the request body.

#### Scenario: Successful profile update

- **WHEN** an authenticated user sends `PATCH /profile` with valid fields (e.g., `{ "firstName": "John", "baseCurrencyCode": "EUR" }`)
- **THEN** the system updates the specified fields and returns HTTP 200 with the updated profile data

#### Scenario: Partial update

- **WHEN** an authenticated user sends `PATCH /profile` with only `{ "firstName": "Jane" }`
- **THEN** only the `firstName` field is updated; all other fields remain unchanged

#### Scenario: Invalid country or currency code

- **WHEN** an authenticated user sends `PATCH /profile` with an invalid `countryCode` or `baseCurrencyCode`
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Empty request body

- **WHEN** an authenticated user sends `PATCH /profile` with an empty body `{}`
- **THEN** the system returns HTTP 200 with the unchanged profile (no-op)

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `PATCH /profile` without a valid JWT
- **THEN** the system returns HTTP 401 Unauthorized
