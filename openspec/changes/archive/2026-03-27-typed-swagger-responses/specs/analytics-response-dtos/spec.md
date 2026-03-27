## ADDED Requirements

### Requirement: SummaryResponseDto for analytics summary endpoint

A `SummaryResponseDto` SHALL exist with `@ApiProperty` decorators on: `totalIncome`, `totalExpenses`, `netBalance`, `transactionCount`, `currencyCode`, `dateFrom`, `dateTo`.

#### Scenario: GET /transactions-analytics/summary returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions-analytics/summary`
- **THEN** the response schema for status 200 SHALL reference `SummaryResponseDto`

### Requirement: CategoryBreakdownResponseDto for breakdown endpoint

A `CategoryBreakdownResponseDto` SHALL exist with `@ApiProperty` decorators on: `currencyCode`, `dateFrom`, `dateTo`, `breakdown` (typed array of `CategoryBreakdownItemDto`). The `CategoryBreakdownItemDto` SHALL have: `categoryId`, `categoryName`, `type`, `total`, `transactionCount`, `percentage`.

#### Scenario: GET /transactions-analytics/category-breakdown returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions-analytics/category-breakdown`
- **THEN** the response schema for status 200 SHALL reference `CategoryBreakdownResponseDto` with `breakdown` as an array of `CategoryBreakdownItemDto`

### Requirement: TrendsResponseDto for trends endpoint

A `TrendsResponseDto` SHALL exist with `@ApiProperty` decorators on: `currencyCode`, `granularity`, `periods` (typed array of `TrendPeriodDto`). The `TrendPeriodDto` SHALL have: `periodStart`, `periodEnd`, `totalIncome`, `totalExpenses`, `netBalance`, `transactionCount`.

#### Scenario: GET /transactions-analytics/trends returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions-analytics/trends`
- **THEN** the response schema for status 200 SHALL reference `TrendsResponseDto` with `periods` as an array of `TrendPeriodDto`

### Requirement: TopCategoriesResponseDto for top-categories endpoint

A `TopCategoriesResponseDto` SHALL exist with `@ApiProperty` decorators on: `currencyCode`, `categories` (typed array of `TopCategoryItemDto`). The `TopCategoryItemDto` SHALL have: `rank`, `categoryId`, `categoryName`, `total`, `percentage`, `transactionCount`.

#### Scenario: GET /transactions-analytics/top-categories returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions-analytics/top-categories`
- **THEN** the response schema for status 200 SHALL reference `TopCategoriesResponseDto` with `categories` as an array of `TopCategoryItemDto`

### Requirement: DailySpendingResponseDto for daily-spending endpoint

A `DailySpendingResponseDto` SHALL exist with `@ApiProperty` decorators on: `currencyCode`, `year`, `month`, `days` (typed array of `DailySpendingItemDto`). The `DailySpendingItemDto` SHALL have: `date`, `total`, `transactionCount`.

#### Scenario: GET /transactions-analytics/daily-spending returns typed response

- **WHEN** the OpenAPI spec is generated for `GET /transactions-analytics/daily-spending`
- **THEN** the response schema for status 200 SHALL reference `DailySpendingResponseDto` with `days` as an array of `DailySpendingItemDto`

### Requirement: All analytics response DTOs have ApiProperty with description and example

Every property on every analytics response DTO SHALL have an `@ApiProperty` decorator with both a `description` and an `example` value.

#### Scenario: SummaryResponseDto properties are fully decorated

- **WHEN** `SummaryResponseDto` is inspected
- **THEN** every property SHALL have `@ApiProperty` with non-empty `description` and `example`

#### Scenario: Nested item DTOs are fully decorated

- **WHEN** `CategoryBreakdownItemDto`, `TrendPeriodDto`, `TopCategoryItemDto`, or `DailySpendingItemDto` is inspected
- **THEN** every property SHALL have `@ApiProperty` with non-empty `description` and `example`
