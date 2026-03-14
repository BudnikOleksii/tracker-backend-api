## 1. Dependencies & Configuration

- [x] 1.1 Install `@nestjs/throttler` and `ioredis` packages (exact versions, no ^ or ~)
- [x] 1.2 Add `THROTTLE_TTL`, `THROTTLE_LIMIT`, `THROTTLE_AUTH_TTL`, `THROTTLE_AUTH_LIMIT` to `env.schema.ts` with Zod validation and defaults (60000, 60, 60000, 5)
- [x] 1.3 Add throttle env vars to `Env` type and wire into ConfigModule

## 2. ThrottlerModule Setup

- [x] 2.1 Register `ThrottlerModule.forRootAsync` in `AppModule` with Redis storage using `REDIS_URL` and env-based TTL/limit config
- [x] 2.2 Register `ThrottlerGuard` as a global guard (`APP_GUARD`) in `AppModule` providers

## 3. Per-Route Overrides

- [x] 3.1 Apply `@Throttle()` with stricter auth limits on auth controller endpoints (login, register, refresh-token)
- [x] 3.2 Apply `@SkipThrottle()` on health check endpoint(s)

## 4. Response Headers & Error Handling

- [x] 4.1 Configure throttler to include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on all responses
- [x] 4.2 Ensure 429 responses include `Retry-After` header and conform to the existing problem-details error format

## 5. Verification

- [x] 5.1 Run `pnpm check-types`, `pnpm lint:fix`, `pnpm format` and fix any issues
- [ ] 5.2 Manually verify rate limiting works: normal requests succeed, exceeding limits returns 429
