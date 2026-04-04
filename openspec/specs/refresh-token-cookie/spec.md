### Requirement: Refresh token set as HTTP-only cookie on authentication

The system SHALL set the refresh token as an HTTP-only, Secure cookie when a user successfully registers, logs in, or refreshes their token. The cookie MUST have `HttpOnly`, `Secure`, `SameSite`, `Path`, and `Max-Age` attributes configured. The refresh token MUST NOT appear in the JSON response body.

#### Scenario: Successful login sets refresh token cookie

- **WHEN** a user sends valid credentials to `POST /auth/login`
- **THEN** the response sets a `Set-Cookie` header with the refresh token, `HttpOnly=true`, `Secure` per config, `SameSite` per config, and `Path=/auth`
- **AND** the JSON response body contains only `accessToken` and `user` (no `refreshToken` field)

#### Scenario: Successful registration sets refresh token cookie

- **WHEN** a user sends valid registration data to `POST /auth/register`
- **THEN** the response sets a `Set-Cookie` header with the refresh token using the same cookie attributes
- **AND** the JSON response body contains only `accessToken` and `user`

#### Scenario: Successful token refresh sets new refresh token cookie

- **WHEN** a valid refresh token cookie is sent with `POST /auth/refresh-token`
- **THEN** the response sets a new `Set-Cookie` header with the rotated refresh token
- **AND** the JSON response body contains only `accessToken` and `user`

### Requirement: Refresh token read from cookie on refresh endpoint

The system SHALL read the refresh token from the HTTP-only cookie on the `POST /auth/refresh-token` endpoint. The endpoint MUST NOT accept a refresh token in the request body.

#### Scenario: Refresh token is read from cookie

- **WHEN** a request to `POST /auth/refresh-token` includes a valid refresh token cookie
- **THEN** the system reads the token from the cookie, rotates it, and returns new credentials

#### Scenario: Missing refresh token cookie returns 401

- **WHEN** a request to `POST /auth/refresh-token` has no refresh token cookie
- **THEN** the system responds with HTTP 401 Unauthorized

#### Scenario: Invalid refresh token cookie returns 401

- **WHEN** a request to `POST /auth/refresh-token` includes an expired or invalid refresh token cookie
- **THEN** the system responds with HTTP 401 Unauthorized

### Requirement: Refresh token read from cookie on logout endpoint

The system SHALL read the refresh token from the HTTP-only cookie on the `POST /auth/logout` endpoint. The endpoint MUST NOT accept a refresh token in the request body.

#### Scenario: Logout reads token from cookie and clears it

- **WHEN** an authenticated user sends `POST /auth/logout` with a valid refresh token cookie
- **THEN** the system revokes the token, clears the refresh token cookie, and returns a success response

#### Scenario: Logout without refresh token cookie

- **WHEN** an authenticated user sends `POST /auth/logout` without a refresh token cookie
- **THEN** the system responds with HTTP 401 Unauthorized

### Requirement: Cookie cleared on logout and revoke-all

The system SHALL clear the refresh token cookie when a user logs out or revokes all sessions.

#### Scenario: Revoke all sessions clears cookie

- **WHEN** an authenticated user sends `POST /auth/revoke-refresh-tokens`
- **THEN** the system revokes all sessions and clears the refresh token cookie

### Requirement: Cookie configuration via environment variables

The system SHALL support configuring cookie attributes via environment variables with sensible defaults.

#### Scenario: Default cookie configuration

- **WHEN** no cookie-specific environment variables are set
- **THEN** the system uses defaults: cookie name `refresh_token`, path `/auth`, secure `true`, same-site `strict`

#### Scenario: Custom cookie domain

- **WHEN** `COOKIE_DOMAIN` environment variable is set
- **THEN** the `Domain` attribute of the refresh token cookie matches the configured value

### Requirement: Cookie-parser middleware enabled

The system SHALL enable cookie parsing middleware so that incoming cookies are available on the request object.

#### Scenario: Cookies are parsed on incoming requests

- **WHEN** any request with cookies arrives at the server
- **THEN** the cookies are parsed and available via `req.cookies`
