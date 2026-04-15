# Squad Decisions

## Active Decisions

### Architecture: Phase 2 Wizard Orchestrator with Transparent Delegation

**Source:** Morpheus, Trinity, Neo
**Date:** 2026-04-15
**Status:** Implemented

The Planner agent orchestrates four internal specialists via transparent delegation:
- **skill-writer** — generates SKILL.md files
- **agent-writer** — generates agent definition files (never touches planner.md)
- **memory-writer** — generates forge-memory files (append-only on re-runs)
- **cookbook-writer** — generates cookbook recipes

Users see only the Planner. Specialists are invisible internal agents with strict input/output contracts.

**Key Design Principles:**
1. Transparent delegation — users don't see internal plumbing
2. Sequential instruction loading — works in any LLM context
3. FORGE-CONTEXT block for data passing between specialists
4. skill-writer runs before agent-writer (ordering dependency)
5. memory-writer parallel-eligible with cookbook-writer
6. Planner generates FORGE.md itself (not delegated)
7. Skip-on-exist for generated files
8. Append-only for decisions.md
9. Regenerate FORGE.md with user confirmation
10. Specialist agents are CopilotForge internals (not user-visible)
11. Target repo output unchanged from Phase 1
12. Section-level FORGE.md merge deferred to Phase 3
13. Each specialist has a self-check protocol
14. cookbook/README.md always regenerated

**Deferred to Future Phases:**
- FORGE.md as live config surface (Phase 3)
- Section-level merge for FORGE.md re-runs (Phase 3)
- Custom specialist agents (Phase 3)
- Parallel agent spawning runtime (Phase 3)
- Memory iteration across sessions (Phase 4)
- User-defined skill types in wizard (Phase 4)
- Plugin system for cookbook recipes (Phase 4)
- CI/CD integration (Phase 4)
- Multi-repo scaffolding (Phase 4)

**Files Created/Updated:**
- .copilot/agents/planner.md — Wizard orchestrator
- .copilot/agents/skill-writer.md — SKILL.md generator specialist
- .copilot/agents/agent-writer.md — Agent definition generator specialist
- .copilot/agents/memory-writer.md — Memory file generator specialist
- .copilot/agents/cookbook-writer.md — Cookbook recipe generator specialist
- 	emplates/agents/planner.md — Updated to redirect to canonical agent
- docs/delegation-protocol.md — Full protocol spec
- 	emplates/utils/rerun-detection.md — Re-run detection spec
- .github/skills/planner/SKILL.md — Updated with delegation instructions
- eference.md — Updated with FORGE-CONTEXT spec and re-run rules

---

### Re-Run Strategy: Skip-On-Exist with Append-Only Memory

**Source:** Neo, Tank
**Date:** 2026-04-15
**Status:** Pending Consensus on 3 Sub-Scenarios

**Core Decision:**
- Never overwrite user-edited files. Generated files use skip-if-exists pattern.
- FORGE.md gets section-level merge (deferred to Phase 3; currently confirm-and-replace)
- decisions.md gets append-only protocol
- patterns.md gets additive merge
- Partial scaffolding is acceptable if one specialist fails

**Open Sub-Decisions (Tank — 2b):**

1. **Should deleted generated files be re-created?**
   - Scenario: User deletes .copilot/agents/reviewer.md, then re-runs
   - Recommendation: Yes, re-create with warning
   - Rationale: Users who deliberately deleted it can delete again; accidental deletions recover

2. **What happens when memory=no on re-run but forge-memory/ exists?**
   - Scenario: First run with memory=yes creates orge-memory/. Second run with memory=no.
   - Recommendation: PRESERVE directory and warn. Never delete user data.
   - Rationale: User may have added custom entries. Deletion is unrecoverable.

3. **What does "merge" mean for FORGE.md?**
   - Scenario: User added custom sections. Re-run needs to update generated tables.
   - Questions: Use markers/comments to identify generated vs. user content?
   - Recommendation: Use HTML comments as merge markers (e.g., <!-- forge:generated -->)

**Impact:**
- All specialist agent templates use {{placeholder}} syntax from Phase 1
- Delegation protocol documented at docs/delegation-protocol.md
- Re-run detection spec at templates/utils/rerun-detection.md

---

### Known Issue: Jargon Leak in User-Facing Templates

**Source:** Tank (Critical Finding)
**Date:** 2026-04-15
**Status:** Identified — Requires Remediation Before Release

