## ADDED Requirements

### Requirement: Transaction amount CHECK constraint

The `Transaction` table SHALL have a database CHECK constraint enforcing `amount > 0`. Negative or zero amounts MUST be rejected at the database level.

#### Scenario: Insert transaction with positive amount

- **WHEN** a transaction is inserted with `amount = 100.50`
- **THEN** the insert succeeds

#### Scenario: Insert transaction with zero amount

- **WHEN** a transaction is inserted with `amount = 0`
- **THEN** the database rejects the insert with a CHECK constraint violation

#### Scenario: Insert transaction with negative amount

- **WHEN** a transaction is inserted with `amount = -50`
- **THEN** the database rejects the insert with a CHECK constraint violation

### Requirement: Consistent validator decorators in analytics DTOs

`AnalyticsQueryDto`, `DailySpendingQueryDto`, `TopCategoriesQueryDto`, and `TrendsQueryDto` SHALL use project-standard `*Field()` validator wrappers (`IsIntField`, `MinField`, `MaxField`, `IsInField`) instead of raw `class-validator` decorators.

#### Scenario: Validation error includes ErrorCode context

- **WHEN** a request to an analytics endpoint sends an invalid `year` value
- **THEN** the validation error response includes the appropriate `ErrorCode` from the `*Field()` wrapper
