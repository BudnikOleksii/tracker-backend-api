## Why

The auth module uses "session" naming for methods that operate on refresh tokens (e.g., `getSession`, `revokeSession`, `listSessions`), which is misleading since the underlying data model is refresh tokens. Several service methods accept too many positional parameters, making call sites hard to read and extend. Inline type declarations in controller arguments are duplicated across methods instead of being shared, and the ESLint `max-params` rule is set too high (6) to enforce clean signatures.

## What Changes

- Rename all "session"-named methods across `auth.service.ts`, `auth.controller.ts`, and related files to use "refresh token" terminology (e.g., `getSession` → `getRefreshToken`, `listSessions` → `listRefreshTokens`, `revokeSession` → `revokeRefreshToken`, `revokeAllSessions` → `revokeAllRefreshTokens`)
- **BREAKING**: Update API endpoint names/paths if they reference "session"
- Refactor methods with multiple positional parameters to use the Receive an Object, Return an Object (RO-RO) pattern, accepting a single typed params object
- Extract inline type declarations from controller method arguments into reusable interfaces (e.g., `AuthenticatedUser`, request types with varying user property shapes)
- Consolidate related interfaces using `extends` and TypeScript utility types (`Pick`, `Omit`) to reduce duplication
- Update ESLint `@typescript-eslint/max-params` rule from `max: 6` to `max: 3`, with `eslint-disable` comments for NestJS constructor injection

## Capabilities

### New Capabilities

- `auth-naming-conventions`: Consistent refresh-token naming across the auth module, replacing misleading "session" terminology
- `auth-type-system`: Extracted, reusable, and composable type definitions for auth module interfaces

### Modified Capabilities

## Impact

- **Code**: `auth.service.ts`, `auth.controller.ts`, `refresh-token.repository.ts`, `jwt.strategy.ts`, DTOs in `dtos/`
- **API**: Endpoint paths/names referencing "session" will change (breaking for API consumers)
- **Config**: `eslint.config.ts` — tighter `max-params` rule
- **Types**: New shared or module-level type files for auth interfaces
