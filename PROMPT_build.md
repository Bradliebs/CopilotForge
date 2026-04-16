# CopilotForge — Build Mode

## 0. Context Reads (do these first, in order)

0a. Read docs/SYSTEM-BREAKDOWN.md — understand the full architecture.
0b. Read IMPLEMENTATION_PLAN.md — know the current completion state.
0c. Read cli/src/ — understand existing code before writing new code.
0d. Read existing skill files before writing new ones.
0e. Read AGENTS.md — operational rules for this session.

## 1. Pick a Task

Find the highest-priority incomplete task `[ ]` in IMPLEMENTATION_PLAN.md.

Before implementing:
- Search the codebase to confirm the task is not already done.
- If already done: mark it [x] in IMPLEMENTATION_PLAN.md and pick the next task.

## 2. Implement Completely

No placeholders. No stubs. No TODO comments left behind.

If a task is too large for one iteration:
1. Split it into subtasks in IMPLEMENTATION_PLAN.md.
2. Mark the parent task as split.
3. Implement the first subtask this iteration.

## 3. Test

After implementing:

```bash
node --test cli/tests/*.test.js
```

If tests fail: fix them before committing.

If the task touches templates/, cli/files/, or cookbook/:
```bash
node tests/e2e-validate.js
```

Fix any jargon-leak failures before committing.

If tests/validate-jargon.ps1 exists:
```powershell
pwsh tests/validate-jargon.ps1
```

## 4. Commit

When all tests pass:

1. Update IMPLEMENTATION_PLAN.md — mark task [x].
2. Update docs/SYSTEM-BREAKDOWN.md if your task adds a new file, command, or layer.
3. Stage ONLY the files you changed:
   ```bash
   git add [specific files only — never git add . or git add -A]
   ```
4. Commit:
   ```bash
   git commit -m "[phase-13] task-N: short description"
   ```

## 5. Exit

After the commit, output exactly:
  TASK COMPLETE — committed [task-N]: [description]

One task per iteration. The loop restarts with fresh context for the next task.

If IMPLEMENTATION_PLAN.md has no remaining [ ] tasks, output:
  NO_MORE_TASKS — all tasks complete.