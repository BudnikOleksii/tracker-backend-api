### Requirement: Transaction mutation events are emitted

The `TransactionsService` SHALL emit a `transaction.created` event after successfully creating a transaction, a `transaction.updated` event after updating, and a `transaction.deleted` event after deleting. The `TransactionsService` SHALL emit a `transaction.imported` event after a successful import. Each event payload MUST include the `userId` of the affected user. Events MUST be emitted after the database transaction commits but MUST NOT be awaited.

#### Scenario: Event emitted after transaction creation

- **WHEN** a user creates a transaction successfully
- **THEN** a `transaction.created` event is emitted with the user's ID

#### Scenario: Event emitted after transaction update

- **WHEN** a user updates a transaction successfully
- **THEN** a `transaction.updated` event is emitted with the user's ID

#### Scenario: Event emitted after transaction deletion

- **WHEN** a user deletes a transaction successfully
- **THEN** a `transaction.deleted` event is emitted with the user's ID

#### Scenario: Event emitted after transaction import

- **WHEN** a user imports transactions successfully
- **THEN** a `transaction.imported` event is emitted with the user's ID

### Requirement: Recurring transaction processing emits events

The `RecurringTransactionsService` SHALL emit a `transaction.bulk-processed` event for each affected user after recurring transactions are processed and new transactions are created. The event payload MUST include the `userId`. Events MUST NOT be awaited.

#### Scenario: Events emitted after processing recurring transactions for a single user

- **WHEN** recurring transactions are processed for a user and at least one transaction is created
- **THEN** a `transaction.bulk-processed` event is emitted with that user's ID

#### Scenario: Events emitted after processing all recurring transactions

- **WHEN** the global recurring transaction processor runs and creates transactions for multiple users
- **THEN** a `transaction.bulk-processed` event is emitted for each affected user

#### Scenario: No event when no transactions created

- **WHEN** recurring transactions are processed but no new transactions are created for a user
- **THEN** no `transaction.bulk-processed` event is emitted for that user

### Requirement: Event emitter module is registered globally

The `EventEmitterModule` from `@nestjs/event-emitter` SHALL be registered in `AppModule` with `forRoot()`. The module MUST be available to all application modules without per-module imports.

#### Scenario: EventEmitterModule is available application-wide

- **WHEN** any module injects `EventEmitter2`
- **THEN** the injection succeeds without requiring a local module import

### Requirement: Analytics module listens for transaction events

The `TransactionsAnalyticsModule` SHALL include an event listener that subscribes to all `transaction.*` events. On receiving any transaction mutation event, the listener MUST invalidate all analytics cache entries for the affected user using prefix-based deletion with pattern `transactions-analytics:{userId}:*`.

#### Scenario: Analytics cache invalidated on transaction creation

- **WHEN** a `transaction.created` event is received for user X
- **THEN** all cache keys matching `transactions-analytics:{userX}:*` are deleted

#### Scenario: Analytics cache invalidated on bulk processing

- **WHEN** a `transaction.bulk-processed` event is received for user X
- **THEN** all cache keys matching `transactions-analytics:{userX}:*` are deleted

### Requirement: Budgets module listens for transaction events

The `BudgetsModule` SHALL include an event listener that subscribes to all `transaction.*` events. On receiving any transaction mutation event, the listener MUST invalidate all budgets cache entries for the affected user using prefix-based deletion with pattern `budgets:{userId}:*`.

#### Scenario: Budgets cache invalidated on transaction creation

- **WHEN** a `transaction.created` event is received for user X
- **THEN** all cache keys matching `budgets:{userX}:*` are deleted

#### Scenario: Budgets cache invalidated on transaction deletion

- **WHEN** a `transaction.deleted` event is received for user X
- **THEN** all cache keys matching `budgets:{userX}:*` are deleted

### Requirement: Transaction service no longer directly invalidates cross-module caches

The `TransactionsService` SHALL only invalidate its own `transactions:{userId}:*` cache prefix after mutations. It MUST NOT directly call `delByPrefix` for `transactions-analytics`, `budgets`, or any other module's cache prefix. Cross-module invalidation MUST be handled exclusively by event listeners in the owning modules.

#### Scenario: Transaction create only invalidates own cache directly

- **WHEN** a user creates a transaction
- **THEN** `TransactionsService` invalidates only `transactions:{userId}:*` directly
- **AND** cross-module cache invalidation happens via event listeners

#### Scenario: Transaction import only invalidates own and categories cache directly

- **WHEN** a user imports transactions
- **THEN** `TransactionsService` invalidates `transactions:{userId}:*` and `categories:{userId}:*` directly
- **AND** cross-module cache invalidation happens via event listeners

### Requirement: Recurring transactions service no longer directly invalidates cross-module caches

The `RecurringTransactionsService` SHALL only invalidate its own `recurring-transactions:{userId}:*` cache prefix after mutations. It MUST NOT directly call `delByPrefix` for `transactions`, `transactions-analytics`, or any other module's cache prefix. Cross-module invalidation MUST be handled exclusively by event listeners in the owning modules.

#### Scenario: Recurring transaction processing only invalidates own cache directly

- **WHEN** recurring transactions are processed
- **THEN** `RecurringTransactionsService` invalidates only `recurring-transactions:{userId}:*` directly
- **AND** the emitted event triggers listeners in transactions, analytics, and budgets modules

### Requirement: Transactions module listens for recurring transaction events

The `TransactionsModule` SHALL include an event listener that subscribes to `transaction.bulk-processed` events. On receiving the event, the listener MUST invalidate all transactions cache entries for the affected user using prefix-based deletion with pattern `transactions:{userId}:*`.

#### Scenario: Transactions cache invalidated on recurring processing

- **WHEN** a `transaction.bulk-processed` event is received for user X
- **THEN** all cache keys matching `transactions:{userX}:*` are deleted
