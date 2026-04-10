# Tracker Backend API - Audit

---

## Completed Fixes (History)

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
| 18  | Consolidate 3 Redis connections (3→2)    | 4      | M      | P1       | Done   |
| 19  | Domain events for cache invalidation     | 4      | L      | P2       | Done   |
| 20  | Extract pagination helper                | 3      | S      | P2       | Done   |
| 21  | Remove/complete TransformInterceptor     | 3      | S      | P2       | Done   |
| 23  | Async CSV parsing                        | 4      | M      | P2       | Done   |
| 24  | Cache stampede protection                | 4      | M      | P2       | Done   |
| 25  | Migrate date columns to timestamptz      | 4      | M      | P2       | Done   |
| 26  | CSRF protection for cookie auth          | 4      | M      | P2       | Done   |
| 27  | Disable Swagger in production            | 3      | S      | P2       | Done   |
| 28  | Consistent validator decorators          | 3      | S      | P2       | Done   |
| 29  | Add database CHECK constraints           | 3      | S      | P2       | Done   |
| 30  | Fix NULLS NOT DISTINCT on unique index   | 3      | S      | P2       | Done   |
| 31  | Decimal arithmetic for money             | 4      | M      | P2       | Done   |
| 32  | HTTP response compression                | 2      | S      | P3       | Done   |
| 33  | Add statement_timeout                    | 3      | S      | P3       | Done   |
| 34  | Sort params on all collections           | 2      | M      | P3       | Done   |

---

## Active Findings

