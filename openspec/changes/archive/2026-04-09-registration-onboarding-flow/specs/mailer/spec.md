## ADDED Requirements

### Requirement: Shared mailer service for transactional emails

The system SHALL provide a `MailerService` in a shared `mailer` module that sends transactional emails via SMTP using Nodemailer.

#### Scenario: Send email successfully

- **WHEN** `MailerService.sendMail` is called with a valid `to`, `subject`, and `html` body
- **THEN** the service SHALL send the email via the configured SMTP transport
- **AND** return without throwing

#### Scenario: SMTP connection failure

- **WHEN** `MailerService.sendMail` is called but the SMTP server is unreachable
- **THEN** the service SHALL throw an error that the caller can catch and handle

### Requirement: SMTP configuration via environment variables

The system SHALL require SMTP configuration via environment variables when email features are enabled.

#### Scenario: All SMTP env vars provided

- **WHEN** the application starts with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` set
- **THEN** the `MailerModule` SHALL initialize the SMTP transport successfully

#### Scenario: SMTP env vars are optional

- **WHEN** SMTP environment variables are not set
- **THEN** the application SHALL start normally
- **AND** `MailerService.sendMail` SHALL log a warning and skip sending (no-op) rather than throwing

### Requirement: Send email verification email

The system SHALL provide a method to send the email verification email with the verification link.

#### Scenario: Verification email content

- **WHEN** `MailerService.sendVerificationEmail` is called with `email` and `verificationToken`
- **THEN** the service SHALL construct a verification URL using the `APP_URL` env var and the token
- **AND** send an email with subject "Verify your email" containing the verification link
