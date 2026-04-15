# CopilotForge Phase 2 — Test Scenarios

> Owned by **Tank** (Tester). Each scenario is specific enough to execute.
> Status: ⬚ = not tested, ✓ = passed, ✗ = failed

---

## A. Wizard Delegation Flow

### WD-01: Full Wizard → Correct Delegation to All 4 Specialists

**Input:**
1. What are you building? → "A project management SaaS with Kanban boards"
2. What's your stack? → "TypeScript, React, Node.js, PostgreSQL"
3. Memory across sessions? → Yes
4. Test automation? → Yes
5. Skill level? → Intermediate

**Expected behavior:**
- Planner collects all 5 answers, then silently delegates to:
  - skill-writer → creates `.github/skills/` entries
  - agent-writer → creates `.copilot/agents/` entries
  - memory-writer → creates `forge-memory/` entries
  - cookbook-writer → creates `cookbook/` entries
- User sees a single, unified progress flow — never "now delegating to skill-writer"

**Validation:**
- ⬚ All 4 output directories contain new files
- ⬚ User-visible output never mentions "skill-writer", "agent-writer", "memory-writer", or "cookbook-writer"
- ⬚ FORGE.md is generated after all specialists complete
- ⬚ `validate-delegation.ps1` passes

**Status:** ⬚

---

### WD-02: "Just Use Defaults" → Correct Delegation

**Input:**
1. What are you building? → "A blog"
2–5: "Just use defaults" / skip

**Expected behavior:**
- Planner applies sensible defaults (generic stack, memory=yes, tests=yes, skill level=beginner)
- All 4 specialists still run — defaults don't skip delegation
- Output is complete and valid, just generic

**Validation:**
- ⬚ All directories are scaffolded (no missing output from skipped steps)
- ⬚ FORGE.md doesn't contain {{placeholder}} values or undefined fields
- ⬚ Default skill level (beginner) produces more comments in generated files
- ⬚ No errors or empty files

**Status:** ⬚

---

### WD-03: Partial Answers → Planner Asks Only Missing Questions

**Input:**
1. User provides project description and stack in a single message: "Build me a REST API in Python with FastAPI"
2. Planner should only ask the remaining 3 questions (memory, tests, skill level)

**Expected behavior:**
- Planner detects that Q1 and Q2 are answered
- Planner asks only Q3 (memory), Q4 (tests), Q5 (skill level)
- No re-asking of answered questions

**Validation:**
- ⬚ Planner does not re-ask "What are you building?" or "What's your stack?"
- ⬚ Remaining questions are still asked in order
- ⬚ All 4 specialists still receive correct inputs
- ⬚ Output matches what a full wizard run would produce for the same answers

**Status:** ⬚

---

### WD-04: Dependency Order — skill-writer Runs Before agent-writer

**Setup:** Run wizard with any valid input.

**Expected behavior:**
- skill-writer completes before agent-writer starts
- Reason: agent definitions reference skills by name — skills must exist first

**Validation:**
- ⬚ Agent files reference skill names that actually exist in `.github/skills/`
- ⬚ If skill-writer output is examined before agent-writer runs, all referenced skills are present
- ⬚ No dangling skill references in any agent file

**Status:** ⬚

---

### WD-05: Parallel Execution — memory-writer and cookbook-writer Are Independent

**Setup:** Run wizard with any valid input.

**Expected behavior:**
- memory-writer and cookbook-writer have no dependency on each other
- Both can run concurrently after skill-writer completes (or in parallel with agent-writer)
- Neither reads or writes the other's output directory

**Validation:**
- ⬚ memory-writer output (`forge-memory/`) doesn't reference cookbook filenames
- ⬚ cookbook-writer output (`cookbook/`) doesn't reference forge-memory filenames
- ⬚ Both produce valid output regardless of which finishes first
- ⬚ Removing memory-writer output doesn't break cookbook-writer output (and vice versa)

**Status:** ⬚

---

### WD-06: Delegation Is Invisible — User Never Sees Specialist Names

**Setup:** Run full wizard and capture all user-visible output.

**Expected behavior:**
- Terms like "skill-writer", "agent-writer", "memory-writer", "cookbook-writer" never appear in output
- Terms like "delegating", "dispatching", "specialist" never appear
- User sees natural progress messages like "Creating your skills...", "Setting up agents..."

