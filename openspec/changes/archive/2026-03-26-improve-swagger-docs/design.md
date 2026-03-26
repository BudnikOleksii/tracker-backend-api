## Context

The Tracker API uses NestJS Swagger (v11.2.6) with Scalar for API reference UI. The current setup has a solid foundation — all controllers use `@ApiTags` and `@ApiOperation`, DTOs use `@ApiProperty` with examples, and a global handler applies `ProblemDetailsDto` to all endpoints. However, several gaps exist: 6 auth endpoints and 1 user endpoint lack `@ApiResponse` decorators, 5 of 9 controller tags are unregistered in the Swagger config, tag naming is inconsistent (lowercase vs Title Case), and some endpoints return inline objects without typed response DTOs.

## Goals / Non-Goals

**Goals:**

- Every endpoint has typed `@ApiResponse` decorators for all success and error status codes
- All API tags are registered in `swagger.config.ts` with descriptions
- Tag naming follows a single convention (Title Case) across controllers and config
- Endpoints returning inline objects have proper response DTOs
- DTO `@ApiProperty` decorators include `description` fields alongside existing `example` values

**Non-Goals:**

- Adding `@ApiQuery` or `@ApiParam` decorators (NestJS infers these from DTOs and route params)
- Adding request/response examples at the endpoint level
- Changing any runtime behavior or business logic
- Refactoring the Swagger config architecture (it's already well-structured)
- Adding API versioning or deprecation markers

## Decisions

### 1. Title Case for all API tags

All tags will use Title Case (e.g., "Auth", "Health", "Transactions"). Currently `auth` and `health` are lowercase while others are Title Case. Title Case is more readable in Swagger UI and is the dominant convention in the codebase (7 of 9 controllers already use it).

**Alternative considered:** Lowercase kebab-case — rejected because it would require changing 7 controllers instead of 2, and reads worse in UI.

### 2. Create response DTOs for inline auth responses

Five auth endpoints return ad-hoc objects like `{ success: true, message: '...' }` or `{ revokedCount: number, message: '...' }`. These will get dedicated response DTOs in `src/modules/auth/dtos/` to ensure the OpenAPI schema is accurate.

**DTOs to create:**

- `LogoutResponseDto` — `{ success: boolean, message: string }`
- `RevokeTokenResponseDto` — `{ success: boolean, message: string }`
- `RevokeAllTokensResponseDto` — `{ revokedCount: number, message: string }`
- `RefreshTokenInfoDto` — for single refresh token info
- `RefreshTokenListDto` — for listing refresh tokens

**Alternative considered:** Using `@ApiExtraModels` with inline schema — rejected because typed DTOs are more maintainable and consistent with the project's DTO-first approach.

### 3. Create a UserSummaryResponseDto

The `GET /users/summary` endpoint returns aggregate stats without a typed response. A `UserSummaryResponseDto` will be created in `src/modules/user/dtos/`.

### 4. Add descriptions incrementally, not exhaustively

Rather than adding `description` to every `@ApiProperty` across all DTOs (a large, noisy change), descriptions will be added only to the DTOs being touched as part of this change (new response DTOs and the auth/user DTOs that get `@ApiResponse` updates). This keeps the diff focused.

**Alternative considered:** Adding descriptions to all DTOs — rejected because it would touch 20+ files for minimal incremental value and creates a large review surface.

## Risks / Trade-offs

- **[Low] Tag rename could break client code generators** — Clients using generated SDKs keyed on tag names (e.g., `authApi` vs `AuthApi`) may see method name changes. → Mitigation: This is a metadata-only change with no runtime impact, and the project has no published SDK.
- **[Low] New DTOs add maintenance surface** — Five new response DTOs in auth module. → Mitigation: These are small, stable DTOs matching existing return shapes. They prevent inline objects which are harder to maintain.
