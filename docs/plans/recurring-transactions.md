# Feature Plan: Recurring Transactions

## Overview

Users create templates for repeating transactions (rent, salary, subscriptions). A cron job auto-generates actual Transaction records on schedule. Users can pause, resume, and preview upcoming occurrences.

---

## Database Schema

### New Enums (in `src/database/schemas/enums.ts`)

```ts
RecurringFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
RecurringStatus: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
```

### New Table: `RecurringTransaction`

**New file:** `src/database/schemas/recurring-transactions.ts`

| Column          | Type               | Notes                                        |
| --------------- | ------------------ | -------------------------------------------- |
| id              | uuid               | PK, auto-generated                           |
| userId          | uuid               | FK → users.id, cascade delete                |
| categoryId      | uuid               | FK → transactionCategories (restrict delete) |
| type            | TransactionType    | EXPENSE or INCOME                            |
| amount          | numeric(19,2)      |                                              |
| currencyCode    | CurrencyCode       |                                              |
| description     | text               | Optional                                     |
| frequency       | RecurringFrequency | DAILY, WEEKLY, MONTHLY, YEARLY               |
| status          | RecurringStatus    | Default ACTIVE                               |
| startDate       | timestamp          | When recurrence begins                       |
| endDate         | timestamp          | Optional — when recurrence ends              |
| nextOccurrence  | timestamp          | Precomputed, initialized to startDate        |
| lastProcessedAt | timestamp          | Idempotency marker                           |
| createdAt       | timestamp          | Auto                                         |
| updatedAt       | timestamp          | Auto                                         |

**Indexes:** userId, status, nextOccurrence, compound (status + nextOccurrence)

### Modify Existing: `Transaction` table

Add nullable column: `recurringTransactionId` (uuid, FK → recurringTransactions.id, ON DELETE SET NULL)

This links generated transactions back to their template while preserving generated transactions if the template is deleted.

---

## API Endpoints

All under `/recurring-transactions`, protected by `JwtAuthGuard`.

### CRUD

| Method | Path                          | Description                                                    |
| ------ | ----------------------------- | -------------------------------------------------------------- |
| POST   | `/recurring-transactions`     | Create template                                                |
| GET    | `/recurring-transactions`     | List (paginated, filterable by type/frequency/status/category) |
| GET    | `/recurring-transactions/:id` | Get single                                                     |
| PATCH  | `/recurring-transactions/:id` | Update template fields                                         |
| DELETE | `/recurring-transactions/:id` | Delete template                                                |

### Actions

| Method | Path                                   | Description                                              |
| ------ | -------------------------------------- | -------------------------------------------------------- |
| PATCH  | `/recurring-transactions/:id/pause`    | Set status to PAUSED                                     |
| PATCH  | `/recurring-transactions/:id/resume`   | Set status to ACTIVE, advance nextOccurrence to future   |
| GET    | `/recurring-transactions/:id/upcoming` | Preview next N dates (query: `count`, default 5, max 12) |

### Request: Create

```json
{
  "categoryId": "uuid",
  "type": "EXPENSE",
  "amount": "1200.00",
  "currencyCode": "USD",
  "description": "Monthly rent",
  "frequency": "MONTHLY",
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2027-03-01T00:00:00.000Z"
}
```

### Request: Update (all optional)

```json
{
  "amount": "1300.00",
  "description": "Monthly rent (increased)",
  "frequency": "MONTHLY",
  "endDate": "2027-06-01T00:00:00.000Z"
}
```

When frequency or startDate changes, nextOccurrence is recalculated.

---

## Cron Job Design

**File:** `recurring-transactions.scheduler.ts` (within the recurring-transactions module)

### Schedule

Every 15 minutes: `@Cron('0 */15 * * * *')`

### Processing Flow

