## ADDED Requirements

### Requirement: Summary endpoint returns income, expenses, and net balance

The system SHALL provide a `GET /analytics/summary` endpoint that returns `totalIncome`, `totalExpenses`, `netBalance`, `transactionCount`, `currencyCode`, `dateFrom`, and `dateTo` for the authenticated user. The endpoint MUST require `currencyCode` as a query parameter. When `dateFrom` or `dateTo` are omitted, the service SHALL default to the start of the current calendar month and the current timestamp, respectively. All monetary values MUST be returned as strings. The endpoint MUST be protected by `JwtAuthGuard`.

#### Scenario: Summary with explicit date range

- **WHEN** an authenticated user sends `GET /analytics/summary?currencyCode=USD&dateFrom=2026-03-01&dateTo=2026-03-15`
- **THEN** the system returns HTTP 200 with totalIncome, totalExpenses, netBalance, and transactionCount aggregated from matching transactions

#### Scenario: Summary with default date range

- **WHEN** an authenticated user sends `GET /analytics/summary?currencyCode=USD` without dateFrom or dateTo
- **THEN** the system defaults dateFrom to start of current month and dateTo to now, and returns the aggregated summary

#### Scenario: Summary with no matching transactions

- **WHEN** an authenticated user requests a summary for a currency with no transactions
- **THEN** the system returns totalIncome "0.00", totalExpenses "0.00", netBalance "0.00", and transactionCount 0

#### Scenario: Summary filtered by category

- **WHEN** an authenticated user sends `GET /analytics/summary?currencyCode=USD&categoryId=<uuid>`
- **THEN** the system returns summary aggregated only from transactions in that category

#### Scenario: Missing currencyCode

- **WHEN** an authenticated user sends `GET /analytics/summary` without currencyCode
- **THEN** the system returns HTTP 400 with a validation error

### Requirement: Category breakdown endpoint groups totals by category

The system SHALL provide a `GET /analytics/category-breakdown` endpoint that returns an array of categories with `categoryId`, `categoryName`, `type`, `total`, `percentage`, and `transactionCount` for the authenticated user. The endpoint MUST require `currencyCode`. An optional `type` filter (EXPENSE or INCOME) MAY be provided. Percentages MUST be calculated relative to the sum of all returned categories. When the grand total is zero, all percentages SHALL be 0. Soft-deleted categories MUST still appear if they have matching transactions.

#### Scenario: Breakdown by all types

- **WHEN** an authenticated user sends `GET /analytics/category-breakdown?currencyCode=USD`
- **THEN** the system returns all categories with transactions, each showing total amount and percentage of the grand total, ordered by total descending

#### Scenario: Breakdown filtered by type

- **WHEN** an authenticated user sends `GET /analytics/category-breakdown?currencyCode=USD&type=EXPENSE`
- **THEN** the system returns only expense categories with their totals and percentages

#### Scenario: Breakdown with soft-deleted category

- **WHEN** a transaction references a soft-deleted category
- **THEN** that category still appears in the breakdown with its name and totals

#### Scenario: Breakdown with no transactions

- **WHEN** an authenticated user requests a breakdown with no matching transactions
- **THEN** the system returns an empty breakdown array

### Requirement: Trends endpoint returns periodic totals over time

The system SHALL provide a `GET /analytics/trends` endpoint that returns an array of periods, each with `periodStart`, `periodEnd`, `totalIncome`, `totalExpenses`, `netBalance`, and `transactionCount`. The endpoint MUST require `currencyCode` and `granularity` (either `weekly` or `monthly`). Weekly periods SHALL start on Monday (ISO 8601). The service SHALL compute `periodEnd` from the granularity. All monetary values MUST be returned as strings.

#### Scenario: Monthly trends

- **WHEN** an authenticated user sends `GET /analytics/trends?currencyCode=USD&granularity=monthly&dateFrom=2026-01-01&dateTo=2026-03-31`
- **THEN** the system returns one entry per month with income, expenses, net balance, and transaction count

#### Scenario: Weekly trends

- **WHEN** an authenticated user sends `GET /analytics/trends?currencyCode=USD&granularity=weekly&dateFrom=2026-03-01&dateTo=2026-03-31`
- **THEN** the system returns one entry per ISO week with periodStart on Monday

#### Scenario: Trends with no data in a queried range

- **WHEN** no transactions exist in the queried date range
- **THEN** the system returns an empty periods array

#### Scenario: Missing granularity

- **WHEN** an authenticated user sends `GET /analytics/trends?currencyCode=USD` without granularity
- **THEN** the system returns HTTP 400 with a validation error

### Requirement: Top categories endpoint returns ranked categories

The system SHALL provide a `GET /analytics/top-categories` endpoint that returns an array of categories ranked by total amount, each with `rank`, `categoryId`, `categoryName`, `total`, `percentage`, and `transactionCount`. The endpoint MUST require `currencyCode`. An optional `limit` parameter controls how many categories are returned (default 5, max 20). An optional `type` parameter filters by EXPENSE or INCOME (default EXPENSE).

#### Scenario: Top 5 expense categories (default)

- **WHEN** an authenticated user sends `GET /analytics/top-categories?currencyCode=USD`
- **THEN** the system returns up to 5 expense categories ranked by total descending

#### Scenario: Custom limit and type

- **WHEN** an authenticated user sends `GET /analytics/top-categories?currencyCode=USD&limit=10&type=INCOME`
- **THEN** the system returns up to 10 income categories ranked by total descending

#### Scenario: Limit exceeds 20

- **WHEN** an authenticated user sends `GET /analytics/top-categories?currencyCode=USD&limit=50`
- **THEN** the system clamps the limit to 20

#### Scenario: Fewer categories than limit

- **WHEN** only 3 categories have transactions and limit is 5
- **THEN** the system returns 3 categories

### Requirement: Daily spending endpoint returns daily totals for a month

The system SHALL provide a `GET /analytics/daily-spending` endpoint that returns an array of all days in the specified month, each with `date`, `total`, and `transactionCount`. The endpoint MUST require `currencyCode`, `year`, and `month` (1-12). An optional `type` filter MAY be provided. The response MUST include entries for all days of the month, including days with zero transactions (total "0.00", transactionCount 0).

#### Scenario: Daily spending for a month with mixed activity

- **WHEN** an authenticated user sends `GET /analytics/daily-spending?currencyCode=USD&year=2026&month=3`
- **THEN** the system returns 31 entries (one per day in March), with totals for days that have transactions and "0.00" for days without

#### Scenario: Daily spending filtered by type

- **WHEN** an authenticated user sends `GET /analytics/daily-spending?currencyCode=USD&year=2026&month=3&type=EXPENSE`
- **THEN** the system returns daily totals counting only expense transactions

#### Scenario: Invalid month

- **WHEN** an authenticated user sends `GET /analytics/daily-spending?currencyCode=USD&year=2026&month=13`
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Month with no transactions

- **WHEN** no transactions exist in the specified month
- **THEN** the system returns all days with total "0.00" and transactionCount 0
