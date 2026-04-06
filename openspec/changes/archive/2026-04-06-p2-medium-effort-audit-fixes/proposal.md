## Why

Four medium-effort P2 audit findings remain open — async CSV parsing (#23), timestamptz migration (#25), CSRF protection (#26), and decimal arithmetic (#31). These address event-loop blocking during imports, timezone-incorrect date boundaries, cross-site request forgery risk when `SameSite=none`, and floating-point precision loss on monetary calculations. Fixing them now closes out all M-effort P2 items.

## What Changes

- **Async CSV parsing**: Replace synchronous `csv-parse/sync` with the streaming `csv-parse` async API in the transaction import flow, preventing event-loop blocking on large files.
- **Timestamptz migration**: Change all `timestamp` date columns (`Transaction.date`, `Budget.startDate/endDate`, `RecurringTransaction.startDate/endDate/nextOccurrenceDate`) to `timestamptz` so date-range queries respect user timezones.
- **CSRF protection**: Add double-submit cookie CSRF tokens to all cookie-reading auth endpoints (`refresh-token`, `logout`, `revoke-refresh-tokens`) to prevent cross-site forgery when `SameSite` is set to `none`.
- **Decimal arithmetic**: Install `decimal.js` and replace all `parseFloat()`/`Number()` usage on monetary `numeric` column values with precise decimal math.

## Capabilities

### New Capabilities

- `async-csv-parsing`: Streaming async CSV parsing for transaction import
- `csrf-protection`: Double-submit cookie CSRF protection for cookie-based auth endpoints
- `decimal-arithmetic`: Precise decimal math for all financial calculations

### Modified Capabilities

- `transaction-import`: Import now uses async streaming parser instead of sync
- `refresh-token-cookie`: Cookie-based auth endpoints now require CSRF token validation
- `budget-tracking`: Budget progress/overspend calculations use decimal.js instead of parseFloat
- `analytics-aggregation`: Analytics percentage calculations use decimal.js instead of Number()

## Impact

- **Dependencies**: Add `decimal.js`; `csv-parse` already installed (switch from `/sync` to async API)
- **Database**: Migration to convert 6 columns from `timestamp` to `timestamptz` — non-breaking for existing queries but requires migration on deployed databases
- **API**: Auth endpoints that read cookies will require `x-csrf-token` header when `SameSite=none` — **BREAKING** for cross-domain deployments
- **Files**: `transactions.service.ts`, `budgets.service.ts`, `transactions-analytics.service.ts`, `auth.controller.ts`, `env.schema.ts`, all date-column schemas, new CSRF guard/middleware
