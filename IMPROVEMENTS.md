# Tracker Backend API - Audit

> **Impact:** Critical > High > Medium > Low — severity if the issue reaches production.
> **Effort:** Low (< 1h) · Medium (1-4h) · High (4h+) — estimated implementation time.

---

## Active Findings

| #   | Priority | Finding                    | Effort | Impact | Agent(s)     | Status |
| --- | -------- | -------------------------- | ------ | ------ | ------------ | ------ |
| 15  | P1       | No API versioning strategy | Medium | High   | api-designer | Todo   |

---

## Active Findings (Detailed)

### P1 -- High

#### 15. No API Versioning Strategy

**Effort:** Medium | **Impact:** High | **Reported by:** api-designer

No URI versioning, no header versioning, no `enableVersioning()` call. Any breaking change will affect all clients with no migration path.

**Fix:** Add `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` in `src/main.ts`.

---

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
| 32   | Export loads 10K rows + JSON.stringify into memory            | Medium   | Medium | P2       | Done   |
| 50   | No `Link` header emitted for paginated responses              | Medium   | Medium | P2       | Done   |
| 56   | Sequential cache invalidation loops in scheduled tasks        | Medium   | Low    | P2       | Done   |
| 57   | `select()` wildcard fetches sensitive/unused columns          | Medium   | Low    | P2       | Done   |
| 58   | Missing controller return type annotations                    | Medium   | Medium | P2       | Done   |
| 59   | Header type casts drop array case                             | Medium   | Low    | P2       | Done   |
| 61   | Guards barrel re-export violates project convention           | Medium   | Low    | P2       | Done   |
