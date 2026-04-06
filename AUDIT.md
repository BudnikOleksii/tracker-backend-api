# Tracker Backend API - Comprehensive Audit Report

**Date:** 2026-04-05
**Audited by:** 7 specialist agents (API Designer, Architect Reviewer, NestJS Expert, Performance Engineer, Security Auditor, PostgreSQL Pro, Database Optimizer)

---

## Executive Summary

The application is well-structured with solid NestJS conventions, clean layering, and good use of Drizzle ORM. However, the audit uncovered **52 unique findings** across security, performance, architecture, database, and API design. After deduplication (many findings were flagged by multiple agents), these consolidate into **35 actionable improvements** ranked below by effort and impact.

### Scoring Guide

- **Impact:** How much the fix improves security, performance, reliability, or maintainability (1-5)
- **Effort:** How much work to implement (S = hours, M = 1-2 days, L = 3-5 days, XL = 1-2 weeks)
- **Priority:** Calculated from impact and effort. P0 = do now, P1 = this sprint, P2 = next sprint, P3 = backlog

---

## P0 - Critical / Fix Immediately

### 1. Add Helmet security headers

| Impact | Effort | Agents   |
| ------ | ------ | -------- |
| 5      | S      | Security |

**Problem:** No Helmet middleware. Missing HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy. For a financial app, this is unacceptable.

**Fix:** `pnpm add helmet` and add `app.use(helmet())` in `main.ts`.

**Files:** `src/main.ts`

---

### 2. Remove default JWT_SECRET

| Impact | Effort | Agents                         |
| ------ | ------ | ------------------------------ |
| 5      | S      | Security, Architecture, NestJS |

**Problem:** `env.schema.ts:35` has `.default('your-secret-key-change-me-in-production-min-32-chars')`. Anyone reading the source can forge tokens for any user including SUPER_ADMIN.

**Fix:** Remove the `.default()` call. The app should refuse to start without an explicit secret.

**Files:** `src/app/config/env.schema.ts:35`

---

### 3. Fix CORS to deny all origins by default

| Impact | Effort | Agents           |
| ------ | ------ | ---------------- |
| 5      | S      | Security, NestJS |

**Problem:** `cors.config.ts:3` falls back to `origin: true` when `ALLOWED_ORIGINS` is not set, allowing any origin with `credentials: true`. A textbook CORS misconfiguration.

**Fix:** Default to `origin: []` (deny all) or make `ALLOWED_ORIGINS` required.

**Files:** `src/app/config/cors.config.ts:3`

---

### 4. Enable graceful shutdown hooks

| Impact | Effort | Agents |
| ------ | ------ | ------ |
| 5      | S      | NestJS |

**Problem:** No `app.enableShutdownHooks()` in `main.ts`. `OnModuleDestroy` hooks (Redis, DB connections) never fire on SIGTERM. Database pool also has no explicit `pool.end()` on shutdown.

**Fix:** Add `app.enableShutdownHooks()` before `app.listen()`. Add `OnModuleDestroy` to the database provider to call `pool.end()`.

**Files:** `src/main.ts`, `src/database/database.provider.ts`

---

### 5. Filter soft-deleted users from login

| Impact | Effort | Agents   |
| ------ | ------ | -------- |
| 5      | S      | Security |

**Problem:** `findByEmail` at `user.repository.ts:122` has no `deletedAt IS NULL` check. Users who deleted their account can still log in and access their data.

**Fix:** Add `isNull(users.deletedAt)` to the `findByEmail` WHERE clause.

**Files:** `src/modules/user/user.repository.ts:122`

---

### 6. Fix login timing side-channel

| Impact | Effort | Agents   |
| ------ | ------ | -------- |
| 4      | S      | Security |

**Problem:** `auth.service.ts:67-96` — when user not found, throws immediately without bcrypt. Valid vs invalid emails have measurably different response times, enabling user enumeration.

**Fix:** Perform a dummy `bcrypt.compare()` against a fixed hash when the user is not found.

**Files:** `src/modules/auth/auth.service.ts:67-96`

---

## P1 - High Priority / This Sprint

### 7. Fix N+1 budget overspend cron (getSpentAmount loop + batchUpdateStatuses)

