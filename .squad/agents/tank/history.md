# Project Context

- **Owner:** Brad Liebs
- **Project:** CopilotForge — a beginner-friendly framework that takes plain-English project descriptions and scaffolds Copilot skills, agents, memory, and cookbook recipes into any repo. No CLI required. Works in VS Code Copilot, Claude Code, or copy-paste. Competes with Squad by inverting the learning curve: describe your goal, get a structured repo.
- **Stack:** Markdown (SKILL.md, agent definitions), TypeScript/Node.js (cookbook recipes), Git (everything commits)
- **Phases:** 1) Planner skill (zero-install entry point), 2) Wizard agent (5-question intake), 3) Cookbook layer (SDK recipe templates), 4) Memory & iteration (decisions.md compounds across sessions)
- **Key output structure:** .copilot/agents/, .github/skills/, forge-memory/, cookbook/, FORGE.md
- **Created:** 2026-04-15

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **2026-04-15 — Phase 1 validation plan created.** Five test artifacts: README, bash validator, PS1 validator, 24 test scenarios, and a beginner QA checklist. Scripts validate output structure, FORGE.md content, SKILL.md frontmatter, cookbook syntax, and cross-reference consistency.
- **2026-04-15 — Re-run behavior is undefined.** EC-05 (scaffold over existing project) can't be fully tested until the team decides merge vs. overwrite vs. refuse. Flagged in decisions inbox.
- **2026-04-15 — No automated wizard test harness yet.** Scenarios are manual because the wizard is conversational. A non-interactive Planner mode or conversation simulator would unlock CI coverage.
- **2026-04-15 — Beginner-friendly is a testable claim.** The beginner checklist treats UX clarity as a pass/fail gate, not a nice-to-have. Recommend testing with an actual beginner, not a team member.

- **2026-04-15: Team delivered Phase 1.** Morpheus, Trinity, Neo all coordinated on contract, skill, and templates. 24 scenarios and validators confirm Phase 1 scope met.
