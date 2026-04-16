<!-- cookbook/manifest-guide.md — CopilotForge Recipe -->
<!-- Paths: C | Declarative Agent -->

# Declarative Agent manifest.json Structure

> Reference guide for building a valid Microsoft 365 Copilot declarative agent manifest.

## When to Use This

When you are building a declarative agent that runs inside Microsoft 365 Copilot — not Copilot Studio — and need to understand every field in the `manifest.json` that controls what your agent can do and how it's presented to users.

## Prerequisites

- Microsoft 365 Copilot licence (or developer tenant with Copilot extensibility enabled)
- Basic familiarity with JSON
- An app registration in Azure AD if your agent calls secured APIs
- Teams Toolkit or the Microsoft 365 Agents SDK for local development

## Steps

1. **Create the project folder structure**:
   ```
   my-declarative-agent/
   ├── appPackage/
   │   ├── manifest.json          ← App manifest (Teams/M365 app wrapper)
   │   ├── declarativeAgent.json  ← Agent behaviour definition
   │   ├── color.png              ← 192x192 icon
   │   └── outline.png            ← 32x32 icon
   └── env/
       └── .env.dev
   ```
2. **Build `appPackage/manifest.json`** — the outer Teams app manifest that wraps your agent:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.19/MicrosoftTeams.schema.json",
     "manifestVersion": "1.19",
     "id": "{{TEAMS_APP_ID}}",
     "version": "1.0.0",
     "developer": {
       "name": "Contoso",
       "websiteUrl": "https://contoso.com",
       "privacyUrl": "https://contoso.com/privacy",
       "termsOfUseUrl": "https://contoso.com/terms"
     },
     "name": { "short": "Contoso Helper", "full": "Contoso Helper Agent" },
     "description": {
       "short": "Answers Contoso HR questions.",
       "full": "A declarative agent scoped to Contoso HR policy documents and leave management."
     },
     "icons": { "color": "color.png", "outline": "outline.png" },
     "accentColor": "#0078D4",
     "copilotAgents": {
       "declarativeAgents": [
         { "id": "contoso-helper", "file": "declarativeAgent.json" }
       ]
     },
     "validDomains": ["contoso.com"]
   }
   ```
3. **Build `appPackage/declarativeAgent.json`** — the agent behaviour file:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.4/schema.json",
     "version": "v1.4",
     "name": "Contoso Helper",
     "description": "Answers questions about Contoso HR policy using approved documents.",
     "instructions": "You are a helpful HR assistant for Contoso employees. Only answer using the provided knowledge sources. If you don't know the answer, say so and suggest contacting HR directly.",
     "conversation_starters": [
       { "text": "What is the PTO policy?" },
       { "text": "How do I request parental leave?" }
     ],
     "capabilities": [
       { "name": "WebSearch", "disabled": true },
       { "name": "GraphConnectors",
         "connections": [{ "connection_id": "contosoHRDocs" }]
       }
     ],
     "actions": []
   }
   ```
4. **Validate required fields** — `name`, `description`, `instructions`, and `version` are required. All other fields are optional but recommended.
5. **Package the app** — zip the contents of `appPackage/` (not the folder itself) into `appPackage.zip`.
6. **Sideload for testing** — in Microsoft Teams, go to **Apps** → **Manage your apps** → **Upload an app** → select your zip.

## Example

**Scenario:** A declarative agent scoped to answer questions about a SharePoint site.

In `declarativeAgent.json`, add a SharePoint knowledge source under `capabilities`:
```json
"capabilities": [
  {
    "name": "OneDriveAndSharePoint",
    "items_by_url": [
      { "url": "https://contoso.sharepoint.com/sites/HRPolicies" }
    ]
  }
]
```

This restricts the agent to only use content from that SharePoint site when generating responses.

## Common Pitfalls

- **Mismatched schema version** — the `$schema` URL and `version` field must match. Using a 1.3 schema with version 1.4 causes validation errors during sideload.
- **Zip includes the folder, not just its contents** — zip the files inside `appPackage/`, not the `appPackage/` folder itself. The manifest must be at the root of the zip.
- **Instructions too vague** — the `instructions` field drives all agent behaviour. Vague instructions produce off-topic responses. Be specific: name the domain, the tone, and what to do when the agent doesn't know an answer.
- **WebSearch not disabled** — by default the agent can search the web. If you want a fully scoped agent, explicitly disable `WebSearch` in `capabilities`.

## MS Learn Reference

[Declarative agents for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent) — Overview and manifest reference
