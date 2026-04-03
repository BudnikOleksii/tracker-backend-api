## Why

New users face a blank slate when they first register -- no categories exist, so they can't create transactions until they manually set up their own category hierarchy. This creates friction during onboarding. Default categories provide a ready-to-use starting point, letting users track expenses and income immediately after registration.

## What Changes

- **New `DefaultTransactionCategory` table**: A separate table storing admin-managed default category templates (name, type, optional parent hierarchy), independent of any user.
- **Admin CRUD for default categories**: Admin users can create, update, and delete default categories via a new `/default-transaction-categories` endpoint. These serve as templates that get copied to new users.
- **Auto-assign on registration**: When a user registers, all active default categories are copied into their personal `TransactionCategory` table. The copied categories are fully owned by the user -- they can update or delete them freely.
- **New `default-transaction-categories` module**: Encapsulates admin management of default category templates.
- **Registration flow update**: The `AuthService.register()` method is extended to copy default categories after user creation.

## Capabilities

### New Capabilities

- `default-categories-admin`: Admin CRUD endpoints for managing default category templates (create, read, update, delete)
- `default-categories-assignment`: Automatic copying of default categories to new users during registration

### Modified Capabilities

- `transaction-categories-crud`: No requirement changes -- user categories remain fully user-owned and unchanged

## Impact

- **Database**: New `DefaultTransactionCategory` table with migration
- **API**: New `/api/default-transaction-categories` admin-only endpoints
- **Auth module**: `register()` flow extended to call category assignment after user creation
- **Modules**: New `default-transaction-categories` module; `auth` module gains dependency on it
