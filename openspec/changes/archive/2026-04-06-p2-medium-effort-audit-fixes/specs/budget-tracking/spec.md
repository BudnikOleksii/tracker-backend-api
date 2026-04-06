## MODIFIED Requirements

### Requirement: Budget progress calculation

The budget progress calculation (spent, remaining, percentUsed) SHALL use `decimal.js` for all arithmetic on monetary values. The `parseFloat()` function SHALL NOT be used on budget amounts or spent amounts.

#### Scenario: Budget progress with decimal precision

- **WHEN** `getBudgetProgress` is called for a budget with amount `1000.55` and spent `333.18`
- **THEN** remaining SHALL be `667.37` exactly
- **AND** percentUsed SHALL be calculated as `(333.18 / 1000.55) * 100` using decimal math

### Requirement: Budget overspend cron calculation

The budget overspend cron job SHALL use `decimal.js` when comparing spent amounts to budget amounts for status determination.

#### Scenario: Overspend detection precision

- **WHEN** the cron job processes a budget with amount `500.00` and spent `500.00`
- **THEN** the comparison SHALL use decimal equality, not floating-point comparison