| Impact | Effort | Agents                                      |
| ------ | ------ | ------------------------------------------- |
| 5      | M      | Database Optimizer, Performance, PostgreSQL |

**Problem:** `budgets.service.ts:226` calls `getSpentAmount` per budget in a loop (N+1). `batchUpdateStatuses` at `budgets.repository.ts:315` fires one UPDATE per budget. With 500 budgets = 1,001 sequential DB calls.

**Fix:** Replace with a single aggregation query using `LEFT JOIN` + `GROUP BY`, and a single bulk `UPDATE ... SET status = CASE WHEN` statement wrapped in a transaction.

**Files:** `src/modules/budgets/budgets.service.ts:222-257`, `src/modules/budgets/budgets.repository.ts:268-319`

---

### 8. Add composite database indexes

| Impact | Effort | Agents                                      |
| ------ | ------ | ------------------------------------------- |
| 5      | S      | Database Optimizer, Performance, PostgreSQL |

**Problem:** Individual single-column indexes on `(userId)`, `(date)`, `(currencyCode)` force PostgreSQL to bitmap-merge. Every analytics/list query suffers.

**Fix:** Add these composite indexes:

- `Transaction(userId, currencyCode, date DESC)` -- covers all analytics queries
- `Transaction(userId, date DESC)` -- covers list queries
- `Budget(status, endDate)` partial WHERE `status IN ('ACTIVE','EXCEEDED')` -- covers cron
- `RefreshToken(expiresAt)` -- covers `deleteExpired`

Also drop duplicate indexes: `User_email_idx` (covered by unique constraint), `RefreshToken_token_idx` (covered by unique constraint).

**Files:** `src/database/schemas/transactions.ts`, `src/database/schemas/budgets.ts`, `src/database/schemas/refresh-tokens.ts`, `src/database/schemas/users.ts`

---

### 9. Push refresh token filters to SQL

| Impact | Effort | Agents                                      |
| ------ | ------ | ------------------------------------------- |
| 4      | S      | Database Optimizer, Performance, PostgreSQL |

**Problem:** `findActiveByUserId` at `refresh-token.repository.ts:69` fetches ALL tokens for a user and filters expired/revoked in JavaScript.

**Fix:** Add `isNull(revokedAt)` and `gt(expiresAt, new Date())` to the WHERE clause.

**Files:** `src/modules/auth/refresh-token.repository.ts:69-77`

---

### 10. Cap export with LIMIT and stream response

| Impact | Effort | Agents                          |
| ------ | ------ | ------------------------------- |
| 5      | M      | Database Optimizer, Performance |

**Problem:** `findAllForExport` at `transactions.repository.ts:153` has no LIMIT. A user with 100k transactions loads everything into memory, then `JSON.stringify` doubles it. Potential OOM.

**Fix:** Add `MAX_EXPORT_ROWS = 10000` guard. For large exports, stream using `csv-stringify` streaming API or process in chunks.

**Files:** `src/modules/transactions/transactions.repository.ts:153-188`, `src/modules/transactions/transactions.service.ts:287`

---

### 11. Replace isDescendantOf loop with recursive CTE

| Impact | Effort | Agents                                      |
| ------ | ------ | ------------------------------------------- |
| 4      | S      | Database Optimizer, Performance, PostgreSQL |

**Problem:** `transaction-categories.repository.ts:247` and `default-transaction-categories.repository.ts:240` walk the category tree one level at a time (one query per ancestor).

**Fix:** Single recursive CTE query resolves entire ancestry in one round-trip.

**Files:** `src/modules/transaction-categories/transaction-categories.repository.ts:247-272`, `src/modules/default-transaction-categories/default-transaction-categories.repository.ts:240-271`

---

### 12. Rate limiting fails open when Redis is down

| Impact | Effort | Agents   |
| ------ | ------ | -------- |
| 5      | M      | Security |

**Problem:** `redis-throttler.storage.ts:39-44` returns `totalHits: 0, isBlocked: false` on Redis failure. An attacker can disrupt Redis then brute-force credentials with no rate limiting.

**Fix:** Implement in-memory fallback throttler or fail closed (deny requests) for auth-critical endpoints.

