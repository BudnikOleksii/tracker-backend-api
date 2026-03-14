## 1. Type System Setup

- [x] 1.1 Create `src/modules/auth/auth.types.ts` with `AuthUser`, `AuthenticatedRequest`, and `DeviceContext` interfaces
- [x] 1.2 Add RO-RO param types: `GetRefreshTokenParams` (as `AuthUser` alias/extension), `RevokeRefreshTokenParams`, `GenerateTokensParams` — composing from `AuthUser` via `Pick`/extends where applicable
- [x] 1.3 Move `DeviceContext` from `auth.service.ts` to `auth.types.ts` and update the import

## 2. Service Method Refactoring

- [x] 2.1 Rename `getSession` → `getRefreshToken` and refactor to accept `GetRefreshTokenParams` object
- [x] 2.2 Rename `revokeSession` → `revokeRefreshToken` and refactor to accept `RevokeRefreshTokenParams` object
- [x] 2.3 Rename `revokeAllSessions` → `revokeAllRefreshTokens`
- [x] 2.4 Rename `listSessions` → `listRefreshTokens`
- [x] 2.5 Refactor private `generateTokens` to accept `GenerateTokensParams` object
- [x] 2.6 Update all internal call sites within `auth.service.ts` to use new names and param objects

## 3. Controller Refactoring

- [x] 3.1 Replace all inline `Express.Request & { user: ... }` types with `AuthenticatedRequest` and `Pick` variants
- [x] 3.2 Rename `getSession` → `getRefreshToken` and update endpoint path
- [x] 3.3 Rename `listSessions` → `listRefreshTokens` and update endpoint path
- [x] 3.4 Rename `revokeSession` → `revokeRefreshToken` and update endpoint path
- [x] 3.5 Rename `revokeSessions` → `revokeRefreshTokens` and update endpoint path
- [x] 3.6 Update all service method call sites in controller to use new names and param shapes
- [x] 3.7 Update Swagger decorators to reflect new naming

## 4. DTO Rename

- [x] 4.1 Rename `RevokeSessionDto` → `RevokeRefreshTokenDto` (file and class)
- [x] 4.2 Update imports of the renamed DTO across controller and module

## 5. ESLint Configuration

- [x] 5.1 Update `@typescript-eslint/max-params` in `eslint.config.ts` from `max: 6` to `max: 3`
- [x] 5.2 Add `eslint-disable-next-line @typescript-eslint/max-params` to NestJS constructors that exceed 3 params

## 6. Verification

- [x] 6.1 Run `pnpm check-types` and fix any type errors
- [x] 6.2 Run `pnpm lint:fix` and fix any lint errors
- [x] 6.3 Run `pnpm format` to apply formatting
