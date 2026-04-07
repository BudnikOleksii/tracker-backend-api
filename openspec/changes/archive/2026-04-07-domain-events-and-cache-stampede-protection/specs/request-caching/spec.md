## MODIFIED Requirements

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