**Validation:**
- ⬚ Full text search of all user-visible output for "skill-writer" → 0 results
- ⬚ Full text search for "agent-writer" → 0 results
- ⬚ Full text search for "memory-writer" → 0 results
- ⬚ Full text search for "cookbook-writer" → 0 results
- ⬚ Full text search for "delegat" → 0 results
- ⬚ Full text search for "specialist" → 0 results
- ⬚ Full text search for "orchestrat" → 0 results (in user-visible output only)

**Status:** ⬚

---

### WD-07: All Specialists Produce Valid Files in Correct Locations

**Setup:** Run wizard with full valid input (same as WD-01).

**Expected behavior:**
- skill-writer output → `.github/skills/` only
- agent-writer output → `.copilot/agents/` only
- memory-writer output → `forge-memory/` only
- cookbook-writer output → `cookbook/` only
- No specialist writes outside its assigned directory

**Validation:**
- ⬚ Git diff after scaffold shows changes only in expected directories per specialist
- ⬚ No surprise files created in project root or other directories
- ⬚ Each directory contains at least one new file
- ⬚ `validate-delegation.ps1` cross-reference check passes

**Status:** ⬚

---

### WD-08: Planner Waits for All Specialists Before Generating FORGE.md

**Setup:** Run wizard with valid input.

**Expected behavior:**
- FORGE.md is the last file written
- FORGE.md reflects the actual output of all 4 specialists (not a pre-planned manifest)
- Every file listed in FORGE.md actually exists on disk

**Validation:**
- ⬚ FORGE.md Team Roster lists all agents that were actually created
- ⬚ FORGE.md Skills Index lists all skills that were actually created
- ⬚ FORGE.md Cookbook Index lists all recipes that were actually created
- ⬚ Cross-reference check: every path in FORGE.md exists on disk
- ⬚ No "planned but not created" entries in FORGE.md

**Status:** ⬚

---

### WD-09: Single-Answer Wizard — User Provides Everything in One Message

**Input:**
"Build me a TypeScript REST API with Express and MongoDB. I want memory, tests, and I'm a beginner."

**Expected behavior:**
- Planner extracts all 5 answers from the single message
- No follow-up questions needed
- Full delegation proceeds as normal

**Validation:**
- ⬚ Scaffold completes without additional prompting
- ⬚ Output matches an equivalent 5-step wizard run
- ⬚ Stack is correctly identified as TypeScript/Express/MongoDB
- ⬚ Skill level is correctly set to beginner

**Status:** ⬚

---

### WD-10: Wizard Handles "No Memory" Answer → memory-writer Skipped

**Input:**
1. What are you building? → "A CLI calculator"
2. What's your stack? → "Python"
3. Memory across sessions? → No
4. Test automation? → Yes
5. Skill level? → Beginner

**Expected behavior:**
- memory-writer is NOT delegated (user said no memory)
- `forge-memory/` directory is NOT created
- FORGE.md Memory Status section says "Memory not enabled" or is omitted
- All other specialists still run normally

**Validation:**
- ⬚ `forge-memory/` does not exist
- ⬚ FORGE.md doesn't reference forge-memory files that don't exist
- ⬚ Remaining output (skills, agents, cookbook) is still correct
- ⬚ No errors from missing memory directory

**Status:** ⬚

---

## B. Specialist Agent Isolation

### SI-01: skill-writer ONLY Writes to `.github/skills/`

**Setup:** Run wizard. Record all files created/modified by skill-writer.

**Validation:**
- ⬚ Every file skill-writer creates is under `.github/skills/`
- ⬚ skill-writer does not modify `.copilot/agents/`, `forge-memory/`, `cookbook/`, or `FORGE.md`
- ⬚ skill-writer does not create files in project root
- ⬚ Each skill directory contains a `SKILL.md` with valid frontmatter

**Status:** ⬚

---

### SI-02: agent-writer ONLY Writes to `.copilot/agents/`

**Setup:** Run wizard. Record all files created/modified by agent-writer.

**Validation:**
- ⬚ Every file agent-writer creates is under `.copilot/agents/`
- ⬚ agent-writer does not modify `.github/skills/`, `forge-memory/`, `cookbook/`, or `FORGE.md`
- ⬚ agent-writer does not create files in project root
- ⬚ Each agent file has required sections: Role, Scope/Responsibilities, Boundaries

