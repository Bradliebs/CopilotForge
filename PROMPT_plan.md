# CopilotForge — Planning Mode

## 0. Ground Truth Reads (do these first, in order)

0a. Read docs/SYSTEM-BREAKDOWN.md — understand the full 7-layer architecture.
0b. Read .squad/decisions.md — understand all architectural decisions.
0c. Read IMPLEMENTATION_PLAN.md if present — understand current completion state.
0d. Read cli/src/ directory — scan all source files to understand what exists.
0e. Read .github/skills/ directory — scan all skill files to understand what exists.

## 1. Gap Analysis

Compare docs/SYSTEM-BREAKDOWN.md against actual files on disk.
For each layer (CLI, Skills, Agents, Cookbook, Memory, FORGE.md, Squad tooling):
- What does SYSTEM-BREAKDOWN.md say should exist?
- Does it actually exist on disk?
- Is it complete, or is it a stub/placeholder?

**Do NOT implement anything in planning mode.**
**Do NOT assume something is missing — check the files first.**

## 2. Write the Plan

Create or update IMPLEMENTATION_PLAN.md as a prioritised task list.

Format:
- Group tasks by layer: CLI, Skills, Agents, Cookbook, Memory, FORGE.md, Squad tooling
- Mark already-complete tasks [x]
- Mark pending tasks [ ]
- One task per line: `[ ] task-N: short description`
- Include a brief "What this does" note for each [ ] task

Priority ordering:
1. Jargon leak fixes (specialist names in user-facing output) — always first
2. Missing CLI commands or broken exports
3. Missing skill files referenced by existing skills
4. Missing agent templates referenced by specialists
5. Incomplete cookbook recipes
6. Documentation gaps

## 3. Jargon Leak Flag

At the top of IMPLEMENTATION_PLAN.md, add a section:

```
## ⚠️ Jargon Leak Risks
```

List any files that contain specialist names in user-facing output paths:
  templates/, cli/files/, cookbook/

These become priority task-1, task-2, etc. in the plan.

## 4. Exit Signal

After writing IMPLEMENTATION_PLAN.md, output exactly:
  PLANNING COMPLETE — review IMPLEMENTATION_PLAN.md before running build mode.

Do not implement. Do not commit. Do not modify any source files.