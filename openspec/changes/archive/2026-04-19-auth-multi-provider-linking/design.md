## Context

The auth module today models sign-in methods as two columns on the `users` table: `authProvider` (`LOCAL` | `GOOGLE` | `GITHUB`) and `authProviderId` (nullable text), with a partial unique index on `(authProvider, authProviderId)` where `authProviderId IS NOT NULL`. A `LOCAL` user has `passwordHash` set and no `authProviderId`; a social user has `passwordHash = null` and one provider bound.

This model has three concrete problems observed in production:

1. A user created with email/password cannot sign in with Google later — the callback throws `ConflictException(EMAIL_EXISTS)`. This is what the incoming incident log shows (`/auth/google/callback … reason: email_exists`).
2. A user with one social provider cannot add another — the schema allows exactly one.
3. Users cannot opt into both password and social on the same account, which is a standard expectation.

The current `social-auth-account-linking` spec was deliberately conservative ("no auto-linking for security") because the schema couldn't express more than one identity safely. With a proper identity table and verified-email checks, auto-linking becomes a safe, expected behavior.

Relevant code surfaces:

- `src/modules/auth/auth.service.ts` — `socialLogin` at lines 150-226; contains the branch that throws `EMAIL_EXISTS`
- `src/modules/auth/google.strategy.ts`, `github.strategy.ts` — build the `SocialLoginParams` object
- `src/modules/user/user.repository.ts` — `findByAuthProvider`, `linkSocialAccount`, `create`
- `src/database/schemas/users.ts` — `authProvider`, `authProviderId` columns + unique index

## Goals / Non-Goals

**Goals:**

- A single user can have a `LOCAL` identity (password) and any number of social identities (one per provider), all bound to the same `users.id`.
- Social callback auto-links to an existing user when both sides have verified the email, with no user interaction.
- Existing email/password login and existing social-only login continue to work byte-identically from the client's perspective.
- Migration is zero-downtime safe: existing `(authProvider, authProviderId)` pairs backfill into the new table; `LOCAL` identities are synthesized for users with a `passwordHash`.

**Non-Goals:**

- Authenticated "manage my sign-in methods" endpoints (list/add/remove). Deferred to a follow-up change.
- Unlink-on-last-identity protection, primary-identity concept, or MFA integration.
- Merging two pre-existing accounts that happen to share an email only via an unverified path — we reject rather than merge.
- Changing JWT/refresh token structure or cookie semantics.

## Decisions

### 1. New `UserAuthIdentity` table (one-to-many) vs. JSON column vs. duplicate columns

Chosen: dedicated table `UserAuthIdentity` with columns `id` (uuid PK), `userId` (uuid FK → users, cascade delete), `provider` (enum: `LOCAL` | `GOOGLE` | `GITHUB`), `providerId` (text, nullable — null only for `LOCAL`), `emailAtLink` (text, snapshot of the provider email when linked, nullable), `createdAt`, `updatedAt`.

Indexes:

- Unique `(provider, providerId)` where `providerId IS NOT NULL` — preserves "one account per Google sub".
- Unique `(userId, provider)` where `provider = 'LOCAL'` — a user has at most one local identity.
- Non-unique `(userId)` — fast lookup of all identities for a user.

Rationale: a real table gives us FK integrity, compound indexes, audit trail per link event, and clean support for future management endpoints. A JSON column would force client-side constraint logic. Duplicating columns (e.g., `googleId`, `githubId`) doesn't scale to additional providers.

Alternative considered: keep `users.authProvider`/`authProviderId` as the "primary" identity and add an overflow table. Rejected — two sources of truth, confusing invariants.

### 2. Remove `users.authProvider` / `users.authProviderId` columns

Chosen: drop after migration. The `UserInfo` DTO already exposes `authProvider`; we derive it by selecting the user's "primary" identity — defined as: `LOCAL` if present, else the earliest-created social identity. This keeps the existing API response shape stable without denormalizing.

Rationale: avoids a drift risk (columns diverging from the identity table). The derived value is stable for the common case (one identity) and deterministic for the many-identity case.

Alternative: keep the columns as a denormalized cache, updated on every identity change. Rejected — extra write path, easy to forget, adds no query speedup since users are already cached by `UserService`.

### 3. Auto-link only when BOTH emails are verified

Chosen: auto-link iff `existingUser.emailVerified === true` AND the provider returned `email_verified === true`. Otherwise, reject with a specific reason.

Rationale: Google always includes `email_verified` in the ID token — trustworthy. GitHub returns an array of emails with `verified` flags; our strategy must pick only a verified primary email and pass that signal through. An unverified-on-either-side state could let an attacker who controls an unverified mailbox claim an existing account (or vice versa).

Error taxonomy:

