# CopilotForge Phase 4 — Test Scenarios

> Owned by **Tank** (Tester). Each scenario is specific enough to execute.
> Status: ⬚ = not tested, ✓ = passed, ✗ = failed
> **Total: 58 scenarios across 8 categories**

---

## A. Memory Read-Back (12 scenarios)

How the Planner loads and uses orge-memory/ on startup.

---

### MRB-01: First Run (No Memory) → Full Wizard

**Precondition:** No orge-memory/ directory exists.
**Action:** Trigger the Planner skill.
**Expected:**
- Wizard asks all 6 questions normally (project, stack, memory, testing, skill level, extras).
- No "Welcome back" message shown.
- No context summary shown.
- After scaffolding, orge-memory/ created (if memory=yes).

**Status:** ⬚

---

### MRB-02: Second Run (Memory Exists) → Context Summary, Skip Known Questions

**Precondition:** orge-memory/decisions.md, orge-memory/patterns.md exist with valid content from a prior run.
**Action:** Trigger the Planner skill again.
**Expected:**
- "Welcome back" message shown with a context summary (project name, stack, session count).
- Known questions (project description, stack, memory preference) are pre-populated or skipped.
- User can confirm summary or choose to change answers.
- Wizard completes faster than a first run.

**Status:** ⬚

---

### MRB-03: Memory Exists but decisions.md Is Empty → Graceful Fallback

**Precondition:** orge-memory/decisions.md exists but contains no decision entries (only the header or empty file).
**Action:** Trigger the Planner skill.
**Expected:**
- No crash or error message.
- Planner treats this as partial memory — asks questions it can't infer from empty decisions.
- Does NOT show stale or incorrect context summary.

**Status:** ⬚

---

### MRB-04: Memory Exists but patterns.md Is Corrupted/Malformed → Graceful Degradation

**Precondition:** orge-memory/patterns.md exists but contains malformed markdown (broken headings, unclosed code blocks, random binary characters).
**Action:** Trigger the Planner skill.
**Expected:**
- Parser does not crash.
- Warning logged (not shown to user): "Could not parse patterns.md — proceeding without patterns."
- Wizard runs normally, skipping convention pre-population.
- patterns.md is NOT deleted or overwritten — user data preserved.

**Status:** ⬚

---

### MRB-05: Memory Exists but preferences.md Is Missing → Proceed Without Preferences

**Precondition:** orge-memory/decisions.md and orge-memory/patterns.md exist. orge-memory/preferences.md does NOT exist.
**Action:** Trigger the Planner skill.
**Expected:**
- No crash.
- Planner reads available memory files normally.
- Questions that would have been answered by preferences.md are asked again.
- After run, preferences.md is created (if Phase 4 is fully implemented).

**Status:** ⬚

---

### MRB-06: Memory Exists but history.md Is Missing → Proceed Without History

**Precondition:** orge-memory/decisions.md, orge-memory/patterns.md, orge-memory/preferences.md exist. orge-memory/history.md does NOT exist.
**Action:** Trigger the Planner skill.
**Expected:**
- No crash.
- Context summary omits session count (no history to count).
- After run, history.md is created with session 1 entry.

**Status:** ⬚

---

### MRB-07: Memory Directory Exists but Is Empty → Treat as First Run

**Precondition:** orge-memory/ directory exists but contains zero files.
**Action:** Trigger the Planner skill.
**Expected:**
- Treated identically to MRB-01 (no memory).
- Full 5-question wizard runs.
- No "Welcome back" message.
- Memory files created fresh after scaffolding.

**Status:** ⬚

---

### MRB-08: Large Memory (50+ Decisions) → Only Loads Recent 10

**Precondition:** orge-memory/decisions.md contains 50+ decision entries spanning multiple sessions.
**Action:** Trigger the Planner skill.
**Expected:**
- Planner loads only the 10 most recent decisions for context (not all 50+).
- Context summary says "50 decisions recorded" but only shows highlights from recent ones.
- No performance degradation or timeout.
- Older decisions remain in the file — not deleted.

