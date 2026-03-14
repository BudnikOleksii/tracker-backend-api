## Why

The database schema for transaction categories already exists (with hierarchical support via `parentCategoryId`), and categories are seeded, but there is no API module to manage them. Users need CRUD endpoints to create, read, update, and delete their own transaction categories to organize their finances.

## What Changes

- Create a new `transaction-categories` module under `src/modules/transaction-categories/`
- Implement repository, service, and controller layers following existing patterns (user module)
- Provide endpoints for listing (with pagination/filtering by type), creating, reading, updating, and soft-deleting categories
- Scope all operations to the authenticated user (users can only manage their own categories)
- Support hierarchical categories (parent/child relationships)

## Capabilities

### New Capabilities

- `transaction-categories-crud`: Full CRUD operations for user-scoped transaction categories with pagination, type filtering, and hierarchical category support

### Modified Capabilities

_(none)_

## Impact

- **New module**: `src/modules/transaction-categories/` with controller, service, repository, DTOs, and module definition
- **App module**: Import `TransactionCategoriesModule`
- **Auth**: All endpoints require JWT authentication (existing `JwtAuthGuard`)
- **Database**: No schema changes — uses existing `transactionCategories` table
