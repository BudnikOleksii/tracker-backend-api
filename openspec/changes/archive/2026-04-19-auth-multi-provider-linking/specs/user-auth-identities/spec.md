## ADDED Requirements

### Requirement: User auth identity table

The database SHALL have a `UserAuthIdentity` table that stores one row per authentication method bound to a user, supporting many identities per user.

#### Scenario: Table columns

- **WHEN** the migration creates the `UserAuthIdentity` table
- **THEN** it MUST have columns `id` (uuid primary key, default random), `userId` (uuid, not null, foreign key to `User.id` with cascade delete), `provider` (auth provider enum, not null), `providerId` (text, nullable), `emailAtLink` (text, nullable), `createdAt` (timestamp with timezone, not null, defaults to now), `updatedAt` (timestamp with timezone, not null, defaults to now, auto-updated)

#### Scenario: Provider and providerId uniqueness

- **WHEN** a row is inserted or updated
- **THEN** the combination of `provider` and `providerId` MUST be unique where `providerId` is not null
- **AND** this MUST be enforced by a partial unique index

#### Scenario: Local identity uniqueness per user

- **WHEN** a `LOCAL` identity row is inserted for a user that already has one
- **THEN** the insert MUST fail due to a partial unique index on `(userId, provider)` where `provider = 'LOCAL'`

#### Scenario: User lookup index

- **WHEN** the application looks up all identities for a user by `userId`
- **THEN** a non-unique index on `userId` MUST make the lookup efficient

#### Scenario: Cascade delete with user

- **WHEN** a user row is hard-deleted
- **THEN** all rows in `UserAuthIdentity` with that `userId` MUST be deleted by the foreign key cascade

### Requirement: Migration from legacy columns

The migration SHALL backfill the `UserAuthIdentity` table from the existing `users.authProvider` / `users.authProviderId` columns and `users.passwordHash`, then drop the legacy columns.

#### Scenario: Backfill social identities

- **WHEN** the migration runs
- **THEN** for every user row with `authProviderId IS NOT NULL`, a matching identity row MUST be inserted with `userId = User.id`, `provider = User.authProvider`, `providerId = User.authProviderId`

#### Scenario: Backfill local identities

- **WHEN** the migration runs
- **THEN** for every user row with `passwordHash IS NOT NULL`, a `LOCAL` identity row MUST be inserted with `userId = User.id`, `provider = 'LOCAL'`, `providerId = NULL`

#### Scenario: Legacy columns removed

- **WHEN** the migration completes
- **THEN** the `authProvider` and `authProviderId` columns on the `User` table MUST be dropped
- **AND** the `User_authProvider_authProviderId_unique` index MUST be dropped

#### Scenario: Migration atomicity

- **WHEN** any step of the migration fails
- **THEN** all steps in the migration MUST be rolled back as a single transaction

### Requirement: Identity repository operations

The application SHALL expose repository methods to query and mutate the `UserAuthIdentity` table.

#### Scenario: Find identity by provider and providerId

- **WHEN** `findByProvider(provider, providerId)` is called
- **THEN** the repository MUST return the identity row and its user, or null if none exists

#### Scenario: List identities for a user

- **WHEN** `findByUserId(userId)` is called
- **THEN** the repository MUST return all identity rows for that user ordered by `createdAt` ascending

#### Scenario: Create a new identity

- **WHEN** `create({ userId, provider, providerId, emailAtLink })` is called
- **THEN** the repository MUST insert a row and return it
- **AND** `providerId` MUST be null when `provider = 'LOCAL'`

#### Scenario: Check local identity existence

- **WHEN** `hasLocalIdentity(userId)` is called
- **THEN** the repository MUST return `true` iff a row with `provider = 'LOCAL'` exists for that user

### Requirement: Derived authProvider in UserInfo

The `UserInfo` DTO exposed by the user module SHALL continue to include an `authProvider` field derived from the user's identities, preserving the existing API response shape.

#### Scenario: Derivation for a local-only user

- **WHEN** a user has a single `LOCAL` identity
- **THEN** `authProvider` in `UserInfo` MUST be `'LOCAL'`

#### Scenario: Derivation for a social-only user

- **WHEN** a user has a single social identity (e.g., `GOOGLE`)
- **THEN** `authProvider` in `UserInfo` MUST be that provider value

#### Scenario: Derivation for a linked user

- **WHEN** a user has both a `LOCAL` identity and one or more social identities
- **THEN** `authProvider` in `UserInfo` MUST be `'LOCAL'`

#### Scenario: Derivation for a multi-social user

- **WHEN** a user has multiple social identities and no `LOCAL` identity
- **THEN** `authProvider` in `UserInfo` MUST be the provider of the earliest-created identity (by `createdAt`)
