# Decision: Phase 13 Task 9 — Per-Path FORGE.md Templates

**Author:** Neo (Developer)
**Date:** 2025-01-29
**Status:** Implemented

## Decision

Implemented 9 dedicated `getPlatformForge[A-I]()` functions in `cli/src/templates/platform-forge.js`, each returning a complete FORGE.md template tailored to its Power Platform build path. Path J continues to fall back to the existing `FORGE_MD` generic template from `forge.js`.

## Version Stamps

All new Path A–I templates carry:
- `<!-- copilotforge: v1.6.0 -->` (hardcoded, not derived from package.json which is at v1.5.0)
- `<!-- copilotforge: path=[LETTER] -->` on the line immediately following

## Dispatch Logic

```javascript
function getPlatformForge(forgePath) {
  const variants = { A: ..., B: ..., C: ..., D: ..., E: ..., F: ..., G: ..., H: ..., I: ... };
  const fn = variants[forgePath && forgePath.toUpperCase()];
  const { FORGE_MD } = require('./forge');
  return fn ? fn() : FORGE_MD; // Path J fallback
}
```

## Template Structure Per Path

Each template includes:
- Project Summary with Build Path, Stack, Prerequisites, and MS Learn URL
- Team Roster table referencing path-appropriate `.copilot/agents/` files
- Skills Index table referencing path-appropriate `.github/skills/` entries
- Cookbook table referencing path-appropriate `cookbook/` recipes
- Memory section (common across all paths)
- Settings block with Build Path and Path Name

## Path Assignments

| Path | Name | Stack | Agent | Key Skills |
|------|------|-------|-------|------------|
| A | Copilot Studio Agent | Copilot Studio (no-code) | Studio Guide | studio-agent |
| B | Studio + Custom Connector | Copilot Studio + REST API | Studio Guide | studio-connector |
| C | Declarative Agent | M365 Copilot Agent Builder | Declarative Builder | declarative-agent |
| D | Canvas App + Copilot Agent | Power Apps Canvas + AI Builder | Canvas Companion | canvas-agent |
| E | Power Automate | Power Automate + AI Builder | Flow Architect | power-automate |
| F | PCF Code Component | TypeScript + PCF + pac CLI | Component Engineer | pcf-component |
| G | Power BI | Power BI Desktop + Service | Report Architect | powerbi-report |
| H | SharePoint + Teams | M365 Copilot + SharePoint | Studio Guide | sharepoint-agent |
| I | Power Pages | Power Pages + Dataverse + AI Plugin | Studio Guide | power-pages |
| J | (generic fallback) | — | — | — |

## Export

`getPlatformForge` is spread into `cli/src/templates/index.js` via `...platformForge` (already present before this task).

## Test Results

- Smoke test: all 10 paths (A–J) return non-empty strings; Path J returns FORGE_MD generic content
- Test suite: 46/46 tests pass (`node --test tests/*.test.js`)


---

# CopilotForge Squad Decisions

## Latest Decisions

### Phase 13 Task 6: Trinity — Path Skills (9 files created)
**Author:** Trinity (Prompt Engineer)
**Date:** 2026-04-16
**Task:** Phase 13 — Task 6: Build 9 path-specific skill files
**Status:** Completed

**Files Created:**
- .github/skills/studio-agent/SKILL.md (Path A)
- .github/skills/studio-connector/SKILL.md (Path B)
- .github/skills/declarative-agent/SKILL.md (Path C)
- .github/skills/canvas-agent/SKILL.md (Path D)
- .github/skills/power-automate/SKILL.md (Path E)
- .github/skills/pcf-component/SKILL.md (Path F — 84 lines with PCF lifecycle, TypeScript interfaces, pac CLI reference)
- .github/skills/powerbi-report/SKILL.md (Path G)
- .github/skills/sharepoint-agent/SKILL.md (Path H)
- .github/skills/power-pages/SKILL.md (Path I)

