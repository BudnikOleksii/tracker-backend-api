## ADDED Requirements

### Requirement: Social login service method

The auth service SHALL expose a `socialLogin` method that handles user lookup, creation, and account linking for social authentication, supporting multiple identities per user.

#### Scenario: Existing user matched by provider identity

- **WHEN** `socialLogin` is called with a `provider` and `providerId` that match a row in `UserAuthIdentity`
- **THEN** the system MUST log the user bound to that identity in and issue tokens without modifying user data

#### Scenario: Existing user matched by email, both sides verified

- **WHEN** `socialLogin` is called with an email that matches an existing user that has no identity for the incoming provider
- **AND** the existing user's `emailVerified` is `true`
- **AND** the provider reports the email as verified (`emailVerified: true` in the social login params)
- **THEN** the system MUST insert a new `UserAuthIdentity` row linking `provider` and `providerId` to the existing user
- **AND** the system MUST issue tokens for that existing user and return `isNewUser: false`
- **AND** the system MUST log the attempt with `status: 'SUCCESS'`

#### Scenario: Existing user matched by email, local email unverified

- **WHEN** `socialLogin` is called with an email that matches an existing user whose `emailVerified` is `false`
- **THEN** the system MUST reject the login with a `CONFLICT`-class error carrying code `EMAIL_UNVERIFIED_LOCAL`
- **AND** the system MUST log the attempt with `failReason: 'email_unverified_local'`
- **AND** the system MUST NOT create any identity row

#### Scenario: Existing user matched by email, provider email unverified

- **WHEN** `socialLogin` is called with an email that matches an existing user with `emailVerified: true`
- **AND** the provider reports the email as not verified (`emailVerified: false`)
- **THEN** the system MUST reject the login with a `CONFLICT`-class error carrying code `EMAIL_UNVERIFIED_PROVIDER`
- **AND** the system MUST log the attempt with `failReason: 'email_unverified_provider'`
- **AND** the system MUST NOT create any identity row

#### Scenario: No existing user (new registration)

- **WHEN** `socialLogin` is called with an email and provider identity that match no existing user or identity
- **AND** the provider reports the email as verified (`emailVerified: true` in the social login params)
- **THEN** the system MUST create a new user with email and name from the social profile
- **AND** the new user MUST have no `LOCAL` identity row
- **AND** the new user MUST have `emailVerified` set to true (provider verified the email)
- **AND** the system MUST insert a `UserAuthIdentity` row with the provider and providerId
- **AND** the system MUST issue tokens for the new user and return `isNewUser: true`

#### Scenario: No existing user, provider email unverified

- **WHEN** `socialLogin` is called with an email and provider identity that match no existing user or identity
- **AND** the provider reports the email as not verified (`emailVerified: false`)
- **THEN** the system MUST reject the login with a `CONFLICT`-class error carrying code `EMAIL_UNVERIFIED_PROVIDER`
- **AND** the system MUST log the attempt with `failReason: 'email_unverified_provider'`
- **AND** the system MUST NOT create any user or identity row

#### Scenario: Concurrent callbacks do not create duplicate identities

- **WHEN** two social callbacks for the same `(provider, providerId)` arrive concurrently
- **THEN** the unique index on `UserAuthIdentity(provider, providerId)` MUST prevent duplicate rows
- **AND** the losing request MUST retry the provider-identity lookup and issue tokens for the winning identity

### Requirement: Password hash is nullable for social users

The `passwordHash` column on the users table SHALL be nullable to support social-only accounts.

#### Scenario: Social-only user has no password

- **WHEN** a user is created via social login without later adding a password
- **THEN** `passwordHash` MUST be null
- **AND** the user MUST have no `LOCAL` identity row

#### Scenario: Email/password user can link social account

- **WHEN** a social login is attempted with an email that matches an existing email/password user
- **AND** both the existing user's and the provider's emails are verified
- **THEN** the system MUST auto-link the provider to that account rather than rejecting

#### Scenario: Login validation for social-only users

- **WHEN** a user with no `LOCAL` identity attempts email/password login
- **THEN** the system MUST reject the login with a `social_account` fail reason indicating they should use their social provider

### Requirement: Social login issues standard tokens

Social login MUST use the same `generateTokens` method as email/password login to issue JWT access tokens and refresh token cookies.

#### Scenario: Token structure matches email/password login

- **WHEN** a user logs in via social auth (new user, linked account, or existing identity)
- **THEN** the JWT access token MUST contain the same claims (`sub`, `email`, `role`, `sessionId`, `jti`) as email/password login
- **AND** a refresh token cookie MUST be set with the same configuration

#### Scenario: Device context captured

- **WHEN** a social login succeeds
- **THEN** the refresh token MUST be associated with the request's IP address and user agent

### Requirement: Social auth redirect URL

The system SHALL use a `SOCIAL_AUTH_REDIRECT_URL` environment variable to determine where to redirect after successful social authentication.

#### Scenario: Redirect after success

- **WHEN** social authentication succeeds (including via auto-link)
- **THEN** the server MUST store the auth result in Redis with a short-lived authorization code (60s TTL)
- **AND** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `code` as a query parameter
- **AND** the frontend MUST exchange the code via `POST /auth/social/exchange` to receive the access token and refresh token cookie

#### Scenario: Redirect after failure

- **WHEN** social authentication fails
- **THEN** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `error=auth_failed` and `reason` as query parameters
- **AND** `reason` MUST be one of `email_unverified_local`, `email_unverified_provider`, `unauthorized`, or `unknown`

#### Scenario: Environment validation

- **WHEN** any social provider is configured
- **THEN** `SOCIAL_AUTH_REDIRECT_URL` MUST also be configured and MUST be a valid URL

### Requirement: Provider-reported email verification signal

Social login strategies SHALL pass a boolean `emailVerified` flag in `SocialLoginParams`, reflecting the provider's own assertion that the email has been verified.

#### Scenario: Google strategy verification signal

- **WHEN** the Google strategy constructs `SocialLoginParams`
- **THEN** `emailVerified` MUST reflect the `email_verified` claim from the Google ID token
- **AND** if the claim is missing or false, `emailVerified` MUST be `false`

#### Scenario: GitHub strategy verification signal

- **WHEN** the GitHub strategy constructs `SocialLoginParams`
- **THEN** the strategy MUST fetch the authenticated user's emails via the GitHub API
- **AND** MUST select the primary verified email (`primary: true, verified: true`) as the login email
- **AND** `emailVerified` MUST be `true` only when such an email is found
- **AND** if no verified primary email is available, the strategy MAY still emit the profile email but MUST set `emailVerified` to `false`