**Status:** ⬚

---

### MRB-09: Memory with Stack Change (Python → TypeScript) → Detects and Asks About Change

**Precondition:** orge-memory/decisions.md records stack as "Python, FastAPI". User now says stack is "TypeScript, Express".
**Action:** Trigger the Planner skill. Answer Q2 with "TypeScript, Express".
**Expected:**
- Planner detects stack change from memory vs. current answer.
- Shows a notice: "It looks like your stack has changed from Python/FastAPI to TypeScript/Express."
- Asks whether to update conventions or keep both sets.
- Does NOT silently overwrite patterns.md with new stack conventions.

**Status:** ⬚

---

### MRB-10: Memory with Conflicting Patterns → Flags Conflict, Asks User

**Precondition:** orge-memory/patterns.md contains two contradictory conventions (e.g., "Use tabs for indentation" and "Use spaces for indentation").
**Action:** Trigger the Planner skill.
**Expected:**
- Planner detects the conflict during memory read.
- Surfaces the conflict to the user: "Your patterns have a conflict: [tabs vs. spaces]. Which do you prefer?"
- User's answer resolves the conflict and updates patterns.md.

**Status:** ⬚

---

### MRB-11: forge-memory/ Permissions Error → Graceful Fallback with Warning

**Precondition:** orge-memory/ directory exists but files are read-only or directory has restricted permissions.
**Action:** Trigger the Planner skill.
**Expected:**
- Planner does NOT crash.
- Shows warning: "Could not read memory files — proceeding as a new project."
- Full wizard runs as if no memory exists.
- Scaffolding proceeds normally (writes to other directories unaffected).

**Status:** ⬚

---

### MRB-12: All Memory Files Present and Healthy → Full Context Summary

**Precondition:** All four memory files exist with valid content: decisions.md, patterns.md, preferences.md, history.md.
**Action:** Trigger the Planner skill.
**Expected:**
- Full "Welcome back" message with:
  - Project name and description from preferences.
  - Stack and conventions from patterns.
  - Session count from history.
  - Recent decisions summary.
- Wizard skips known questions, offers "Confirm or change" flow.
- Scaffolding completes using pre-loaded context.

**Status:** ⬚

---

## B. Adaptive Wizard (8 scenarios)

How the wizard adapts its question flow based on memory state.

---

### AW-01: Returning User, Nothing Changed → Skip All, Show Summary

**Precondition:** Full memory exists. User's project hasn't changed.
**Action:** Trigger the Planner. User confirms the context summary without changes.
**Expected:**
- Wizard shows context summary with all 5 answers pre-populated.
- User says "looks good" or confirms.
- No questions asked — wizard proceeds directly to scaffolding.
- Faster than first run (fewer interactions).

**Status:** ⬚

---

### AW-02: Returning User, Stack Changed → Asks Only Q2

**Precondition:** Full memory exists. User wants to change their stack.
**Action:** Trigger the Planner. User chooses "change" and modifies Q2 (stack).
**Expected:**
- Wizard shows summary, user says "I want to change my stack."
- Only Q2 is re-asked. Q1, Q3, Q4, Q5 keep their stored values.
- Updated stack propagates to convention extraction and recipe selection.
- preferences.md updated with new stack answer.

**Status:** ⬚

---

### AW-03: Returning User, Wants to Change Something → "Change" Option

**Precondition:** Full memory exists.
**Action:** Trigger the Planner. User says "I want to change something" at the summary.
**Expected:**
- Wizard presents a list of changeable items (project, stack, memory, testing, skill level).
- User selects which to change.
- Only selected questions are re-asked.
- Unchanged answers remain from memory.

**Status:** ⬚

---

### AW-04: First-Time User → Standard 5-Question Flow

