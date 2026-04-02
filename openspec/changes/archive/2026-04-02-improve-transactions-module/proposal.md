## Why

The transactions list endpoint currently returns results in a fixed order (by date) with no user control over sorting direction. Users need to sort transactions in ascending or descending order to analyze their spending patterns effectively. Additionally, when filtering by a parent category, the response is flat -- users cannot see how transactions break down across subcategories within that category, which limits their ability to understand detailed spending.

## What Changes

- Add `sortBy` and `sortOrder` query parameters to `GET /transactions` to support sorting by `date`, `amount`, or `createdAt` in `asc` or `desc` order
- Add a new endpoint `GET /transactions/by-category/:categoryId` that returns transactions grouped by subcategory, giving users a hierarchical view of their spending within a parent category
- The grouped endpoint includes subcategory metadata (name, id) and per-subcategory transaction totals

## Capabilities

### New Capabilities

- `transaction-sorting`: Configurable sort direction and sort field for the transactions list endpoint
- `transactions-by-category`: Endpoint that returns transactions for a parent category grouped by its subcategories, with summary totals per subcategory

### Modified Capabilities

- `transactions-crud`: The list transactions requirement gains new optional query parameters for sorting

## Impact

- **API**: New query parameters on `GET /transactions`; new endpoint `GET /transactions/by-category/:categoryId`
- **Code**: Changes to `TransactionQueryDto`, `TransactionRepository`, `TransactionsService`, `TransactionsController`; new response DTO for grouped results
- **Database**: No schema changes required -- sorting uses existing indexed columns, grouping uses existing category/subcategory relationships
- **Cache**: New cache keys for the grouped endpoint; existing cache invalidation patterns extend naturally
