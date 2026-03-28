## Why

Users currently have no way to view or manage their own profile, change their password, set preferences like base currency, or delete their account. All user management is admin-only. Adding self-service profile management is essential for a usable personal finance tracker.

## What Changes

- Add a new `profile` module with endpoints for authenticated users to manage their own data
- **GET /profile** — View own profile (email, countryCode, baseCurrencyCode, preferences)
- **PATCH /profile** — Update profile fields (countryCode, baseCurrencyCode)
- **PATCH /profile/password** — Change password (requires current password verification)
- **DELETE /profile** — Soft-delete own account (requires password confirmation)
- Add `firstName` and `lastName` columns to the `users` database schema
- Extend the registration DTO to accept name fields

## Capabilities

### New Capabilities

- `profile-read`: Authenticated user can view their own profile information
- `profile-update`: Authenticated user can update their profile fields (name, country, currency)
- `password-change`: Authenticated user can change their password with current password verification
- `account-deletion`: Authenticated user can soft-delete their own account with password confirmation

### Modified Capabilities

_(none — existing specs are unaffected)_

## Impact

- **Database**: New `firstName` and `lastName` columns on `users` table; migration required
- **API**: New `/profile` route group (4 endpoints); no breaking changes to existing endpoints
- **Auth module**: Registration DTO extended with optional name fields
- **Dependencies**: No new packages required
