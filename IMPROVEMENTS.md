# Tracker Backend API - Audit

---

## Active Findings

| #   | Priority | Finding                                                               | Effort | Impact | Agent(s)                                                | Status  |
| --- | -------- | --------------------------------------------------------------------- | ------ | ------ | ------------------------------------------------------- | ------- |
| 15  | P1       | No API versioning strategy                                            | Medium | High   | api-designer                                            | Todo    |
| 17  | P1       | `CountryCode`/`CurrencyCode` as PG enums (250+150 values)             | High   | High   | database-optimizer, postgres-pro                        | Todo    |
| 18b | P1       | Remaining two Redis connections (ioredis vs node-redis mismatch)      | High   | High   | performance-engineer                                    | Todo    |
| 29  | P2       | `CachePort` abstraction exists but is dead code                       | Low    | Medium | architect-reviewer                                      | Todo    |
| 31  | P2       | `delByPrefix` uses SCAN + sequential DEL (O(N) Redis)                 | Medium | Medium | architect-reviewer, performance-engineer                | Todo    |
| 32  | P2       | Export loads 10K rows + JSON.stringify into memory                    | Medium | Medium | architect-reviewer, performance-engineer                | Todo    |
| 35  | P2       | Analytics `::date` cast ignores user timezone                         | Medium | Medium | database-optimizer                                      | Todo    |
| 36  | P2       | `sql.raw` used for granularity string in `getTrends`                  | Low    | Medium | database-optimizer                                      | Todo    |
| 37  | P2       | Redundant plain index on `RefreshToken.token`                         | Low    | Medium | database-optimizer                                      | Todo    |
| 38  | P2       | Missing composite index `(status, nextOccurrenceDate)` for scheduler  | Low    | Medium | postgres-pro                                            | Todo    |
| 39  | P2       | Missing `(actorId, createdAt)` composite on AuditLog/LoginLog         | Low    | Medium | postgres-pro                                            | Todo    |
| 40  | P2       | `updatedAt` only updated by ORM, not DB trigger                       | Medium | Medium | postgres-pro                                            | Todo    |
| 41  | P2       | `RecurringTransaction` missing `endDate > startDate` check            | Low    | Medium | postgres-pro                                            | Todo    |
| 42  | P2       | Duplicate FK on `Transaction.categoryId` (inline + composite)         | Low    | Medium | postgres-pro                                            | Todo    |
| 43  | P2       | `enableImplicitConversion: true` in ValidationPipe                    | Medium | Medium | security-auditor, nestjs-expert                         | Todo    |
| 44  | P2       | JWT algorithm not explicitly specified                                | Low    | Medium | security-auditor                                        | Todo    |
| 45  | P2       | Token blacklist fail-open design (no monitoring)                      | Medium | Medium | security-auditor                                        | Todo    |
| 46  | P2       | Social auth code exchange race condition (TOCTOU)                     | Medium | Medium | security-auditor                                        | Todo    |
| 50  | P2       | No `Link` header emitted for paginated responses                      | Medium | Medium | api-designer                                            | Todo    |
| 53  | P2       | Social callback swallows all errors including programming errors      | Medium | Medium | nestjs-expert                                           | Todo    |
| 54  | P2       | Health indicators don't extend `HealthIndicator` from Terminus        | Medium | Medium | nestjs-expert                                           | Todo    |
| 55  | P2       | Redis roundtrip on every authenticated request (blacklist check)      | Medium | Medium | performance-engineer                                    | Todo    |
| 56  | P2       | Sequential cache invalidation loops in scheduled tasks                | Low    | Medium | performance-engineer                                    | Todo    |
| 57  | P2       | `select()` wildcard fetches sensitive/unused columns                  | Low    | Medium | performance-engineer                                    | Todo    |
| 58  | P2       | Missing controller return type annotations                            | Medium | Medium | typescript-pro                                          | Todo    |
| 59  | P2       | Header type casts (`x-forwarded-for`, `x-csrf-token`, `x-request-id`) | Low    | Medium | typescript-pro                                          | Partial |
| 61  | P2       | Guards barrel re-export violates project convention                   | Low    | Medium | typescript-pro, architect-reviewer                      | Todo    |
| 62  | P3       | `RequestContextInterceptor` noop `tap()` operator                     | Low    | Low    | architect-reviewer, nestjs-expert, performance-engineer | Todo    |
| 63  | P3       | `console.error` in database provider instead of Logger                | Low    | Low    | nestjs-expert                                           | Todo    |
| 64  | P3       | Login endpoint leaks social auth account type                         | Low    | Low    | security-auditor                                        | Todo    |

