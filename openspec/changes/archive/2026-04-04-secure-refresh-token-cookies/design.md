## Context

The auth module currently returns refresh tokens in JSON response bodies (`AuthResponseDto.refreshToken`) and accepts them via request bodies (`RefreshTokenDto.refreshToken`, `LogoutDto.refreshToken`). This exposes tokens to XSS attacks — any injected script can read the token from the response or localStorage and exfiltrate it.

The codebase uses NestJS 11 with Passport JWT strategy. Access tokens are already handled correctly via `Authorization: Bearer` headers. The refresh token flow needs to move to HTTP-only cookies while preserving the existing token rotation, session management, and multi-device support.

## Goals / Non-Goals

**Goals:**

- Store refresh tokens in HTTP-only, Secure, SameSite cookies — invisible to JavaScript
- Read refresh tokens from cookies on `POST /auth/refresh-token` and `POST /auth/logout`
- Set the cookie on login, register, and token refresh; clear it on logout and revoke-all
- Make cookie settings configurable via environment variables
- Maintain existing token rotation and session management behavior

**Non-Goals:**

- CSRF protection (SameSite=Strict mitigates this; dedicated CSRF tokens are out of scope)
- Refresh token encryption at rest (HMAC hashing is already in place)
- Changes to access token handling (stays in response body, read from Authorization header)
- Frontend client changes (out of scope for this backend change)

## Decisions

### 1. Cookie configuration approach

**Decision**: Add cookie config to `EnvSchema` and inject via `ConfigService`.

Cookie settings: `REFRESH_TOKEN_COOKIE_NAME` (default: `refresh_token`), `COOKIE_DOMAIN`, `COOKIE_SECURE` (default: `true`), `COOKIE_SAME_SITE` (default: `strict`), `COOKIE_PATH` (default: `/auth`).

**Rationale**: Consistent with how the app already handles config (`env.schema.ts` + Zod validation). Path scoped to `/auth` so the cookie is only sent on auth endpoints, reducing unnecessary header overhead.

**Alternative considered**: Hardcoded values — rejected because domain and secure flag differ between development (localhost, HTTP) and production.

### 2. Setting cookies via NestJS `@Res({ passthrough: true })`

**Decision**: Use `@Res({ passthrough: true })` to access the Express `Response` object while preserving NestJS's automatic serialization.

**Rationale**: `passthrough: true` lets us call `response.cookie()` and `response.clearCookie()` without losing NestJS's return-value-based response handling. This avoids manually calling `response.json()`.

**Alternative considered**: Custom interceptor to set cookies — more complex, harder to reason about per-endpoint cookie clearing vs setting.

### 3. Reading refresh token from cookie

**Decision**: Read `req.cookies[COOKIE_NAME]` directly in the controller using `@Req()`. Remove `RefreshTokenDto` body requirement from refresh and logout endpoints.

**Rationale**: Simple and explicit. A custom decorator (`@RefreshTokenCookie()`) could be added but is unnecessary abstraction for 2 endpoints.

### 4. Response DTO changes

**Decision**: Remove `refreshToken` field from `AuthResponseDto`. Return only `accessToken` and `user`.

**Rationale**: The refresh token is now in the cookie — including it in the body would defeat the purpose. This is a breaking change for clients.

### 5. Cookie-parser middleware

**Decision**: Add `cookie-parser` middleware in `main.ts` bootstrap to parse incoming cookies.

**Rationale**: Express does not parse cookies by default. `cookie-parser` is the standard solution and has zero config for basic usage.

## Risks / Trade-offs

- **[Breaking API change]** → Clients must stop reading `refreshToken` from responses and stop sending it in bodies. Mitigated by clear documentation and version bump.
- **[Cross-origin requests]** → `SameSite=Strict` blocks cookies on cross-origin requests. If the frontend is on a different domain, this must be set to `Lax` or `None` (with `Secure`). Mitigated by making `COOKIE_SAME_SITE` configurable.
- **[cookie-parser dependency]** → Adds one new dependency. Low risk — it's a widely-used, stable Express middleware.
- **[Development ergonomics]** → API testing tools (Postman, curl) need cookie jar support. Minor friction, well-documented in tools.
