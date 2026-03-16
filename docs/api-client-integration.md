# API Client Integration Guide

This guide explains how to generate a typed API client for the Tracker API using `@hey-api/openapi-ts`.

## Prerequisites

- The backend server must be running (`pnpm start:dev`)
- Node.js >= 22, pnpm 10

## Available API Documentation Endpoints

| Endpoint        | Format | Description                         |
| --------------- | ------ | ----------------------------------- |
| `/swagger-json` | JSON   | OpenAPI spec — use this for codegen |
| `/openapi.yaml` | YAML   | OpenAPI spec (alternative format)   |
| `/swagger`      | HTML   | Swagger UI (interactive explorer)   |
| `/docs`         | HTML   | Scalar API reference                |

## Frontend Setup

### 1. Install dependencies

```bash
pnpm add @hey-api/client-fetch
pnpm add -D @hey-api/openapi-ts
```

### 2. Create config file

Create `openapi-ts.config.ts` in the frontend project root:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3000/swagger-json',
  output: 'src/client',
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
});
```

### 3. Add a script to `package.json`

```json
{
  "scripts": {
    "generate:api": "openapi-ts"
  }
}
```

### 4. Generate the client

```bash
pnpm generate:api
```

This creates typed files in `src/client/`:

- `client.gen.ts` — HTTP client configuration
- `types.gen.ts` — TypeScript types for all request/response schemas
- `sdk.gen.ts` — Typed functions for every API endpoint

## Usage

### Configure the client

```ts
import { client } from './client/client.gen';

client.setConfig({
  baseUrl: 'http://localhost:3000',
  auth: () => localStorage.getItem('accessToken'),
});
```

### Make typed API calls

```ts
import { AuthController_login, TransactionsController_findAll } from './client/sdk.gen';

// Login
const { data, error } = await AuthController_login({
  body: { email: 'user@example.com', password: 'password' },
});

// Fetch transactions (fully typed params and response)
const { data: transactions } = await TransactionsController_findAll({
  query: { page: 1, limit: 20 },
});
```

Operation names follow the pattern `{ControllerName}_{methodName}`, matching the `operationId` in the spec.

### Add interceptors

```ts
import { client } from './client/client.gen';

// Add auth token to every request
client.interceptors.request.use(async (request) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// Handle 401 globally
client.interceptors.response.use(async (response) => {
  if (response.status === 401) {
    // redirect to login or refresh token
  }
  return response;
});
```

## Keeping the Client Up to Date

Re-run `pnpm generate:api` whenever the backend API changes. The backend must be running when you generate.

To see what changed in the spec, you can diff the generated files:

```bash
pnpm generate:api && git diff src/client/
```
