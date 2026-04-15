# CopilotForge Phase 1 — Test Scenarios

> Owned by **Tank** (Tester). Each scenario is specific enough to execute.
> Status: ⬚ = not tested, ✓ = passed, ✗ = failed

---

## Happy Path Scenarios

### HP-01: Full Wizard — All 6 Questions Answered

**Input:**
1. What are you building? → "A task management API with user authentication, team workspaces, and real-time notifications"
2. What's your stack? → "Node.js, Express, PostgreSQL, TypeScript"
3. Memory across sessions? → Yes
4. Test automation? → Yes
5. Skill level? → Intermediate

**Expected output:**
- `.copilot/agents/planner.md` — planner agent definition
- `.copilot/agents/reviewer.md` — reviewer agent definition
- `.copilot/agents/tester.md` — tester agent definition
- `.github/skills/planner/SKILL.md` — planner skill with valid frontmatter
- `.github/skills/planner/reference.md` — planner reference doc
- `forge-memory/decisions.md` — initialized with project decisions
- `forge-memory/patterns.md` — initialized (may be empty template)
- `FORGE.md` — complete with project summary, team roster, skills index
- `cookbook/` — at least one `.ts` recipe file

**Validation:**
- ⬚ Run `validate-scaffold.sh` — all checks pass
- ⬚ FORGE.md mentions the project description ("task management API")
- ⬚ Generated code references TypeScript/Node.js (matches stated stack)
- ⬚ Memory files are initialized (not empty)
- ⬚ Agent files reference the project context

**Status:** ⬚

---

### HP-02: Minimal Input — Just Project Description, All Defaults

**Input:**
1. What are you building? → "A blog"
2. What's your stack? → *(skip / no answer)*
3. Memory across sessions? → *(default: yes)*
4. Test automation? → *(default: yes)*
5. Skill level? → *(skip / no answer)*

**Expected output:**
- Same directory structure as HP-01
- FORGE.md should still be complete
- Stack should default to something reasonable (or be left generic)
- Skill level should default (beginner or intermediate)

**Validation:**
- ⬚ Run `validate-scaffold.sh` — all checks pass
- ⬚ FORGE.md doesn't contain blank/undefined values for skipped fields
- ⬚ Generated files are still functional despite minimal input
- ⬚ No error messages or broken references in output

**Status:** ⬚

---

### HP-03: Node.js Stack

**Input:**
1. What are you building? → "REST API for inventory management"
2. What's your stack? → "Node.js, Express, MongoDB"
3. Memory across sessions? → Yes
4. Test automation? → Yes
5. Skill level? → Beginner

**Expected output:**
- Cookbook recipes are `.ts` or `.js` files
- FORGE.md references Node.js ecosystem
- Agent definitions reference JavaScript/TypeScript tooling
- Beginner skill level → generated files have more comments/explanations

**Validation:**
- ⬚ Cookbook files have `.ts` or `.js` extension
- ⬚ No `.py` files generated (stack is Node.js)
- ⬚ FORGE.md "how to edit" instructions reference npm/node commands
- ⬚ Comments in generated code are frequent and explanatory (beginner mode)

**Status:** ⬚

---

### HP-04: Python Stack

**Input:**
1. What are you building? → "Machine learning pipeline for image classification"
2. What's your stack? → "Python, FastAPI, PyTorch"
3. Memory across sessions? → Yes
4. Test automation? → Yes
5. Skill level? → Advanced

**Expected output:**
- Cookbook recipes are `.py` files
- FORGE.md references Python ecosystem
- Advanced skill level → less hand-holding in comments

**Validation:**
- ⬚ Cookbook files have `.py` extension
- ⬚ No `.ts` or `.js` files generated (stack is Python)
- ⬚ FORGE.md "how to edit" instructions reference pip/python commands
- ⬚ Generated code is less commented than beginner mode (HP-03)

**Status:** ⬚

---

### HP-05: Mixed Stack

