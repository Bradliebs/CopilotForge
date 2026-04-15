# CopilotForge Squad Decisions

## Phase 9: Final Polish — v1.0 Release Candidate

### 2026-04-15T22:18:39Z: Final Polish Complete — Stale Refs, Validator, QA Pass
**By:** Squad (Trinity, Neo, Tank, Morpheus) + Coordinator  
**Status:** Complete  

Comprehensive remediation and QA validation for v1.0 release. All items resolved.

---

### 2026-04-16: Decision: CLI `init` Defaults to Full Scaffold

**Date:** 2026-04-16  
**Author:** Neo (Developer)  
**Status:** Implemented  

Users running `npx copilotforge init` for the first time only got 2 files (SKILL.md + reference.md). The full scaffold required `--full`, but nobody knew that flag existed. First impressions matter — a sparse output made CopilotForge look incomplete.

**Decision:** Flip the default — `init` now creates the full scaffold (10 files including a new `docs/GETTING-STARTED.md`). A `--minimal` flag preserves the old 2-file behavior for advanced users who want only the planner skill.

**Rationale:**
- Principle of least surprise: Users expect `init` to set up everything they need
- Discoverability: The `--full` flag was invisible to new users
- No breaking change: All existing code paths preserved; only the flag logic inverted
- Added value: New `GETTING_STARTED_MD` template gives users immediate orientation

**Files Changed:**
- `cli/src/init.js` — `--full` → `--minimal` flag logic, updated success output
- `cli/src/templates.js` — Added `GETTING_STARTED_MD` template
- `cli/bin/copilotforge.js` — Updated help text
- `cli/README.md` — Updated documentation

---

### 2026-04-16: Decision: Fixed Phase 8 Wizard Question Count References

**Date:** 2026-04-16  
**Author:** Trinity (Prompt Engineer)  
**Status:** COMPLETE  
**Impact:** Documentation accuracy across 6 files

Fixed stale "five questions" references across user-facing docs, internal architecture docs, and test scenarios. Applied three-tier strategy: generic phrasing for promotional content (survives future changes), specific numbers for internal specs, and accurate counts for test cases. Verified with sweep search — ZERO stale references remaining.

---

### 2026-04-16: Decision: PowerShell Core Required for Recipe Validator

**Date:** 2026-04-16  
**Author:** Neo  
**Status:** Implemented  

Script `tests/docs/validate-recipes.ps1` requires PowerShell Core 7+ (pwsh), not Windows PowerShell 5.1. Modern syntax (multi-line elseif with backtick continuation in nested script blocks within hash tables) is not compatible with PS 5.1. Rather than downgrade syntax, clarified requirement in script header. Verified: 40/40 recipes pass when run with `pwsh -File validate-recipes.ps1`.

---

### 2026-04-15: Tank QA Findings — Final Validation Pass

**Date:** 2026-04-15  
**Tester:** Tank  
**Status:** SHIPPING (blocking issues fixed)

Full validation sweep: 24 PASS, 4 FAIL, 3 WARN. Blocking issues: 3 broken links in `.github/TEMPLATE_INSTRUCTIONS.md` (missing `../` prefix to docs/ links). All failures remediated by Coordinator before merge. QA verdict: SHIP IT.

---

### 2026-04-15: CopilotForge v1.0 Completeness Review

**Date:** 2026-04-15  
**Reviewer:** Morpheus (Lead)  
**Status:** ✅ READY FOR V1.0

Architecture complete. All promised features implemented and integrated. Five entry points guide users (README, GETTING-STARTED, WHAT-TO-USE, CHEATSHEET, FAQ). Memory system allows re-runs without data loss. Conflict detection prevents overwriting user changes. Beginner navigation (Phase 7) and Wizard Q6 (Phase 8) fully implemented. Production-safe. Ready for npm publish as v1.0.0.

---

## Phase 6: Beginner Deep Polish

### 2026-04-15T16:57: Phase 6 Completion — 12/12 Items Delivered
**By:** Squad (Trinity A+C, Neo B)  
**Status:** Complete  

