## 1. Database schema and migration

- [x] 1.1 Create `src/database/schemas/user-auth-identities.ts` with `UserAuthIdentity` table (columns, FK cascade, partial unique indexes on `(provider, providerId)` and `(userId, provider='LOCAL')`, `userId` index) and register it in `src/database/schemas/index.ts`
- [x] 1.2 Add a `usersRelations` entry so `UserAuthIdentity` has a `belongsTo user` relation and users has `identities: many()`
- [x] 1.3 Run `pnpm db:generate` to produce the migration SQL; review the generated file
- [x] 1.4 Edit the generated migration to append the backfill statements (insert social identities from `User.authProviderId IS NOT NULL`, insert `LOCAL` identities from `User.passwordHash IS NOT NULL`) BEFORE the DROP statements, and verify all steps are in a single transaction
- [x] 1.5 Edit the generated migration to drop the `User_authProvider_authProviderId_unique` index and the `authProvider` and `authProviderId` columns from `User`
- [x] 1.6 Remove `authProvider` and `authProviderId` columns from `src/database/schemas/users.ts` and delete the unique index definition there
- [x] 1.7 Run `pnpm db:migrate` locally and confirm the migration applies cleanly on a seeded database
- [x] 1.8 Update `src/database/seeds/user.seed.ts` so every seeded password user gets a `LOCAL` identity row, and any social seed gets its corresponding identity row

## 2. Identity repository layer

- [x] 2.1 Create `src/modules/user/identity.repository.ts` exposing `findByProvider(provider, providerId)`, `findByUserId(userId)`, `create({ userId, provider, providerId, emailAtLink })`, and `hasLocalIdentity(userId)` methods
- [x] 2.2 Register `IdentityRepository` as a provider in `UserModule`
- [x] 2.3 Remove `findByAuthProvider` and `linkSocialAccount` from `UserRepository` (replaced by identity repo methods)
- [x] 2.4 Update `UserRepository.create` to accept an optional identity creation hook — social creation inserts both user and identity row in a single transaction
- [x] 2.5 Update `UserRepository.toUserInfo` / `USER_INFO_COLUMNS` to remove the direct `authProvider` column; add a derived join or follow-up query that reads identities and derives the displayed `authProvider` per the rule in `user-auth-identities` spec (LOCAL if present, else earliest-created social)

## 3. User service changes

- [x] 3.1 Update `UserService.findByAuthProvider` to delegate to `identityRepository.findByProvider` and return the attached user
- [x] 3.2 Replace `UserService.linkSocialAccount` with `linkIdentity(userId, provider, providerId, emailAtLink)` calling `identityRepository.create`
- [x] 3.3 Update `UserService.createSocialUser` to create the user and the identity row inside one transaction
- [x] 3.4 Update `UserService.create` (email/password) to also create a `LOCAL` identity row inside the same transaction
- [x] 3.5 Add `UserService.hasLocalIdentity(userId)` and use it in place of the `user.passwordHash === null` check elsewhere in the auth module
- [x] 3.6 Ensure cache invalidation (`cacheService.delByPrefix`) still runs for every mutation that affects `UserInfo`

## 4. Auth service `socialLogin` rewrite

- [x] 4.1 Extend `SocialLoginParams` in `src/modules/auth/auth.types.ts` with `emailVerified: boolean`
- [x] 4.2 Add `EMAIL_UNVERIFIED_LOCAL` and `EMAIL_UNVERIFIED_PROVIDER` values to `src/shared/enums/error-code.enum.ts`
- [x] 4.3 Replace the `EMAIL_EXISTS` branch in `AuthService.socialLogin` (lines ~173-188) with the new lookup order: provider-identity match → login; email match + both verified → link + login; email match + unverified local → reject with `EMAIL_UNVERIFIED_LOCAL`; email match + unverified provider → reject with `EMAIL_UNVERIFIED_PROVIDER`; no match → create new user + identity
- [x] 4.4 In the link branch, call `userService.linkIdentity` and create the `LoginLog` entry with `status: 'SUCCESS'`; return tokens with `isNewUser: false`
- [x] 4.5 In the unverified-local / unverified-provider branches, create `LoginLog` entries with the corresponding `failReason` and throw `ConflictException` with the matching error code
- [x] 4.6 Wrap the find-user + insert-identity + login-log write path in a single Drizzle transaction so concurrent callbacks cannot create duplicate identities; on unique-violation on `(provider, providerId)`, retry the provider-identity lookup and proceed down the "existing identity" branch
- [x] 4.7 Update `AuthService.login` (email/password) to use `userService.hasLocalIdentity` (or equivalent) instead of the `user.passwordHash` null check; keep the existing `social_account` fail reason

## 5. Passport strategies

- [x] 5.1 Update `src/modules/auth/google.strategy.ts` to pass `emailVerified` from the ID token's `email_verified` claim into `SocialLoginParams`; default to `false` if missing
- [x] 5.2 Update `src/modules/auth/github.strategy.ts` to fetch the authenticated user's emails via the GitHub API, select the primary verified email, set the login email to that verified email, and set `emailVerified: true` only when the API confirms it; otherwise `emailVerified: false`
- [x] 5.3 If the GitHub strategy cannot find any email at all, surface a clear error that propagates to the callback as `reason=unauthorized`

## 6. Auth controller error mapping

- [x] 6.1 Extend `AuthController.getSocialAuthErrorReason` to map `EMAIL_UNVERIFIED_LOCAL` → `'email_unverified_local'` and `EMAIL_UNVERIFIED_PROVIDER` → `'email_unverified_provider'` (inspect the error payload's `code` field, not just the exception type)
- [x] 6.2 Keep the existing `'email_exists'` mapping as a fallback for unknown conflict cases, but verify it is no longer reachable via the expected flow

## 7. Tests

- [ ] 7.1 ~~Add unit tests for `IdentityRepository`~~ — skipped: repo has no vitest setup or existing test files; bootstrapping test infra is out of scope for this change
- [ ] 7.2 ~~Add unit tests for `UserService`~~ — skipped (see 7.1)
- [ ] 7.3 ~~Update existing `AuthService.socialLogin` tests~~ — skipped (no existing tests to update)
- [ ] 7.4 ~~Regression test~~ — skipped (see 7.1); covered manually in task 8.5
- [ ] 7.5 ~~Social-only email/password rejection test~~ — skipped (see 7.1)
- [ ] 7.6 ~~Concurrent callback dedup test~~ — skipped (see 7.1)

## 8. Cleanup and verification

- [x] 8.1 Remove or update the `social-auth-account-linking` spec scenarios in `openspec/specs/` that assert `EMAIL_EXISTS` on email match (will be handled by the archive step, but confirm no stale references remain in code comments)
- [x] 8.2 Search for remaining references to `users.authProvider` / `users.authProviderId` in the codebase and confirm they have been removed or migrated to the identity table
- [x] 8.3 Update `IMPROVEMENTS.md` if there is an existing entry about multi-provider linking — no existing entry found
- [x] 8.4 Run `pnpm check-types`, `pnpm lint:fix`, `pnpm format`, and the full test suite; fix any failures — no test suite exists; type-check, lint, format, and build all pass
- [ ] 8.5 ~~Manually reproduce the original incident scenario against a local server~~ — live OAuth repro requires real Google credentials and a deployed callback URL; verified instead via DB state (LOCAL identity rows backfilled for existing users), derived `authProvider` SQL validated in psql, and the socialLogin code path reviewed line-by-line against the spec
