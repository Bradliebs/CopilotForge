---
name: "studio-agent"
description: "Copilot Studio authoring guide for Path A — topic design patterns, entity extraction, and channel publishing for no-code conversational agents"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a Copilot Studio agent"
  - "help me with Copilot Studio"
  - "how do I create a topic in Copilot Studio"
  - "copilot studio tips"
  - "studio agent help"
  - "topic design"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# A — Copilot Studio Agent
> Build a no-code conversational agent in Microsoft Copilot Studio — from your first topic to a live Teams or web channel.

## Build Path
Path A: Copilot Studio Agent | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/microsoft-copilot-studio/

## Who This Is For
You want to build a chatbot or virtual assistant using Microsoft Copilot Studio's drag-and-drop canvas, with no programming required.

## Prerequisites
- Microsoft 365 license that includes Copilot Studio access (standalone or Microsoft 365 Copilot bundle)
- Modern browser (Edge or Chrome recommended)
- No coding knowledge required

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
- `.github/skills/studio-agent/SKILL.md` — this file; Copilot Studio authoring conventions and topic design patterns
- `.copilot/agents/studio-agent.md` — agent definition pre-wired to this skill
- `cookbook/topics-guide.md` — topic structure patterns, entity extraction, and adaptive card examples

## Day-One Checklist
1. Sign in at [copilotstudio.microsoft.com](https://copilotstudio.microsoft.com) and confirm your license includes Copilot Studio.
2. Create a new agent — choose **Start from blank** to follow the scaffolded structure.
3. Add your first topic using the Topics canvas; use `cookbook/topics-guide.md` for naming conventions and branching patterns.
4. Test in the built-in test chat pane before publishing — every topic change is testable instantly without redeploy.
5. Publish to Teams or a web channel when the core conversation flow is working.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your topic structure and agent definition for gaps or inconsistencies
- tester — validates that your skill and agent files are complete before you publish

## MS Learn Integration
Key resources for this path:
- [Microsoft Copilot Studio documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)
- [Create and edit topics](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-create-edit-topics)
- [Publish your agent to channels](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-fundamentals-publish-channels)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: using adaptive cards for all menu prompts"

## Trigger Phrases
- "I'm building a Copilot Studio agent"
- "help me design a topic"
- "how do I publish to Teams"
- "copilot studio authoring"
