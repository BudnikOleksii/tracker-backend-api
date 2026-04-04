## Context

Currently, transactions are created one at a time via `POST /transactions`, which requires a pre-existing `categoryId`. Users importing historical data from bank exports or other apps have no way to bulk-upload. The import file format (JSON/CSV) references categories by name, not UUID, so the system must resolve or create categories on the fly.

Existing infrastructure:

- `TransactionRepository.create()` inserts one row at a time
- `TransactionCategory` has a unique constraint on `(userId, name, type, parentCategoryId)` — this is the natural lookup key for find-or-create
- The `CacheService` already handles prefix-based invalidation for `transactions`, `transactions-analytics`, and `budgets`

## Goals / Non-Goals

**Goals:**

- Accept JSON or CSV file uploads and create all transactions in a single atomic operation
- Auto-resolve categories and subcategories by name (find existing or create new)
- Return a clear summary of what was imported (counts of transactions, categories, subcategories created)
- Support the existing sample data format (`Date`, `Category`, `Type`, `Amount`, `Currency`, `Subcategory`)

**Non-Goals:**

- Preview/confirm workflow (two-step import) — keep it simple with single-step import
- Duplicate detection (e.g., skipping transactions that already exist) — out of scope for v1
- Custom column mapping or configurable date formats — hardcode the known format
- Streaming/chunked uploads for very large files — assume reasonable file sizes (< 10MB)
- Import from external APIs (bank connections, Plaid, etc.)

## Decisions

### 1. Single endpoint with multipart file upload

**Decision:** One `POST /transactions/import` endpoint accepting `multipart/form-data` with a file field.

**Why:** Simpler than two endpoints (parse + confirm). The data format is well-defined, and there's no need for user review before committing. NestJS has built-in multer support via `@UseInterceptors(FileInterceptor)`.

**Alternatives considered:**

- Two-step (preview + confirm): Adds session state complexity, unnecessary for a known format
- JSON body with parsed data: Pushes parsing to the client, duplicates format logic

### 2. File format detection by extension

**Decision:** Detect format from file extension (`.json` or `.csv`). Reject other extensions with 400.

**Why:** Simple and unambiguous. Content-type sniffing is unreliable for CSV.

### 3. Category resolution via find-or-create in DB transaction

**Decision:** Within a single DB transaction:

1. Collect all unique `(name, type)` pairs from the import data
2. Query existing categories for the user matching those pairs
3. Insert missing parent categories, then missing subcategories (subcategories need parentCategoryId)
4. Build a lookup map `(name, type, parentName?) → categoryId`
5. Bulk insert all transactions using resolved categoryIds

**Why:** The unique constraint on `(userId, name, type, parentCategoryId)` makes find-or-create safe. Doing it in batches (all categories first, then all transactions) is more efficient than per-row resolution.

**Alternatives considered:**

- Per-row find-or-create: Simpler logic but N+1 queries, poor performance on large imports
- Upsert with `ON CONFLICT`: Works for categories but requires careful handling of the composite unique constraint with nullable `parentCategoryId`

### 4. Bulk insert transactions with Drizzle

**Decision:** Use Drizzle's `insert().values([...])` to bulk-insert all transactions in one statement.

**Why:** Single round-trip to DB, atomic within the transaction. Drizzle supports array inserts natively.

### 5. Parser as utility functions within the service

**Decision:** Keep JSON and CSV parsing as private methods in `TransactionsService` (or a small helper file in the transactions module). No separate parser service/module.

**Why:** The parsing logic is simple and specific to this feature. A dedicated service adds unnecessary abstraction for straightforward `JSON.parse` and `csv-parse` calls.

### 6. File size and row limits

**Decision:** Limit file size to 5MB (via multer config) and max 1000 rows per import.

**Why:** Prevents abuse and keeps the DB transaction duration reasonable. Users with more data can split into multiple imports.

### 7. CSV parsing library

**Decision:** Use `csv-parse` (part of the `csv` ecosystem) with `sync` API for simplicity.

**Why:** Well-maintained, standard Node.js CSV parser. The sync API is fine since the entire file is already in memory from multer.

## Risks / Trade-offs

**[Large imports may slow down under DB transaction]** → Mitigated by 1000-row limit. If needed later, can chunk into multiple DB transactions.

**[Category name matching is case-sensitive]** → Acceptable for v1. The unique constraint is case-sensitive, so "Food" and "food" would create separate categories. Can add case-insensitive matching later.

**[No rollback UX if import creates unwanted categories]** → Users can delete categories via existing CRUD endpoints. Acceptable trade-off for v1 simplicity.

**[CSV parsing edge cases (encoding, delimiters)]** → Assume UTF-8 and comma delimiter. Document supported format clearly in API docs.
