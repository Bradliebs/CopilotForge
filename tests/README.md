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

## File Index

| File | Purpose |
|------|---------|
| `README.md` | This file — test strategy overview |
| `validate-scaffold.sh` | Bash validation script |
| `validate-scaffold.ps1` | PowerShell validation script |
| `test-scenarios.md` | Documented test scenarios |
| `beginner-checklist.md` | Manual QA checklist for beginner experience |
