---
name: "studio-connector"
description: "Custom connector authoring guide for Path B — OpenAPI spec import, authentication patterns, and wiring REST API actions into a Copilot Studio agent"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I need to connect my agent to an API"
  - "custom connector help"
  - "how do I add a connector to my agent"
  - "OpenAPI connector"
  - "studio connector"
  - "REST API copilot studio"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# B — Studio + Custom Connector
> Connect your Copilot Studio agent to any external REST API using a custom connector built from an OpenAPI spec.

## Build Path
Path B: Studio + Custom Connector | EXTENSION_REQUIRED: true | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/connectors/custom-connectors/

## Who This Is For
You already have (or are building) a Copilot Studio agent and want it to call an outside service — like a ticketing system, weather API, or internal backend.

## Prerequisites
- Microsoft 365 license that includes Copilot Studio access (standalone or Microsoft 365 Copilot bundle)
- A working REST API endpoint (URL, authentication method, and at least one tested endpoint)
- An OpenAPI (Swagger) 2.0 spec for the API, or enough documentation to build one
- Modern browser (Edge or Chrome recommended)

### Capture Decisions (forge remember)

If the user says **"forge remember: [anything]"** at any point in this conversation,
immediately acknowledge it ("Got it — logging that.") and append a new entry to
`forge-memory/decisions.md` in this format:

```
## [YYYY-MM-DD] [brief label]
[the user's exact words]
```

Then continue the conversation without interruption. Do not ask for confirmation.

## What Gets Generated
- `.github/skills/studio-connector/SKILL.md` — this file; connector authoring conventions and authentication patterns
- `.copilot/agents/studio-agent.md` — agent definition including connector action invocation guidance
- `cookbook/connector-setup.md` — step-by-step custom connector creation from an OpenAPI spec
- `cookbook/api-auth-guide.md` — OAuth 2.0, API key, and basic auth setup patterns for connectors

## Day-One Checklist
1. Validate your API endpoint is publicly reachable (or accessible via a gateway) and returns a documented response.
2. Export or author an OpenAPI 2.0 spec — use `cookbook/connector-setup.md` as a starting-point template.
3. In Power Automate or Power Apps, go to **Custom connectors → New connector → Import an OpenAPI file** and upload your spec.
4. Add the connector to your Copilot Studio agent as a plugin action — test each action in isolation before wiring it to a topic.
5. Wire the action into a topic trigger so the agent calls the API when the right phrase is detected.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your connector spec and topic wiring for authentication gaps or missing action mappings
- tester — validates that your connector definition and agent files are complete before you publish

## MS Learn Integration
Key resources for this path:
- [Custom connectors overview](https://learn.microsoft.com/en-us/connectors/custom-connectors/)
- [Define a custom connector from an OpenAPI definition](https://learn.microsoft.com/en-us/connectors/custom-connectors/define-openapi-definition)
- [Use plugin actions in Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-plugin-actions)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: using OAuth 2.0 with client credentials for all API calls"

## Trigger Phrases
- "I need to connect my agent to an API"
- "how do I build a custom connector"
- "OpenAPI spec import"
- "plugin action in Copilot Studio"
