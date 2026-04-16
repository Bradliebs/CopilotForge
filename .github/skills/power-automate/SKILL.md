---
name: "power-automate"
description: "Power Automate flow design guide for Path E — trigger selection, AI Builder integration, approval patterns, and error handling for automated cloud flows"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a Power Automate flow"
  - "flow help"
  - "AI Builder document processing"
  - "how do I set up an approval flow"
  - "power automate tips"
  - "automated flow"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# E — Power Automate + AI Builder
> Build automated workflows that use AI to process documents, route approvals, and make decisions — no code, just a visual flow designer.

## Build Path
Path E: Power Automate + AI Builder | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/power-automate/

## Who This Is For
You want to automate a repeating business process — like routing invoice approvals, extracting data from uploaded documents, or syncing records between systems — and want AI to handle the decision-making steps.

## Prerequisites
- Power Automate license (per-user, per-flow, or included in Microsoft 365 E3/E5)
- Power Platform environment
- AI Builder add-on credits (required for AI Builder models — ask your Microsoft 365 admin to confirm availability)

## What Gets Generated
- `.github/skills/power-automate/SKILL.md` — this file; flow design patterns and trigger selection guide
- `.copilot/agents/automate-agent.md` — agent definition pre-wired to this skill
- `cookbook/flow-patterns.md` — reusable flow structures for approvals, notifications, and data sync
- `cookbook/trigger-setup.md` — automated, instant, and scheduled trigger configuration with real-world examples

## Day-One Checklist
1. Sign in at [make.powerautomate.com](https://make.powerautomate.com) and confirm your license includes the flow type you need — automated flows need a trigger event, instant flows are started manually, scheduled flows run on a timer.
2. Create a new flow — choose **Automated cloud flow** for event-driven processing (e.g., "when a file is uploaded") or **Scheduled cloud flow** for recurring operations (e.g., "every weekday at 9 AM").
3. Add an AI Builder action step — choose a pre-built model such as **Extract information from documents**, or train a custom model in the AI Builder studio first.
4. Use `cookbook/flow-patterns.md` to add approval steps, condition branches, and error-handling paths.
5. Test with a real document or event before enabling the flow for production — use the **Test** button in the top-right corner.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your flow structure for missing error-handling steps and trigger misconfiguration
- tester — validates that your skill and agent definition files are complete before you enable the flow

## MS Learn Integration
Key resources for this path:
- [Power Automate documentation](https://learn.microsoft.com/en-us/power-automate/)
- [Create your first cloud flow](https://learn.microsoft.com/en-us/power-automate/get-started-logic-flow)
- [AI Builder overview](https://learn.microsoft.com/en-us/ai-builder/overview)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: using AI Builder invoice processing model for all document flows"

## Trigger Phrases
- "I'm building a Power Automate flow"
- "how do I add an AI Builder step"
- "approval flow pattern"
- "scheduled flow setup"
