# CLAUDE.md — CopilotForge

Guidelines for AI assistants working on this codebase.

## Mission

CopilotForge is a beginner-first tool. Its primary user has never written a skill file
or configured an AI assistant before. Every decision should be evaluated against that person.

**The problem this project already solved once:** it was over-engineered. Don't reintroduce
complexity. If a change makes the repo bigger, slower to understand, or harder to explain in
one sentence, it is the wrong change.

## Before You Change Anything

State your assumptions explicitly. If a request has multiple valid interpretations, surface them
and ask — don't pick silently. If a simpler approach exists, say so.

## What to Change

Touch only what the request requires. Do not:
- Improve adjacent code, comments, or formatting that isn't broken
- Refactor things not related to the task
- Add error handling for scenarios that can't happen
- Add features, flags, or abstractions that weren't asked for

If your diff has lines that don't trace directly to the request, remove them.

## Simplicity Rule

If you write 200 lines and it could be 50, rewrite it before showing it. The right solution
is the one a beginner can read and understand without a guide.

## Key Architecture Facts

- **Default `init`** creates 3 files: planner SKILL.md, reference.md, START-HERE.md
- **`init --full`** creates 20+ files (memory system, agents, recipes, dashboard)
- **`cli/src/templates/`** is the single source of truth for all generated content
- **`cli/files/`** contains files copied verbatim by `init` (SKILL.md, reference.md)
- **Python recipes were intentionally removed** — keep TypeScript only in templates (Python dupes deleted from `templates/cookbook/` and `cli/src/templates/cookbook.js`)
- **9 Power Platform skill stubs were intentionally removed** — `power-platform-guide` covers all paths
- **Root `cookbook/` was intentionally deleted** — it was orphaned from the CLI
- **`forge-memory/` templates are pre-populated** — decisions.md starts with an initial entry; preferences.md includes BUILD_PATH=J
- **`init` writes usage tracking** — appends `{ path, mode, timestamp }` to `~/.copilotforge/usage.json` (local only, never transmitted)
- **`doctor` nudges stale memory** — warns if patterns.md still has placeholder text after 7+ days

## Tests

Run from `cli/`:
```bash
node --test tests/*.test.js
```

All 164 tests must pass before any change is complete. If a behaviour change breaks tests,
update the tests to match the new behaviour — don't revert the behaviour change.

## What Not to Do

- Do not re-add the 10 build paths to the beginner flow
- Do not add Python duplicates back to cookbook templates (they were removed from both `templates/cookbook/` and `cli/src/templates/cookbook.js`)
- Do not restore the root `cookbook/` directory
- Do not make `--full` the default
- Do not add new CLI commands without a clear beginner use case
