## Why

Users need the ability to define transactions that repeat on a schedule (e.g., monthly rent, bi-weekly salary) so they don't have to manually create the same transaction every period. This reduces data-entry friction and improves the accuracy of projected cash flow.

## What Changes

- Add a new `recurring_transactions` table to define recurrence rules (frequency, interval, start/end dates, next occurrence)
- Add a new `recurring-transactions` NestJS module with full CRUD endpoints for managing recurring transaction templates
- Add a processing mechanism that materializes recurring transactions into actual transactions when their next occurrence date is reached
- Each recurring transaction references a category and carries the same fields as a regular transaction (amount, currency, type, description) plus recurrence configuration
- Users can pause, resume, and cancel recurring transactions

## Capabilities

### New Capabilities

- `recurring-transactions-crud`: CRUD operations for creating, reading, updating, and deleting recurring transaction templates with recurrence rules (frequency, interval, start/end dates)
- `recurring-transactions-processing`: Logic to materialize recurring transactions into actual transactions based on schedule, advancing the next occurrence date after each generation

### Modified Capabilities

- `transactions-crud`: Add an optional `recurringTransactionId` foreign key to the transactions table so materialized transactions link back to their source recurring transaction

## Impact

- **Database**: New `recurring_transactions` table; new nullable column on `transactions` table
- **API**: New `/recurring-transactions` REST endpoints (CRUD + pause/resume)
- **Modules**: New `recurring-transactions` module; minor update to transactions module/schema
- **Cache**: Recurring transaction mutations must invalidate related transaction caches when materializing
