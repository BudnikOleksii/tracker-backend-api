## Context

The tracker backend currently has a `user` module with admin-only CRUD endpoints and an `auth` module handling registration/login. Users have no self-service endpoints to view or modify their own profile, change their password, or delete their account. The `users` table already has `countryCode` and `baseCurrencyCode` columns but lacks name fields.

## Goals / Non-Goals

**Goals:**

- Provide authenticated users with self-service profile management
- Add name fields (`firstName`, `lastName`) to the user schema
- Allow password changes with current password verification
- Allow account self-deletion with password confirmation (soft delete)
- Follow existing module architecture patterns exactly

**Non-Goals:**

- Avatar/image upload (future consideration)
- Email change flow (requires verification pipeline)
- Profile visibility to other users (this is personal data only)
- Admin override of profile fields (existing admin endpoints suffice)

## Decisions

### 1. New `profile` module vs extending `user` module

**Decision**: Create a new `src/modules/profile/` module.

**Rationale**: The existing `user` module is admin-scoped (all endpoints require ADMIN role). Profile endpoints are user-scoped (each user manages their own data). Separating concerns keeps authorization boundaries clean and avoids mixing admin and self-service logic in the same controller.

**Alternative considered**: Adding `/users/me` endpoints to the user controller — rejected because it conflates admin and self-service authorization, and the user module would grow in complexity.

### 2. Password change approach

**Decision**: Require the current password in the request body alongside the new password. Verify the current password hash before updating.

**Rationale**: Standard security practice to prevent unauthorized password changes if a session is compromised. No additional auth flow needed since users already have JWT sessions.

### 3. Account deletion strategy

**Decision**: Soft delete via the existing `deletedAt` column. Require password confirmation in the request body. Revoke all refresh tokens on deletion.

**Rationale**: Soft delete preserves data for audit/compliance and allows potential recovery. Password confirmation prevents accidental or unauthorized deletion. Revoking tokens ensures immediate session termination.

### 4. Schema migration for name fields

**Decision**: Add `firstName` (text, nullable) and `lastName` (text, nullable) to the `users` table. Nullable to avoid breaking existing rows and the registration flow.

**Rationale**: Names are optional profile data. Making them nullable means existing users and the current registration flow work without changes. The registration DTO can optionally accept these fields.

### 5. Profile module dependencies

**Decision**: The profile module will depend on `UserService` (for reads/updates) and `AuthService` (for token revocation on account deletion). The profile service will add password-specific methods that don't belong in the user service.

**Rationale**: Reusing existing services avoids duplicating DB logic. Password verification and account deletion are profile-specific business logic.

## Risks / Trade-offs

- **[Soft delete orphans]** → Soft-deleted users may have orphaned transactions/budgets. Mitigation: existing cascade behavior handles hard deletes; soft deletes preserve referential integrity naturally since foreign keys remain valid.
- **[No email change]** → Users cannot update their email. Mitigation: Explicitly a non-goal; can be added later with a verification flow.
- **[Nullable name fields]** → Name fields are optional, so some profiles may lack names. Mitigation: Acceptable for a finance tracker; the frontend can handle display gracefully.