| #   | Priority | Finding                                                               | Effort | Impact   | Agent(s)                                                | Status  |
| --- | -------- | --------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------- | ------- |
| 2   | P0       | No PostgreSQL config in Docker Compose                                | Low    | Critical | postgres-pro                                            | Done    |
| 4   | P1       | CSRF token missing from CORS allowedHeaders                           | Low    | High     | security-auditor, api-designer                          | Done    |
| 5   | P1       | Missing CsrfGuard on revoke-refresh-token endpoint                    | Low    | High     | security-auditor                                        | Done    |
| 6   | P1       | CSRF token comparison not timing-safe                                 | Low    | High     | security-auditor, architect-reviewer                    | Done    |
| 7   | P1       | AuthService directly accesses UserRepository (layer violation)        | Medium | High     | architect-reviewer, nestjs-expert                       | Todo    |
| 8   | P1       | ProfileService directly accesses UserRepository (layer violation)     | Medium | High     | architect-reviewer                                      | Todo    |
| 9   | P1       | Soft-delete unique constraint blocks category recreation              | Medium | High     | postgres-pro                                            | Todo    |
| 11  | P1       | Timestamps missing `withTimezone` across most tables                  | Medium | High     | database-optimizer, postgres-pro                        | Todo    |
| 12  | P1       | Missing index on `emailVerificationToken` (full table scan)           | Low    | High     | database-optimizer                                      | Done    |
| 13  | P1       | Double-query pattern on create/update (transactions, recurring)       | Medium | High     | database-optimizer, performance-engineer                | Todo    |
| 14  | P1       | Sequential processing in `processAllRecurringTransactions`            | Medium | High     | performance-engineer, architect-reviewer                | Todo    |
| 15  | P1       | No API versioning strategy                                            | Medium | High     | api-designer                                            | Todo    |
| 16  | P1       | Throttler auth bypass returns `true` instead of falling through       | Low    | High     | api-designer                                            | Done    |
| 17  | P1       | `CountryCode`/`CurrencyCode` as PG enums (250+150 values)             | High   | High     | database-optimizer, postgres-pro                        | Todo    |
| 18b | P1       | Remaining two Redis connections (ioredis vs node-redis mismatch)      | High   | High     | performance-engineer                                    | Todo    |
| 19  | P1       | `findByParentCategory` has no LIMIT (unbounded result set)            | Low    | High     | performance-engineer, database-optimizer                | Done    |
| 20  | P1       | Docker PG port exposed on all interfaces                              | Low    | High     | postgres-pro                                            | Done    |
| 21  | P1       | Docker default password `tracker123` in plaintext                     | Low    | High     | postgres-pro, security-auditor                          | Done    |
| 22  | P1       | Missing partial indexes for `deletedAt IS NULL` queries               | Medium | High     | postgres-pro, database-optimizer                        | Todo    |
| 23  | P1       | `ilike` search on `description` with no trigram/FTS index             | Medium | High     | postgres-pro, performance-engineer                      | Todo    |
| 25  | P1       | `AllExceptionsFilter` uses `@Optional()` for required deps            | Low    | High     | nestjs-expert                                           | Done    |
| 27  | P1       | Widespread `result[0] as T` casts bypassing type safety               | Medium | High     | typescript-pro                                          | Todo    |
| 28  | P2       | Duplicated category validation logic across 3 services                | Medium | Medium   | architect-reviewer                                      | Todo    |
| 29  | P2       | `CachePort` abstraction exists but is dead code                       | Low    | Medium   | architect-reviewer                                      | Todo    |
| 30  | P2       | ILIKE wildcard not escaped in `UserRepository.findAll`                | Low    | Medium   | architect-reviewer, security-auditor                    | Todo    |
| 31  | P2       | `delByPrefix` uses SCAN + sequential DEL (O(N) Redis)                 | Medium | Medium   | architect-reviewer, performance-engineer                | Todo    |
| 32  | P2       | Export loads 10K rows + JSON.stringify into memory                    | Medium | Medium   | architect-reviewer, performance-engineer                | Todo    |
| 33  | P2       | Excessive constructor params (AuthService has 8)                      | High   | Medium   | architect-reviewer                                      | Todo    |
| 34  | P2       | `loginStatusEnum` in wrong file + lowercase values                    | Low    | Medium   | database-optimizer, postgres-pro                        | Todo    |
| 35  | P2       | Analytics `::date` cast ignores user timezone                         | Medium | Medium   | database-optimizer                                      | Todo    |
| 36  | P2       | `sql.raw` used for granularity string in `getTrends`                  | Low    | Medium   | database-optimizer                                      | Todo    |
| 37  | P2       | Redundant plain index on `RefreshToken.token`                         | Low    | Medium   | database-optimizer                                      | Todo    |
| 38  | P2       | Missing composite index `(status, nextOccurrenceDate)` for scheduler  | Low    | Medium   | postgres-pro                                            | Todo    |
| 39  | P2       | Missing `(actorId, createdAt)` composite on AuditLog/LoginLog         | Low    | Medium   | postgres-pro                                            | Todo    |
| 40  | P2       | `updatedAt` only updated by ORM, not DB trigger                       | Medium | Medium   | postgres-pro                                            | Todo    |
| 41  | P2       | `RecurringTransaction` missing `endDate > startDate` check            | Low    | Medium   | postgres-pro                                            | Todo    |
| 42  | P2       | Duplicate FK on `Transaction.categoryId` (inline + composite)         | Low    | Medium   | postgres-pro                                            | Todo    |
| 43  | P2       | `enableImplicitConversion: true` in ValidationPipe                    | Medium | Medium   | security-auditor, nestjs-expert                         | Todo    |
| 44  | P2       | JWT algorithm not explicitly specified                                | Low    | Medium   | security-auditor                                        | Todo    |
| 45  | P2       | Token blacklist fail-open design (no monitoring)                      | Medium | Medium   | security-auditor                                        | Todo    |
| 46  | P2       | Social auth code exchange race condition (TOCTOU)                     | Medium | Medium   | security-auditor                                        | Todo    |
| 47  | P2       | Unvalidated `token` query param on email verification                 | Low    | Medium   | security-auditor                                        | Todo    |
| 49  | P2       | `UpdateProfileDto` exposes `onboardingCompleted` as user-settable     | Low    | Medium   | api-designer                                            | Todo    |
| 50  | P2       | No `Link` header emitted for paginated responses                      | Medium | Medium   | api-designer                                            | Todo    |
| 51  | P2       | Pagination defaults duplicated at controller and DTO layers           | Low    | Medium   | api-designer                                            | Todo    |
| 52  | P2       | `TimeoutInterceptor` instantiated with `new` bypassing DI             | Low    | Medium   | nestjs-expert                                           | Todo    |
| 53  | P2       | Social callback swallows all errors including programming errors      | Medium | Medium   | nestjs-expert                                           | Todo    |
| 54  | P2       | Health indicators don't extend `HealthIndicator` from Terminus        | Medium | Medium   | nestjs-expert                                           | Todo    |
| 55  | P2       | Redis roundtrip on every authenticated request (blacklist check)      | Medium | Medium   | performance-engineer                                    | Todo    |
| 56  | P2       | Sequential cache invalidation loops in scheduled tasks                | Low    | Medium   | performance-engineer                                    | Todo    |
| 57  | P2       | `select()` wildcard fetches sensitive/unused columns                  | Low    | Medium   | performance-engineer                                    | Todo    |
| 58  | P2       | Missing controller return type annotations                            | Medium | Medium   | typescript-pro                                          | Todo    |
| 59  | P2       | Header type casts (`x-forwarded-for`, `x-csrf-token`, `x-request-id`) | Low    | Medium   | typescript-pro                                          | Partial |
| 60  | P2       | `sameSite` stored as `string` losing literal union type               | Low    | Medium   | typescript-pro                                          | Done    |
| 61  | P2       | Guards barrel re-export violates project convention                   | Low    | Medium   | typescript-pro, architect-reviewer                      | Todo    |
| 62  | P3       | `RequestContextInterceptor` noop `tap()` operator                     | Low    | Low      | architect-reviewer, nestjs-expert, performance-engineer | Todo    |
| 63  | P3       | `console.error` in database provider instead of Logger                | Low    | Low      | nestjs-expert                                           | Todo    |
| 64  | P3       | Login endpoint leaks social auth account type                         | Low    | Low      | security-auditor                                        | Todo    |

