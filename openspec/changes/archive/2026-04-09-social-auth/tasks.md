## 1. Database Schema & Migration

- [x] 1.1 Add `authProviderEnum` (`local`, `google`, `github`) to `src/database/schemas/enums.ts`
- [x] 1.2 Add `authProvider` (enum, default `local`, not null) and `authProviderId` (text, nullable) columns to users schema
- [x] 1.3 Make `passwordHash` nullable on users schema
- [x] 1.4 Add compound unique index on `(authProvider, authProviderId)` where `authProviderId` is not null
- [x] 1.5 Run `pnpm db:generate` and `pnpm db:migrate` to apply schema changes

## 2. Environment Configuration

- [x] 2.1 Add Google OAuth env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`) to env schema as optional
- [x] 2.2 Add GitHub OAuth env vars (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`) to env schema as optional
- [x] 2.3 Add `SOCIAL_AUTH_REDIRECT_URL` to env schema (required when any social provider is configured)

## 3. Dependencies

- [x] 3.1 Install `passport-google-oauth20` and `@types/passport-google-oauth20`
- [x] 3.2 Install `passport-github2` and `@types/passport-github2`

## 4. Passport Strategies

- [x] 4.1 Create `google.strategy.ts` implementing Passport Google OAuth strategy with profile validation
- [x] 4.2 Create `github.strategy.ts` implementing Passport GitHub OAuth strategy with email fallback from GitHub emails API

## 5. Auth Service

- [x] 5.1 Add `socialLogin` method to auth service with provider lookup, email-based account linking, and new user creation
- [x] 5.2 Add `SocialLoginParams` and `SocialLoginResult` types to `auth.types.ts`
- [x] 5.3 Update `login` method to reject social-only users (null `passwordHash`) with `social_account` fail reason

## 6. Auth Repository

- [x] 6.1 Add `findByAuthProvider` method to users repository (lookup by `authProvider` + `authProviderId`)
- [x] 6.2 Add `linkSocialAccount` method to users repository (update `authProvider` and `authProviderId` on existing user)
- [x] 6.3 Update `create` method to accept optional `authProvider`, `authProviderId`, and nullable `passwordHash`

## 7. Controller Endpoints

- [x] 7.1 Add `GET /auth/google` endpoint with Google OAuth guard
- [x] 7.2 Add `GET /auth/google/callback` endpoint that calls `socialLogin` and redirects with tokens
- [x] 7.3 Add `GET /auth/github` endpoint with GitHub OAuth guard
- [x] 7.4 Add `GET /auth/github/callback` endpoint that calls `socialLogin` and redirects with tokens
- [x] 7.5 Add error handling in callbacks to redirect with `error=auth_failed` on failure

## 8. Module Wiring

- [x] 8.1 Conditionally register Google and GitHub strategies in `auth.module.ts` based on env var presence
- [x] 8.2 Add Swagger decorators for the new social auth endpoints

## 9. Verification

- [x] 9.1 Run `pnpm check-types` — must pass
- [x] 9.2 Run `pnpm lint:fix` and `pnpm format`
- [x] 9.3 Verify existing auth endpoints (login, register, refresh) still work as expected
