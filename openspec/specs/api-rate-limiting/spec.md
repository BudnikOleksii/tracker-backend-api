## ADDED Requirements

### Requirement: Global rate limiting on all endpoints

The system SHALL enforce a default rate limit on all API endpoints. The default limit SHALL be configurable via `THROTTLE_TTL` and `THROTTLE_LIMIT` environment variables. Requests exceeding the limit SHALL be rejected.

#### Scenario: Request within global limit

- **WHEN** a client sends requests within the configured global limit (default: 60 requests per 60 seconds)
- **THEN** the system SHALL process each request normally and include rate limit headers in the response

#### Scenario: Request exceeding global limit

- **WHEN** a client exceeds the configured global rate limit within the time window
- **THEN** the system SHALL respond with HTTP 429 Too Many Requests, a `Retry-After` header indicating when the client can retry, and a problem-details JSON body

### Requirement: Stricter rate limiting on auth endpoints

The system SHALL enforce stricter rate limits on authentication endpoints (login, register, refresh-token). The auth limit SHALL be configurable via `THROTTLE_AUTH_TTL` and `THROTTLE_AUTH_LIMIT` environment variables.

#### Scenario: Auth request within stricter limit

- **WHEN** a client sends auth requests within the configured auth limit (default: 5 requests per 60 seconds)
- **THEN** the system SHALL process each request normally

#### Scenario: Auth request exceeding stricter limit

- **WHEN** a client exceeds the configured auth rate limit within the time window
- **THEN** the system SHALL respond with HTTP 429 Too Many Requests before any authentication logic executes

### Requirement: Rate limit response headers

The system SHALL include standard rate limit headers in all responses to inform clients of their current rate limit status.

#### Scenario: Headers present on successful response

- **WHEN** a client sends a request that is processed successfully
- **THEN** the response SHALL include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers

#### Scenario: Headers present on 429 response

- **WHEN** a client is rate limited
- **THEN** the response SHALL include `Retry-After` header along with the rate limit headers

### Requirement: Health check endpoints excluded from rate limiting

The system SHALL exclude health check and readiness endpoints from rate limiting to prevent monitoring false alarms.

#### Scenario: Health check not rate limited

- **WHEN** a monitoring system sends frequent requests to the health check endpoint
- **THEN** the system SHALL never return a 429 response for these endpoints

### Requirement: Redis-backed distributed rate limiting

The system SHALL use Redis as the backing store for rate limit counters to ensure consistent enforcement across multiple application instances.

#### Scenario: Rate limit enforced across instances

- **WHEN** a client sends requests that are load-balanced across multiple API instances
- **THEN** the rate limit counter SHALL be shared via Redis and the total request count across all instances SHALL be tracked as one

### Requirement: Configurable rate limits via environment

The system SHALL validate rate limit configuration at startup using the existing Zod-based env schema. All rate limit values SHALL have sensible defaults.

#### Scenario: Application starts with default config

- **WHEN** the application starts without rate limit environment variables set
- **THEN** the system SHALL use default values (global: 60 req/60s, auth: 5 req/60s)

#### Scenario: Application starts with custom config

- **WHEN** the application starts with `THROTTLE_LIMIT=100` and `THROTTLE_TTL=30000`
- **THEN** the system SHALL enforce 100 requests per 30 seconds as the global limit