**Files:** `src/app/throttler/redis-throttler.storage.ts:39-44`

---

### 13. Add per-endpoint throttling on expensive operations

| Impact | Effort | Agents       |
| ------ | ------ | ------------ |
| 4      | S      | API Designer |

**Problem:** Only auth endpoints have specific rate limits. Analytics, import, and export endpoints (expensive DB operations) have no tighter per-endpoint limits.

**Fix:** Add `@Throttle({ default: { limit: 10, ttl: 60000 } })` to analytics, import, and export controllers.

**Files:** `src/modules/transactions-analytics/transactions-analytics.controller.ts`, `src/modules/transactions/transactions.controller.ts`

---

### 14. Protect /recurring-transactions/process endpoint

| Impact | Effort | Agents       |
| ------ | ------ | ------------ |
| 4      | S      | API Designer |

**Problem:** `POST /api/recurring-transactions/process` at `recurring-transactions.controller.ts:155` is accessible to all authenticated users. This expensive cron-like endpoint should be admin-only or removed.

**Fix:** Add `@Roles(UserRole.ADMIN)` and `@UseGuards(RolesGuard)`, or remove the endpoint entirely.

**Files:** `src/modules/recurring-transactions/recurring-transactions.controller.ts:155-161`

---

### 15. Align password policy for admin-created users

| Impact | Effort | Agents   |
| ------ | ------ | -------- |
| 4      | S      | Security |

**Problem:** `CreateUserDto` at `user/dtos/create-user.dto.ts:27` only requires 6 chars, no complexity. `RegisterDto` requires 8 chars + letter+digit. Admin can create accounts with password `123456`.

**Fix:** Apply the same validation rules as `RegisterDto`.

**Files:** `src/modules/user/dtos/create-user.dto.ts:27`

---

### 16. Fix architecture violation: service directly accesses DB

| Impact | Effort | Agents       |
| ------ | ------ | ------------ |
| 4      | M      | Architecture |

**Problem:** `DefaultTransactionCategoriesService` at line 29 injects `DrizzleDb` directly and runs raw `tx.insert()` in `assignDefaultCategoriesToUser`. This violates the "only repositories touch DB" rule.

**Fix:** Move the category-cloning logic to `DefaultTransactionCategoriesRepository`. Also batch-insert parents and children in 2 statements instead of 80 individual INSERTs.

**Files:** `src/modules/default-transaction-categories/default-transaction-categories.service.ts:199-247`

---

### 17. Add JWT session validation (token revocation)

| Impact | Effort | Agents           |
| ------ | ------ | ---------------- |
| 5      | L      | Security, NestJS |

**Problem:** JWT access tokens have no blacklist check. After logout, password change, or account deletion, tokens remain valid for up to 15 minutes.

**Fix:** Add a Redis-based session check in `JwtStrategy.validate()` that verifies the `sessionId` still exists, or maintain a short-lived token blacklist.

**Files:** `src/modules/auth/jwt.strategy.ts`, `src/modules/auth/auth.service.ts`

---

### 18. Consolidate Redis connections (3 -> 1)

| Impact | Effort | Agents                            |
| ------ | ------ | --------------------------------- |
| 4      | M      | Performance, NestJS, Architecture |

**Problem:** Three independent Redis connections: `KeyvRedis` (cache-manager), raw `ioredis` in `CacheService`, raw `ioredis` in `RedisThrottlerStorage`. No shared pool, no shared reconnect logic.

**Fix:** Create a shared `REDIS_CLIENT` provider in `CacheModule` exposing a single `ioredis` instance. Inject it into `CacheService` and `RedisThrottlerStorage`. Register `RedisThrottlerStorage` as a proper NestJS provider (not `new`) so lifecycle hooks fire.

**Files:** `src/modules/cache/cache.service.ts:22`, `src/app/throttler/redis-throttler.storage.ts:28`, `src/app.module.ts:57`

---

## P2 - Medium Priority / Next Sprint

### 19. Introduce domain events for cache invalidation

| Impact | Effort | Agents       |
| ------ | ------ | ------------ |
| 4      | L      | Architecture |

