## Context

The tracker backend uses `CacheService` (Redis-backed via `cache-manager`) for read-through caching across transactions, analytics, budgets, categories, and user modules. Currently, when a transaction is created/updated/deleted, the `TransactionsService` directly calls `cacheService.delByPrefix()` for its own cache AND for `transactions-analytics` and `budgets` cache prefixes. Similarly, `RecurringTransactionsService` invalidates `transactions` and `transactions-analytics` caches directly. This means every service must know which other modules cache data that depends on its mutations.

`CacheService.wrap()` has no deduplication — concurrent requests for the same expired key each execute the underlying DB query independently.

## Goals / Non-Goals

**Goals:**

- Decouple cache invalidation from mutation sources using NestJS EventEmitter2
- Each module owns its own cache invalidation logic, subscribing to domain events
- Add single-flight deduplication to `CacheService.wrap()` to prevent cache stampedes
- Parallelize multi-prefix cache invalidation with `Promise.all()`

**Non-Goals:**

- Full CQRS or event sourcing architecture
- Persistent event log or event replay
- Replacing the existing `CacheService` / `cache-manager` setup
- Cross-service (microservice) event bus — this is in-process only

## Decisions

### 1. Use `@nestjs/event-emitter` (EventEmitter2) for domain events

**Choice:** NestJS's official event-emitter package wrapping EventEmitter2.

**Alternatives considered:**

- **Custom Observable/Subject pattern**: More control but reinvents the wheel; no decorator support.
- **Bull/BullMQ queues**: Overkill for in-process cache invalidation; adds Redis queue overhead.

**Rationale:** `@nestjs/event-emitter` is the NestJS-idiomatic solution — supports `@OnEvent()` decorators, integrates with module lifecycle, supports async listeners, and has zero infrastructure overhead since events are in-process.

### 2. Fire-and-forget events (not awaited)

**Choice:** Services emit events after the mutation completes but do NOT await listener completion. Use `@OnEvent('transaction.*', { async: true })` listeners.

**Rationale:** Cache invalidation is best-effort — if it fails, the TTL ensures eventual consistency. Awaiting invalidation would add latency to every write operation. The `async: true` option ensures listener errors don't propagate to the emitter.

### 3. Event payload design — minimal, typed

**Choice:** Create a `TransactionMutationEvent` class carrying `{ userId: string, action: 'created' | 'updated' | 'deleted' | 'imported' | 'bulk-processed' }`. Use wildcard event names like `transaction.created`, `transaction.deleted`, etc.

**Alternatives considered:**

- Per-action event classes (`TransactionCreatedEvent`, `TransactionDeletedEvent`): More type-safe but unnecessary since all listeners need the same data (userId) and perform the same action (invalidate).
- Carrying full transaction data in events: Violates minimality; listeners only need userId for prefix-based invalidation.

**Rationale:** A single event class keeps things simple. The `action` field allows listeners to differentiate if needed (e.g., a future audit log). Wildcard subscription (`transaction.*`) lets listeners handle all mutation types with one handler.

### 4. Single-flight via in-memory `Map<string, Promise>`

**Choice:** `CacheService` maintains a `Map<string, Promise<unknown>>` of in-flight requests. On cache miss, if the key is already in-flight, return the existing promise. Otherwise, execute the factory, store the promise, and clean up on completion.

**Alternatives considered:**

- **Redis-based distributed lock (Redlock)**: Handles multi-instance but adds ~2-4ms per request and complexity. Overkill for a single-instance deployment.
- **Stale-while-revalidate**: Returns stale data while refreshing in background. More complex, requires storing TTL metadata.

**Rationale:** In-memory single-flight is simple, zero-overhead, and covers the common case (concurrent requests to the same Node.js process). For multi-instance deployments, the worst case is N instances each running the query once — still N queries instead of N×concurrent_requests.

### 5. Listener placement — co-located with owning module

**Choice:** Each module that caches data has its own event listener class (e.g., `TransactionsAnalyticsCacheListener` in the analytics module, `BudgetsCacheListener` in the budgets module). The `TransactionsService` and `RecurringTransactionsService` only emit events — they don't know who listens.

**Rationale:** This is the core decoupling benefit. Adding a new module that caches transaction-dependent data only requires adding a listener in that new module — no changes to `TransactionsService`.

## Risks / Trade-offs

**[Risk] Event listeners fail silently** → Listeners use `async: true` which swallows errors by default. Mitigation: Add error logging in each listener. Cache entries will expire via TTL regardless, so failure means slightly stale data, not data loss.

**[Risk] In-memory single-flight doesn't work across multiple instances** → Mitigation: Acceptable for current single-instance deployment. Document that distributed stampede protection (Redlock or probabilistic early expiration) should be added if/when horizontal scaling is needed.

**[Risk] Fire-and-forget means invalidation races with subsequent reads** → A write followed by an immediate read might hit stale cache if the event hasn't fired yet. Mitigation: Events are emitted synchronously onto the event loop — the listener runs before the next HTTP request's handler in practice. For critical paths, the TTL serves as a safety net.

**[Trade-off] New dependency (`@nestjs/event-emitter`)** → Adds a well-maintained, Nest-official package. Minimal surface area, no transitive dependency concerns.
