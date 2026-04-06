## Context

The audit identified 6 small-effort P2 issues: duplicated pagination logic across 7 controllers, a no-op interceptor/decorator pair, Swagger exposed in production, inconsistent validator decorators in 6 DTOs, missing CHECK constraints on Budget/Transaction, and unique indexes that allow duplicate NULLs. All P0 and P1 fixes have been addressed; these are the remaining quick wins.

## Goals / Non-Goals

**Goals:**

- Eliminate pagination code duplication across 7 controllers
- Remove dead code (TransformInterceptor + UseEnvelope decorator)
- Prevent Swagger/Scalar exposure in production
- Achieve consistent use of `*Field()` validator wrappers with ErrorCode context
- Add database-level data integrity constraints (CHECK + NULLS NOT DISTINCT)

**Non-Goals:**

- Changing the pagination response shape or API contract
- Adding authentication to Swagger (just disabling in prod)
- Migrating date columns to `timestamptz` (separate P2 item)
- Adding new validator wrapper functions beyond what already exists

## Decisions

### 1. Pagination helper as a pure function, not an interceptor

Create `buildPaginatedResponse(query, result)` in `src/shared/utils/pagination.utils.ts`. A simple function is easier to understand and type than an interceptor-based approach. Controllers call it explicitly, keeping the response shape visible at the call site.

**Alternative considered:** NestJS interceptor that auto-wraps responses. Rejected because it hides the response shape, makes typing harder, and couples controllers to metadata conventions — the exact problems the current `TransformInterceptor` demonstrates.

### 2. Full removal of TransformInterceptor rather than completing it

The interceptor does nothing (both branches return `data` unchanged). Completing it would duplicate the new pagination helper's job. Clean removal is simpler and eliminates confusion.

### 3. Environment gate for Swagger via NODE_ENV check in main.ts

Wrap the `setupSwagger(app)` call in `main.ts` with `if (env.NODE_ENV !== 'production')`. This is the simplest approach — no new config, no auth middleware. The `NODE_ENV` is already validated by Zod env schema.

**Alternative considered:** Basic auth on Swagger routes. Rejected as over-engineering for this stage; full disable is safer and simpler.

### 4. CHECK constraints via Drizzle schema `.check()` method

Drizzle ORM supports `.check()` in table definitions. Add `CHECK (amount > 0)` on Transaction and `CHECK ("endDate" > "startDate")` on Budget directly in schema files. Generate and apply migration.

### 5. NULLS NOT DISTINCT via raw SQL in unique index

Drizzle's `uniqueIndex()` doesn't have a built-in `nullsNotDistinct()` method on the index builder. Use `.on(...columns).where(sql\`...\`)`or Drizzle's`.unique()`with`.nullsNotDistinct()` if available. Verify Drizzle API before implementation.

## Risks / Trade-offs

- **CHECK constraint on existing data** → Run a validation query before migration to ensure no existing rows violate the constraints. If violations exist, fix data first.
- **NULLS NOT DISTINCT on existing duplicates** → If duplicate root categories already exist, the migration will fail. Need to deduplicate before applying the index change.
- **Swagger disable breaks staging if NODE_ENV=production** → Document that staging should use `NODE_ENV=staging` or `NODE_ENV=development` to retain docs access.
