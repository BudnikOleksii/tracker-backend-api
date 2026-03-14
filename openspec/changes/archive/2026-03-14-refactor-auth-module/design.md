## Context

The auth module (`src/modules/auth/`) handles registration, login, token refresh, logout, and refresh token management. Currently, methods like `getSession`, `listSessions`, `revokeSession`, and `revokeAllSessions` use "session" naming despite operating on refresh tokens stored in the `refresh_tokens` table via `RefreshTokenRepository`. The controller uses inline type declarations (e.g., `Express.Request & { user: { id: string; sessionId: string } }`) repeated across 5+ methods. Several service methods accept 3-4 positional string parameters, and the ESLint `max-params` rule allows up to 6.

## Goals / Non-Goals

**Goals:**

- Rename all "session" references in auth service/controller methods and API endpoints to "refresh token" terminology
- Apply the RO-RO pattern to service methods with more than 2 parameters (`getSession`, `revokeSession`, `generateTokens`)
- Extract inline request/user types into reusable interfaces using `extends` and utility types
- Tighten ESLint `max-params` to 3 with constructor exemptions

**Non-Goals:**

- Changing the database schema or table names (refresh_tokens table stays as-is)
- Modifying the JWT payload structure (`sessionId` field in JWT can remain for now)
- Adding new auth features (e.g., MFA, OAuth)
- Changing the public DTO classes

## Decisions

### 1. Naming: "session" → "refreshToken"

Method renames in `auth.service.ts`:
| Current | New |
|---|---|
| `getSession()` | `getRefreshToken()` |
| `listSessions()` | `listRefreshTokens()` |
| `revokeSession()` | `revokeRefreshToken()` |
| `revokeAllSessions()` | `revokeAllRefreshTokens()` |

Controller renames and endpoint path updates in `auth.controller.ts`:
| Current | New |
|---|---|
| `getSession()` | `getRefreshToken()` |
| `listSessions()` | `listRefreshTokens()` |
| `revokeSession()` | `revokeRefreshToken()` |
| `revokeSessions()` | `revokeRefreshTokens()` |

API paths that reference "session" will be updated to use "refresh-token" (e.g., `/auth/sessions` → `/auth/refresh-tokens`).

**Rationale**: The underlying entity is a refresh token. Using "session" conflates concepts and would become confusing if true session management is added later.

### 2. RO-RO pattern with typed param objects

Create param interfaces for methods exceeding 2 positional params:

- `GetRefreshTokenParams { sessionId: string; userId: string; email: string; role: string }` — used by `getRefreshToken()`
- `RevokeRefreshTokenParams { sessionId: string; userId: string; currentSessionId: string }` — used by `revokeRefreshToken()`
- `GenerateTokensParams { userId: string; email: string; role: UserRole; deviceContext?: DeviceContext }` — used by `generateTokens()`

These will be defined in a new `src/modules/auth/auth.types.ts` file alongside the existing `DeviceContext` interface (moved from `auth.service.ts`).

**Rationale**: RO-RO improves readability at call sites, makes parameter order irrelevant, and simplifies future extensions without breaking signatures.

### 3. Type extraction and composition

Create reusable types in `src/modules/auth/auth.types.ts`:

- `AuthUser { id: string; email: string; role: string; sessionId: string }` — full authenticated user from JWT
- Use `Pick<AuthUser, 'id' | 'sessionId'>` and `Pick<AuthUser, 'id'>` for controller methods that need fewer fields
- `AuthenticatedRequest = Express.Request & { user: AuthUser }` — replaces all inline request types in controller
- `DeviceContext` — moved from auth.service.ts
- RO-RO param types as above

Some param interfaces can reference `AuthUser` via `Pick` to avoid duplication. For example, `GetRefreshTokenParams` could extend `AuthUser` directly since it uses the same fields.

**Rationale**: Eliminates 5+ duplicate inline type declarations. Using `Pick`/`Omit` over separate interfaces keeps types DRY and synchronized.

### 4. ESLint max-params: 6 → 3

Update `eslint.config.ts`:

```typescript
'@typescript-eslint/max-params': ['error', { max: 3, countVoidThis: false }]
```

Add `// eslint-disable-next-line @typescript-eslint/max-params` above NestJS constructors that use dependency injection (these naturally exceed 3 params and cannot use RO-RO).

**Rationale**: 3 is the practical threshold where positional params remain readable. Constructors are exempted because NestJS DI mandates individual constructor params.

## Risks / Trade-offs

- **Breaking API change** → Since this is an internal/early-stage project, a clean rename is preferable to maintaining backward compatibility. Document the endpoint changes in PR description.
- **JWT `sessionId` field unchanged** → Renaming the JWT field would require token invalidation. Keep `sessionId` in JWT payload for now; the service layer uses the correct terminology regardless.
- **Constructor eslint-disable comments** → Adds noise but is the standard NestJS pattern. Alternative (global constructor exemption) is not supported by the rule.
