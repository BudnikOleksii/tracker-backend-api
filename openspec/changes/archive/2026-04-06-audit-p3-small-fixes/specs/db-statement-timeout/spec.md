## ADDED Requirements

### Requirement: Database connections have a statement timeout

Every new PostgreSQL connection acquired from the pool SHALL have `statement_timeout` set to 30 seconds to prevent runaway queries from holding connections indefinitely.

#### Scenario: Query completes within timeout

- **WHEN** a SQL statement executes and completes in under 30 seconds
- **THEN** the statement SHALL return results normally

#### Scenario: Query exceeds timeout

- **WHEN** a SQL statement executes for longer than 30 seconds
- **THEN** PostgreSQL SHALL cancel the statement and return a query_canceled error

#### Scenario: Timeout is set on each new connection

- **WHEN** a new connection is created in the pool
- **THEN** the pool SHALL execute `SET statement_timeout = '30s'` on that connection before it is used
