## ADDED Requirements

### Requirement: Decimal precision for monetary calculations

The system SHALL use `decimal.js` for all arithmetic operations on monetary values (amounts from `numeric` database columns). `parseFloat()` and `Number()` SHALL NOT be used on monetary string values for arithmetic.

#### Scenario: Budget progress calculation precision

- **WHEN** a budget has amount `100.10` and spent amount is `33.33`
- **THEN** the remaining amount SHALL be exactly `66.77` (not `66.77000000000001`)
- **AND** the percent used SHALL be calculated with decimal precision

#### Scenario: Budget overspend check precision

- **WHEN** the cron job checks active budgets for overspend
- **THEN** spent vs amount comparisons SHALL use decimal arithmetic
- **AND** no floating-point rounding errors SHALL affect status determination

#### Scenario: Analytics percentage calculation precision

- **WHEN** category breakdown or top categories percentages are calculated
- **THEN** the grand total and individual percentages SHALL use decimal arithmetic
- **AND** percentages SHALL be rounded to 2 decimal places

#### Scenario: Transaction currency totals precision

- **WHEN** transactions are grouped by category and totals are accumulated per currency
- **THEN** the accumulation SHALL use decimal arithmetic instead of float addition
