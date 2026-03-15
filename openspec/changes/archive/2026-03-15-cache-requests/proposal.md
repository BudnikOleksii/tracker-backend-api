## Why

The API has a Redis-backed cache module already wired up (`CacheService`, `CachePort`), but no endpoints use it. Read-heavy endpoints (transaction lists, category lookups, user queries) hit the database on every request, adding unnecessary latency and load. Integrating the existing cache infrastructure into read endpoints will reduce response times and database pressure.

## What Changes

- Inject `CacheService` into service layers for transactions, transaction-categories, and users modules
- Cache results of `findAll` and `findById` operations with user-scoped cache keys
- Automatically invalidate relevant cache entries on create, update, and delete operations
- Add configurable per-module TTLs using cache key prefixes and conventions

## Capabilities

### New Capabilities

- `request-caching`: Service-layer caching for read endpoints with automatic invalidation on writes

### Modified Capabilities

## Impact

- **Code**: `TransactionsService`, `TransactionCategoriesService`, `UserService` — each gains a `CacheService` dependency
- **Dependencies**: No new packages — uses existing `CacheModule` and Redis infrastructure
- **APIs**: No API contract changes; responses are identical, just faster on cache hits
- **Systems**: Increased Redis memory usage proportional to active users and cached entities