**What:**
24 validator failures found. Specialist agent names and term "specialist" appear in:
- 	emplates/FORGE.md (user's project control panel)
- 	emplates/agents/planner.md (user-visible agent file)
- 	emplates/agents/skill-writer.md, gent-writer.md, memory-writer.md, cookbook-writer.md

**Why It Matters:**
Beginners should never encounter internal delegation terminology. If FORGE.md says "skill-writer agent," users will search for it and find nothing, causing confusion.

**Required Fix:**
- Scrub all specialist names from user-facing content
- Internal names should only appear in docs/delegation-protocol.md and internal configuration
- User-facing agent files can reference what they do ("creates skill definitions") without revealing internal names
- Consider separating "User-Visible Content" from "System Configuration" sections in specialist templates

**Owners:** Neo (agent templates), Trinity (FORGE.md template)

---

### Test Coverage: Phase 2 Validation Matrix

**Source:** Tank (Tester)
**Date:** 2026-04-15
**Status:** Complete — 40 Scenarios Defined

**Test Categories:**

1. **Delegation Flow** (8 scenarios)
   - Specialist ordering: skill-writer → agent-writer → memory-writer → cookbook-writer
   - Isolation: each specialist receives correct inputs
   - Dependency handling: skill names passed correctly to agent-writer
   - Error propagation: partial failures handled gracefully

2. **Re-Run Scenarios** (12 scenarios)
   - File preservation: user edits survive re-runs
   - Memory handling: decisions.md append-only, patterns.md additive
   - Re-created files: deleted generated files are restored
   - Configuration changes: memory=no handling when directory exists

3. **Specialist Self-Checks** (8 scenarios)
   - skill-writer: empty sections detected
   - agent-writer: broken skill references caught
   - memory-writer: append protocol validation
   - cookbook-writer: stack-mapping table integrity

4. **FORGE-CONTEXT Integrity** (8 scenarios)
   - Data passed between specialists correctly
   - Context block format preserved
   - No data loss in multi-specialist flows
   - Error recovery with partial context

5. **End-to-End Beginner Flow** (4 scenarios)
   - Complete wizard (five questions) → all specialists run → final scaffolding matches Phase 1 output
   - Different tech stacks (Node.js, Python, C#)
   - With and without memory option
   - Re-run with template updates

**All 40 scenarios defined with validators in 	ests/phase2/**

---

### Additional Open Concerns (Tank — Phase 2)

**1. Cross-Reference Check Limitations**
- Template files use {{placeholder}} syntax which looks like broken references to validator
- Workaround: Updated validators to skip {{...}} patterns
- Recommendation for Phase 3: Add "strict mode" flag (for scaffolded output, no placeholders allowed) vs. template mode (placeholders allowed)

**2. No Automated Wizard Test Harness** (Carried from Phase 1)
- All 40 scenarios are manual because wizard is conversational
- Phase 2 adds delegation, specialist isolation, error recovery — all hard to test manually
- Recommendation: Prioritize --dry-run or --non-interactive mode accepting JSON input, producing structured output
- Would unlock CI for ~30 of 40 scenarios

**3. Specialist Agent Templates Are User-Facing**
- Agent definition files in 	emplates/agents/ are copied to users' .copilot/agents/
- Current specialist templates contain references to each other (coordination details)
- When beginner opens .copilot/agents/skill-writer.md, they see internal details they shouldn't need
- Recommendation: Two-layer structure — User-visible content vs. System Configuration section (clearly marked "you can ignore this")

---

### Architecture: Phase 3 Cookbook Layer

**Source:** Morpheus
**Date:** 2026-04-16
**Status:** Draft — Pending Team Consensus

Phase 3 delivers the full cookbook catalog (29 recipes across 7 categories), file-based stack detection, FORGE.md live config with merge markers, and an expanded cookbook-writer agent. Full specification at `docs/phase3-architecture.md`.

**Key Design Decisions:**

1. **File-based stack detection over wizard-only.** Manifest files (package.json, requirements.txt, go.mod, .csproj) are authoritative; wizard answer is fallback. Rationale: structured files are unambiguous; free-text parsing is fragile.

2. **MCP recipes are detection-gated, not default.** Only generated when MCP SDK is in dependencies or wizard explicitly mentions MCP. Rationale: beginners shouldn't get specialized recipes they didn't ask for.

3. **ORM-specific beats generic — never both.** If Prisma is detected, generate `db-prisma.ts` but not `db-query.ts`. One DB recipe per language. Rationale: avoids "which one do I use?" confusion for beginners.

4. **FORGE.md manifest comment for removal tracking.** Hidden HTML comment (`<!-- forge:cookbook:manifest:[...] -->`) tracks which recipes were previously generated, so the merge algorithm can distinguish "user removed this" from "never generated." Rationale: without this, re-runs would re-add recipes users deliberately deleted.

5. **CopilotForge-internal recipes don't get templates.** `delegation-example.ts` and `skill-creation-example.ts` are contributor documentation, not scaffolded into user repos. Rationale: they reference internal specialist names, violating the no-jargon-leaks rule.

6. **Verbosity as agent instruction, not template engine.** Templates include all 3 verbosity variants as marked blocks; the cookbook-writer selects the matching level. No conditional template engine needed. Rationale: keeps system dependency-free and works in any LLM context.

7. **Four languages in Phase 3 (TS, PY, Go, C#).** Covers >90% of Copilot agent development. Ruby, PHP, Java, Rust deferred to Phase 4 as language packs.

**Deferred to Phase 4:**
- Angular component recipes (complex component model needs its own pass)
- Go/C# MCP recipes (SDKs not yet stable)
- Recipe plugin system for custom categories
- Recipe versioning / update flow for existing users
- Strict mode validator (no `{{placeholder}}` remnants in scaffolded output)

**Files Created/Updated:**
- docs/phase3-architecture.md — Full architecture contract
- .copilot/agents/cookbook-writer.md — Expanded (pending implementation)
- cookbook/ — 27 new recipe files (pending implementation)
- templates/cookbook/ — 23 new template files (pending implementation)

---

### Architecture: Phase 4 Memory & Iteration

**Source:** Morpheus
**Date:** 2026-04-16
**Status:** Draft — Pending Team Consensus

Phase 4 delivers the memory read-back loop that makes CopilotForge learn across sessions. The Planner reads existing `forge-memory/` files before the wizard, adapts its behavior based on known context, extracts conventions from generated output, and compounds context across sessions. Full specification at `docs/phase4-architecture.md`.

**Key Design Decisions:**

1. **Memory is advisory, never blocking (D4-01).** If memory parsing fails, the system degrades to the full wizard. A broken `decisions.md` never prevents scaffolding. Rationale: zero friction for beginners is more important than perfect memory.

2. **FORGE-MEMORY extends FORGE-CONTEXT (D4-02).** Memory data is a new section in the existing inter-specialist context block, not a parallel mechanism. Rationale: one contract, not two.

3. **Confidence levels as inline HTML comments (D4-03).** Pattern confidence (`observed`/`confirmed`/`established`) is tracked via HTML comments invisible to casual readers. Rationale: machine metadata shouldn't clutter the user's conventions file.

4. **Memory clearing archives, never deletes (D4-04).** "Start fresh" renames files to `.bak.{date}`. Rationale: follows the Phase 1 principle of never destroying user data.

5. **Two new memory files: history.md + preferences.md (D4-05).** Session activity log and user preferences are distinct concerns from decisions and patterns. Rationale: each file has its own read/write/summarize lifecycle.

6. **500-line memory budget with in-place summarization (D4-06).** Total memory context capped at ~500 lines. Older entries summarized in-place when exceeded. Rationale: memory must not crowd out generation instructions in the context window.

7. **Adaptive wizard for returning users (D4-07).** Returning users see a project summary + four action choices instead of 5 questions. Rationale: re-asking known answers is the opposite of learning.

8. **Per-agent memory via instruction filtering (D4-08).** All specialists get the full FORGE-MEMORY block; each reads only relevant sections per Planner instructions. Rationale: one memory block is simpler than per-specialist files.

9. **Summarization is the sole exception to append-only (D4-09).** When decisions exceed the budget, older entries are compressed to one-liners. Logged as a decision itself. Rationale: unbounded append creates unusable files.

10. **Memory versioning via line-1 HTML comment (D4-10).** Version comment on the first line of each memory file enables future format migration. Rationale: cheap insurance for forward compatibility.

**Deferred to Phase 5:**
- Custom specialist agents (user-defined)
- Plugin system for cookbook recipes
- CI/CD integration
- Memory sharing across repos
- Memory archival to `forge-memory/archive/`
- Angular component recipes, Go/C# MCP recipes
- User-defined skill types in wizard

**Files Created/Updated:**
- docs/phase4-architecture.md — Full architecture contract
- .copilot/agents/memory-writer.md — Updated (pending implementation)
- .copilot/agents/planner.md — Updated (pending implementation)
- .copilot/agents/skill-writer.md — Updated (pending implementation)
- .copilot/agents/agent-writer.md — Updated (pending implementation)
- .copilot/agents/cookbook-writer.md — Updated (pending implementation)
- .github/skills/planner/SKILL.md — Updated (pending implementation)
- templates/forge-memory/history.md — Created (pending implementation)
- templates/forge-memory/preferences.md — Created (pending implementation)

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
- Merge decision inbox entries regularly
- Archive superseded decisions with date and rationale for change
