## Context

Transaction and recurring transaction GET endpoints currently return a flat `categoryId` field. The `TransactionCategory` table uses a self-referential `parentCategoryId` to model a two-level hierarchy (parent category → subcategories). Clients must call the categories endpoint separately and join locally. Both repositories already import and query the `transactionCategories` table for validation, so the schema reference is already in place.

## Goals / Non-Goals

**Goals:**

- Embed category name and parent category details in transaction/recurring transaction GET responses
- Keep `categoryId` as a top-level field for backward compatibility
- Use a single LEFT JOIN per query — no N+1 queries
- Apply to both list and detail endpoints in both modules

**Non-Goals:**

- Denormalizing category data into the transactions table
- Changing create/update request DTOs (they continue to accept `categoryId`)
- Adding category details to export, import, or transactions-by-category endpoints (these already handle categories differently)
- Restructuring the category hierarchy model

## Decisions

### 1. LEFT JOIN with a self-join for parent category resolution

The category assigned to a transaction can be either a parent or a subcategory. To resolve the full hierarchy in one query:

- LEFT JOIN `TransactionCategory` (aliased as `category`) on `categoryId`
- LEFT JOIN `TransactionCategory` (aliased as `parentCategory`) on `category.parentCategoryId`

This gives us the category name, and if it's a subcategory, the parent's id and name — all in a single query.

**Alternative considered**: Fetch categories in a separate query and map in-memory. Rejected because the JOIN is simpler, avoids two round-trips, and the FK is already indexed.

### 2. Nested `category` object in response DTO

Response shape:

```json
{
  "categoryId": "uuid",
  "category": {
    "id": "uuid",
    "name": "Groceries",
    "parentCategory": null
  }
}
```

When the transaction's category is a subcategory:

```json
{
  "categoryId": "uuid",
  "category": {
    "id": "uuid",
    "name": "Vegetables",
    "parentCategory": {
      "id": "uuid",
      "name": "Groceries"
    }
  }
}
```

**Alternative considered**: Flatten as `categoryName` + `parentCategoryId` + `parentCategoryName` top-level fields. Rejected because nesting is more idiomatic, extensible, and avoids nullable field proliferation.

### 3. Share a `CategoryInfoDto` across both modules

A single shared DTO class (`CategoryInfoDto` with nested `ParentCategoryInfoDto`) will be used by both `TransactionResponseDto` and `RecurringTransactionResponseDto`. Place in `src/shared/dtos/`.

### 4. Extend existing Info interfaces

Add a `category` field to `TransactionInfo` and `RecurringTransactionInfo` interfaces in the respective repositories. The `toTransactionInfo` / `toRecurringTransactionInfo` mapper methods will be updated to accept the joined row shape.

## Risks / Trade-offs

- **Soft-deleted categories**: If a category is soft-deleted (`deletedAt` set), the LEFT JOIN still resolves it (transactions retain the FK). This is correct — the transaction was created with that category and should display its name. No filter on `deletedAt` in the JOIN.
- **Cache size increase**: Cached responses grow slightly with the added category fields. Negligible impact given the small size of name strings.
- **Breaking change risk**: Low — this is purely additive. `categoryId` remains unchanged. New `category` field is added alongside it.
