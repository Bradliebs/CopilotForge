---
name: "sharepoint-agent"
description: "SharePoint + Teams Copilot guide for Path H — knowledge source configuration, permissions checklist, and Teams channel deployment for Microsoft 365 Copilot agents"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a SharePoint agent"
  - "SharePoint knowledge source"
  - "Teams Copilot agent"
  - "how do I add SharePoint to my agent"
  - "sharepoint copilot studio"
  - "teams channel deployment"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# H — SharePoint + Teams Copilot
> Surface your organization's SharePoint knowledge directly inside Microsoft Teams — an agent that answers questions about your documents without anyone leaving their chat window.

## Build Path
Path H: SharePoint + Teams Copilot | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/sharepoint/

## Who This Is For
You want employees to ask questions about company documents stored in SharePoint and get answers inside Microsoft Teams — without needing to search through folder structures themselves.

## Prerequisites
- Microsoft 365 Copilot license (Business or Enterprise)
- SharePoint administrator access (or site collection administrator on the target site)
- Teams administrator access for deploying the agent to Teams channels

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
- `.github/skills/sharepoint-agent/SKILL.md` — this file; SharePoint knowledge source configuration and Teams deployment patterns
- `.copilot/agents/studio-agent.md` — agent definition scoped to Path H with SharePoint knowledge source preamble
- `cookbook/sharepoint-connector.md` — connecting SharePoint document libraries as knowledge sources, plus a permissions checklist

## Day-One Checklist
1. Identify the SharePoint site(s) that contain the knowledge your agent should surface — confirm the Copilot service account has **read** access to every library you plan to include.
2. In Copilot Studio, create a new agent and add your SharePoint site as a knowledge source under **Knowledge → Add knowledge → SharePoint**.
3. Set the agent's scope using the instructions field — be explicit about what topics it should and should not answer (e.g., "Only answer questions about HR policy documents").
4. Use `cookbook/sharepoint-connector.md` to configure permissions so only licensed Microsoft 365 Copilot users can interact with the agent.
5. Publish to Teams using the **Channels → Microsoft Teams** deployment option, then install the app in the target channel or team.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your SharePoint permissions configuration and knowledge source scope for gaps
- tester — validates that your skill and agent definition files are complete before Teams deployment

## MS Learn Integration
Key resources for this path:
- [SharePoint documentation](https://learn.microsoft.com/en-us/sharepoint/)
- [Use SharePoint as a knowledge source in Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/sharepoint)
- [Microsoft Teams platform overview](https://learn.microsoft.com/en-us/microsoftteams/platform/overview)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: scoping agent to the HR SharePoint site only, read-only access"

## Trigger Phrases
- "I'm building a SharePoint Copilot agent"
- "how do I add SharePoint as a knowledge source"
- "deploy agent to Teams channel"
- "SharePoint permissions for Copilot"
