"""
command-center.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Builds a terminal-based project dashboard that shows everything at a glance.
    Reads your CopilotForge project files (plan, memory, skills, agents, recipes)
    and displays a unified status view. Inspired by command-center-lite.

WHEN TO USE THIS:
    When you want a quick overview of your project state without opening
    multiple files. Run it daily as your "morning briefing."

HOW TO RUN:
    python cookbook/command-center.py
    Or: npx copilotforge status (built-in version)

PREREQUISITES:
    - Python 3.10+
    - A CopilotForge-initialized project

EXPECTED OUTPUT:
    🔥 Project Dashboard — My API Project
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📋 Plan       5/12 tasks done
    🧠 Memory     3 decisions · 2 patterns
    🔧 Skills     planner · code-review · testing
    🤖 Agents     planner · reviewer · tester
    📊 Git        branch: main · 3 commits today
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
"""

from __future__ import annotations

import json
import os
import re
import subprocess
from datetime import date
from pathlib import Path
from typing import Protocol, runtime_checkable


# --- ANSI helpers ---

class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CYAN = "\033[36m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"


LINE = "━" * 48


# --- Widget protocol — extend the dashboard with your own sections ---

@runtime_checkable
class Widget(Protocol):
    name: str
    emoji: str

    def render(self) -> list[str]: ...


_widgets: list[Widget] = []


def register_widget(widget: Widget) -> None:
    _widgets.append(widget)


# --- Built-in scanners ---


def scan_plan() -> str:
    plan = Path("IMPLEMENTATION_PLAN.md")
    if not plan.exists():
        return f"{C.DIM}no plan found{C.RESET}"
    lines = plan.read_text(encoding="utf-8").splitlines()
    done = sum(1 for l in lines if re.match(r"^- \[x\]", l))
    failed = sum(1 for l in lines if re.match(r"^- \[!\]", l))
    total = sum(1 for l in lines if re.match(r"^- \[.\]", l))
    nexts = [m.group(1) for l in lines if (m := re.match(r"^- \[ \] (\S+)", l))]
    out = f"{C.GREEN}{done}/{total} tasks done{C.RESET}"
    if failed:
        out += f" · {C.YELLOW}{failed} failed{C.RESET}"
    if nexts:
        out += f" — Next: {C.CYAN}{nexts[0]}{C.RESET}"
    return out


def scan_memory() -> str:
    mem_dir = Path("forge-memory")
    if not mem_dir.is_dir():
        return f"{C.DIM}no memory{C.RESET}"
    counts: list[str] = []
    for md in sorted(mem_dir.glob("*.md")):
        text = md.read_text(encoding="utf-8")
        headings = sum(1 for l in text.splitlines() if re.match(r"^#{1,3} ", l))
        counts.append(f"{headings} {md.stem}")
    return " · ".join(counts) if counts else f"{C.DIM}empty{C.RESET}"


def scan_skills() -> str:
    skills_dir = Path(".github", "skills")
    if not skills_dir.is_dir():
        return f"{C.DIM}none{C.RESET}"
    skills = [d.name for d in sorted(skills_dir.iterdir())
              if d.is_dir() and (d / "SKILL.md").exists()]
    return " · ".join(skills) if skills else f"{C.DIM}none{C.RESET}"


def scan_agents() -> str:
    agents_dir = Path(".copilot", "agents")
    if not agents_dir.is_dir():
        return f"{C.DIM}none{C.RESET}"
    agents = [p.stem for p in sorted(agents_dir.glob("*.md"))]
    return " · ".join(agents) if agents else f"{C.DIM}none{C.RESET}"


def scan_git() -> str:
    try:
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        today = date.today().isoformat()
        log = subprocess.run(
            ["git", "log", "--oneline", f"--after={today}T00:00:00"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        commits = len(log.splitlines()) if log else 0
        last = subprocess.run(
            ["git", "log", "-1", "--format=%ar"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return f"branch: {C.CYAN}{branch}{C.RESET} · {commits} commits today · last: {last}"
    except (subprocess.CalledProcessError, FileNotFoundError):
        return f"{C.DIM}git not available{C.RESET}"


# --- Example custom widget — add your own data sources ---


class CalendarWidget:
    name = "Calendar"
    emoji = "📅"

    def render(self) -> list[str]:
        # TODO: Connect to WorkIQ MCP or any calendar API
        return ["No meetings today — focus time!"]


# Register custom widgets here (uncomment to enable):
# register_widget(CalendarWidget())


# --- Render dashboard ---


def render_dashboard() -> None:
    project_name = "My Project"
    pkg = Path("package.json")
    if pkg.exists():
        try:
            project_name = json.loads(pkg.read_text(encoding="utf-8")).get("name", project_name)
        except (json.JSONDecodeError, OSError):
            pass

    def pad(label: str) -> str:
        return label.ljust(10)

    print()
    print(f"{C.BOLD}🔥 Project Dashboard — {project_name}{C.RESET}")
    print(LINE)
    print(f"📋 {C.BOLD}{pad('Plan')}{C.RESET} {scan_plan()}")
    print(f"🧠 {C.BOLD}{pad('Memory')}{C.RESET} {scan_memory()}")
    print(f"🔧 {C.BOLD}{pad('Skills')}{C.RESET} {scan_skills()}")
    print(f"🤖 {C.BOLD}{pad('Agents')}{C.RESET} {scan_agents()}")
    print(f"📊 {C.BOLD}{pad('Git')}{C.RESET} {scan_git()}")

    for w in _widgets:
        lines = w.render()
        print(f"{w.emoji} {C.BOLD}{pad(w.name)}{C.RESET} {lines[0] if lines else ''}")
        for line in lines[1:]:
            print(f"   {'':10} {line}")

    print(LINE)
    print()


# --- Entry Point ---

if __name__ == "__main__":
    render_dashboard()