**Status:** ⬚

---

### SI-03: memory-writer ONLY Writes to `forge-memory/`

**Setup:** Run wizard with memory enabled. Record all files created/modified by memory-writer.

**Validation:**
- ⬚ Every file memory-writer creates is under `forge-memory/`
- ⬚ memory-writer does not modify `.copilot/agents/`, `.github/skills/`, `cookbook/`, or `FORGE.md`
- ⬚ `decisions.md` has a header and at least one section
- ⬚ `patterns.md` has a header and at least one section

**Status:** ⬚

---

### SI-04: cookbook-writer ONLY Writes to `cookbook/`

**Setup:** Run wizard. Record all files created/modified by cookbook-writer.

**Validation:**
- ⬚ Every file cookbook-writer creates is under `cookbook/`
- ⬚ cookbook-writer does not modify `.copilot/agents/`, `.github/skills/`, `forge-memory/`, or `FORGE.md`
- ⬚ Each recipe has a header comment explaining its purpose
- ⬚ Recipe file extensions match the stated stack

**Status:** ⬚

---

### SI-05: No Specialist Overwrites Another's Files

**Setup:** Run wizard. Verify file ownership boundaries.

**Validation:**
- ⬚ Git blame (or timestamp analysis) shows each file was written by exactly one specialist
- ⬚ No specialist modifies a file that was created by a different specialist
- ⬚ Only the Planner (orchestrator) writes FORGE.md — no specialist touches it
- ⬚ No specialist deletes or truncates another specialist's output

**Status:** ⬚

---

### SI-06: Each Specialist Respects Skill Level Setting

**Setup:** Run wizard twice — once with "beginner" skill level, once with "advanced."

**Validation:**
- ⬚ Beginner: skill-writer output has more detailed descriptions and usage examples
- ⬚ Beginner: agent-writer output has verbose role explanations
- ⬚ Beginner: cookbook-writer output has more inline comments
- ⬚ Beginner: memory-writer output explains the purpose of each file section
- ⬚ Advanced: all outputs are leaner — less hand-holding, more signal
- ⬚ Both: structural validity is identical (same sections, same required fields)

**Status:** ⬚

---

### SI-07: agent-writer References Skills by Correct Names

**Setup:** Run wizard. Compare skill names in `.github/skills/` to references in `.copilot/agents/`.

**Validation:**
- ⬚ Every skill name referenced in an agent file matches a directory in `.github/skills/`
- ⬚ No agent references a skill that doesn't exist
- ⬚ Skill names use the exact same casing and formatting in both locations
- ⬚ `validate-delegation.ps1` cross-reference check catches mismatches

**Status:** ⬚

---

### SI-08: Specialists Handle Unsupported Stack Gracefully

**Input:** Stack → "Rust, Actix-web" (not a common template target)

**Expected behavior:**
- Each specialist produces output even for uncommon stacks
- Cookbook may be generic or indicate "customize for your stack"
- No specialist crashes or produces empty output

**Validation:**
- ⬚ All 4 specialists produce non-empty output
- ⬚ FORGE.md references the correct stack ("Rust, Actix-web")
- ⬚ Cookbook files have appropriate extensions or generic examples
- ⬚ No error messages or broken references

**Status:** ⬚

---

## C. Re-Run Behavior

### RR-01: First Run in Empty Repo → Full Scaffolding

**Setup:** Fresh repo with no CopilotForge files.

**Expected behavior:**
- Full scaffolding: all directories, all files, FORGE.md
- No merge logic triggered (nothing to merge with)

**Validation:**
- ⬚ All expected directories created: `.copilot/agents/`, `.github/skills/`, `forge-memory/`, `cookbook/`
- ⬚ FORGE.md created with all sections
- ⬚ `validate-delegation.ps1` passes
- ⬚ No "merge" or "skipped" messages in output

**Status:** ⬚

---

### RR-02: Second Run → Detects Existing Files, Skips Appropriately

**Setup:**
1. Run wizard → full scaffold created
2. Run wizard again with same inputs

**Expected behavior:**
- Planner detects existing CopilotForge files
- Files that haven't been modified → skipped or quietly confirmed
- No duplicate content or double-scaffolding

