## ADDED Requirements

### Requirement: Google OAuth initiation endpoint

The system SHALL expose a `GET /auth/google` endpoint that redirects the user to Google's OAuth 2.0 consent screen.

#### Scenario: User initiates Google login

- **WHEN** a client sends `GET /auth/google`
- **THEN** the server MUST redirect to Google's authorization URL with `openid`, `email`, and `profile` scopes

#### Scenario: Google OAuth is not configured

- **WHEN** `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` environment variables are not set
- **THEN** the `GET /auth/google` endpoint MUST return 501 Not Implemented

### Requirement: Google OAuth callback endpoint

The system SHALL expose a `GET /auth/google/callback` endpoint that handles the OAuth redirect from Google.

#### Scenario: Successful Google authentication

- **WHEN** Google redirects to `/auth/google/callback` with a valid authorization code
- **THEN** the server MUST exchange the code for user profile data (email, name, Google ID)
- **AND** the server MUST store the auth result in Redis with a short-lived authorization code (60s TTL)
- **AND** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `code` as a query parameter

#### Scenario: Google returns an error

- **WHEN** Google redirects to `/auth/google/callback` with an error (e.g., user denied consent)
- **THEN** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `error=auth_failed` as a query parameter

### Requirement: Google Passport strategy

The system SHALL implement a Passport strategy using `passport-google-oauth20` in `google.strategy.ts`.

#### Scenario: Strategy validates Google profile

- **WHEN** Google returns a valid profile with a verified email
- **THEN** the strategy MUST extract `email`, `firstName`, `lastName`, and `googleId` from the profile
- **AND** the strategy MUST pass these to the social login service method

#### Scenario: Google profile has no verified email

- **WHEN** Google returns a profile without a verified email
- **THEN** the strategy MUST reject the authentication with an appropriate error

### Requirement: Google OAuth environment variables

The system SHALL require `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` environment variables for Google OAuth.

#### Scenario: Environment validation

- **WHEN** the application starts with Google OAuth configured
- **THEN** `GOOGLE_CLIENT_ID` MUST be a non-empty string
- **AND** `GOOGLE_CLIENT_SECRET` MUST be a non-empty string
- **AND** `GOOGLE_CALLBACK_URL` MUST be a valid URL

#### Scenario: Optional configuration

- **WHEN** Google OAuth env vars are omitted
- **THEN** the application MUST start normally without Google OAuth support

### Requirement: Google login is logged

The system SHALL log Google login attempts using the existing login log infrastructure.

#### Scenario: Successful Google login logged

- **WHEN** a user successfully logs in via Google
- **THEN** a login log entry MUST be created with status `success` and device context (IP, user agent)

#### Scenario: Failed Google login logged

- **WHEN** Google authentication fails
- **THEN** a login log entry MUST be created with status `failed` and an appropriate fail reason
