## 1. Database Schema

- [x] 1.1 Add `BudgetPeriod` enum (WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM) and `BudgetStatus` enum (ACTIVE, EXCEEDED) to `src/database/schemas/enums.ts`
- [x] 1.2 Create `src/database/schemas/budgets.ts` with the budgets table definition (id, userId, categoryId, amount, currencyCode, period, startDate, endDate, status, description, createdAt, updatedAt) and relations
- [x] 1.3 Export the budgets schema from `src/database/schemas/index.ts`
- [x] 1.4 Run `pnpm db:generate` and `pnpm db:migrate` to apply the migration

## 2. Module Setup

- [x] 2.1 Create `src/modules/budgets/budgets.module.ts` with imports for CacheModule
- [x] 2.2 Create `src/modules/budgets/budgets.repository.ts` with DB_TOKEN injection and typed interfaces
- [x] 2.3 Create `src/modules/budgets/budgets.service.ts` with repository and cache service injection
- [x] 2.4 Create `src/modules/budgets/budgets.controller.ts` with JWT guard and Swagger decorators
- [x] 2.5 Register `BudgetsModule` in `src/app.module.ts`

## 3. DTOs

- [x] 3.1 Create `src/modules/budgets/dtos/create-budget.dto.ts` with validation for amount, currencyCode, period, startDate, endDate (conditional on CUSTOM), categoryId (optional), description (optional)
- [x] 3.2 Create `src/modules/budgets/dtos/update-budget.dto.ts` with optional fields (amount, description, categoryId, endDate) — period and startDate not allowed
- [x] 3.3 Create `src/modules/budgets/dtos/budget-query.dto.ts` extending OffsetPaginationDto with optional filters (status, period, categoryId, currencyCode)

## 4. CRUD Implementation

- [x] 4.1 Implement repository methods: `create`, `findAll`, `findById`, `update`, `delete`, `findOverlapping`, and `transaction` wrapper
- [x] 4.2 Implement service `create` with category validation, overlap check, endDate computation, transactional write, and cache invalidation
- [x] 4.3 Implement service `findAll` and `findById` with cache-aside wrapping
- [x] 4.4 Implement service `update` with overlap re-validation on categoryId/endDate change, transactional write, and cache invalidation
- [x] 4.5 Implement service `delete` with existence check and cache invalidation
- [x] 4.6 Implement controller endpoints: POST, GET list, GET :id, PATCH :id, DELETE :id

## 5. Budget Progress Tracking

- [x] 5.1 Add repository method `getSpentAmount` that aggregates transaction amounts by userId, categoryId (optional), currencyCode, and date range
- [x] 5.2 Implement service `getProgress` that computes spentAmount, remainingAmount, and percentUsed with cache wrapping
- [x] 5.3 Add controller endpoint GET /api/budgets/:id/progress
- [x] 5.4 Add budget progress cache invalidation in the transactions service on create, update, and delete

## 6. Overspend Detection Cron

- [x] 6.1 Add a method in budgets repository to fetch all ACTIVE budgets with endDate in the future
- [x] 6.2 Add a method in budgets repository to batch-update budget statuses
- [x] 6.3 Implement the overspend detection logic in budgets service: for each active budget, compute spent amount and update status (ACTIVE ↔ EXCEEDED)
- [x] 6.4 Register the cron job in `ScheduledTasksModule` to run daily

## 7. Finalize

- [x] 7.1 Add shared enum exports for BudgetPeriod and BudgetStatus in `src/shared/enums/`
- [x] 7.2 Run `pnpm check-types`, `pnpm lint:fix`, and `pnpm format` to verify everything passes
