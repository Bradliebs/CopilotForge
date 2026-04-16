---
name: "power-pages"
description: "Power Pages website guide for Path I — site design conventions, Liquid templating, Dataverse integration, web role permissions, and embedding a Copilot Studio chatbot"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a Power Pages site"
  - "Power Pages AI chatbot"
  - "Dataverse for Power Pages"
  - "public-facing website Power Platform"
  - "power pages liquid"
  - "power pages setup"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# I — Power Pages + AI Plugin
> Build a public-facing website backed by Dataverse data — with a Copilot Studio chatbot embedded as a widget for anonymous or authenticated visitors.

## Build Path
Path I: Power Pages + AI Plugin | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/power-pages/

## Who This Is For
You want to build a website that external users (customers, partners, or the public) can visit — where they can browse Dataverse records, submit forms, and chat with an AI assistant — without any visitors needing a Microsoft 365 account.

## Prerequisites
- Power Pages license (standalone or included in certain Dynamics 365 bundles)
- Power Platform environment with Dataverse enabled
- A Dataverse table containing the data or content the site will display (e.g., a Products table, a FAQ table, or a case intake form)

## What Gets Generated
- `.github/skills/power-pages/SKILL.md` — this file; Power Pages site design conventions and Liquid templating patterns
- `.copilot/agents/studio-agent.md` — agent definition scoped to Path I with Power Pages and Dataverse preamble
- `cookbook/dataverse-connector.md` — connecting Power Pages to Dataverse tables, column permissions, and web role configuration

## Day-One Checklist
1. Sign in at [make.powerpages.microsoft.com](https://make.powerpages.microsoft.com) and create a new site — choose a starter template that matches your use case (blank, FAQ, or community).
2. Connect the site to your Dataverse table using the **Data workspace** — confirm table permissions and column-level security before exposing any data.
3. Add an AI-powered chatbot to the site via **Set up → Chatbot** — this embeds a Copilot Studio agent as a widget on every page.
4. Use `cookbook/dataverse-connector.md` to configure web roles so unauthenticated visitors only see the columns they are permitted to read.
5. Test the full visitor experience in preview mode (no login required) before activating the site at a custom domain.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your Dataverse table permissions and web role configuration for security gaps
- tester — validates that your skill and agent definition files are complete before you go live

## MS Learn Integration
Key resources for this path:
- [Power Pages documentation](https://learn.microsoft.com/en-us/power-pages/)
- [Connect Power Pages to Dataverse](https://learn.microsoft.com/en-us/power-pages/configure/dataverse-overview)
- [Add a chatbot to your Power Pages site](https://learn.microsoft.com/en-us/power-pages/getting-started/add-chatbot)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: anonymous visitors get read-only access to the Products table only"

## Trigger Phrases
- "I'm building a Power Pages site"
- "how do I add a chatbot to Power Pages"
- "Dataverse web roles for Power Pages"
- "public-facing Power Platform website"