---

## Active Findings (Detailed)

### P1 -- High

#### 15. No API Versioning Strategy

**Effort:** Medium | **Impact:** High | **Reported by:** api-designer

No URI versioning, no header versioning, no `enableVersioning()` call. Any breaking change will affect all clients with no migration path.

**Fix:** Add `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` in `src/main.ts`.

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

### P2 -- Medium

#### 29. `CachePort` Abstraction Is Dead Code

**Effort:** Low | **Impact:** Medium | **Reported by:** architect-reviewer

`CachePort` interface and `CACHE_PORT` injection token exist but no service uses them. Every service imports `CacheService` directly.

**Fix:** Either adopt the port pattern consistently or remove the dead code.

**File:** `src/modules/cache/cache.port.ts`

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

#### 50. No `Link` Header for Paginated Responses

**Effort:** Medium | **Impact:** Medium | **Reported by:** api-designer

`Link` is listed in CORS `exposedHeaders` but never emitted. Clients must construct pagination URLs manually.

**File:** `src/app/config/cors.config.ts:6`

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

---

## Completed Fixes (History)

| #    | Finding                                                    | Impact | Effort | Priority | Status |
| ---- | ---------------------------------------------------------- | ------ | ------ | -------- | ------ |
| 1    | Add Helmet security headers                                | 5      | S      | P0       | Done   |
| 2    | Remove default JWT_SECRET                                  | 5      | S      | P0       | Done   |
| 3    | Fix CORS default to deny all                               | 5      | S      | P0       | Done   |
| 4    | Enable graceful shutdown hooks                             | 5      | S      | P0       | Done   |
| 5    | Filter soft-deleted users from login                       | 5      | S      | P0       | Done   |
| 6    | Fix login timing side-channel                              | 4      | S      | P0       | Done   |
| 7    | Fix N+1 budget overspend cron                              | 5      | M      | P1       | Done   |
| 8    | Add composite database indexes                             | 5      | S      | P1       | Done   |
| 9    | Push refresh token filters to SQL                          | 4      | S      | P1       | Done   |
| 10   | Cap export with LIMIT + streaming                          | 5      | M      | P1       | Done   |
| 11   | Replace isDescendantOf with CTE                            | 4      | S      | P1       | Done   |
| 12   | Rate limiting fail-closed on Redis down                    | 5      | M      | P1       | Done   |
| 13   | Per-endpoint throttling on expensive ops                   | 4      | S      | P1       | Done   |
| 14   | Protect /process endpoint (admin-only)                     | 4      | S      | P1       | Done   |
| 15   | Align admin password policy                                | 4      | S      | P1       | Done   |
| 16   | Fix service-to-DB architecture violation                   | 4      | M      | P1       | Done   |
| 17   | Add JWT session validation / blacklist                     | 5      | L      | P1       | Done   |
| 18   | Consolidate 3 Redis connections (3→2)                      | 4      | M      | P1       | Done   |
| 19   | Domain events for cache invalidation                       | 4      | L      | P2       | Done   |
| 20   | Extract pagination helper                                  | 3      | S      | P2       | Done   |
| 21   | Remove/complete TransformInterceptor                       | 3      | S      | P2       | Done   |
| 23   | Async CSV parsing                                          | 4      | M      | P2       | Done   |
| 24   | Cache stampede protection                                  | 4      | M      | P2       | Done   |
| 25   | Migrate date columns to timestamptz                        | 4      | M      | P2       | Done   |
| 26   | CSRF protection for cookie auth                            | 4      | M      | P2       | Done   |
| 27   | Disable Swagger in production                              | 3      | S      | P2       | Done   |
| 28   | Consistent validator decorators                            | 3      | S      | P2       | Done   |
| 29   | Add database CHECK constraints                             | 3      | S      | P2       | Done   |
| 30   | Fix NULLS NOT DISTINCT on unique index                     | 3      | S      | P2       | Done   |
| 31   | Decimal arithmetic for money                               | 4      | M      | P2       | Done   |
| 32   | HTTP response compression                                  | 2      | S      | P3       | Done   |
| 33   | Add statement_timeout                                      | 3      | S      | P3       | Done   |
| 34   | Sort params on all collections                             | 2      | M      | P3       | Done   |
| A-2  | No PostgreSQL config in Docker Compose                     | 5      | S      | P0       | Done   |
| A-4  | CSRF token missing from CORS allowedHeaders                | 4      | S      | P1       | Done   |
| A-5  | Missing CsrfGuard on revoke-refresh-token                  | 4      | S      | P1       | Done   |
| A-6  | CSRF token comparison not timing-safe                      | 4      | S      | P1       | Done   |
| A-12 | Missing index on emailVerificationToken                    | 4      | S      | P1       | Done   |
| A-16 | Throttler auth bypass returns true                         | 4      | S      | P1       | Done   |
| A-19 | findByParentCategory has no LIMIT                          | 4      | S      | P1       | Done   |
| A-20 | Docker PG port exposed on all interfaces                   | 4      | S      | P1       | Done   |
| A-21 | Docker default password in plaintext                       | 4      | S      | P1       | Done   |
| A-25 | AllExceptionsFilter uses @Optional()                       | 4      | S      | P1       | Done   |
| A-60 | sameSite stored as string losing type                      | 3      | S      | P2       | Done   |
| A-7  | AuthService layer violation (UserRepository)               | 4      | M      | P1       | Done   |
| A-8  | ProfileService layer violation (UserRepository)            | 4      | M      | P1       | Done   |
| A-33 | Excessive constructor params (AuthService)                 | 3      | M      | P2       | Done   |
| 27   | Replace `result[0] as T` casts with destructuring          | High   | M      | P1       | Done   |
| 28   | Extract duplicated category validation                     | Medium | M      | P2       | Done   |
| 34   | Move `loginStatusEnum` to enums.ts + UPPER_CASE            | Medium | S      | P2       | Done   |
| 47   | Add ParseUUIDPipe to email verification token              | Medium | S      | P2       | Done   |
| 49   | Remove `onboardingCompleted` from UpdateProfileDto         | Medium | S      | P2       | Done   |
| 51   | Remove redundant pagination defaults from controllers      | Medium | S      | P2       | Done   |
| 52   | Register TimeoutInterceptor via DI                         | Medium | S      | P2       | Done   |
| 9    | Soft-delete unique constraint blocks category recreation   | High   | M      | P1       | Done   |
| 11   | Timestamps missing `withTimezone` across most tables       | High   | M      | P1       | Done   |
| 13   | Double-query pattern on create/update                      | High   | M      | P1       | Done   |
| 14   | Sequential processing in `processAllRecurringTransactions` | High   | M      | P1       | Done   |
| 22   | Missing partial indexes for `deletedAt IS NULL`            | High   | M      | P1       | Done   |
| 23   | `ilike` search on `description` with no trigram index      | High   | M      | P1       | Done   |
| 30   | ILIKE wildcards not escaped in `UserRepository.findAll`    | Medium | S      | P2       | Done   |