**Input:**
1. What are you building? → "Full-stack e-commerce platform"
2. What's your stack? → "React, TypeScript, Python, FastAPI"
3. Memory across sessions? → Yes
4. Test automation? → Yes
5. Skill level? → Intermediate

**Expected output:**
- Cookbook may contain both `.ts` and `.py` files
- FORGE.md acknowledges the mixed stack

**Validation:**
- ⬚ Scaffold completes without errors
- ⬚ FORGE.md references both frontend and backend stacks
- ⬚ Cookbook recipes match at least one of the stated languages

**Status:** ⬚

---

### HP-06: Different Skill Levels Produce Different Output

**Setup:** Run HP-03 (beginner) and HP-04 (advanced) and compare.

**Validation:**
- ⬚ Beginner FORGE.md has more explanation per section than advanced
- ⬚ Beginner cookbook recipes have more inline comments
- ⬚ Advanced output omits obvious explanations
- ⬚ Both are structurally valid (same sections, same files)

**Status:** ⬚

---

## Edge Cases

### EC-01: Empty Project Description

**Input:**
1. What are you building? → "" *(empty string)*
2–5: Defaults

**Expected behavior:**
- Planner should reject and re-prompt, OR
- Planner should produce a generic scaffold with a clear "you need to customize this" message

**Validation:**
- ⬚ Does not silently produce broken output
- ⬚ If scaffold is generated, FORGE.md acknowledges it's generic/placeholder
- ⬚ If re-prompted, the message is clear about what's needed

**Status:** ⬚

---

### EC-02: One-Word Project Description

**Input:**
1. What are you building? → "Calculator"
2–5: Defaults

**Expected behavior:**
- Planner should handle gracefully — a one-word description is valid

**Validation:**
- ⬚ Run `validate-scaffold.sh` — all checks pass
- ⬚ FORGE.md project summary makes sense for "Calculator"
- ⬚ No errors or undefined references

**Status:** ⬚

---

### EC-03: User Skips All Optional Questions

**Input:**
1. What are you building? → "A weather dashboard"
2. What's your stack? → *(skip)*
3. Memory across sessions? → *(skip)*
4. Test automation? → *(skip)*
5. Skill level? → *(skip)*

**Expected behavior:**
- Defaults apply: memory=yes, tests=yes
- Stack and skill level: reasonable defaults or generic output

**Validation:**
- ⬚ Run `validate-scaffold.sh` — all checks pass
- ⬚ FORGE.md has no blank/null values
- ⬚ forge-memory/ is created (default: yes)
- ⬚ Output is usable even with minimal input

**Status:** ⬚

---

### EC-04: Contradictory Stack Info

**Input:**
1. What are you building? → "Python data pipeline"
2. What's your stack? → "Python, Flask"
3–5: Defaults
*But in the project description, user mentions wanting TypeScript recipes*

**Expected behavior:**
- Planner should follow the explicit stack answer (Python), not infer from description
- OR Planner should ask for clarification

**Validation:**
- ⬚ Cookbook files match the stated stack (Python), not the description ambiguity
- ⬚ No `.ts` files generated when stack says Python
- ⬚ FORGE.md doesn't contain contradictory stack references

**Status:** ⬚

---

### EC-05: Re-Run on Existing CopilotForge Project

**Setup:**
1. Run the Planner once → scaffold is created
2. Run the Planner again on the same project

**Expected behavior:**
- Existing files should be preserved or merged, NOT silently overwritten
- OR the Planner should warn that files already exist and ask what to do

**Validation:**
- ⬚ forge-memory/decisions.md is not wiped (contains entries from first run)
- ⬚ Custom edits to FORGE.md survive the re-run OR user is warned
- ⬚ No duplicate entries in agent files
- ⬚ Planner communicates what it did differently on re-run

**Status:** ⬚

---

### EC-06: Very Long Project Description (1000+ Words)

