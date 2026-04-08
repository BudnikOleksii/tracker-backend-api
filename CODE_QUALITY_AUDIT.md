# Tracker Backend API - Code Quality & Type Safety Audit

**Date:** 2026-04-08
**Audited by:** 3 specialist agents (NestJS Expert, TypeScript Pro, API Designer)

---

## Executive Summary

Following the initial security/performance audit (see `AUDIT.md`), this audit focuses on **code quality, type safety, API design, and duplication**. The codebase has solid NestJS conventions and clean layering, but the review uncovered **38 actionable improvements** across typing, architecture, and REST API design.

### Scoring Guide

- **Impact:** How much the fix improves correctness, maintainability, or developer experience (1-5)
- **Effort:** How much work to implement (S = hours, M = 1-2 days, L = 3-5 days)
- **Priority:** P0 = fix now, P1 = this sprint, P2 = next sprint, P3 = backlog

---

## P0 - Correctness / Fix Immediately

### 1. `AuthUser.role` typed as `string` instead of `UserRole`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 5      | S      | TS     |

**Problem:** `auth.types.ts:11` declares `role: string` even though `UserRole` is imported in the same file. Every consumer of `AuthUser` / `AuthenticatedRequest` loses enum type safety. Downstream code like `user.controller.ts:106` compensates with inline intersections (`RequestWithUserId & { user: { role: UserRole } }`).

**Fix:** Change `role: string` to `role: UserRole` in `AuthUser`.

**Files:** `src/modules/auth/auth.types.ts:11`

---

### 2. `Record<string, unknown>` bypasses Drizzle type checking in all repositories

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 5      | M      | TS     |

**Problem:** Every repository builds update objects as `Record<string, unknown>` and passes them to Drizzle's `.set()`. This bypasses column name and type checking at compile time. A typo like `currenyCode` would silently be ignored.

**Files:**

- `src/modules/user/user.repository.ts:174,236`
- `src/modules/transactions/transactions.repository.ts:282`
- `src/modules/transaction-categories/transaction-categories.repository.ts:197`
- `src/modules/recurring-transactions/recurring-transactions.repository.ts:249`
- `src/modules/default-transaction-categories/default-transaction-categories.repository.ts:151`
- `src/modules/budgets/budgets.repository.ts:182`

**Fix:** Use Drizzle-inferred types (e.g., `Partial<typeof users.$inferInsert>`) instead of `Record<string, unknown>`.

---

### 3. `ConflictException` thrown with `ErrorCode.BAD_REQUEST`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 4      | S      | NestJS |

**Problem:** `budgets.service.ts:328` throws `ConflictException` (HTTP 409) but uses `code: ErrorCode.BAD_REQUEST`. Clients receive contradictory signals: status 409 with code `BAD_REQUEST`.

**Fix:** Use `ErrorCode.RESOURCE_CONFLICT` (or add it if missing).

**Files:** `src/modules/budgets/budgets.service.ts:328`

---

### 4. `getProfile`/`updateProfile` throw `UnauthorizedException` for missing users

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 4      | S      | NestJS |

**Problem:** `profile.service.ts:29-44` throws `UnauthorizedException` when the user is not found. If the JWT is valid, "user not found" is a data inconsistency, not an auth failure. Should be `NotFoundException`.

**Fix:** Replace `UnauthorizedException` with `NotFoundException` and appropriate error code.

**Files:** `src/modules/profile/profile.service.ts:29-44`

---

### 5. `POST /recurring-transactions/process` — ADMIN guard but user-scoped operation

| Impact | Effort | Agents      |
| ------ | ------ | ----------- |
| 4      | S      | NestJS, API |

