# CopilotForge Squad Decisions

## Phase 13: Path Awareness & Multi-Platform Support

### 2026-07-09: Phase 13 Architectural Review — Path Awareness
**Author:** Morpheus (Lead)  
**Date:** 2026-07-09  
**Status:** Review — Blocking Before Implementation  
**Requested by:** Brad Liebs

#### 1. Task Ordering: Dependency Analysis

**Proposed Order (16 tasks) with Issues Found:**

**Issue A: Version bump position (Task 14) — LOW RISK**  
Task 9 mentions "(1.6.0 stamp)" but VERSION_STAMP reads from pkg.version at runtime. No reorder needed as long as task 9 follows existing pattern.

**Issue B: Task 11 (add-forge-remember) depends on skill files**  
Tasks 4, 5, 6 create skill files. Task 11 adds "forge remember:" to ALL skill files. Current order places 11 after 6. Verdict: Correct.

**Issue C: Task 13 (extend-doctor) checks prerequisites**  
Doctor validates version stamp. Recommendation: Task 13 should check pkg.version dynamically (not hardcode 1.6.0).

**Issue D: Task 10 (extend-specialists) is the integration bottleneck**  
All 4 specialists must know about every content piece created in tasks 4-9. Task 10 at position 10 correctly follows all content tasks.

**Issue E: Task 3 (extend-planner-wizard) references Forge Compass (task 4)**  
The spec says task 3 includes "Forge Compass pre-check." If wizard references forge-compass skill before it exists, broken reference. Recommendation: Split task 3 into two sub-tasks.

**Recommended Reorder:**
`
 1  fix-jargon-leak              (unchanged — clean baseline)
 2  extend-forge-context         (unchanged — schema first)
 3  extend-planner-wizard        (keep, but REMOVE Compass references)
 4a build-forge-compass          (skill file only)
 4b wire-compass-to-wizard       (NEW: connect Compass to wizard path detection)
 5  build-power-platform-guide   (unchanged)
 6  build-path-skills            (unchanged)
 7  build-path-agents            (unchanged)
 8  build-path-cookbook          (unchanged)
 9  build-path-forgemd           (unchanged)
10  extend-specialists           (unchanged — integration point)
11  add-forge-remember           (unchanged)
12  extend-memory-conflict       (unchanged)
13  extend-doctor                (unchanged)
14  bump-version                 (unchanged)
15  extend-tests                 (unchanged)
16  update-system-breakdown      (unchanged)
`

#### 2. Top 3 Architectural Decisions

**Decision D13-01: Path Detection Must Be Silent for Non-Power-Platform Projects**

When path detection runs after Q1, projects that don't match paths A-I must not be prompted. Path J (existing wizard, zero change to UX) must be the default. Path detection is a CLASSIFIER: keywords/signals map to paths A-I. No match → Path J. Match found → ONE confirmation question: "It sounds like you're building a {PATH_NAME}. Should I set up for that? (yes/no)". If user says no → Path J.

**Decision D13-02: Specialist Branching via Path-Specific Instruction Files, Not Inline Conditionals**

Each specialist (skill-writer, agent-writer, memory-writer, cookbook-writer) must read BUILD_PATH from FORGE-CONTEXT. If BUILD_PATH = J: execute existing logic (unchanged). If BUILD_PATH = A-I: load path-specific instruction file from templates/paths/{PATH}/. Path-specific instructions live in separate files. Specialists stay small. Path J gets ZERO new code.

**Decision D13-03: New FORGE-CONTEXT Fields Must Be Optional with Fallback Defaults**

All 5 new fields have defaults: BUILD_PATH: "J", PATH_NAME: "Developer Workspace", PREREQUISITES_CONFIRMED: true, EXTENSION_REQUIRED: "", MS_LEARN_ANCHOR: "". Every specialist that reads these fields MUST have a ?? default fallback.

#### 3. Parallelization Map

**Phase 1: Sequential Foundation (tasks 1-3)**  
Each depends on the previous. Jargon fix → context schema → wizard.

**Phase 2: Parallel Content Creation (tasks 4-8)**  
5 independent tasks that can run simultaneously. This is the biggest parallelization win.

