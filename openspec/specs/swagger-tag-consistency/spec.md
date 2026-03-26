## ADDED Requirements

### Requirement: All controller tags are registered in Swagger config

The `swagger.config.ts` file SHALL register every API tag used by controllers, with a human-readable description for each tag.

#### Scenario: Transactions tag is registered

- **WHEN** the Swagger config tag list is inspected
- **THEN** a tag named "Transactions" SHALL be present with a description

#### Scenario: Budgets tag is registered

- **WHEN** the Swagger config tag list is inspected
- **THEN** a tag named "Budgets" SHALL be present with a description

#### Scenario: Recurring Transactions tag is registered

- **WHEN** the Swagger config tag list is inspected
- **THEN** a tag named "Recurring Transactions" SHALL be present with a description

#### Scenario: Transaction Categories tag is registered

- **WHEN** the Swagger config tag list is inspected
- **THEN** a tag named "Transaction Categories" SHALL be present with a description

#### Scenario: Transactions Analytics tag is registered

- **WHEN** the Swagger config tag list is inspected
- **THEN** a tag named "Transactions Analytics" SHALL be present with a description

### Requirement: Tag naming uses Title Case consistently

All `@ApiTags` decorators across controllers and all tag registrations in `swagger.config.ts` SHALL use Title Case (e.g., "Auth", "Health", not "auth", "health").

#### Scenario: Health controller uses Title Case tag

- **WHEN** the health controller's `@ApiTags` decorator is inspected
- **THEN** the tag value SHALL be "Health"

#### Scenario: Auth controller uses Title Case tag

- **WHEN** the auth controller's `@ApiTags` decorator is inspected
- **THEN** the tag value SHALL be "Auth"

#### Scenario: Swagger config tags all use Title Case

- **WHEN** the tag definitions in `swagger.config.ts` are inspected
- **THEN** every tag name SHALL use Title Case
