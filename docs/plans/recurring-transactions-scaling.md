# Recurring Transactions: Horizontal Scaling Migration

## Current State

Recurring transactions are processed by an in-app `@Cron` job in `ScheduledTasksService` that runs daily at midnight. This works correctly for a **single-instance deployment** (e.g., Railway with one replica).

## Problem

If the app scales to multiple instances, each instance runs its own `@nestjs/schedule` cron. The daily processing task would execute on **every instance simultaneously**, creating duplicate transactions.

## Migration Options

### Option A: Distributed Lock (Recommended for 2-3 instances)

Add a Redis-based distributed lock so only one instance processes at a time.

1. Before processing, acquire a Redis lock with a TTL (e.g., `SETNX recurring-tx-lock <instance-id> EX 300`)
2. Only the instance that acquires the lock proceeds
3. Lock auto-expires after TTL as a safety net

**Pros:** Minimal code change, uses existing Redis infrastructure
**Cons:** Still runs cron on all instances (most just no-op), lock contention at scale

### Option B: Dedicated Worker Process (Recommended for 3+ instances)

Separate the cron into a standalone worker process.

1. Create a separate NestJS app entry point (`src/worker.ts`) that only registers `ScheduleModule` and task-related modules
2. Deploy as a separate Railway service with a single replica
3. The main API instances no longer run any cron jobs

**Pros:** Clean separation, API instances are fully stateless, scales independently
**Cons:** Additional deployment artifact, slightly more infrastructure

### Option C: External Scheduler

Replace the in-app cron with an external trigger.

1. Remove `@Cron` decorator, keep the processing logic as a service method
2. Add a protected admin endpoint (e.g., `POST /admin/process-recurring-transactions`)
3. Use Railway cron job, AWS EventBridge, or GitHub Actions to call the endpoint on schedule

**Pros:** No duplicate execution by design, works at any scale
**Cons:** Requires external infrastructure, needs a service account/API key

## Recommendation

- **1 instance:** Keep current in-app cron (no change needed)
- **2-3 instances:** Add Redis distributed lock (Option A) — ~1 hour of work
- **4+ instances or microservice architecture:** Move to dedicated worker (Option B)

## Files to Modify

- `src/modules/scheduled-tasks/scheduled-tasks.service.ts` — add lock or remove cron
- `src/modules/cache/cache.service.ts` — expose raw Redis client for lock (Option A)
- `src/worker.ts` — new entry point (Option B)
