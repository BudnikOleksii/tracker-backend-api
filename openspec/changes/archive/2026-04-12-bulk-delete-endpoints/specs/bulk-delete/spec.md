## ADDED Requirements

### Requirement: Bulk delete request validation

The system SHALL accept a `DELETE /batch` request with a JSON body containing an `ids` array of UUIDs. The `ids` array MUST contain between 1 and 100 unique valid UUID v4 strings. The system SHALL reject requests with an empty array, more than 100 IDs, duplicate IDs, or invalid UUID formats.

#### Scenario: Valid bulk delete request

- **WHEN** an authenticated user sends a DELETE request to `/<module>/batch` with `{ "ids": ["uuid-1", "uuid-2"] }`
- **THEN** the system accepts the request and proceeds with deletion

#### Scenario: Empty IDs array

- **WHEN** a user sends a bulk delete request with `{ "ids": [] }`
- **THEN** the system returns HTTP 400 with a validation error indicating at least 1 ID is required

#### Scenario: Exceeds maximum batch size

- **WHEN** a user sends a bulk delete request with more than 100 IDs
- **THEN** the system returns HTTP 400 with a validation error indicating the maximum is 100

#### Scenario: Invalid UUID format

- **WHEN** a user sends a bulk delete request with `{ "ids": ["not-a-uuid"] }`
- **THEN** the system returns HTTP 400 with a validation error

#### Scenario: Duplicate IDs in array

- **WHEN** a user sends a bulk delete request with duplicate UUIDs in the `ids` array
- **THEN** the system returns HTTP 400 with a validation error indicating IDs must be unique

### Requirement: Bulk delete partial success semantics

The system SHALL use a best-effort model: delete as many records as possible and report per-ID failures for records that could not be deleted. The system SHALL validate all IDs up front, partition them into deletable and non-deletable, delete the valid set in a single database transaction, and return a detailed response.

#### Scenario: All IDs valid and deletable

- **WHEN** a user sends a bulk delete request with IDs that all exist, belong to the user, and have no constraints preventing deletion
- **THEN** the system deletes all records and returns `{ "deleted": N, "failed": [], "message": "N <entity> deleted successfully" }`

#### Scenario: Some IDs not found

- **WHEN** a user sends a bulk delete request where 3 of 5 IDs exist and belong to the user, and 2 do not
- **THEN** the system deletes the 3 valid records and returns `{ "deleted": 3, "failed": [{ "id": "...", "reason": "Not found" }, ...], "message": "3 of 5 <entity> deleted" }`

#### Scenario: Some IDs have constraint violations

- **WHEN** a user sends a bulk delete request where some records cannot be deleted due to module-specific constraints
- **THEN** the system deletes the unconstrained records and reports each constrained record in the `failed` array with a specific reason

#### Scenario: All IDs fail

- **WHEN** a user sends a bulk delete request where no records can be deleted (all not found or constrained)
- **THEN** the system returns HTTP 200 with `{ "deleted": 0, "failed": [...], "message": "0 of N <entity> deleted" }`

### Requirement: Bulk delete response format

The system SHALL return a response with `deleted` (number of records deleted), `failed` (array of `{ id: string, reason: string }` for each record that could not be deleted), and `message` (summary message) fields. The response SHALL always be HTTP 200 regardless of how many records succeeded or failed.

#### Scenario: Full success response

- **WHEN** a bulk delete operation succeeds for all 5 records
- **THEN** the system returns HTTP 200 with `{ "deleted": 5, "failed": [], "message": "5 <entity> deleted successfully" }`

#### Scenario: Partial success response

- **WHEN** a bulk delete operation deletes 3 of 5 records
- **THEN** the system returns HTTP 200 with `{ "deleted": 3, "failed": [{ "id": "...", "reason": "..." }, { "id": "...", "reason": "..." }], "message": "3 of 5 <entity> deleted" }`

### Requirement: Bulk delete shared DTOs

The system SHALL provide a shared `BulkDeleteDto` for request validation and `BulkDeleteResponseDto` for responses in `src/shared/dtos/`. All bulk delete endpoints across modules SHALL use these shared DTOs.

#### Scenario: Consistent request contract

- **WHEN** any module implements a bulk delete endpoint
- **THEN** it SHALL use the shared `BulkDeleteDto` with `ids: string[]` validated as UUID v4 array with min 1, max 100 items, and uniqueness constraint

#### Scenario: Consistent response contract

- **WHEN** any module returns a bulk delete response
- **THEN** it SHALL use the shared `BulkDeleteResponseDto` with `deleted: number`, `failed: { id: string; reason: string }[]`, and `message: string`
