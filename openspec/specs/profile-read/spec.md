## ADDED Requirements

### Requirement: Authenticated user can view their own profile

The system SHALL provide a `GET /profile` endpoint that returns the authenticated user's profile information including `id`, `email`, `firstName`, `lastName`, `countryCode`, `baseCurrencyCode`, `role`, `createdAt`, and `updatedAt`.

#### Scenario: Successful profile retrieval

- **WHEN** an authenticated user sends `GET /profile`
- **THEN** the system returns HTTP 200 with the user's profile data

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `GET /profile` without a valid JWT
- **THEN** the system returns HTTP 401 Unauthorized
