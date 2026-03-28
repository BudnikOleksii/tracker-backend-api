## 1. Database Schema

- [x] 1.1 Add `firstName` (text, nullable) and `lastName` (text, nullable) columns to the `users` schema in `src/database/schemas/users.ts`
- [x] 1.2 Generate and apply the database migration (`pnpm db:generate && pnpm db:migrate`)
- [x] 1.3 Update the seed data and user creation flows to include name fields where appropriate

## 2. Profile Module Setup

- [x] 2.1 Create `src/modules/profile/` directory with `profile.module.ts`, `profile.controller.ts`, and `profile.service.ts`
- [x] 2.2 Create `src/modules/profile/dtos/` directory with request/response DTOs
- [x] 2.3 Register the profile module in the app module

## 3. Profile DTOs

- [x] 3.1 Create `ProfileResponseDto` with fields: `id`, `email`, `firstName`, `lastName`, `countryCode`, `baseCurrencyCode`, `role`, `createdAt`, `updatedAt`
- [x] 3.2 Create `UpdateProfileDto` with optional fields: `firstName`, `lastName`, `countryCode`, `baseCurrencyCode`
- [x] 3.3 Create `ChangePasswordDto` with `currentPassword` and `newPassword` (min 8 chars)
- [x] 3.4 Create `DeleteAccountDto` with `password` field

## 4. Profile Service

- [x] 4.1 Implement `getProfile(userId)` — fetch user by ID and return profile data
- [x] 4.2 Implement `updateProfile(userId, dto)` — update allowed fields and return updated profile
- [x] 4.3 Implement `changePassword(userId, dto)` — verify current password, hash new password, update record
- [x] 4.4 Implement `deleteAccount(userId, dto)` — verify password, soft-delete user, revoke all refresh tokens

## 5. Profile Controller

- [x] 5.1 Implement `GET /profile` — returns authenticated user's profile
- [x] 5.2 Implement `PATCH /profile` — updates profile fields
- [x] 5.3 Implement `PATCH /profile/password` — changes password
- [x] 5.4 Implement `DELETE /profile` — soft-deletes account
- [x] 5.5 Add Swagger decorators and typed response DTOs to all endpoints

## 6. Integration

- [x] 6.1 Extend `UserRepository` to support fetching and updating the new name fields
- [x] 6.2 Extend `UserService.update()` to handle profile-relevant fields (name, country, currency)
- [x] 6.3 Add soft-delete method to `UserRepository` (set `deletedAt` instead of hard delete)
- [x] 6.4 Optionally extend `RegisterDto` to accept `firstName` and `lastName`

## 7. Validation & Verification

- [x] 7.1 Run `pnpm check-types` and fix any type errors
- [x] 7.2 Run `pnpm lint:fix` and `pnpm format`
- [x] 7.3 Verify all endpoints work correctly with manual or automated testing
