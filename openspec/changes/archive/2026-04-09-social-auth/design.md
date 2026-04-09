## Context

The application uses email/password authentication with JWT access tokens and refresh token cookies. The auth module already has a well-structured Passport integration (`passport-jwt`), a two-token system (access + refresh), login logging, and device tracking. Users are identified by email in the `users` table, and `passwordHash` is currently a required field.

Adding Google and GitHub OAuth 2.0 flows means introducing two new Passport strategies that follow the same token-issuance path as the existing login flow.

## Goals / Non-Goals

**Goals:**

- Support Google OAuth 2.0 and GitHub OAuth 2.0 as login/registration methods
- Reuse the existing JWT + refresh token infrastructure for social-authenticated users
- Link social accounts to existing email/password users when emails match
- Allow social-only accounts (no password set)

**Non-Goals:**

- Linking multiple social providers to a single account (one provider per user for now)
- Unlinking a social provider after linking
- Social auth for mobile (native SDK flows) — only web OAuth redirect flow
- MFA, passkeys, or passwordless email login
- Admin UI for managing social auth providers

## Decisions

### 1. OAuth flow: Server-side redirect (Authorization Code Grant)

Use the standard OAuth 2.0 Authorization Code flow via Passport strategies. The frontend redirects to `/auth/google` or `/auth/github`, the provider redirects back to our callback endpoint, and we issue tokens server-side.

**Why not token-based (implicit/SPA flow)?** The Authorization Code flow is more secure — the access token from the provider never touches the browser. Passport strategies handle this natively.

### 2. Passport strategies: `passport-google-oauth20` and `passport-github2`

These are the established, well-maintained Passport strategies for each provider. They follow the same `Strategy` + `validate` callback pattern as our existing `passport-jwt`.

**Why not a generic OAuth library?** Passport is already in our stack. Adding provider-specific strategies keeps the pattern consistent and avoids introducing a new auth abstraction.

### 3. Database changes: New columns on `users` table

Add two columns to `users`:

- `authProvider` — enum: `'local'`, `'google'`, `'github'` (default: `'local'`)
- `authProviderId` — text, nullable (the provider's unique user ID)

Make `passwordHash` nullable to support social-only accounts.

Add a unique compound index on `(authProvider, authProviderId)` where both are non-null.

**Why not a separate `social_accounts` table?** Since we're not supporting multiple providers per user, a separate table adds join complexity without benefit. If multi-provider linking is needed later, we can migrate to a join table then.

### 4. Account linking: Match by verified email

When a social login occurs:

1. If a user with matching `authProvider` + `authProviderId` exists → log them in
2. If no provider match but a user with the same email exists → link the social account to that user (update `authProvider` and `authProviderId`)
3. If no user exists → create a new user with the social profile data

**Why auto-link by email?** Both Google and GitHub provide verified emails. Auto-linking avoids forcing users to manually connect accounts and is the standard UX pattern.

### 5. Callback response: Redirect with refresh token cookie

After successful OAuth callback, set the refresh token cookie (same as login) and redirect to a configurable frontend URL with the access token as a query parameter. The frontend reads the token and stores it.

**Why redirect instead of JSON response?** OAuth callbacks are browser redirects, not API calls. The frontend can't receive a JSON body from a redirect. The access token in the URL is short-lived (15m default) and consumed immediately.

### 6. Environment variables

New env vars per provider:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- `SOCIAL_AUTH_REDIRECT_URL` — frontend URL to redirect after successful social auth

All social auth env vars are optional — if not set, the corresponding provider endpoints won't be registered.

### 7. Module structure

Add to the existing `auth` module rather than creating a new module:

- `google.strategy.ts` — Passport Google OAuth strategy
- `github.strategy.ts` — Passport GitHub OAuth strategy
- New controller endpoints on `AuthController`
- New `socialLogin` method on `AuthService`

**Why not a separate `social-auth` module?** Social auth shares the same token generation, refresh token, and login logging infrastructure. A separate module would require cross-module dependencies for all of these, adding complexity.

## Risks / Trade-offs

- **[Email mismatch]** → A user could register with email/password and then try social login with a different email on the same provider account. Mitigation: We match by provider ID first, then email. If neither matches, we create a new account.

- **[Provider outage]** → If Google or GitHub is down, social login fails. Mitigation: Email/password login remains available. No fallback needed for social providers.

- **[Email not provided by GitHub]** → GitHub users can have private emails. Mitigation: Request the `user:email` scope and use the primary verified email from the GitHub API.

- **[Token in redirect URL]** → The access token briefly appears in the browser URL bar and history. Mitigation: Token is short-lived (15m). Frontend should consume it immediately and replace the URL via `history.replaceState`.

- **[Breaking schema change]** → Making `passwordHash` nullable requires a migration. Mitigation: This is backward-compatible — existing rows already have a value. No data loss.

## Open Questions

- Should social-only users be able to set a password later (to enable email/password login as well)?
- Should we enforce email verification status from the provider (e.g., reject unverified Google emails)?
