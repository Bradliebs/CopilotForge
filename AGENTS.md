# CopilotForge — Agent Operational Guide

## Validation Commands

| Check | Command |
|-------|---------|
| Unit tests | `node --test cli/tests/*.test.js` |
| E2E / jargon | `node tests/e2e-validate.js` |
| Scaffold | `bash tests/validate-scaffold.sh` |
| Jargon (PS) | `pwsh tests/validate-jargon.ps1` |

## Commit Rules

- Targeted commits only — never `git add .` or `git add -A`
- One task per commit
- Message format: `[phase-13] task-N: short description`
- Never commit if any test is failing
- Always update IMPLEMENTATION_PLAN.md before committing

## Sacred Files — Never Modify

- `forge-memory/` — any contents (user data)
- Any `FORGE.md` in the project root (user-generated)
- `cli/files/` — copied verbatim into user repos; changes break existing scaffolds

## Jargon Leak Rule

These specialist names must NEVER appear in user-facing output:
  `skill-writer`  `agent-writer`  `memory-writer`  `cookbook-writer`

Forbidden paths (run e2e-validate.js after touching these):
  `templates/`  `cli/files/`  `cookbook/`

## Path Stamps (Phase 13)

All FORGE.md templates must include:
  `<!-- copilotforge: v1.6.0 -->`
  `<!-- copilotforge: path=[A-J] -->`

doctor.js reads these — missing stamps break path-aware checks.

## One Task Per Iteration

Build mode: one [ ] task → implement → test → commit → EXIT.
Do not chain tasks. The loop provides the fresh context.