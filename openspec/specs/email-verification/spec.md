## ADDED Requirements

### Requirement: Send verification email on local registration

The system SHALL send a verification email to the user's email address when they register via email/password. The email SHALL contain a unique verification link.

#### Scenario: Successful registration triggers verification email

- **WHEN** a user registers via `POST /auth/register` with a valid email and password
- **THEN** the system SHALL generate a `crypto.randomUUID()` verification token
- **AND** store the token in `emailVerificationToken` and set `emailVerificationTokenExpiresAt` to 24 hours from now
- **AND** send a verification email containing a link to `GET /auth/verify-email?token=<token>`
- **AND** return tokens and user data as before (user is authenticated but `emailVerified` remains `false`)

#### Scenario: Email send failure does not block registration

- **WHEN** a user registers but the verification email fails to send
- **THEN** the system SHALL log the error and complete registration successfully
- **AND** the user SHALL still receive access/refresh tokens

### Requirement: Social auth users are automatically email-verified

The system SHALL set `emailVerified: true` when creating a user via social authentication (Google or GitHub), since the provider has already verified the email.

#### Scenario: Google OAuth registration sets emailVerified

- **WHEN** a new user registers via Google OAuth
- **THEN** the system SHALL create the user with `emailVerified: true`

#### Scenario: GitHub OAuth registration sets emailVerified

- **WHEN** a new user registers via GitHub OAuth
- **THEN** the system SHALL create the user with `emailVerified: true`

### Requirement: Verify email via token endpoint

The system SHALL expose a `GET /auth/verify-email` endpoint that validates the verification token, marks the email as verified, and redirects to the frontend.

#### Scenario: Valid verification token

- **WHEN** a request is sent to `GET /auth/verify-email?token=<valid-token>`
- **AND** the token matches a user's `emailVerificationToken`
- **AND** the token has not expired (`emailVerificationTokenExpiresAt` is in the future)
- **THEN** the system SHALL set `emailVerified: true`
- **AND** clear `emailVerificationToken` and `emailVerificationTokenExpiresAt`
- **AND** redirect to the frontend onboarding URL (configured via `EMAIL_VERIFICATION_REDIRECT_URL` env var)

#### Scenario: Expired verification token

- **WHEN** a request is sent to `GET /auth/verify-email?token=<expired-token>`
- **AND** the token's `emailVerificationTokenExpiresAt` is in the past
- **THEN** the system SHALL redirect to the frontend with an `error=token_expired` query parameter

#### Scenario: Invalid verification token

- **WHEN** a request is sent to `GET /auth/verify-email?token=<invalid-token>`
- **AND** no user has a matching `emailVerificationToken`
- **THEN** the system SHALL redirect to the frontend with an `error=invalid_token` query parameter

#### Scenario: Already verified email

- **WHEN** a request is sent to `GET /auth/verify-email?token=<token>`
- **AND** the user's `emailVerified` is already `true`
- **THEN** the system SHALL redirect to the frontend onboarding URL (success case, no error)

### Requirement: Registration no longer collects firstName/lastName

The `POST /auth/register` endpoint SHALL only accept `email` and `password` fields. The `firstName` and `lastName` fields SHALL be removed from the registration DTO.

#### Scenario: Registration with only email and password

- **WHEN** a user sends `POST /auth/register` with `email` and `password`
- **THEN** the system SHALL create the user without `firstName` or `lastName`

#### Scenario: Extra fields are ignored

- **WHEN** a user sends `POST /auth/register` with `email`, `password`, `firstName`, and `lastName`
- **THEN** the system SHALL ignore `firstName` and `lastName` and create the user with only `email` and hashed `password`

### Requirement: Registration no longer assigns default categories

The `POST /auth/register` endpoint SHALL NOT automatically assign default transaction categories to the newly created user. Category setup happens during onboarding.

#### Scenario: User registers and has no categories

- **WHEN** a user registers via `POST /auth/register`
- **THEN** the user SHALL have zero transaction categories after registration

### Requirement: New users default to onboardingCompleted false

The system SHALL create new users with `onboardingCompleted: false` by default. The database schema default for this column SHALL be changed from `true` to `false`.

#### Scenario: Email registration creates user with onboardingCompleted false

- **WHEN** a user registers via `POST /auth/register`
- **THEN** the user record SHALL have `onboardingCompleted: false`

#### Scenario: Social auth registration creates user with onboardingCompleted false

- **WHEN** a new user registers via Google or GitHub OAuth
- **THEN** the user record SHALL have `onboardingCompleted: false`

#### Scenario: Existing users are unaffected

- **WHEN** the migration runs to change the default
- **THEN** existing users SHALL retain their current `onboardingCompleted` value (not be updated)
