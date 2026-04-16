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
   - Complete wizard (six questions) → all specialists run → final scaffolding matches Phase 1 output
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

### 2026-04-16: Phase 9 — Squad-inspired upgrades (v1.2.0)

**By:** Squad (Coordinator)

**What:** After researching bradygaster/squad, adopted 4 patterns:

1. `copilotforge upgrade` command — updates framework files without touching user state
2. Git Safety Protocol in plan-executor — no `git add .`, pre-commit checklist, rollback protocol
3. Curated cookbook learning path — beginner → intermediate → advanced tiers
4. Hardened task automation loop — graceful shutdown, 4-tier error escalation, checkpoint persistence

**Why:** Squad's production-hardened patterns improve CopilotForge's reliability and developer experience.

---

### Phase 10: Interactive Command Center (v1.3.0)

**Source:** Neo, Morpheus, Trinity
**Date:** 2026-04-16
**Status:** Implemented

Added an interactive Command Center as the default `copilotforge` experience:
- `copilotforge` (no args) → interactive home screen with dashboard + numbered menu
- Zero new dependencies (pure Node.js readline)
- Context-aware menu: items appear/disappear based on project state
- Plan viewer: colored ✅/⬜/❌ task list from IMPLEMENTATION_PLAN.md
- Getting started guide: inline markdown viewer
- `menu(items)` utility in utils.js for reusable numbered menus
- Status.js refactored with 7 data-returning functions (getPlanData, getMemoryData, etc.)

**Files created:** `cli/src/interactive.js`
**Files modified:** `cli/src/utils.js`, `cli/src/status.js`, `cli/bin/copilotforge.js`, `cli/package.json`, `cookbook/command-center.ts`

**Design principle:** A total beginner types one word, sees their project at a glance, picks a number. No commands to memorize. The loop stays open until Exit.

---


### Decision: templates.js Split Executed (Phase 13 Prep)

# Decision: templates.js Split Executed (Phase 13 Prep)

**Author:** Neo  
**Date:** 2026-04-16  
**Status:** Implemented  
**Related:** D13-B (Morpheus — getPlatformForge path variant architecture)

---

## What Was Done

Split `cli/src/templates.js` (1,525 lines, 53.5 KB) into a modular directory structure at `cli/src/templates/`. The original file is now a 5-line backward-compatible shim.

## New Structure

```
cli/src/templates/
  index.js          — barrel re-export (backward-compatible entry point)
  forge.js          — FORGE_MD (includes VERSION_STAMP via pkg.version)
  platform-forge.js — getPlatformForge(path) stub for Phase 13 Task 9
  agents.js         — PLANNER_AGENT_MD
  memory.js         — DECISIONS_MD, PATTERNS_MD, PREFERENCES_MD
  cookbook.js       — HELLO_WORLD_TS, HELLO_WORLD_PY, TASK_LOOP_TS, TASK_LOOP_PY
  init.js           — IMPLEMENTATION_PLAN_MD, GETTING_STARTED_MD (includes VERSION_STAMP)
  platform-guides.js — COPILOT_STUDIO_GUIDE_MD, COPILOT_STUDIO_AGENT_YAML,
                        CODE_APPS_GUIDE_MD, CODE_APPS_SETUP_TS,
                        COPILOT_AGENTS_GUIDE_MD, COPILOT_AGENTS_EXAMPLE_MD
```

`cli/src/templates.js` is now:
```javascript
'use strict';
// Backward-compatible shim
module.exports = require('./templates/index');
```

## Backward Compatibility

- All 17 original exports remain identical in name and value
- `require('./templates')` and `const { FORGE_MD } = require('./templates')` both work unchanged
- `init.js` and `upgrade.js` import patterns verified — zero changes needed there
- All 46 existing tests pass (46/46)

## New Export Added