**Precondition:** No orge-memory/ directory.
**Action:** Trigger the Planner skill.
**Expected:**
- Standard welcome message (no "Welcome back").
- All 6 questions asked in order.
- No mention of memory, context, or prior sessions.
- Identical to Phase 1-3 wizard flow.

**Status:** ⬚

---

### AW-05: Partial Memory (Decisions Exist, Patterns Missing) → Ask for Missing Info

**Precondition:** orge-memory/decisions.md exists with valid entries. orge-memory/patterns.md does NOT exist.
**Action:** Trigger the Planner.
**Expected:**
- Planner reads decisions.md, extracts what it can (project name, stack).
- Skips Q1 (project) and Q2 (stack) if inferrable from decisions.
- Asks Q3-Q5 and any questions it couldn't infer.
- After scaffolding, patterns.md is created fresh.

**Status:** ⬚

---

### AW-06: Memory Says testing=no, User Now Wants Testing → Override

**Precondition:** orge-memory/preferences.md records 	esting: no.
**Action:** Trigger the Planner. At the summary, user changes testing to "yes".
**Expected:**
- Wizard pre-populates testing=no from memory.
- User overrides to testing=yes.
- Scaffolding generates tester.md and testing skill.
- preferences.md updated to 	esting: yes.
- decisions.md records the change: "Changed testing preference from no to yes."

**Status:** ⬚

---

### AW-07: Memory Says skill_level=beginner, User Wants Advanced → Update

**Precondition:** orge-memory/preferences.md records skill_level: beginner.
**Action:** Trigger the Planner. User changes skill level to "advanced".
**Expected:**
- Wizard pre-populates beginner level from memory.
- User overrides to advanced.
- Scaffolding uses advanced verbosity (terse output, minimal explanations).
- preferences.md updated to skill_level: advanced.
- All generated files reflect advanced verbosity.

**Status:** ⬚

---

### AW-08: "Start Fresh" Command → Clears Memory, Full Wizard

**Precondition:** Full memory exists from prior runs.
**Action:** User says "start fresh" or equivalent during the context summary.
**Expected:**
- Planner asks for confirmation: "This will clear all stored preferences and history. Continue?"
- On confirm: all files in orge-memory/ are deleted.
- Full 5-question wizard runs from scratch.
- New memory files created after scaffolding.
- decisions.md records: "User chose to start fresh — all memory cleared."

**Status:** ⬚

---

## C. Convention Learning (8 scenarios)

How orge-memory/patterns.md evolves across sessions.

---

### CL-01: First Run Generates Patterns → patterns.md Created

**Precondition:** No orge-memory/patterns.md exists.
**Action:** Complete a full wizard run with memory=yes.
**Expected:**
- orge-memory/patterns.md created with:
  - Stack Conventions section (3-5 conventions for the chosen stack).
  - File Structure section.
  - Naming Conventions section.
- Each convention has a confidence level: "observed" (first instance).

**Status:** ⬚

---

### CL-02: Second Run Finds Existing Patterns → New Added, Old Preserved

**Precondition:** orge-memory/patterns.md exists from a prior run with 4 conventions.
**Action:** Complete another wizard run.
**Expected:**
- Existing 4 conventions are untouched.
- New patterns discovered from this session are appended under a dated section.
- Total convention count increases.
- No duplicates — if the same convention is re-discovered, its confidence level is bumped, not duplicated.

**Status:** ⬚

---

### CL-03: Pattern Confidence: 1 Instance → "observed"

**Precondition:** A new convention is discovered for the first time.
**Action:** Complete a wizard run where the convention extractor finds a new pattern.
**Expected:**
- The new pattern is added to patterns.md with confidence: observed.
- One-time sighting, not yet confirmed as a team convention.

**Status:** ⬚

---

### CL-04: Pattern Confidence: 3 Instances → "confirmed"