**Phase 3: Sequential Integration (tasks 9-10)**  
Task 9 builds FORGE.md templates that reference content from 4-8. Task 10 wires specialists to route to all of it.

**Phase 4: Parallel Polish (tasks 11-13)**  
Task 11 touches skill files, Task 12 touches memory logic, Task 13 touches doctor.js. No overlap.

**Phase 5: Sequential Finalization (tasks 14-16)**  
Version bump → tests → docs.

**Summary:** Parallelization saves ~37% of total execution time (10 units vs 16 serial).

#### 4. Red Flags & Risk Register

**🔴 RED FLAG 1: templates.js Size Explosion**  
Current: 53.5 KB. After Phase 13: +9 FORGE.md variants could push to 100+ KB. Mitigation: Split templates.js into modules during task 9.

**🔴 RED FLAG 2: Planner SKILL.md Context Window Risk**  
Current: 843 lines. After path detection + path descriptions + Compass integration, could exceed 1200 lines. Smaller LLM contexts may truncate. Mitigation: Path descriptions TERSE in Planner. Full details in forge-compass/SKILL.md. Planner only needs: path letter, one-line description, detection keywords.

**🟡 YELLOW FLAG 3: 16 Cookbook Recipe Files — Beginner Overload**  
Path-specific recipes must be ONLY generated when BUILD_PATH matches. Path J gets ZERO new recipes. cookbook-writer must gate on BUILD_PATH.

**🟡 YELLOW FLAG 4: upgrade.js Doesn't Know About Path-Specific Files**  
upgrade.js has hardcoded FRAMEWORK_FILES and COOKBOOK_TEMPLATES lists. Phase 13 adds ~30 new files. Mitigation: upgrade.js should only add path-specific files if BUILD_PATH is set in user's FORGE.md. Add as task 9.5 or extend task 14.

**🟡 YELLOW FLAG 5: forge-memory Conflict With Path Changes**  
User scaffolds with Path A, then re-runs wizard and picks Path D. Memory files contain Path A conventions. Mitigation: Task 12 must define algorithm: detect path change, prompt user, archive old conventions, start fresh. Conflict resolution spec must be defined BEFORE task 12.

**🟢 GREEN FLAG: Path J Safety — Assessment Passed**  
Path J (existing flow) is safe if: BUILD_PATH defaults to "J" ✅, Path detection is silent ✅, Specialist branching uses guards ✅, No existing files modified ✅, Tests validate Path J byte-identical to v1.5.0 ✅.

#### 5. Implementation Recommendations

**Before coding starts:**
1. Finalize D13-01, D13-02, D13-03 — get team consensus
2. Plan templates.js refactor — don't wait until it's 100 KB
3. Define path-change conflict algorithm — task 12 needs a spec
4. Add upgrade.js path-awareness to task list

**During implementation:**
5. Run jargon leak validator after EVERY content task (4-8)
6. Task 15 (tests) must include "Path J regression" suite — scaffold with no path detection, diff against v1.5.0. Byte-identical is the bar.

**After implementation:**
7. Context window audit — load planner/SKILL.md + each specialist into Claude Haiku and GPT-4o-mini

#### Decisions Requiring Team Consensus

| ID | Decision | Morpheus Recommendation | Needs Input From |
|----|----------|------------------------|------------------|
| D13-01 | Path detection UX | Silent classifier + one confirmation question | Trinity (UX), Tank (test) |
| D13-02 | Specialist branching | Path-specific instruction files, not inline conditionals | Neo (implementation), Trinity (prompts) |
| D13-03 | FORGE-CONTEXT backward compat | All new fields optional with defaults | Neo (implementation) |
| D13-04 | templates.js refactor | Split into modules during task 9 | Neo (implementation) |
| D13-05 | upgrade.js path awareness | Add gated PATH_FILES constant | Neo (implementation) |
| D13-06 | Path-change memory conflict | Archive old path, prompt user, fresh start | Trinity (UX), Tank (test) |

---

### 2026-04-16: Decision: Command Center Recipe & Documentation
**Author:** Morpheus (Lead)  
**Date:** 2026-04-16  
**Status:** Complete

