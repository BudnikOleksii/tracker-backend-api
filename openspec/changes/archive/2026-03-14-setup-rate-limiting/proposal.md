## Why

The API currently has no rate limiting, leaving it vulnerable to brute-force attacks (especially on auth endpoints like login and token refresh), denial-of-service attempts, and general abuse. Adding rate limiting is a foundational security measure that protects both the service and its users.

## What Changes

- Install and configure `@nestjs/throttler` with Redis-backed storage for distributed rate limiting
- Apply a default global rate limit to all endpoints
- Configure stricter rate limits on sensitive auth endpoints (login, register, refresh-token)
- Add rate limit response headers (`X-RateLimit-*`, `Retry-After`) so clients can adapt
- Return standard `429 Too Many Requests` responses using the existing problem-details error format

## Capabilities

### New Capabilities

- `api-rate-limiting`: Global and per-endpoint rate limiting with Redis-backed storage, configurable limits via environment variables, and standard rate limit headers

### Modified Capabilities

_(none)_

## Impact

- **Dependencies**: New packages `@nestjs/throttler` and `ioredis`, with a custom `RedisThrottlerStorage` class for Redis-backed storage
- **App module**: ThrottlerModule registered globally with Redis store
- **Auth controller**: Decorated with stricter throttle limits
- **Environment config**: New env vars for default and auth-specific rate limit values (TTL, limit)
- **Error handling**: 429 responses integrated with existing ProblemDetailsFilter
