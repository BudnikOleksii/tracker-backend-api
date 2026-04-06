## ADDED Requirements

### Requirement: CSRF token generation on authentication

The system SHALL generate a cryptographically random CSRF token and set it as a non-httpOnly cookie (`csrf_token`) whenever a refresh token cookie is set (login, register, refresh-token endpoints). The CSRF cookie SHALL share the same `secure`, `sameSite`, `domain`, and `path` settings as the refresh token cookie, except `httpOnly` SHALL be `false`.

#### Scenario: CSRF token set on login

- **WHEN** a user successfully logs in and `COOKIE_SAME_SITE` is `none`
- **THEN** the response SHALL include a `csrf_token` cookie with a random token value
- **AND** the cookie SHALL have `httpOnly=false` so JavaScript can read it

#### Scenario: CSRF token not set when SameSite is strict

- **WHEN** a user successfully logs in and `COOKIE_SAME_SITE` is `strict` or `lax`
- **THEN** the response SHALL NOT include a `csrf_token` cookie

### Requirement: CSRF token validation on cookie-reading endpoints

The system SHALL validate the `x-csrf-token` request header against the `csrf_token` cookie value on all endpoints that read the refresh token from cookies: `POST /auth/refresh-token`, `POST /auth/logout`, `POST /auth/revoke-refresh-tokens`. Validation SHALL only be enforced when `COOKIE_SAME_SITE` is `none`.

#### Scenario: Valid CSRF token

- **WHEN** a request to `POST /auth/refresh-token` includes a valid `x-csrf-token` header matching the `csrf_token` cookie
- **THEN** the request SHALL proceed normally

#### Scenario: Missing CSRF token when required

- **WHEN** a request to `POST /auth/logout` has no `x-csrf-token` header and `COOKIE_SAME_SITE` is `none`
- **THEN** the system SHALL respond with HTTP 403 Forbidden

#### Scenario: Mismatched CSRF token

- **WHEN** a request to `POST /auth/refresh-token` includes an `x-csrf-token` header that does not match the `csrf_token` cookie
- **THEN** the system SHALL respond with HTTP 403 Forbidden

#### Scenario: CSRF not enforced when SameSite is strict

- **WHEN** a request to `POST /auth/refresh-token` has no `x-csrf-token` header and `COOKIE_SAME_SITE` is `strict`
- **THEN** the request SHALL proceed normally (CSRF validation skipped)

### Requirement: CSRF cookie cleared on logout

The system SHALL clear the `csrf_token` cookie when the refresh token cookie is cleared (logout, revoke-refresh-tokens).

#### Scenario: CSRF cookie cleared on logout

- **WHEN** a user logs out successfully
- **THEN** both the refresh token cookie and `csrf_token` cookie SHALL be cleared
