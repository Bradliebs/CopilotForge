# FORGE.md — [Your Project Name]

<!-- copilotforge: v1.7.0 -->
<!-- copilotforge: path=F -->

## Project Summary
- **Build Path:** F — PCF Code Component
- **Description:** [one-sentence summary of your PCF component]
- **Stack:** TypeScript + PCF Framework + pac CLI
- **Prerequisites:** Node.js ≥16, pac CLI, Power Platform environment
- **MS Learn:** https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview

## Team Roster
Agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Component Engineer | PCF component development, TypeScript, and pac CLI | `.copilot/agents/component-engineer.md` |
| Planner | Orchestrator — runs the wizard | `.copilot/agents/planner.md` |

## Skills Index
Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| pcf-component | "build PCF component" | PCF TypeScript component authoring and deployment |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in `cookbook/` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| pcf-component.ts | TypeScript PCF component scaffold |
| pcf-manifest.md | ControlManifest.Input.xml structure and field reference |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: F
- Path Name: PCF Code Component
