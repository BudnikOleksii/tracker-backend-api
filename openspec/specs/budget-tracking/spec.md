## ADDED Requirements

### Requirement: Budget progress calculation

The budget progress calculation (spent, remaining, percentUsed) SHALL use `decimal.js` for all arithmetic on monetary values. The `parseFloat()` function SHALL NOT be used on budget amounts or spent amounts.

#### Scenario: Budget progress with decimal precision

- **WHEN** `getBudgetProgress` is called for a budget with amount `1000.55` and spent `333.18`
- **THEN** remaining SHALL be `667.37` exactly
- **AND** percentUsed SHALL be calculated as `(333.18 / 1000.55) * 100` using decimal math

### Requirement: Progress caching

The system SHALL cache budget progress responses. The system SHALL invalidate budget progress caches when transactions are created, updated, or deleted for the relevant user.

#### Scenario: Transaction change invalidates progress cache

- **WHEN** a user creates, updates, or deletes a transaction
- **THEN** system invalidates cached budget progress for that user

### Requirement: Budget overspend cron calculation

The budget overspend cron job SHALL use `decimal.js` when comparing spent amounts to budget amounts for status determination.

#### Scenario: Overspend detection precision

- **WHEN** the cron job processes a budget with amount `500.00` and spent `500.00`
- **THEN** the comparison SHALL use decimal equality, not floating-point comparison

### Requirement: Budget date range CHECK constraint

The `Budget` table SHALL have a database CHECK constraint enforcing `endDate > startDate`. Budgets where `endDate` is equal to or before `startDate` MUST be rejected at the database level.

#### Scenario: Insert budget with valid date range

- **WHEN** a budget is inserted with `startDate = '2026-01-01'` and `endDate = '2026-01-31'`
- **THEN** the insert succeeds

#### Scenario: Insert budget with endDate before startDate

- **WHEN** a budget is inserted with `startDate = '2026-01-31'` and `endDate = '2026-01-01'`
- **THEN** the database rejects the insert with a CHECK constraint violation

#### Scenario: Insert budget with equal dates

- **WHEN** a budget is inserted with `startDate = '2026-01-01'` and `endDate = '2026-01-01'`
- **THEN** the database rejects the insert with a CHECK constraint violation
