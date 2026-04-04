## 1. Export Query DTO

- [x] 1.1 Create `ExportTransactionQueryDto` in `src/modules/transactions/dtos/export-transaction-query.dto.ts` with required `format` (json/csv) and optional `dateFrom`, `dateTo`, `categoryId` fields

## 2. Repository Layer

- [x] 2.1 Add `ExportTransactionRow` interface (with category/subcategory names) and `findAllForExport` method to `TransactionRepository` that joins transactions with categories and resolves parent/subcategory names

## 3. Service Layer

- [x] 3.1 Add `exportTransactions` method to `TransactionsService` that fetches data via repository, formats each row to match import format (Date, Category, Type, Amount, Currency, Subcategory), and serializes as JSON or CSV
- [x] 3.2 Add `csv-stringify` dependency (from existing `csv` package) for CSV serialization

## 4. Controller Endpoint

- [x] 4.1 Add `GET /transactions/export` endpoint to `TransactionsController` — placed before `:id` route, uses raw Express `Response` to set Content-Type/Content-Disposition headers and send the file body
- [x] 4.2 Add Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiProduces`) for the export endpoint

## 5. Verification

- [x] 5.1 Run `pnpm check-types`, `pnpm lint:fix`, and `pnpm format` to ensure code passes all checks
