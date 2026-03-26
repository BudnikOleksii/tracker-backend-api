## Why

The Swagger/OpenAPI documentation has gaps that make the API reference incomplete and inconsistent. Six auth endpoints and the user summary endpoint lack `@ApiResponse` decorators, five controller tags are unregistered in the Swagger config, tag naming mixes lowercase and Title Case, and several endpoints return inline objects without typed response DTOs. These issues degrade the developer experience for API consumers and prevent accurate client code generation.

## What Changes

- Register all missing API tags in `swagger.config.ts` with consistent naming
- Add `@ApiResponse` decorators with proper response types to all undocumented endpoints (auth controller: 5 endpoints, user controller: 1 endpoint)
- Create response DTOs for endpoints that currently return untyped inline objects (logout, revoke token, revoke all tokens, refresh token info, user summary)
- Standardize tag naming to Title Case across all controllers and the Swagger config
- Add `description` fields to `@ApiProperty` decorators on DTOs that currently only have `example`

## Capabilities

### New Capabilities

- `swagger-response-coverage`: Ensure every endpoint has typed `@ApiResponse` decorators with proper response DTOs
- `swagger-tag-consistency`: Register all API tags in Swagger config with consistent Title Case naming

### Modified Capabilities

_(none)_

## Impact

- **Code:** `src/app/config/swagger.config.ts`, auth controller, user controller, and their DTOs directories
- **APIs:** No runtime behavior changes; only OpenAPI metadata changes
- **Dependencies:** None
- **Systems:** Swagger UI (`/swagger`) and Scalar docs (`/docs`) will display more complete and consistent documentation
