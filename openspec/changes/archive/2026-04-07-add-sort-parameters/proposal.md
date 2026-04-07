## Why

Only `GET /api/transactions` supports `sortBy`/`sortOrder` query parameters. The remaining 6 collection endpoints (budgets, transaction categories, default transaction categories, recurring transactions, users, audit logs) use hardcoded ordering with no user control. This makes client-side table views rigid and forces frontend workarounds for basic sorting needs.

## What Changes

- Extract a shared `SortOrder` type (`asc` | `desc`) and reusable sort validation helpers into `src/shared/`
- Add `sortBy` and `sortOrder` query parameters to all 6 collection endpoints that currently lack them
- Each endpoint gets entity-specific allowed `sortBy` fields (e.g., budgets allow `amount`, `startDate`, `createdAt`)
- Update each repository's `findAll` method to apply dynamic `ORDER BY` based on sort parameters
- Default sort behavior preserved for backwards compatibility (each endpoint keeps its current default ordering when no sort params provided)

## Capabilities

### New Capabilities

- `collection-sorting`: Shared sort infrastructure (SortOrder type, sort constants pattern) and sort parameter support across all collection endpoints

### Modified Capabilities

- `transaction-sorting`: Refactor to use shared sort infrastructure instead of module-local constants
- `budgets-crud`: Add sortBy/sortOrder to budget list endpoint
- `transaction-categories-crud`: Add sortBy/sortOrder to category list endpoint
- `default-categories-admin`: Add sortBy/sortOrder to default categories list endpoint
- `recurring-transactions-crud`: Add sortBy/sortOrder to recurring transactions list endpoint

## Impact

- **Query DTOs**: 6 DTOs gain `sortBy` and `sortOrder` optional fields
- **Repositories**: 6 repositories updated with sort column maps and dynamic ORDER BY
- **Shared code**: New shared sort type/constants extracted from transactions module
- **API surface**: Non-breaking — all new parameters are optional with backwards-compatible defaults
- **User/audit-log endpoints**: Admin-only list endpoints also gain sort support