---

## Active Findings (Detailed)

### P0 -- Critical

#### 2. No PostgreSQL Configuration in Docker Compose

**Effort:** Low | **Impact:** Critical | **Reported by:** postgres-pro

Docker Compose launches PostgreSQL with zero configuration. Default PG 15 settings (`shared_buffers=128MB`, `max_connections=100`, `work_mem=4MB`) are designed for a 256MB VM. No healthcheck is defined, so NestJS may attempt to connect before PG is ready.

**Fix:** Add `command` section with tuned parameters and a `healthcheck` using `pg_isready`.

**File:** `docker/docker-compose.yml`

---

### P1 -- High

#### 4. CSRF Token Missing from CORS `allowedHeaders`

**Effort:** Low | **Impact:** High | **Reported by:** security-auditor, api-designer

The `CsrfGuard` reads `x-csrf-token` from request headers, but CORS `allowedHeaders` only lists `Content-Type`, `Authorization`, `Accept`, `X-Request-Id`. When `COOKIE_SAME_SITE=none`, the browser will block the custom header in preflight checks, making CSRF protection non-functional in the exact scenario where it's needed.

**Fix:** Add `'X-CSRF-Token'` to `allowedHeaders` in `src/app/config/cors.config.ts:4`.

---

#### 5. Missing CsrfGuard on `revoke-refresh-token` Endpoint

**Effort:** Low | **Impact:** High | **Reported by:** security-auditor

`POST /revoke-refresh-token` uses `JwtAuthGuard` but does not apply `CsrfGuard`, unlike all other state-changing auth endpoints (logout, revoke-all, refresh-token).

**Fix:** Add `CsrfGuard` to `@UseGuards()` at `src/modules/auth/auth.controller.ts:182`.

---

#### 6. CSRF Token Comparison Not Timing-Safe

**Effort:** Low | **Impact:** High | **Reported by:** security-auditor, architect-reviewer

The CSRF guard uses `headerToken !== cookieToken` (strict equality), susceptible to timing side-channel attacks. The OAuth state validation correctly uses `crypto.timingSafeEqual` -- apply the same pattern.

**Fix:** Use `crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))` in `src/shared/guards/csrf.guard.ts:27`.

---

#### 7. AuthService Directly Accesses UserRepository (Layer Violation)

**Effort:** Medium | **Impact:** High | **Reported by:** architect-reviewer, nestjs-expert

`AuthService` depends on both `UserService` and `UserRepository`. It calls `userRepository.setEmailVerificationToken()` and `userRepository.verifyEmail()` directly, violating the layered architecture rule.

**Fix:** Add these methods to `UserService` and remove `UserRepository` from `AuthService` constructor. Stop exporting `UserRepository` from `UserModule`.

**Files:** `src/modules/auth/auth.service.ts:20`, `src/modules/user/user.module.ts:10`

---

#### 8. ProfileService Directly Accesses UserRepository (Layer Violation)

**Effort:** Medium | **Impact:** High | **Reported by:** architect-reviewer

Same pattern as #7. `ProfileService` imports `UserRepository` directly for `findProfileById`, `updateProfile`, `findWithPasswordHash`, `updatePasswordHash`, `softDelete`.

**Fix:** Move profile-related methods behind `UserService`, or merge profile module into user module.

**File:** `src/modules/profile/profile.service.ts:10-11`

---

#### 9. Soft-Delete Unique Constraint Blocks Category Recreation

**Effort:** Medium | **Impact:** High | **Reported by:** postgres-pro

The unique constraint on `TransactionCategory(userId, name, type, parentCategoryId)` applies to ALL rows including soft-deleted ones. If a user deletes a category and recreates it with the same name, the INSERT fails.

**Fix:** Replace with a partial unique index `WHERE "deletedAt" IS NULL`. Same fix needed for `DefaultTransactionCategory`.

