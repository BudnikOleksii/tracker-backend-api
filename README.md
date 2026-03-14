# Tracker Backend API

Personal finance tracker REST API built with NestJS, Drizzle ORM, PostgreSQL, and Redis.

## Tech Stack

- **Runtime:** Node.js >= 22
- **Framework:** NestJS 11
- **ORM:** Drizzle ORM with PostgreSQL
- **Cache:** Redis via cache-manager
- **Auth:** JWT (access + refresh tokens) with Passport
- **Validation:** Zod (env), class-validator (DTOs)
- **API Docs:** Swagger / Scalar
- **Package Manager:** pnpm 10

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Docker (for PostgreSQL and Redis)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379) with default credentials.

### 3. Configure environment

Create a `.env` file in the project root. Available variables:

| Variable                 | Default                                                  | Description                                |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------ |
| `NODE_ENV`               | `development`                                            | `development`, `production`, `test`        |
| `PORT`                   | `3000`                                                   | Server port                                |
| `DATABASE_URL`           | `postgresql://tracker:tracker123@localhost:5432/tracker` | PostgreSQL connection string               |
| `DB_POOL_MAX`            | `20`                                                     | Max DB pool connections                    |
| `DB_POOL_MIN`            | `5`                                                      | Min DB pool connections                    |
| `JWT_SECRET`             | _(must be >= 32 chars)_                                  | Secret for signing JWTs                    |
| `JWT_EXPIRES_IN`         | `15m`                                                    | Access token TTL (e.g. `60s`, `15m`, `2h`) |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                                     | Refresh token TTL                          |
| `REDIS_URL`              | `redis://localhost:6379`                                 | Redis connection string                    |
| `REDIS_TTL`              | `3600`                                                   | Cache TTL in seconds                       |
| `ALLOWED_ORIGINS`        | _(optional)_                                             | Comma-separated CORS origins               |
| `API_BASE_URL`           | `https://api.example.com`                                | Public API base URL                        |

### 4. Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start the server

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`. Swagger docs are served at `/api/docs`.

## Commands

### Development

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start in watch mode               |
| `pnpm start`       | Start without watch               |
| `pnpm start:debug` | Start with debugger in watch mode |
| `pnpm start:prod`  | Start from compiled `dist/`       |
| `pnpm build`       | Compile the project               |

### Database

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm db:generate` | Generate migrations from schema changes |
| `pnpm db:migrate`  | Apply pending migrations                |
| `pnpm db:push`     | Push schema directly (skip migrations)  |
| `pnpm db:seed`     | Seed the database with sample data      |
| `pnpm db:studio`   | Open Drizzle Studio (visual DB browser) |

### Code Quality

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm lint`         | Run ESLint                       |
| `pnpm lint:fix`     | Run ESLint with auto-fix         |
| `pnpm format`       | Format code with Prettier        |
| `pnpm format:check` | Check formatting without writing |
| `pnpm check-types`  | Run TypeScript type checking     |

## Project Structure

```
src/
  app/              # App module, config, env validation
  database/
    schemas/        # Drizzle table definitions
    seeds/          # Database seeders
    data/           # Seed data files
  modules/
    auth/           # Authentication (JWT, refresh tokens, login logs)
    user/           # User management (CRUD, roles)
    audit-log/      # Audit logging
    cache/          # Redis caching
    scheduled-tasks/# Cron jobs (e.g. expired token cleanup)
  shared/
    decorators/     # Custom decorators (validation, roles)
    dtos/           # Shared DTOs (pagination)
    enums/          # Shared enums (roles, error codes)
    guards/         # Auth and role guards
```
