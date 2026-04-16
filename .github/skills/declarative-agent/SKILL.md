---
name: "declarative-agent"
description: "Declarative agent authoring guide for Path C — manifest conventions, knowledge source configuration, and deployment to Microsoft 365 Copilot"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a declarative agent"
  - "Microsoft 365 Agent Builder"
  - "extend Microsoft 365 Copilot"
  - "declarative agent manifest"
  - "declarative copilot"
  - "M365 extensibility"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# C — Declarative Agent
> Extend Microsoft 365 Copilot with custom knowledge and instructions — no separate Copilot Studio license needed, just your Microsoft 365 Copilot subscription.

## Build Path
Path C: Declarative Agent | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/

## Who This Is For
You have a Microsoft 365 Copilot license and want to add a custom agent that knows about your organization's data, policies, or processes — without building a full Copilot Studio project.

## Prerequisites
- Microsoft 365 Copilot license (Business or Enterprise)
- Teams administrator access (or permission from your admin to sideload apps)
- Familiarity with JSON is helpful but not required

## What Gets Generated
- `.github/skills/declarative-agent/SKILL.md` — this file; declarative agent manifest conventions and knowledge source configuration
- `.copilot/agents/declarative-agent.md` — agent definition pre-wired to this skill
- `cookbook/manifest-guide.md` — annotated `declarativeAgent.json` template with all supported fields explained inline

## Day-One Checklist
1. Confirm your Microsoft 365 Copilot license is active — check at [admin.microsoft.com](https://admin.microsoft.com) under **Licenses**.
2. Open Microsoft 365 Agent Builder: go to Copilot Studio → **Create → New agent → Agent Builder**.
3. Give the agent a name, description, and instructions — use the `cookbook/manifest-guide.md` instructions field pattern as your starting text.
4. Add at least one knowledge source: a SharePoint site URL, an uploaded file, or a public website.
5. Test in the Agent Builder preview pane, then publish to Teams so colleagues can start using it.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your manifest file and knowledge source configuration for gaps
- tester — validates that your agent definition and manifest are complete before Teams deployment

## MS Learn Integration
Key resources for this path:
- [Extend Microsoft 365 Copilot overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/)
- [Build declarative agents for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-declarative-agents)
- [Declarative agent manifest reference](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/declarative-agent-manifest)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: scoping agent to HR policy documents only"

## Trigger Phrases
- "I'm building a declarative agent"
- "how do I extend Microsoft 365 Copilot"
- "Agent Builder help"
- "declarative agent manifest"
