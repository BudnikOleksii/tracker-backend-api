## Context

The app already supports importing transactions from JSON/CSV files via `POST /transactions/import`. The import format uses fields: `Date`, `Category`, `Type`, `Amount`, `Currency`, `Subcategory`. The export feature mirrors this — users download their transactions in the same format they can import.

The existing `findAll` repository method supports filtering by date range, category, and type but is paginated and returns category IDs, not names. The export needs unpaginated results with resolved category/subcategory names.

## Goals / Non-Goals

**Goals:**

- Allow authenticated users to download all their transactions as a JSON or CSV file
- Support optional filtering by date range and category
- Output format matches the import format exactly (round-trip compatible)
- Resolve category IDs to human-readable names including parent/subcategory hierarchy

**Non-Goals:**

- Streaming/chunked downloads for very large datasets (can be added later)
- Export in other formats (Excel, PDF)
- Scheduled/automated exports
- Export of other entities (categories, budgets)

## Decisions

### 1. Endpoint shape: `GET /transactions/export?format=json|csv`

Reuses the same controller. The `format` query param selects output type. Filter params (`dateFrom`, `dateTo`, `categoryId`) follow the same validation as the existing `TransactionQueryDto` but without pagination/sorting fields.

**Alternative considered**: Separate `/transactions/export/json` and `/transactions/export/csv` routes — rejected as less RESTful and duplicates route definitions.

### 2. CSV serialization with `csv-stringify/sync`

The `csv` package is already a dependency (used for `csv-parse/sync` on import). Using `csv-stringify/sync` from the same package keeps dependencies minimal.

**Alternative considered**: Manual CSV generation — rejected as error-prone with special characters and escaping.

### 3. Repository method joins categories to resolve names

A new `findAllForExport` repository method joins `transactions` with `transactionCategories` (and a self-join for parent category) to return category and subcategory names in a single query. This avoids N+1 queries.

### 4. Response via NestJS `StreamableFile` or raw `Response`

Use the raw Express `Response` object to set `Content-Type` and `Content-Disposition` headers, then send the serialized body. This bypasses the envelope interceptor since the response is a file download, not a JSON API response.

### 5. Date formatting matches import format

Dates are formatted as `MM/DD/YYYY HH:mm:ss` (UTC) to match the import parser's expected format, ensuring round-trip compatibility.

## Risks / Trade-offs

- **[Large exports]** → No pagination means all transactions load into memory. Acceptable for typical user volumes; can add streaming later if needed.
- **[Route ordering]** → `GET /transactions/export` must be registered before `GET /transactions/:id` to avoid `export` being parsed as a UUID param. NestJS processes routes in declaration order, so placing the export method above `findById` in the controller handles this.
