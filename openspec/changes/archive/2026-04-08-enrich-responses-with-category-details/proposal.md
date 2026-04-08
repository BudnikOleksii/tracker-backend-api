## Why

Transaction and recurring transaction GET endpoints return only a `categoryId`, forcing clients to make separate API calls to the categories endpoint to resolve category names and subcategory details. This creates unnecessary round-trips and client-side join logic for the most common read operations.

## What Changes

- Enrich `TransactionResponseDto` with a nested `category` object containing `id`, `name`, and optional `parentCategory` (id, name) when the category is a subcategory
- Enrich `RecurringTransactionResponseDto` with the same nested `category` object
- Update transaction and recurring transaction repositories to JOIN with the `TransactionCategory` table on read queries (`findAll`, `findById`)
- Update `TransactionInfo` and `RecurringTransactionInfo` interfaces to carry category details
- Retain `categoryId` as a top-level field for backward compatibility

## Capabilities

### New Capabilities

- `enriched-category-responses`: Embed category name and parent category info in transaction and recurring transaction response DTOs

### Modified Capabilities

- `transactions-crud`: GET endpoints now return category details inline
- `recurring-transactions-crud`: GET endpoints now return category details inline
- `crud-response-dtos`: Transaction response DTOs gain a nested `category` object

## Impact

- **APIs**: GET `/transactions`, GET `/transactions/:id`, GET `/recurring-transactions`, GET `/recurring-transactions/:id` — response shape expands (non-breaking, additive)
- **Code**: `transactions.repository.ts`, `recurring-transactions.repository.ts` — queries gain a LEFT JOIN on `TransactionCategory`
- **Code**: `TransactionResponseDto`, `RecurringTransactionResponseDto` — new `category` property
- **Code**: `TransactionInfo`, `RecurringTransactionInfo` — new `category` field in interfaces
- **Performance**: Minimal — single LEFT JOIN on indexed FK; replaces N+1 client calls
- **Cache**: Existing cache keys remain valid; category data is now included in cached results
