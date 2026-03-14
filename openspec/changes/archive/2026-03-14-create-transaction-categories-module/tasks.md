## 1. Module Scaffolding

- [x] 1.1 Create `src/modules/transaction-categories/` directory with module, controller, service, and repository files
- [x] 1.2 Create `TransactionCategoriesModule` and register it in `AppModule`

## 2. DTOs

- [x] 2.1 Create `CategoryQueryDto` extending `OffsetPaginationDto` with optional `type`, `parentCategoryId`, and `root` filters
- [x] 2.2 Create `CreateCategoryDto` with `name` (required), `type` (required, EXPENSE/INCOME), and `parentCategoryId` (optional UUID)
- [x] 2.3 Create `UpdateCategoryDto` with optional `name` and `parentCategoryId`

## 3. Repository

- [x] 3.1 Implement `TransactionCategoryRepository` with `findAll` (paginated, filtered, soft-delete aware), `findById`, `create`, `update`, and `softDelete` methods
- [x] 3.2 Add `hasTransactions` method to check if a category has associated transactions before deletion

## 4. Service

- [x] 4.1 Implement `TransactionCategoriesService` with list, get, create, update, and delete business logic
- [x] 4.2 Add validation: check parent category ownership, handle duplicate conflicts (409), handle not-found (404), and reject deletion of categories with transactions (409)

## 5. Controller

- [x] 5.1 Implement `TransactionCategoriesController` with `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` endpoints
- [x] 5.2 Apply `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` to all endpoints, add Swagger decorators

## 6. Verification

- [x] 6.1 Run `pnpm check-types`, `pnpm lint:fix`, `pnpm format` and fix any issues
