## Why

Users who registered with email/password cannot later sign in with a social provider (Google/GitHub) that reports the same email — the callback rejects with `EMAIL_EXISTS`, forcing them to remember which method they used and leaving orphan attempts in the logs. The current schema also pins each user to a single provider, so a user can never have both local credentials and a social identity, nor multiple social identities (e.g., Google + GitHub). This is a real friction point (reproduced in the Google callback log that triggered this change) and blocks a natural account-consolidation UX.

## What Changes

- **BREAKING (internal):** Replace the single `authProvider`/`authProviderId` pair on the `users` table with a new `UserAuthIdentity` table supporting many identities per user. The `users.authProvider` / `users.authProviderId` columns are removed after data migration.
- Introduce `LOCAL` as an identity row (instead of a user-level flag) when a user has a password, so "sign-in methods" becomes a uniform list.
- Change social callback behavior: when the incoming provider email matches an existing user AND both the existing user's email AND the provider's reported email are verified, create a new identity row linking the provider to the existing user (auto-link). All subsequent logins via either method land on the same account.
- If either side is unverified, continue rejecting with a clear reason (`email_unverified_local` or `email_unverified_provider`) so the client can guide the user to verify first.
- Update `AuthService.socialLogin` lookup order: (1) identity match by `(provider, providerId)` → login; (2) email match + both-verified → link + login; (3) email match + unverified → reject; (4) no match → new social user.
- Expose each user's `authProvider` (derived from the primary/original identity) on `UserInfo` unchanged for backwards compatibility with existing API responses.
- Update the Drizzle schema, user repository, and user service to operate against the new identities table. Preserve existing email/password login paths untouched.
- Callback-only scope: no authenticated "manage identities" endpoints in this change.

## Capabilities

### New Capabilities

- `user-auth-identities`: data model for storing multiple authentication identities per user (one row per provider binding), including `LOCAL`. Replaces the user-level `authProvider`/`authProviderId` columns.

### Modified Capabilities

- `social-auth-account-linking`: current spec forbids auto-linking when email matches; this change reverses that to auto-link when BOTH the existing and provider emails are verified, and specifies the new rejection cases when either is unverified. Lookup order and error semantics also change.

## Impact

- **Database:** new `UserAuthIdentity` table with `(user_id, provider, provider_id)` columns, unique on `(provider, provider_id)` where `provider_id` is not null, plus a partial unique on `(user_id, provider='LOCAL')`. Drizzle migration also backfills existing rows from `users.authProvider`/`authProviderId` and from `passwordHash IS NOT NULL` (synthesizes a `LOCAL` identity). Drops the two columns and the `User_authProvider_authProviderId_unique` index once data is migrated.
- **Code:** `src/modules/auth/auth.service.ts` (`socialLogin`), `src/modules/user/user.service.ts`, `src/modules/user/user.repository.ts`, new `src/database/schemas/user-auth-identities.ts`, new `src/modules/user/identity.repository.ts` (or absorbed into `UserRepository`). Google/GitHub Passport strategies must pass through the provider-reported `emailVerified` flag to the service.
- **APIs:** `GET /auth/google/callback` and `GET /auth/github/callback` gain the auto-link behavior. New failure reasons (`email_unverified_local`, `email_unverified_provider`) surface in the redirect query string. `POST /auth/social/exchange` is unchanged. No breaking changes to public response shapes.
- **Config/env:** no new env vars.
- **Tests:** existing `social-auth-account-linking` scenarios that assert `EMAIL_EXISTS` for email-match need updates; add scenarios for auto-link, unverified-local, unverified-provider.
- **Security:** relies on provider-asserted `email_verified=true`. Google always includes this; GitHub requires fetching verified emails via the API — the GitHub strategy must be audited/updated to only report the email as verified when the provider confirms it.
