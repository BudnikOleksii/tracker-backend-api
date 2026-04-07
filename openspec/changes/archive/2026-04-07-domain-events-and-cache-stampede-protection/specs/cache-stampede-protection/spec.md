## ADDED Requirements

### Requirement: CacheService.wrap prevents concurrent duplicate queries

The `CacheService.wrap()` method SHALL implement single-flight deduplication. When multiple concurrent callers request the same cache key and the key is not cached, only ONE call to the factory function SHALL be executed. All concurrent callers MUST receive the same result from that single execution.

#### Scenario: Two concurrent requests for the same uncached key

- **WHEN** two requests concurrently call `wrap("key-A", expensiveQuery)` and `key-A` is not in cache
- **THEN** `expensiveQuery` is executed exactly once
- **AND** both requests receive the same result

#### Scenario: Sequential requests after cache population

- **WHEN** a first request calls `wrap("key-A", expensiveQuery)` and completes, populating the cache
- **AND** a second request calls `wrap("key-A", expensiveQuery)` after the first completes
- **THEN** the second request is served from cache without executing `expensiveQuery`

### Requirement: In-flight tracking is cleaned up after completion

The in-flight promise tracking for a cache key MUST be removed after the factory function resolves or rejects. Completed or failed lookups MUST NOT leak memory by remaining in the in-flight map indefinitely.

#### Scenario: Cleanup after successful factory execution

- **WHEN** a cache miss triggers factory execution and the factory resolves successfully
- **THEN** the in-flight entry for that key is removed from the tracking map

#### Scenario: Cleanup after failed factory execution

- **WHEN** a cache miss triggers factory execution and the factory rejects with an error
- **THEN** the in-flight entry for that key is removed from the tracking map
- **AND** the error is propagated to all waiting callers

### Requirement: Factory errors propagate to all waiting callers

When the single factory execution for an in-flight key rejects, ALL callers waiting on that key MUST receive the same rejection. The failed result MUST NOT be cached.

#### Scenario: Error propagation to concurrent callers

- **WHEN** three concurrent requests call `wrap("key-B", failingQuery)` and `failingQuery` throws an error
- **THEN** all three requests receive the same error
- **AND** no value is stored in cache for `key-B`

#### Scenario: Retry after failure

- **WHEN** a `wrap("key-B", failingQuery)` call fails and the in-flight entry is cleaned up
- **AND** a subsequent request calls `wrap("key-B", successQuery)` with a working factory
- **THEN** `successQuery` is executed and its result is cached

### Requirement: Single-flight respects TTL parameter

When `wrap()` is called with an optional `ttl` parameter, the cached result from the single factory execution MUST be stored with that TTL. The TTL MUST apply identically regardless of whether the caller was the first (triggering the factory) or a subsequent caller (joining the in-flight promise).

#### Scenario: TTL applied to result from single-flight execution

- **WHEN** `wrap("key-C", factory, 60)` is called concurrently by two requests
- **THEN** the factory result is cached with TTL of 60 seconds
- **AND** both callers receive the same result
