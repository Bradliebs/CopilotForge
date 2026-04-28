# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=B -->

## Project Summary
- **Build Path:** B — Studio + Custom Connector
- **Description:** [one-sentence summary of your agent + connector]
- **Stack:** Microsoft Copilot Studio + REST API connector
- **Prerequisites:** Microsoft 365 license with Copilot Studio access, REST API endpoint
- **MS Learn:** https://learn.microsoft.com/en-us/microsoft-copilot-studio/create-or-edit-copilot

## Team Roster
Agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | Copilot Studio agent + connector design | `.copilot/agents/studio-guide.md` |
| Planner | Orchestrator — runs the wizard | `.copilot/agents/planner.md` |

## Skills Index
Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| studio-connector | "add connector" | Custom connector authoring and configuration |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in `cookbook/` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| topics-guide.md | Author topics, trigger phrases, and responses |
| connector-setup.md | Register and test a custom REST connector |
| api-auth-guide.md | OAuth and API key auth for connectors |
| studio-flow-integration.md | Connect Copilot Studio to Power Automate flows |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: B
- Path Name: Studio + Custom Connector
