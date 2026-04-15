"""
ralph-loop.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Implements the autonomous dev loop pattern (Ralph Loop): read a plan
    from disk, pick the next pending task, implement it, validate the result,
    mark it done (with git commit) or failed, and repeat. State lives on
    disk — not in memory — so each iteration starts with fresh context.

WHEN TO USE THIS:
    When you want an agent to work through an implementation plan
    autonomously — picking tasks, writing code, validating, and committing
    without human intervention between steps.

HOW TO RUN:
    1. Create an IMPLEMENTATION_PLAN.md in your project root (see format below)
    2. python cookbook/ralph-loop.py

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

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import os
import re
import subprocess
from dataclasses import dataclass
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


def git_commit(message: str) -> None:
    """Stage all changes and commit."""
    try:
        subprocess.run(["git", "add", "-A"], capture_output=True, check=True)
        subprocess.run(
            ["git", "commit", "-m", message, "--allow-empty"],
            capture_output=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[Ralph] Git commit skipped (no changes or git not configured).")


# --- Ralph Loop ---


def ralph_loop(plan_path: Path, max_iterations: int = 10) -> None:
    """Main loop: pick task → implement → validate → commit → repeat."""
    if not plan_path.exists():
        print(f"[Ralph] Plan not found: {plan_path}")
        print("[Ralph] Create an IMPLEMENTATION_PLAN.md with tasks like:")
        print("  - [ ] task-id — Task title")
        return

    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        # Fresh read from disk on every iteration (key principle).
        tasks = parse_plan(plan_path)

        if iteration == 1:
            print(f"[Ralph] Loaded {len(tasks)} tasks from {plan_path}")

        pending = next((t for t in tasks if t.status == "pending"), None)
        if pending is None:
            done = sum(1 for t in tasks if t.status == "done")
            failed = sum(1 for t in tasks if t.status == "failed")
            print(f"[Ralph] 🏁 All tasks complete. {done} done, {failed} failed.")
            return

        print(f"[Ralph] === Iteration {iteration}/{max_iterations} ===")
        print(f'[Ralph] Picked task: {pending.id} — "{pending.title}"')

        # Implement
        implement_task(pending)

        # Validate
        passed = validate_task(pending)

        # Update status on disk
        fresh_tasks = parse_plan(plan_path)
        target = next((t for t in fresh_tasks if t.id == pending.id), None)
        if target:
            target.status = "done" if passed else "failed"
            write_plan(plan_path, fresh_tasks)

        if passed:
            print(f"[Ralph] ✅ Task {pending.id} passed — committing.")
            git_commit(f"feat: {pending.id} — {pending.title}")
        else:
            print(f"[Ralph] ❌ Task {pending.id} failed — logged.")

    print(f"[Ralph] ⚠️ Reached max iterations ({max_iterations}). Stopping.")


# --- Entry Point ---

if __name__ == "__main__":
    plan_file = Path("IMPLEMENTATION_PLAN.md")
    ralph_loop(plan_file)
