## Context

The tracker backend currently registers users (email or social auth) and immediately grants full access. Default transaction categories are assigned silently during registration. There is no email verification step, and `onboardingCompleted` defaults to `true`.

The users table already has the necessary columns: `emailVerified`, `emailVerificationToken`, `emailVerificationTokenExpiresAt`, `onboardingCompleted`, and `baseCurrencyCode`. No mailer service exists yet.

The frontend/BFF will gate dashboard access behind `onboardingCompleted === true`, redirecting users to an onboarding flow if incomplete.

## Goals / Non-Goals

**Goals:**

- Verify email ownership for locally-registered users before granting full access
- Ensure users complete minimum setup (currency + categories) via a structured onboarding flow
- Allow social auth users to optionally set a password during onboarding
- Keep registration fast — email verification and onboarding happen asynchronously after registration
- Create a reusable mailer service for transactional emails

**Non-Goals:**

- Email verification for social auth users (provider already verified)
- Re-sending verification emails (can be added later)
- Onboarding UI/BFF implementation (frontend concern)
- Enforcing onboarding at the API guard level (BFF handles routing)
- Password reset / forgot password flow (separate feature)

## Decisions

### 1. Mailer service: Nodemailer with SMTP

**Choice**: Use `nodemailer` with SMTP configuration via env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`).

**Why over SendGrid/Resend SDK**: SMTP is provider-agnostic. The user can point it at any provider (SendGrid SMTP, AWS SES, Mailgun, local Mailhog for dev). No vendor lock-in, no extra SDK dependency.

**Alternative considered**: `@nestjs-modules/mailer` — adds Handlebars/Pug templating overhead. We only need one email template initially, so raw Nodemailer is simpler.

### 2. Email verification via signed token in URL

**Choice**: Generate a `crypto.randomUUID()` token, store it on the user record (`emailVerificationToken` + `emailVerificationTokenExpiresAt`), and send a link to `GET /auth/verify-email?token=<token>`. On verification, clear the token, set `emailVerified: true`, and redirect to the frontend onboarding URL.

**Why over JWT-based tokens**: The user record already has `emailVerificationToken` and `emailVerificationTokenExpiresAt` columns. Storing the token in the DB lets us invalidate it on use (one-time use) and check expiry without JWT signing infrastructure. Simpler and already modeled.

**Token expiry**: 24 hours. Stored in `emailVerificationTokenExpiresAt`.

### 3. Onboarding as a new module

**Choice**: Create `src/modules/onboarding/` with its own controller, service, and DTOs. The onboarding service orchestrates calls to `UserService`, `DefaultTransactionCategoriesService`, and `TransactionCategoriesService`.

**Why not extend auth or profile**: Onboarding has distinct lifecycle logic (status checks, completion validation) that doesn't belong in auth (token management) or profile (CRUD). A dedicated module keeps responsibilities clear and is easy to remove or evolve.

### 4. Registration still returns tokens (user is authenticated but not onboarded)

**Choice**: After registration, the API still returns access/refresh tokens. The user is authenticated but `onboardingCompleted: false`. The BFF uses this flag to route to onboarding instead of the dashboard.

**Why**: The user needs to be authenticated to call onboarding endpoints (set currency, assign categories, etc.). Blocking token issuance until email verification would require a separate pre-auth flow and complicate the frontend.

### 5. Social auth: emailVerified=true, onboardingCompleted=false

**Choice**: Social auth users get `emailVerified: true` on creation (Google/GitHub already verify emails) but `onboardingCompleted: false` (they still need to set currency and categories).

**Why**: Social providers guarantee email ownership. But the user still needs to configure their tracker preferences.

### 6. Password setup for social auth users during onboarding

**Choice**: The `POST /onboarding/complete` endpoint accepts an optional `password` field. For social auth users (no existing `passwordHash`), this sets a password so they can also log in via email/password. For email-registered users, this field is ignored (they already have a password; use `PATCH /profile/password` to change it).

**Why not reuse profile changePassword**: `PATCH /profile/password` requires `currentPassword`, which social auth users don't have. A separate optional field on onboarding completion is cleaner than adding conditional logic to the password change endpoint.

### 7. Onboarding completion validation

**Choice**: `POST /onboarding/complete` validates:

1. `baseCurrencyCode` is provided in the request body (required)
2. User has at least one transaction category (queried from DB)
3. If `password` is provided, it meets strength requirements

If any required validation fails, return 400 with specific error. On success: update `baseCurrencyCode`, optionally set `passwordHash`, set `onboardingCompleted: true`.

### 8. Database migration: onboardingCompleted default change

**Choice**: Change the schema default from `true` to `false`. Add a migration that alters the column default but does NOT update existing rows (they keep `onboardingCompleted: true`).

**Why**: Existing users are already onboarded. Only new registrations should default to `false`.

## Risks / Trade-offs

- **[Risk] Email delivery failures** → Users can't verify email. Mitigation: Log send failures. A resend endpoint can be added as a fast follow. Users are still authenticated and can use the app for onboarding steps; only `emailVerified` remains false.
- **[Risk] Changing onboardingCompleted default breaks existing flows** → Mitigation: The migration only changes the column default, not existing rows. All current users remain `onboardingCompleted: true`.
- **[Risk] Users abandon onboarding** → They have accounts with `onboardingCompleted: false` and limited access. Mitigation: This is by design. The BFF guides them back to onboarding. Stale accounts can be cleaned up later.
- **[Trade-off] No API-level guard for onboarding** → We rely on BFF to enforce the onboarding gate. This keeps the API simpler but means direct API consumers could bypass onboarding. Acceptable for current architecture where BFF is the only consumer.
- **[Trade-off] Email verification is not blocking** → Users can proceed to onboarding without verifying email. The `emailVerified` flag is available for the BFF to enforce if needed, but we don't block API access on it.
