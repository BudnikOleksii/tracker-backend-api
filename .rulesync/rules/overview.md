---
root: true
targets: ['*']
description: 'Project overview and general development guidelines'
globs: ['**/*']
---

## Tech Stack

- Node.js >= 22, pnpm 10, TypeScript (strict), ESM
- NestJS 11 (framework), Drizzle ORM (database), PostgreSQL 15, Redis 7
- JWT + Passport (auth), Zod (env validation), class-validator (DTO validation)
- Swagger + Scalar (API docs), Pino (logging), SWC (compilation)

## General Guidelines

- All package versions must be exact (no ^ or ~ prefixes)
- Prefer self-documented code
- Use `import type` for type-only imports (required for ESM compatibility)
- Path alias: `@/*` maps to `src/*`

## Commands (run after every task)

```bash
pnpm check-types    # TypeScript type checking (must pass)
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier formatting
```

## Repository Structure

```
src/
  app/                  # App bootstrap, config, env schema (env.schema.ts)
  database/
    schemas/            # Drizzle table definitions (one file per table + enums.ts)
    seeds/              # Database seeders
    data/               # Seed data (JSON)
  modules/
    <module>/
      <module>.module.ts       # NestJS module
      <module>.controller.ts   # HTTP layer (routes, request/response)
      <module>.service.ts      # Business logic
      <module>.repository.ts   # Database queries (only layer that touches DB)
      dtos/                    # Request/response DTOs with validation decorators
  shared/
    decorators/         # Custom decorators (validation helpers, roles)
    dtos/               # Shared DTOs (pagination)
    enums/              # Shared enums (roles, error codes)
    guards/             # Auth and role guards
    types/              # Shared TypeScript types
```

## Architecture Rules

- **Controllers** handle HTTP concerns only (params, auth, response shape)
- **Services** contain business logic; they call repositories, never the DB directly
- **Repositories** are the only layer that interacts with Drizzle/DB
- Shared enums (e.g. `UserRole`) derive from Drizzle schema enums as the single source of truth
- Database schema changes: edit `src/database/schemas/`, then run `pnpm db:generate` and `pnpm db:migrate`
- New modules go in `src/modules/<name>/` following the existing pattern
- Shared utilities go in `src/shared/`

## Database

```bash
pnpm db:generate    # Generate migration from schema changes
pnpm db:migrate     # Apply pending migrations
pnpm db:seed        # Seed database with sample data
pnpm db:studio      # Open Drizzle Studio
```

Infrastructure: `docker compose -f docker/docker-compose.yml up -d`
