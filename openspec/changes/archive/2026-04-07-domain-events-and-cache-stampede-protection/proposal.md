## Why

`TransactionsService` and `RecurringTransactionsService` directly reference cache key prefixes for `transactions-analytics`, `budgets`, and `categories` modules when invalidating caches after mutations. This creates tight cross-module coupling — every new module that caches user data must be manually wired into every service that triggers invalidations. Separately, `CacheService.wrap()` has no in-flight deduplication: when a popular cache key expires, N concurrent requests all execute the same expensive DB query simultaneously instead of sharing a single result, causing unnecessary database load.

## What Changes

- **Event-driven cache invalidation**: Replace direct `cacheService.delByPrefix()` calls across modules with domain events (`TransactionCreated`, `TransactionUpdated`, `TransactionDeleted`, `TransactionImported`, `RecurringTransactionsProcessed`). Each module subscribes to relevant events and invalidates its own cache.
- **Cache stampede protection**: Add promise-based single-flight deduplication to `CacheService.wrap()` so concurrent cache misses for the same key share a single DB query.
- **Parallel cache invalidation**: Event listeners use `Promise.all()` when invalidating multiple prefixes, reducing sequential Redis round-trips.

## Capabilities

### New Capabilities

- `domain-events`: Domain event infrastructure for decoupled cross-module communication, starting with transaction mutation events for cache invalidation
- `cache-stampede-protection`: Single-flight deduplication in CacheService.wrap() to prevent concurrent identical DB queries on cache miss

### Modified Capabilities

- `request-caching`: Cache invalidation moves from direct cross-module calls to event-driven subscribers

## Impact

- **Code**: `TransactionsService`, `RecurringTransactionsService` lose direct dependencies on other modules' cache prefixes. New event classes, event emitters, and event listeners added. `CacheService` gains an in-memory `Map` for in-flight tracking.
- **Dependencies**: `@nestjs/event-emitter` added as a new dependency.
- **APIs**: No external API changes. Internal behavior change: cache invalidation becomes async (fire-and-forget events) rather than awaited — acceptable since stale cache entries expire via TTL anyway.
- **Performance**: Reduced DB load under concurrent traffic (stampede protection). Slightly faster invalidation (parallel `Promise.all()`).