**Files:** `src/database/schemas/transaction-categories.ts:37-39`, `src/database/schemas/default-transaction-categories.ts:32-34`

---

#### 11. Timestamps Missing `withTimezone` Across Most Tables

**Effort:** Medium | **Impact:** High | **Reported by:** database-optimizer, postgres-pro

Business-domain timestamps (`Transaction.date`, `Budget.startDate/endDate`) correctly use `withTimezone: true`. However, all system/audit timestamps (`createdAt`, `updatedAt`, `deletedAt`, `expiresAt`) across every other table do not. Most dangerous case: `RefreshToken.expiresAt` without timezone -- token expiry comparisons using `new Date()` are ambiguous.

**Fix:** Add `withTimezone: true` to all timestamp columns and generate a migration. This is non-destructive if the server runs UTC.

**Files:** All `src/database/schemas/*.ts` files

---

#### 12. Missing Index on `emailVerificationToken`

**Effort:** Low | **Impact:** High | **Reported by:** database-optimizer

Every email verification request causes a full table scan. No index exists on this column.

**Fix:** Add a sparse partial index: `CREATE INDEX ON "User" ("emailVerificationToken") WHERE "emailVerificationToken" IS NOT NULL`.

**File:** `src/database/schemas/users.ts`

---

#### 13. Double-Query Pattern on Create/Update

**Effort:** Medium | **Impact:** High | **Reported by:** database-optimizer, performance-engineer

`TransactionRepository` and `RecurringTransactionsRepository` execute `INSERT ... RETURNING { id }` then immediately fire a second `SELECT` with JOINs. Every create/update costs an extra DB round-trip.

**Fix:** Use `RETURNING *` or a CTE to fetch all needed columns in one query.

**Files:** `src/modules/transactions/transactions.repository.ts:255-276,278-324`, `src/modules/recurring-transactions/recurring-transactions.repository.ts:206-234,236-292`

---

#### 14. Sequential Processing in `processAllRecurringTransactions`

**Effort:** Medium | **Impact:** High | **Reported by:** performance-engineer, architect-reviewer

The outer loop processes each recurring transaction sequentially. The inner `while` loop creates transactions one at a time. A daily recurring paused for 3 months = 90 sequential INSERTs per record.

**Fix:** Batch-insert within each record. Process records with `Promise.allSettled` + concurrency limit.

**File:** `src/modules/recurring-transactions/recurring-transactions.service.ts:335-413`

---

#### 15. No API Versioning Strategy

**Effort:** Medium | **Impact:** High | **Reported by:** api-designer

No URI versioning, no header versioning, no `enableVersioning()` call. Any breaking change will affect all clients with no migration path.

**Fix:** Add `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` in `src/main.ts`.

---

#### 16. Throttler Auth Bypass Returns `true` Instead of Falling Through

**Effort:** Low | **Impact:** High | **Reported by:** api-designer

When the `auth` throttler finds no route-level override, `handleRequest` returns `true` unconditionally, bypassing the `default` throttler too. New auth endpoints without `@Throttle({ auth: {} })` silently skip all rate limiting.

**Fix:** Call `super.handleRequest(requestProps)` instead of `return true` in `src/app/throttler/app-throttler.guard.ts:18`.

---

#### 17. `CountryCode`/`CurrencyCode` as PG Enums (250+150 values)

**Effort:** High | **Impact:** High | **Reported by:** database-optimizer, postgres-pro

PostgreSQL `ALTER TYPE ... ADD VALUE` is non-transactional and cannot be rolled back. With 250 country codes and 150 currency codes, every ISO update requires a risky DDL migration.

**Fix:** Convert to `varchar(3)` with application-layer validation. One-time significant migration.

**File:** `src/database/schemas/enums.ts:9-442`

---

#### 18b. Remaining Two Redis Connections (ioredis vs node-redis Library Mismatch)

**Effort:** High | **Impact:** High | **Reported by:** performance-engineer

> **Note:** Prior fix #18 consolidated from 3 connections to 2 by removing the throttler's separate Redis instance. The remaining 2 connections cannot be shared because `@keyv/redis` v5 uses `node-redis` internally while `redisClientProvider` uses `ioredis` — they are incompatible client libraries.

`NestCacheModule.registerAsync` creates a `KeyvRedis` (node-redis) connection, and `redisClientProvider` creates an `ioredis` connection to the same URL.

**Fix:** Migrate one client library to match the other (replace `@keyv/redis` with an ioredis-compatible cache adapter, or replace direct `ioredis` usage with `node-redis`).

**Files:** `src/modules/cache/cache.module.ts`, `src/modules/cache/redis.provider.ts`

---

