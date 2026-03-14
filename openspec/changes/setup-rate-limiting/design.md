## Context

The tracker backend API has no rate limiting. Redis is already available (used for caching via `@nestjs/cache-manager` + `@keyv/redis`). The project uses NestJS 11, global guards/filters are wired in `app.module.ts` and `main.ts`, and auth endpoints (login, register, refresh-token, logout) are the most abuse-sensitive surfaces.

## Goals / Non-Goals

**Goals:**

- Protect all endpoints with a sensible default rate limit
- Apply stricter limits to auth endpoints to prevent brute-force attacks
- Use Redis as the backing store so limits work across multiple instances
- Make limits configurable via environment variables
- Return standard rate limit headers and 429 responses compatible with the existing error format

**Non-Goals:**

- Per-user or per-API-key rate limiting (future enhancement)
- Rate limiting WebSocket connections (not applicable currently)
- Dynamic rate limit adjustment or admin UI
- IP allowlisting/blocklisting

## Decisions

### 1. Use `@nestjs/throttler` with Redis storage

**Choice**: `@nestjs/throttler` v6+ with a custom `RedisThrottlerStorage` implementation using `ioredis`

**Alternatives considered**:

- **Custom guard with Redis**: Full control but significant implementation effort for standard functionality
- **Express `rate-limit` middleware**: Doesn't integrate with NestJS decorator system, harder to apply per-route overrides

**Rationale**: `@nestjs/throttler` is the official NestJS solution, supports decorator-based per-route overrides via `@Throttle()`, and has mature Redis storage adapters. It fits the existing guard pattern.

### 2. Global guard with per-route overrides

**Choice**: Register `AppThrottlerGuard` (extends `ThrottlerGuard`) globally in `AppModule`. The custom guard scopes the named "auth" throttler so it only applies to routes explicitly decorated with `@Throttle({ auth: {} })`. Use `@SkipThrottle()` to exclude health checks.

**Rationale**: Ensures every endpoint is protected by the "default" throttler. Auth endpoints opt into the stricter "auth" throttler via decorator. Health/readiness endpoints are excluded to avoid false alerts from monitoring.

### 3. Redis storage via existing connection

**Choice**: Configure the throttler Redis storage to use the same `REDIS_URL` already defined in the env schema.

**Rationale**: No new infrastructure needed. Redis is already a dependency.

### 4. Configuration via environment variables

**Choice**: Add to `env.schema.ts`:

- `THROTTLE_TTL` (default: 60000ms) — time window in milliseconds
- `THROTTLE_LIMIT` (default: 60) — max requests per window
- `THROTTLE_AUTH_TTL` (default: 60000ms) — auth endpoint time window
- `THROTTLE_AUTH_LIMIT` (default: 5) — auth endpoint max requests per window

**Rationale**: Allows tuning per environment (dev can be lenient, prod strict) without code changes.

### 5. Track by IP address

**Choice**: Use the default client IP tracking (from `req.ip`).

**Rationale**: Simplest approach that covers the primary abuse vector. Per-user tracking is a non-goal for this iteration.

## Risks / Trade-offs

- **Shared Redis dependency** — If Redis goes down, rate limiting fails. → Mitigation: Configure throttler to fail-open (allow requests) if Redis is unavailable, rather than blocking all traffic.
- **Reverse proxy IP masking** — If behind a load balancer, `req.ip` may be the proxy IP. → Mitigation: Document that `trust proxy` must be configured in production (NestJS/Express setting).
- **Overly strict defaults blocking legitimate use** — → Mitigation: Defaults are generous (60 req/min global, 5 req/min auth). All values are env-configurable.
