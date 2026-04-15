# CopilotForge Phase 1 — Test Strategy

> Owned by **Tank** (Tester). If it wasn't validated, it's a guess.

## What We're Testing

The **Planner skill** — a single SKILL.md that runs a 5-question wizard and
scaffolds a CopilotForge project structure. Phase 1 is the entry point for
everything else, so if it ships broken, nothing downstream works.

## Test Layers

### 1. Structural Validation (`validate-scaffold.sh` / `validate-scaffold.ps1`)

Automated scripts that verify a completed scaffold against the expected output.
Run these after every Planner run. They check:

| Check | What it catches |
|-------|----------------|
| Directory existence | Missing folders = broken imports, orphaned references |
| Required files exist | Planner forgot to generate something |
| FORGE.md sections | Beginner has no map of what was created |
| SKILL.md frontmatter | Invalid YAML = Copilot can't load the skill |
| Cookbook syntax | Generated code that doesn't parse = dead on arrival |
| Cross-reference consistency | FORGE.md says a file exists but it doesn't |

**Run:** `bash tests/validate-scaffold.sh <project-root>` or `.\tests\validate-scaffold.ps1 <project-root>`

### 2. Scenario Coverage (`test-scenarios.md`)

Documented test scenarios covering happy paths, edge cases, beginner experience,
and structural integrity. These are executed manually (wizard is conversational)
but written precisely enough that anyone can reproduce them.

### 3. Beginner QA Checklist (`beginner-checklist.md`)

Manual checklist written from a **beginner's perspective** — not "does the code
work" but "does a human who has never used Copilot understand what happened and
what to do next." This is the final gate before we call Phase 1 done.

## How to Run

### Prerequisites
- A completed Planner scaffold (run the Planner skill first)
- Bash (Linux/macOS/WSL) or PowerShell 5.1+ (Windows)

### Quick Start

```bash
# After running the Planner skill in your project:
bash tests/validate-scaffold.sh /path/to/scaffolded/project

# Windows:
.\tests\validate-scaffold.ps1 -ProjectRoot C:\path\to\scaffolded\project
```

### Interpreting Results

- **PASS**: Line printed in green, check passed
- **FAIL**: Line printed in red, check failed — read the message for what's wrong
- **Exit code 0**: All checks passed
- **Exit code 1**: One or more checks failed — scroll up for details

## Test Philosophy

1. **Test the output, not the generator.** We validate what the Planner produced,
   not how it produced it. If the files are wrong, the test fails regardless of
   whether the code "ran successfully."

2. **Every wizard path gets a scenario.** Full input, minimal input, skip
   everything, contradictory input — each is a documented scenario.

3. **Beginner-friendly is a testable claim.** If the FORGE.md doesn't explain
   things clearly, that's a bug. The beginner checklist is a first-class test
   artifact, not an afterthought.

4. **Real validation over mocked tests.** These scripts run against actual
   generated files. No mocks, no stubs, no "assume the output looks like this."

## Phase 2 — Delegation & Re-Run Testing

Phase 2 adds wizard delegation (4 specialist agents), re-run detection, and
merge logic. The test suite expands to cover all of this while ensuring Phase 1
tests still pass.

### What Phase 2 Tests Cover

| Area | What it catches |
|------|----------------|
| Wizard delegation flow | Planner doesn't delegate correctly, wrong execution order |
| Specialist isolation | Agent writes to wrong directory, overwrites another's files |
| Re-run behavior | User data destroyed, duplicated content, lost edits |
| Error recovery | Partial failure leaves corrupt state, dependency errors cascade wrong |
| Beginner experience | Internal jargon leaks, confusing output, broken Quick Actions |

### How to Run Phase 2 Validation

```bash
# After Phase 2 agents are created:
bash tests/phase2/validate-delegation.sh /path/to/project

# Windows:
.\tests\phase2\validate-delegation.ps1 -ProjectRoot C:\path\to\project
```

### Phase 2 File Index

| File | Purpose |
|------|---------|
| `phase2/test-scenarios.md` | 40 test scenarios across 5 categories |
| `phase2/validate-delegation.ps1` | PowerShell validation for Phase 2 delegation output |
| `phase2/validate-delegation.sh` | Bash version of the same validator |
| `phase2/rerun-scenarios.md` | Detailed re-run behavior matrix for every generated file |
| `phase2/beginner-checklist.md` | Phase 2 beginner QA checklist (extends Phase 1) |

### Running All Phases

Always run earlier phases first to catch regressions:

