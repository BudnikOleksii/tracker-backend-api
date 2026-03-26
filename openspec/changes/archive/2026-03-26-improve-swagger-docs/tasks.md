## 1. Tag Consistency

- [x] 1.1 Update `@ApiTags('auth')` to `@ApiTags('Auth')` in auth controller
- [x] 1.2 Update `@ApiTags('health')` to `@ApiTags('Health')` in health controller
- [x] 1.3 Update tag registrations in `swagger.config.ts` to Title Case for existing tags (Health, Auth, Users, Audit Logs)
- [x] 1.4 Register missing tags in `swagger.config.ts`: Transactions, Budgets, Recurring Transactions, Transaction Categories, Transactions Analytics — each with a description

## 2. Auth Response DTOs

- [x] 2.1 Create `LogoutResponseDto` in `src/modules/auth/dtos/` with `success` (boolean) and `message` (string), both with `@ApiProperty` including `description` and `example`
- [x] 2.2 Create `RevokeTokenResponseDto` in `src/modules/auth/dtos/` with `success` (boolean) and `message` (string)
- [x] 2.3 Create `RevokeAllTokensResponseDto` in `src/modules/auth/dtos/` with `revokedCount` (number) and `message` (string)
- [x] 2.4 Create `RefreshTokenInfoDto` in `src/modules/auth/dtos/` matching the return shape of `GET /auth/refresh-token`
- [x] 2.5 Create `RefreshTokenListDto` in `src/modules/auth/dtos/` matching the return shape of `GET /auth/refresh-tokens`
- [x] 2.6 Export all new DTOs from the auth dtos barrel file (if one exists)

## 3. Auth Controller ApiResponse Decorators

- [x] 3.1 Add `@ApiResponse({ status: 200, type: LogoutResponseDto })` to `POST /auth/logout`
- [x] 3.2 Add `@ApiResponse({ status: 200, type: RevokeTokenResponseDto })` to `POST /auth/revoke-refresh-token`
- [x] 3.3 Add `@ApiResponse({ status: 200, type: RevokeAllTokensResponseDto })` to `POST /auth/revoke-refresh-tokens`
- [x] 3.4 Add `@ApiResponse({ status: 200, type: RefreshTokenInfoDto })` to `GET /auth/refresh-token`
- [x] 3.5 Add `@ApiResponse({ status: 200, type: RefreshTokenListDto })` to `GET /auth/refresh-tokens`

## 4. User Summary Response DTO

- [x] 4.1 Create `UserSummaryResponseDto` in `src/modules/user/dtos/` matching the return shape of `GET /users/summary`, with `@ApiProperty` including `description` and `example`
- [x] 4.2 Add `@ApiResponse({ status: 200, type: UserSummaryResponseDto })` to `GET /users/summary` in user controller

## 5. Verification

- [x] 5.1 Run `pnpm check-types` and verify no type errors
- [x] 5.2 Run `pnpm lint:fix` and `pnpm format`
- [ ] 5.3 Build the project and verify the OpenAPI spec at `/openapi.yaml` reflects all changes
