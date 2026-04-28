# FORGE.md — [Your Project Name]

<!-- copilotforge: v3.0.0 -->
<!-- copilotforge: path=H -->

## Project Summary
- **Build Path:** H — SharePoint + Teams
- **Description:** [one-sentence summary of your SharePoint/Teams solution]
- **Stack:** Microsoft 365 Copilot + SharePoint
- **Prerequisites:** Microsoft 365 Copilot license, SharePoint admin access
- **MS Learn:** https://learn.microsoft.com/en-us/sharepoint/introduction

## Team Roster
Agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | SharePoint + Teams integration and Copilot configuration | `.copilot/agents/studio-guide.md` |
| Planner | Orchestrator — runs the wizard | `.copilot/agents/planner.md` |

## Skills Index
Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| sharepoint-agent | "build SharePoint agent" | SharePoint Copilot agent and Teams integration |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in `cookbook/` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| sharepoint-connector.md | SharePoint data connector and permissions setup |
| topics-guide.md | Author topics, trigger phrases, and responses |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: H
- Path Name: SharePoint + Teams
