## ADDED Requirements

### Requirement: GitHub OAuth initiation endpoint

The system SHALL expose a `GET /auth/github` endpoint that redirects the user to GitHub's OAuth authorization screen.

#### Scenario: User initiates GitHub login

- **WHEN** a client sends `GET /auth/github`
- **THEN** the server MUST redirect to GitHub's authorization URL with `user:email` and `read:user` scopes

#### Scenario: GitHub OAuth is not configured

- **WHEN** `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` environment variables are not set
- **THEN** the `GET /auth/github` endpoint MUST NOT be registered and MUST return 404

### Requirement: GitHub OAuth callback endpoint

The system SHALL expose a `GET /auth/github/callback` endpoint that handles the OAuth redirect from GitHub.

#### Scenario: Successful GitHub authentication

- **WHEN** GitHub redirects to `/auth/github/callback` with a valid authorization code
- **THEN** the server MUST exchange the code for user profile data (email, name, GitHub ID)
- **AND** the server MUST issue a JWT access token and set a refresh token cookie
- **AND** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `accessToken` as a query parameter

#### Scenario: GitHub returns an error

- **WHEN** GitHub redirects to `/auth/github/callback` with an error (e.g., user denied access)
- **THEN** the server MUST redirect to `SOCIAL_AUTH_REDIRECT_URL` with `error=auth_failed` as a query parameter

### Requirement: GitHub Passport strategy

The system SHALL implement a Passport strategy using `passport-github2` in `github.strategy.ts`.

#### Scenario: Strategy validates GitHub profile

- **WHEN** GitHub returns a valid profile with a verified email
- **THEN** the strategy MUST extract `email`, `displayName`, and `githubId` from the profile
- **AND** the strategy MUST pass these to the social login service method

#### Scenario: GitHub profile has no public email

- **WHEN** GitHub returns a profile without a public email
- **THEN** the strategy MUST fetch the user's primary verified email via the GitHub emails API (`user:email` scope)

#### Scenario: GitHub profile has no verified email at all

- **WHEN** GitHub returns no verified email even after fetching from the emails API
- **THEN** the strategy MUST reject the authentication with an appropriate error

### Requirement: GitHub OAuth environment variables

The system SHALL require `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL` environment variables for GitHub OAuth.

#### Scenario: Environment validation

- **WHEN** the application starts with GitHub OAuth configured
- **THEN** `GITHUB_CLIENT_ID` MUST be a non-empty string
- **AND** `GITHUB_CLIENT_SECRET` MUST be a non-empty string
- **AND** `GITHUB_CALLBACK_URL` MUST be a valid URL

#### Scenario: Optional configuration

- **WHEN** GitHub OAuth env vars are omitted
- **THEN** the application MUST start normally without GitHub OAuth support

### Requirement: GitHub login is logged

The system SHALL log GitHub login attempts using the existing login log infrastructure.

#### Scenario: Successful GitHub login logged

- **WHEN** a user successfully logs in via GitHub
- **THEN** a login log entry MUST be created with status `success` and device context (IP, user agent)

#### Scenario: Failed GitHub login logged

- **WHEN** GitHub authentication fails
- **THEN** a login log entry MUST be created with status `failed` and an appropriate fail reason
