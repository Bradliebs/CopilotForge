"""
task-loop.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Implements the autonomous dev loop pattern (Ralph Loop): read a plan
    from disk, pick the next pending task, implement it, validate the result,
    mark it done (with git commit) or failed, and repeat. State lives on
    disk — not in memory — so each iteration starts with fresh context.

HARDENED FEATURES (Squad-inspired):
    - Safe git staging: stages only specific files, never `git add -A`
    - Graceful shutdown: check `.forge-stop` file or FORGE_STOP env var
    - 4-tier error escalation: retry → skip → pause → halt
    - Health summary: printed on exit and appended to forge-memory/decisions.md
    - Checkpoint persistence: `.forge-state.json` survives interruptions
    - Configurable max iterations via FORGE_MAX_ITERATIONS env var

WHEN TO USE THIS:
    When you want an agent to work through an implementation plan
    autonomously — picking tasks, writing code, validating, and committing
    without human intervention between steps.

HOW TO RUN:
    1. Create an IMPLEMENTATION_PLAN.md in your project root (see format below)
    2. python cookbook/task-loop.py

PREREQUISITES:
    - Python 3.10+
    - git initialized in the project
    - An IMPLEMENTATION_PLAN.md file (format shown in code)

EXPECTED OUTPUT:
    [Ralph] Loaded 3 tasks from IMPLEMENTATION_PLAN.md
    [Ralph] === Iteration 1/10 ===
    [Ralph] Picked task: add-utils — "Create utility helpers"
    [Ralph] Implementing: add-utils...
    [Ralph] Validating: add-utils...
    [Ralph] ✅ Task add-utils passed — committing.
    [Ralph] === Iteration 2/10 ===
    ...
    [Ralph] 🏁 All tasks complete. 3 done, 0 failed.
    [Ralph] ═══════════════════════════════════
    [Ralph] 📊 Health Summary
    [Ralph]   Done:    3
    [Ralph]   Failed:  0
    [Ralph]   Pending: 0
    [Ralph]   Time:    12.4s
    [Ralph]   Reason:  all tasks complete
    [Ralph] ═══════════════════════════════════

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


# --- Types ---


@dataclass
class Task:
    """A single task from the implementation plan."""

    id: str
    title: str
    status: str  # "pending", "done", or "failed"


# --- Plan Parser ---


def parse_plan(file_path: Path) -> list[Task]:
    """
    Parse IMPLEMENTATION_PLAN.md into a list of tasks.
    Expected format — one task per line:
        - [ ] task-id — Task title
        - [x] task-id — Task title        (done)
        - [!] task-id — Task title        (failed)
    """
    content = file_path.read_text(encoding="utf-8")
    tasks: list[Task] = []

    for line in content.splitlines():
        match = re.match(r"^- \[(.)\] (\S+)\s*—\s*(.+)$", line)
        if not match:
            continue

        marker, task_id, title = match.group(1), match.group(2), match.group(3).strip()
        status = "pending"
        if marker == "x":
            status = "done"
        elif marker == "!":
            status = "failed"

        tasks.append(Task(id=task_id, title=title, status=status))

    return tasks


def write_plan(file_path: Path, tasks: list[Task]) -> None:
    """Write the task list back to IMPLEMENTATION_PLAN.md."""
    lines = ["# Implementation Plan", ""]
    for task in tasks:
        marker = {"done": "x", "failed": "!", "pending": " "}.get(task.status, " ")
        lines.append(f"- [{marker}] {task.id} — {task.title}")
    file_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


# --- Implementation (simulated) ---


def implement_task(task: Task) -> None:
    """
    Simulate implementing a task — creates or modifies a file.
    TODO: Replace with actual Copilot SDK call to generate code.
    """
    out_dir = Path("src")
    out_dir.mkdir(parents=True, exist_ok=True)

    file_path = out_dir / f"{task.id}.py"
    content = f'# Auto-generated for task: {task.id}\n# {task.title}\n'
    file_path.write_text(content, encoding="utf-8")
    print(f"[Ralph] Implementing: {task.id}...")


# --- Validation (simulated) ---


def validate_task(task: Task) -> bool:
    """
    Simulate validation — run tests or a build check.
    TODO: Replace with actual validation (e.g., subprocess.run(["pytest"])).
    """
    print(f"[Ralph] Validating: {task.id}...")
    return True


# --- Git Helpers ---


def git_commit(message: str, files: list[str]) -> None:
    """Stage specific files and commit — NEVER git add -A."""
    try:
        for f in files:
            subprocess.run(["git", "add", f], capture_output=True, check=True)
        # Always stage the plan file
        subprocess.run(["git", "add", "IMPLEMENTATION_PLAN.md"], capture_output=True, check=True)

        # Safety check: verify staged file count
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True, text=True, check=True,
        )
        staged = result.stdout.strip()
        file_count = len(staged.splitlines()) if staged else 0
        if file_count > 20:
            print(f"[Ralph] ⚠️ WARNING: {file_count} files staged — this seems too many for one task. Aborting commit.")
            subprocess.run(["git", "reset", "HEAD"], capture_output=True, check=True)
            return
        if file_count > 10:
            print(f"[Ralph] ⚠️ Note: {file_count} files staged — more than usual for a single task.")

        subprocess.run(["git", "commit", "-m", message], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[Ralph] Git commit skipped (no changes or git not configured).")


# --- Graceful Shutdown ---


def should_stop() -> bool:
    """Check for stop signals before each iteration."""
    if Path(".forge-stop").exists():
        print("[Ralph] 🛑 Stop signal detected (.forge-stop file). Shutting down gracefully.")
        return True
    if os.environ.get("FORGE_STOP") in ("1", "true"):
        print("[Ralph] 🛑 Stop signal detected (FORGE_STOP env). Shutting down gracefully.")
        return True
    return False


# --- Checkpoint Persistence ---


def save_checkpoint(state: dict) -> None:
    """Save loop state to .forge-state.json."""
    Path(".forge-state.json").write_text(json.dumps(state, indent=2), encoding="utf-8")


def load_checkpoint() -> dict | None:
    """Load loop state from .forge-state.json if it exists."""
    path = Path(".forge-state.json")
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


# --- Health Summary ---


def write_health_summary(tasks: list[Task], start_time: float, reason: str) -> None:
    """Print and optionally persist a summary of the loop run."""
    elapsed = f"{time.time() - start_time:.1f}"
    done = sum(1 for t in tasks if t.status == "done")
    failed = sum(1 for t in tasks if t.status == "failed")
    pending = sum(1 for t in tasks if t.status == "pending")

    print()
    print("[Ralph] ═══════════════════════════════════")
    print("[Ralph] 📊 Health Summary")
    print(f"[Ralph]   Done:    {done}")
    print(f"[Ralph]   Failed:  {failed}")
    print(f"[Ralph]   Pending: {pending}")
    print(f"[Ralph]   Time:    {elapsed}s")
    print(f"[Ralph]   Reason:  {reason}")
    print("[Ralph] ═══════════════════════════════════")

    # Write to forge-memory/decisions.md if it exists
    decisions_path = Path("forge-memory") / "decisions.md"
    if decisions_path.exists():
        summary = (
            f"\n## Ralph Loop Run — {datetime.now(timezone.utc).isoformat()}\n"
            f"- Done: {done}, Failed: {failed}, Pending: {pending}\n"
            f"- Time: {elapsed}s\n"
            f"- Exit reason: {reason}\n"
        )
        with open(decisions_path, "a", encoding="utf-8") as f:
            f.write(summary)


# --- Ralph Loop ---


def ralph_loop(plan_path: Path, max_iterations: int = 10) -> None:
    """Main loop: pick task → implement → validate → commit → repeat."""
    if not plan_path.exists():
        print(f"[Ralph] Plan not found: {plan_path}")
        print("[Ralph] Create an IMPLEMENTATION_PLAN.md with tasks like:")
        print("  - [ ] task-id — Task title")
        return

    start_time = time.time()
    consecutive_failures = 0
    total_failures = 0

    # Resume from checkpoint if available
    checkpoint = load_checkpoint()
    iteration = checkpoint["iteration"] if checkpoint else 0
    if checkpoint:
        print(f"[Ralph] Resuming from checkpoint — iteration {checkpoint['iteration']}, last task: {checkpoint['lastTaskId']}")

    while iteration < max_iterations:
        iteration += 1

        # Graceful shutdown check
        if should_stop():
            tasks = parse_plan(plan_path)
            write_health_summary(tasks, start_time, "graceful shutdown requested")
            return

        # Fresh read from disk on every iteration (key principle).
        tasks = parse_plan(plan_path)

        if iteration == 1 or (checkpoint and iteration == checkpoint["iteration"] + 1):
            print(f"[Ralph] Loaded {len(tasks)} tasks from {plan_path}")

        pending = next((t for t in tasks if t.status == "pending"), None)
        if pending is None:
            done = sum(1 for t in tasks if t.status == "done")
            failed = sum(1 for t in tasks if t.status == "failed")
            print(f"[Ralph] 🏁 All tasks complete. {done} done, {failed} failed.")
            write_health_summary(tasks, start_time, "all tasks complete")
            return

        print(f"[Ralph] === Iteration {iteration}/{max_iterations} ===")
        print(f'[Ralph] Picked task: {pending.id} — "{pending.title}"')

        # Implement
        implement_task(pending)
        implemented_file = str(Path("src") / f"{pending.id}.py")

        # Validate
        passed = validate_task(pending)

        # Update status on disk
        fresh_tasks = parse_plan(plan_path)
        target = next((t for t in fresh_tasks if t.id == pending.id), None)
        if target:
            target.status = "done" if passed else "failed"
            write_plan(plan_path, fresh_tasks)

        if passed:
            consecutive_failures = 0
            print(f"[Ralph] ✅ Task {pending.id} passed — committing.")
            git_commit(f"feat: {pending.id} — {pending.title}", [implemented_file])
        else:
            consecutive_failures += 1
            total_failures += 1
            print(f"[Ralph] ❌ Task {pending.id} failed — marked as failed, continuing.")

            # Tier 3: Pause and warn after 3 consecutive failures
            if consecutive_failures >= 3:
                print("[Ralph] ⚠️ 3 consecutive failures — something may be wrong.")
                print("[Ralph] Pausing for 10 seconds. Create .forge-stop to halt.")
                time.sleep(10)

            # Tier 4: Halt after 5 total failures
            if total_failures >= 5:
                print("[Ralph] 🛑 5+ total failures — halting autonomous execution.")
                write_health_summary(fresh_tasks, start_time, "halted — too many failures")
                return

        # Save checkpoint after each iteration
        save_checkpoint({
            "iteration": iteration,
            "startedAt": datetime.fromtimestamp(start_time, tz=timezone.utc).isoformat(),
            "lastTaskId": pending.id,
            "totalDone": sum(1 for t in fresh_tasks if t.status == "done"),
            "totalFailed": sum(1 for t in fresh_tasks if t.status == "failed"),
        })

    tasks = parse_plan(plan_path)
    print(f"[Ralph] ⚠️ Reached max iterations ({max_iterations}). Stopping.")
    write_health_summary(tasks, start_time, f"max iterations reached ({max_iterations})")


# --- Entry Point ---

if __name__ == "__main__":
    plan_file = Path("IMPLEMENTATION_PLAN.md")
    max_iter = int(os.environ.get("FORGE_MAX_ITERATIONS", "10"))
    ralph_loop(plan_file, max_iter)
