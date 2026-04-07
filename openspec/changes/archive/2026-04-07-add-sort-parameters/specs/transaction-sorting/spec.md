## MODIFIED Requirements

### Requirement: Transaction list sorting

The transactions module SHALL import `SortOrder` and `SORT_ORDERS` from `src/shared/constants/sort.constants.ts` instead of defining them locally. The module SHALL retain its own `SORT_BY_FIELDS` (`date`, `amount`, `createdAt`) and `SortByField` type in `transactions.constants.ts`. Default sort: `date` descending.

#### Scenario: Existing sort behavior preserved

- **WHEN** a client calls `GET /api/transactions?sortBy=amount&sortOrder=asc`
- **THEN** transactions are returned sorted by amount ascending (same as before)

#### Scenario: Default sort unchanged

- **WHEN** a client calls `GET /api/transactions` without sort parameters
- **THEN** transactions are returned sorted by date descending (same as before)
