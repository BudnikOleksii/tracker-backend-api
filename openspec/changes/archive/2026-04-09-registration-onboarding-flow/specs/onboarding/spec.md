## ADDED Requirements

### Requirement: Complete onboarding endpoint

The system SHALL expose a `POST /onboarding/complete` endpoint that validates required onboarding setup and marks the user as onboarded.

#### Scenario: Successful onboarding completion

- **WHEN** an authenticated user sends `POST /onboarding/complete` with a valid `baseCurrencyCode`
- **AND** the user has at least one transaction category
- **THEN** the system SHALL update the user's `baseCurrencyCode`
- **AND** set `onboardingCompleted: true`
- **AND** return HTTP 200 with the updated user profile

#### Scenario: Missing baseCurrencyCode

- **WHEN** an authenticated user sends `POST /onboarding/complete` without `baseCurrencyCode`
- **THEN** the system SHALL return HTTP 400 with a validation error indicating `baseCurrencyCode` is required

#### Scenario: Invalid baseCurrencyCode

- **WHEN** an authenticated user sends `POST /onboarding/complete` with an invalid `baseCurrencyCode`
- **THEN** the system SHALL return HTTP 400 with a validation error

#### Scenario: No transaction categories exist

- **WHEN** an authenticated user sends `POST /onboarding/complete` with a valid `baseCurrencyCode`
- **AND** the user has zero transaction categories
- **THEN** the system SHALL return HTTP 400 with error code `ONBOARDING_CATEGORIES_REQUIRED` and message indicating at least one category is needed

#### Scenario: Optional password setup for social auth user

- **WHEN** an authenticated social auth user (no existing password) sends `POST /onboarding/complete` with a valid `baseCurrencyCode` and a `password` field
- **AND** the user has at least one transaction category
- **THEN** the system SHALL hash the password and set `passwordHash` on the user record
- **AND** complete onboarding as normal

#### Scenario: Password field ignored for email-registered user

- **WHEN** an authenticated email-registered user (has existing password) sends `POST /onboarding/complete` with a `password` field
- **THEN** the system SHALL ignore the `password` field and complete onboarding normally

#### Scenario: Password does not meet strength requirements

- **WHEN** a user sends `POST /onboarding/complete` with a `password` that does not meet requirements (min 8 chars, at least one letter and one digit)
- **THEN** the system SHALL return HTTP 400 with a validation error for the password field

#### Scenario: Already onboarded user

- **WHEN** an authenticated user with `onboardingCompleted: true` sends `POST /onboarding/complete`
- **THEN** the system SHALL return HTTP 400 with error code `ONBOARDING_ALREADY_COMPLETED`

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `POST /onboarding/complete` without a valid JWT
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: Onboarding status endpoint

The system SHALL expose a `GET /onboarding/status` endpoint that returns the current state of the user's onboarding progress.

#### Scenario: User has not started onboarding

- **WHEN** an authenticated user with `onboardingCompleted: false`, no `baseCurrencyCode`, and zero categories sends `GET /onboarding/status`
- **THEN** the system SHALL return HTTP 200 with:
  - `onboardingCompleted: false`
  - `emailVerified: <boolean>`
  - `hasBaseCurrency: false`
  - `hasCategories: false`
  - `hasPassword: <boolean>`

#### Scenario: User has partially completed onboarding

- **WHEN** an authenticated user with `baseCurrencyCode` set but no categories sends `GET /onboarding/status`
- **THEN** the system SHALL return HTTP 200 with `hasBaseCurrency: true` and `hasCategories: false`

#### Scenario: Fully onboarded user

- **WHEN** an authenticated user with `onboardingCompleted: true` sends `GET /onboarding/status`
- **THEN** the system SHALL return HTTP 200 with `onboardingCompleted: true` and all steps reflecting current state

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `GET /onboarding/status` without a valid JWT
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: Assign default categories during onboarding

The system SHALL expose a `POST /onboarding/assign-default-categories` endpoint that triggers default category assignment for the authenticated user.

#### Scenario: Successful default category assignment

- **WHEN** an authenticated user sends `POST /onboarding/assign-default-categories`
- **AND** the user has no existing transaction categories
- **THEN** the system SHALL call `DefaultTransactionCategoriesService.assignDefaultCategoriesToUser` with the user's ID
- **AND** return HTTP 200 with the assigned categories

#### Scenario: User already has categories

- **WHEN** an authenticated user sends `POST /onboarding/assign-default-categories`
- **AND** the user already has one or more transaction categories
- **THEN** the system SHALL return HTTP 400 with error code `CATEGORIES_ALREADY_EXIST` indicating categories have already been set up

#### Scenario: No default categories available

- **WHEN** an authenticated user sends `POST /onboarding/assign-default-categories`
- **AND** no default transaction categories exist in the system
- **THEN** the system SHALL return HTTP 200 with an empty categories list

#### Scenario: Unauthenticated request

- **WHEN** a request is sent to `POST /onboarding/assign-default-categories` without a valid JWT
- **THEN** the system SHALL return HTTP 401 Unauthorized
