## Context

The API already has a fully configured Redis-backed cache module (`CacheModule`, `CacheService`, `CachePort`) with `get`, `set`, `del`, `reset`, and `wrap` operations. Redis runs alongside PostgreSQL in docker-compose. The default TTL is 1 hour (`REDIS_TTL=3600`).

Currently, no service layer uses the cache. Every GET request hits PostgreSQL directly. The three main read-heavy modules are:

- **Transactions** — list (paginated + filtered) and detail lookups, scoped per user
- **Transaction Categories** — list and detail lookups, scoped per user
- **Users** — list (admin), summary (admin), and detail lookups

## Goals / Non-Goals

**Goals:**

- Cache GET endpoint results at the service layer using the existing `CacheService`
- Invalidate cache entries automatically when data changes (create/update/delete)
- Use user-scoped cache keys to prevent data leakage between users
- Keep the caching logic simple and contained within each service

**Non-Goals:**

- HTTP-level caching (ETag, Cache-Control headers) — can be added later
- Cache warming or preloading strategies
- Distributed cache invalidation across multiple API instances (single-instance assumption for now)
- Caching auth/session-related endpoints

## Decisions

### 1. Cache at the service layer, not repository or controller

**Choice**: Inject `CacheService` into each module's service and wrap read methods.

**Alternatives considered**:

- **Repository layer**: Too low-level — cache keys wouldn't reflect business context (e.g., pagination params). Also makes invalidation harder since repositories don't know about cross-entity relationships.
- **Controller/interceptor layer**: Caches serialized HTTP responses, which couples caching to response shape. Harder to invalidate selectively.

**Rationale**: The service layer has full context of what's being queried and when data changes, making it the natural place for cache-through logic.

### 2. User-scoped cache key convention

**Choice**: Keys follow the pattern `{module}:{userId}:{operation}:{params-hash}`.

Examples:

- `transactions:{userId}:list:{hash-of-query-params}`
- `transactions:{userId}:detail:{transactionId}`
- `categories:{userId}:list:{hash-of-query-params}`

**Rationale**: User-scoping prevents cross-user data leaks. Including the operation and params ensures distinct cache entries for different queries.

### 3. Prefix-based invalidation using key patterns

**Choice**: On write operations (create/update/delete), invalidate all cache entries for that user+module by deleting keys matching the prefix `{module}:{userId}:*`.

**Rationale**: Granular invalidation (figuring out exactly which list queries are affected by a new transaction) is complex and error-prone. Prefix-based invalidation is simple, correct, and acceptable given the 1-hour TTL already limits stale data.

**Implementation**: Add a `delByPrefix(prefix: string)` method to `CacheService` using Redis `SCAN` + `DEL` (not `KEYS` to avoid blocking).

### 4. Use existing TTL configuration

**Choice**: Reuse the global `REDIS_TTL` (default 3600s) for all cached responses. No per-module TTL for now.

**Rationale**: Simplicity. Per-module TTLs can be added later if profiling shows different access patterns warrant it.

## Risks / Trade-offs

- **Stale data on concurrent writes** → Acceptable: prefix invalidation clears aggressively, and TTL provides an upper bound. Users see their own writes immediately since invalidation runs in the same request.
- **Redis memory growth** → Mitigated by TTL expiration. Each user's cached data is small (JSON responses). Monitor Redis memory usage.
- **SCAN performance for prefix deletion** → Low risk: user-scoped prefixes keep the keyspace small per invalidation. SCAN is non-blocking unlike KEYS.
- **Cache thundering herd** → Not addressed now. The `wrap` method doesn't lock, so concurrent cache misses could trigger parallel DB queries. Acceptable at current scale.