#### 19. `findByParentCategory` Has No LIMIT

**Effort:** Low | **Impact:** High | **Reported by:** performance-engineer, database-optimizer

Returns all transactions for a category with `ORDER BY date DESC` but no `LIMIT`. Can produce multi-megabyte responses.

**Fix:** Add pagination or an explicit row cap.

**File:** `src/modules/transactions/transactions.repository.ts:376-392`

---

#### 20. Docker PG Port Exposed on All Interfaces

**Effort:** Low | **Impact:** High | **Reported by:** postgres-pro

`ports: - '5432:5432'` binds to `0.0.0.0`, making PostgreSQL reachable from any network interface.

**Fix:** Change to `'127.0.0.1:5432:5432'` in `docker/docker-compose.yml:10`.

---

#### 21. Docker Default Password in Plaintext

**Effort:** Low | **Impact:** High | **Reported by:** postgres-pro, security-auditor

`POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-tracker123}` -- weak fallback committed to source. Redis has no `--requirepass` at all.

**Fix:** Remove fallback defaults, add `.env.example` with placeholder values, add `--requirepass` to Redis.

**File:** `docker/docker-compose.yml:8`

---

#### 22. Missing Partial Indexes for `deletedAt IS NULL` Queries

**Effort:** Medium | **Impact:** High | **Reported by:** postgres-pro, database-optimizer

7+ repository methods filter `WHERE deletedAt IS NULL` on `User` and `TransactionCategory` tables with no supporting partial index.

**Fix:** Add partial indexes: `CREATE INDEX ON "User" ("id") WHERE "deletedAt" IS NULL` and similar for `TransactionCategory`.

**Files:** `src/database/schemas/users.ts`, `src/database/schemas/transaction-categories.ts`

---

#### 23. `ilike` Search on `description` Without Trigram Index

**Effort:** Medium | **Impact:** High | **Reported by:** postgres-pro, performance-engineer

`ilike(transactions.description, '%term%')` forces a full sequential scan. No GIN trigram index exists.

**Fix:** Add `pg_trgm` extension and a GIN trigram index on `Transaction.description`.

**File:** `src/modules/transactions/transactions.repository.ts:139-142`

---

#### 25. `AllExceptionsFilter` Uses `@Optional()` for Required Dependencies

**Effort:** Low | **Impact:** High | **Reported by:** nestjs-expert

All three constructor dependencies (`ClsService`, `ProblemDetailsFilter`, `ConfigService`) are always present, but `@Optional()` masks misconfiguration and forces `?.` null guards everywhere.

**Fix:** Remove `@Optional()` decorators at `src/app/filters/all-exceptions.filter.ts:16-22`.

---

#### 27. Widespread `result[0] as T` Casts Bypassing Type Safety

**Effort:** Medium | **Impact:** High | **Reported by:** typescript-pro

14+ occurrences across repositories cast `result[0]` to suppress `T | undefined` from `noUncheckedIndexedAccess`. The cast hides potential undefined access.

**Fix:** Use destructuring: `const [row] = result; if (!row) return null;`

**Files:** Multiple repository files (user, auth, budgets, transaction-categories, recurring-transactions)

---

### P2 -- Medium

#### 28. Duplicated Category Validation Logic Across 3 Services

**Effort:** Medium | **Impact:** Medium | **Reported by:** architect-reviewer

Identical `validateCategory` methods in `TransactionsService`, `RecurringTransactionsService`, and `BudgetsService`.

**Fix:** Extract into `TransactionCategoryService.validateCategoryForTransaction()`.

**Files:** `transactions.service.ts:310-332`, `recurring-transactions.service.ts:472-494`, `budgets.service.ts:293-306`

---

#### 29. `CachePort` Abstraction Is Dead Code

**Effort:** Low | **Impact:** Medium | **Reported by:** architect-reviewer

`CachePort` interface and `CACHE_PORT` injection token exist but no service uses them. Every service imports `CacheService` directly.

**Fix:** Either adopt the port pattern consistently or remove the dead code.

**File:** `src/modules/cache/cache.port.ts`

---

#### 30. ILIKE Wildcards Not Escaped in `UserRepository.findAll`

**Effort:** Low | **Impact:** Medium | **Reported by:** architect-reviewer, security-auditor

`search` param passed directly into `ilike()` without escaping `%` and `_`. The `TransactionRepository` correctly escapes these.

**Fix:** Apply the same `replace(/[\\%_]/g, '\\$&')` pattern.

**File:** `src/modules/user/user.repository.ts:101-103`

---

#### 31. `delByPrefix` Uses SCAN + Sequential DEL