Created cookbook/command-center.ts and cookbook/command-center.py — terminal dashboard recipes. Updated four documentation files to promote discoverability (README.md, cookbook/CHEATSHEET.md, docs/FAQ.md, docs/WHAT-TO-USE.md).

**Key Design Decisions:**
- Widget interface for extensibility (users can plug in custom data sources)
- Zero external dependencies (ANSI colors via escape codes, file scanning via stdlib)
- Credited command-center-lite as inspiration (transparent lineage)
- Additive documentation only (no rewrites to existing content)

---

### 2026-04-16: Decision: Ralph Loop + Plan Template in CLI Init
**Source:** Neo (Developer)  
**Date:** 2026-04-16  
**Status:** Implemented

Added ralph-loop recipe starters (TS + PY) and IMPLEMENTATION_PLAN.md template to 
px copilotforge init.

**Changes:**
- cli/src/templates.js — 3 new templates: RALPH_LOOP_TS, RALPH_LOOP_PY, IMPLEMENTATION_PLAN_MD
- cli/src/init.js — 3 new entries in FULL_FILES array
- cli/src/doctor.js — IMPLEMENTATION_PLAN.md noted as optional

**Design Choices:**
- Concise starters (~100 lines), not full recipes
- TODO markers for real logic (implementTask(), alidateTask() are stubs)
- Same plan format everywhere: - [ ] task-id — Title
- Plan is optional in doctor (info note, not warning)
- Additive only — no existing behavior changed

---

### 2026-04-16: Decision: Status Command — Terminal Command Center
**Source:** Neo  
**Date:** 2026-04-16  
**Status:** Implemented

Added 
px copilotforge status — zero-dependency terminal dashboard reading CopilotForge project files.

**Files Changed:**
- cli/src/status.js — New file (~270 lines)
- cli/bin/copilotforge.js — Added status case and help text