`getPlatformForge(path)` stub in `platform-guides.js`:
- Returns `FORGE_MD` by default (Path J behavior)
- TODO comment marks where Task 9 will add cases for Paths A–I
- Avoids circular dep: requires `./forge` at call time

## VERSION_STAMP Handling

Two templates use `${VERSION_STAMP}`: `FORGE_MD` and `GETTING_STARTED_MD`.  
Both `forge.js` and `init.js` independently declare `VERSION_STAMP` using `require('../../package.json')`.  
The `../../` path resolves correctly from `cli/src/templates/` to `cli/package.json`.

## Grouping Rationale

| File | Contents | Rationale |
|------|----------|-----------|
| forge.js | FORGE_MD | Core control-panel template; isolated for Task 9 extension |
| platform-forge.js | getPlatformForge stub | D13-B: one file for all path variants |
| agents.js | PLANNER_AGENT_MD | Agent definitions group |
| memory.js | DECISIONS/PATTERNS/PREFERENCES | forge-memory templates group |
| cookbook.js | HELLO_WORLD_*, TASK_LOOP_* | Cookbook recipe starters |
| init.js | IMPLEMENTATION_PLAN_MD, GETTING_STARTED_MD | Project setup templates |
| platform-guides.js | COPILOT_STUDIO_*, CODE_APPS_*, COPILOT_AGENTS_* | Platform cookbook guides |

## What Task 9 Must Do

Add cases in `platform-forge.js`:
```javascript
function getPlatformForge(forgePath) {
  switch (forgePath) {
    case 'A': return /* Path A template */;
    // ... cases B-I
    default: return require('./forge').FORGE_MD; // Path J
  }
}
```

Export `getPlatformForge` is already in `index.js` so no changes needed there.

## What Trinity Must Do (Task 2 — FORGE-CONTEXT fields)

Add FORGE-CONTEXT fields to `FORGE_MD` in `forge.js` only. The shim means nothing else needs touching.


---

### Trinity Decision Inbox — FORGE-CONTEXT Path Awareness Fields

# Trinity Decision Inbox — FORGE-CONTEXT Path Awareness Fields

**Author:** Trinity (Prompt Engineer)
**Date:** 2026-07-09
**Task:** Phase 13 — Task 2: Extend FORGE-CONTEXT block with Path Awareness Fields
**Status:** Ready for team review

---

## What Was Done

Added 5 new optional fields to the FORGE-CONTEXT block schema across three files:

1. `.github/skills/planner/reference.md` — Added `### FORGE-CONTEXT Block Schema` subsection with full v1.5.0 field table, v1.6.0 Path Awareness fields table, path values table, examples for Path A and J, and implementation note.
2. `cli/files/.github/skills/planner/reference.md` — Mirrored the same changes (this file tracks the main reference.md).
3. `.copilot/agents/planner.md` — Added the 5 new fields to the inline FORGE-CONTEXT block (after `forge_md_cookbook`).
4. `.github/skills/planner/SKILL.md` — Added a brief callout note between Step 2 and Step 3 about path-detection populating these fields.

---

## The 5 New Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `BUILD_PATH` | string (A–J) | `J` | Which of the 10 build paths this project is on |
| `PATH_NAME` | string | `"Developer Project"` | Human-readable path label |
| `PREREQUISITES_CONFIRMED` | boolean | `false` | User confirmed they meet path prerequisites |
| `EXTENSION_REQUIRED` | boolean | `false` | Path requires pac CLI or browser extension |
| `MS_LEARN_ANCHOR` | string (URL) | `null` | Primary MS Learn landing page for this path |

All fields are **optional** with **explicit defaults**. Specialists must use `?? fallback` patterns. A missing `BUILD_PATH` is identical to `BUILD_PATH: J`.

---

## ⚠️ Default Value Discrepancy — Needs Team Decision

