## Why

The `transactions` table already exists in the database schema but there is no NestJS module to expose CRUD operations over it. Users need the ability to create, read, update, and delete financial transactions (expenses and incomes) to make the tracker application functional.

## What Changes

- Add a new `transactions` NestJS module (`src/modules/transactions/`) with controller, service, repository, DTOs, and constants
- Expose REST endpoints for full CRUD on transactions scoped to the authenticated user
- Support filtering by type (EXPENSE/INCOME), category, currency, and date range
- Support offset-based pagination consistent with existing modules
- Validate that the referenced category belongs to the user and matches the transaction type
- Register the module in `app.module.ts`

## Capabilities

### New Capabilities

- `transactions-crud`: Full CRUD operations for user-scoped financial transactions with filtering, pagination, and category validation

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- **New files**: `src/modules/transactions/` (module, controller, service, repository, constants, DTOs)
- **Modified files**: `src/app.module.ts` (register new module)
- **APIs**: New REST endpoints under `/transactions`
- **Dependencies**: Uses existing `transaction-categories` module service for category validation
- **Database**: No schema changes — uses the existing `transactions` table