**Problem:** `TransactionsService` and `RecurringTransactionsService` have intimate knowledge of `transactions-analytics` and `budgets` cache key prefixes. Cross-module coupling that will worsen as modules grow.

**Fix:** Use NestJS `EventEmitter2`. Emit `TransactionCreated/Updated/Deleted` events. Analytics and budgets modules subscribe and invalidate their own caches. Also parallelize existing invalidations with `Promise.all()` as a quick win.

**Files:** `src/modules/transactions/transactions.service.ts:87-89`, `src/modules/recurring-transactions/recurring-transactions.service.ts:300-301`

---

### 20. Extract pagination helper (DRY violation across 7 controllers)

| Impact | Effort | Agents                     |
| ------ | ------ | -------------------------- |
| 3      | S      | API Designer, Architecture |

**Problem:** Identical pagination envelope logic duplicated in 7 controllers (page, pageSize, totalPages, hasMore calculation).

**Fix:** Create `buildPaginatedResponse(query, result)` utility in `src/shared/utils/pagination.utils.ts`.

**Files:** All 7 list controllers

---

### 21. Remove or complete TransformInterceptor (no-op)

| Impact | Effort | Agents                             |
| ------ | ------ | ---------------------------------- |
| 3      | S      | API Designer, Architecture, NestJS |

**Problem:** `TransformInterceptor` at `transform.interceptor.ts:14-27` returns `data` unchanged in both branches. `@UseEnvelope()` decorator does nothing.

**Fix:** Either implement the intended wrapping or remove both the interceptor and decorator.

**Files:** `src/app/interceptors/transform.interceptor.ts`, `src/shared/decorators/use-envelope.decorator.ts`

---

### 22. Add tests (zero test coverage)

| Impact | Effort | Agents               |
| ------ | ------ | -------------------- |
| 5      | XL     | NestJS, Architecture |

**Problem:** Zero `.spec.ts` or `.test.ts` files in the entire codebase. For a financial application, this is a major risk. `vitest` is installed but not configured.

**Fix:** Priority test targets:

1. Create `vitest.config.ts`
2. Unit tests: `AuthService`, `TransactionsService`, `BudgetsService`, guards, filters
3. Integration tests: auth flow, transaction CRUD, budget overspend logic
4. E2e tests: authentication, data isolation between users

**Files:** Project-wide

---

### 23. Use async CSV parsing (event loop blocking)

| Impact | Effort | Agents      |
| ------ | ------ | ----------- |
| 4      | M      | Performance |

**Problem:** `transactions.service.ts:406` uses `csv-parse/sync` which blocks the event loop for up to 200ms on a 5MB file.

**Fix:** Switch to `csv-parse` async/streaming API.

**Files:** `src/modules/transactions/transactions.service.ts:385-408`

---

### 24. Add cache stampede protection

| Impact | Effort | Agents      |
| ------ | ------ | ----------- |
| 4      | M      | Performance |

**Problem:** `CacheService.wrap()` at `cache.service.ts:62-71` has no in-flight deduplication. 100 concurrent requests for the same expired key = 100 identical DB queries.

**Fix:** Implement promise-based single-flight: store a `Promise` in a `Map` on cache miss, return the same promise to subsequent callers.

**Files:** `src/modules/cache/cache.service.ts:62-71`

---

### 25. Migrate date columns to timestamptz

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 4      | M      | PostgreSQL |

**Problem:** `Transaction.date`, `Budget.startDate/endDate`, `RecurringTransaction.startDate/endDate/nextOccurrenceDate` use `timestamp without time zone`. Users in different timezones get date boundary mismatches.

**Fix:** Migrate to `timestamptz`. Requires migration + testing of all date-range queries.

**Files:** `src/database/schemas/transactions.ts:20`, `src/database/schemas/budgets.ts:21-22`, `src/database/schemas/recurring-transactions.ts`

---

### 26. Add CSRF protection for cookie-based auth

| Impact | Effort | Agents   |
| ------ | ------ | -------- |
| 4      | M      | Security |

**Problem:** Refresh token is stored in httpOnly cookie. `SameSite` can be overridden to `none` via env. When cross-domain, there's no CSRF token mechanism.

