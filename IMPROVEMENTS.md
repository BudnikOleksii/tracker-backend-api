# Tracker Backend API - Audit

> **Impact:** Critical > High > Medium > Low — severity if the issue reaches production.
> **Effort:** Low (< 1h) · Medium (1-4h) · High (4h+) — estimated implementation time.
> Updated: 2026-04-12
> Analyzed by: architect-reviewer, security-auditor, performance-engineer, typescript-pro, postgres-pro, nestjs-expert, api-designer, database-optimizer, dependency-manager, refactoring-specialist

---

## Active Findings

| #   | Priority | Finding                                                       | Effort | Impact | Agent(s)               | Status |
| --- | -------- | ------------------------------------------------------------- | ------ | ------ | ---------------------- | ------ |
| 15  | P1       | No API versioning strategy                                    | Medium | High   | api-designer           | Todo   |
| 68  | P2       | Cross-module repository writes bypass service layer           | Medium | Medium | architect, nestjs      | Todo   |
| 81  | P2       | bulkUpdateStatuses TOCTOU — no row lock                       | Medium | Medium | database-optimizer     | Todo   |
| 82  | P2       | Redundant getCategoryInfo query per recurring iteration       | Medium | Medium | performance-engineer   | Todo   |
| 84  | P2       | Repeated field-by-field update construction in repos          | Medium | Medium | refactoring-specialist | Todo   |
| 87  | P3       | Login log writes fire-and-forget no error handling            | Low    | Low    | security-auditor       | Todo   |
| 88  | P3       | Password change allows same password                          | Low    | Low    | security-auditor       | Todo   |
| 89  | P3       | DELETE endpoints return 200 instead of 204                    | Low    | Low    | api-designer           | Todo   |
| 90  | P3       | Missing Swagger response types on auth/providers + onboarding | Low    | Low    | api-designer           | Todo   |
| 91  | P3       | Import errors unstructured string array                       | Medium | Low    | api-designer           | Todo   |
| 92  | P3       | LoginLog.email + KnownDevice.userId missing indexes           | Low    | Low    | postgres, db-opt       | Todo   |
| 93  | P3       | Verification table no cleanup + no expiresAt index            | Low    | Low    | database-optimizer     | Todo   |
| 94  | P3       | getUserSummary three separate COUNT queries                   | Low    | Low    | perf, db-opt           | Todo   |
| 95  | P3       | Export redundant queries (categories + two round-trips)       | Low    | Low    | performance-engineer   | Todo   |
| 96  | P3       | Analytics cache keys unbounded growth                         | Low    | Low    | performance-engineer   | Todo   |
| 97  | P3       | Transaction_userId_date_idx DESC vs ASC mismatch              | Low    | Low    | performance-engineer   | Todo   |
| 98  | P3       | Multiple unsafe as casts across codebase                      | Low    | Low    | typescript-pro         | Todo   |
| 99  | P3       | Cache module name strings duplicated across modules           | Low    | Low    | architect, nestjs      | Todo   |
| 100 | P3       | Dead code: createTransaction method + noop conditional        | Low    | Low    | refactoring-specialist | Todo   |
| 101 | P3       | Duplicated pause/resume + findDue + hasUpdates patterns       | Low    | Low    | refactoring-specialist | Todo   |
| 102 | P3       | Identical transaction\<T\> wrapper in 5 repositories          | Medium | Low    | refactoring-specialist | Todo   |
| 103 | P3       | ScheduledTasksService mixes unrelated responsibilities        | Medium | Low    | nestjs-expert          | Todo   |
| 104 | P3       | AuthController config assembly in constructor                 | Low    | Low    | nestjs-expert          | Todo   |
| 105 | P3       | AuditLogInterceptor records raw URL not structured            | Low    | Low    | nestjs-expert          | Todo   |
| 106 | P3       | Dependency vulnerabilities: flatted + vite                    | Low    | Low    | dependency-manager     | Todo   |
| 107 | P3       | Unused dependencies: vitest, @nestjs/testing, jiti            | Low    | Low    | dependency-manager     | Todo   |
| 108 | P3       | AuditLogModule unnecessary @Global                            | Low    | Low    | architect-reviewer     | Todo   |

---

## Active Findings (Detailed)

### P1 -- High

#### 15. No API Versioning Strategy

**Effort:** Medium | **Impact:** High | **Reported by:** api-designer

No URI versioning, no header versioning, no `enableVersioning()` call. Any breaking change will affect all clients with no migration path.

**Fix:** Add `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` in `src/main.ts`.

---

### P2 -- Medium

#### 68. Cross-Module Repository Writes Bypass Service Layer

