## ADDED Requirements

### Requirement: Assign default transaction categories on user registration

The system SHALL automatically copy all active default transaction categories into the new user's personal transaction categories when a user registers. The copied categories SHALL be fully owned by the user and indistinguishable from manually created categories.

#### Scenario: Registration with default transaction categories available

- **WHEN** a user registers and default transaction categories exist in the system
- **THEN** the system SHALL create personal transaction categories for the user matching each active default transaction category, preserving name, type, and parent-child hierarchy

#### Scenario: Registration with no default transaction categories

- **WHEN** a user registers and no default transaction categories exist
- **THEN** the system SHALL complete registration successfully with no categories assigned

#### Scenario: Hierarchical default transaction categories are preserved

- **WHEN** default transaction categories include parent-child relationships (e.g., "Food" → "Groceries", "Food" → "Restaurants")
- **THEN** the system SHALL recreate the same hierarchy in the user's personal categories, with correct parent-child references using the user's new category IDs

#### Scenario: Default category assignment failure does not block registration

- **WHEN** a user registers but copying default transaction categories fails (e.g., database error during copy)
- **THEN** the system SHALL complete registration successfully, returning valid tokens and user data, and log the assignment failure

### Requirement: User ownership of assigned categories

Users SHALL have full ownership of categories assigned from defaults. These categories SHALL behave identically to manually created categories.

#### Scenario: User updates an assigned category

- **WHEN** a user updates a category that was assigned from defaults (e.g., renames "Groceries" to "Supermarket")
- **THEN** the system SHALL update the category normally with no restrictions

#### Scenario: User deletes an assigned category

- **WHEN** a user deletes a category that was assigned from defaults
- **THEN** the system SHALL soft-delete the category normally, following the same rules as manually created categories

#### Scenario: No link back to default transaction category

- **WHEN** a user's assigned category is retrieved via the transaction categories API
- **THEN** the response SHALL NOT contain any reference to the default transaction category it was copied from
