## Why

Users can import transactions but have no way to export them. Adding a download/export feature lets users back up their data or move it to other tools, matching the same format used for imports.

## What Changes

- Add `GET /transactions/export` endpoint that returns a downloadable file
- Support JSON and CSV output formats via a required `format` query parameter
- Support optional filtering by date range (`dateFrom`, `dateTo`) and category (`categoryId`)
- Export format matches the import format: `Date`, `Category`, `Type`, `Amount`, `Currency`, `Subcategory`
- When no filters are provided, export all of the user's transactions

## Capabilities

### New Capabilities

- `transaction-export`: Export user transactions as downloadable JSON or CSV files with optional date range and category filters

### Modified Capabilities

_(none)_

## Impact

- **API**: New `GET /transactions/export` route in the transactions controller
- **Code**: New DTO for export query params, new repository method to fetch transactions with category names (joined), new service method to format and serialize data
- **Dependencies**: `csv-stringify` (or manual CSV generation) for CSV output — `csv-parse` is already used for import so `csv-stringify` from the same package is a natural fit
