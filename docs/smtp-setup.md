# SMTP Email Setup

The mailer module sends transactional emails (email verification, etc.) via SMTP. If SMTP is not configured, the app starts normally and emails are silently skipped.

## Environment Variables

| Variable                          | Required | Description                                                                       |
| --------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `SMTP_HOST`                       | Yes      | SMTP server hostname                                                              |
| `SMTP_PORT`                       | Yes      | SMTP server port                                                                  |
| `SMTP_USER`                       | No       | SMTP username (for authentication)                                                |
| `SMTP_PASSWORD`                   | No       | SMTP password (for authentication)                                                |
| `SMTP_FROM`                       | Yes      | Sender address (e.g. `"Tracker <noreply@example.com>"`)                           |
| `API_BASE_URL`                    | Yes      | Backend API URL, used to build verification links (already required, has default) |
| `EMAIL_VERIFICATION_REDIRECT_URL` | No       | Frontend URL to redirect after email verification                                 |

## Gmail Setup

### 1. Enable 2-Step Verification

Go to [Google Account Security](https://myaccount.google.com/security) and enable **2-Step Verification** (required for App Passwords).

### 2. Generate an App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select your device (or "Other" and type "Tracker")
4. Click **Generate**
5. Copy the 16-character password (shown with spaces — remove them)

### 3. Configure `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM="Tracker <your-email@gmail.com>"
API_BASE_URL=http://localhost:3000
EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:5173/onboarding
```

> **Note:** Use the App Password, not your regular Gmail password.

## Local Development with MailHog

For local development, [MailHog](https://github.com/mailhog/MailHog) catches all outgoing emails without actually sending them.

### 1. Add MailHog to Docker Compose

```yaml
mailhog:
  image: mailhog/mailhog
  ports:
    - '1025:1025' # SMTP
    - '8025:8025' # Web UI
```

### 2. Configure `.env`

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="Tracker <noreply@tracker.local>"
API_BASE_URL=http://localhost:3000
EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:5173/onboarding
```

No `SMTP_USER` or `SMTP_PASSWORD` needed — MailHog accepts all mail without auth.

### 3. View Emails

Open [http://localhost:8025](http://localhost:8025) to see captured emails.

## Other Providers

Any SMTP-compatible provider works. Common options:

| Provider | Host                                | Port | Notes                    |
| -------- | ----------------------------------- | ---- | ------------------------ |
| Gmail    | `smtp.gmail.com`                    | 587  | Requires App Password    |
| Outlook  | `smtp.office365.com`                | 587  |                          |
| SendGrid | `smtp.sendgrid.net`                 | 587  | Use API key as password  |
| AWS SES  | `email-smtp.<region>.amazonaws.com` | 587  | Use IAM SMTP credentials |
| Mailgun  | `smtp.mailgun.org`                  | 587  |                          |
