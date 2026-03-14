## ADDED Requirements

### Requirement: Service methods use refresh-token terminology

All auth service methods that operate on refresh tokens SHALL use "refreshToken" naming instead of "session". Specifically: `getRefreshToken`, `listRefreshTokens`, `revokeRefreshToken`, `revokeAllRefreshTokens`.

#### Scenario: Method names reflect the underlying entity

- **WHEN** a developer reads the auth service public API
- **THEN** all methods dealing with refresh tokens MUST contain "RefreshToken" in their name, not "Session"

#### Scenario: Internal references updated

- **WHEN** the controller or other modules call auth service methods
- **THEN** all call sites MUST use the new method names

### Requirement: Controller methods use refresh-token terminology

All auth controller methods and their Swagger decorators SHALL use "refreshToken" naming instead of "session".

#### Scenario: Controller method names match service

- **WHEN** a developer reads the auth controller
- **THEN** handler methods MUST use "refreshToken" naming (e.g., `getRefreshToken`, `listRefreshTokens`)

### Requirement: API endpoints use refresh-token paths

All HTTP endpoints previously referencing "session" SHALL use "refresh-token" in their paths.

#### Scenario: Session endpoints renamed

- **WHEN** a client calls the auth API
- **THEN** endpoints MUST use `/auth/refresh-tokens` instead of `/auth/sessions` (or equivalent path changes)

#### Scenario: Old session endpoints removed

- **WHEN** a client calls old session-based endpoint paths
- **THEN** the server SHALL return 404 (no backward compatibility routes)

### Requirement: DTO naming consistency

DTOs referencing "session" SHALL be renamed to use "refresh-token" terminology where applicable.

#### Scenario: RevokeSessionDto renamed

- **WHEN** the `RevokeSessionDto` is used
- **THEN** it MUST be renamed to `RevokeRefreshTokenDto` with the same validation rules
