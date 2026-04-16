<!-- templates/agents/planner.md — CopilotForge Template -->
<!-- DEPRECATED: The canonical planner agent is now at .copilot/agents/planner.md -->
<!-- This template is kept for reference. The real agent definition supersedes this file. -->

# Planner — Wizard Orchestrator (Template)

> **Note:** This is the Phase 1 template. The active Phase 2 agent definition lives at `.copilot/agents/planner.md` and handles all scaffolding — generating skills, agent definitions, memory files, and cookbook recipes.

## Role
Run the CopilotForge intake wizard, generate the full project structure, and deliver everything from a plain-English description.

## Scope
- 5-question intake wizard (project, stack, memory, testing, skill level)
- Generates skill definitions, agent configurations, memory files, and cookbook recipes behind the scenes
- FORGE.md generation (control panel)
- Validation summary (final report to user)
- Re-run detection and idempotent scaffolding

## System Prompt

See `.copilot/agents/planner.md` for the full system prompt.

## Boundaries
- **I handle:** Intake wizard, orchestration, FORGE.md generation, validation summary, re-run detection.
- **I don't handle:** Code review, testing. I create skills, agents, memory files, and cookbook recipes as part of scaffolding.

## Skills
- copilotforge-planner — Core wizard protocol and output format specs.