**Effort:** Medium | **Impact:** Medium | **Reported by:** architect-reviewer, performance-engineer

Called on every mutation. `SCAN` iterates all keys; `DEL` runs per batch. Gets slower as key count grows.

**Fix:** Use `redis.unlink`, pipeline batches, and/or use Redis hash structures for grouping.

**File:** `src/modules/cache/cache.service.ts:35-53`

---

#### 32. Export Loads 10K Rows + `JSON.stringify` Into Memory

**Effort:** Medium | **Impact:** Medium | **Reported by:** architect-reviewer, performance-engineer

`findAllForExport` loads up to 10,000 rows. JSON export uses `JSON.stringify(exportRows, null, 2)` (pretty-printed, adding 20-30% overhead).

**Fix:** Use streaming JSON serializer; remove pretty-printing for file downloads.

**Files:** `src/modules/transactions/transactions.repository.ts:96`, `src/modules/transactions/transactions.service.ts:267`

---

#### 33. Excessive Constructor Parameters (AuthService: 8 deps)

**Effort:** High | **Impact:** Medium | **Reported by:** architect-reviewer

`AuthService` has 8 constructor parameters, suggesting too many responsibilities.

**Fix:** Split into `AuthenticationService`, `TokenService`, and `SessionService`.

**File:** `src/modules/auth/auth.service.ts:49`

---

#### 34. `loginStatusEnum` in Wrong File + Lowercase Values

**Effort:** Low | **Impact:** Medium | **Reported by:** database-optimizer, postgres-pro

Defined in `login-logs.ts` instead of `enums.ts`. Uses lowercase (`'success'`, `'failed'`) while all others use UPPER_CASE.

**Fix:** Move to `enums.ts`, change to `['SUCCESS', 'FAILED']` with migration.

**File:** `src/database/schemas/login-logs.ts:6`

---

#### 35. Analytics `::date` Cast Ignores User Timezone

**Effort:** Medium | **Impact:** Medium | **Reported by:** database-optimizer

`transactions.date::date` uses the server's timezone setting, not the user's. Daily totals are wrong for non-UTC users.

**Fix:** Thread user timezone through queries: `(date AT TIME ZONE $tz)::date`.

**File:** `src/modules/transactions-analytics/transactions-analytics.repository.ts:187,119`

---

#### 36. `sql.raw` Used for Granularity String

**Effort:** Low | **Impact:** Medium | **Reported by:** database-optimizer

Bypasses Drizzle's parameterization. Currently safe (validated enum) but fragile for future refactoring.

**Fix:** Use a const map or bound parameter.

**File:** `src/modules/transactions-analytics/transactions-analytics.repository.ts:119`

---

#### 37. Redundant Plain Index on `RefreshToken.token`

**Effort:** Low | **Impact:** Medium | **Reported by:** database-optimizer

The `.unique()` constraint already creates a btree index. Migration 0000 creates a second plain index -- pure write overhead.

**Fix:** Drop the redundant index in a new migration.

**File:** `src/database/schemas/refresh-tokens.ts:13`

---

#### 38. Missing Composite Index for Scheduler Query

**Effort:** Low | **Impact:** Medium | **Reported by:** postgres-pro

`findDueRecurringTransactions` filters `status = 'ACTIVE' AND nextOccurrenceDate <= today` with no composite index.

**Fix:** Add `(status, nextOccurrenceDate)` partial index where `status = 'ACTIVE'`.

**File:** `src/database/schemas/recurring-transactions.ts`

---

#### 39. Missing `(actorId, createdAt)` Composite on AuditLog/LoginLog

**Effort:** Low | **Impact:** Medium | **Reported by:** postgres-pro

Audit queries filter by `actorId` and sort by `createdAt` but have only separate single-column indexes.

**Fix:** Add composite `(actorId, createdAt DESC)` index.

**Files:** `src/database/schemas/audit-logs.ts`, `src/database/schemas/login-logs.ts`

---

#### 40. `updatedAt` Only Updated by ORM, Not DB Trigger

**Effort:** Medium | **Impact:** Medium | **Reported by:** postgres-pro

`.$onUpdate(() => new Date())` fires only via Drizzle. Direct SQL, migrations, or bulk ops bypass it.

**Fix:** Add `BEFORE UPDATE` triggers on `Transaction` and `Budget` tables.

**Files:** All schema files with `updatedAt`

---

#### 41. `RecurringTransaction` Missing `endDate > startDate` Check

**Effort:** Low | **Impact:** Medium | **Reported by:** postgres-pro

`Budget` has this check but `RecurringTransaction` does not. An `endDate` before `startDate` silently results in a record that never fires.

