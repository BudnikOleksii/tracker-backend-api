## Context

The `transactionCategories` table already exists with columns: `id`, `userId`, `name`, `type` (EXPENSE/INCOME), `parentCategoryId` (self-referencing hierarchy), `createdAt`, `updatedAt`, `deletedAt` (soft delete). A unique constraint on `(userId, name, type, parentCategoryId)` prevents duplicate categories per user. The transactions table references categories via `categoryId` with restrict-on-delete. Seed data exists for default categories.

## Goals / Non-Goals

**Goals:**

- Provide authenticated CRUD endpoints for transaction categories scoped to the current user
- Support filtering by transaction type (EXPENSE/INCOME)
- Support hierarchical categories (listing subcategories, setting parent)
- Follow existing module patterns (user module) for consistency
- Soft-delete categories (set `deletedAt` instead of hard delete)

**Non-Goals:**

- Shared/global categories across users
- Bulk import/export of categories
- Category reordering or custom sorting
- Moving transactions between categories

## Decisions

### 1. Module structure mirrors user module

**Choice**: Follow the established controller → service → repository pattern with DTOs for validation.

**Rationale**: Consistency with existing codebase. The user module is the closest analogue — authenticated, user-scoped CRUD with pagination.

### 2. User scoping via JWT

**Choice**: Extract `userId` from the authenticated JWT payload (`req.user.id`) for all operations. No `userId` in request bodies or URL params.

**Alternatives considered**:

- URL param `/:userId/categories`: Adds complexity, requires authorization check against JWT
- Body param: Violates REST conventions for resource ownership

**Rationale**: Simpler, more secure. Users can only ever access their own categories.

### 3. Soft delete with cascade protection

**Choice**: Set `deletedAt` timestamp on delete. Reject deletion if the category has active transactions (due to the `restrict` foreign key constraint on the transactions table).

**Rationale**: Preserves referential integrity. The database-level restrict constraint already prevents deleting categories with transactions, so the service layer should handle this gracefully with a clear error message.

### 4. Flat list with parent reference

**Choice**: Return categories as a flat paginated list with `parentCategoryId` field. Optionally filter by `parentCategoryId` to get subcategories.

**Alternatives considered**:

- Nested tree response: Complex serialization, pagination issues

**Rationale**: Simpler API. Clients can build the tree if needed using the parent reference.

## Risks / Trade-offs

- **Soft delete filtering** — All queries must filter `WHERE deletedAt IS NULL` to exclude soft-deleted records. → Mitigation: Centralize this in the repository layer.
- **Unique constraint with soft delete** — A user could recreate a category with the same name after soft-deleting the original, hitting the unique constraint. → Mitigation: The unique constraint includes `deletedAt` implicitly via the composite; if not, handle the conflict error gracefully in the service.
