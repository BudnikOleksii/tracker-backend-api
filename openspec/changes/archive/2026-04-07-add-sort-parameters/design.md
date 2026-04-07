## Context

The transactions module already implements sorting via module-local constants (`SORT_BY_FIELDS`, `SORT_ORDERS`) in `transactions.constants.ts`, a `SORT_COLUMN_MAP` in the repository, and optional `sortBy`/`sortOrder` fields in `TransactionQueryDto`. Six other collection endpoints hardcode their ORDER BY clauses. This change replicates the proven transactions pattern across all collection endpoints while extracting shared pieces.

## Goals / Non-Goals

**Goals:**

- Every collection endpoint accepts optional `sortBy` and `sortOrder` query parameters
- Each entity defines its own allowed sort fields (type-safe, validated)
- Backwards compatible — omitting sort params produces the same ordering as today
- Consistent pattern across all modules

**Non-Goals:**

- Multi-column sorting (e.g., `sortBy=amount,date`) — not needed yet
- Cursor-based pagination — separate concern
- Sorting on nested/joined fields (e.g., sort budgets by category name)

## Decisions

### 1. Shared `SortOrder` type + per-module `sortBy` constants

**Decision:** Extract `SortOrder = 'asc' | 'desc'` and `SORT_ORDERS` to `src/shared/constants/sort.constants.ts`. Each module keeps its own `SORT_BY_FIELDS` and `SortByField` type in `<module>.constants.ts`, since allowed fields differ per entity.

**Why:** `SortOrder` is universal. `sortBy` fields are entity-specific (budgets sort by `amount`, categories by `name`, etc.). Forcing a generic sortBy type would lose type safety.

**Alternative considered:** A generic `SortableQueryDto<T>` base class. Rejected because `class-validator` decorators don't compose well with generics — each DTO needs concrete `@IsIn()` values at decoration time.

### 2. Repository sort column map pattern

**Decision:** Each repository defines a `SORT_COLUMN_MAP` object mapping string field names to Drizzle column references, identical to the existing transactions pattern.

**Why:** Prevents SQL injection (only mapped columns are sortable), provides a single place to see what's sortable, and the pattern is already proven in `transactions.repository.ts`.

### 3. Default sort values in repository, not DTO

**Decision:** DTO fields remain optional (`sortBy?: ...`, `sortOrder?: ...`). Default values are applied in the repository's `findAll` method via destructuring defaults.

**Why:** Matches the existing transactions pattern. Keeps the API contract clean (Swagger shows fields as optional) while ensuring deterministic ordering.

### 4. Refactor transactions module to use shared SortOrder

**Decision:** Replace `transactions.constants.ts` `SORT_ORDERS`/`SortOrder` with imports from `src/shared/constants/sort.constants.ts`. Keep `SORT_BY_FIELDS` and `SortByField` local to the transactions module.

**Why:** Eliminates duplication. The transactions module becomes consistent with the new pattern rather than being a special case.

## Risks / Trade-offs

- **[Risk] Sort on unindexed columns degrades performance** → Mitigation: Only expose columns that are already indexed or cheap to sort (primary keys, timestamps). The composite indexes added in audit item #8 cover the key sort columns.
- **[Risk] Adding fields to DTOs could break strict API clients** → Mitigation: All new fields are optional query params — additive, non-breaking change.

## Allowed Sort Fields Per Entity

| Entity                     | sortBy fields                                            | Default sortBy | Default sortOrder |
| -------------------------- | -------------------------------------------------------- | -------------- | ----------------- |
| Transaction                | `date`, `amount`, `createdAt`                            | `date`         | `desc`            |
| Budget                     | `amount`, `startDate`, `endDate`, `createdAt`            | `createdAt`    | `desc`            |
| TransactionCategory        | `name`, `createdAt`                                      | `name`         | `asc`             |
| DefaultTransactionCategory | `name`, `createdAt`                                      | `name`         | `asc`             |
| RecurringTransaction       | `amount`, `startDate`, `nextOccurrenceDate`, `createdAt` | `createdAt`    | `desc`            |
| User                       | `email`, `createdAt`                                     | `createdAt`    | `desc`            |
| AuditLog                   | `createdAt`                                              | `createdAt`    | `desc`            |