**File:** `src/database/schemas/recurring-transactions.ts`

---

#### 42. Duplicate FK on `Transaction.categoryId`

**Effort:** Low | **Impact:** Medium | **Reported by:** postgres-pro

Inline `.references()` generates one FK; composite FK at lines 54-58 generates another. Two FKs on the same column = double validation overhead.

**Fix:** Remove the inline `.references()`.

**File:** `src/database/schemas/transactions.ts:25`

---

#### 43. `enableImplicitConversion: true` in ValidationPipe

**Effort:** Medium | **Impact:** Medium | **Reported by:** security-auditor, nestjs-expert

Can silently coerce types (`"true"` -> `true`, `"1"` -> `1`), potentially bypassing validation.

**Fix:** Set to `false`, use explicit `@Type()` decorators where needed.

**File:** `src/app/config/validation.config.ts:9`

---

#### 44. JWT Algorithm Not Explicitly Specified

**Effort:** Low | **Impact:** Medium | **Reported by:** security-auditor

JWT config relies on library default HS256. Explicitly set `algorithm: 'HS256'` to prevent algorithm confusion.

**File:** `src/modules/auth/auth.module.ts:56-63`

---

#### 45. Token Blacklist Fail-Open (No Monitoring)

**Effort:** Medium | **Impact:** Medium | **Reported by:** security-auditor

When Redis is down, revoked tokens are accepted. The fail-open design is documented but has no alerting.

**Fix:** Add monitoring/alerting for Redis failures; document as accepted risk.

**File:** `src/modules/auth/jwt.strategy.ts:46-55`

---

#### 46. Social Auth Code Exchange Race Condition (TOCTOU)

**Effort:** Medium | **Impact:** Medium | **Reported by:** security-auditor

`get()` then `del()` on social auth code is not atomic. Concurrent requests can exchange the same code twice.

**Fix:** Use Redis `GETDEL` or a Lua script for atomic get-and-delete.

**File:** `src/modules/auth/social-auth-code.service.ts:38-47`

---

#### 47. Unvalidated `token` Query Param on Email Verification

**Effort:** Low | **Impact:** Medium | **Reported by:** security-auditor

Raw string passed to DB query without format validation. Token is a UUID.

**Fix:** Add `@Query('token', ParseUUIDPipe)`.

**File:** `src/modules/auth/auth.controller.ts:223`

---

#### 49. `UpdateProfileDto` Exposes `onboardingCompleted`

**Effort:** Low | **Impact:** Medium | **Reported by:** api-designer

Any user can mark onboarding as complete via `PATCH /profile`, bypassing the onboarding flow.

**Fix:** Remove `onboardingCompleted` from `UpdateProfileDto`.

**File:** `src/modules/profile/dtos/update-profile.dto.ts:51`

---

#### 50. No `Link` Header for Paginated Responses

**Effort:** Medium | **Impact:** Medium | **Reported by:** api-designer

`Link` is listed in CORS `exposedHeaders` but never emitted. Clients must construct pagination URLs manually.

**File:** `src/app/config/cors.config.ts:6`

---

#### 51. Pagination Defaults Duplicated at Controller and DTO Layers

**Effort:** Low | **Impact:** Medium | **Reported by:** api-designer

Every controller has `page: query.page ?? 1` and `pageSize: query.pageSize ?? 20` despite DTO defaults already handling this.

**Fix:** Remove nullish coalescing from controllers; rely on DTO defaults.

**Files:** All paginated controllers

---

#### 52. `TimeoutInterceptor` Bypasses DI Container

**Effort:** Low | **Impact:** Medium | **Reported by:** nestjs-expert

Instantiated with `new TimeoutInterceptor(30_000)` instead of via DI. Hardcoded timeout not configurable.

**Fix:** Register as provider, inject timeout from `ConfigService`.

**File:** `src/main.ts:45`

---

#### 53. Social Callback Swallows All Exceptions

**Effort:** Medium | **Impact:** Medium | **Reported by:** nestjs-expert

`handleSocialCallback` catch block converts all errors (including `TypeError`, DB failures) to a redirect with `reason=unknown`.

**Fix:** Only catch known OAuth-domain exceptions; re-throw the rest.

**File:** `src/modules/auth/auth.controller.ts:352-381`

---

#### 54. Health Indicators Don't Extend `HealthIndicator`

**Effort:** Medium | **Impact:** Medium | **Reported by:** nestjs-expert

Custom `DrizzleHealthIndicator` and `RedisHealthIndicator` build result shapes manually instead of using Terminus's `getStatus()`. Returns `status: 'down'` as resolved value instead of throwing `HealthCheckError`.