All beginner polish items delivered with zero jargon leaks and 100% validation pass. Trinity (10 edits across 6 files) and Neo (3 edits) executed parallel workstreams with no conflicts. Commit: a23a807.

---

## Phase 5: Accessibility & Completeness

# CopilotForge Squad Decisions

## Phase 2.1: Jargon Remediation

# Decision: Separate Internal Agent Templates from User-Facing Templates

**Source:** Neo (Developer)
**Date:** 2026-04-15
**Status:** Implemented
**Triggered by:** Tank's Phase 2 validator — 24 jargon leak failures

## What Changed

1. **Moved specialist agent templates** from `templates/agents/` to `templates/internal/agents/`:
   - `skill-writer.md`, `agent-writer.md`, `memory-writer.md`, `cookbook-writer.md`
   - These are CopilotForge internal delegation agents — they should never be scaffolded into user repos.

2. **Scrubbed `templates/FORGE.md`** (the user's control panel):
   - Removed the "Specialist Agents (Phase 2)" table entirely
   - Team Roster now lists only user-facing agents: Planner, Reviewer, Tester, and `{{agent-name}}` placeholder
   - Quick Actions use plain language ("Create a skill…") instead of referencing internal agents ("Ask the skill-writer…")
   - Replaced "specialist" language with action-oriented descriptions

3. **Scrubbed `templates/agents/planner.md`** (user-facing template):
   - Replaced "delegates to specialist agents" with "generates the full project structure"
   - Replaced delegation listing with capability description: "generates skill definitions, agent configurations, memory files, and cookbook recipes"
   - Internal delegation details wrapped in HTML comment for LLM consumption only

4. **Updated validator** (`tests/phase2/validate-delegation.ps1`):
   - Added `templates/internal/agents/` to search paths so specialist templates are found in new location
   - Fixed PS5.1 regex compatibility issue (pre-existing)

## Validation

- `Select-String` for banned terms in `templates/FORGE.md` and `templates/agents/*.md`: **ZERO matches**
- Phase 2 validator jargon leak check: **PASS — No jargon leaks detected in user-facing templates**

## Principle

User-facing content describes *what* CopilotForge does. Internal content describes *how* it does it. The boundary is `templates/` (user-facing) vs `templates/internal/` (CopilotForge plumbing).


---

# Decision: Two-Layer Prompt Architecture for Agent Definitions

**Source:** Trinity (Prompt Engineer)
**Date:** 2026-04-15
**Status:** Implemented

## What

Remediated jargon leaks across all five `.copilot/agents/` files. Applied a two-layer architecture to `planner.md` and scrubbed cross-references from all four internal agent files.

## Changes

1. **planner.md** — User-visible sections (Role, Scope, Boundaries) scrubbed of all internal agent names and the word "specialist." Phase 3 renamed from "Delegate to Specialists" to "Scaffolding Generation" with functional descriptions. Delegation details preserved in a new `### Internal Delegation Protocol` subsection (HTML-commented as LLM-only). Boundaries now describe the Planner's full capability instead of deferring to named agents.

2. **skill-writer.md, agent-writer.md, memory-writer.md, cookbook-writer.md** — Replaced "specialist" with "agent" in System Prompt identity lines. Removed parenthetical cross-references to sibling agents in Boundaries sections. Replaced "generated by the {agent-name}" with "generated in the prior step" in input descriptions.

## Why

Beginners who open `.copilot/agents/` files should see clean, functional descriptions — not internal orchestration jargon. Internal names like "skill-writer" and "specialist" cause confusion when users can't find those agents in their repo. The two-layer approach preserves the LLM's ability to orchestrate while keeping user-facing content approachable.

## Validation

- Zero banned terms (`skill-writer`, `agent-writer`, `memory-writer`, `cookbook-writer`, `specialist`) in user-visible sections of planner.md
- All four terms correctly present in the Internal Delegation Protocol section
- Zero occurrences of "specialist" across all four internal agent files
- Zero parenthetical cross-references in Boundaries sections

## Principle

**Functional descriptions over internal names.** Describe what an agent does ("generates skill definitions"), not what it's called ("skill-writer"). Internal names belong only in clearly-marked system sections.

### 2026-04-15T15:10: Build transition UX
**By:** Brad Liebs (via Copilot) / Squad (autonomous decision)
**What:** After the wizard scaffolds files, it should end with a clear copy-paste prompt the user can immediately paste into their AI assistant to start building. Example: "Start building my [project-name] — use the agents in .copilot/agents/ and the recipes in cookbook/ to scaffold the initial codebase." Also add a "Next Steps" section to the generated FORGE.md.
**Why:** Identified gap — wizard creates configuration but doesn't bridge to "now build it." Beginners get stuck after scaffolding. Option A (copy-paste prompt) chosen as lowest-risk, most beginner-friendly approach.
# Decision: Phase 4 Memory Reader, Summarizer, Convention Extractor

**Source:** Neo (Developer)
**Date:** 2026-04-15
**Status:** Implemented

## What
Delivered Phase 4 memory read-side infrastructure:

1. **Memory Reader Spec** (	emplates/utils/memory-reader.md) — Full algorithm for loading decisions, patterns, preferences, and history into a structured FORGE-MEMORY context block.
2. **Memory Summarizer Spec** (	emplates/utils/memory-summarizer.md) — Compression strategy for when memory files grow too large. Archive-before-summarize, idempotent, restorable.
3. **Convention Extractor Spec** (	emplates/utils/convention-extractor.md) — Post-scaffolding pattern discovery: naming, imports, error handling, structure, code style. Three-tier confidence: observed → confirmed → established.
4. **FORGE.md Memory Status** — Updated template with live memory metrics, recent decisions, and active conventions using forge:memory markers.
5. **Cookbook Recipes** — memory-reader.ts and memory-reader.py with full parsing, query helpers, and context block formatting. Template versions in 	emplates/cookbook/.
6. **cookbook/README.md** — Added Memory category.

## Key Design Decisions
- Memory reader never crashes: missing/malformed files are skipped with warnings.
- Convention confidence promotes over time (observed → confirmed → established) but never demotes.
- Summarizer always archives before compressing. Idempotent. User can restore from archive.
- No jargon leaks in any user-facing file.

## Files Created
- 	emplates/utils/memory-reader.md
- 	emplates/utils/memory-summarizer.md
- 	emplates/utils/convention-extractor.md
- cookbook/memory-reader.ts
- cookbook/memory-reader.py
- 	emplates/cookbook/memory-reader.ts
- 	emplates/cookbook/memory-reader.py

## Files Updated
- 	emplates/FORGE.md — Memory Status section with merge markers
- cookbook/README.md — Memory category added
# Phase 4 Validator: Jargon Leaks in Specs and Architecture Doc

**Source:** Tank (Tester)
**Date:** 2026-04-15
**Status:** Identified — Requires Remediation

## Finding

Phase 4 validator detected 7 jargon leaks in user-facing files:

1. `templates/utils/memory-reader.md` — contains "specialist" (1 instance)
2. `templates/utils/convention-extractor.md` — contains "specialist" (1 instance)
3. `docs/phase4-architecture.md` — contains "cookbook-writer", "skill-writer", "agent-writer", "memory-writer", "specialist"

## Impact

These are internal delegation terms that beginners shouldn't see. Same class of bug as the Phase 2 jargon leak (24 failures). The architecture doc at `docs/phase4-architecture.md` is an internal doc so may be acceptable, but the utility spec templates will be copied into user repos and must be clean.

## Recommendation

- **Templates (memory-reader.md, convention-extractor.md):** Replace "specialist" with neutral phrasing. These are user-facing.
- **docs/phase4-architecture.md:** Decide if this is internal-only (exempt from jargon check) or user-facing (needs scrubbing). If internal, the validator should skip it or the file should be in an internal directory.

## Owner

Neo (templates), Trinity (architecture doc)

