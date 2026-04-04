## 1. Dependencies & Configuration

- [x] 1.1 Install `cookie-parser` and `@types/cookie-parser` as exact versions
- [x] 1.2 Add cookie-parser middleware in `main.ts` bootstrap
- [x] 1.3 Add cookie environment variables to `env.schema.ts` (`COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_PATH`, `REFRESH_TOKEN_COOKIE_NAME`) with Zod defaults

## 2. Auth Service Changes

- [x] 2.1 Update `generateTokens` to return the raw refresh token separately (not in the DTO response) so the controller can set it as a cookie
- [x] 2.2 Update `AuthResponseDto` to remove `refreshToken` field — keep only `accessToken` and `user`
- [x] 2.3 Update `refreshToken()` method to accept refresh token as a parameter (from cookie) instead of from a DTO body
- [x] 2.4 Update `logout()` method to accept refresh token as a parameter (from cookie) instead of from a DTO body

## 3. Auth Controller Changes

- [x] 3.1 Add helper method to set refresh token cookie on the response (`response.cookie()` with HttpOnly, Secure, SameSite, Path, MaxAge)
- [x] 3.2 Add helper method to clear refresh token cookie on the response (`response.clearCookie()`)
- [x] 3.3 Update `register` endpoint: use `@Res({ passthrough: true })`, set cookie, return only access token + user
- [x] 3.4 Update `login` endpoint: use `@Res({ passthrough: true })`, set cookie, return only access token + user
- [x] 3.5 Update `refreshToken` endpoint: read token from `@Req()` cookies, set new cookie, return only access token + user
- [x] 3.6 Update `logout` endpoint: read token from `@Req()` cookies, clear cookie after revocation
- [x] 3.7 Update `revokeAllRefreshTokens` endpoint: clear cookie after revocation

## 4. DTO Cleanup

- [x] 4.1 Remove or update `RefreshTokenDto` (no longer needed for body — refresh reads from cookie)
- [x] 4.2 Remove `refreshToken` field from `LogoutDto` (logout reads from cookie)
- [x] 4.3 Update Swagger decorators to reflect new response shapes (no `refreshToken` in responses)

## 5. Validation & Testing

- [x] 5.1 Run `pnpm check-types` and fix any type errors
- [x] 5.2 Run `pnpm lint:fix` and `pnpm format`
- [ ] 5.3 Manually verify cookie is set on login/register via API client (curl or Postman with cookie jar) _(skipped — requires running server)_