**Files:** `src/app/health/drizzle.health.ts`, `src/app/health/redis.health.ts`

---

#### 55. Redis Roundtrip on Every Authenticated Request

**Effort:** Medium | **Impact:** Medium | **Reported by:** performance-engineer

Every JWT-authenticated request triggers a Redis `GET` for blacklist check.

**Fix:** Add a short-lived in-process LRU cache of recently verified non-blacklisted JTIs.

**File:** `src/modules/auth/jwt.strategy.ts:37-55`

---

#### 56. Sequential Cache Invalidation Loops

**Effort:** Low | **Impact:** Medium | **Reported by:** performance-engineer

`checkOverspendForAllBudgets` and `processAllRecurringTransactions` invalidate caches in sequential `for` loops.

**Fix:** Use `Promise.all()`.

**Files:** `src/modules/budgets/budgets.service.ts:252-258`, `src/modules/recurring-transactions/recurring-transactions.service.ts:352-354`

---

#### 57. `select()` Wildcard Fetches Sensitive Columns

**Effort:** Low | **Impact:** Medium | **Reported by:** performance-engineer

`findById` and `findAll` on `UserRepository` fetch all columns including `passwordHash`, `emailVerificationToken`.

**Fix:** Use explicit column selection.

**File:** `src/modules/user/user.repository.ts:109,130,247`

---

#### 58. Missing Controller Return Type Annotations

**Effort:** Medium | **Impact:** Medium | **Reported by:** typescript-pro

No controller action methods have explicit return type annotations. TypeScript cannot catch shape mismatches between service returns and Swagger DTOs.

**Fix:** Add return types and enable `@typescript-eslint/explicit-function-return-type`.

**Files:** All controller files

---

#### 59. Header Type Casts Drop Array Case

**Effort:** Low | **Impact:** Medium | **Reported by:** typescript-pro

`x-forwarded-for`, `x-csrf-token`, `x-request-id` are cast to `string | undefined` but the real type is `string | string[] | undefined`.

**Fix:** Handle both cases: `const raw = req.headers[...]; const val = Array.isArray(raw) ? raw[0] : raw;`

**Files:** `auth.controller.ts:113,355`, `cls.config.ts:12`, `csrf.guard.ts:24`

---

#### 60. `sameSite` Stored as `string` Losing Literal Type

**Effort:** Low | **Impact:** Medium | **Reported by:** typescript-pro

`COOKIE_SAME_SITE` is validated by Zod as `'strict' | 'lax' | 'none'` but stored as `private sameSite: string`.

**Fix:** Change type to `Env['COOKIE_SAME_SITE']`.

**Files:** `src/shared/guards/csrf.guard.ts:10`, `src/modules/auth/auth.controller.ts:59`

---

#### 61. Guards Barrel Re-export Violates Project Convention

**Effort:** Low | **Impact:** Medium | **Reported by:** typescript-pro, architect-reviewer

`src/shared/guards/index.ts` re-exports guards, violating the "no re-exports" convention. Multiple controllers import from this barrel.

**Fix:** Remove barrel, update imports to reference source files directly.

**File:** `src/shared/guards/index.ts`

---

### P3 -- Low

#### 62. `RequestContextInterceptor` Noop `tap()` Operator

**Effort:** Low | **Impact:** Low | **Reported by:** architect-reviewer, nestjs-expert, performance-engineer

`tap(() => { /* noop */ })` is unnecessary. The interceptor only sets a header before the handler runs.

**Fix:** Replace with `return next.handle();`

**File:** `src/app/interceptors/request-context.interceptor.ts:21-25`

---

#### 63. `console.error` in Database Provider Instead of Logger

**Effort:** Low | **Impact:** Low | **Reported by:** nestjs-expert

Bypasses Pino log formatting and redaction.

**Fix:** Use `new Logger('DatabaseProvider')`.

**File:** `src/database/database.provider.ts:20`

---

#### 64. Login Endpoint Leaks Social Auth Account Type

**Effort:** Low | **Impact:** Low | **Reported by:** security-auditor

Error message reveals "This account uses social login" for social-only accounts. Enables auth method enumeration.

**Fix:** Return generic "Invalid email or password" for all failure cases.

**File:** `src/modules/auth/auth.service.ts:124-137`

---

## Low Priority / Deferred

| #   | Finding                                              | Impact   | Effort | Reason                                                               |
| --- | ---------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------- |
| 1   | Add test coverage                                    | Critical | High   | Just a POC, no tests needed now                                      |
| 2   | Table partitioning for transactions                  | 3        | XL     | Just a POC, not expected to reach 10M+ rows                          |
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
