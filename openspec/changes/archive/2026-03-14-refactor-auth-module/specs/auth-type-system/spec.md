## ADDED Requirements

### Requirement: Centralized auth types file

The auth module SHALL have a dedicated `auth.types.ts` file containing all shared type definitions for the module.

#### Scenario: Types file exists and is importable

- **WHEN** a developer needs auth-related types
- **THEN** they MUST import from `@/modules/auth/auth.types.ts`

### Requirement: AuthUser interface extracted from inline declarations

An `AuthUser` interface SHALL be defined representing the full authenticated user payload from JWT: `{ id: string; email: string; role: string; sessionId: string }`.

#### Scenario: Controller uses AuthUser instead of inline types

- **WHEN** a controller method accesses `req.user`
- **THEN** the request type MUST reference `AuthUser` or a `Pick<AuthUser, ...>` variant, not an inline object type

#### Scenario: Narrower user types derived via Pick

- **WHEN** a controller method only needs `id` and `sessionId` from the user
- **THEN** it MUST use `Pick<AuthUser, 'id' | 'sessionId'>` instead of a separate inline or standalone interface

### Requirement: AuthenticatedRequest type replaces inline request types

An `AuthenticatedRequest` type SHALL be defined as `Express.Request & { user: AuthUser }` to replace all inline `Express.Request & { user: {...} }` declarations.

#### Scenario: No inline Express.Request intersection types in controller

- **WHEN** the controller source is reviewed
- **THEN** there SHALL be zero inline `Express.Request & { user: ... }` type declarations

### Requirement: RO-RO param objects for service methods

Service methods with more than 2 positional parameters SHALL accept a single typed params object instead.

#### Scenario: getRefreshToken uses params object

- **WHEN** `getRefreshToken` is called
- **THEN** it MUST accept a single `GetRefreshTokenParams` object containing `id`, `email`, `role`, and `sessionId`

#### Scenario: revokeRefreshToken uses params object

- **WHEN** `revokeRefreshToken` is called
- **THEN** it MUST accept a single `RevokeRefreshTokenParams` object containing `sessionId`, `userId`, and `currentSessionId`

#### Scenario: generateTokens uses params object

- **WHEN** `generateTokens` is called (private)
- **THEN** it MUST accept a single `GenerateTokensParams` object containing `userId`, `email`, `role`, and optional `deviceContext`

### Requirement: DeviceContext moved to auth.types.ts

The `DeviceContext` interface SHALL be moved from `auth.service.ts` to `auth.types.ts`.

#### Scenario: DeviceContext importable from types file

- **WHEN** any file needs the `DeviceContext` type
- **THEN** it MUST import it from `auth.types.ts`, not from `auth.service.ts`

### Requirement: ESLint max-params set to 3

The `@typescript-eslint/max-params` rule SHALL be set to `max: 3`.

#### Scenario: ESLint config updated

- **WHEN** ESLint runs on the codebase
- **THEN** any function with more than 3 parameters MUST trigger an error

#### Scenario: NestJS constructors exempted with eslint-disable

- **WHEN** a NestJS class uses constructor dependency injection with more than 3 parameters
- **THEN** the constructor MUST have an `eslint-disable-next-line @typescript-eslint/max-params` comment

### Requirement: Param interfaces compose from AuthUser where applicable

RO-RO param interfaces SHALL use `Pick`, `Omit`, or `extends` on `AuthUser` where their fields overlap, rather than re-declaring the same properties.

#### Scenario: GetRefreshTokenParams derives from AuthUser

- **WHEN** `GetRefreshTokenParams` is defined
- **THEN** it MUST be equivalent to `AuthUser` (or extend/alias it) since it uses the same fields
