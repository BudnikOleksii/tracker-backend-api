## Why

Users need to import historical transaction data from external sources (bank exports, other apps). Currently, transactions can only be created one at a time via `POST /transactions`, making bulk migration tedious and impractical. A file-based import endpoint lets users upload their entire transaction history in one action.

## What Changes

- Add `POST /transactions/import` endpoint accepting multipart file upload (JSON or CSV)
- Server-side parsing of both JSON and CSV formats into a normalized transaction structure
- Auto-resolution of categories and subcategories by name — find existing or create new ones per user
- Bulk insert of all parsed transactions within a single database transaction (all-or-nothing)
- Return an import summary response with counts of created transactions, categories, and subcategories
- Add `csv-parse` dependency for CSV parsing

## Capabilities

### New Capabilities

- `transaction-import`: File upload, parsing (JSON/CSV), category resolution, bulk transaction creation, and import summary response

### Modified Capabilities

_None — this is additive. Existing transaction CRUD, category, and subcategory behavior remains unchanged._

## Impact

- **API**: New `POST /transactions/import` endpoint on the transactions controller
- **Database**: No schema changes — uses existing `transactions` and `transactionCategories` tables
- **Dependencies**: New `csv-parse` (and `@types/multer`) packages
- **Code**: New methods in `TransactionsService`, `TransactionRepository`, new DTOs, parser utility
- **Caching**: Import clears the same cache keys as single-transaction creation (`transactions`, `transactions-analytics`, `budgets`)
