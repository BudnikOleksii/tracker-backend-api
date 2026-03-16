# Feature Plan: Budgets (Monthly Budget per Category)

## Overview

Users set monthly spending limits per category. The API tracks budget vs actual spending and flags when thresholds are approached or exceeded.

---

## Database Schema

**New file:** `src/database/schemas/budgets.ts`

| Column         | Type              | Notes                                           |
| -------------- | ----------------- | ----------------------------------------------- |
| id             | uuid              | PK, auto-generated                              |
| userId         | uuid              | FK → users.id, cascade delete                   |
| categoryId     | uuid              | FK → transactionCategories.id, restrict delete  |
| amount         | numeric(19,2)     | Budget limit                                    |
| currencyCode   | CurrencyCode enum | Must match transaction currency for aggregation |
| month          | integer           | 1-12                                            |
| year           | integer           | 2000-2100                                       |
| alertThreshold | numeric(3,2)      | Default 0.80 (80%). Range: 0.01-1.00            |
| createdAt      | timestamp         | Auto                                            |
| updatedAt      | timestamp         | Auto                                            |

**Unique constraint:** `(userId, categoryId, month, year, currencyCode)`
**Indexes:** userId, categoryId, (month, year)

---

## API Endpoints

All under `/budgets`, protected by `JwtAuthGuard`.

### CRUD

| Method | Path           | Description                                                          |
| ------ | -------------- | -------------------------------------------------------------------- |
| POST   | `/budgets`     | Create budget                                                        |
| GET    | `/budgets`     | List budgets (paginated, filterable by month/year/category/currency) |
| GET    | `/budgets/:id` | Get single budget                                                    |
| PATCH  | `/budgets/:id` | Update amount and/or alertThreshold only                             |
| DELETE | `/budgets/:id` | Delete budget                                                        |

### Summary (Key Endpoint)

**GET `/budgets/summary`** — All budgets for a given month with actual spending

Query params: `month` (required), `year` (required), `currencyCode` (optional)

Response shape per item:

```json
{
  "id": "uuid",
  "categoryId": "uuid",
  "categoryName": "Groceries",
  "budgetAmount": "500.00",
  "spentAmount": "375.50",
  "remainingAmount": "124.50",
  "percentUsed": 75.1,
  "alertThreshold": "0.80",
  "isOverThreshold": false,
  "isOverBudget": false,
  "currencyCode": "USD",
  "month": 3,
  "year": 2026
}
```

Totals included: `totalBudgeted`, `totalSpent`.

---

## Business Rules

1. **Only EXPENSE categories** — budgets track spending limits, not income targets
2. **Category must not be soft-deleted** when creating a budget
3. **No duplicate budgets** — unique constraint on (userId, categoryId, month, year, currencyCode)
4. **Amount must be positive** (> 0)
5. **Immutable identity fields** — categoryId, month, year, currencyCode cannot be changed after creation; delete and recreate instead
6. **Parent vs child categories** — budgets track direct transactions on the specific category only (not subcategories)
7. **Future months allowed** — users can plan ahead

---

## Summary Query Design

LEFT JOIN from budgets to transactions:

- Match on same userId, categoryId, currencyCode
- Filter transactions by type = EXPENSE, date within the month
- GROUP BY budget, COALESCE SUM for spent amount

Service layer computes: remainingAmount, percentUsed, isOverThreshold, isOverBudget.

---

## Caching Strategy

| Operation  | Cache Prefix                | Invalidation                             |
| ---------- | --------------------------- | ---------------------------------------- |
| CRUD reads | `budgets:{userId}:`         | Budget mutations                         |
| Summary    | `budgets-summary:{userId}:` | Budget mutations + Transaction mutations |

**Cross-module invalidation:** `TransactionsService.create/update/delete` must invalidate `budgets-summary:{userId}:` prefix.

---

## Module Structure

```text
src/modules/budgets/
  budgets.module.ts
  budgets.controller.ts        # Route /budgets/summary BEFORE /budgets/:id
  budgets.service.ts
  budgets.repository.ts
  dtos/
    create-budget.dto.ts
    update-budget.dto.ts
    budget-query.dto.ts         # extends OffsetPaginationDto
    budget-summary-query.dto.ts # month + year required, no pagination
```

## Files to Modify

- `src/database/schemas/index.ts` — export budgets schema
- `src/app.module.ts` — import BudgetsModule
- `src/modules/transactions/transactions.service.ts` — add budgets-summary cache invalidation
