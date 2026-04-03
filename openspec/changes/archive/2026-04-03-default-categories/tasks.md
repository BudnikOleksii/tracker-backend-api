## 1. Database Schema

- [x] 1.1 Create `DefaultTransactionCategory` table schema in `src/database/schemas/default-transaction-categories.ts` with fields: id (uuid), name (text), type (TransactionType enum), parentDefaultTransactionCategoryId (self-referencing uuid, nullable), createdAt, updatedAt, deletedAt. Add unique composite index on (name, type, parentDefaultTransactionCategoryId).
- [x] 1.2 Export the new schema from `src/database/schemas/index.ts` and register relations (self-referencing parent/children)
- [x] 1.3 Run `pnpm db:generate` and `pnpm db:migrate` to create the migration and apply it

## 2. Default Transaction Categories Module - Repository

- [x] 2.1 Create `src/modules/default-transaction-categories/default-transaction-categories.repository.ts` with methods: findAll (paginated, filterable by type/root), findById, findAllActive (non-paginated, for assignment), create, update, softDelete, existsByNameTypeAndParent, hasActiveChildren, isDescendantOf

## 3. Default Transaction Categories Module - Service

- [x] 3.1 Create `src/modules/default-transaction-categories/default-transaction-categories.service.ts` with CRUD logic: list (with pagination/filters), getById, create (with duplicate/parent validation), update (with duplicate/cycle detection), delete (with children check)
- [x] 3.2 Add `assignDefaultCategoriesToUser(userId: string)` method that fetches all active default transaction categories and bulk-creates them as user transaction categories, preserving parent-child hierarchy via two-pass approach (parents first, then children with mapped IDs)

## 4. Default Transaction Categories Module - DTOs

- [x] 4.1 Create `src/modules/default-transaction-categories/dtos/create-default-category.dto.ts` with fields: name (string, required, max 100, trimmed), type (TransactionType, required), parentDefaultTransactionCategoryId (uuid, optional)
- [x] 4.2 Create `src/modules/default-transaction-categories/dtos/update-default-category.dto.ts` with optional name and parentDefaultTransactionCategoryId fields
- [x] 4.3 Create `src/modules/default-transaction-categories/dtos/default-category-response.dto.ts` with Swagger decorators
- [x] 4.4 Create `src/modules/default-transaction-categories/dtos/default-category-list-response.dto.ts` for paginated response
- [x] 4.5 Create `src/modules/default-transaction-categories/dtos/default-category-query.dto.ts` for query params (type, root, page, pageSize)

## 5. Default Transaction Categories Module - Controller

- [x] 5.1 Create `src/modules/default-transaction-categories/default-transaction-categories.controller.ts` with admin-only endpoints: GET / (list), GET /:id (get one), POST / (create), PATCH /:id (update), DELETE /:id (delete). Apply JwtAuthGuard and RolesGuard with @Roles('ADMIN').

## 6. Default Transaction Categories Module - Module Registration

- [x] 6.1 Create `src/modules/default-transaction-categories/default-transaction-categories.module.ts` importing required dependencies, registering controller/service/repository, and exporting the service
- [x] 6.2 Register `DefaultTransactionCategoriesModule` in the root `AppModule`

## 7. Registration Flow Integration

- [x] 7.1 Import `DefaultTransactionCategoriesModule` into `AuthModule`
- [x] 7.2 Update `AuthService.register()` to call `defaultTransactionCategoriesService.assignDefaultCategoriesToUser(user.id)` after user creation, wrapped in try/catch so failures don't block registration

## 8. Verification

- [x] 8.1 Run `pnpm check-types` to verify TypeScript compilation
- [x] 8.2 Run `pnpm lint:fix` and `pnpm format` to ensure code quality