**Precondition:** A convention has been seen in 3 separate sessions.
**Action:** Complete a wizard run where the convention extractor sees the same pattern a third time.
**Expected:**
- The pattern's confidence is upgraded from "observed" to "confirmed."
- No duplicate entry — the existing entry is updated in place.

**Status:** ⬚

---

### CL-05: Conflicting Pattern Detected → Both Kept, Conflict Noted

**Precondition:** patterns.md has "Use 2-space indentation." A new run discovers "Use 4-space indentation."
**Action:** Convention extractor runs.
**Expected:**
- Both patterns are kept in patterns.md.
- A ⚠ Conflict annotation is added to both entries.
- The conflict is surfaced to the user during the next wizard run (see MRB-10).

**Status:** ⬚

---

### CL-06: User Manually Edits patterns.md → Edits Preserved

**Precondition:** User has manually added custom conventions to patterns.md.
**Action:** Run the Planner again.
**Expected:**
- User's custom conventions are preserved.
- Convention extractor appends new patterns below user's additions.
- No reformatting or restructuring of user-written sections.

**Status:** ⬚

---

### CL-07: Convention Extractor Runs After Scaffolding → New Patterns Discovered

**Precondition:** Scaffolding generates new files (e.g., new cookbook recipes, new agents).
**Action:** Convention extractor analyzes generated files.
**Expected:**
- New patterns derived from generated code (e.g., "Express routes use async handlers").
- Patterns are added to patterns.md under a dated section.
- Source noted: "Discovered from generated cookbook recipes."

**Status:** ⬚

---

### CL-08: No New Patterns Found → patterns.md Unchanged

**Precondition:** orge-memory/patterns.md exists. Convention extractor runs but finds no new patterns.
**Action:** Complete a wizard re-run.
**Expected:**
- patterns.md is not modified (no empty dated section added).
- File timestamp unchanged.
- Validation summary does not report patterns.md as "updated."

**Status:** ⬚

---

## D. Cross-Session Compounding (8 scenarios)

How memory files grow and are maintained across multiple sessions.

---

### CSC-01: history.md Created on First Run

**Precondition:** No orge-memory/history.md exists.
**Action:** Complete a full wizard run with memory=yes.
**Expected:**
- orge-memory/history.md created with:
  - Session 1 entry with date, wizard answers summary, files created count.
  - Format follows the 	emplates/forge-memory/history.md template structure.

**Status:** ⬚

---

### CSC-02: history.md Appended on Second Run

**Precondition:** orge-memory/history.md exists with Session 1 entry.
**Action:** Complete another wizard run.
**Expected:**
- Session 2 entry appended (never overwriting Session 1).
- Entry includes: date, what changed, files created/skipped count.
- Session numbering is sequential and accurate.

**Status:** ⬚

---

### CSC-03: preferences.md Created from Wizard Answers

**Precondition:** No orge-memory/preferences.md exists.
**Action:** Complete a wizard run with memory=yes.
**Expected:**
- orge-memory/preferences.md created with structured key-value pairs:
  - project_name, stack, memory, 	esting, skill_level.
- Values match wizard answers exactly.
- Format follows the 	emplates/forge-memory/preferences.md template.

**Status:** ⬚

---

### CSC-04: preferences.md Updated When User Changes Answers

**Precondition:** orge-memory/preferences.md exists with prior answers.
**Action:** Re-run wizard, change one answer (e.g., testing from no to yes).
**Expected:**
- preferences.md is updated with new value.
- Other unchanged values remain the same.
- A changelog entry is appended noting what changed and when.

**Status:** ⬚

---

### CSC-05: decisions.md Grows Beyond 50 Entries → Summarization Triggered

**Precondition:** orge-memory/decisions.md has 50+ decision entries.
**Action:** Trigger the Planner skill.
**Expected:**
- Memory summarizer activates.
- Oldest entries (beyond the recent 10) are condensed into a summary section.
- Recent 10 entries remain in full detail.
- Total decision count is preserved in metadata.