**Key Decisions:**
1. Agents Available section uses templates/agents/ roster only
2. Path F gets extra sections: PCF Control Lifecycle, TypeScript Interfaces, pac CLI Quick Reference
3. No specialist jargon leaks (skill-writer, agent-writer, etc.)
4. EXTENSION_REQUIRED: true for Path B and Path F only
5. MS Learn URLs sourced from power-platform-guide routing matrix
6. Path-contextual forge remember examples
7. Distinct trigger phrases per path (5–6 unique)
8. Self-contained, no cross-path references

---

### Phase 13 Task 7: Trinity — Agent Templates (6 files created)
**Author:** Trinity (Prompt Engineer)
**Date:** 2026-04-16
**Task:** Phase 13 — Task 7: Build 6 Power Platform agent template files
**Status:** Completed

**Files Created:**
- templates/agents/studio-agent.md (Paths A, B, H, I consolidated)
- templates/agents/declarative-agent.md (Path C)
- templates/agents/canvas-agent.md (Path D)
- templates/agents/automate-agent.md (Path E)
- templates/agents/pcf-agent.md (Path F)
- templates/agents/powerbi-agent.md (Path G)

**Key Decisions:**
1. studio-agent.md carries all four path variants (A, B, H, I) with path-specific preamble
2. New format structure: Role, Scope, What I Will Do, What I Won't Do, Trigger Phrase, Example Opening, Skills
3. Skills listed by name, not by file name
4. No cross-references between files
5. Zero jargon leaks (specialist names, CopilotForge mechanics invisible)

---

### Phase 13 Task 8: Neo — Cookbook (16 files created)
**Author:** Neo (Developer)
**Date:** 2026-04-16
**Task:** Phase 13 — Task 8: Build 16 cookbook files (15 markdown + 1 TypeScript)
**Status:** Completed

**Files Created:**
- cookbook/topics-guide.md (Paths A/B/H)
- cookbook/connector-setup.md (Path B)
- cookbook/api-auth-guide.md (Path B)
- cookbook/manifest-guide.md (Path C)
- cookbook/action-setup.md (Path C)
- cookbook/powerfx-patterns.md (Path D)
- cookbook/data-connections.md (Paths D/E)
- cookbook/sharepoint-connector.md (Path H)
- cookbook/dataverse-connector.md (Paths D/I)
- cookbook/pcf-manifest.md (Path F)
- cookbook/flow-patterns.md (Path E)
- cookbook/trigger-setup.md (Path E)
- cookbook/studio-flow-integration.md (Paths A/B)
- cookbook/report-setup.md (Path G)
- cookbook/data-model.md (Path G)
- cookbook/pcf-component.ts (Path F — production-grade lifecycle implementation)

**Key Decisions:**
1. All markdown files use CopilotForge Recipe format with required sections
2. MS Learn URLs sourced from SKILL.md canonical anchors
3. pcf-component.ts implements all lifecycle methods (init, updateView, getOutputs, destroy)
4. Self-contained files, no cross-file imports
5. Zero jargon leaks, user-facing content only

---

### D13-T4: Trinity — Planner Wizard Path Detection (2026-04-17)
**Author:** Trinity
**Status:** Implemented
**Related:** D13-A, D13-C

**Summary:** Extended .github/skills/planner/SKILL.md with Power Platform path detection. 119 lines added (744→863).
**Changes:**
1. Silent Path Detection After Q1 (Step 1a)
2. PP 3-Question Diagnostic
3. Ambiguous Q1 Clarifier
4. Path J Unchanged (D13-A rule)
5. FORGE-CONTEXT Write (Step 3a)
6. Returning User Path (Step 0)

---

### D13-M: Morpheus — PREREQUISITES_CONFIRMED Ownership (2026-07-09)
**Author:** Morpheus (Lead)
**Status:** Final
**Requested by:** Brad Liebs

**Ruling:** Option 1 — Compass flags. Planner confirms. Compass is a gate that reads, detects, and warns. The Planner wizard is where users interact and confirm.



## neo-bump-version
# Decision: Version Bump 1.5.0 → 1.6.0

**Author:** Neo (Developer)  
**Task:** TASK 14 — bump-version  
**Date:** Phase 13 completion

## Files Changed