**Validation:**
- ⬚ Output indicates re-run detection ("Found existing CopilotForge project" or similar)
- ⬚ No duplicate agent definitions
- ⬚ No duplicate skill directories
- ⬚ File content after second run matches first run (idempotent)
- ⬚ FORGE.md not duplicated or corrupted

**Status:** ⬚

---

### RR-03: FORGE.md Exists → Merge (Preserve User Edits, Update Tables)

**Setup:**
1. Run wizard → FORGE.md created
2. User adds a custom "Notes" section to FORGE.md
3. Run wizard again

**Expected behavior:**
- Custom "Notes" section is preserved
- Generated tables (Team Roster, Skills Index) are updated with any new entries
- Existing table entries are not duplicated

**Validation:**
- ⬚ Custom "Notes" section still exists after re-run
- ⬚ Team Roster reflects current agents (updated, not duplicated)
- ⬚ Skills Index reflects current skills (updated, not duplicated)
- ⬚ No data loss — user edits are intact
- ⬚ FORGE.md is structurally valid after merge

**Status:** ⬚

---

### RR-04: decisions.md Exists → Append Only (Never Delete Entries)

**Setup:**
1. Run wizard → `forge-memory/decisions.md` created with initial entries
2. User adds a custom decision entry manually
3. Run wizard again