**Status:** ⬚

---

### CSC-06: Archive Created During Summarization → Original Data Preserved

**Precondition:** Summarization is triggered (50+ entries).
**Action:** Summarizer runs.
**Expected:**
- An archive file is created: orge-memory/archive/decisions-{date}.md.
- Archive contains the full original content before summarization.
- Current decisions.md has: summary of old entries + full recent 10.
- No data loss — all original entries recoverable from archive.

**Status:** ⬚

---

### CSC-07: Multiple Rapid Re-Runs → Each Session Logged Separately

**Precondition:** Run the Planner 3 times in quick succession.
**Action:** Complete 3 wizard runs within minutes.
**Expected:**
- history.md has 3 distinct session entries (not merged).
- Each entry has a unique timestamp.
- decisions.md has 3 separate decision blocks.
- No race condition or data corruption.

**Status:** ⬚

---

### CSC-08: Session Count Accurately Tracked in FORGE.md Memory Status

**Precondition:** 5 prior sessions recorded in history.md.
**Action:** Trigger the Planner skill (6th run).
**Expected:**
- FORGE.md Memory Status section shows "Sessions: 6."
- Decision count matches decisions.md entry count.
- Pattern count matches patterns.md convention count.

**Status:** ⬚

---

## E. Memory Safety (8 scenarios)

Ensuring memory files are safe, resilient, and recoverable.

---

### MS-01: Memory Files Contain No Secrets/API Keys/PII After Generation

**Precondition:** Wizard answers include stack details but no explicit secrets.
**Action:** Generate memory files.
**Expected:**
- decisions.md, patterns.md, preferences.md, history.md contain NO:
  - API keys, tokens, or credentials.
  - Personal email addresses, names (beyond project name), or identifying info.
  - Connection strings with passwords.
- Only project-level metadata (stack, preferences, decisions).

**Status:** ⬚

---

### MS-02: Corrupted decisions.md (Invalid Markdown) → Parser Doesn't Crash

**Precondition:** orge-memory/decisions.md contains invalid markdown (unclosed headings, random bytes, truncated content).
**Action:** Trigger the Planner skill.
**Expected:**
- Memory reader attempts to parse, fails gracefully.
- No stack trace shown to user.
- Planner falls back to asking wizard questions.
- Corrupted file is NOT deleted (user may want to recover it manually).

**Status:** ⬚

---

### MS-03: Corrupted patterns.md (Missing Sections) → Partial Parse Succeeds

**Precondition:** orge-memory/patterns.md has a valid header but is missing the "File Structure" and "Naming Conventions" sections.
**Action:** Trigger the Planner skill.
**Expected:**
- Memory reader parses what's available (Stack Conventions only).
- Missing sections treated as empty, not as errors.
- Convention pre-population works for available sections.

**Status:** ⬚

---

### MS-04: User Deletes Some Memory Files → Missing Files Recreated on Next Run

**Precondition:** User deletes orge-memory/preferences.md and orge-memory/history.md. decisions.md and patterns.md still exist.
**Action:** Trigger the Planner skill.
**Expected:**
- Planner reads surviving files (decisions, patterns).
- After scaffolding, preferences.md and history.md are recreated.
- Recreated files reflect current session, not dummy data.
- Surviving files are untouched.

**Status:** ⬚

---

### MS-05: Memory Format Version Mismatch → Graceful Migration or Fallback

**Precondition:** Memory files were created by an older version of CopilotForge with a different format.
**Action:** Trigger the Planner skill.
**Expected:**
- Memory reader detects format mismatch (missing required fields, unknown structure).
- Either: migrates old format to new format (preserving data), OR: falls back to asking questions.
- Does NOT crash or corrupt the old files.
- If migration occurs, a decision is logged: "Migrated memory format from v1 to v2."

**Status:** ⬚

---

