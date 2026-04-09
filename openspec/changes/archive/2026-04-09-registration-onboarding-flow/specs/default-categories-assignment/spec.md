## MODIFIED Requirements

### Requirement: Assign default transaction categories on user registration

The system SHALL NOT automatically assign default transaction categories during user registration. Default category assignment is now an explicit user action during onboarding via `POST /onboarding/assign-default-categories`.

#### Scenario: Registration with default transaction categories available

- **WHEN** a user registers (email or social auth) and default transaction categories exist in the system
- **THEN** the system SHALL NOT assign any default categories to the user during registration

#### Scenario: Default categories assigned via onboarding endpoint

- **WHEN** a user calls `POST /onboarding/assign-default-categories`
- **THEN** the system SHALL create personal transaction categories for the user matching each active default transaction category, preserving name, type, and parent-child hierarchy

#### Scenario: Registration completes with no categories

- **WHEN** a user registers via any method (email or social auth)
- **THEN** the user SHALL have zero transaction categories immediately after registration
