## 1. Dependencies & Setup

- [x] 1.1 Install `csv-parse` and `@types/multer` as exact-version dependencies
- [x] 1.2 Verify `@nestjs/platform-express` multer support is available (already included with NestJS)

## 2. DTOs

- [x] 2.1 Create `ImportTransactionResponseDto` with fields: `transactionsCreated`, `categoriesCreated`, `subcategoriesCreated`
- [x] 2.2 Define internal `ParsedTransactionRow` type for normalized parsed data (date, category, type, amount, currencyCode, subcategory?)

## 3. Repository Layer

- [x] 3.1 Add `findCategoriesByUser(userId, tx?)` method to `TransactionRepository` — returns all categories for a user to build lookup map
- [x] 3.2 Add `createCategories(data[], tx)` method for bulk category insert using Drizzle `insert().values([]).returning()`
- [x] 3.3 Add `createTransactions(data[], tx)` method for bulk transaction insert using Drizzle `insert().values([]).returning()`

## 4. Service Layer — Parsing

- [x] 4.1 Add `parseJsonFile(buffer: Buffer): ParsedTransactionRow[]` private method — parse JSON array, validate required fields, validate field values (type, date format, amount, currency)
- [x] 4.2 Add `parseCsvFile(buffer: Buffer): ParsedTransactionRow[]` private method — parse CSV with `csv-parse/sync`, validate headers, validate field values
- [x] 4.3 Add `parseImportFile(file: Express.Multer.File): ParsedTransactionRow[]` method — detect format by extension, delegate to JSON/CSV parser, enforce 1000-row limit

## 5. Service Layer — Category Resolution & Import

- [x] 5.1 Add `resolveCategories(rows, userId, tx)` private method — collect unique (name, type) pairs, query existing, bulk-create missing parent categories, then resolve subcategories, return lookup map `(name+type+parentName?) → categoryId`
- [x] 5.2 Add `importTransactions(file, userId)` method — orchestrate: parse file → wrap in DB transaction → resolve categories → bulk insert transactions → clear caches → return summary

## 6. Controller Layer

- [x] 6.1 Add `POST /transactions/import` endpoint with `@UseInterceptors(FileInterceptor('file'))`, multer limits (5MB), JWT guard
- [x] 6.2 Add Swagger decorators (`@ApiConsumes('multipart/form-data')`, `@ApiBody`, `@ApiResponse`) for file upload documentation
- [x] 6.3 Add file presence validation (return 400 if no file) and delegate to `TransactionsService.importTransactions()`

## 7. Verification

- [x] 7.1 Run `pnpm check-types` — ensure no TypeScript errors
- [x] 7.2 Run `pnpm lint:fix` and `pnpm format` — ensure code passes linting and formatting
- [ ] 7.3 Manual test with sample JSON file (`src/database/data/transactions-02.03.25.json`) via Swagger/curl
