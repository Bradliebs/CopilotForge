# Project Context

- **Owner:** Brad Liebs
- **Project:** CopilotForge — a beginner-friendly framework that takes plain-English project descriptions and scaffolds Copilot skills, agents, memory, and cookbook recipes into any repo. No CLI required. Works in VS Code Copilot, Claude Code, or copy-paste. Competes with Squad by inverting the learning curve: describe your goal, get a structured repo.
- **Stack:** Markdown (SKILL.md, agent definitions), TypeScript/Node.js (cookbook recipes), Git (everything commits)
- **Phases:** 1) Planner skill (zero-install entry point), 2) Wizard agent (5-question intake), 3) Cookbook layer (SDK recipe templates), 4) Memory & iteration (decisions.md compounds across sessions)
- **Key output structure:** .copilot/agents/, .github/skills/, forge-memory/, cookbook/, FORGE.md
- **Created:** 2026-04-15

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **2026-04-15: Phase 1 scope is one file.** The entire Phase 1 deliverable is `.github/skills/planner/SKILL.md` + `reference.md`. Everything else (agents, memory, cookbook, FORGE.md) is *output* that the Planner generates at runtime in target repos — not files we ship.
- **2026-04-15: Two namespaces, don't cross them.** `.copilot/skills/` = Squad operational skills. `.github/skills/` = CopilotForge product skills. They share the repo but must not reference each other.
- **2026-04-15: FORGE.md is informational in Phase 1.** It reads like a control panel but doesn't actually control anything yet. Making it a live config surface is Phase 3. This avoids shipping complexity we can't test.
- **2026-04-15: Defaults > questions.** The wizard exists for stuck beginners, but the Planner should scaffold happily from a single sentence. Every question after Q1 has a safe default. Friction is the enemy.
- **2026-04-15: SKILL.md schema is intentionally minimal.** Two required fields (name, description), four optional. No version, no deps, no permissions. Progressive disclosure — beginners shouldn't see fields they don't need.
- **2026-04-15: Never overwrite existing files.** Planner detects conflicts and skips. Merge logic is deferred to Phase 3. Better to under-deliver safely than to destroy someone's work.

- **2026-04-15: Team delivered Phase 1.** Trinity authored Planner SKILL.md (LLM-portable), Neo built 8 scaffolding templates, Tank created 24 validation scenarios. All coordinated from Morpheus architecture contract.
