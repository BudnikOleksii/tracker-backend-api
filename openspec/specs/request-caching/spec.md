### Requirement: Cache service supports prefix-based deletion

The `CacheService` SHALL provide a `delByPrefix(prefix: string)` method that deletes all cache keys matching the given prefix. The method MUST use Redis `SCAN` (not `KEYS`) to avoid blocking the Redis server.

#### Scenario: Delete all keys matching a prefix

- **WHEN** `delByPrefix("transactions:user123:")` is called and keys `transactions:user123:list:abc` and `transactions:user123:detail:456` exist
- **THEN** both keys are deleted from the cache

#### Scenario: No keys match prefix

- **WHEN** `delByPrefix("transactions:user999:")` is called and no matching keys exist
- **THEN** the method completes without error

### Requirement: Transaction read endpoints are cached

The `TransactionsService` SHALL cache results of `findAll` and `findById` using `CacheService`. Cache keys MUST be scoped to the requesting user's ID. List queries MUST include query parameters in the cache key to distinguish different filter/pagination combinations.

#### Scenario: Cache hit on transaction list

- **WHEN** a user requests their transaction list with identical query parameters within the TTL window
- **THEN** the response is served from cache without querying the database

#### Scenario: Cache miss on transaction list

- **WHEN** a user requests their transaction list and no cache entry exists
- **THEN** the database is queried, the result is cached, and the response is returned

#### Scenario: Cache hit on transaction detail

- **WHEN** a user requests a specific transaction by ID that is cached
- **THEN** the response is served from cache without querying the database

### Requirement: Transaction cache is invalidated on writes

The `TransactionsService` SHALL invalidate all cached transaction data for the affected user when a transaction is created, updated, or deleted. Transaction invalidation MUST use prefix-based deletion with the pattern `transactions:{userId}:*`. Cross-module cache invalidation (analytics, budgets) MUST be handled by event listeners in their respective modules, NOT by direct calls from `TransactionsService`.

#### Scenario: Cache invalidated after creating a transaction

- **WHEN** a user creates a new transaction
- **THEN** all cached transaction entries for that user are invalidated directly
- **AND** a `transaction.created` event is emitted for cross-module invalidation

#### Scenario: Cache invalidated after updating a transaction

- **WHEN** a user updates an existing transaction
- **THEN** all cached transaction entries for that user are invalidated directly
- **AND** a `transaction.updated` event is emitted for cross-module invalidation

#### Scenario: Cache invalidated after deleting a transaction

- **WHEN** a user deletes a transaction
- **THEN** all cached transaction entries for that user are invalidated directly
- **AND** a `transaction.deleted` event is emitted for cross-module invalidation

### Requirement: Transaction category read endpoints are cached

The `TransactionCategoriesService` SHALL cache results of `findAll` and `findById` using `CacheService`. Cache keys MUST be scoped to the requesting user's ID.

#### Scenario: Cache hit on category list

- **WHEN** a user requests their category list with identical query parameters within the TTL window
- **THEN** the response is served from cache without querying the database

#### Scenario: Cache hit on category detail

- **WHEN** a user requests a specific category by ID that is cached
- **THEN** the response is served from cache without querying the database

### Requirement: Transaction category cache is invalidated on writes

The `TransactionCategoriesService` SHALL invalidate all cached category data for the affected user when a category is created, updated, or deleted. Invalidation MUST use prefix-based deletion with the pattern `categories:{userId}:*`.

#### Scenario: Cache invalidated after creating a category

- **WHEN** a user creates a new category
- **THEN** all cached category entries for that user are invalidated

#### Scenario: Cache invalidated after updating a category

- **WHEN** a user updates an existing category
- **THEN** all cached category entries for that user are invalidated

#### Scenario: Cache invalidated after deleting a category

- **WHEN** a user deletes a category
- **THEN** all cached category entries for that user are invalidated

### Requirement: User read endpoints are cached

The `UserService` SHALL cache results of `findAll`, `findById`, and `getSummary` using `CacheService`. User list and summary caches MUST use a shared admin-scoped prefix since these are admin-only endpoints viewing all users.

#### Scenario: Cache hit on user list

- **WHEN** an admin requests the user list with identical query parameters within the TTL window
- **THEN** the response is served from cache without querying the database

#### Scenario: Cache hit on user summary

- **WHEN** an admin requests the user summary and a cached result exists
- **THEN** the response is served from cache without querying the database

### Requirement: User cache is invalidated on writes

The `UserService` SHALL invalidate all cached user data when a user is created, updated, role-changed, or deleted. Invalidation MUST use prefix-based deletion with the pattern `users:*`.

#### Scenario: Cache invalidated after creating a user

- **WHEN** an admin creates a new user
- **THEN** all cached user entries are invalidated

#### Scenario: Cache invalidated after updating a user

- **WHEN** a user is updated (profile or role change)
- **THEN** all cached user entries are invalidated

#### Scenario: Cache invalidated after deleting a user

- **WHEN** an admin deletes a user
- **THEN** all cached user entries are invalidated

### Requirement: Cache port interface includes prefix deletion

The `CachePort` interface SHALL include a `delByPrefix(prefix: string): Promise<void>` method to maintain the port/adapter pattern used by the cache module.

#### Scenario: CachePort updated with delByPrefix

- **WHEN** the `CachePort` interface is defined
- **THEN** it includes the `delByPrefix` method signature alongside existing methods

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