- `email_unverified_local` — existing user hasn't verified their email. Client should prompt them to verify (resend link) before retrying social login.
- `email_unverified_provider` — provider email isn't verified. Client should prompt the user to verify inside the provider account.

Alternative: seamless auto-link regardless, with a confirmation email afterwards. Rejected — race window between attack and confirmation is unacceptable for an auth flow.

### 4. Lookup order in `socialLogin`

Chosen:

1. Find identity by `(provider, providerId)` → if found, issue tokens for that user. (Happy path, no link needed.)
2. Else find user by `email`:
   - If found and both sides verified → create identity row linking provider to that user, issue tokens, return `isNewUser: false`.
   - If found and either side unverified → reject with the corresponding reason code; log with `failReason: 'email_unverified_local'` or `'email_unverified_provider'`.
3. Else create new user (`passwordHash = null`, `emailVerified = true`) + one identity row, issue tokens, return `isNewUser: true`.

The link step in (2) runs inside a transaction with the identity insert and a cache invalidation, so concurrent callbacks don't create duplicate identities.

### 5. GitHub email verification

Chosen: update `github.strategy.ts` to call `GET /user/emails`, pick the primary verified email, and pass `emailVerified: true` only when the provider confirms it. If no verified email is returned, pass the login params with `emailVerified: false` so the service can reject with `email_unverified_provider`.

Rationale: Passport's default `github` strategy exposes `profile.emails[0]` but does not guarantee verification. Without this check, "verified by provider" is a lie.

### 6. Keep the social-only password-login rejection

Unchanged: a user with no `LOCAL` identity attempting email/password login is rejected with `failReason: 'social_account'`. The check moves from "`user.passwordHash` is null" to "no `LOCAL` identity row exists" (equivalent, but on the new source of truth).

### 7. Migration approach

Single Drizzle migration executes in this order inside one transaction:

1. `CREATE TABLE "UserAuthIdentity"` with the indexes described in decision 1.
2. Backfill social identities: `INSERT INTO "UserAuthIdentity" (userId, provider, providerId) SELECT id, authProvider, authProviderId FROM "User" WHERE authProviderId IS NOT NULL;`
3. Backfill local identities: `INSERT INTO "UserAuthIdentity" (userId, provider, providerId) SELECT id, 'LOCAL', NULL FROM "User" WHERE passwordHash IS NOT NULL;`
4. Drop `User_authProvider_authProviderId_unique` index.
5. Drop `authProvider` and `authProviderId` columns.

All steps in one transaction so either the full migration applies or none does. Because this is a dev-stage project (per repo conventions) and no prod data migration tooling is in place, no phased rollout is needed.

## Risks / Trade-offs

- **[Provider compromises an email]** If an attacker controls a provider account whose email was set to a pre-existing app user's email AND the provider marks it verified, the attacker auto-links and gains access. → Mitigation: trust the provider's verification signal (Google/Apple/GitHub-with-our-check are trustworthy); never accept self-reported provider emails without the verified flag.
- **[GitHub strategy returns unverified email by default]** Current GitHub strategy uses `profile.emails[0]` without a verification check. → Mitigation: explicitly fetch `GET /user/emails` and require `primary=true, verified=true`. Covered by a task.
- **[Derived `authProvider` in `UserInfo` changes for users with multiple identities]** If a user links Google then adds a password later, their `authProvider` flips from `GOOGLE` to `LOCAL`. → Mitigation: pick by creation order (earliest wins) so the displayed value is stable, not by alphabetical or enum order. Clients that depend on this value should be migrated to a future `identities[]` response.
- **[Race on concurrent callbacks]** Two parallel social callbacks for the same new user could both try to insert identity rows. → Mitigation: identity insert happens inside the same transaction as the user lookup; unique `(provider, providerId)` index catches the dup; service catches the unique-violation and retries the lookup path.
- **[`User_authProvider_authProviderId_unique` index drop]** Queries still using those columns will break during deploy if code hits the DB before the migration finishes. → Mitigation: single-transaction migration + deploy-after-migrate convention in this repo. Code referencing the dropped columns is removed in the same commit.

## Migration Plan

- Ship schema + code together: `pnpm db:generate` produces one migration; `pnpm db:migrate` applies it. Application code is already updated in the same PR.
- Rollback: drop `UserAuthIdentity` table and re-add the two columns from the backfill (the backfill was derived data, so reversal is symmetric). Because this is pre-production, a down migration is not separately maintained; `git revert` + re-generate is the rollback.
- Seed updates: `src/database/seeds/user.seed.ts` creates users with password; after this change it must also insert a `LOCAL` identity row per seeded user. The social seed (if any) similarly inserts a matching identity row.

## Open Questions

- None blocking. Future work (out of scope): authenticated endpoints to list/add/remove sign-in methods, and "delete last identity blocks the user" protection.
