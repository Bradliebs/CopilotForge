# FORGE.md — [Your Project Name]

<!-- copilotforge: v3.0.0 -->
<!-- copilotforge: path=C -->

## Project Summary
- **Build Path:** C — Declarative Agent
- **Description:** [one-sentence summary of your declarative agent]
- **Stack:** Microsoft 365 Copilot Agent Builder (no-code)
- **Prerequisites:** Microsoft 365 Copilot license
- **MS Learn:** https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-declarative-agents

## Team Roster
Agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Declarative Builder | M365 declarative agent manifest & actions | `.copilot/agents/declarative-builder.md` |
| Planner | Orchestrator — runs the wizard | `.copilot/agents/planner.md` |

## Skills Index
Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| declarative-agent | "build declarative agent" | Declarative agent manifest authoring |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in `cookbook/` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| manifest-guide.md | Declarative agent manifest structure and fields |
| action-setup.md | Configure OpenAPI actions for declarative agents |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: C
- Path Name: Declarative Agent