```bash
# Phase 1 (scaffold structure):
bash tests/validate-scaffold.sh /path/to/project

# Phase 2 (delegation correctness):
bash tests/phase2/validate-delegation.sh /path/to/project

# Phase 3 (cookbook layer):
bash tests/phase3/validate-cookbook.sh /path/to/project

# Phase 4 (memory & iteration):
bash tests/phase4/validate-memory.sh /path/to/project
```

## Phase 4 — Memory & Iteration Testing

Phase 4 adds cross-session memory: preferences, history, convention learning,
adaptive wizard flows, and memory summarization. The test suite validates all
memory files, read-back behavior, and beginner-friendliness.

### What Phase 4 Tests Cover

| Area | What it catches |
|------|----------------|
| Memory read-back | Missing/corrupt memory files, fallback behavior, large memory |
| Adaptive wizard | Skip logic, override handling, "start fresh" flow |
| Convention learning | Pattern confidence, conflicts, append-only safety |
| Cross-session compounding | History growth, summarization triggers, archive creation |
| Memory safety | No secrets in memory, corruption resilience, concurrent writes |
| FORGE.md memory surface | Memory markers, accurate counts, selective updates |
| Jargon leaks | No internal agent names in memory templates or recipes |
| Beginner experience | Welcome message clarity, preferences readability |

### How to Run Phase 4 Validation

```bash
# After Phase 4 files are created:
bash tests/phase4/validate-memory.sh /path/to/project

# Windows:
.\tests\phase4\validate-memory.ps1 -ProjectRoot C:\path\to\project
```

### Phase 4 File Index

| File | Purpose |
|------|---------|
| `phase4/test-scenarios.md` | 58 test scenarios across 8 categories |
| `phase4/validate-memory.ps1` | PowerShell validation for Phase 4 memory output |
| `phase4/validate-memory.sh` | Bash version of the same validator |
| `phase4/beginner-checklist.md` | Phase 4 beginner QA checklist |

## Documentation Validation

The docs suite validates CopilotForge's beginner-friendly documentation
(README.md, docs/GETTING-STARTED.md, docs/HOW-IT-WORKS.md) for structure,
jargon leaks, link integrity, and beginner-friendliness.

### What Doc Validation Covers

| Area | What it catches |
|------|----------------|
| File existence | Missing docs = broken onboarding |
| README structure | Missing Quick Start, FAQ, or key sections |
| Jargon leaks | Internal terms (specialist, FORGE-CONTEXT, etc.) in user-facing docs |
| Link integrity | Broken relative links between docs |
| Minimum content | Docs too short to be useful |
| Beginner signals | Missing direct-address language, trigger examples, wizard Q&A |

### How to Run Doc Validation

```bash
bash tests/docs/validate-docs.sh

# Windows:
.\tests\docs\validate-docs.ps1
```

### Doc Test File Index

| File | Purpose |
|------|---------|
| `docs/doc-quality-checklist.md` | Manual 30-item review checklist |
| `docs/validate-docs.ps1` | PowerShell doc validation (UTF-8 BOM) |
| `docs/validate-docs.sh` | Bash doc validation |

---

## File Index

| File | Purpose |
|------|---------|
| `README.md` | This file — test strategy overview |
| `validate-scaffold.sh` | Bash validation script (Phase 1) |
| `validate-scaffold.ps1` | PowerShell validation script (Phase 1) |
| `test-scenarios.md` | Phase 1 test scenarios (24 scenarios) |
| `beginner-checklist.md` | Phase 1 beginner QA checklist |
| `phase2/test-scenarios.md` | Phase 2 test scenarios (40 scenarios) |
| `phase2/validate-delegation.ps1` | Phase 2 PowerShell validation script |
| `phase2/validate-delegation.sh` | Phase 2 Bash validation script |
| `phase2/rerun-scenarios.md` | Re-run behavior matrix |
| `phase2/beginner-checklist.md` | Phase 2 beginner QA checklist |
| `phase3/test-scenarios.md` | Phase 3 test scenarios (106 checks) |
| `phase3/validate-cookbook.ps1` | Phase 3 PowerShell validation script |
| `phase3/validate-cookbook.sh` | Phase 3 Bash validation script |
| `phase3/beginner-checklist.md` | Phase 3 beginner QA checklist |
| `phase4/test-scenarios.md` | Phase 4 test scenarios (58 scenarios) |
| `phase4/validate-memory.ps1` | Phase 4 PowerShell validation script |
| `phase4/validate-memory.sh` | Phase 4 Bash validation script |
| `phase4/beginner-checklist.md` | Phase 4 beginner QA checklist |
| `docs/doc-quality-checklist.md` | Manual 30-item doc review checklist |
| `docs/validate-docs.ps1` | Documentation validation script (PowerShell) |
| `docs/validate-docs.sh` | Documentation validation script (Bash) |
