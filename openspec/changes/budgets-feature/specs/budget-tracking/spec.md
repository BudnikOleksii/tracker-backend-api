## ADDED Requirements

### Requirement: Get budget progress

The system SHALL provide an endpoint to retrieve the spending progress for a specific budget. Progress SHALL be computed by summing transaction amounts matching the budget's userId, categoryId (if set), currencyCode, and date range (startDate to endDate). If categoryId is null, the system SHALL sum all transactions for that currency in the period.

#### Scenario: Get progress for a category budget

- **WHEN** user sends GET /api/budgets/:id/progress for a budget with categoryId set
- **THEN** system returns the budget details along with spentAmount (sum of matching transactions), remainingAmount (amount - spentAmount), and percentUsed (spentAmount / amount \* 100)

#### Scenario: Get progress for an overall budget (no category)

- **WHEN** user sends GET /api/budgets/:id/progress for a budget with no categoryId
- **THEN** system sums all transactions for that user, currency, and date range, returning spentAmount, remainingAmount, and percentUsed

#### Scenario: Get progress when no transactions exist

- **WHEN** user sends GET /api/budgets/:id/progress and there are no matching transactions
- **THEN** system returns spentAmount "0.00", remainingAmount equal to budget amount, and percentUsed 0

#### Scenario: Get progress for overspent budget

- **WHEN** the sum of matching transactions exceeds the budget amount
- **THEN** system returns a negative remainingAmount and percentUsed greater than 100

### Requirement: Progress caching

The system SHALL cache budget progress responses. The system SHALL invalidate budget progress caches when transactions are created, updated, or deleted for the relevant user.

#### Scenario: Transaction change invalidates progress cache

- **WHEN** a user creates, updates, or deletes a transaction
- **THEN** system invalidates cached budget progress for that user

### Requirement: Overspend detection cron

The system SHALL run a periodic scheduled task that checks all ACTIVE budgets and updates status to EXCEEDED for any budget where the spent amount exceeds the budget amount. The cron SHALL run daily.

#### Scenario: Budget exceeds limit

- **WHEN** the overspend detection cron runs and finds a budget where spentAmount > amount
- **THEN** system updates the budget status from "ACTIVE" to "EXCEEDED"

#### Scenario: Budget returns under limit

- **WHEN** the overspend detection cron runs and finds an EXCEEDED budget where spentAmount <= amount (e.g., a transaction was deleted)
- **THEN** system updates the budget status from "EXCEEDED" back to "ACTIVE"

#### Scenario: Cron skips expired budgets

- **WHEN** the overspend detection cron runs and a budget's endDate is in the past
- **THEN** system skips that budget (does not update its status)
