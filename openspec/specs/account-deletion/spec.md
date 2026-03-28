## ADDED Requirements

### Requirement: Authenticated user can delete their own account

The system SHALL provide a `DELETE /profile` endpoint that soft-deletes the authenticated user's account. The system MUST require password confirmation in the request body. Upon deletion, the system MUST revoke all active refresh tokens for the user.

#### Scenario: Successful account deletion

- **WHEN** an authenticated user sends `DELETE /profile` with a valid `password`
- **THEN** the system sets `deletedAt` on the user record, revokes all refresh tokens, and returns HTTP 200 with a confirmation message

#### Scenario: Incorrect password

- **WHEN** an authenticated user sends `DELETE /profile` with an incorrect `password`
- **THEN** the system returns HTTP 401 with an `INVALID_CREDENTIALS` error code and the account is NOT deleted

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `DELETE /profile` without a valid JWT
- **THEN** the system returns HTTP 401 Unauthorized
