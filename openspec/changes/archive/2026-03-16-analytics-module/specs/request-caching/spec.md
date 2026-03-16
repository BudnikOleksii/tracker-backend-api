## ADDED Requirements

### Requirement: Analytics read endpoints are cached

The `AnalyticsService` SHALL cache results of all analytics endpoints (summary, category-breakdown, trends, top-categories, daily-spending) using `CacheService`. Cache keys MUST be scoped to the requesting user's ID using the `analytics` module prefix. Query parameters MUST be included in the cache key to distinguish different filter combinations. TTL SHALL be 300 seconds for summary, category-breakdown, top-categories, and daily-spending; 600 seconds for trends.

#### Scenario: Cache hit on analytics summary

- **WHEN** a user requests an analytics summary with identical query parameters within the TTL window
- **THEN** the response is served from cache without querying the database

#### Scenario: Cache miss on analytics summary

- **WHEN** a user requests an analytics summary and no cache entry exists
- **THEN** the database is queried, the result is cached with appropriate TTL, and the response is returned

#### Scenario: Different query parameters produce different cache keys

- **WHEN** a user requests category-breakdown with `type=EXPENSE` and then with `type=INCOME`
- **THEN** each response is cached independently under different keys

## MODIFIED Requirements

### Requirement: Transaction cache is invalidated on writes

The `TransactionsService` SHALL invalidate all cached transaction data AND all cached analytics data for the affected user when a transaction is created, updated, or deleted. Transaction invalidation MUST use prefix-based deletion with the pattern `transactions:{userId}:*`. Analytics invalidation MUST use prefix-based deletion with the pattern `analytics:{userId}:*`.

#### Scenario: Cache invalidated after creating a transaction

- **WHEN** a user creates a new transaction
- **THEN** all cached transaction entries and all cached analytics entries for that user are invalidated

#### Scenario: Cache invalidated after updating a transaction

- **WHEN** a user updates an existing transaction
- **THEN** all cached transaction entries and all cached analytics entries for that user are invalidated

#### Scenario: Cache invalidated after deleting a transaction

- **WHEN** a user deletes a transaction
- **THEN** all cached transaction entries and all cached analytics entries for that user are invalidated
