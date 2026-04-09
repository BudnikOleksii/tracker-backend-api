# Social Authentication Setup

This guide explains how to obtain OAuth credentials for Google and GitHub and configure them in the application.

Social auth is entirely optional. If no provider variables are set, the app starts normally with only email/password authentication.

## Google OAuth

### 1. Create a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > OAuth consent screen**
4. Choose **External** user type and click **Create**
5. Fill in the required fields (app name, user support email, developer email)
6. Under **Scopes**, add `email`, `profile`, and `openid`
7. Add test users if the app is still in testing mode
8. Click **Publish App** when ready for production

### 2. Create OAuth credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application** as the application type
4. Set a name (e.g., "Tracker Backend")
5. Under **Authorized redirect URIs**, add:
   - Local: `http://localhost:3000/auth/google/callback`
   - Production: `https://your-api-domain.com/auth/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 3. Set environment variables

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## GitHub OAuth

### 1. Register a new OAuth app

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps > New OAuth App**
3. Fill in the fields:
   - **Application name**: e.g., "Tracker"
   - **Homepage URL**: your frontend URL (e.g., `http://localhost:5173`)
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Click **Register application**

### 2. Get credentials

1. On the app page, copy the **Client ID**
2. Click **Generate a new client secret** and copy it immediately (it won't be shown again)

### 3. Set environment variables

```env
GITHUB_CLIENT_ID=Iv1.abc123
GITHUB_CLIENT_SECRET=your-github-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

## Redirect URL

After a successful social login, the server redirects the user's browser to `SOCIAL_AUTH_REDIRECT_URL` with an authorization code. This is required whenever any social provider is configured.

```env
SOCIAL_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

The frontend at this URL should:

1. Read the `code` query parameter from the URL
2. Exchange it by calling `POST /auth/social/exchange` with `{ "code": "<code>" }`
3. Receive the access token and user info in the response body
4. Store the access token and redirect the user to the app

If the redirect URL contains `?error=auth_failed`, the login failed. Check the `reason` parameter for details:

- `email_exists` — an account with that email already exists via a different method
- `unauthorized` — the provider rejected the authentication
- `unknown` — an unexpected error occurred

## Environment variable summary

| Variable                   | Required | Description                                            |
| -------------------------- | -------- | ------------------------------------------------------ |
| `GOOGLE_CLIENT_ID`         | No\*     | Google OAuth client ID                                 |
| `GOOGLE_CLIENT_SECRET`     | No\*     | Google OAuth client secret                             |
| `GOOGLE_CALLBACK_URL`      | No\*     | Google OAuth redirect URI registered in Google Console |
| `GITHUB_CLIENT_ID`         | No\*     | GitHub OAuth client ID                                 |
| `GITHUB_CLIENT_SECRET`     | No\*     | GitHub OAuth client secret                             |
| `GITHUB_CALLBACK_URL`      | No\*     | GitHub OAuth redirect URI registered in GitHub         |
| `SOCIAL_AUTH_REDIRECT_URL` | No\*\*   | Frontend URL to redirect after social auth             |

\* All three variables for a provider must be set together (all-or-nothing).

\*\* Required if any social provider is configured.

## Production checklist

- [ ] Set callback URLs to your production API domain
- [ ] Set `SOCIAL_AUTH_REDIRECT_URL` to your production frontend domain
- [ ] For Google: publish the OAuth consent screen (move out of testing mode)
- [ ] For GitHub: update the callback URL in the OAuth app settings
- [ ] Ensure `COOKIE_SECURE=true` and appropriate `COOKIE_SAME_SITE` for your domain setup