**Fix:** Implement double-submit cookie pattern for endpoints that read from cookies.

**Files:** `src/modules/auth/auth.controller.ts`, `src/app/config/env.schema.ts:119`

---

### 27. Disable Swagger/Scalar in production

| Impact | Effort | Agents                 |
| ------ | ------ | ---------------------- |
| 3      | S      | Security, API Designer |

**Problem:** `/swagger`, `/docs`, `/openapi.yaml` are exposed without authentication. Reveals entire API surface to attackers.

**Fix:** Conditionally register Swagger behind `NODE_ENV !== 'production'` or protect with basic auth.

**Files:** `src/app/config/swagger.config.ts`

---

### 28. Use consistent validator decorators across all DTOs

| Impact | Effort | Agents       |
| ------ | ------ | ------------ |
| 3      | S      | API Designer |

**Problem:** `RevokeRefreshTokenDto`, `UserQueryDto`, `TopCategoriesQueryDto`, `DailySpendingQueryDto` use raw `class-validator` decorators instead of project-standard wrappers with `ErrorCode` context.

**Fix:** Replace `@IsUUID()` with `@IsUUIDField()`, `@IsString()` with `@IsStringField()`, etc.

**Files:** `src/modules/auth/dtos/revoke-refresh-token.dto.ts`, `src/modules/user/dtos/user-query.dto.ts`, `src/modules/transactions-analytics/dtos/`

---

### 29. Add database CHECK constraints

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 3      | S      | PostgreSQL |

**Problem:** No `CHECK (endDate > startDate)` on Budget. No `CHECK (amount > 0)` on Transaction. Invalid data can be inserted via bugs or direct DB access.

**Fix:** Add CHECK constraints via migration.

**Files:** `src/database/schemas/budgets.ts`, `src/database/schemas/transactions.ts`

---

### 30. Fix NULLS NOT DISTINCT on category unique index

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 3      | S      | PostgreSQL |

**Problem:** `TransactionCategory` unique index on `(userId, name, type, parentCategoryId)` allows duplicate root categories because `NULL != NULL` in standard B-tree indexes.

**Fix:** PostgreSQL 15 supports `NULLS NOT DISTINCT` on unique indexes.

**Files:** `src/database/schemas/transaction-categories.ts:38-42`, `src/database/schemas/default-transaction-categories.ts:32`

---

### 31. Use decimal arithmetic for financial calculations

| Impact | Effort | Agents                  |
| ------ | ------ | ----------------------- |
| 4      | M      | Performance, PostgreSQL |

**Problem:** Multiple service files use `parseFloat()` on `numeric` column values for budget progress calculations. Floating-point arithmetic on money loses precision.

**Fix:** Use `decimal.js` or `big.js` for all financial calculations. Never use `parseFloat` on monetary values.

**Files:** `src/modules/budgets/budgets.service.ts:208-211`, analytics repository

---

## P3 - Backlog / Future Improvements

### 32. Add HTTP response compression

| Impact | Effort | Agents      |
| ------ | ------ | ----------- |
| 2      | S      | Performance |

**Fix:** `pnpm add compression` and `app.use(compression())` in `main.ts`.

---

### 33. Add statement_timeout to database pool

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 3      | S      | PostgreSQL |

**Fix:** Add `pool.on('connect', (client) => client.query("SET statement_timeout = '30s'"))` in database provider.

---

### 34. Add sort parameters to all collection endpoints

| Impact | Effort | Agents       |
| ------ | ------ | ------------ |
| 2      | M      | API Designer |

**Problem:** Only `GET /api/transactions` supports `sortBy`/`sortOrder`. Other collections lack deterministic ordering.

---

### 35. Plan table partitioning for Transaction table

| Impact | Effort | Agents     |
| ------ | ------ | ---------- |
| 3      | XL     | PostgreSQL |

**Problem:** `Transaction` table will grow indefinitely. Range partitioning by date would enable partition pruning and simplify data retention. Not urgent until >10M rows.

---

## Summary Matrix

