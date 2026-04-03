## Context

Users currently start with zero transaction categories after registration. They must manually create categories before they can track any transactions, which adds friction to the onboarding experience. The system already has a `TransactionCategory` table scoped per user, an admin role system with guards, and a well-established module pattern (controller → service → repository).

## Goals / Non-Goals

**Goals:**

- Allow admins to manage a set of default category templates via CRUD API
- Automatically copy default transaction categories to new users at registration time, preserving parent-child hierarchy
- Ensure copied categories are fully owned by the user (indistinguishable from manually created ones)

**Non-Goals:**

- Retroactive assignment of default transaction categories to existing users (can be done via a one-off script/seed later)
- Syncing default transaction categories after initial assignment (user changes are independent)
- UI/frontend implementation
- Category icons, colors, or other metadata beyond name/type/hierarchy

## Decisions

### 1. Separate `DefaultTransactionCategory` table vs. flagging existing categories

**Decision**: Create a dedicated `DefaultTransactionCategory` table.

**Rationale**: Default categories are admin-managed templates, not tied to any user. Mixing them into `TransactionCategory` (which has a required `userId` FK and unique constraints scoped to users) would require nullable `userId`, complicate queries, and blur the ownership model. A separate table keeps concerns clean.

**Alternatives considered**:

- _Flag on `TransactionCategory`_: Would require `userId` to be nullable, break the unique constraint logic, and mix template data with user data. Rejected.
- _JSON seed file_: No admin UI, changes require deployments. Rejected -- admins need runtime control.

### 2. Copy-on-register vs. reference-based approach

**Decision**: Copy default transaction categories into the user's `TransactionCategory` table at registration time.

**Rationale**: The user requirement states categories should be "their own" -- users can update/delete freely. A copy approach means no foreign key back to `DefaultTransactionCategory`, no sync complexity, and the user's categories behave identically whether they were auto-created or manually created.

**Alternatives considered**:

- _Reference + override pattern_: Track which user categories derive from defaults, apply overrides. Much more complex, no clear benefit since sync is a non-goal. Rejected.

### 3. Hierarchy copying strategy

**Decision**: Copy in two passes -- first parent categories (where `parentCategoryId` is null), then child categories, mapping parent IDs from default → user category IDs.

**Rationale**: Default categories support a parent-child hierarchy (matching `TransactionCategory`). A two-pass approach is simple, handles one level of nesting (which matches the current UI pattern), and avoids recursive complexity.

### 4. Where to trigger assignment

**Decision**: Call the assignment from `AuthService.register()` after user creation, within the same flow but not the same DB transaction.

**Rationale**: Registration must succeed even if default category copying fails (empty categories is better than failed registration). The assignment is a best-effort enhancement. If it fails, the user still has a valid account and can create categories manually.

### 5. Module dependency

**Decision**: Create a `DefaultTransactionCategoriesModule` that exports `DefaultTransactionCategoriesService`. The `AuthModule` imports it to call assignment during registration. The `TransactionCategoriesModule` is used by `DefaultTransactionCategoriesModule` for creating user categories.

**Rationale**: Follows existing module patterns. The default-transaction-categories module owns its own table/CRUD, and delegates actual user-category creation to the existing `TransactionCategoriesService` or directly to the repository to avoid duplicate validation (since we're bulk-inserting known-good data).

## Risks / Trade-offs

- **[Risk] Registration latency increases** → Default categories are typically <30 items. Bulk insert is fast. If needed, can be made async later, but not warranted now.
- **[Risk] Default categories deleted while registration in progress** → Extremely unlikely race condition. Copy reads a snapshot; worst case a user gets a slightly stale set. Acceptable.
- **[Risk] Duplicate categories if registration is retried** → The unique constraint on `(userId, name, type, parentCategoryId)` in `TransactionCategory` prevents duplicates. Conflicts are skipped or handled gracefully.
- **[Trade-off] No retroactive assignment** → Existing users won't get default transaction categories automatically. This is intentional -- a migration script or admin action can handle it separately if needed.