**Effort:** Medium | **Impact:** Medium | **Reported by:** architect-reviewer, nestjs-expert

Multiple modules directly write to foreign tables, bypassing the owning module's service layer:

1. `DefaultTransactionCategoryRepository.cloneDefaultCategoriesToUser` inserts into `transactionCategories` table
2. `TransactionRepository.createCategories` and `findCategoriesByUser` operate on `transactionCategories` table
3. `RecurringTransactionsRepository.createTransactionsBatch` inserts into `transactions` table
4. `OnboardingService` injects `TransactionCategoryRepository` and `DefaultTransactionCategoryRepository` directly

This bypasses business rules, validation, and cache invalidation. `TransactionCategoriesModule` and `DefaultTransactionCategoriesModule` both export their repositories, enabling the violations.

**Fix:** Remove repository exports from both category modules. Add service-level methods for all cross-module operations. Have consumers call services instead of repositories.

**Files:**

- `src/modules/default-transaction-categories/default-transaction-categories.repository.ts:287-348`
- `src/modules/transactions/transactions.repository.ts:413-462`
- `src/modules/recurring-transactions/recurring-transactions.repository.ts:394-428`
- `src/modules/onboarding/onboarding.service.ts:8-11`
- `src/modules/transaction-categories/transaction-categories.module.ts:10`
- `src/modules/default-transaction-categories/default-transaction-categories.module.ts:10`

---

#### 81. bulkUpdateStatuses TOCTOU — No Row Lock

**Effort:** Medium | **Impact:** Medium | **Reported by:** database-optimizer

`bulkUpdateStatuses` wraps the UPDATE in a transaction but does not acquire `FOR UPDATE` locks. Between the read in `getSpentAmountForAllActiveBudgets` and the write, concurrent requests could mutate budgets.

**Fix:** Add `FOR UPDATE` to the `findActiveBudgetsWithFutureEndDate` query, or perform spend aggregation and status update in a single SQL CTE.

**Files:**

- `src/modules/budgets/budgets.repository.ts:368-392`

---

#### 82. Redundant getCategoryInfo Query per Recurring Transaction Iteration

**Effort:** Medium | **Impact:** Medium | **Reported by:** performance-engineer

Both `create` and `update` in `RecurringTransactionsRepository` call `getCategoryInfo` as a second query. When `processAllRecurringTransactions` processes N records, each triggers an additional SELECT, yielding 2N round-trips instead of N. The category data is already known from the `RecurringTransactionInfo`.

**Fix:** Skip the `getCategoryInfo` lookup when the category is already available, or restructure to accept pre-fetched category data.

**Files:**

- `src/modules/recurring-transactions/recurring-transactions.repository.ts:287-289,346-348,430-449`

---

#### 84. Repeated Field-by-Field Update Construction in Repositories

**Effort:** Medium | **Impact:** Medium | **Reported by:** refactoring-specialist

Every repository `update` method manually checks each field with `if (data.X !== undefined) { updates.X = data.X; }`. This pattern repeats across 5+ repositories with up to 11 fields each.

**Fix:** Extract a shared `buildDefinedUpdates<T>(data: Partial<T>): Partial<T>` utility that filters out undefined values.

**Files:**

- `src/modules/transactions/transactions.repository.ts:290-314`
- `src/modules/recurring-transactions/recurring-transactions.repository.ts:300-334`
- `src/modules/budgets/budgets.repository.ts:182-198`
- `src/modules/user/user.repository.ts:316-333`

---

### P3 -- Low

#### 87. Login Log Writes Fire-and-Forget No Error Handling

**Effort:** Low | **Impact:** Low | **Reported by:** security-auditor

All `loginLogRepo.create()` calls use `void` without `.catch()`. If the insert throws, an unhandled promise rejection crashes the process.

**Fix:** Add `.catch()` to each `void this.loginLogRepo.create(...)` call to log the error without propagating it.

**Files:**

- `src/modules/auth/auth.service.ts:90,104,120,134,155,175,210`

---

#### 88. Password Change Allows Same Password

**Effort:** Low | **Impact:** Low | **Reported by:** security-auditor

`changePassword` validates the current password but does not check whether `newPassword` equals `currentPassword`. A user can "change" to the same value, burning through session invalidation without improving security.

**Fix:** Add a comparison rejecting with `BadRequestException` if `dto.newPassword === dto.currentPassword`.

**Files:**

- `src/modules/profile/profile.service.ts:47-83`

---

#### 89. DELETE Endpoints Return 200 Instead of 204

**Effort:** Low | **Impact:** Low | **Reported by:** api-designer

All single-resource DELETE endpoints respond with 200 and a `{ message: "..." }` body. REST semantics specify 204 No Content for successful deletions.

