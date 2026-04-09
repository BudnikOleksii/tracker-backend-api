## Why

The current registration flow immediately gives users full access without verifying their email or setting up essential preferences (currency, categories). This leads to incomplete user profiles and no email ownership verification, which is a security and UX problem. We need a proper email verification step and a structured onboarding flow that ensures users have the minimum setup (verified email, default currency, at least one category) before accessing the dashboard.

## What Changes

- **BREAKING**: Remove `firstName` and `lastName` fields from the registration DTO — these are no longer collected at registration time
- **BREAKING**: Remove automatic default category assignment during registration (both email and social auth) — categories are now set up during onboarding
- **BREAKING**: Change `onboardingCompleted` default from `true` to `false` — new users must complete onboarding before accessing the dashboard
- Add email verification flow: send verification email on registration, verify via token link, redirect to frontend onboarding page
- Social auth users get `emailVerified: true` automatically on registration (no email verification needed)
- Add `POST /onboarding/complete` endpoint that validates required setup (default currency, at least one category) and optionally sets a password (for social auth users)
- Add `GET /onboarding/status` endpoint so frontend can check what onboarding steps remain
- Add `POST /onboarding/assign-default-categories` endpoint to trigger default category assignment during onboarding
- Add `GET /auth/verify-email` endpoint to handle email verification token and redirect to frontend
- Add an email/mailer service for sending verification emails

## Capabilities

### New Capabilities

- `email-verification`: Email verification flow — sending verification emails on registration, verifying tokens, marking emails as verified, redirecting to frontend
- `onboarding`: User onboarding flow — complete onboarding endpoint with validation (currency, categories, optional password), status check, assign default categories during onboarding
- `mailer`: Email service for sending transactional emails (verification emails initially, extensible for future use)

### Modified Capabilities

- `default-categories-assignment`: Default category assignment is no longer triggered at registration — it moves to an explicit onboarding action

## Impact

- **Auth module**: Registration flow changes (no firstName/lastName, no auto-categories, sends verification email, social auth sets emailVerified)
- **Database**: `onboardingCompleted` default changes from `true` to `false` — requires a migration. Existing users should keep `onboardingCompleted: true`
- **New module**: `onboarding` module with controller, service, DTOs
- **New module**: `mailer` module (shared service for sending emails)
- **Environment**: New env vars for email service configuration (SMTP or provider-specific)
- **Frontend/BFF**: Must handle `onboardingCompleted: false` by routing to onboarding page, must handle email verification redirect
- **Existing endpoints**: Transaction import (CSV/JSON) still works as-is for category creation during onboarding