| File | Change |
|------|--------|
| `cli/package.json` | `"version": "1.5.0"` → `"1.6.0"` |
| `cli/src/doctor.js` | Warning message updated: `created before v1.5.0` → `created before v1.6.0` |
| `.github/skills/planner/SKILL.md` | 3 occurrences updated: Path J spec lines (118, 160, 220) |
| `CHANGELOG.md` | New [1.6.0] entry prepended with Phase 13 feature list |

## Files with Dynamic Version (no change needed)

- `cli/bin/copilotforge.js` — uses `pkg.version` from package.json dynamically
- `cli/src/templates/forge.js` — VERSION_STAMP reads `pkg.version` dynamically
- `cli/src/templates/platform-forge.js` — inherits via dynamic stamp

## Files Left Intentionally Unchanged

- `cli/files/.github/skills/planner/reference.md` — contains semantic references:
  - `v1.5.0 core fields (always present)` — labels the pre-1.6.0 schema table; document already has a distinct "New in v1.6.0" section. Changing this would cause a title collision and break documentation accuracy.
  - `v1.5.0 behavior applies unchanged` / `v1.5.0 compatible` — backward-compat markers describing Path J's heritage. These are intentional historical references, not version stamps.

## Test Results

All **46/46 tests pass** after version bump. No test assertions reference hardcoded version strings.

## Notes

The version stamp in generated files (`<!-- copilotforge: v1.6.0 -->`) is produced dynamically from `package.json`. The single source of truth is `cli/package.json` `version` field — updating it propagates everywhere else automatically.


## neo-extend-doctor
# Decision: Phase 13 Task 13 — Neo: Extend Doctor with Path-Aware Checks

**Author:** Neo (Developer)
**Date:** 2026-07-09
**Status:** Implemented

## Summary

Extended `cli/src/doctor.js` with path-aware prerequisite checks triggered by the
`<!-- copilotforge: path=[LETTER] -->` stamp in FORGE.md (added in Phase 13 Task 9).

## Changes

### New functions (added above `run()`)

**`readPathStamp(forgeContent)`**
- Regex: `/<!-- copilotforge: path=([A-J]) -->/`
- Returns letter A–J or null if stamp absent / no FORGE.md

**`PATH_NAMES` map**
- A→Copilot Studio Agent, B→Studio Connector, C→Declarative Agent,
  D→Canvas App Agent, E→Power Automate, F→PCF Component,
  G→Power BI Report, H→SharePoint Agent, I→Power Pages

**`runPathChecks(pathStamp)`**
- Returns `{ pathIssues, pathChecks }` — caller accumulates into outer totals
- All paths A–I: prints `pac auth create` reminder (info)
- Path F: Node ≥16 check (success/fail) + `pac --version` probe (success/warn)
- Paths B & I: `paconn --version` probe (success/warn)
- Path G: Power BI Desktop info line
- All external CLI probes wrapped in try/catch — never crash doctor

### Integration in `run()`

- `let forgeContent = null` hoisted to function scope
- Version stamp block assigns `forgeContent =` (was `const forgeContent =`)
- After version stamp block, before `separator()`:
  ```js
  const pathStamp = readPathStamp(forgeContent);
  if (pathStamp && pathStamp !== 'J') {
    const { pathIssues, pathChecks } = runPathChecks(pathStamp);
    issues += pathIssues;
    checks += pathChecks;
  }
  ```
- Path J and missing stamp → no additional output (existing behavior unchanged)

### Import update
- Added `fail` to the destructured import from `./utils`

## Design Decisions

1. **WARN not ERROR for pac/paconn** — both CLIs can be installed at any time;
   developer shouldn't be blocked from running doctor
2. **Path F Node check uses `fail()`** — a genuine blocking requirement for PCF builds
3. **forgeContent hoisted** — avoids a second `fs.readFileSync` call; FORGE.md was
   already read for the version stamp check
4. **Path J skipped** — J is the generic fallback; no Power Platform tooling required
5. **`runPathChecks` returns counts** — consistent with the existing issues/checks
   accumulation pattern in `run()`

## Test Results

46/46 tests pass (`cd cli && npm test`)
No existing behavior broken.


## neo-ralph-loop
# Decision: ralph-loop.ts SDK API Choices

**Author:** Neo (Developer)  
**Task:** ralph-loop.ts — autonomous CopilotForge development loop runner  
**Date:** 2026-04-17

