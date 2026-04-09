## 1. Database Schema & Migration

- [x] 1.1 Change `onboardingCompleted` default from `true` to `false` in `src/database/schemas/users.ts`
- [x] 1.2 Run `pnpm db:generate` to create the migration (verify it only changes the default, not existing rows)
- [x] 1.3 Run `pnpm db:migrate` to apply the migration

## 2. Mailer Module

- [x] 2.1 Add `nodemailer` as a dependency (`pnpm add nodemailer` and `pnpm add -D @types/nodemailer`)
- [x] 2.2 Add SMTP env vars to `src/app/config/env.schema.ts` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` — all optional)
- [x] 2.3 Add `EMAIL_VERIFICATION_REDIRECT_URL` and `APP_URL` env vars to the env schema (optional)
- [x] 2.4 Create `src/modules/mailer/mailer.module.ts` — global module exporting `MailerService`
- [x] 2.5 Create `src/modules/mailer/mailer.service.ts` — `sendMail(to, subject, html)` via Nodemailer SMTP transport; no-op with warning when SMTP not configured; `sendVerificationEmail(email, token)` method
- [x] 2.6 Register `MailerModule` in `AppModule`

## 3. Email Verification

- [x] 3.1 Add `verifyEmail(token)` method to `UserRepository` — find user by `emailVerificationToken`, validate expiry, set `emailVerified: true`, clear token fields
- [x] 3.2 Add `setEmailVerificationToken(userId, token, expiresAt)` method to `UserRepository`
- [x] 3.3 Add `GET /auth/verify-email?token=` endpoint to `AuthController` — validate token via user repository, redirect to `EMAIL_VERIFICATION_REDIRECT_URL` with success or error query params
- [x] 3.4 Update `AuthService.register` to generate verification token, store it, and send verification email via `MailerService` (fire-and-forget, don't block registration on email send failure)

## 4. Registration Flow Changes

- [x] 4.1 Remove `firstName` and `lastName` from `RegisterDto` (`src/modules/auth/dtos/register.dto.ts`)
- [x] 4.2 Update `AuthController.register` to stop passing `firstName`/`lastName` to the service
- [x] 4.3 Update `AuthService.register` — remove `firstName`/`lastName` from params, remove `defaultTransactionCategoriesService.assignDefaultCategoriesToUser` call
- [x] 4.4 Update `UserService.create` to no longer accept `firstName`/`lastName` params
- [x] 4.5 Remove `DefaultTransactionCategoriesService` import/injection from `AuthService` if no longer used there

## 5. Social Auth Changes

- [x] 5.1 Update `UserService.createSocialUser` to set `emailVerified: true` on user creation
- [x] 5.2 Update `AuthService.socialLogin` — remove `defaultTransactionCategoriesService.assignDefaultCategoriesToUser` call for new social users
- [x] 5.3 Verify social auth still returns `isNewUser: true` for new registrations (BFF uses this)

## 6. Onboarding Module

- [x] 6.1 Create module structure: `src/modules/onboarding/onboarding.module.ts`, `onboarding.controller.ts`, `onboarding.service.ts`
- [x] 6.2 Create `src/modules/onboarding/dtos/complete-onboarding.dto.ts` — `baseCurrencyCode` (required, validated against `CurrencyCode` enum), `password` (optional, min 8 chars, letter + digit)
- [x] 6.3 Create `src/modules/onboarding/dtos/onboarding-status-response.dto.ts` — `onboardingCompleted`, `emailVerified`, `hasBaseCurrency`, `hasCategories`, `hasPassword`
- [x] 6.4 Implement `OnboardingService.getStatus(userId)` — query user + category count, return status object
- [x] 6.5 Implement `OnboardingService.complete(userId, dto)` — validate user not already onboarded, validate category count > 0, update `baseCurrencyCode`, optionally set password (only for social auth users with no passwordHash), set `onboardingCompleted: true`
- [x] 6.6 Implement `OnboardingService.assignDefaultCategories(userId)` — check if user has categories, if not call `DefaultTransactionCategoriesService.assignDefaultCategoriesToUser`
- [x] 6.7 Add `GET /onboarding/status` endpoint (JWT protected)
- [x] 6.8 Add `POST /onboarding/complete` endpoint (JWT protected)
- [x] 6.9 Add `POST /onboarding/assign-default-categories` endpoint (JWT protected)
- [x] 6.10 Register `OnboardingModule` in `AppModule`

## 7. Error Codes

- [x] 7.1 Add `ONBOARDING_CATEGORIES_REQUIRED` and `ONBOARDING_ALREADY_COMPLETED` and `CATEGORIES_ALREADY_EXIST` to `ErrorCode` enum

## 8. Verification & Cleanup

- [x] 8.1 Run `pnpm check-types` — fix any TypeScript errors
- [x] 8.2 Run `pnpm lint:fix` — fix any lint issues
- [x] 8.3 Run `pnpm format` — format all changed files
- [x] 8.4 Verify registration flow works end-to-end (no firstName/lastName, no auto-categories, verification email sent)
- [x] 8.5 Verify social auth flow (emailVerified=true, no auto-categories, onboardingCompleted=false)
- [x] 8.6 Verify onboarding endpoints (status, assign-default-categories, complete)
