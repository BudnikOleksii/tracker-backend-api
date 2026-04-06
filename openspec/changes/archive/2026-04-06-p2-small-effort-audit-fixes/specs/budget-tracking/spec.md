## ADDED Requirements

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
