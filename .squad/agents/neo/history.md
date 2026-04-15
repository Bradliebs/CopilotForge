# Project Context

- **Owner:** Brad Liebs
- **Project:** CopilotForge — a beginner-friendly framework that takes plain-English project descriptions and scaffolds Copilot skills, agents, memory, and cookbook recipes into any repo. No CLI required. Works in VS Code Copilot, Claude Code, or copy-paste. Competes with Squad by inverting the learning curve: describe your goal, get a structured repo.
- **Stack:** Markdown (SKILL.md, agent definitions), TypeScript/Node.js (cookbook recipes), Git (everything commits)
- **Phases:** 1) Planner skill (zero-install entry point), 2) Wizard agent (5-question intake), 3) Cookbook layer (SDK recipe templates), 4) Memory & iteration (decisions.md compounds across sessions)
- **Key output structure:** .copilot/agents/, .github/skills/, forge-memory/, cookbook/, FORGE.md
- **Created:** 2026-04-15

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **Phase 1 templates built (2026-04-15):** Created 8 template files under 	emplates/ — FORGE.md (control panel), forge-memory/decisions.md, forge-memory/patterns.md, agents/planner.md, agents/reviewer.md, agents/tester.md, cookbook/session-example.ts, cookbook/session-example.py. Used {{placeholder}} syntax for string replacement — no template engine needed. Cookbook recipes are fully self-contained with all imports, error handling, and TODO markers for actual SDK integration. Agent definitions follow a simplified version of Squad's charter format.
- **Template design principle:** Every generated file includes a comment header explaining what it is and why it exists. Templates explain their own format so beginners can extend them without reading docs.
- **FORGE.md is the control panel:** It's the single file beginners interact with. Everything else is discoverable from FORGE.md's tables and links.
- **2026-04-15: Team delivered Phase 1.** Morpheus architected scope, Trinity built Planner to invoke templates, Tank validated template outputs. All 8 templates ready for runtime generation.