**Problem:** `recurring-transactions.controller.ts:140-148` requires ADMIN role but calls `processRecurringTransactions(req.user.id)`, which only processes the calling user's transactions. Either the ADMIN guard is unnecessary (if it's meant to be per-user) or it should call `processAllRecurringTransactions()` (if it's meant to be a global trigger).

**Fix:** Clarify intent — remove `@Roles('ADMIN')` or change to call `processAllRecurringTransactions()`.

**Files:** `src/modules/recurring-transactions/recurring-transactions.controller.ts:140-148`

---

### 6. Unify `RequestWithUserId` and `AuthenticatedRequest`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 4      | S      | TS     |

**Problem:** Two parallel request types exist: `RequestWithUserId` (minimal `{ user: { id: string } }`) and `AuthenticatedRequest` (full `AuthUser`). After JWT auth, the user object always has the full `AuthUser` shape, so using `RequestWithUserId` is artificially narrow. This forces ugly intersections like `RequestWithUserId & { user: { role: UserRole } }` in `user.controller.ts`.

**Fix:** Once #1 is fixed, use `AuthenticatedRequest` everywhere and remove `RequestWithUserId`. Controllers that only need `req.user.id` can just access that field without needing a separate type.

**Files:** `src/shared/types/request.ts`, `src/modules/auth/auth.types.ts`, all controllers

---

## P1 - High Priority / This Sprint

### 7. `validateCategory` triplicated across 3 services + 3 repositories

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 4      | M      | NestJS |

**Problem:** Identical `validateCategory` logic exists in `transactions.service.ts:703-729`, `recurring-transactions.service.ts:466-488`, and `budgets.service.ts:292-305`. Each corresponding repository also has its own `findCategoryByIdAndUserId` running the same SQL.

**Fix:** Inject `TransactionCategoriesRepository` (already exists) into these services. Remove the duplicate repository methods.

**Files:** 3 services, 3 repositories

---

### 8. `CategoryValidationInfo` defined identically in 3 repositories

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 3      | S      | TS, NestJS |

**Problem:** Same `{ id: string; type: TransactionType }` interface in `transactions.repository.ts:86`, `recurring-transactions.repository.ts:86`, `budgets.repository.ts:65`.

**Fix:** Extract to `src/shared/types/category-detail.ts` (which already has `CategoryDetail`). Will be resolved naturally when #7 is fixed.

**Files:** 3 repository files

---

### 9. `isUniqueViolation` duplicated in 2 services

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | NestJS |

**Problem:** Identical implementations in `transaction-categories.service.ts:262-269` and `default-transaction-categories.service.ts:223-230`.

**Fix:** Extract to `src/shared/utils/pg-errors.ts`.

**Files:** 2 service files

---

### 10. `BCRYPT_ROUNDS` duplicated

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | NestJS |

**Problem:** Defined identically in `user.service.ts:19` and `profile.service.ts:14`.

**Fix:** Move to `src/shared/constants/auth.constants.ts`.

**Files:** 2 service files

---

### 11. `CACHE_MODULE` string duplicated in transactions module

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | NestJS |

**Problem:** `transactions.service.ts:34` and `transactions-cache.listener.ts:9` both define `const CACHE_MODULE = 'transactions'` independently. If one changes, the other silently goes out of sync.

**Fix:** Export from `transactions.constants.ts` (where `SORT_BY_FIELDS` already lives).

**Files:** `src/modules/transactions/transactions.service.ts`, `src/modules/transactions/transactions-cache.listener.ts`

---

### 12. `TransactionsService` is 730 lines — extract import logic

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 4      | M      | NestJS |

**Problem:** CSV/JSON parsing, validation, and category resolution for import is a separate bounded context embedded in an already large service. Exceeds the project's 200-instruction class guideline.

**Fix:** Extract to `TransactionImportService` in the same module.

**Files:** `src/modules/transactions/transactions.service.ts`

---

### 13. `ProfileService` directly depends on `AuthService`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | M      | NestJS |

**Problem:** `profile.service.ts` imports `AuthService` to call `revokeAllRefreshTokens` and `blacklistAccessToken` on password change/account deletion. This creates an upward dependency (`ProfileModule` -> `AuthModule`).

**Fix:** Emit domain events (`user.password-changed`, `user.account-deleted`) that `AuthService` listens for — matching the pattern already used for transaction cache invalidation.

**Files:** `src/modules/profile/profile.service.ts`

---

### 14. Missing explicit return types on service public methods

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | M      | TS     |

**Problem:** `AuthService` (register, login, refreshToken, getRefreshToken, listRefreshTokens) and `TransactionsAnalyticsService` (all 5 public methods) lack explicit return types. Complex inferred types silently drift.

**Fix:** Declare return type interfaces for each method.

**Files:** `src/modules/auth/auth.service.ts`, `src/modules/transactions-analytics/transactions-analytics.service.ts`

---

### 15. DELETE endpoints: 200 with body vs 204 no body inconsistency

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | API    |

**Problem:** All DELETE endpoints return HTTP 200 with `{ message }` except `DELETE /users/:id` which returns 204 with no body.

**Fix:** Pick one convention and apply consistently. 200 + message is fine for DX — just make `DELETE /users/:id` match.

**Files:** `src/modules/user/user.controller.ts:112`

---

### 16. Logout/revoke return `200 { success: false }` instead of error status

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | API    |

**Problem:** `POST /auth/logout` and `POST /auth/revoke-refresh-token` return HTTP 200 with `success: false` on failure. This leaks flow control into the response body instead of using proper HTTP semantics.

**Fix:** Return 404 (session not found) or make the operation idempotent (always 200).

**Files:** `src/modules/auth/auth.controller.ts:139,162`

---

## P2 - Medium Priority / Next Sprint

### 17. `PUT /users/:id/role` should be `PATCH`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | API    |

**Problem:** `PUT` implies full resource replacement but this only updates role. Also overlaps with `PATCH /users/:id` which can also update role.

**Fix:** Change to `PATCH` or remove in favor of the existing `PATCH /users/:id`.

**Files:** `src/modules/user/user.controller.ts:96`

---

### 18. `GET /auth/refresh-token` vs `POST /auth/refresh-token` path collision

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | API    |

**Problem:** Same path, different HTTP methods — semantically confusing. GET returns token info, POST refreshes the token.

**Fix:** Rename GET to `GET /auth/refresh-token/info` or `GET /auth/session/current`.

**Files:** `src/modules/auth/auth.controller.ts:103,121`

---

### 19. `totalPages` missing from `OffsetListResponseDto` Swagger schema

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | API    |

**Problem:** `buildPaginatedResponse` returns `totalPages` in the response, but the Swagger DTO does not declare it. Swagger docs omit this field from all list endpoints.

**Fix:** Add `totalPages: number` with `@ApiProperty()` to `OffsetListResponseDto`.

**Files:** `src/shared/dtos/list-response.dto.ts`

---

### 20. `AnalyticsQueryDto.currencyCode` is required while optional everywhere else

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | API    |

**Problem:** Every other module has `currencyCode` as optional, but analytics requires it with no default. Users without a `baseCurrencyCode` have no obvious value to send.

**Fix:** Make optional with fallback to user's `baseCurrencyCode`, or document the expectation.

**Files:** `src/modules/transactions-analytics/dtos/analytics-query.dto.ts:12`

---

### 21. No `dateFrom <= dateTo` cross-field validation

| Impact | Effort | Agents      |
| ------ | ------ | ----------- |
| 3      | S      | API, NestJS |

**Problem:** All query DTOs with `dateFrom`/`dateTo` accept reversed date ranges, returning empty results silently instead of 400.

**Fix:** Add a custom class-validator `@IsBeforeConstraint` or `@Validate` cross-field check.

**Files:** `TransactionQueryDto`, `ExportTransactionQueryDto`, `AnalyticsQueryDto`, `CreateBudgetDto`

---

### 22. `AuditLogQueryDto` defined inside controller file

| Impact | Effort | Agents      |
| ------ | ------ | ----------- |
| 2      | S      | NestJS, API |

**Problem:** `audit-log.controller.ts:23-55` defines the DTO inline. Every other module keeps DTOs in a `dtos/` subdirectory.

**Fix:** Move to `src/modules/audit-log/dtos/audit-log-query.dto.ts`.

**Files:** `src/modules/audit-log/audit-log.controller.ts:23-55`

---

### 23. 7 modules redundantly import `@Global()` `CacheModule`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | NestJS |

**Problem:** `CacheModule` is `@Global()`, making `imports: [CacheModule]` in each feature module unnecessary noise.

**Fix:** Remove `CacheModule` from `imports` in all 7 feature modules.

**Files:** 7 module files

---

### 24. Auth revoke endpoints missing auth throttle band

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | API    |

**Problem:** Only register/login/refresh use `@Throttle({ auth: {} })`. Revoke endpoints use the default throttle (60/60s). An attacker with a JWT could hammer revoke endpoints.

**Fix:** Apply `@Throttle({ auth: {} })` to revoke-refresh-token and revoke-refresh-tokens.

**Files:** `src/modules/auth/auth.controller.ts:162,179`

---

### 25. `RegisterDto` missing `!` definite assignment on `email`/`password`

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 2      | S      | TS, NestJS |

**Problem:** All other DTOs use `!` (e.g., `name!: string`). `RegisterDto` omits it on `email` and `password`, which can interfere with `useDefineForClassFields` in strict TypeScript.

**Fix:** Add `!` to match the project convention.

**Files:** `src/modules/auth/dtos/register.dto.ts:17,23`

---

### 26. `CreateUserDto.name` inconsistency with `RegisterDto.firstName/lastName`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | S      | API    |

**Problem:** `RegisterDto` accepts `firstName`/`lastName` separately, but admin `CreateUserDto` accepts a single `name` field. The `UserResponseDto` shows neither — only `id`, `email`, `role`, `createdAt`, `updatedAt`. Unclear what happens to `name`.

**Fix:** Align `CreateUserDto` with `RegisterDto` (use `firstName`/`lastName`) or document the mapping.

**Files:** `src/modules/user/dtos/create-user.dto.ts`, `src/modules/auth/dtos/register.dto.ts`

---

### 27. `CategoryQueryDto.root` — no post-transform boolean validation

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | API    |

**Problem:** The `root` param uses `@Transform` to convert `'true'/'false'` strings but has no `@IsBoolean` after transformation. Sending `root=maybe` passes as `false` silently.

**Fix:** Add `@IsBooleanField()` after the transform. Same in `DefaultTransactionCategoryQueryDto`.

**Files:** `src/modules/transaction-categories/dtos/category-query.dto.ts:33`, `src/modules/default-transaction-categories/dtos/default-transaction-category-query.dto.ts:28`

---

### 28. `audit-log.interceptor.ts` uses inline type cast instead of `AuthUser`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | TS     |

**Problem:** `audit-log.interceptor.ts:18` casts `req.user as { id: string; email?: string }` instead of importing `AuthUser`. Line 30 casts params as `Record<string, string>` instead of using Express's `ParamsDictionary`.

**Fix:** Import and use `AuthUser` from `auth.types.ts`.

**Files:** `src/modules/audit-log/audit-log.interceptor.ts:18,30`

---

### 29. Missing `import type` for `AnyPgColumn`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 1      | S      | TS     |

**Problem:** `refresh-tokens.ts:1` imports `AnyPgColumn` as a value import but it's only used as a type. `transaction-categories.ts` correctly uses `type AnyPgColumn`.

**Fix:** Change to `import { type AnyPgColumn, ... }`.

**Files:** `src/database/schemas/refresh-tokens.ts:1`

---

## P3 - Backlog

### 30. No text search on transactions

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 3      | M      | API    |

**Problem:** `TransactionQueryDto` has filters for type, category, currency, date — but no `search`/`q` parameter for description text search. Common feature for financial apps.

**Files:** `src/modules/transactions/dtos/transaction-query.dto.ts`

---

### 31. `RecurringTransactionResponseDto` / `BudgetResponseDto` expose `userId`

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | API    |

**Problem:** Response DTOs include `userId` which is redundant — the authenticated user already knows their own ID.

**Files:** `src/modules/budgets/dtos/budget-response.dto.ts:14`, `src/modules/recurring-transactions/dtos/recurring-transaction-response.dto.ts:22`

---

### 32. `CreateRecurringTransactionDto.interval` has no maximum

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | API    |

**Problem:** `interval` has `@MinField(1)` but no `@MaxField`. A request with `interval: 999999` succeeds.

**Fix:** Add `@MaxField(365)` or similar reasonable upper bound.

**Files:** `src/modules/recurring-transactions/dtos/create-recurring-transaction.dto.ts:65`

---

### 33. Missing `@ApiResponse` for 401/403 on protected endpoints

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | M      | API    |

**Problem:** Only `profile.controller.ts` declares `@ApiResponse({ status: 401 })`. All other JWT-protected controllers omit it. Admin controllers omit 403 documentation.

**Files:** All controllers

---

### 34. Silent catch in `processRecurringTransactions` (user-scoped)

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | NestJS |

**Problem:** `recurring-transactions.service.ts:296` silently swallows errors with an empty catch. The system-wide version logs errors, but this path has no logging.

**Fix:** Add `this.logger.error()` in the catch block.

**Files:** `src/modules/recurring-transactions/recurring-transactions.service.ts:296`

---

### 35. Unnecessary `as BudgetStatus` casts on string literals

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 1      | S      | TS     |

**Problem:** `budgets.service.ts:239,243` uses `'EXCEEDED' as BudgetStatus` and `'ACTIVE' as BudgetStatus`. Since `BudgetStatus` is a union type, the string literals are directly assignable.

**Fix:** Remove the `as` casts or use `as const`.

**Files:** `src/modules/budgets/budgets.service.ts:239,243`

---

### 36. `computeEndDate` YEARLY logic undocumented

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | NestJS |

**Problem:** `budgets.service.ts:285-287` uses `new Date(year + 1, month + 1, 0)` for YEARLY end date. The "day 0" arithmetic is correct but non-obvious and differs subtly from MONTHLY/QUARTERLY patterns.

**Fix:** Add a clarifying comment or use explicit date arithmetic.

**Files:** `src/modules/budgets/budgets.service.ts:285-287`

---

### 37. `ImportTransactionResponseDto` lacks error/warning details

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 2      | S      | API    |

**Problem:** The import endpoint returns success counts but no information about skipped or failed rows.

**Fix:** Add `failedCount` and `errors` (array of row-level failure descriptions) to the response DTO.

**Files:** `src/modules/transactions/dtos/import-transaction-response.dto.ts`

---

### 38. `cache.service.ts` inFlight Map has unsafe generic cast

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 1      | S      | TS     |

**Problem:** `cache.service.ts:67` casts `Promise<unknown>` to `Promise<T>`. If the same key is requested with different type parameters, this is unsound.

**Fix:** Pragmatically safe in practice (same key = same type), but could use a branded key or runtime check.

**Files:** `src/modules/cache/cache.service.ts:67`

---

## Summary Matrix

| #   | Finding                                            | Impact | Effort | Priority | Status |
| --- | -------------------------------------------------- | ------ | ------ | -------- | ------ |
| 1   | `AuthUser.role` typed as `string`                  | 5      | S      | P0       | Done   |
| 2   | `Record<string, unknown>` in Drizzle `.set()`      | 5      | M      | P0       | Done   |
| 3   | `ConflictException` with wrong error code          | 4      | S      | P0       | Done   |
| 4   | Wrong exception in profile service                 | 4      | S      | P0       | Done   |
| 5   | ADMIN guard + user-scoped process mismatch         | 4      | S      | P0       | Done   |
| 6   | Unify `RequestWithUserId` / `AuthenticatedRequest` | 4      | S      | P0       | Done   |
| 7   | `validateCategory` triplicated                     | 4      | M      | P1       | Done   |
| 8   | `CategoryValidationInfo` in 3 repositories         | 3      | S      | P1       | Done   |
| 9   | `isUniqueViolation` duplicated                     | 3      | S      | P1       | Done   |
| 10  | `BCRYPT_ROUNDS` duplicated                         | 3      | S      | P1       | Done   |
| 11  | `CACHE_MODULE` string duplicated                   | 3      | S      | P1       | Done   |
| 12  | Extract `TransactionImportService`                 | 4      | M      | P1       | Todo   |
| 13  | `ProfileService` -> `AuthService` coupling         | 3      | M      | P1       | Todo   |
| 14  | Missing explicit return types on services          | 3      | M      | P1       | Todo   |
| 15  | DELETE 200 vs 204 inconsistency                    | 3      | S      | P1       | Todo   |
| 16  | Logout returns `200 { success: false }`            | 3      | S      | P1       | Todo   |
| 17  | `PUT /users/:id/role` should be `PATCH`            | 3      | S      | P2       | Todo   |
| 18  | GET vs POST `/auth/refresh-token` collision        | 2      | S      | P2       | Todo   |
| 19  | `totalPages` missing from Swagger schema           | 3      | S      | P2       | Todo   |
| 20  | `currencyCode` required in analytics only          | 2      | S      | P2       | Todo   |
| 21  | No `dateFrom <= dateTo` cross-field validation     | 3      | S      | P2       | Todo   |
| 22  | `AuditLogQueryDto` in controller file              | 2      | S      | P2       | Todo   |
| 23  | Redundant `@Global()` CacheModule imports          | 2      | S      | P2       | Todo   |
| 24  | Auth revoke missing throttle band                  | 3      | S      | P2       | Todo   |
| 25  | `RegisterDto` missing `!` on properties            | 2      | S      | P2       | Todo   |
| 26  | `CreateUserDto.name` vs `firstName/lastName`       | 3      | S      | P2       | Todo   |
| 27  | `CategoryQueryDto.root` no boolean validation      | 2      | S      | P2       | Todo   |
| 28  | Audit interceptor inline type casts                | 2      | S      | P2       | Todo   |
| 29  | Missing `import type` for `AnyPgColumn`            | 1      | S      | P2       | Todo   |
| 30  | No text search on transactions                     | 3      | M      | P3       | Todo   |
| 31  | Response DTOs expose `userId`                      | 2      | S      | P3       | Todo   |
| 32  | `interval` has no maximum                          | 2      | S      | P3       | Todo   |
| 33  | Missing 401/403 `@ApiResponse` on endpoints        | 2      | M      | P3       | Todo   |
| 34  | Silent catch in process (user-scoped)              | 2      | S      | P3       | Todo   |
| 35  | Unnecessary `as BudgetStatus` casts                | 1      | S      | P3       | Todo   |
| 36  | `computeEndDate` YEARLY logic undocumented         | 2      | S      | P3       | Todo   |
| 37  | Import response lacks error details                | 2      | S      | P3       | Todo   |
| 38  | `cache.service.ts` inFlight unsafe cast            | 1      | S      | P3       | Todo   |
