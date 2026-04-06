## MODIFIED Requirements

### Requirement: Swagger disabled in production

The `setupSwagger()` function SHALL NOT be called when `NODE_ENV` is `'production'`. The `/swagger`, `/docs`, and `/openapi.yaml` routes MUST NOT be registered in production environments.

#### Scenario: Development environment

- **WHEN** the application starts with `NODE_ENV=development`
- **THEN** Swagger UI at `/swagger`, Scalar docs at `/docs`, and OpenAPI YAML at `/openapi.yaml` are available

#### Scenario: Production environment

- **WHEN** the application starts with `NODE_ENV=production`
- **THEN** requests to `/swagger`, `/docs`, and `/openapi.yaml` return 404
