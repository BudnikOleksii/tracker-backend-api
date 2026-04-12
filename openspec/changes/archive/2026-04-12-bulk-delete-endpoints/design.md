## Context

The application has four user-facing CRUD modules (transactions, budgets, transaction-categories, recurring-transactions) that each support single-record DELETE. Users managing large datasets must call DELETE N times to remove N records. The codebase already has bulk operation patterns — `bulkUpdateStatuses` in budgets (CASE/WHEN SQL), `bulkCreate` in transaction-categories, and chunked batch inserts in recurring-transactions — so adding bulk delete follows established conventions.

Key constraints:

- Transactions use hard delete; budgets use hard delete; transaction-categories use soft delete (`deletedAt`); recurring-transactions use status change to CANCELLED
- Transaction categories with active transactions cannot be deleted (checked in service layer)
- Transaction categories with active children are rejected (existing single-delete behavior)
- All operations must validate user ownership
- Existing `MessageResponseDto` pattern used for single delete responses

## Goals / Non-Goals

**Goals:**

- Single-request deletion of multiple records per module (up to 100 IDs)
- Best-effort partial success — delete as many as possible, report failures with reasons
- Consistent API contract across all four modules via shared DTOs
- Ownership validation for every ID in the batch
- Behavioral alignment with existing single-delete semantics per module

**Non-Goals:**

- Async/background processing for bulk deletes (batch sizes are capped at 100)
- Bulk delete for users or audit logs
- Filter-based deletion (e.g., "delete all transactions before date X")
- Undo/restore capabilities beyond what soft delete already provides
- Changing existing single-delete behavior

## Decisions

### 1. HTTP method and route: `DELETE /batch` with body

Use `DELETE /<module>/batch` with a JSON body containing `{ ids: string[] }`.

**Alternatives considered:**

- `POST /<module>/bulk-delete` — clearer intent but inconsistent with REST semantics for deletion
- `DELETE /<module>?ids=a,b,c` — query string has URL length limits and poor ergonomics for UUIDs

**Rationale:** `DELETE` with a body is widely supported and keeps the REST verb aligned with the action. The `/batch` suffix disambiguates from single-record `DELETE /:id`.

### 2. Partial success (best-effort) model

The service validates all IDs up front, partitions them into deletable vs non-deletable, deletes the valid set in a single transaction, and returns a detailed response with both the deleted count and per-ID failure reasons.

**Alternatives considered:**

- All-or-nothing atomic — simpler but impractical when some records may already be deleted, have constraint violations (categories with transactions), or be in invalid states

**Rationale:** Users selecting 20 items for deletion shouldn't have the entire operation fail because one category has active transactions. The client gets a clear picture of what succeeded and what didn't, enabling informed follow-up actions without trial-and-error.

### 3. Batch size limit: 100

Cap at 100 IDs per request.

**Rationale:** Matches the existing `pageSize` max (100). Keeps DB operations fast. Clients needing more can paginate their deletes.

### 4. Shared DTOs

Create `BulkDeleteDto` (request) and `BulkDeleteResponseDto` (response) in `src/shared/dtos/`.

- `BulkDeleteDto`: `ids: string[]` with `@IsUUID('4', { each: true })`, `@ArrayMinSize(1)`, `@ArrayMaxSize(100)`, `@ArrayUnique()`
- `BulkDeleteResponseDto`: `{ deleted: number; failed: { id: string; reason: string }[]; message: string }`

The `failed` array is empty on full success. Each failure entry includes the ID and a human-readable reason (e.g., "Not found", "Category has active transactions").

### 5. Module-specific delete behavior aligned with single delete

Each module's bulk delete follows its existing single-delete semantics exactly:

- **Transactions**: hard delete (no `deletedAt` column exists). Emit `TransactionMutationEvent` for budget cache coherence.
- **Budgets**: hard delete
- **Transaction categories**: soft delete (set `deletedAt`). Skip (report as failed) categories that have active transactions or active children — matching single-delete behavior, no auto-cascade to children.
- **Recurring transactions**: set status to `CANCELLED`. Any status is cancellable — matching existing single-delete behavior which does not check status.

### 6. Validation and deletion flow

For each module, the service layer:

1. Fetches all requested records by IDs + userId in a single query
2. Partitions into: not found (IDs missing from results), constrained (module-specific checks), deletable
3. Deletes the valid set in a single DB transaction
4. Returns `{ deleted, failed, message }`

For transaction-categories specifically: batch-check for active transactions across all candidate IDs in a single query to avoid N+1.

### 7. Cache invalidation

Bulk deletes invalidate the same cache keys as single deletes — a single prefix-based cache sweep after the transaction commits (not per-ID). For transactions, also emit `TransactionMutationEvent` to trigger budget cache invalidation via the existing event listener.

## Risks / Trade-offs

- **[Partial success complexity]** → Clients must handle the `failed` array. Mitigated by clear per-ID failure reasons and a simple contract.
- **[Lock contention on large batches]** → Mitigated by the 100-item cap. The valid set is deleted in a single short-lived transaction.
- **[Cache invalidation on partial success]** → Cache is invalidated if any records were deleted (`deleted > 0`). This is correct since the data has changed even if some items failed.
- **[No audit log integration initially]** → Existing single deletes don't write audit logs; bulk delete follows the same pattern. Can be added later if needed.