**Input:**
1. What are you building? → *(paste 1000+ word project description)*
2–5: All answered normally

**Expected behavior:**
- Planner should handle long input without truncation or errors
- FORGE.md project summary should be a reasonable condensation, not the full 1000 words

**Validation:**
- ⬚ Scaffold completes without errors
- ⬚ FORGE.md project summary is concise (not a copy of the full input)
- ⬚ All files are structurally valid
- ⬚ No truncation artifacts in generated files

**Status:** ⬚

---

### EC-07: Special Characters in Project Description

**Input:**
1. What are you building? → "A C++ game engine (v2.0) with <template> support & multi-threading"
2–5: Defaults

**Expected behavior:**
- Special characters (++, <>, &) should not break markdown or YAML generation

**Validation:**
- ⬚ FORGE.md renders correctly (no broken markdown from special chars)
- ⬚ SKILL.md frontmatter YAML is valid (special chars are escaped)
- ⬚ Run `validate-scaffold.sh` — all checks pass

**Status:** ⬚

---

### EC-08: Non-English Project Description

**Input:**
1. What are you building? → "Un sistema de gestión de inventarios para restaurantes"
2–5: Defaults

**Expected behavior:**
- Planner should handle non-English input (Copilot supports multilingual)
- Output language should match input OR default to English — either is acceptable

**Validation:**
- ⬚ Scaffold completes without errors
- ⬚ FORGE.md is coherent (not garbled)
- ⬚ Structural validation passes

**Status:** ⬚

---

## Beginner Experience Tests

### BX-01: Can a Beginner Read FORGE.md and Understand What Happened?

**Method:** Give FORGE.md to someone who has never used Copilot. Ask them:
1. "What did this tool create?"
2. "Where are the files it made?"
3. "What should you do next?"

**Pass criteria:**
- ⬚ Person can answer all 3 questions from FORGE.md alone
- ⬚ No jargon that requires prior Copilot knowledge
- ⬚ File paths in FORGE.md are clickable/navigable

**Status:** ⬚

---

### BX-02: Are "How to Edit" Instructions Correct?

**Method:** Follow the FORGE.md instructions step by step.