**Expected behavior:**
- Existing entries (including user's custom entry) are preserved
- New entries from re-run are appended at the end
- No entries are deleted, moved, or modified

**Validation:**
- ⬚ Custom user entry still exists at its original position
- ⬚ New re-run entries appear after existing content
- ⬚ Entry count after re-run ≥ entry count before re-run
- ⬚ File passes markdown parse validation

**Status:** ⬚

---

### RR-05: patterns.md Exists → Merge (Keep Existing, Add New)

**Setup:**
1. Run wizard → `forge-memory/patterns.md` created
2. User adds a custom pattern
3. Run wizard again with a different stack

**Expected behavior:**
- Existing patterns (including user's custom one) are preserved
- New patterns relevant to the new stack are added
- No duplicate patterns

**Validation:**
- ⬚ Custom user pattern still exists
- ⬚ New patterns added for changed stack
- ⬚ No duplicate pattern entries
- ⬚ File is valid markdown

**Status:** ⬚

---

### RR-06: User Added Custom Agent → Not Overwritten

**Setup:**
1. Run wizard → `.copilot/agents/` populated
2. User creates `.copilot/agents/custom-agent.md` manually
3. Run wizard again

**Expected behavior:**
- `custom-agent.md` is preserved exactly as the user created it
- Re-run does not modify, delete, or rename custom agent files
- FORGE.md may or may not list the custom agent (acceptable either way — but must not break)

**Validation:**
- ⬚ `custom-agent.md` content is unchanged after re-run
- ⬚ File permissions/timestamps unchanged
- ⬚ Generated agents are still present alongside custom one
- ⬚ No naming conflicts

**Status:** ⬚

---

### RR-07: User Added Custom Skill → Not Overwritten

**Setup:**
1. Run wizard → `.github/skills/` populated
2. User creates `.github/skills/custom-skill/SKILL.md` manually
3. Run wizard again

**Expected behavior:**
- `custom-skill/SKILL.md` is preserved
- Re-run does not modify or delete custom skill directories
- Cross-reference check doesn't flag custom skills as "orphaned"

**Validation:**
- ⬚ Custom skill directory and SKILL.md unchanged after re-run
- ⬚ No merge artifacts in custom skill
- ⬚ Validation scripts don't flag custom skills as errors
- ⬚ Generated skills coexist with custom skills

**Status:** ⬚

---

### RR-08: User Deleted a Generated File → Re-Created on Re-Run

**Setup:**
1. Run wizard → full scaffold
2. User deletes `.copilot/agents/reviewer.md`
3. Run wizard again

**Expected behavior:**
- Planner detects that `reviewer.md` was part of the original scaffold but is now missing
- File is re-created with current content (not necessarily identical to first run)
- User is informed that a missing file was regenerated

**Decision needed:** Should deleted files be re-created silently, re-created with a warning, or left deleted? **Tank's recommendation: re-create with a note in the output.** Users who deliberately deleted a file can delete it again. Users who accidentally deleted it get it back.

**Validation:**
- ⬚ `reviewer.md` is re-created after re-run
- ⬚ Output mentions that the file was regenerated
- ⬚ Re-created file is structurally valid
- ⬚ FORGE.md Team Roster includes the re-created agent

**Status:** ⬚

---

### RR-09: Stack Changed Between Runs → Additive Updates

**Setup:**
1. Run wizard with stack "Python, FastAPI"
2. Run wizard again with stack "Python, FastAPI, React, TypeScript"

**Expected behavior:**
- New stack-specific files are added (React/TypeScript cookbook recipes, etc.)
- Existing Python-specific files are preserved
- FORGE.md updated to reflect the expanded stack

**Validation:**
- ⬚ Python cookbook recipes still exist
- ⬚ New TypeScript/React recipes added
- ⬚ FORGE.md stack field updated to include both
- ⬚ No Python files deleted or overwritten
- ⬚ Agent definitions updated to reference new stack elements

**Status:** ⬚

---

### RR-10: Re-Run with "No Memory" After First Run Had Memory → Preserve Existing

**Setup:**
1. Run wizard with memory=yes → `forge-memory/` created with decisions and patterns
2. User adds entries to decisions.md
3. Run wizard again with memory=no

**Expected behavior:**
- `forge-memory/` is NOT deleted (user has data in it)
- Planner warns that memory exists but new run doesn't use it
- Existing data is preserved, no new entries added

**Decision needed:** Should memory=no on re-run delete the directory? **Tank says absolutely not.** User data is sacred. Warn, don't destroy.

**Validation:**
- ⬚ `forge-memory/` still exists with all prior entries
- ⬚ User's custom decisions.md entries are intact
- ⬚ No new entries appended (memory was disabled this run)
- ⬚ FORGE.md Memory Status section reflects "Memory previously enabled, currently disabled" or similar
- ⬚ No data loss

**Status:** ⬚

---

## D. Error Recovery

### ER-01: Specialist Fails Mid-Scaffolding → Partial Output Handled Gracefully

**Setup:** Simulate a specialist failure (e.g., skill-writer encounters a write error).

**Expected behavior:**
- Partially created files are cleaned up OR clearly marked as incomplete
- Other independent specialists still run
- FORGE.md reflects what was actually created (not what was planned)
- User is informed of the failure with a clear message

**Validation:**
- ⬚ No half-written files left on disk (either complete or absent)
- ⬚ FORGE.md doesn't list files that weren't created
- ⬚ Error message identifies which specialist failed and what wasn't created
- ⬚ User is told how to retry

**Status:** ⬚

---

### ER-02: skill-writer Fails → agent-writer Should Not Run

**Setup:** Simulate skill-writer failure.

**Expected behavior:**
- agent-writer is blocked (dependency on skill-writer)
- memory-writer and cookbook-writer still run (independent)
- FORGE.md lists only what was successfully created
- Error message explains the dependency: "Skills couldn't be created, so agent setup was skipped"

**Validation:**
- ⬚ No agent files created that reference nonexistent skills
- ⬚ Memory and cookbook files are still created
- ⬚ Error message is specific and actionable
- ⬚ FORGE.md Team Roster and Skills Index are empty or absent (not populated with planned-but-not-created items)

**Status:** ⬚

---

### ER-03: memory-writer Fails → cookbook-writer Still Runs

**Setup:** Simulate memory-writer failure.

**Expected behavior:**
- cookbook-writer runs normally (no dependency on memory-writer)
- Skills and agents are unaffected
- FORGE.md Memory Status section indicates failure
- FORGE.md Cookbook section is populated normally

**Validation:**
- ⬚ cookbook/ directory contains valid files
- ⬚ Skills and agents are present and valid
- ⬚ `forge-memory/` may be partially created or absent
- ⬚ FORGE.md accurately reflects the mixed success/failure state

**Status:** ⬚

---

### ER-04: User Cancels After Partial Scaffolding → State Is Consistent

**Setup:** User interrupts wizard after skills are created but before agents are started.

**Expected behavior:**
- Files already written to disk remain (don't delete partial progress)
- Partial state is recoverable — re-running picks up where it left off
- No corrupt or half-written files

**Validation:**
- ⬚ Files created before cancellation are valid and complete
- ⬚ FORGE.md either doesn't exist (not yet generated) or reflects partial state
- ⬚ Re-running wizard after cancel completes the scaffold
- ⬚ No duplicate files from the partial + completed runs

**Status:** ⬚

---

### ER-05: Read-Only Directory → Clear Error Before Any Writes

**Setup:** Set `.copilot/agents/` to read-only, then run wizard.

**Expected behavior:**
- Planner detects permission issue before starting delegation
- Clear error message: "Cannot write to .copilot/agents/ — check directory permissions"
- No partial writes to other directories (fail-fast)

**Validation:**
- ⬚ Error message mentions the specific directory and "permissions"
- ⬚ No files created in any directory (atomic: all or nothing)
- ⬚ No stack traces or technical error codes
- ⬚ Exit state is clean — re-running after fixing permissions works

**Status:** ⬚

---

### ER-06: Disk Full → Graceful Failure with Status

**Setup:** Simulate disk full condition during scaffold.

**Expected behavior:**
- Planner catches write failure and reports clearly
- Any partially written files are noted
- User is told to free disk space and re-run

**Validation:**
- ⬚ Error message mentions disk space
- ⬚ No silent data corruption
- ⬚ Partial files are identified in the error output
- ⬚ Re-run after clearing space completes successfully

**Status:** ⬚

---

## E. Beginner Experience

### BX2-01: Beginner Never Sees "Specialist Agent" Terminology

**Setup:** Run full wizard as a beginner. Examine all user-facing output AND all generated files.

**Validation:**
- ⬚ No generated file contains "specialist agent"
- ⬚ No generated file contains "skill-writer", "agent-writer", "memory-writer", or "cookbook-writer"
- ⬚ No generated file uses "delegat" in any form (delegate, delegation, delegating)
- ⬚ No generated file uses "orchestrator" where a beginner would see it (internal comments OK)
- ⬚ FORGE.md explains agents as "your AI helpers" or similar plain language

**Status:** ⬚

---

### BX2-02: Validation Summary Explains Every File Clearly

**Setup:** Run `validate-delegation.ps1` after a successful scaffold.

**Validation:**
- ⬚ Every PASS message describes what was checked in plain language
- ⬚ Every FAIL message says what's wrong AND what to do about it
- ⬚ Summary clearly states pass/fail count
- ⬚ A beginner reading the output knows whether their project is set up correctly
- ⬚ No jargon: "frontmatter", "cross-reference", "delegation" are explained or avoided

**Status:** ⬚

---

### BX2-03: FORGE.md Accurately Reflects What Was Actually Created

**Setup:** Run wizard and compare FORGE.md content to actual files on disk.

**Validation:**
- ⬚ Every file listed in FORGE.md exists on disk
- ⬚ Every file on disk in CopilotForge directories is listed in FORGE.md
- ⬚ Team Roster matches actual agent files
- ⬚ Skills Index matches actual skill directories
- ⬚ Cookbook Index matches actual recipe files
- ⬚ Memory Status matches actual forge-memory files
- ⬚ No "planned" items that weren't created

**Status:** ⬚

---

### BX2-04: Quick Actions in FORGE.md Actually Work When Copy-Pasted

**Setup:** Copy each Quick Action from FORGE.md into Copilot chat.

**Quick Actions to test:**
1. "Create a new agent for [role] and add it to FORGE.md"
2. "Create a new skill that triggers on [event] and does [action]"
3. "Write a cookbook recipe for [task] in [language]"
4. "Record that we decided to [decision] because [reason]"
5. "Re-run the CopilotForge planner to update the project structure"

**Validation:**
- ⬚ Each Quick Action is a valid prompt (grammatically correct, clear intent)
- ⬚ Copilot understands each prompt and takes appropriate action
- ⬚ Results of each action are reflected in the correct files
- ⬚ No Quick Action causes errors or confusion

**Status:** ⬚

---

### BX2-05: Beginner Can Understand Every Specialist Agent's Output

**Setup:** Open each generated file type and assess readability.

**Files to review:**
- A skill SKILL.md
- An agent .md file
- A decisions.md / patterns.md entry
- A cookbook recipe

**Validation:**
- ⬚ Each file has a header comment or intro section explaining what it is
- ⬚ Each file explains its own purpose (not just its content)
- ⬚ A beginner can understand what to do with the file after reading it
- ⬚ No unexplained jargon (YAML, frontmatter, SDK, etc. are explained on first use)
- ⬚ Each file says "you can edit this" or makes editability obvious

**Status:** ⬚

---

### BX2-06: No Jargon Leaks — Internal Terms Don't Appear in User-Facing Files

**Setup:** Search all generated files (not internal Phase 2 code) for internal terminology.

**Banned terms in user-facing content:**
- "orchestrator" (in user-visible contexts)
- "delegat*" (delegate, delegation, delegating)
- "specialist"
- "skill-writer" / "agent-writer" / "memory-writer" / "cookbook-writer"
- "dispatch"
- "pipeline"

**Allowed context:** Internal code comments, developer documentation, `docs/delegation-protocol.md`

**Validation:**
- ⬚ `grep -ri "orchestrat" FORGE.md` → 0 matches (or only in hidden HTML comments)
- ⬚ `grep -ri "delegat" FORGE.md` → 0 matches
- ⬚ `grep -ri "specialist" FORGE.md` → 0 matches
- ⬚ Same checks on all files in `.copilot/agents/`, `.github/skills/`, `forge-memory/`, `cookbook/`
- ⬚ `docs/delegation-protocol.md` is explicitly excluded from this check (it's internal)

**Status:** ⬚

---

## Test Execution Tracking

| ID | Name | Category | Status |
|----|------|----------|--------|
| WD-01 | Full wizard delegation | Wizard Delegation | ⬚ |
| WD-02 | Defaults delegation | Wizard Delegation | ⬚ |
| WD-03 | Partial answers | Wizard Delegation | ⬚ |
| WD-04 | Dependency order | Wizard Delegation | ⬚ |
| WD-05 | Parallel execution | Wizard Delegation | ⬚ |
| WD-06 | Invisible delegation | Wizard Delegation | ⬚ |
| WD-07 | Correct file locations | Wizard Delegation | ⬚ |
| WD-08 | FORGE.md timing | Wizard Delegation | ⬚ |
| WD-09 | Single-answer wizard | Wizard Delegation | ⬚ |
| WD-10 | No memory skips writer | Wizard Delegation | ⬚ |
| SI-01 | skill-writer isolation | Specialist Isolation | ⬚ |
| SI-02 | agent-writer isolation | Specialist Isolation | ⬚ |
| SI-03 | memory-writer isolation | Specialist Isolation | ⬚ |
| SI-04 | cookbook-writer isolation | Specialist Isolation | ⬚ |
| SI-05 | No cross-overwrites | Specialist Isolation | ⬚ |
| SI-06 | Skill level respected | Specialist Isolation | ⬚ |
| SI-07 | Skill name references | Specialist Isolation | ⬚ |
| SI-08 | Uncommon stack handling | Specialist Isolation | ⬚ |
| RR-01 | First run full scaffold | Re-Run Behavior | ⬚ |
| RR-02 | Second run detection | Re-Run Behavior | ⬚ |
| RR-03 | FORGE.md merge | Re-Run Behavior | ⬚ |
| RR-04 | decisions.md append-only | Re-Run Behavior | ⬚ |
| RR-05 | patterns.md merge | Re-Run Behavior | ⬚ |
| RR-06 | Custom agent preserved | Re-Run Behavior | ⬚ |
| RR-07 | Custom skill preserved | Re-Run Behavior | ⬚ |
| RR-08 | Deleted file re-created | Re-Run Behavior | ⬚ |
| RR-09 | Stack changed additive | Re-Run Behavior | ⬚ |
| RR-10 | Memory toggle preservation | Re-Run Behavior | ⬚ |
| ER-01 | Partial failure cleanup | Error Recovery | ⬚ |
| ER-02 | skill-writer blocks agent-writer | Error Recovery | ⬚ |
| ER-03 | Independent failure isolation | Error Recovery | ⬚ |
| ER-04 | Cancel recovery | Error Recovery | ⬚ |
| ER-05 | Read-only directory | Error Recovery | ⬚ |
| ER-06 | Disk full | Error Recovery | ⬚ |
| BX2-01 | No specialist terminology | Beginner Experience | ⬚ |
| BX2-02 | Validation clarity | Beginner Experience | ⬚ |
| BX2-03 | FORGE.md accuracy | Beginner Experience | ⬚ |
| BX2-04 | Quick Actions work | Beginner Experience | ⬚ |
| BX2-05 | Output readability | Beginner Experience | ⬚ |
| BX2-06 | No jargon leaks | Beginner Experience | ⬚ |