**Design Decisions:**
- Reused utils.js patterns (no new abstractions)
- Graceful degradation everywhere (missing files/dirs handled, no crashes)
- Plan parsing uses - [ ] id — Title format (established by ralph-loop)
- Memory counting uses ##  headings (each heading = one entry, lightweight)
- Git stats use three separate try/catch blocks (partial failures don't suppress branch name)
- Smart context-aware next-step suggestions
- Column alignment via LABEL_W constant (16 chars for scannable output)

---

### 2026-04-16: Decision: Add Command Center as Q6 Extra #8
**Source:** Trinity (Prompt Engineer)  
**Date:** 2026-04-16  
**Status:** Implemented

Added 🏠 **Command Center** as the 8th extra in Q6 shopping list. Terminal-based project dashboard showing plan progress, skills, agents, cookbook recipes, and git status.

**Files Modified:**
- .github/skills/planner/SKILL.md — New table row, updated intermediate suggestion, updated extras-based recipe mapping
- .github/skills/planner/reference.md — New table row, detailed Command Center section, updated edge cases (7→8 extras)
- cli/files/.github/skills/planner/SKILL.md — Synced CLI mirror
- cli/files/.github/skills/planner/reference.md — Synced CLI mirror

**Design Decisions:**
- Read-only by design (shows project state, never modifies)
- Recipe file: cookbook/command-center.{ext}
- CLI integration: 
px copilotforge status as built-in shortcut
- Fuzzy mapping: "command center" and "status" both resolve to this extra
- Intermediate suggestion updated (Command center mentioned as alternative, not replacement)

---

### 2026-04-16: Decision: Planning Mode for Task Automation
**Source:** Trinity (Prompt Engineer)  
**Date:** 2026-04-16  
**Status:** Implemented

Added "Planning Mode" to CopilotForge wizard. When user selects "Task automation" in Q6, Planner generates IMPLEMENTATION_PLAN.md.

**Changes Made:**
1. SKILL.md — Q6 description updated to mention step-by-step build plan
2. SKILL.md — Step 2 confirmation summary added line: Implementation plan: {X tasks}
3. SKILL.md — New section 3e (Planning Mode) with full instructions
4. reference.md — Extras Catalog updated; Task automation entry lists IMPLEMENTATION_PLAN.md
5. reference.md — New "Planning Mode" subsection documenting behavior and edge cases
6. CLI mirror files synced

**Design Decisions:**
- Plan format: - [ ] task-id — Task title with markers [ ] (pending), [x] (done), [!] (failed)
- Task count guidance: 8-15 tasks
- Task ordering: Setup → data layer → API/UI → cross-cutting → quality
- Conditional generation: IMPLEMENTATION_PLAN.md ONLY created when task automation selected
- Existing plan edge case: If IMPLEMENTATION_PLAN.md already exists, ask user whether to add, replace, or leave alone
- No breaking changes — all existing wizard flows unchanged

---

### 2026-04-16: Decision: Planning Mode Documentation
**Author:** Morpheus (Documentation Lead)  
**Date:** 2026-04-16  
**Status:** Complete

Updated CopilotForge documentation across five key files to explain and promote Planning Mode.

**Changes Made:**
1. **README.md** — Added "🔄 Planning Mode — Let AI Build Your Project" section after Six Questions table
2. **docs/GETTING-STARTED.md** — Added "Planning Mode" subsection in Step 3
3. **docs/WHAT-TO-USE.md** — Added decision path to flowchart
4. **cookbook/CHEATSHEET.md** — Added table row
5. **docs/FAQ.md** — Added Q&A in "Setup & Scaffolding" section

**Consistency:** All five files use same terminology: Planning Mode, IMPLEMENTATION_PLAN.md, Ralph Loop.  
**Beginner-Friendly:** Each explanation avoids technical details. Emphasis on what it does, not how.  
**Discoverability:** Added to decision flowchart and cheatsheet.  
**Anti-Patterns Avoided:**
- Not exposing internal "ralph-loop recipe" name before explaining what it does
- Not using jargon like "task graph" or "autonomous loop"
- Not burying Planning Mode in FAQ — elevated to README
- No partial/confusing examples — all examples complete and realistic

---

## Phase 9: Final Polish — v1.0 Release Candidate

### 2026-04-15T22:18:39Z: Final Polish Complete — Stale Refs, Validator, QA Pass
**By:** Squad (Trinity, Neo, Tank, Morpheus) + Coordinator  
**Status:** Complete  

Comprehensive remediation and QA validation for v1.0 release. All items resolved.

---

### 2026-04-16: Decision: CLI init Defaults to Full Scaffold
**Date:** 2026-04-16  
**Author:** Neo (Developer)  
**Status:** Implemented  

Users running 
px copilotforge init only got 2 files (SKILL.md + reference.md). Full scaffold required --full flag, but nobody knew it existed.

**Decision:** Flip the default — init now creates full scaffold (10 files including docs/GETTING-STARTED.md). --minimal flag preserves old 2-file behavior.

**Rationale:**
- Principle of least surprise: Users expect init to set up everything
- Discoverability: --full flag was invisible to new users
- No breaking change: All existing code paths preserved
- Added value: New GETTING_STARTED_MD template gives immediate orientation

**Files Changed:**
- cli/src/init.js — --full → --minimal flag logic
- cli/src/templates.js — Added GETTING_STARTED_MD template
- cli/bin/copilotforge.js — Updated help text
- cli/README.md — Updated documentation

---

### 2026-04-16: Decision: Fixed Phase 8 Wizard Question Count References
**Date:** 2026-04-16  
**Author:** Trinity (Prompt Engineer)  
**Status:** COMPLETE  

Fixed stale "five questions" references across user-facing docs, internal architecture docs, and test scenarios. Applied three-tier strategy: generic phrasing for promotional content (survives future changes), specific numbers for internal specs, and accurate counts for test cases.

---

### 2026-04-16: Decision: PowerShell Core Required for Recipe Validator
**Date:** 2026-04-16  
**Author:** Neo  
**Status:** Implemented  

Script 	ests/docs/validate-recipes.ps1 requires PowerShell Core 7+ (pwsh), not Windows PowerShell 5.1. Modern syntax not compatible with PS 5.1. Clarified requirement in script header. Verified: 40/40 recipes pass with pwsh -File validate-recipes.ps1.

---

### 2026-04-15: Tank QA Findings — Final Validation Pass
**Date:** 2026-04-15  
**Tester:** Tank  
**Status:** SHIPPING (blocking issues fixed)

Full validation sweep: 24 PASS, 4 FAIL, 3 WARN. Blocking issues: 3 broken links in .github/TEMPLATE_INSTRUCTIONS.md (missing ../ prefix to docs/ links). All failures remediated by Coordinator. QA verdict: SHIP IT.

---

### 2026-04-15: CopilotForge v1.0 Completeness Review
**Date:** 2026-04-15
**Reviewer:** Morpheus (Lead)
**Status:** ✅ READY FOR V1.0

Architecture complete. All promised features implemented and integrated. Five entry points guide users (README, GETTING-STARTED, WHAT-TO-USE, CHEATSHEET, FAQ). Memory system allows re-runs without data loss. Conflict detection prevents overwriting user changes. Beginner navigation and Wizard Q6 fully implemented. Production-safe. Ready for npm publish as v1.0.0.

---

## Phase 6: Beginner Deep Polish

### 2026-04-15T16:57: Phase 6 Completion — 12/12 Items Delivered
**By:** Squad (Trinity A+C, Neo B)
**Status:** Complete

All beginner polish items delivered with zero jargon leaks and 100% validation pass. Trinity (10 edits across 6 files) and Neo (3 edits) executed parallel workstreams with no conflicts.

---

## Phase 5: Accessibility & Completeness

(Phase header from existing file)

---

## Phase 2.1: Jargon Remediation

### Decision: Separate Internal Agent Templates from User-Facing Templates
**Source:** Neo (Developer)
**Date:** 2026-04-15
**Status:** Implemented

**What Changed:**
1. Moved specialist agent templates from 	emplates/agents/ to 	emplates/internal/agents/: skill-writer.md, agent-writer.md, memory-writer.md, cookbook-writer.md
2. Scrubbed 	emplates/FORGE.md — removed "Specialist Agents (Phase 2)" table, replaced delegation listing with capability description
3. Scrubbed 	emplates/agents/planner.md — replaced "delegates to specialist agents" with "generates full project structure", wrapped internal delegation in HTML comment
4. Updated validator (	ests/phase2/validate-delegation.ps1) — added 	emplates/internal/agents/ to search paths

**Validation:**
- Select-String for banned terms in templates: **ZERO matches**
- Phase 2 validator jargon leak check: **PASS**

**Principle:** User-facing content describes *what* CopilotForge does. Internal content describes *how* it does it. Boundary is 	emplates/ (user-facing) vs 	emplates/internal/ (plumbing).

---

### Decision: Two-Layer Prompt Architecture for Agent Definitions
**Source:** Trinity (Prompt Engineer)
**Date:** 2026-04-15
**Status:** Implemented

**What:** Remediated jargon leaks across all five .copilot/agents/ files. Applied two-layer architecture to planner.md and scrubbed cross-references from internal agents.

**Changes:**
1. planner.md — User-visible sections scrubbed of internal agent names and "specialist". Phase 3 renamed from "Delegate to Specialists" to "Scaffolding Generation". Delegation details in new ### Internal Delegation Protocol subsection (HTML-commented as LLM-only).
2. skill-writer.md, agent-writer.md, memory-writer.md, cookbook-writer.md — Replaced "specialist" with "agent". Removed parenthetical cross-references to sibling agents. Replaced "generated by the {agent-name}" with "generated in the prior step".

**Why:** Beginners who open .copilot/agents/ files should see clean, functional descriptions — not internal orchestration jargon. Internal names cause confusion when users can't find those agents in their repo.

**Validation:**
- Zero banned terms in user-visible sections of planner.md
- All four terms correctly present in Internal Delegation Protocol section
- Zero "specialist" across all four internal agent files
- Zero parenthetical cross-references

**Principle:** **Functional descriptions over internal names.** Describe what an agent does, not what it's called.

---

### 2026-04-15T15:10: Build transition UX
**By:** Brad Liebs / Squad  
**What:** After wizard scaffolds files, end with clear copy-paste prompt user can immediately paste into AI assistant. Add "Next Steps" section to generated FORGE.md.
**Why:** Identified gap — wizard creates configuration but doesn't bridge to "now build it". Beginners get stuck after scaffolding.

---

### Decision: Phase 4 Memory Reader, Summarizer, Convention Extractor
**Source:** Neo (Developer)
**Date:** 2026-04-15
**Status:** Implemented

**What:** Delivered Phase 4 memory read-side infrastructure.

**Files Created:**
- templates/utils/memory-reader.md
- templates/utils/memory-summarizer.md
- templates/utils/convention-extractor.md
- cookbook/memory-reader.ts & .py
- templates/cookbook/memory-reader.ts & .py

**Files Updated:**
- templates/FORGE.md — Memory Status section
- cookbook/README.md — Memory category added

**Key Design Decisions:**
- Memory reader never crashes (missing/malformed files skipped with warnings)
- Convention confidence promotes over time (observed → confirmed → established) but never demotes
- Summarizer always archives before compressing (idempotent, restorable)
- No jargon leaks in any user-facing file

---

### Phase 4 Validator: Jargon Leaks in Specs and Architecture Doc
**Source:** Tank (Tester)
**Date:** 2026-04-15
**Status:** Identified — Requires Remediation

**Finding:** 7 jargon leaks detected:
1. templates/utils/memory-reader.md — "specialist" (1 instance)
2. templates/utils/convention-extractor.md — "specialist" (1 instance)
3. docs/phase4-architecture.md — contains specialist terminology

**Recommendation:**
- Templates (memory-reader.md, convention-extractor.md): Replace "specialist" with neutral phrasing
- docs/phase4-architecture.md: Decide if internal-only (exempt) or user-facing (needs scrubbing)


## Wave 1 Completion: Task 1 (fix-jargon-leak)

### 2026-04-16: Phase 13 Task 1 — Jargon Leak Fix Complete
**Authors:** Neo, Trinity, Tank  
**Date:** 2026-04-16  
**Status:** Complete  
**Summary:** All forbidden specialist names (skill-writer, agent-writer, memory-writer, cookbook-writer) removed from user-facing files. 0 violations confirmed.

#### Neo (Developer) — Templates & CLI Audit
- **cli/src/**: All clean (0 violations)
- **templates/agents/planner.md**: 1 HTML comment removed (line 22)
- **templates/utils/rerun-detection.md**: 8 specialist name references neutralized
- **Total occurrences fixed**: 9

#### Trinity (Reviewer) — SYSTEM-BREAKDOWN.md & Template Review
- **templates/agents/reviewer.md**: Confirmed clean
- **templates/agents/tester.md**: Confirmed clean
- **.github/skills/**: Confirmed clean
- **docs/SYSTEM-BREAKDOWN.md**: 3 prose locations neutralized (lines 353, 453–456, 484)
- **Preserved by design**: Internal Specialists section (lines 244–247) marked as exempt per spec

#### Tank (Tester) — Validator & Test Design
- **validate-jargon.ps1**: Standalone PowerShell scanner built
  - Scans: templates/agents, .github/skills/, cli/src/templates.js
  - Exclusions: templates/internal/, .copilot/agents/, .squad/, tests/
  - Exit code 0 = clean, 1 = violations with file:line detail
- **path-detection.test.js**: Regression test case designed (awaits implementation when file created)
- **Baseline confirmation**: 0 violations across all scanned targets

#### Design Decision: Jargon Exemptions Clarified
**HTML comments in user-facing files are NOT allowed.** Even partially-remediated comments (specialist names replaced with neutral text) must be removed entirely. Templates are direct ancestors of user repos — any comment in a template may end up in user-generated files.

**Acceptable internal references** (per "clearly-labeled internal section" exemption):
- SYSTEM-BREAKDOWN.md lines 244–247 ("Internal Specialists" table)
- Lines in code blocks explicitly labeled "6. Delegate to specialists:" or similar
- References within the rule documentation itself (using the names to explain what must NOT appear)

### Wave 2 Launched
- **Trinity (trinity-jargon-fix → extend-forge-context)**: Extend Forge CONTEXT schema with Path Detection fields
- **Neo (templates-split)**: Design recommendation for cli/src/templates.js split (Option A: directory structure)
- **Scribe (this log)**: Merge decisions inbox → decisions.md, write orchestration & session logs

---

## Phase 13: Task 3 Completion — Forge Compass SKILL.md

### 2026-07-09: Build forge-compass/SKILL.md — 5-Step Silent Gate Skill
**Author:** Trinity (Prompt Engineer)
**Date:** 2026-07-09
**Status:** Complete — Morpheus Review
**Summary:** Created `.github/skills/forge-compass/SKILL.md` — pre-scaffold gate skill that classifies build paths before routing to Planner wizard.

#### Deliverable
- **`.github/skills/forge-compass/SKILL.md`**: 5-step silent classifier with contradiction detection, confidence scoring, and prerequisite risk flags.

#### Forge Compass Architecture

**5-Step Silent Classification:**
1. **Step 0 — Memory Read:** Reads `BUILD_PATH` and `PATH_NAME` from `forge-memory/preferences.md`. Stores as `stored_path`. Silent.
2. **Step 1 — Signal Scan:** Classifies Q1 answer into PP_SIGNALS or DEV_SIGNALS. Maps patterns to paths A–J. Assigns confidence (High/Medium/Low). Silent.
3. **Step 2 — Contradiction Check:** Compares `stored_path` to `detected_path`. Surfaces warning only when they differ AND confidence ≥ Medium. Low confidence → silent.
4. **Step 3 — Prerequisite Risk Flag:** Flags tooling for Path F (Node.js ≥16, pac CLI) and Path B (REST API endpoint). Other paths silent.
5. **Step 4 — Motivated Reasoning Detection:** Gentle note when stated preference contradicts detected signals (clear mismatches only).
6. **Step 5 — Output:** Consolidates warnings (or silent on clean pass). Always writes `BUILD_PATH`, `PATH_NAME`, `EXTENSION_REQUIRED` to FORGE-CONTEXT.

#### Architecture Alignment
- **D13-01 compliant:** Silent classifier. Path J default. Zero UX interruption on clean passes.
- **D13-02 compliant:** Works with specialist branching via BUILD_PATH.
- **D13-03 compliant:** All fields have explicit defaults. Missing `preferences.md` never blocks scaffolding.

#### Trigger Design
- **User-facing triggers:** "check my path", "validate my path", "compass check"
- **Internal trigger:** Planner invokes Compass automatically after Q1 (invisible to users)

#### Memory Write Safety
`BUILD_PATH` written to `forge-memory/preferences.md` only on:
1. First run (no existing memory)
2. After explicit user path switch confirmation

No writes on silent passes where memory matches detected path (prevents thrashing).

#### Decision: "agent" Alone → Path C
When user says "I want to build an agent" with DEV_SIGNALS (no explicit no-code signal), maps to **Path C (Declarative Agent)** rather than Path A. Path A requires explicit no-code signal alongside "agent."

#### Open Question Routed to Morpheus
**`PREREQUISITES_CONFIRMED` Field Ownership:**
- reference.md lists `PREREQUISITES_CONFIRMED` as one of 5 FORGE-CONTEXT path awareness fields
- Forge Compass reads/writes: `BUILD_PATH`, `PATH_NAME`, `EXTENSION_REQUIRED` (not `PREREQUISITES_CONFIRMED`)
- `PREREQUISITES_CONFIRMED` should be written after user responds to Step 3 prerequisite flag
- **Question:** Should Compass own this field (default: false) or does Planner handle it?
- **Morpheus ruling:** Compass may set `PREREQUISITES_CONFIRMED: false` as safe default. Planner or follow-up interaction confirms after user responds to flag.

#### Morpheus Review Outcome (2026-07-09)
**Ruling:** D13-03 amended. Trinity's FORGE-CONTEXT defaults correct. D13-02 alignment confirmed. `PREREQUISITES_CONFIRMED` ownership: Compass writes `false` (safe default), Planner or Follow-up Interaction confirms after user response. No rework needed.

#### Wave 3 Launch
- **Trinity (extend-planner-wizard):** Wire Compass into Planner path detection flow (task 4b)
- **Morpheus (prereq ruling):** Confirm `PREREQUISITES_CONFIRMED` ownership model (complete)
- **Scribe (this log):** Merge decisions, write orchestration & session logs

