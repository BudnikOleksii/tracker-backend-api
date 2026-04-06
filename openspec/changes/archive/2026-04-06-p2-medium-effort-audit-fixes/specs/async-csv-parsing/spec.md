## ADDED Requirements

### Requirement: Async CSV stream parsing

The system SHALL parse CSV import files using the async streaming `csv-parse` API instead of the synchronous `csv-parse/sync` API, ensuring the Node.js event loop is not blocked during parsing.

#### Scenario: Large CSV file parsed without blocking

- **WHEN** a user uploads a 5MB CSV file with 50,000 rows
- **THEN** the event loop remains responsive during parsing (no synchronous blocking)
- **AND** all rows are parsed and returned as an array of `ParsedTransactionRow[]`

#### Scenario: CSV parse error handling

- **WHEN** a user uploads a malformed CSV file that causes a parse error
- **THEN** the system SHALL throw a `BadRequestException` with the same error messaging as the current sync parser

#### Scenario: Empty CSV file

- **WHEN** a user uploads an empty CSV file (headers only, no data rows)
- **THEN** the system SHALL return an empty array
