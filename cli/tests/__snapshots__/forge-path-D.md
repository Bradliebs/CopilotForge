# FORGE.md — [Your Project Name]

<!-- copilotforge: v1.8.0 -->
<!-- copilotforge: path=D -->

## Project Summary
- **Build Path:** D — Canvas App + Copilot Agent
- **Description:** [one-sentence summary of your canvas app]
- **Stack:** Power Apps Canvas + AI Builder
- **Prerequisites:** Power Apps license, Power Platform environment
- **MS Learn:** https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/

## Team Roster
Agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Canvas Companion | Canvas app design, Power Fx, and AI Builder | `.copilot/agents/canvas-companion.md` |
| Planner | Orchestrator — runs the wizard | `.copilot/agents/planner.md` |

## Skills Index
Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| canvas-agent | "build canvas app" | Canvas app authoring and Power Fx patterns |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in `cookbook/` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| powerfx-patterns.md | Common Power Fx formulas and patterns |
| data-connections.md | Connect canvas apps to data sources |
| dataverse-connector.md | Dataverse table design and connector setup |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: D
- Path Name: Canvas App + Copilot Agent
