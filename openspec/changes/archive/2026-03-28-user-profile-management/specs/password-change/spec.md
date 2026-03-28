## ADDED Requirements

### Requirement: Authenticated user can change their password

The system SHALL provide a `PATCH /profile/password` endpoint that accepts `currentPassword` and `newPassword`. The system MUST verify the current password before applying the change.

#### Scenario: Successful password change

- **WHEN** an authenticated user sends `PATCH /profile/password` with a valid `currentPassword` and a `newPassword` meeting strength requirements
- **THEN** the system hashes the new password, updates the user record, and returns HTTP 200 with a success message

#### Scenario: Incorrect current password

- **WHEN** an authenticated user sends `PATCH /profile/password` with an incorrect `currentPassword`
- **THEN** the system returns HTTP 401 with an `INVALID_CREDENTIALS` error code

#### Scenario: New password too short

- **WHEN** an authenticated user sends `PATCH /profile/password` with a `newPassword` shorter than 8 characters
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `PATCH /profile/password` without a valid JWT
- **THEN** the system returns HTTP 401 Unauthorized
