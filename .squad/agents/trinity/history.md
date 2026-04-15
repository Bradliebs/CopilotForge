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

- **Phase 2 agent architecture: transparent delegation.** The Planner is the only public-facing agent. Four specialists (skill-writer, agent-writer, memory-writer, cookbook-writer) are internal — the user never sees them. This keeps the UX simple while allowing each specialist to have focused, high-quality system prompts.
- **Specialists have input/output contracts, not free-form instructions.** Each specialist receives typed inputs (wizard answers + prior outputs) and returns structured output lists. This makes composition reliable — the Planner can chain them in order and collect results predictably.
- **Agent-writer has a protected-file rule.** It must never generate or overwrite `planner.md`. This prevents a scaffolding run from clobbering the orchestrator — a subtle but critical safety rail.
- **Memory-writer is gated on activation.** It only runs when `memory=yes`. Other specialists always run. This is the only conditional specialist in the delegation chain.
- **Append-only memory on re-runs.** Both `decisions.md` and `patterns.md` use append-only semantics. Contradicting patterns get a note, not a deletion. This preserves project history and avoids destructive re-scaffolding.
- **Template planner.md now points to the canonical agent.** The `templates/agents/planner.md` file is marked deprecated with a redirect to `.copilot/agents/planner.md`. Keeps backward compat without duplication drift.

- **2026-04-15: Jargon leak remediation — two-layer prompt architecture.** Agent definitions that serve dual purposes (LLM system prompt + user reference) need explicit layering. User-visible sections (Role, Scope, Boundaries) must be jargon-free. LLM-consumed sections can contain internal delegation details but should be clearly marked (e.g., `### Internal Delegation Protocol` with an HTML comment). This prevents beginners from encountering internal plumbing while preserving the orchestration information the LLM needs.
- **Cross-references between agents create coupling leaks.** When agent A's Boundaries section says "I don't handle X (agent-B)", it exposes agent-B's name to anyone reading agent A. Describe capabilities functionally ("I don't handle skill generation") instead of by agent name. Internal agents still know their own identity from their System Prompt — they don't need to name each other.

- **Phase 8 added Question 6 (Extras shopping list) to the wizard.** Fixed 6 stale references across user-facing and internal docs. Rule: user-facing docs use "a few questions" (future-proof); internal/test docs update to "6 questions" (precise).


## 2026-04-15 --- Phase 2.1: Jargon Remediation
Duration: 239s | Tool Calls: 31 | Status: COMPLETE

Applied two-layer architecture to agent definitions. Scrubbed .copilot/agents/ files of specialist terminology. Added Internal Delegation Protocol section. Removed internal agent names from user-visible sections.

- **Planning mode is conditional on Q6 "Task automation" selection.** It generates IMPLEMENTATION_PLAN.md only when the user opts in. The plan uses `- [ ] task-id — Task title` format matching what ralph-loop expects. Section numbering shifted: old 3e (FORGE.md) became 3f to accommodate 3e (Planning Mode). Both SKILL.md and reference.md must stay in sync with their cli/files/ mirrors.
