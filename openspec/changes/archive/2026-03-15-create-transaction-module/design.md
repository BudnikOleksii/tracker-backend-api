## Context

The tracker application has a fully defined `transactions` database table with fields for amount, currency, type (EXPENSE/INCOME), category reference, date, and description. The `transaction-categories` module is already implemented and provides the category CRUD that transactions depend on. The module architecture follows a strict controller → service → repository layering pattern established by existing modules.

## Goals / Non-Goals

**Goals:**

- Implement a transactions module following the established 4-layer architecture (module, controller, service, repository)
- Provide full CRUD REST API for transactions scoped to the authenticated user
- Support filtering by type, category, currency, and date range
- Validate category ownership and type consistency when creating/updating transactions
- Follow all existing conventions (DTOs, pagination, error handling, Swagger docs)

**Non-Goals:**

- Bulk transaction import/export
- Transaction analytics or aggregation endpoints (summaries, totals by category)
- Multi-currency conversion
- Recurring/scheduled transactions
- Splitting transactions across categories

## Decisions

### 1. Follow the transaction-categories module pattern exactly

**Decision**: Mirror the `transaction-categories` module structure — same file layout, DTO patterns, repository interfaces, and controller decorators.
**Rationale**: Consistency reduces cognitive load and makes the codebase predictable. The pattern is proven and well-established.

### 2. Validate category via direct repository query

**Decision**: Validate that the referenced `categoryId` belongs to the user and is not soft-deleted by querying the `transactionCategories` table directly in the transactions repository, rather than importing `TransactionCategoriesService`.
**Rationale**: Avoids a circular dependency risk and keeps the validation close to the data layer. The check is a simple existence query, not business logic.
**Alternative considered**: Importing `TransactionCategoriesService` — rejected because it introduces cross-module coupling for a simple ownership check.

### 3. Date range filtering with `dateFrom` and `dateTo` query params

**Decision**: Use optional `dateFrom` and `dateTo` query parameters (ISO 8601 date strings) for date range filtering.
**Rationale**: Date range is the most common filtering need for financial transactions. Using separate from/to params is more explicit and composable than a single range param.

### 4. Amount stored as string in DTOs, numeric in DB

**Decision**: Accept `amount` as a string in DTOs (matching the `numeric` DB type) to avoid floating-point precision issues.
**Rationale**: The database column is `numeric(19,2)`. JavaScript floating-point numbers lose precision for financial values. String representation preserves exactness.

## Risks / Trade-offs

- **[Category type mismatch]** → Validate that `transaction.type` matches `category.type` on create/update. Return a 400 error with a clear message if mismatched.
- **[Large result sets]** → Offset pagination with configurable `pageSize` (max 100) limits memory usage. No additional mitigation needed at this stage.
- **[Soft-deleted category references]** → Transactions referencing soft-deleted categories remain valid (historical data). New transactions cannot reference soft-deleted categories (enforced at validation).
