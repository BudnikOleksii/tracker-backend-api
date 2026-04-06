## Context

The tracker backend API has completed all P0, P1, and most P2 audit findings. Two P3 small-effort items remain:

1. **No HTTP compression** — API responses (especially analytics JSON and transaction exports) are sent uncompressed, wasting bandwidth.
2. **No statement_timeout** — A malformed or expensive query can hold a connection indefinitely, eventually exhausting the pool.

Current state:

- `main.ts` already uses `helmet()` and `cookieParser()` middleware on an Express app.
- `database.provider.ts` exposes `createPool()` returning a `pg.Pool` and `createDrizzleInstance()` wrapping it with Drizzle.

## Goals / Non-Goals

**Goals:**

- Add transparent gzip/deflate compression to all HTTP responses
- Add a 30-second statement timeout to every new PostgreSQL connection
- Keep both changes minimal and non-breaking

**Non-Goals:**

- Custom per-route compression settings
- Configurable statement timeout via environment variables (can be added later if needed)
- Brotli compression (Express `compression` doesn't support it natively)

## Decisions

### 1. Use Express `compression` middleware

**Choice:** `compression` npm package (standard Express middleware).

**Rationale:** It's the de-facto standard for Express/NestJS apps, handles content negotiation automatically, and skips compression for small responses. Alternatives like Brotli-capable `shrink-ray-current` add complexity without meaningful benefit behind a reverse proxy.

**Placement:** After `helmet()` and before route registration in `main.ts`, so all responses are compressed.

### 2. Use `pool.on('connect')` for statement_timeout

**Choice:** Set `statement_timeout` via `pool.on('connect', client => client.query("SET statement_timeout = '30s'"))` in `createPool()`.

**Rationale:** This runs once per new connection (not per query), is the standard pg pattern, and doesn't require Drizzle-level changes. Alternative: passing `statement_timeout` in the connection string — but `pool.on('connect')` is more explicit and easier to find.

**Timeout value:** 30 seconds matches the existing `TimeoutInterceptor(30_000)` in `main.ts`, keeping HTTP and DB timeouts aligned.

## Risks / Trade-offs

- **[Compression CPU overhead]** → Negligible for JSON payloads. In production behind a reverse proxy (nginx/CloudFront), the proxy typically handles compression and `Accept-Encoding` won't reach the app. No mitigation needed.
- **[statement_timeout kills long exports]** → The export endpoint streams results and individual queries should complete well under 30s. If a future query legitimately needs >30s, it can `SET LOCAL statement_timeout = '120s'` within its transaction.
- **[No env-configurable timeout]** → Hardcoded 30s is sufficient for now. Can be extracted to an env var in a future change if needed.
