---
name: "powerbi-report"
description: "Power BI report and semantic model guide for Path G — star schema design, DAX formula patterns, AI-powered narratives, and publishing to Power BI Service"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a Power BI report"
  - "DAX formula help"
  - "star schema Power BI"
  - "how do I publish a Power BI report"
  - "Power BI semantic model"
  - "data model Power BI"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# G — Power BI Report / Semantic Model
> Transform raw data into interactive dashboards and AI-powered insights — using Power BI Desktop for modeling and Power BI Service for sharing.

## Build Path
Path G: Power BI Report | EXTENSION_REQUIRED: false | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/power-bi/

## Who This Is For
You have data in a database, file, or online service and want to turn it into a visual report your team can explore — including AI-powered natural-language Q&A and smart narrative summaries.

## Prerequisites
- Power BI Pro license (or Premium Per User) — required for publishing and sharing reports with others
- Power BI Desktop installed (free download from [powerbi.microsoft.com](https://powerbi.microsoft.com)) — recommended for data modeling
- Access to your data source (database connection string, file path, or API credentials)

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
- `.github/skills/powerbi-report/SKILL.md` — this file; data model design conventions and DAX formula patterns
- `.copilot/agents/powerbi-agent.md` — agent definition pre-wired to this skill
- `cookbook/report-setup.md` — step-by-step guide for connecting to data, building a star schema, and publishing
- `cookbook/data-model.md` — semantic model conventions: measure naming, relationship cardinality, and calculation groups

## Day-One Checklist
1. Open Power BI Desktop and connect to your data source — use **Home → Get data** and choose your connector (Excel, SQL Server, SharePoint, etc.).
2. Load and transform data in Power Query — clean nulls, set correct data types, and remove unused columns before closing and applying.
3. Build a star schema: one fact table connected to dimension tables, with relationships set to single-direction — use `cookbook/data-model.md` naming conventions.
4. Write your first measure in DAX using the `cookbook/report-setup.md` template patterns — `CALCULATE` for filtered aggregations, `DIVIDE` for safe division that returns blank instead of an error.
5. Publish to Power BI Service (**Home → Publish**) and share the workspace link with stakeholders.

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your data model relationships and DAX measures for common design issues
- tester — validates that your skill and agent definition files are complete before you publish

## MS Learn Integration
Key resources for this path:
- [Power BI documentation](https://learn.microsoft.com/en-us/power-bi/)
- [Model data in Power BI Desktop](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-modeling-view)
- [DAX reference](https://learn.microsoft.com/en-us/dax/)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: all monetary measures use DIVIDE with a blank alternate result"

## Trigger Phrases
- "I'm building a Power BI report"
- "help with my DAX measure"
- "how do I build a star schema"
- "publish to Power BI Service"
