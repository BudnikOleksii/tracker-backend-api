## MODIFIED Requirements

### Requirement: CSV file parsing

The system SHALL parse uploaded CSV files using the async streaming `csv-parse` API. The `parseCsvFile` method SHALL accept a `Buffer` and return a `Promise<ParsedTransactionRow[]>`. The method signature changes from synchronous to asynchronous.

#### Scenario: Successful CSV import

- **WHEN** a user uploads a valid CSV file
- **THEN** the file SHALL be parsed asynchronously using streaming csv-parse
- **AND** the parsed rows SHALL be validated and inserted as transactions

#### Scenario: Import with parse error

- **WHEN** a user uploads a CSV file with invalid format
- **THEN** a `BadRequestException` SHALL be thrown with an appropriate error message