**Fix:** Change `@HttpCode(HttpStatus.OK)` to `@HttpCode(HttpStatus.NO_CONTENT)`, remove the return body, and update Swagger annotations. Keep 200 on bulk delete endpoints.

**Files:**

- `src/modules/transactions/transactions.controller.ts:224-235`
- `src/modules/budgets/budgets.controller.ts:141-152`
- `src/modules/transaction-categories/transaction-categories.controller.ts:119-131`
- `src/modules/recurring-transactions/recurring-transactions.controller.ts:138-149`
- `src/modules/user/user.controller.ts:120-128`

---

#### 90. Missing Swagger Response Types on auth/providers and onboarding

**Effort:** Low | **Impact:** Low | **Reported by:** api-designer

`GET /auth/providers` and `POST /onboarding/assign-default-categories` have `@ApiResponse` with no `type:` property. Clients cannot generate typed SDKs.

**Fix:** Create `ProvidersResponseDto` and add `type: MessageResponseDto` / `type: ProvidersResponseDto` to the respective `@ApiResponse` decorators.

**Files:**

- `src/modules/auth/auth.controller.ts:261-270`
- `src/modules/onboarding/onboarding.controller.ts:43-44`

---

#### 91. Import Errors Unstructured String Array

**Effort:** Medium | **Impact:** Low | **Reported by:** api-designer

Import row errors are returned as `errors: string[]` (e.g., `"Row 5: Invalid date format"`) rather than structured objects. Clients cannot programmatically identify which row failed.

**Fix:** Define `ImportErrorDto { row: number; code: string; message: string }` and change `errors: string[]` to `errors: ImportErrorDto[]`.

**Files:**

- `src/modules/transactions/dtos/import-transaction-response.dto.ts:15-22`
- `src/modules/transactions/transaction-import.service.ts:78-82`

---

#### 92. LoginLog.email and KnownDevice.userId Missing Indexes

**Effort:** Low | **Impact:** Low | **Reported by:** postgres-pro, database-optimizer

`LoginLog` has no index on `email` for brute-force detection queries. `KnownDevice` has no dedicated `userId` index — the wide unique composite index is suboptimal for user-scoped lookups.

**Fix:** Add `index('LoginLog_email_createdAt_idx').on(table.email, table.createdAt.desc())` and `index('KnownDevice_userId_idx').on(table.userId)`.

**Files:**

- `src/database/schemas/login-logs.ts:11-20`
- `src/database/schemas/known-devices.ts:22-28`

---

#### 93. Verification Table No Cleanup and No expiresAt Index

**Effort:** Low | **Impact:** Low | **Reported by:** database-optimizer

Expired verification records are never cleaned up. The table grows unbounded and any future TTL cleanup requires a sequential scan.

**Fix:** Add `index('Verification_expiresAt_idx').on(table.expiresAt)` and add a scheduled cleanup task alongside `cleanExpiredSessions`.

**Files:**

- `src/database/schemas/verifications.ts:1-19`

---

#### 94. getUserSummary Three Separate COUNT Queries

**Effort:** Low | **Impact:** Low | **Reported by:** performance-engineer, database-optimizer

`getSummary` executes three independent `SELECT count(*)` queries against the User table. Each requires a separate round-trip and scan.

**Fix:** Consolidate into one query using `COUNT(*) FILTER (WHERE ...)` conditional aggregation.

**Files:**

- `src/modules/user/user.repository.ts:231-246`

---

#### 95. Export Redundant Queries (Categories + Two Round-Trips)

**Effort:** Low | **Impact:** Low | **Reported by:** performance-engineer

`exportTransactions` fires a separate `findCategoriesByUser` call even though `findAllForExport` already JOINs category columns. Additionally, when `categoryId` is provided, `findAllForExport` splits into two queries instead of using a subquery.

**Fix:** Remove the redundant `findCategoriesByUser` call. Replace the two-query pattern with a single query using a subquery for `categoryId` filtering.

**Files:**

- `src/modules/transactions/transactions.service.ts:269-271`
- `src/modules/transactions/transactions.repository.ts:196-209`

---

#### 96. Analytics Cache Keys Unbounded Growth

**Effort:** Low | **Impact:** Low | **Reported by:** performance-engineer

Cache keys include arbitrary `dateFrom`/`dateTo` strings. Any date-range variation creates a new cache entry, wasting Redis memory with very low hit rates.

**Fix:** Normalise date parameters to date-only strings before hashing in `buildCacheKey`.

**Files:**

- `src/modules/transactions-analytics/transactions-analytics.service.ts:59-79`
- `src/modules/cache/cache-key.utils.ts:10-23`

