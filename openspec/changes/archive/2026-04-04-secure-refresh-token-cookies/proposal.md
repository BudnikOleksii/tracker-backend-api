## Why

Refresh tokens are currently returned in the JSON response body and accepted via the request body on the refresh endpoint. This exposes them to JavaScript (XSS attacks can steal tokens), browser extensions, and any code running in the client context. Storing refresh tokens in HTTP-only, secure cookies eliminates this attack surface entirely, following OWASP best practices for token storage.

## What Changes

- **BREAKING**: Login, register, and refresh-token endpoints no longer return `refreshToken` in the response body — only `accessToken` and `user` are returned
- **BREAKING**: `POST /auth/refresh-token` no longer accepts `refreshToken` in the request body — it reads the token from an HTTP-only cookie instead
- **BREAKING**: `POST /auth/logout` no longer accepts `refreshToken` in the request body — it reads from the cookie
- Refresh token is set as an HTTP-only, Secure, SameSite=Strict cookie on login, register, and refresh
- Logout and revoke-all endpoints clear the refresh token cookie
- Cookie configuration (name, path, domain, secure flag) is driven by environment variables

## Capabilities

### New Capabilities

- `refresh-token-cookie`: Secure HTTP-only cookie storage and retrieval of refresh tokens, cookie configuration, and cookie lifecycle management (set on auth, clear on logout)

### Modified Capabilities

_(none — this changes implementation of token transport, not the spec-level requirements of existing capabilities)_

## Impact

- **API contracts**: Response shape changes for `/auth/login`, `/auth/register`, `/auth/refresh-token`, `/auth/logout` (breaking for existing clients)
- **Code**: `auth.controller.ts`, `auth.service.ts`, DTOs (`AuthResponseDto`, `RefreshTokenDto`, `LogoutDto`)
- **Configuration**: New env vars for cookie settings (`COOKIE_DOMAIN`, `COOKIE_SECURE`, etc.)
- **Dependencies**: No new packages required — NestJS has built-in `@Res()` / `response.cookie()` support
- **Clients**: Frontend must be updated to stop storing/sending refresh tokens and rely on cookies being sent automatically
