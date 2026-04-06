## 1. Async CSV Parsing

- [x] 1.1 Replace `csv-parse/sync` import with async `csv-parse` in `transactions.service.ts`
- [x] 1.2 Convert `parseCsvFile` from sync to async: use `parse` stream collected via async iteration, return `Promise<ParsedTransactionRow[]>`
- [x] 1.3 Update `importTransactions` caller to `await` the now-async `parseCsvFile`
- [x] 1.4 Ensure parse errors are caught and thrown as `BadRequestException`

## 2. Timestamptz Migration

- [x] 2.1 Update `transactions.ts` schema: change `date` column from `timestamp` to `timestamp with timezone`
- [x] 2.2 Update `budgets.ts` schema: change `startDate` and `endDate` from `timestamp` to `timestamptz`
- [x] 2.3 Update `recurring-transactions.ts` schema: change `startDate`, `endDate`, and `nextOccurrenceDate` from `timestamp` to `timestamptz`
- [x] 2.4 Run `pnpm db:generate` to create migration and verify generated SQL is ALTER TYPE only

## 3. CSRF Protection

- [x] 3.1 Add `CSRF_TOKEN_COOKIE_NAME` env variable to `env.schema.ts` with default `csrf_token`
- [x] 3.2 Create `CsrfGuard` in `src/shared/guards/` that validates `x-csrf-token` header against `csrf_token` cookie when `COOKIE_SAME_SITE=none`
- [x] 3.3 Add CSRF token generation helper using `crypto.randomBytes` in `auth.controller.ts`
- [x] 3.4 Set `csrf_token` cookie (non-httpOnly) alongside refresh token cookie in `setRefreshTokenCookie` when `SameSite=none`
- [x] 3.5 Clear `csrf_token` cookie in `clearRefreshTokenCookie`
- [x] 3.6 Apply `@UseGuards(CsrfGuard)` to `refresh-token`, `logout`, and `revoke-refresh-tokens` endpoints

## 4. Decimal Arithmetic

- [x] 4.1 Install `decimal.js` as exact version dependency
- [x] 4.2 Replace `parseFloat` in `budgets.service.ts` `getBudgetProgress` with `Decimal` operations for spent, remaining, and percentUsed
- [x] 4.3 Replace `parseFloat` in `budgets.service.ts` `checkBudgetOverspend` cron with `Decimal` comparisons
- [x] 4.4 Replace `Number()` in `transactions-analytics.service.ts` `getCategoryBreakdown` and `getTopCategories` with `Decimal` for grand total and percentage calculations
- [x] 4.5 Replace `parseFloat` in `transactions.service.ts` currency totals accumulation with `Decimal`
- [x] 4.6 Keep `parseFloat` for CSV export `Amount` field (display-only, not arithmetic)

## 5. Verification

- [x] 5.1 Run `pnpm check-types` — all type checks pass
- [x] 5.2 Run `pnpm lint:fix` — no lint errors
- [x] 5.3 Run `pnpm format` — formatting applied
