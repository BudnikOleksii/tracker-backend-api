## Why

The comprehensive audit (AUDIT.md) identified two remaining small-effort (S) improvements that harden the API against performance and reliability issues: HTTP response compression (#32) and database statement timeout (#33). Both are low-risk, high-value changes that protect against large payloads and runaway queries respectively.

## What Changes

- **Add HTTP response compression**: Install `compression` middleware to gzip/deflate API responses, reducing bandwidth for large JSON payloads (analytics, exports, lists).
- **Add database statement_timeout**: Configure a 30-second statement timeout on each new database connection to prevent runaway queries from holding connections indefinitely.
- **Update AUDIT.md**: Mark findings #32 and #33 as "Done" in the summary matrix.

## Capabilities

### New Capabilities

- `http-compression`: Adds gzip/deflate response compression via Express compression middleware
- `db-statement-timeout`: Adds a per-connection statement_timeout to the PostgreSQL pool

### Modified Capabilities

_(none — these are infrastructure-level changes that don't alter existing spec-level behavior)_

## Impact

- **Dependencies**: New `compression` and `@types/compression` packages added
- **Files**: `src/main.ts`, `src/database/database.provider.ts`, `AUDIT.md`
- **APIs**: No API contract changes; responses are transparently compressed based on `Accept-Encoding`
- **Risk**: Minimal — both are standard production hardening patterns