---

#### 97. Transaction_userId_date_idx DESC vs ASC Mismatch

**Effort:** Low | **Impact:** Low | **Reported by:** performance-engineer

`Transaction_userId_date_idx` is defined as `(userId, date DESC)` but analytics range queries use `gte`/`lte` predicates that benefit from ASC ordering. The planner may use a bitmap scan instead of an efficient index scan.

**Fix:** Change to `(userId, date)` (ascending default). Apply same to `Transaction_userId_currencyCode_date_idx`.

**Files:**

- `src/database/schemas/transactions.ts:52-53`

---

#### 98. Multiple Unsafe `as` Casts Across Codebase

**Effort:** Low | **Impact:** Low | **Reported by:** typescript-pro

~10 instances of `as` casts that suppress type safety: `getCategoryInfo` result casts, `results[j] as PromiseSettledResult`, `req.params as Record`, `create()` returning casts, `parentDefaultTransactionCategoryId as string`, `getSpentAmountForAllActiveBudgets` return cast, and `CacheKeyOptions.params` typed as `object`.

**Fix:** Replace each cast with proper type narrowing, runtime guards, or correct type annotations. See individual files for specific fixes.

**Files:**

- `src/modules/transactions/transactions.repository.ts:488-497`
- `src/modules/recurring-transactions/recurring-transactions.service.ts:367`
- `src/modules/audit-log/audit-log.interceptor.ts:32`
- `src/modules/auth/refresh-token.repository.ts:45`
- `src/modules/default-transaction-categories/default-transaction-categories.repository.ts:326`
- `src/modules/budgets/budgets.repository.ts:365`
- `src/modules/cache/cache-key.utils.ts:7,18`

---

#### 99. Cache Module Name Strings Duplicated Across Modules

**Effort:** Low | **Impact:** Low | **Reported by:** architect-reviewer, nestjs-expert

Cache module name strings are inline constants in service/listener files instead of exported from `*.constants.ts`. Cross-module invalidation (e.g., import service hardcoding `'categories'`) risks typo mismatches.

**Fix:** Move each `CACHE_MODULE` declaration into the respective `*.constants.ts` file and import it in both service and listener.

**Files:**

- `src/modules/budgets/budgets.service.ts:26`
- `src/modules/user/user.service.ts:27`
- `src/modules/budgets/budgets-cache.listener.ts:8`
- `src/modules/transactions-analytics/transactions-analytics-cache.listener.ts:8`
- `src/modules/transactions/transaction-import.service.ts:88`

---

#### 100. Dead Code: createTransaction Method and Noop Conditional

**Effort:** Low | **Impact:** Low | **Reported by:** refactoring-specialist

`RecurringTransactionsRepository.createTransaction` (singular) is never called — only `createTransactionsBatch` is used. `DefaultTransactionCategoriesService.findAll` has an empty `if` block with only a comment.

**Fix:** Delete `createTransaction` and remove the empty `if` block.

**Files:**

- `src/modules/recurring-transactions/recurring-transactions.repository.ts:394-406`
- `src/modules/default-transaction-categories/default-transaction-categories.service.ts:26-32`

---

#### 101. Duplicated pause/resume, findDue, and hasUpdates Patterns

**Effort:** Low | **Impact:** Low | **Reported by:** refactoring-specialist

`pause` and `resume` are structurally identical (find, check status, update, invalidate cache). `findDueRecurringTransactions` and `findAllDueRecurringTransactions` differ by one WHERE condition. The `hasUpdates` empty-update guard is copy-pasted in 3 services.

**Fix:** Extract `transitionStatus(id, userId, requiredStatus, targetStatus)` method. Consolidate findDue with optional `userId` parameter. Extract shared `assertHasUpdates(data)` utility.

**Files:**

- `src/modules/recurring-transactions/recurring-transactions.service.ts:228-304`
- `src/modules/recurring-transactions/recurring-transactions.repository.ts:352-392`
- `src/modules/transactions/transactions.service.ts:95`
- `src/modules/budgets/budgets.service.ts:124`

---

#### 102. Identical transaction\<T\> Wrapper in 5 Repositories

**Effort:** Medium | **Impact:** Low | **Reported by:** refactoring-specialist

Every repository has an identical `async transaction<T>(callback)` one-liner delegating to `this.db.transaction(callback)`.

**Fix:** Create a `BaseRepository` abstract class in `src/shared/` that holds `db` and `transaction`, or extract a shared `TransactionRunner` service.

**Files:**