### MS-06: Concurrent Writes to Memory Files → Append-Only Prevents Corruption

**Precondition:** Two Planner instances attempt to update memory simultaneously (unlikely but possible in multi-window setups).
**Action:** Both instances complete scaffolding and attempt to write memory.
**Expected:**
- Append-only protocol means both writes succeed (one after the other).
- No data loss — both entries appear in the file.
- File is valid markdown after both writes complete.

**Status:** ⬚

---

### MS-07: "Start Fresh" Clears All Memory and Runs Full Wizard

**Precondition:** Full memory exists.
**Action:** User invokes "start fresh" command.
**Expected:**
- All files in orge-memory/ are deleted (decisions.md, patterns.md, preferences.md, history.md).
- The orge-memory/ directory itself is preserved (empty).
- Full wizard runs from scratch (identical to first run).
- New memory files created after scaffolding.
- The first entry in the new decisions.md notes: "Fresh start — prior memory cleared."

**Status:** ⬚

---

### MS-08: Empty forge-memory/ Directory → Treated as First Run

**Precondition:** orge-memory/ exists as an empty directory.
**Action:** Trigger the Planner skill.
**Expected:**
- Planner detects empty directory.
- Treated as first run — full wizard, no "Welcome back."
- Memory files created fresh after scaffolding.
- Identical behavior to MRB-07.

**Status:** ⬚

---

## F. FORGE.md Memory Surface (5 scenarios)

How memory status is displayed in the project control panel.

---

### FMS-01: FORGE.md Has Memory Status Section with Markers

**Precondition:** Phase 4 implementation complete.
**Action:** Inspect 	emplates/FORGE.md.
**Expected:**
- Memory Status section exists.
- Section is bounded by <!-- forge:memory-start --> and <!-- forge:memory-end --> markers.
- Markers enable selective updates without touching other sections.

**Status:** ⬚

---

### FMS-02: Memory Status Shows Accurate Counts

**Precondition:** orge-memory/ has 5 decisions, 3 patterns, 2 sessions.
**Action:** Generate or update FORGE.md.
**Expected:**
- Memory Status section shows:
  - Decisions: 5
  - Patterns: 3
  - Sessions: 2
- Counts match actual file contents.

**Status:** ⬚

---

### FMS-03: Recent Decisions Listed in FORGE.md

**Precondition:** orge-memory/decisions.md has 5+ entries.
**Action:** Generate or update FORGE.md.
**Expected:**
- Memory Status section lists the 3 most recent decisions (summary, not full text).
- Older decisions referenced with "See forge-memory/decisions.md for full history."

**Status:** ⬚

---

### FMS-04: Active Conventions Listed in FORGE.md

**Precondition:** orge-memory/patterns.md has 4 confirmed conventions.
**Action:** Generate or update FORGE.md.
**Expected:**
- Memory Status section lists confirmed conventions (confidence: confirmed).
- "observed" conventions are NOT listed (too tentative for the control panel).

**Status:** ⬚

---

### FMS-05: Memory Section Updates on Re-Run Without Touching Other Sections

**Precondition:** FORGE.md exists with user edits in the Project Summary section. A re-run updates memory.
**Action:** Re-run the Planner.
**Expected:**
- Content between <!-- forge:memory-start --> and <!-- forge:memory-end --> is updated.
- All content outside those markers is untouched.
- User's Project Summary edits are preserved.

**Status:** ⬚

---

## G. Jargon Leak Check (4 scenarios)

Ensuring Phase 4 content doesn't expose internal implementation details.

---

### JL-01: New Memory Templates Are Jargon-Free

**Files:** 	emplates/forge-memory/preferences.md, 	emplates/forge-memory/history.md
**Banned terms:** "cookbook-writer", "skill-writer", "agent-writer", "memory-writer", "specialist"
**Expected:** None of the banned terms appear outside HTML comments.

**Status:** ⬚

