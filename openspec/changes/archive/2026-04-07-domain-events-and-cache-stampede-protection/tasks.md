## 1. Dependencies and Event Infrastructure

- [x] 1.1 Install `@nestjs/event-emitter` as an exact version dependency
- [x] 1.2 Register `EventEmitterModule.forRoot()` in `AppModule` imports
- [x] 1.3 Create `TransactionMutationEvent` class in `src/modules/transactions/events/` with `userId` and `action` fields and event name constants (`transaction.created`, `transaction.updated`, `transaction.deleted`, `transaction.imported`, `transaction.bulk-processed`)

## 2. Cache Stampede Protection

- [x] 2.1 Add an in-flight `Map<string, Promise<unknown>>` to `CacheService`
- [x] 2.2 Update `CacheService.wrap()` to check in-flight map before executing factory, store promise on miss, clean up on resolve/reject, and propagate errors to all waiters
- [x] 2.3 Ensure failed factory calls are not cached and the in-flight entry is removed

## 3. Domain Event Emission

- [x] 3.1 Inject `EventEmitter2` into `TransactionsService` and emit `transaction.created`, `transaction.updated`, `transaction.deleted` events after mutations (fire-and-forget)
- [x] 3.2 Emit `transaction.imported` event in `TransactionsService.importTransactions()` after successful import
- [x] 3.3 Remove direct `delByPrefix` calls for `transactions-analytics` and `budgets` prefixes from `TransactionsService` (keep only `transactions` and `categories` own-prefix invalidation)
- [x] 3.4 Inject `EventEmitter2` into `RecurringTransactionsService` and emit `transaction.bulk-processed` events for each affected user after processing creates transactions
- [x] 3.5 Remove direct `delByPrefix` calls for `transactions` and `transactions-analytics` prefixes from `RecurringTransactionsService` (keep only `recurring-transactions` own-prefix invalidation)

## 4. Event Listeners

- [x] 4.1 Create `TransactionsAnalyticsCacheListener` in the analytics module that subscribes to `transaction.*` events and invalidates `transactions-analytics:{userId}:*` cache
- [x] 4.2 Create `BudgetsCacheListener` in the budgets module that subscribes to `transaction.*` events and invalidates `budgets:{userId}:*` cache
- [x] 4.3 Create `TransactionsCacheListener` in the transactions module that subscribes to `transaction.bulk-processed` events and invalidates `transactions:{userId}:*` cache
- [x] 4.4 Register all listener classes as providers in their respective modules

## 5. Verification

- [x] 5.1 Run `pnpm check-types` to verify TypeScript compilation
- [x] 5.2 Run `pnpm lint:fix` and `pnpm format` to ensure code quality
