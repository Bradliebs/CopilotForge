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

- **Phase 2 delegation infrastructure built (2026-04-15):** Created 10 files — delegation protocol (docs/delegation-protocol.md), 4 specialist agent templates (skill-writer, agent-writer, memory-writer, cookbook-writer), re-run detection spec (templates/utils/rerun-detection.md), 2 cookbook recipes (delegation-example.ts, skill-creation-example.ts), cookbook/README.md index, and updated templates/FORGE.md. Design decisions: skill-writer runs first (agent-writer depends on skill names), memory-writer and cookbook-writer run in parallel, re-run detection uses additive merge (never delete user edits). Input/output contracts are YAML-shaped but flow as structured markdown in practice.
- **Delegation ordering matters:** skill-writer → agent-writer is sequential (agents reference skills), but memory-writer and cookbook-writer run in parallel with agent-writer since they have no cross-dependencies. This is documented in docs/delegation-protocol.md.
- **Re-run safety principle:** Existing files are never overwritten without explicit user consent. FORGE.md gets a merge (preserve Project section, regenerate tables), decisions.md gets append-only, patterns.md gets additive merge, everything else is skip-if-exists.

- **Jargon leak fix (2026-04-15):** Scrubbed internal specialist agent names (skill-writer, agent-writer, memory-writer, cookbook-writer) and the word "specialist" from all user-facing templates. Moved 4 specialist agent templates from `templates/agents/` to `templates/internal/agents/` — they're internal to CopilotForge and should never be scaffolded into user repos. FORGE.md Team Roster now shows only user-facing agents (Planner, Reviewer, Tester). Quick Actions use plain language instead of referencing internal agent names. Planner template describes what it does, not how it delegates internally — internal delegation details are wrapped in HTML comments for LLM consumption only.
- **User-facing vs internal separation pattern:** `templates/agents/` = gets scaffolded into user repos. `templates/internal/agents/` = CopilotForge's own delegation plumbing. This two-layer structure keeps beginners from seeing internal architecture they don't need.
- **Jargon leak prevention rule:** Never reference internal agent names in content that ends up in user repos. Describe capabilities ("generates skill definitions") not mechanisms ("delegates to skill-writer"). Internal names belong in docs/delegation-protocol.md and HTML comments only.

## 2026-04-15 --- Phase 2.1: Jargon Remediation
Duration: 633s | Tool Calls: 65 | Status: COMPLETE

Separated specialist agent templates from user-facing scaffolding. Moved internal agents to templates/internal/agents/. Scrubbed templates/FORGE.md and templates/agents/planner.md of specialist terminology. Validator: PASS.
