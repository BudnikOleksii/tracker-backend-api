## Context

The transactions module currently supports listing transactions with offset pagination and filtering by type, categoryId, currencyCode, and date range. Results are always ordered by `transactions.date` with no user control over sort direction or field. Categories support a parent-child hierarchy (self-referencing `parentCategoryId` FK), but the transactions list endpoint returns a flat list with no grouping by subcategory.

The database already has indexes on `date`, `amount`, `type`, `categoryId`, and `currencyCode` columns, which supports efficient sorting without schema changes.

## Goals / Non-Goals

**Goals:**

- Allow users to control sort direction (asc/desc) and sort field (date, amount, createdAt) on the transactions list endpoint
- Provide a new endpoint that returns transactions for a parent category, grouped by subcategory, with per-subcategory totals
- Maintain existing caching and cache invalidation patterns

**Non-Goals:**

- Multi-column sorting (sort by date then amount) -- single sort field is sufficient for now
- Aggregation across currencies (each subcategory group shows totals per currency)
- Cursor-based pagination -- existing offset pagination remains
- Modifying the transaction database schema

## Decisions

### 1. Sort parameters as optional query params with sensible defaults

Add `sortBy` (enum: `date`, `amount`, `createdAt`) and `sortOrder` (enum: `asc`, `desc`) to `TransactionQueryDto`. Defaults: `sortBy=date`, `sortOrder=desc` (preserves current behavior).

**Alternative considered**: A single `sort` string like `"-date"` or `"+amount"`. Rejected because two explicit params are clearer for API consumers and easier to validate with class-validator decorators.

### 2. New endpoint for category-grouped transactions rather than modifying the list endpoint

`GET /transactions/by-category/:categoryId` returns a different response shape (grouped by subcategory), so it belongs on its own endpoint rather than adding a `groupBy` query param to the existing list.

**Alternative considered**: Adding a `groupBy=subcategory` query param to `GET /transactions`. Rejected because the response shape is fundamentally different (nested groups vs flat list), which would complicate the existing DTO and make the endpoint harder to document.

### 3. Include transactions directly under the parent category in a dedicated group

Transactions assigned directly to the parent category (not to any subcategory) will appear in a group with `subcategory: null`. This ensures all transactions for the category are accounted for.

### 4. Per-subcategory totals grouped by currency

Each subcategory group includes a `totals` array with `{ currencyCode, total }` entries. Since users may have transactions in multiple currencies, summing across currencies would be misleading.

### 5. Pagination on the grouped endpoint

The grouped endpoint returns all subcategory groups for the given parent category (typically a small number). Individual subcategory groups include their full transaction lists. If performance becomes an issue, per-group pagination can be added later -- but the typical subcategory count (5-15) makes this unlikely.

**Alternative considered**: Paginate within each subcategory group. Rejected as premature complexity -- subcategory transaction counts are manageable, and adding pagination within groups significantly complicates the response shape.

## Risks / Trade-offs

- **[Performance of grouped endpoint]** -- The grouped query joins transactions with categories and aggregates per subcategory. For users with many transactions in a single category, this could be slow. Mitigation: The endpoint is cached, and `categoryId` and `userId` indexes ensure efficient filtering. A `limit` param can be added per-group later if needed.

- **[Cache key explosion]** -- New sort params multiply the number of distinct cache keys for the list endpoint. Mitigation: This is consistent with how existing filter params (type, dateFrom, etc.) already create varied cache keys. Cache invalidation by prefix handles this cleanly.

- **[Breaking change risk]** -- The default sort behavior (`date desc`) matches current behavior, so existing clients are unaffected. The grouped endpoint is entirely new. No breaking changes.
