# `copilotforge watch` — Autonomous Plan Executor

`copilotforge watch` runs as a persistent terminal process that autonomously works through your `IMPLEMENTATION_PLAN.md` — one task at a time — completely independently of VS Code Copilot Chat. This solves the chat-interruption problem: any message typed in Copilot Chat kills the current run, but `watch` is immune because it lives in a terminal process, not inside a chat turn.

## Quick Start

```bash
npx copilotforge watch
```

Open a terminal in your project root and run the command above. Leave it running — it will poll your plan every 10 seconds, execute the next pending task, mark it done or failed, and repeat until the board is clear.

## All Flags

| Flag | Default | Description |
|---|---|---|
| `--interval <N>` | `10` | Poll every N seconds |
| `--log-file <path>` | _(none)_ | Append log lines to a file in addition to stdout |
| `--health` | — | Print current watch status (PID, last poll, tasks done/failed) and exit |

### Examples

```bash
# Default — poll every 10 seconds
npx copilotforge watch

# Poll every 30 seconds
npx copilotforge watch --interval 30

# Log to file
npx copilotforge watch --log-file watch.log

# Check if watch is running
npx copilotforge watch --health
```

## How to Stop

Three ways to stop the watch process:

1. **Ctrl+C** in the terminal where `watch` is running
2. **Dashboard Pause button** — the dashboard writes `.copilotforge-stop` which causes a clean shutdown on the next tick
3. **Sentinel file** — create `.copilotforge-stop` in your project root:
   ```bash
   # Unix/macOS/Linux
   touch .copilotforge-stop
   
   # Windows PowerShell
   New-Item .copilotforge-stop
   ```
   The watch process detects this file, deletes it, logs `Sentinel file detected`, and exits 0.

## Dashboard Integration

When the CopilotForge dashboard is running (`npx copilotforge dashboard`), it reads `.forge-watch-state.json` on every `/api/status` poll and displays a **Watch** status badge:

- 🟢 **Watch running (PID {pid}) — N done, N failed** — watch is active
- ⚫ **Watch idle — last ran {timestamp}** — watch stopped but has run before
- ⚫ **Watch not started** — no state file found

The **Start Build** button in the dashboard launches `npx copilotforge watch` in a new terminal window (when `cookbook/task-loop.ts` exists).

The **Pause** button writes `.copilotforge-stop`, which triggers a clean shutdown on the next watch tick.

## State File

The watch process writes `.forge-watch-state.json` to the project root after each cycle:

```json
{
  "pid": 12345,
  "startedAt": "2025-01-09T10:00:00.000Z",
  "lastPollAt": "2025-01-09T10:01:30.000Z",
  "currentTask": null,
  "lastTaskId": "add-auth",
  "lastTaskStatus": "done",
  "totalDone": 4,
  "totalFailed": 0,
  "consecutiveFailures": 0,
  "interval": 10
}
```

This file is excluded from git via `.gitignore`.

## Error Escalation

Watch uses a 4-tier escalation when tasks fail consecutively:

| Consecutive Failures | Action |
|---|---|
| 1–2 | Log warning, continue |
| 3 | Log warning + pause 30 extra seconds before next attempt |
| 4+ | Write `.copilotforge-stop` (auto-halt), log CRITICAL |

## Troubleshooting

**Watch says "Already running" but nothing is happening**

The PID stored in `.forge-watch-state.json` belongs to a dead process. Delete the state file and restart:

```bash
Remove-Item .forge-watch-state.json   # PowerShell
# or
rm .forge-watch-state.json            # Unix
npx copilotforge watch
```

**Sentinel file issues — watch exits immediately after starting**

If `.copilotforge-stop` exists from a previous run, watch will exit immediately. Remove it:

```bash
Remove-Item .copilotforge-stop   # PowerShell
rm .copilotforge-stop            # Unix
```

**Retrying failed tasks**

Tasks marked `[!]` in `IMPLEMENTATION_PLAN.md` are skipped by watch. To retry, edit the plan and change `[!]` back to `[ ]`:

```markdown
- [ ] my-task — Task title   # was [!], now retryable
```

Watch will pick it up on the next poll cycle.

**Watch runs tasks but they always fail**

Check that `npx tsx cookbook/task-loop.ts --single-task <id>` works manually. The watch process delegates execution entirely to `task-loop.ts` — if that script has issues, fix them there.
