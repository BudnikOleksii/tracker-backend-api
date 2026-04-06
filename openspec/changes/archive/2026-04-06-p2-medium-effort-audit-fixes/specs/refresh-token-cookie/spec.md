## MODIFIED Requirements

### Requirement: Refresh token cookie security

The refresh token cookie endpoints SHALL validate CSRF tokens via the double-submit cookie pattern when `COOKIE_SAME_SITE` is configured as `none`. The `csrf_token` cookie SHALL be set alongside the refresh token cookie on authentication, and cleared on logout.

#### Scenario: Cross-domain refresh with CSRF

- **WHEN** a cross-domain client sends `POST /auth/refresh-token` with matching `x-csrf-token` header and `csrf_token` cookie
- **THEN** the refresh SHALL succeed and a new CSRF token SHALL be set

#### Scenario: Cross-domain refresh without CSRF

- **WHEN** a cross-domain client sends `POST /auth/refresh-token` without `x-csrf-token` header and `COOKIE_SAME_SITE` is `none`
- **THEN** the system SHALL respond with HTTP 403 Forbidden
