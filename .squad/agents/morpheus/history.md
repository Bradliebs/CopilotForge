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

- **2026-04-15: Phase 2 contract written — transparent delegation.** The Planner becomes a wizard orchestrator that delegates to four specialist agents (skill-writer, agent-writer, memory-writer, cookbook-writer). Delegation is transparent — users never see the handoffs. Specialists are CopilotForge internals, not user-facing agents in target repos.
- **2026-04-15: FORGE-CONTEXT is the inter-specialist contract.** An in-conversation context block passes wizard answers and created-file lists between specialists. Portable across all LLM contexts, inspectable, no external state needed.
- **2026-04-15: Sequential instruction loading over parallel spawning.** Specialists are loaded as instruction files, not spawned as independent agents. This works in VS Code Copilot, Claude Code, and copy-paste — the three portability targets.
- **2026-04-15: Re-run behavior is detect-then-prompt.** Generated files are skipped if they exist (protect customizations), decisions.md is append-only (preserve history), FORGE.md and cookbook/README.md are regenerated with confirmation (dashboards must reflect reality).
- **2026-04-15: Target repo output unchanged from Phase 1.** Phase 2 changes HOW files are generated, not WHAT files are generated. This means zero regression risk for Phase 1 users.
- **2026-04-15: Each specialist self-checks before returning control.** Validation at the source catches errors early instead of debugging after all files are written. Pattern: every specialist protocol ends with a checklist.
- **2026-04-15: FORGE.md generation stays with the Planner, not a specialist.** FORGE.md is the integration point that references all outputs. Only the orchestrator has the complete picture — don't delegate the thing that requires the full context.

- **2026-04-15: Phase 7 & 8 complete — v1.0 ready.** Beginner navigation (Phase 7) delivered via WHAT-TO-USE.md + persona routing. Wizard Q6 extras (Phase 8) added advanced feature selection. All eight phases verified complete. Architecture is solid: skills → wizard → agents → memory → recipes. Zero critical gaps. Recommendation: ready for publication.
- **2026-04-15: Documentation is the product.** README + GETTING-STARTED + WHAT-TO-USE + CHEATSHEET + FAQ form a complete onboarding funnel. Users never feel lost because documentation anticipates every question. No user should ever ask "where do I start?" — WHAT-TO-USE answers it.

- **2026-04-16: Planning Mode documentation added.** Updated README, GETTING-STARTED, WHAT-TO-USE, CHEATSHEET, and FAQ to explain Planning Mode. Consistent terminology: "Planning Mode", "IMPLEMENTATION_PLAN.md", "Ralph Loop". All beginner-friendly. Added heroic example flow showing autonomous project build from plan.

- **2026-04-16: Command Center recipe + docs delivered.** Created `cookbook/command-center.ts` and `.py` — terminal dashboard recipes with Widget extensibility pattern. Updated README (new section + recipe table), CHEATSHEET (new row), FAQ (new Q&A), and WHAT-TO-USE (new decision path). Zero external dependencies. Credited command-center-lite as inspiration. All additions are additive — no existing content rewritten.

## Learnings

- **2026-04-16: PRD decomposition completed for Brad's improvement ideas.** Analyzed 9 themes (~50 features) against the current codebase (plain JS CLI, 17 source files, 15 skills, Node >=18, zero external deps beyond @github/copilot-sdk). Key finding: the CLI is architecturally simple enough to absorb incremental improvements without a rewrite, but the zero-dependency constraint makes some ideas (local LLM, TUI frameworks, MCP server) non-trivial. Phase 13 (Path Awareness) is still in-progress with 16 uncompleted tasks — new work should not start until Phase 13 lands or is explicitly deprioritized.
- **2026-04-16: Upgrade command already has --dry-run.** Brad's #2 priority (rollback/dry-run) is partially shipped — upgrade.js supports --dry-run. Extending this to init and uninstall is low-effort. Full rollback (snapshot-based) is a new subsystem.
- **2026-04-16: Interactive mode is the default.** Running 
px copilotforge with no args already routes to interactive.js, which is a readline-based menu. This is the natural extension point for a conversational wizard.
- **2026-04-16: dashboard.js uses raw https module.** The HTTP/download logic in dashboard.js uses Node's built-in https module with manual redirect following. Replacing with fetch (Node 18+) would simplify this, but it's contained to one file.
[2026-04-16] — PRD decomposition complete. Brad approved full plan. Neo launched for Phase 13 + immediate wins.
Key decision: local LLM for wizard routing is a moonshot (200MB dep), defer. Ship conversational wizard first.