```
1. SELECT * FROM RecurringTransaction
   WHERE status = 'ACTIVE' AND nextOccurrence <= NOW()
   ORDER BY nextOccurrence ASC
   LIMIT 100
   FOR UPDATE SKIP LOCKED

2. For each item:
   a. Idempotency check: skip if lastProcessedAt >= nextOccurrence
   b. Within DB transaction:
      - INSERT into Transaction (with recurringTransactionId)
      - Compute next occurrence
      - If next > endDate → set status = 'COMPLETED'
      - Else → UPDATE nextOccurrence and lastProcessedAt
   c. Invalidate cache for user's transactions + recurring-transactions

3. If 100 rows returned → loop immediately to catch up backlog
```

### Error Handling

- Each item processed independently — one failure doesn't block others
- Failed items keep current nextOccurrence, retried next cycle
- Errors logged with recurring transaction ID

### Idempotency

- `lastProcessedAt` compared to `nextOccurrence` prevents duplicate generation
- `FOR UPDATE SKIP LOCKED` prevents concurrent processing of same item

---

## Next Occurrence Calculation

### Daily / Weekly

Simple date arithmetic: +1 day or +7 days.

### Monthly (Edge Case: End of Month)

Store the **anchor day** from startDate. When computing monthly next:

```
anchorDay = startDate.getUTCDate()  // e.g., 31
targetMonth = currentMonth + 1
daysInTargetMonth = getDaysInMonth(targetYear, targetMonth)
nextDay = Math.min(anchorDay, daysInTargetMonth)
```

Example: Jan 31 → Feb 28 → Mar 31 → Apr 30

### Yearly

Same logic for Feb 29 in non-leap years → Feb 28.

---

## Pause / Resume Logic

### Pause

- Set `status = 'PAUSED'`
- Do NOT change `nextOccurrence`
- Only ACTIVE templates can be paused

### Resume

- If `nextOccurrence` is in the past → advance to next future date (no backfill)
- If `endDate` has passed → set `status = 'COMPLETED'` instead
- Set `status = 'ACTIVE'`
- Only PAUSED templates can be resumed

---

## Business Rules

1. **Reject past startDate** on creation
2. **endDate must be after startDate** (if provided)
3. **Category must exist**, not be soft-deleted, and match the transaction type
4. **Amount must be positive**
5. **Cannot delete category** if referenced by a recurring transaction (restrict FK)
6. **Generated transactions survive template deletion** (SET NULL on FK)

---

## Caching Strategy

| Operation        | Cache Prefix                       | Invalidation                                           |
| ---------------- | ---------------------------------- | ------------------------------------------------------ |
| CRUD reads       | `recurring-transactions:{userId}:` | Template mutations (create/update/delete/pause/resume) |
| Upcoming preview | `recurring-transactions:{userId}:` | Same                                                   |

**Cross-module:** Cron job invalidates `transactions:{userId}:` after generating a transaction (+ `analytics:{userId}:` and `budgets-summary:{userId}:` if those features exist).

---

## Module Structure

```
src/modules/recurring-transactions/
  recurring-transactions.module.ts
  recurring-transactions.controller.ts
  recurring-transactions.service.ts
  recurring-transactions.repository.ts
  recurring-transactions.scheduler.ts    # @Cron job
  recurring-transactions.constants.ts    # Frequency/status enums + arrays
  dtos/
    create-recurring-transaction.dto.ts
    update-recurring-transaction.dto.ts
    recurring-transaction-query.dto.ts   # extends OffsetPaginationDto
    upcoming-query.dto.ts                # count param
```

## Files to Modify

- `src/database/schemas/enums.ts` — add RecurringFrequency, RecurringStatus enums
- `src/database/schemas/transactions.ts` — add recurringTransactionId column + index
- `src/database/schemas/index.ts` — export recurring-transactions schema
- `src/app.module.ts` — import RecurringTransactionsModule

---

## Implementation Complexity

This is the most complex of the three planned features due to:

- Schema changes to an existing table (transactions)
- Cron job with idempotency and concurrency requirements
- State machine (ACTIVE → PAUSED → ACTIVE → COMPLETED)
- Date arithmetic edge cases (end-of-month, leap years)

Recommend implementing after Analytics and Budgets.
