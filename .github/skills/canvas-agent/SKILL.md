---
name: "canvas-agent"
description: "Canvas app authoring guide for Path D — Power Fx formula patterns, data connections, and embedding a Copilot AI control in a no-code canvas app"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a canvas app"
  - "Power Apps canvas help"
  - "how do I use Power Fx"
  - "canvas app with copilot"
  - "canvas agent"
  - "Power Apps AI control"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# D — Canvas App + Copilot Agent
> Build a custom Power Apps canvas app with a conversational AI agent embedded directly in the interface — no code required.

## Build Path
Path D: Canvas App + Copilot Agent | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/power-apps/

## Who This Is For
You want a custom screen-based app — forms, galleries, navigation — with a built-in AI chat panel that users can talk to, all built by dragging and dropping in Power Apps Studio.

## Prerequisites
- Power Apps license (per-app, per-user, or Microsoft 365 E3/E5 with Power Apps included)
- Power Platform environment (created by your admin or your own developer environment — free developer environments are available at [make.powerapps.com](https://make.powerapps.com))
- Basic familiarity with Power Apps Studio (drag-and-drop canvas)

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
- `.github/skills/canvas-agent/SKILL.md` — this file; canvas app design patterns and Power Fx formula conventions
- `.copilot/agents/canvas-agent.md` — agent definition pre-wired to this skill
- `cookbook/powerfx-patterns.md` — commonly used Power Fx formulas for data binding, navigation, and conditional visibility
- `cookbook/data-connections.md` — connecting canvas apps to Dataverse, SharePoint, and SQL step by step

## Day-One Checklist
1. Sign in at [make.powerapps.com](https://make.powerapps.com) and confirm your environment is set to the correct region.
2. Create a new canvas app — choose **Blank app (tablet layout)** for the most control over screen layout.
3. Add a **Copilot** control from the Insert panel — this embeds a conversational AI component directly in your canvas without any code.
4. Connect to your primary data source using `cookbook/data-connections.md` (Dataverse is recommended for first-time users because it handles permissions automatically).
5. Use `cookbook/powerfx-patterns.md` to wire up form submissions, navigation between screens, and conditional visibility rules.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your canvas app structure and Power Fx formulas for common mistakes
- tester — validates that your skill and agent definition files are complete before you share the app

## MS Learn Integration
Key resources for this path:
- [Power Apps documentation](https://learn.microsoft.com/en-us/power-apps/)
- [Get started with canvas apps](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/getting-started)
- [Add a Copilot control to a canvas app](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/add-ai-copilot)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: using Dataverse as primary data source for all tables"

## Trigger Phrases
- "I'm building a canvas app"
- "Power Fx formula help"
- "how do I add a Copilot control"
- "canvas app data connection"
