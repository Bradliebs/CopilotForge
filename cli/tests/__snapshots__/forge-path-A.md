# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.2.0 -->
<!-- copilotforge: path=A -->

## Project Summary
- **Build Path:** A — Copilot Studio Agent
- **Description:** [one-sentence summary of your agent]
- **Stack:** Microsoft Copilot Studio (no-code)
- **Prerequisites:** Microsoft 365 license with Copilot Studio access
- **MS Learn:** https://learn.microsoft.com/en-us/microsoft-copilot-studio/

## Team Roster
Agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | Copilot Studio agent design & publishing | `.copilot/agents/studio-guide.md` |
| Planner | Orchestrator — runs the wizard | `.copilot/agents/planner.md` |

## Skills Index
Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| studio-agent | "build studio agent" | Copilot Studio agent authoring patterns |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in `cookbook/` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| topics-guide.md | Author topics, trigger phrases, and responses |
| studio-flow-integration.md | Connect Copilot Studio to Power Automate flows |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: A
- Path Name: Copilot Studio Agent
