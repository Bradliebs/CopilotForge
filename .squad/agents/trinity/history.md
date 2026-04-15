# Project Context

- **Owner:** Brad Liebs
- **Project:** CopilotForge — a beginner-friendly framework that takes plain-English project descriptions and scaffolds Copilot skills, agents, memory, and cookbook recipes into any repo. No CLI required. Works in VS Code Copilot, Claude Code, or copy-paste. Competes with Squad by inverting the learning curve: describe your goal, get a structured repo.
- **Stack:** Markdown (SKILL.md, agent definitions), TypeScript/Node.js (cookbook recipes), Git (everything commits)
- **Phases:** 1) Planner skill (zero-install entry point), 2) Wizard agent (5-question intake), 3) Cookbook layer (SDK recipe templates), 4) Memory & iteration (decisions.md compounds across sessions)
- **Key output structure:** .copilot/agents/, .github/skills/, forge-memory/, cookbook/, FORGE.md
- **Created:** 2026-04-15

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **SKILL.md frontmatter in this repo uses:** name, description, domain, confidence, source. The Planner adds a `triggers` array — first skill to use explicit trigger phrases in frontmatter. Future skills that need activation triggers should follow this pattern.
- **Existing skills use Context/Patterns/Examples/Anti-Patterns body structure.** All generated skills must match this. It's the repo's contract.
- **Agent definitions are separate from skills.** Skills live in `.github/skills/`, agents in `.copilot/agents/`. Agents reference skills by name. Don't merge them.
- **Confirm-before-scaffold is essential for generative skills.** Any skill that creates files should gate on user confirmation. Learned from Squad's init-mode pattern (Phase 1 proposes, Phase 2 creates only after yes).
- **Portability means no tool-specific assumptions.** The Planner's instructions are pure markdown — no `ask_user` tool calls, no VS Code APIs. Works anywhere an LLM can read markdown. This is the CopilotForge differentiator.
- **Idempotency on re-run matters.** The Planner must skip existing files and append to logs. Overwriting user-customized files would be destructive. Borrowed the skip-if-exists pattern from Squad conventions.

- **2026-04-15: Team delivered Phase 1.** Morpheus provided architecture, Neo built templates for Planner to scaffold, Tank validated the full chain. SKILL.md now portable across contexts.
