## Why

The application currently only supports email/password authentication, which creates friction for users who prefer one-click sign-in. Adding social authentication via Google and GitHub reduces registration abandonment, improves login UX, and aligns with user expectations for modern web applications.

## What Changes

- Add OAuth 2.0 authentication flow for Google and GitHub providers
- New `/auth/google` and `/auth/github` endpoints that initiate OAuth redirects
- New `/auth/google/callback` and `/auth/github/callback` endpoints that handle provider callbacks
- Add `authProvider` and `authProviderId` fields to the users table to track social accounts
- Make `passwordHash` nullable on the users table to support social-only accounts (no password)
- Social login creates a new user if the email doesn't exist, or links to an existing account if it does
- Social login issues the same JWT access token + refresh token cookie as email/password login
- Add Google and GitHub OAuth environment variables (client ID, secret, callback URL)
- **BREAKING**: Users table schema changes (`passwordHash` becomes nullable, new columns added)

## Capabilities

### New Capabilities

- `social-auth-google`: Google OAuth 2.0 authentication flow using Passport Google strategy
- `social-auth-github`: GitHub OAuth 2.0 authentication flow using Passport GitHub strategy
- `social-auth-account-linking`: Logic for linking social accounts to existing users and handling new social-only registrations

### Modified Capabilities

_(none — existing auth endpoints and flows remain unchanged)_

## Impact

- **Database**: Migration to alter `users` table (nullable `passwordHash`, new `authProvider`/`authProviderId` columns)
- **Auth module**: New strategies, controller endpoints, and service methods
- **Dependencies**: New packages (`passport-google-oauth20`, `passport-github2`)
- **Environment**: New env vars for Google and GitHub OAuth credentials
- **Existing users**: No impact — current email/password users continue to work as before
- **Auth service**: `register` and `login` remain unchanged; new `socialLogin` method added