Decision D13-03 in `.squad/decisions/decisions.md` specifies these defaults:
- `PATH_NAME: "Developer Workspace"` — Brad's task spec says `"Developer Project"`
- `PREREQUISITES_CONFIRMED: true` — Brad's task spec says `false`
- `MS_LEARN_ANCHOR: ""` (empty string) — Brad's task spec says `null`

**Trinity's recommendation:** Follow Brad's task spec (used in this implementation). Reasons:
1. `false` is the safer default for PREREQUISITES_CONFIRMED — do not assume users confirmed prerequisites they haven't seen yet.
2. `null` is semantically cleaner than `""` for "no URL" — empty string can cause URL validation errors.
3. "Developer Project" is more accurate than "Developer Workspace" for Path J (aligns with existing language in FORGE.md).

**Action needed:** Morpheus to confirm which defaults are canonical and update D13-03 if needed.

---

## No Existing Fields Were Modified

The following existing v1.5.0 FORGE-CONTEXT fields were documented but NOT changed:
`stack`, `detected_frameworks`, `skill_level`, `agent_names`, `existing_files`, `existing_conventions`, `previous_decisions`, `user_preferences`, `forge_md_cookbook`

---

## Next Step

Task 3 (path-detection logic) will read Q1 + Q2 answers and write these 5 fields into the block before specialist delegation.


---

### Morpheus Ruling — FORGE-CONTEXT Default Values (D13-03 Amendment)

# Morpheus Ruling — FORGE-CONTEXT Default Values (D13-03 Amendment)

**Author:** Morpheus (Lead)
**Date:** 2026-07-09
**Status:** Ruling — Canonical, supersedes D13-03 defaults
**Triggered by:** Trinity's discrepancy report in `trinity-forge-context.md`

---

## The Conflict

D13-03 specifies:
- `PATH_NAME: "Developer Workspace"`
- `PREREQUISITES_CONFIRMED: true`
- `MS_LEARN_ANCHOR: ""`

Trinity's implementation uses:
- `PATH_NAME: "Developer Project"`
- `PREREQUISITES_CONFIRMED: false`
- `MS_LEARN_ANCHOR: null`

---

## Ruling

### PATH_NAME default: `"Developer Project"` ✅ (Trinity is correct)

**Rationale:** "Developer Project" aligns with existing language in FORGE.md, SKILL.md, and the implementation plan — "Developer Workspace" appeared only in D13-03 and has no precedent elsewhere in the codebase.

### PREREQUISITES_CONFIRMED default: `false` ✅ (Trinity is correct)

**Rationale:** A default of `true` would tell downstream specialists the user confirmed prerequisites they were never asked about — the safe default for any unconfirmed boolean is `false`, consistent with our "defaults > questions" principle (never assume what hasn't been verified).

### MS_LEARN_ANCHOR default: `null` ✅ (Trinity is correct)

**Rationale:** `null` means "no value" while `""` means "empty string that happens to be a URL" — `null` avoids URL-validation edge cases and is the idiomatic sentinel for "field not set" in every language we target.

---

## Action Items

1. **D13-03 must be amended** in `.squad/decisions/decisions.md` to read:
   > All 5 new fields have defaults: BUILD_PATH: "J", PATH_NAME: "Developer Project", PREREQUISITES_CONFIRMED: false, EXTENSION_REQUIRED: false, MS_LEARN_ANCHOR: null.

2. **Trinity does NOT need to change her implementation.** Her defaults in `reference.md` are now canonical.

3. **Neo:** When implementing specialist fallbacks (Task 3+), use these defaults in all `?? fallback` patterns.

---

## Design Principle Cited

> "Defaults > questions." — Morpheus history.md, 2026-04-15

A default must be the safest possible value when the user hasn't spoken. `false` is safer than `true` for confirmation fields. `null` is safer than `""` for URL fields. The more specific name ("Developer Project") wins over the vaguer one ("Developer Workspace") because it matches what users already see.


---
## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
- Merge decision inbox entries regularly
- Archive superseded decisions with date and rationale for change

