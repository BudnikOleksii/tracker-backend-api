## Context

The API has 42 endpoints across 8 controllers. Only 8 (all in Auth) have typed `@ApiResponse` decorators. The remaining 34 use untyped `@ApiResponse({ status: 200 })`, which means the generated OpenAPI spec has no response schemas for most endpoints. This makes `@hey-api/openapi-ts` generate `unknown`/`void` return types.

The codebase already has well-defined return shapes in repositories (e.g. `TransactionInfo`, `BudgetInfo`) and services (e.g. `BudgetProgress`, analytics response objects). The existing `ListResponseDto<T>` and `OffsetListResponseDto<T>` in `src/shared/dtos/list-response.dto.ts` define the paginated envelope shape but lack `@ApiProperty` decorators and aren't referenced in Swagger.

## Goals / Non-Goals

**Goals:**

- Every endpoint has a typed `@ApiResponse` decorator referencing a DTO class
- `@hey-api/openapi-ts` generates correct request and response types for all endpoints
- Paginated list responses have concrete DTOs describing the `{ object, data, total, page, pageSize, hasMore }` envelope with the correct item type
- Analytics, budget progress, and other complex responses have dedicated DTOs

**Non-Goals:**

- Changing any runtime behavior or business logic
- Adding new endpoints or modifying existing response shapes
- Generic/polymorphic Swagger schemas (NestJS Swagger doesn't support true generics well)
- Documenting WebSocket or non-HTTP interfaces

## Decisions

### 1. Concrete paginated DTOs per module (no Swagger generics)

NestJS Swagger's `@ApiExtraModels` + `getSchemaPath` + `allOf` pattern for generics produces verbose, hard-to-read OpenAPI specs that many code generators handle poorly. Instead, create concrete classes like `TransactionListResponseDto` that extend a non-decorated base or simply declare all fields with `@ApiProperty`.

**Alternative considered:** Using `@ApiExtraModels` with `getSchemaPath` for a generic `PaginatedResponse<T>`. Rejected because generated OpenAPI uses `allOf` composition which `hey-api` and other generators sometimes flatten incorrectly.

**Approach:** Each module gets a `*ListResponseDto` class with all pagination fields plus a typed `data` array. A shared abstract base or mixin can reduce boilerplate but the Swagger decorators must be on each concrete class.

### 2. Response DTOs mirror repository Info types

Each module's response DTO (e.g. `TransactionResponseDto`) will have the same fields as the repository's `*Info` interface, decorated with `@ApiProperty`. This avoids drift — the DTO is the Swagger representation of what the service actually returns.

**Alternative considered:** Reusing repository interfaces directly. Rejected because interfaces can't carry `@ApiProperty` decorators — NestJS Swagger requires classes.

### 3. Shared MessageResponseDto for delete/action endpoints

Several endpoints return `{ message: string }`. Rather than creating per-endpoint DTOs for these, a single shared `MessageResponseDto` in `src/shared/dtos/` covers all of them.

### 4. Analytics response DTOs in the analytics module

Each analytics endpoint returns a unique shape. Create one DTO per endpoint (`SummaryResponseDto`, `CategoryBreakdownResponseDto`, `TrendsResponseDto`, `TopCategoriesResponseDto`, `DailySpendingResponseDto`) in the analytics module's `dtos/` folder, with nested item DTOs extracted as separate classes in the same file.

### 5. Auth nested user object extracted to UserInfoDto

The `AuthResponseDto.user` inline object becomes a proper `AuthUserDto` class with `@ApiProperty` decorators, referenced via `@ApiProperty({ type: AuthUserDto })`.

## Risks / Trade-offs

- **DTO proliferation** → Many new files, but they're small, self-contained, and follow existing patterns. The trade-off is worth it for full type coverage.
- **Drift between DTOs and actual return types** → Mitigated by naming DTOs to match repository interfaces. No runtime validation of responses (Swagger DTOs are documentation-only), so developers must keep them in sync manually.
- **Maintenance overhead** → Each new endpoint or response shape change requires updating the corresponding DTO. This is standard NestJS Swagger practice.