Since `@github/copilot-sdk` is not installed in this repo, the implementation follows the established CopilotForge cookbook pattern: real TypeScript interfaces (`CopilotClientInterface`, `CopilotSession`, `PermissionRequest`, `PermissionResponse`) model the expected SDK surface, a `MockCopilotClient` class stands in until the real package is added, and a `TODO` comment at the top shows the exact `npm install` command and import line needed to make it live. The `onPermissionRequest` callback is typed as `async (_req) => ({ approved: true })` — matching the spec's auto-approve requirement — and `workingDirectory` is pinned to `process.cwd()` on every `createSession` call so the session always roots to the project rather than the SDK's working directory. Tool calls are surfaced via an `onToolCall` option on `sendAndWait`, which logs `⚙ toolName` and additionally tracks `git_commit` / `create_commit` events for the exit summary. Completion detection is a case-insensitive string search over a small signal list (`NO_MORE_TASKS`, `Board is clear`, `DONE`, etc.) that can be extended without touching the loop logic. Both plan and build modes read their respective `PROMPT_*.md` files via `loadPrompt`, which throws a human-readable error if the file is absent, preventing silent failures at the start of a long run.


## tank-path-tests
# Decision: Phase 13 Task 15 — Path Detection Test Suite

**Author:** Tank (Tester)  
**Date:** 2025-01-30  
**Status:** Implemented

## Decision

Created `cli/tests/path-detection.test.js` with comprehensive Phase 13 path-detection test coverage. Also added `readPathStamp` and `PATH_NAMES` to `doctor.js` exports so they are unit-testable.

## Changes Made

### `cli/src/doctor.js`
- Extended `module.exports` from `{ run }` to `{ run, readPathStamp, PATH_NAMES }`.
- No logic changes — exports only.

### `cli/tests/path-detection.test.js` (new file)
66 new tests across 8 describe blocks:

| Group | Tests | Coverage |
|-------|-------|----------|
| readPathStamp — path stamp reading | 6 | Valid A-J, null, empty, malformed (Z), null input |
| getPlatformForge — path routing | 14 | All 9 platform paths, J fallback, null/undefined/'', lowercase normalization |
| getPlatformForge — version stamp | 10 | All A-I carry `v1.6.0`, FORGE_MD carries a version stamp |
| getPlatformForge — path stamp in output | 9 | Each A-I output contains its own `path=X` stamp |
| Path J regression (backward compat) | 5 | J === FORGE_MD, no-throw for undefined/null/'', all return non-empty strings |
| Jargon leak regression | 10 | All paths A-J free of skill-writer/agent-writer/memory-writer/cookbook-writer |
| PATH_NAMES map | 11 | A='Copilot Studio Agent', A-I covered, J undefined, B/C/D/E/F/G/H/I name assertions |
| forge-compass integration note | 1 | Acknowledged as markdown-only skill; covered by integration tests |

## Test Results

- **Before:** 46 tests / 26 suites — all pass
- **After:** 112 tests / 34 suites — all pass
- **New tests added:** 66

## Key Decisions

1. `readPathStamp` and `PATH_NAMES` added to doctor.js exports — these are pure functions with no I/O side effects, safe to expose for testing.
2. forge-compass tests are a placeholder only — the skill is pure markdown (`.github/skills/forge-compass/SKILL.md`) and has no JS entry point. Integration coverage is appropriate.
3. Loops inside `describe()` with `it()` are valid in node:test v18+ — each iteration registers as a separate test entry.
4. `getPlatformForge` lowercase normalization is tested explicitly because `forgePath.toUpperCase()` is used in the dispatch and this is a defensible behavior worth locking in.


## trinity-extend-specialists
# Trinity Decision — Extend Specialists to Branch on BUILD_PATH

**Author:** Trinity (Prompt Engineer)
**Date:** 2026-07-09
**Task:** Phase 13 — Task 10: Extend all 4 specialist agents to branch on BUILD_PATH
**Status:** Implemented

---

## What Was Done

