## ADDED Requirements

### Requirement: Social login service method

The auth service SHALL expose a `socialLogin` method that handles user lookup, creation, and account linking for social authentication.

#### Scenario: Existing user matched by provider ID

- **WHEN** `socialLogin` is called with a provider and provider ID that match an existing user
- **THEN** the system MUST log the user in and issue tokens without modifying user data

#### Scenario: Existing user matched by email (conflict)

- **WHEN** `socialLogin` is called with an email that matches an existing user but no provider ID match
- **THEN** the system MUST reject the login with an `EMAIL_EXISTS` error code
- **AND** the system MUST log the attempt with `failReason: 'email_already_exists'`

#### Scenario: No existing user (new registration)

- **WHEN** `socialLogin` is called with an email and provider ID that match no existing user
- **THEN** the system MUST create a new user with `authProvider`, `authProviderId`, email, and name from the social profile
- **AND** the new user MUST have `passwordHash` set to null
- **AND** the new user MUST have `emailVerified` set to true (provider verified the email)
- **AND** the system MUST issue tokens for the new user

### Requirement: Auth provider enum in database schema

The users table SHALL have an `authProvider` column using an enum with values `LOCAL`, `GOOGLE`, `GITHUB`.

#### Scenario: Default value for existing users

- **WHEN** the migration runs on an existing database
- **THEN** all existing users MUST have `authProvider` set to `LOCAL`

#### Scenario: Column constraints

- **WHEN** a new user is created
- **THEN** `authProvider` MUST default to `LOCAL` and MUST NOT be null

### Requirement: Auth provider ID in database schema

The users table SHALL have an `authProviderId` column of type text that is nullable.

#### Scenario: Uniqueness constraint

- **WHEN** a social user is created or linked
- **THEN** the combination of `authProvider` and `authProviderId` MUST be unique (compound unique index) where `authProviderId` is not null

#### Scenario: Local users have no provider ID

- **WHEN** a user registers via email/password
- **THEN** `authProviderId` MUST be null

### Requirement: Password hash is nullable for social users

The `passwordHash` column on the users table SHALL be nullable to support social-only accounts.

#### Scenario: Social-only user has no password

- **WHEN** a user is created via social login
- **THEN** `passwordHash` MUST be null

#### Scenario: Email/password user cannot link social account

- **WHEN** a social login is attempted with an email that matches an existing email/password user
- **THEN** the system MUST reject with `EMAIL_EXISTS` error (no auto-linking for security)

#### Scenario: Login validation for social-only users

- **WHEN** a social-only user attempts email/password login
- **THEN** the system MUST reject the login with a `social_account` fail reason indicating they should use their social provider

### Requirement: Social login issues standard tokens

Social login MUST use the same `generateTokens` method as email/password login to issue JWT access tokens and refresh token cookies.

#### Scenario: Token structure matches email/password login

- **WHEN** a user logs in via social auth
- **THEN** the JWT access token MUST contain the same claims (`sub`, `email`, `role`, `sessionId`, `jti`) as email/password login
- **AND** a refresh token cookie MUST be set with the same configuration

#### Scenario: Device context captured

- **WHEN** a social login succeeds
- **THEN** the refresh token MUST be associated with the request's IP address and user agent

### Requirement: Social auth redirect URL

The system SHALL use a `SOCIAL_AUTH_REDIRECT_URL` environment variable to determine where to redirect after successful social authentication.

#### Scenario: Redirect after success

- **WHEN** social authentication succeeds
- **THEN** the server MUST store the auth result in Redis with a short-lived authorization code (60s TTL)
- **AND** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `code` as a query parameter
- **AND** the frontend MUST exchange the code via `POST /auth/social/exchange` to receive the access token and refresh token cookie

#### Scenario: Redirect after failure

- **WHEN** social authentication fails
- **THEN** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `error` and `reason` as query parameters

#### Scenario: Environment validation

- **WHEN** any social provider is configured
- **THEN** `SOCIAL_AUTH_REDIRECT_URL` MUST also be configured and MUST be a valid URL
