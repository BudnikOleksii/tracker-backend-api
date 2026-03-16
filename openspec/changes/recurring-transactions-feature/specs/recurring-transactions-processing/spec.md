## ADDED Requirements

### Requirement: Automatically process due recurring transactions via cron

The system SHALL run a daily scheduled task (via `@nestjs/schedule` `@Cron`) that processes all users' ACTIVE recurring transactions whose `nextOccurrenceDate` is on or before today's date. For each due recurring transaction, the system SHALL create a transaction with the recurring transaction's categoryId, type, amount, currencyCode, and description, with the transaction date set to the `nextOccurrenceDate`. The materialized transaction SHALL have its `recurringTransactionId` set to the source recurring transaction's ID.

#### Scenario: Daily cron processes all users

- **WHEN** the daily cron fires at midnight
- **THEN** the system finds all ACTIVE recurring transactions across all users with nextOccurrenceDate <= today and materializes them

#### Scenario: Process recurring transaction with multiple missed occurrences

- **WHEN** a recurring transaction has a nextOccurrenceDate that is multiple periods in the past (e.g., app was down)
- **THEN** the system creates one transaction for each missed occurrence, advancing nextOccurrenceDate each time until it is in the future

#### Scenario: Paused and cancelled recurring transactions are skipped

- **WHEN** recurring transactions exist with status PAUSED or CANCELLED
- **THEN** the system does not process them regardless of their nextOccurrenceDate

### Requirement: Manual processing endpoint

The system SHALL also provide `POST /recurring-transactions/process` for the authenticated user to manually trigger processing of their own recurring transactions. This is useful for testing and on-demand catch-up.

#### Scenario: Manual trigger processes user's transactions

- **WHEN** an authenticated user calls POST `/recurring-transactions/process`
- **THEN** the system processes only that user's due recurring transactions and returns a summary

### Requirement: Advance next occurrence date after processing

The system SHALL advance `nextOccurrenceDate` by adding the configured interval of the configured frequency after each transaction is materialized. For MONTHLY frequency, the system SHALL handle month-end edge cases (e.g., Jan 31 + 1 month = Feb 28/29). For YEARLY frequency, the system SHALL handle leap year edge cases.

#### Scenario: Advance daily frequency

- **WHEN** a recurring transaction has frequency DAILY and interval 1
- **THEN** nextOccurrenceDate advances by 1 day after processing

#### Scenario: Advance weekly frequency with interval

- **WHEN** a recurring transaction has frequency WEEKLY and interval 2
- **THEN** nextOccurrenceDate advances by 14 days after processing

#### Scenario: Advance monthly frequency with month-end handling

- **WHEN** a recurring transaction has frequency MONTHLY, interval 1, and nextOccurrenceDate is January 31
- **THEN** nextOccurrenceDate advances to February 28 (or 29 in a leap year)

#### Scenario: Advance yearly frequency

- **WHEN** a recurring transaction has frequency YEARLY and interval 1
- **THEN** nextOccurrenceDate advances by 1 year after processing

### Requirement: Auto-cancel on end date

The system SHALL set a recurring transaction's status to CANCELLED when its `nextOccurrenceDate` would exceed its `endDate` after processing. The final occurrence on or before the endDate SHALL still be materialized.

#### Scenario: Final occurrence on end date

- **WHEN** a recurring transaction's nextOccurrenceDate equals its endDate and processing runs
- **THEN** the system materializes the transaction and sets status to CANCELLED

#### Scenario: Next occurrence would exceed end date

- **WHEN** after advancing nextOccurrenceDate, the new date exceeds endDate
- **THEN** the system sets the recurring transaction's status to CANCELLED

### Requirement: Processing uses database transactions

Each recurring transaction SHALL be processed within its own database transaction. If materialization fails for one recurring transaction, it SHALL NOT affect the processing of others.

#### Scenario: Partial failure during batch processing

- **WHEN** processing multiple due recurring transactions and one fails
- **THEN** the successfully processed recurring transactions are committed and the failed one is rolled back

### Requirement: Cache invalidation after processing

The system SHALL invalidate transaction-related caches and analytics caches for the user after processing recurring transactions.

#### Scenario: Caches invalidated after materialization

- **WHEN** recurring transactions are processed and transactions are created
- **THEN** the system invalidates transaction list caches and transaction analytics caches for the user