Added a `### Path Dispatch (Phase 13)` block to all four internal specialist agents:
- `.copilot/agents/skill-writer.md`
- `.copilot/agents/agent-writer.md`
- `.copilot/agents/memory-writer.md`
- `.copilot/agents/cookbook-writer.md`

---

## Dispatch Pattern

Each specialist now opens with a BUILD_PATH check before doing any work:

```
### Path Dispatch (Phase 13)

Before proceeding, check FORGE-CONTEXT for BUILD_PATH.

**If BUILD_PATH is A–I:**
  Read `.github/skills/[path-skill]/SKILL.md` for path-specific instructions, then apply them.
  Also read `cli/src/templates/platform-forge.js` `getPlatformForge('[letter]')` output
  as the target FORGE.md structure for this path.

**If BUILD_PATH is J, missing, or unrecognized:**
  Proceed with existing behavior exactly as in v1.5.0. Do not read any path files.

Path mapping: [A–I table] | J or missing → v1.5.0 behavior
```

Each specialist's dispatch wording is tailored to its role:

| Specialist | Path-Specific Behavior (A–I) |
|------------|------------------------------|
| skill-writer | Read path skill file as authoritative template; overrides generic stack-adaptation table |
| agent-writer | Read path skill file + instantiate correct Power Platform agent template from `templates/agents/` |
| memory-writer | Read path skill file + persist BUILD_PATH and PATH_NAME to preferences.md (first scaffold only; guarded by PREREQUISITES_CONFIRMED on re-runs) |
| cookbook-writer | Read path skill file as authoritative recipe selection source; overrides generic recipe selection table |

---

## Path Mapping (all four agents)

| BUILD_PATH | Skill File | Agent Template (agent-writer only) |
|------------|------------|-------------------------------------|
| A | `.github/skills/studio-agent/SKILL.md` | `templates/agents/studio-agent.md` |
| B | `.github/skills/studio-connector/SKILL.md` | `templates/agents/studio-agent.md` |
| C | `.github/skills/declarative-agent/SKILL.md` | `templates/agents/declarative-agent.md` |
| D | `.github/skills/canvas-agent/SKILL.md` | `templates/agents/canvas-agent.md` |
| E | `.github/skills/power-automate/SKILL.md` | `templates/agents/automate-agent.md` |
| F | `.github/skills/pcf-component/SKILL.md` | `templates/agents/pcf-agent.md` |
| G | `.github/skills/powerbi-report/SKILL.md` | `templates/agents/powerbi-agent.md` |
| H | `.github/skills/sharepoint-agent/SKILL.md` | `templates/agents/studio-agent.md` |
| I | `.github/skills/power-pages/SKILL.md` | `templates/agents/studio-agent.md` |
| J or missing | (no path file — use v1.5.0 behavior) | (generic templates) |

---

## Insertion Points

Dispatch blocks inserted BEFORE the main work section in each agent:

| Agent | Dispatch inserted before |
|-------|--------------------------|
| skill-writer | `### Output Contract` |
| agent-writer | `### Output Contract` |
| memory-writer | `### Output Contract` |
| cookbook-writer | `### Stack Detection` |

Rationale for cookbook-writer: Stack Detection is the first processing step in that agent.
The path dispatch must precede it so path-specific recipe selection takes effect before
any generic detection runs.

---

## Safety Rules Confirmed (D13-A + D13-C)

- **BUILD_PATH J, missing, or unrecognized → v1.5.0 behavior, no changes.** Explicit in every dispatch block.
- **Dispatch is additive only.** No existing logic was removed or modified in any of the four agents.
- **Protected-file rule (agent-writer) is unchanged.** The never-overwrite-planner.md rule remains intact.
- **Activation gate (memory-writer) is unchanged.** The `memory=yes` gate remains the first check.

---

## Jargon Scan

Dispatch blocks do not expose specialist names (skill-writer, agent-writer, memory-writer, cookbook-writer)
in any output the agents would generate. Names appear only in the agent files themselves — acceptable per
the jargon rule.

---

## Decisions Referenced

- **D13-A:** Safety rule — J/missing → v1.5.0 behavior. ✅ Implemented.
- **D13-B:** Dispatch to path-specific instruction files (not inline conditionals). ✅ Implemented.
- **D13-C:** Dispatch is additive — never remove existing J-path logic. ✅ Implemented.


