# Copilot Extension Setup Guide

How to register and deploy CopilotForge as a GitHub Copilot Extension so your team can use `@copilotforge` in Copilot Chat.

## Prerequisites

- A GitHub account with Copilot access
- A publicly reachable HTTPS endpoint (or a tunnel like ngrok for development)
- CopilotForge v1.9.0+ installed

## Step 1: Start the Extension Server

```bash
# Local development
COPILOTFORGE_SKIP_VERIFY=1 npx copilotforge extension

# Custom port
npx copilotforge extension --port 8080
```

The server starts on `http://127.0.0.1:3456` by default.

For public access, use a tunnel:

```bash
# Using ngrok
ngrok http 3456
```

Note the HTTPS URL (e.g., `https://abc123.ngrok.io`).

## Step 2: Create a GitHub App

1. Go to **Settings → Developer settings → GitHub Apps → New GitHub App**
2. Fill in the required fields:

| Field | Value |
|-------|-------|
| **GitHub App name** | `CopilotForge` (or your preferred name) |
| **Homepage URL** | `https://github.com/Bradliebs/CopilotForge` |
| **Webhook** | Uncheck "Active" (not needed for Copilot agents) |

3. Under **Permissions**, set:
   - **Copilot Chat**: Read-only

4. Click **Create GitHub App**

## Step 3: Configure the Copilot Tab

1. On your new GitHub App's settings page, click the **Copilot** tab
2. Set **App Type** to **Agent**
3. Set **URL** to your server's public endpoint (e.g., `https://abc123.ngrok.io`)
4. Add a **Description**: "AI-powered project scaffolding and management"
5. Click **Save**

## Step 4: Install the App

1. Go to your GitHub App's page
2. Click **Install App**
3. Choose the account or organization to install on
4. Select **All repositories** or specific ones

## Step 5: Test in Copilot Chat

Open GitHub Copilot Chat (in VS Code, github.com, or GitHub Mobile) and type:

```
@copilotforge help
```

You should see the CopilotForge agent respond with available commands.

Try some commands:

```
@copilotforge initialize my project
@copilotforge run a health check
@copilotforge show my trust level
@copilotforge what's the best way to structure my AI agents?
```

The last example demonstrates the LLM passthrough — messages that don't match a specific tool intent are forwarded to the Copilot API for conversational responses.

## Signature Verification

In production, the extension server verifies request signatures from GitHub:

1. GitHub signs each request with a private key
2. The server fetches public keys from `api.github.com/meta/public_keys/copilot_api`
3. Keys are cached for 1 hour
4. Invalid signatures return 401

Set `COPILOTFORGE_SKIP_VERIFY=1` to disable verification during local development.

## Deployment Options

### Azure App Service

```bash
# Deploy to Azure (requires Azure CLI)
az webapp up --name copilotforge-ext --runtime "NODE:18-lts"
```

### Docker

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY cli/ .
ENV NODE_ENV=production
EXPOSE 3456
CMD ["node", "bin/copilotforge.js", "extension"]
```

### Render / Railway / Fly.io

Set the start command to:

```bash
npx copilotforge extension --port $PORT
```

## Making It Public

To list on the GitHub Marketplace:

1. Go to your GitHub App settings
2. Click **List on Marketplace** (if available)
3. Fill in the listing details, screenshots, and pricing (free)
4. Submit for review

## Architecture

```
GitHub Copilot Chat
    │
    ▼ POST (SSE)
┌─────────────────────┐
│  Extension Server    │
│  (extension-server.js) │
│                     │
│  Intent Parsing     │──▶ Tool Execution (local)
│  Signature Verify   │
│  LLM Passthrough    │──▶ api.githubcopilot.com
└─────────────────────┘
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check signature verification; set `COPILOTFORGE_SKIP_VERIFY=1` for local dev |
| Agent not showing | Ensure the GitHub App is installed and Copilot tab is configured as "Agent" |
| No response | Verify the server is running and the URL is publicly accessible |
| Timeout | Check your firewall/proxy settings; the server needs HTTPS access |