| #   | Finding                                  | Impact | Effort | Priority | Status |
| --- | ---------------------------------------- | ------ | ------ | -------- | ------ |
| 1   | Add Helmet security headers              | 5      | S      | P0       | Done   |
| 2   | Remove default JWT_SECRET                | 5      | S      | P0       | Done   |
| 3   | Fix CORS default to deny all             | 5      | S      | P0       | Done   |
| 4   | Enable graceful shutdown hooks           | 5      | S      | P0       | Done   |
| 5   | Filter soft-deleted users from login     | 5      | S      | P0       | Done   |
| 6   | Fix login timing side-channel            | 4      | S      | P0       | Done   |
| 7   | Fix N+1 budget overspend cron            | 5      | M      | P1       | Done   |
| 8   | Add composite database indexes           | 5      | S      | P1       | Done   |
| 9   | Push refresh token filters to SQL        | 4      | S      | P1       | Done   |
| 10  | Cap export with LIMIT + streaming        | 5      | M      | P1       | Done   |
| 11  | Replace isDescendantOf with CTE          | 4      | S      | P1       | Done   |
| 12  | Rate limiting fail-closed on Redis down  | 5      | M      | P1       | Done   |
| 13  | Per-endpoint throttling on expensive ops | 4      | S      | P1       | Done   |
| 14  | Protect /process endpoint (admin-only)   | 4      | S      | P1       | Done   |
| 15  | Align admin password policy              | 4      | S      | P1       | Done   |
| 16  | Fix service-to-DB architecture violation | 4      | M      | P1       | Done   |
| 17  | Add JWT session validation / blacklist   | 5      | L      | P1       | Done   |
| 18  | Consolidate 3 Redis connections to 1     | 4      | M      | P1       | Done   |
| 19  | Domain events for cache invalidation     | 4      | L      | P2       | Todo   |
| 20  | Extract pagination helper                | 3      | S      | P2       | Done   |
| 21  | Remove/complete TransformInterceptor     | 3      | S      | P2       | Done   |
| 22  | Add test coverage                        | 5      | XL     | P2       | Todo   |
| 23  | Async CSV parsing                        | 4      | M      | P2       | Todo   |
| 24  | Cache stampede protection                | 4      | M      | P2       | Todo   |
| 25  | Migrate date columns to timestamptz      | 4      | M      | P2       | Todo   |
| 26  | CSRF protection for cookie auth          | 4      | M      | P2       | Todo   |
| 27  | Disable Swagger in production            | 3      | S      | P2       | Done   |
| 28  | Consistent validator decorators          | 3      | S      | P2       | Done   |
| 29  | Add database CHECK constraints           | 3      | S      | P2       | Done   |
| 30  | Fix NULLS NOT DISTINCT on unique index   | 3      | S      | P2       | Done   |
| 31  | Decimal arithmetic for money             | 4      | M      | P2       | Todo   |
| 32  | HTTP response compression                | 2      | S      | P3       | Done   |
| 33  | Add statement_timeout                    | 3      | S      | P3       | Done   |
| 34  | Sort params on all collections           | 2      | M      | P3       | Todo   |
| 35  | Table partitioning for transactions      | 3      | XL     | P3       | Todo   |

---

## Positive Findings (Keep Doing)

The audit also identified strong practices worth preserving:

- **Refresh tokens are hashed** (HMAC-SHA256) before storage -- raw token never persisted
- **Parameterized queries throughout** -- Drizzle ORM prevents SQL injection by design
- **Bcrypt with 12 rounds** for passwords
- **Sensitive data redaction in Pino logs** -- authorization headers, cookies, passwords, tokens
- **Validation pipe with whitelist + forbidNonWhitelisted** -- prevents mass assignment
- **UUID validation on all path parameters** via `ParseUUIDPipe`
- **Cookie security** with httpOnly, secure, sameSite all configurable
- **Refresh token rotation** -- tokens consumed on use, preventing replay
- **Resource ownership checks** -- all user-facing controllers filter by JWT userId (no IDOR)
- **Role hierarchy** with proper RBAC in `RolesGuard`
- **RFC 7807 Problem Details** compliant error responses
- **Audit logging** of all mutations via global interceptor
- **Zod environment validation** on startup
- **Clean module structure** with consistent controller/service/repository layering