- `src/modules/transactions/transactions.repository.ts:235`
- `src/modules/recurring-transactions/recurring-transactions.repository.ts:191`
- `src/modules/transaction-categories/transaction-categories.repository.ts:113`
- `src/modules/budgets/budgets.repository.ts:78`
- `src/modules/default-transaction-categories/default-transaction-categories.repository.ts:125`

---

#### 103. ScheduledTasksService Mixes Unrelated Domain Responsibilities

**Effort:** Medium | **Impact:** Low | **Reported by:** nestjs-expert

`ScheduledTasksService` orchestrates tasks from three unrelated domains (auth cleanup, recurring transactions, budget checks) plus operational concerns (heartbeat, startup). Adding a new cron requires importing that module into `ScheduledTasksModule`.

**Fix:** Move domain-specific cron methods into their owning modules. Keep `ScheduledTasksService` only for cross-cutting operational tasks.

**Files:**

- `src/modules/scheduled-tasks/scheduled-tasks.service.ts:1-52`

---

#### 104. AuthController Config Assembly in Constructor

**Effort:** Low | **Impact:** Low | **Reported by:** nestjs-expert

The `AuthController` constructor makes six `configService.get()` calls and stores them as instance fields, with an eslint-disable for `max-params`. Controllers should not assemble configuration.

**Fix:** Extract into a dedicated `AuthCookieConfig` injectable provider and inject it as a single dependency.

**Files:**

- `src/modules/auth/auth.controller.ts:69-90`

---

#### 105. AuditLogInterceptor Records Raw URL Not Structured Resource

**Effort:** Low | **Impact:** Low | **Reported by:** nestjs-expert

The interceptor logs `action: "${method} ${url}"` with no semantic resource type. `AuditLogService.log` supports `resourceType` and `detail` fields that are never populated.

**Fix:** Add a `@AuditAction({ resource: string })` custom decorator. The interceptor reads metadata via `Reflector` and passes it as `resourceType`.

**Files:**

- `src/modules/audit-log/audit-log.interceptor.ts:19,30`

---

#### 106. Dependency Vulnerabilities: flatted and vite

**Effort:** Low | **Impact:** Low | **Reported by:** dependency-manager

`eslint` 10.0.3 transitively depends on `flatted` 3.4.1 (prototype pollution). `vitest` 4.1.0 depends on `vite` 8.0.0 (path traversal). Both are dev dependencies.