---

### JL-02: Memory Reader Recipes Are Jargon-Free

**Files:** cookbook/memory-reader.ts, cookbook/memory-reader.py
**Banned terms:** Same list.
**Expected:** None of the banned terms appear outside HTML comments.

**Status:** ⬚

---

### JL-03: Updated SKILL.md Memory Sections Are Jargon-Free

**File:** .github/skills/planner/SKILL.md
**Scope:** Any new sections added for Phase 4 (Step 0, Memory Check, adaptive wizard).
**Expected:** No internal agent names or "specialist" in user-visible content.

**Status:** ⬚

---

### JL-04: preferences.md and history.md Templates Are Jargon-Free

**Files:** 	emplates/forge-memory/preferences.md, 	emplates/forge-memory/history.md
**Expected:** Content is written in plain English. No references to internal delegation, FORGE-CONTEXT blocks, or specialist names.

**Status:** ⬚

---

## H. Beginner Experience (5 scenarios)

Does memory feel approachable to someone new?

---

### BE-01: "Welcome Back" Message Is Clear and Friendly

**Action:** Trigger the Planner with full memory present.
**Expected:**
- Message uses warm, inviting language ("Welcome back!" not "Resuming session").
- Context summary is a brief paragraph, not a data dump.
- No technical jargon (no "FORGE-CONTEXT", "memory reader", "convention extractor").

**Status:** ⬚

---

### BE-02: Context Summary Is Understandable Without Technical Knowledge

**Action:** Read the context summary shown by the adaptive wizard.
**Expected:**
- A beginner can answer: "What does this summary tell me?" correctly.
- Project name, stack, and what was previously built are clear.
- Session count is explained (e.g., "This is your 3rd time running CopilotForge" not "sessions: 3").

**Status:** ⬚

---

### BE-03: Memory Preferences Are Explained in Plain English

**Action:** Read orge-memory/preferences.md (generated from template).
**Expected:**
- File has a header comment explaining what it stores and why.
- Each preference field has a comment explaining what it means.
- A beginner could edit this file without reading documentation.

**Status:** ⬚

---

### BE-04: "Start Fresh" Is Easy to Find and Understand

**Action:** Look for the "start fresh" option during an adaptive wizard session.
**Expected:**
- Option is clearly presented (not hidden in a submenu or requiring a special command).
- Explanation of what "start fresh" does is given before the user commits.
- Consequences are clear: "This will clear all stored preferences and start over."

**Status:** ⬚

---

### BE-05: Memory Files Have Helpful Comments Explaining Their Purpose

**Action:** Open each file in orge-memory/.
**Expected:**
- Each file starts with a comment explaining its purpose.
- Comments explain: what this file stores, who updates it, and whether it's safe to edit.
- A beginner reading the file for the first time understands what they're looking at.

**Status:** ⬚

---

## Summary

| Category | Scenario Count | Status |
|----------|---------------|--------|
| A. Memory Read-Back | 12 | ⬚ |
| B. Adaptive Wizard | 8 | ⬚ |
| C. Convention Learning | 8 | ⬚ |
| D. Cross-Session Compounding | 8 | ⬚ |
| E. Memory Safety | 8 | ⬚ |
| F. FORGE.md Memory Surface | 5 | ⬚ |
| G. Jargon Leak Check | 4 | ⬚ |
| H. Beginner Experience | 5 | ⬚ |
| **Total** | **58** | ⬚ |

---

## Metadata

| Field | Value |
|-------|-------|
| **Owner** | Tank (Tester) |
| **Phase** | 4 — Memory & Iteration |
| **Created** | Phase 4 kickoff |
| **Validators** | `tests/phase4/validate-memory.ps1`, `tests/phase4/validate-memory.sh` |
| **Automated checks** | 10 categories in validator scripts |
| **Manual checks** | Beginner experience (see `tests/phase4/beginner-checklist.md`) |
