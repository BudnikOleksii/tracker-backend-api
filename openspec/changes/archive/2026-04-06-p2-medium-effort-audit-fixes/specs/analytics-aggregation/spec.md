## MODIFIED Requirements

### Requirement: Analytics percentage calculations

The analytics service SHALL use `decimal.js` for grand total accumulation and percentage calculations in category breakdown and top categories endpoints. `Number()` SHALL NOT be used on monetary string values for arithmetic.

#### Scenario: Category breakdown percentages

- **WHEN** category breakdown is calculated with totals `["100.50", "200.75", "50.25"]`
- **THEN** the grand total SHALL be `351.50` (decimal sum)
- **AND** each category's percentage SHALL be calculated using decimal division and rounded to 2 decimal places

### Requirement: Analytics amount rounding

The `roundPercent` method SHALL use decimal-safe rounding to 2 decimal places.

#### Scenario: Percentage rounding precision

- **WHEN** a percentage value of `33.335` is rounded
- **THEN** the result SHALL be `33.34` (correct banker's/half-up rounding)