**Fix:** Update `eslint` to 10.2.0+ and `vitest` to 4.1.4+ (or remove vitest per #107).

**Files:**

- `package.json:86,99`

---

#### 107. Unused Dependencies: vitest, @nestjs/testing, jiti

**Effort:** Low | **Impact:** Low | **Reported by:** dependency-manager

`vitest`, `@nestjs/testing`, and `jiti` are installed but never imported or used. No test files exist in the project.

**Fix:** Remove all three from devDependencies. Re-add when tests are implemented.

**Files:**

- `package.json:68,91,99`

---

#### 108. AuditLogModule Unnecessary @Global

**Effort:** Low | **Impact:** Low | **Reported by:** architect-reviewer

`AuditLogModule` is `@Global()` but its only cross-module consumer is `AuditLogInterceptor` registered in `AppModule`, which already imports `AuditLogModule`.

**Fix:** Remove the `@Global()` decorator.

**Files:**

- `src/modules/audit-log/audit-log.module.ts:7`

---

## Recommended Execution Order

### Sprint 1 — Security (Batch A)

#69, #70, #71

### Sprint 2 — Database Indexes & Constraints (Batch B)

#75, #76, #77, #79, #80, #92

### Sprint 3 — API Correctness (Batch C)

#72, #73, #74, #85, #86, #89, #90

### Sprint 4 — Architecture (Batch D)

#68, #78, #81, #82, #83, #84

### Sprint 5 — Cleanup & DX (Batch E)

#87, #88, #91, #93, #94, #95, #96, #97, #98, #99, #100, #101, #102, #103, #104, #105, #106, #107, #108

## Low Priority / Deferred

| #   | Finding                                              | Impact   | Effort | Reason                                                               |
| --- | ---------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------- |
| 1   | Add test coverage                                    | Critical | High   | Just a POC, no tests needed now                                      |
| 2   | Table partitioning for transactions                  | Medium   | High   | Just a POC, not expected to reach 10M+ rows                          |
| 3   | No backup/recovery strategy                          | Critical | Medium | Just a POC, not needed now                                           |
| 4   | `users.findAll()` does not filter soft-deleted users | High     | Low    | By design -- admin should see all users including deleted            |
| 5   | Swagger/OpenAPI disabled entirely in production      | High     | Low    | Intentional decision from prior audit, will rethink in the future    |
| 6   | `strictPropertyInitialization: false` project-wide   | High     | Medium | Required by NestJS DTOs, risky to change for POC                     |
| 7   | `passport-github2` package unmaintained              | Medium   | Medium | Version is pinned (exact), acceptable for now but keep in mind       |
| 8   | No `.env.example` file                               | Low      | Low    | Done — `.env.example` created with all env vars from `env.schema.ts` |

---

### Deferred Findings (Detailed)

#### 3. No Backup/Recovery Strategy

**Effort:** Medium | **Impact:** Critical | **Reported by:** postgres-pro

No backup script, no WAL archiving, no `pg_dump` scheduled job. The only persistence is the Docker named volume. `docker compose down -v` permanently destroys all data. No `pg_stat_statements` extension for query monitoring either.

**File:** `docker/docker-compose.yml`

---

#### 4. `users.findAll()` Does Not Filter Soft-Deleted Users

**Effort:** Low | **Impact:** High | **Reported by:** postgres-pro

The admin user listing method does not include `isNull(users.deletedAt)` in its conditions, exposing soft-deleted users in the admin panel.

**Fix:** Add `isNull(users.deletedAt)` to conditions in `src/modules/user/user.repository.ts:93-126`.

---

#### 5. Swagger/OpenAPI Disabled Entirely in Production

**Effort:** Low | **Impact:** High | **Reported by:** api-designer

Both the Swagger UI and the OpenAPI JSON document are disabled in production. This blocks SDK generation, contract testing, and API gateway integration.

**Fix:** Always expose the OpenAPI document endpoint (optionally protected); conditionally show UI only in development.

**File:** `src/main.ts:51`

---

#### 6. `strictPropertyInitialization: false` Project-Wide

**Effort:** Medium | **Impact:** High | **Reported by:** typescript-pro

Disabled to accommodate NestJS DTOs, but it also silently disables real safety checks for all other classes (services, repositories, etc.).

**Fix:** Re-enable the flag and use `declare` keyword or `!` only on DTO properties that need it.

**File:** `tsconfig.json:31`

---

#### 7. `passport-github2` Package Unmaintained

**Effort:** Medium | **Impact:** Medium | **Reported by:** security-auditor

Version `0.1.12` -- community fork with no significant updates. Supply chain risk.

**Fix:** Evaluate implementing GitHub OAuth directly or using a maintained alternative.

**File:** `package.json:58`

---

#### 8. No `.env.example` File

**Effort:** Low | **Impact:** Low | **Reported by:** security-auditor, postgres-pro

No documentation for required environment variables beyond the Zod schema. Increases misconfiguration risk.

**Fix:** Create `.env.example` with all variables from `env.schema.ts` using placeholder values.

---

## Completed Fixes (History)

| #    | Finding                                                       | Impact   | Effort | Priority | Status |
| ---- | ------------------------------------------------------------- | -------- | ------ | -------- | ------ |
| 1    | Add Helmet security headers                                   | Critical | Low    | P0       | Done   |
| 2    | Remove default JWT_SECRET                                     | Critical | Low    | P0       | Done   |
| 3    | Fix CORS default to deny all                                  | Critical | Low    | P0       | Done   |
| 4    | Enable graceful shutdown hooks                                | Critical | Low    | P0       | Done   |
| 5    | Filter soft-deleted users from login                          | Critical | Low    | P0       | Done   |
| 6    | Fix login timing side-channel                                 | High     | Low    | P0       | Done   |
| 7    | Fix N+1 budget overspend cron                                 | Critical | Medium | P1       | Done   |
| 8    | Add composite database indexes                                | Critical | Low    | P1       | Done   |
| 9    | Push refresh token filters to SQL                             | High     | Low    | P1       | Done   |
| 10   | Cap export with LIMIT + streaming                             | Critical | Medium | P1       | Done   |
| 11   | Replace isDescendantOf with CTE                               | High     | Low    | P1       | Done   |
| 12   | Rate limiting fail-closed on Redis down                       | Critical | Medium | P1       | Done   |
| 13   | Per-endpoint throttling on expensive ops                      | High     | Low    | P1       | Done   |
| 14   | Protect /process endpoint (admin-only)                        | High     | Low    | P1       | Done   |
| 15   | Align admin password policy                                   | High     | Low    | P1       | Done   |
| 16   | Fix service-to-DB architecture violation                      | High     | Medium | P1       | Done   |
| 17   | Add JWT session validation / blacklist                        | Critical | High   | P1       | Done   |
| 18   | Consolidate 3 Redis connections (3→2)                         | High     | Medium | P1       | Done   |
| 19   | Domain events for cache invalidation                          | High     | High   | P2       | Done   |
| 20   | Extract pagination helper                                     | Medium   | Low    | P2       | Done   |
| 21   | Remove/complete TransformInterceptor                          | Medium   | Low    | P2       | Done   |
| 23   | Async CSV parsing                                             | High     | Medium | P2       | Done   |
| 24   | Cache stampede protection                                     | High     | Medium | P2       | Done   |
| 25   | Migrate date columns to timestamptz                           | High     | Medium | P2       | Done   |
| 26   | CSRF protection for cookie auth                               | High     | Medium | P2       | Done   |
| 27   | Disable Swagger in production                                 | Medium   | Low    | P2       | Done   |
| 28   | Consistent validator decorators                               | Medium   | Low    | P2       | Done   |
| 29   | Add database CHECK constraints                                | Medium   | Low    | P2       | Done   |
| 30   | Fix NULLS NOT DISTINCT on unique index                        | Medium   | Low    | P2       | Done   |
| 31   | Decimal arithmetic for money                                  | High     | Medium | P2       | Done   |
| 32   | HTTP response compression                                     | Low      | Low    | P3       | Done   |
| 33   | Add statement_timeout                                         | Medium   | Low    | P3       | Done   |
| 34   | Sort params on all collections                                | Low      | Medium | P3       | Done   |
| A-2  | No PostgreSQL config in Docker Compose                        | Critical | Low    | P0       | Done   |
| A-4  | CSRF token missing from CORS allowedHeaders                   | High     | Low    | P1       | Done   |
| A-5  | Missing CsrfGuard on revoke-refresh-token                     | High     | Low    | P1       | Done   |
| A-6  | CSRF token comparison not timing-safe                         | High     | Low    | P1       | Done   |
| A-12 | Missing index on emailVerificationToken                       | High     | Low    | P1       | Done   |
| A-16 | Throttler auth bypass returns true                            | High     | Low    | P1       | Done   |
| A-19 | findByParentCategory has no LIMIT                             | High     | Low    | P1       | Done   |
| A-20 | Docker PG port exposed on all interfaces                      | High     | Low    | P1       | Done   |
| A-21 | Docker default password in plaintext                          | High     | Low    | P1       | Done   |
| A-25 | AllExceptionsFilter uses @Optional()                          | High     | Low    | P1       | Done   |
| A-60 | sameSite stored as string losing type                         | Medium   | Low    | P2       | Done   |
| A-7  | AuthService layer violation (UserRepository)                  | High     | Medium | P1       | Done   |
| A-8  | ProfileService layer violation (UserRepository)               | High     | Medium | P1       | Done   |
| A-33 | Excessive constructor params (AuthService)                    | Medium   | Medium | P2       | Done   |
| 27   | Replace `result[0] as T` casts with destructuring             | Critical | Medium | P1       | Done   |
| 28   | Extract duplicated category validation                        | High     | Medium | P2       | Done   |
| 34   | Move `loginStatusEnum` to enums.ts + UPPER_CASE               | Medium   | Low    | P2       | Done   |
| 47   | Add ParseUUIDPipe to email verification token                 | High     | Low    | P2       | Done   |
| 49   | Remove `onboardingCompleted` from UpdateProfileDto            | Low      | Low    | P2       | Done   |
| 51   | Remove redundant pagination defaults from controllers         | Medium   | Low    | P2       | Done   |
| 52   | Register TimeoutInterceptor via DI                            | High     | Low    | P2       | Done   |
| 9    | Soft-delete unique constraint blocks category recreation      | Critical | Medium | P1       | Done   |
| 11   | Timestamps missing `withTimezone` across most tables          | Critical | Medium | P1       | Done   |
| 13   | Double-query pattern on create/update                         | High     | Medium | P1       | Done   |
| 14   | Sequential processing in `processAllRecurringTransactions`    | High     | Medium | P1       | Done   |
| 22   | Missing partial indexes for `deletedAt IS NULL`               | High     | Medium | P1       | Done   |
| 23   | `ilike` search on `description` with no trigram index         | High     | Medium | P1       | Done   |
| 30   | ILIKE wildcards not escaped in `UserRepository.findAll`       | Medium   | Low    | P2       | Done   |
| 17   | `CountryCode`/`CurrencyCode` PG enums to varchar(3)           | Critical | High   | P1       | Done   |
| 35   | Analytics `::date` cast ignores user timezone                 | Medium   | Medium | P2       | N/A    |
| 36   | `sql.raw` used for granularity string in `getTrends`          | Medium   | Low    | P2       | Done   |
| 37   | Redundant plain index on `RefreshToken.token`                 | Medium   | Low    | P2       | Done   |
| 38   | Missing composite index for scheduler query                   | Medium   | Low    | P2       | Done   |
| 39   | Missing `(actorId, createdAt)` composite on AuditLog/LoginLog | Medium   | Low    | P2       | Done   |
| 40   | `updatedAt` only updated by ORM, not DB trigger               | Medium   | Medium | P2       | Done   |
| 41   | `RecurringTransaction` missing `endDate > startDate` check    | Medium   | Low    | P2       | Done   |
| 42   | Duplicate FK on `Transaction.categoryId`                      | Medium   | Low    | P2       | Done   |
| 18b  | Remaining two Redis connections (ioredis vs node-redis)       | High     | High   | P1       | Done   |
| 29   | `CachePort` abstraction is dead code                          | Medium   | Low    | P2       | Done   |
| 31   | `delByPrefix` uses SCAN + sequential DEL                      | Medium   | Medium | P2       | Done   |
| 55   | Redis roundtrip on every authenticated request                | Medium   | Medium | P2       | Done   |
| 43   | `enableImplicitConversion: true` in ValidationPipe            | Medium   | Medium | P2       | Done   |
| 44   | JWT algorithm not explicitly specified                        | Medium   | Low    | P2       | Done   |
| 45   | Token blacklist fail-open design (no monitoring)              | Medium   | Medium | P2       | Done   |
| 46   | Social auth code exchange race condition (TOCTOU)             | Medium   | Medium | P2       | Done   |
| 53   | Social callback swallows all errors                           | Medium   | Medium | P2       | Done   |
| 54   | Health indicators don't extend `HealthIndicator`              | Medium   | Medium | P2       | Done   |
| 62   | `RequestContextInterceptor` noop `tap()` operator             | Low      | Low    | P3       | Done   |
| 63   | `console.error` in database provider instead of Logger        | Low      | Low    | P3       | Done   |
| 64   | Login endpoint leaks social auth account type                 | Low      | Low    | P3       | Done   |
| 32b  | Export loads 10K rows + JSON.stringify into memory            | Medium   | Medium | P2       | Done   |
| 50   | No `Link` header emitted for paginated responses              | Medium   | Medium | P2       | Done   |
| 56   | Sequential cache invalidation loops in scheduled tasks        | Medium   | Low    | P2       | Done   |
| 57   | `select()` wildcard fetches sensitive/unused columns          | Medium   | Low    | P2       | Done   |
| 58   | Missing controller return type annotations                    | Medium   | Medium | P2       | Done   |
| 59   | Header type casts drop array case                             | Medium   | Low    | P2       | Done   |
| 61   | Guards barrel re-export violates project convention           | Medium   | Low    | P2       | Done   |
| 65   | RETURNING order dependency in cloneDefaultCategoriesToUser    | High     | Low    | P1       | Done   |
| 66   | Admin hard-delete does not invalidate user sessions           | High     | Medium | P1       | Done   |
| 67   | path-to-regexp ReDoS vulnerability in @nestjs/core            | High     | Low    | P1       | Done   |
| 69   | existsByEmail counts soft-deleted users                       | Medium   | Low    | P2       | Done   |
| 70   | Admin can hard-delete own account                             | Medium   | Low    | P2       | Done   |
| 71   | socialAuthRedirectUrl as string without runtime guard         | Medium   | Low    | P2       | Done   |
| 72   | Validation errors documented as 400 but pipe throws 422       | Medium   | Low    | P2       | Done   |
| 73   | BudgetResponseDto.endDate non-nullable but column optional    | Medium   | Low    | P2       | N/A    |
| 74   | POST /recurring-transactions/process lacks rate limiting      | Medium   | Low    | P2       | Done   |
| 75   | Missing CHECK positive amount on Budget+RecurringTransaction  | Medium   | Low    | P2       | Done   |
| 76   | Missing composite index (userId, status) on Budget            | Medium   | Low    | P2       | Done   |
| 77   | Verification table no unique constraint on identifier         | Medium   | Low    | P2       | Done   |
| 78   | SQL alias-based GROUP BY/ORDER BY fragile pattern             | Medium   | Low    | P2       | Done   |
| 79   | getSpentAmount no partial index for EXPENSE filter            | Medium   | Low    | P2       | Done   |
| 80   | findOverlapping budget no composite index                     | Medium   | Low    | P2       | Done   |
| 83   | Duplicated getCategoryInfo method across repositories         | Medium   | Low    | P2       | Done   |
| 85   | Unsafe as casts on .returning() suppress Drizzle inference    | Medium   | Low    | P2       | Done   |
| 86   | Filters/interceptors dual-registration pattern                | Medium   | Low    | P2       | Done   |
