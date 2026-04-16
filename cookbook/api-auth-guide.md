<!-- cookbook/api-auth-guide.md — CopilotForge Recipe -->
<!-- Paths: B | Studio + Custom Connector -->

# REST API Authentication Patterns

> Configure OAuth 2.0, API key, and basic authentication in Power Platform custom connectors.

## When to Use This

When your custom connector needs to authenticate against a secured REST API. Different APIs require different auth schemes — this guide covers the three most common patterns and when to choose each.

## Prerequisites

- A custom connector created (see `connector-setup.md`)
- Credentials for your target API (client ID/secret, API key, or username/password)
- For OAuth: a registered app in your identity provider (Azure AD, GitHub, Google, etc.)

## Steps

### Pattern 1 — API Key Authentication

1. In your custom connector, open the **Security** tab.
2. Select **API Key**.
3. Set **Parameter label**: `API Key` (shown in UI when creating a connection).
4. Set **Parameter name**: the header or query param name your API expects (e.g., `X-Api-Key` or `apikey`).
5. Set **Parameter location**: **Header** (preferred) or **Query string**.
6. Save. Users creating a connection will be prompted to enter their API key once.

### Pattern 2 — OAuth 2.0 (Client Credentials)

1. **Register an app** in your identity provider. For Azure AD:
   - Go to https://portal.azure.com → **App registrations** → **+ New registration**
   - Name: `Contoso-Connector-App`
   - Note the **Application (client) ID** and **Directory (tenant) ID**
   - Under **Certificates & secrets** → **+ New client secret** — copy the value immediately
   - Under **API permissions** → add the permissions your API requires → **Grant admin consent**
2. In your custom connector, open the **Security** tab → select **OAuth 2.0**.
3. Fill in:
   - **Identity provider**: Generic OAuth 2
   - **Client ID**: paste your app's client ID
   - **Client secret**: paste your client secret
   - **Authorization URL**: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize`
   - **Token URL**: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`
   - **Scope**: the OAuth scope your API requires (e.g., `https://graph.microsoft.com/.default`)
   - **Redirect URL**: copy the value Power Platform shows you and add it to your app registration's reply URLs
4. Save. Power Platform handles token refresh automatically.

### Pattern 3 — Basic Authentication

1. In your custom connector, open the **Security** tab.
2. Select **Basic authentication**.
3. Set **Parameter label for username** and **Parameter label for password** (these are UI hints only).
4. Save. Users creating a connection enter username and password once; Power Platform Base64-encodes them into the `Authorization: Basic ...` header.

## Example

**Scenario:** Connecting to the GitHub API using a Personal Access Token (API Key pattern).

- Parameter label: `GitHub Token`
- Parameter name: `Authorization`
- Parameter location: **Header**
- Token format: users must enter `Bearer ghp_yourTokenHere` as the value (GitHub requires the `Bearer ` prefix in the Authorization header — document this in the connector description)

## Common Pitfalls

- **OAuth redirect URL mismatch** — the redirect URL shown in Power Platform's Security tab must exactly match the reply URL registered in your identity provider. A trailing slash difference will break the auth flow.
- **Client secret expiry** — Azure AD client secrets expire (default 180 days). Set a calendar reminder to rotate the secret before expiry, then update the connector's security settings.
- **Scope format errors** — Azure AD scopes for OAuth 2.0 client credentials use the `/.default` suffix. User-delegated flows use space-separated permission names. Mixing these causes token errors.
- **Basic auth over HTTP** — Power Platform blocks HTTP connectors, but double-check your API is HTTPS. Basic auth credentials sent over HTTP are trivially interceptable.

## MS Learn Reference

[Use OAuth in your custom connector](https://learn.microsoft.com/en-us/connectors/custom-connectors/secure-your-connector-using-oauth) — OAuth configuration guide for custom connectors