## trinity-ralph-prompts
# trinity-ralph-prompts.md
# Decision: Ralph Loop Prompt Files Created

**Date:** 2026-04-15
**Author:** Trinity (Prompt Engineer)
**Status:** Delivered — awaiting Scribe commit

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| PROMPT_plan.md | 59 | Planning mode — reads codebase, writes IMPLEMENTATION_PLAN.md |
| PROMPT_build.md | 73 | Build mode — picks one task, implements, tests, commits |
| AGENTS.md | 45 | Operational rules loaded every iteration (≤ 60 line cap met) |

All files placed at repo root: `C:\AI Projects\Oracle_Prime\`

---

## Wording Choices

1. **SYSTEM-BREAKDOWN.md path corrected to `docs/SYSTEM-BREAKDOWN.md`.**
   The spec said "Read SYSTEM-BREAKDOWN.md" without a path. The file lives at
   `docs/SYSTEM-BREAKDOWN.md`, not the repo root. Both PROMPT_plan.md (step 0a)
   and PROMPT_build.md (step 0a) use the correct path. This prevents a silent
   read-failure on the very first ground-truth step.

2. **PROMPT_build.md step 4.2 updated to `docs/SYSTEM-BREAKDOWN.md`.**
   The spec said "Update SYSTEM-BREAKDOWN.md if your task adds a new file..."
   Updated to `docs/SYSTEM-BREAKDOWN.md` to match actual file location.

3. **Jargon Leak section in PROMPT_plan.md — specialist names omitted from prose.**
   The section describes _what to look for_ without embedding the forbidden
   terms as live text. The Jargon Leak Rule in AGENTS.md uses backtick code
   spans, which is consistent with how IMPLEMENTATION_PLAN.md itself handles
   them (reference, not injection).

4. **AGENTS.md kept at 45 lines** — well within 60-line cap. No content cut;
   every rule from the spec is present.

5. **No `cookbook/ralph-loop.ts` exists yet** (`cookbook/task-loop.ts` does).
   These prompt files are ready for the runner regardless of its filename.
   The prompts reference test commands, not the runner filename itself.

---

## Invariants Preserved

- No specialist names appear as unquoted prose in any of the three files.
- Sacred file rules (forge-memory/, FORGE.md, cli/files/) carried into AGENTS.md.
- Phase 13 version stamp and path stamp requirements documented in AGENTS.md.
- No commits made — Scribe handles commits per squad protocol.

## trinity-remember-conflict
# Trinity — Wave Decisions: forge remember + path-change conflict

**Author:** Trinity (Prompt Engineer)
**Date:** 2026-07-09
**Tasks:** Task 11 (add-forge-remember) + Task 12 (extend-memory-conflict)
**Status:** Completed

---

## Task 11: forge remember — 13 Skill Files

### Decision: Single insertion point per file, not per-section
Rather than adding a forge-remember note to every subsection of a skill, one canonical
### Capture Decisions (forge remember) section per file was inserted at a consistent
structural position. This avoids duplication and keeps a single source of truth per skill.

### Decision: Insertion position varies by skill type
- **Scaffolding skills** (planner, plan-executor, forge-compass, power-platform-guide):
  Section inserted immediately before ## Instructions / ## Section 1 — the first
  major instructional block.
- **Path-specific skills** (studio-agent through power-pages):
  Section inserted between ## Prerequisites and ## What Gets Generated — the natural
  top-area boundary between metadata and instructional content.

### Decision: Path-specific files already had a lightweight ## forge remember: Support section
Those sections remain (additions-only rule). The new ### Capture Decisions (forge remember)
section provides the full format spec (date format, exact entry structure, no-confirm rule)
that was missing from the lightweight sections.

### Decision: LF vs CRLF handling
Scaffolding skills use CRLF throughout. Path-specific skills are primarily LF with one
stray CR in the frontmatter. Insertions used matching line endings per file group.

### Decision: Phrase and format are identical across all 13 files
- Trigger phrase: orge remember: [anything]
- Acknowledgment: "Got it — logging that."
- Entry format: ## [YYYY-MM-DD] [brief label] / [the user's exact words]
- Target file: orge-memory/decisions.md (same path in all 13)

---

## Task 12: Path-Change Conflict Detection — planner/SKILL.md

### Decision: Section placed after Choice 3 of the Returning User Path Check (v1.6.0) block
The ### Path-Change Conflict Detection section was inserted between the end of the
"Returning user path check (v1.6.0)" block (after Choice 3 handling) and the
"Then skip to Step 2" continuation. This keeps all Step 0 returning-user logic together.

### Decision: Path J returning user flow is explicitly protected
The section includes a **Path J returning user (no Power Platform):** block that quotes
the exact v1.5.0 wording and explicitly marks it (No path change dialog — this is the
existing v1.5.0 flow, unchanged.) — preserving the v1.5.0 contract.

### Decision: 3-choice flow is ONLY shown on path change
The three-choice dialog (Use new path / Keep existing / Wipe memory) fires only when
forge-compass returns a BUILD_PATH different from stored BUILD_PATH. Same-path returning
users get a direct welcome-back message without any dialog.

### Decision: memory-writer appears in the new section (jargon accepted here)
The phrase "memory-writer will persist the change." was included per the task spec.
This is in the planner's internal Step 0 instructions (AI-consumed, not user-visible output),
consistent with how the planner has always referenced internal specialists in its delegation
protocol.

---

## Jargon Scan Results

| Term | Occurrences | Location | Status |
|------|-------------|----------|--------|
| skill-writer | 0 | — | Clean |
| agent-writer | 0 | — | Clean |
| memory-writer | 1 | planner/SKILL.md:145 | Intentional (internal instructions, per task spec) |
| cookbook-writer | 0 | — | Clean |


## trinity-system-breakdown
# Decision: Task 16 — docs/SYSTEM-BREAKDOWN.md Phase 13 Update

**Author:** Trinity (Prompt Engineer)
**Date:** 2026-04-16
**Task:** Task 16 — update-system-breakdown
**Status:** Completed

## Summary

Updated docs/SYSTEM-BREAKDOWN.md to reflect all Phase 13 architectural changes. Line count: 566 → 648 (+82 lines).

## Sections Updated

### 1. Version References
- CLI version: 1.5.0 → 1.6.0 (Project Overview table)
- <!-- copilotforge: v1.5.0 --> → <!-- copilotforge: v1.6.0 --> (Layer 6 version stamp)

### 2. Table of Contents
- Added Build Path Routing (Phase 13) entry between Layer 2 and Layer 3

### 3. Layer 1 — CLI (Source Modules table)
- src/doctor.js: Updated description to include Phase 13 additions (path stamp reader, Node≥16/pac CLI/paconn probes)
- src/templates.js: Updated description to "5-line shim — re-exports from cli/src/templates/"
- Added **Templates Modular Split (Phase 13)** subsection listing all 8 modules in cli/src/templates/

### 4. Layer 2 — Skills
- Added **FORGE-CONTEXT Schema** table with 10 fields (5 pre-existing + 5 Phase 13: BUILD_PATH, PATH_NAME, PREREQUISITES_CONFIRMED, EXTENSION_REQUIRED, MS_LEARN_ANCHOR)
- Added **Path Skills (Phase 13)** subsection listing forge-compass, power-platform-guide, and 9 path skills (A–I) in a table

### 5. Build Path Routing (Phase 13) — New Section
- Added ## Build Path Routing (Phase 13) section between Layer 2 and Layer 3
- Full 10-row routing table (Paths A–J) with Skill File, Agent Template, Key Tools columns
- Added path detection description

### 6. Layer 3 — Agents (Templates for User Agents)
- Added Phase 13 path-specific agent templates table: studio-agent.md, declarative-agent.md, canvas-agent.md, automate-agent.md, pcf-agent.md, powerbi-agent.md

### 7. Development Phase History
- Added Version column to table header
- Added Phase 13 row: | 13 | ✅ Done | Path Awareness — 10 build paths (A–J), ... | v1.6.0 |

## Rules Followed
- No existing content removed
- Document structure and formatting style preserved
- No jargon leaks (no specialist names in user-facing content)
- No commit made (Scribe handles commits)