**Validation:**
- ⬚ "How to add a new agent" instructions actually work
- ⬚ "How to add a new skill" instructions actually work
- ⬚ Referenced file paths exist
- ⬚ Referenced commands run without errors
- ⬚ No missing prerequisites (e.g., instructions assume npm but don't mention installing it)

**Status:** ⬚

---

### BX-03: Does the Validation Summary Make Sense to a Non-Developer?

**Method:** Run `validate-scaffold.sh` and show the output to a beginner.

**Pass criteria:**
- ⬚ PASS/FAIL is clear
- ⬚ Failure messages explain what's wrong, not just what check failed
- ⬚ No stack traces or technical errors in normal operation
- ⬚ Beginner can understand what to do if something fails

**Status:** ⬚

---

### BX-04: Are Error Messages Helpful?

**Method:** Deliberately break things and see what happens.

**Test actions:**
1. Delete FORGE.md → re-run validation → does the error say what to do?
2. Delete a required agent file → re-run → clear message?
3. Corrupt SKILL.md frontmatter → re-run → identifies the problem?

**Pass criteria:**
- ⬚ Error messages include the file path that has the problem
- ⬚ Error messages suggest a fix or next step
- ⬚ No raw exceptions or unhelpful "check failed" messages

**Status:** ⬚

---

### BX-05: First-Time User End-to-End

**Method:** Complete workflow from zero:
1. Clone a fresh repo
2. Add the Planner SKILL.md
3. Run the wizard
4. Read FORGE.md
5. Try to edit one generated file
6. Run validation

**Pass criteria:**
- ⬚ Total time from start to "I understand my project" < 10 minutes
- ⬚ No step requires Googling something not mentioned in the docs
- ⬚ User feels oriented, not overwhelmed

**Status:** ⬚

---

## Structural Validation

### SV-01: Generated Markdown Parses Correctly

**Method:** Parse all generated `.md` files through a markdown parser.

**Files to check:**
- FORGE.md
- All files in `.copilot/agents/*.md`
- All SKILL.md files
- forge-memory/decisions.md
- forge-memory/patterns.md

**Validation:**
- ⬚ No markdown parse errors
- ⬚ All headers are properly formed (# not ##without space)
- ⬚ All links use valid syntax
- ⬚ Code blocks have opening and closing fences

**Status:** ⬚

---

### SV-02: Generated Code Has Valid Syntax

**Method:** Run syntax checkers on cookbook files.

**Validation:**
- ⬚ `.ts` files: `tsc --noEmit` passes OR `node --check` on compiled JS
- ⬚ `.js` files: `node --check` passes
- ⬚ `.py` files: `python -c "import ast; ast.parse(...)"` passes
- ⬚ No files are empty (0 bytes)

**Status:** ⬚

---

### SV-03: File Paths Are Consistent

**Method:** Extract all file paths mentioned in FORGE.md. Verify each exists on disk.

**Validation:**
- ⬚ Every path in FORGE.md "files created" section exists
- ⬚ Every path in FORGE.md "skills index" section exists
- ⬚ No dangling references (mentioned but not created)
- ⬚ No orphaned files (created but not mentioned in FORGE.md)

**Status:** ⬚

---

### SV-04: SKILL.md Frontmatter Is Valid YAML

**Method:** Parse frontmatter from each SKILL.md through a YAML parser.

**Validation:**
- ⬚ Frontmatter delimited by `---` on first and closing lines
- ⬚ YAML parses without errors
- ⬚ Required fields present: `name`, `description`
- ⬚ No tabs used (YAML requires spaces)
- ⬚ Values are not empty/null

**Status:** ⬚

---

### SV-05: forge-memory Files Are Properly Initialized

**Method:** Check forge-memory/ files are usable.

**Validation:**
- ⬚ `decisions.md` has a header and at least one section
- ⬚ `patterns.md` has a header and at least one section
- ⬚ Files explain their own purpose (a beginner opening them should understand what goes here)
- ⬚ Files are not just empty templates with no guidance

**Status:** ⬚

---

## Test Execution Tracking

| ID | Name | Category | Status |
|----|------|----------|--------|
| HP-01 | Full wizard | Happy path | ⬚ |
| HP-02 | Minimal input | Happy path | ⬚ |
| HP-03 | Node.js stack | Happy path | ⬚ |
| HP-04 | Python stack | Happy path | ⬚ |
| HP-05 | Mixed stack | Happy path | ⬚ |
| HP-06 | Skill level comparison | Happy path | ⬚ |
| EC-01 | Empty description | Edge case | ⬚ |
| EC-02 | One-word description | Edge case | ⬚ |
| EC-03 | Skip all optional | Edge case | ⬚ |
| EC-04 | Contradictory stack | Edge case | ⬚ |
| EC-05 | Re-run existing project | Edge case | ⬚ |
| EC-06 | Very long description | Edge case | ⬚ |
| EC-07 | Special characters | Edge case | ⬚ |
| EC-08 | Non-English input | Edge case | ⬚ |
| BX-01 | Beginner reads FORGE.md | Beginner UX | ⬚ |
| BX-02 | How-to instructions correct | Beginner UX | ⬚ |
| BX-03 | Validation output clarity | Beginner UX | ⬚ |
| BX-04 | Error message quality | Beginner UX | ⬚ |
| BX-05 | End-to-end first-timer | Beginner UX | ⬚ |
| SV-01 | Markdown validity | Structural | ⬚ |
| SV-02 | Code syntax validity | Structural | ⬚ |
| SV-03 | Path consistency | Structural | ⬚ |
| SV-04 | YAML frontmatter validity | Structural | ⬚ |
| SV-05 | Memory file initialization | Structural | ⬚ |
