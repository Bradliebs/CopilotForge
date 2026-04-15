"""
pr-visualization.py — CopilotForge Cookbook Recipe

Adapted from: https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk/nodejs/pr-visualization.md

WHAT THIS DOES:
    Interactive CLI tool that visualizes PR age distribution for a GitHub repo.
    Auto-detects the repo from git remote or accepts a --repo flag, fetches
    open PRs, buckets them by age, and renders a bar chart in the terminal.

WHEN TO USE THIS:
    When you want to understand your team's PR review cadence — quickly see
    how many PRs are fresh vs. stale, and ask follow-up questions interactively.

HOW TO RUN:
    1. pip install copilot-sdk
    2. Set your API key:
         bash/zsh:     export COPILOT_API_KEY="your-key-here"
         PowerShell:   $env:COPILOT_API_KEY="your-key-here"
         Windows cmd:  set COPILOT_API_KEY=your-key-here
    3. python cookbook/pr-visualization.py
       python cookbook/pr-visualization.py --repo owner/repo

PREREQUISITES:
    - Python 3.10+
    - A valid Copilot API key
    - git CLI available (for auto-detect)

EXPECTED OUTPUT:
    [Detect] Repository: owner/repo-name
    [Fetch] Found 14 open PRs
    [Chart] PR Age Distribution
      < 1 day   ████████ 4
      1-3 days  ██████████████ 7
      4-7 days  ████ 2
      > 7 days  ██ 1
    [Interactive] Ask a follow-up (or "quit"):

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join()
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import argparse
import math
import os
import re
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


# --- Types ---


@dataclass
class PullRequest:
    """Represents a single open pull request."""

    number: int
    title: str
    author: str
    created_at: datetime
    age_days: float


@dataclass
class AgeBucket:
    """A bucket that groups PRs by age range."""

    label: str
    min_days: float
    max_days: float
    prs: list[PullRequest] = field(default_factory=list)


# --- Mock SDK (replace with real import) ---
# TODO: Replace with: from copilot_sdk import CopilotClient


class CopilotSession:
    """Represents an interactive Copilot session."""

    def __init__(self, session_id: str) -> None:
        self.id = session_id

    def send(self, message: str) -> str:
        # TODO: Real SDK uses built-in GitHub MCP Server for PR data.
        return f'[Copilot] Analyzed your request: "{message[:60]}..."'

    def destroy(self) -> None:
        pass


class CopilotClient:
    """Minimal Copilot client."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def start(self) -> None:
        print("[Client] Starting...")

    def create_session(self) -> CopilotSession:
        return CopilotSession(f"sess_{int(time.time())}")

    def stop(self) -> None:
        print("[Client] Stopped.")


# --- Repo Detection ---


def detect_repo_from_git() -> Optional[str]:
    """Auto-detect owner/repo from the git remote origin URL."""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            check=True,
        )
        remote_url = result.stdout.strip()

        # SSH: git@github.com:owner/repo.git
        ssh_match = re.search(r"github\.com[:/](.+?/.+?)(?:\.git)?$", remote_url)
        if ssh_match:
            return ssh_match.group(1)

        # HTTPS: https://github.com/owner/repo.git
        https_match = re.search(r"github\.com/(.+?/.+?)(?:\.git)?$", remote_url)
        if https_match:
            return https_match.group(1)

    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    return None


def resolve_repo(args: argparse.Namespace) -> str:
    """Resolve the target repository from CLI args or git remote."""
    if args.repo:
        print(f"[Detect] Repository (from --repo): {args.repo}")
        return args.repo

    from_git = detect_repo_from_git()
    if from_git:
        print(f"[Detect] Repository (from git remote): {from_git}")
        return from_git

    raise RuntimeError(
        "Could not detect repository. Run from a git repo or pass --repo owner/name."
    )


# --- Mock PR Fetching ---
# TODO: Replace with actual GitHub API calls or let Copilot's built-in
#       GitHub MCP Server tools handle PR fetching automatically.


def fetch_open_prs(repo: str) -> list[PullRequest]:
    """Fetch open PRs for a repository (simulated data for demonstration)."""
    now = time.time()
    day = 86_400

    mock_prs = [
        {"number": 101, "title": "Add user authentication", "author": "alice", "days_ago": 0.3},
        {"number": 102, "title": "Fix pagination bug", "author": "bob", "days_ago": 0.8},
        {"number": 103, "title": "Update dependencies", "author": "alice", "days_ago": 1.2},
        {"number": 104, "title": "Refactor database layer", "author": "charlie", "days_ago": 1.5},
        {"number": 105, "title": "Add rate limiting", "author": "bob", "days_ago": 2.0},
        {"number": 106, "title": "New dashboard UI", "author": "diana", "days_ago": 2.8},
        {"number": 107, "title": "CI pipeline improvements", "author": "alice", "days_ago": 3.5},
        {"number": 108, "title": "API versioning support", "author": "charlie", "days_ago": 4.0},
        {"number": 109, "title": "Fix memory leak in worker", "author": "bob", "days_ago": 5.2},
        {"number": 110, "title": "Add search functionality", "author": "diana", "days_ago": 6.0},
        {"number": 111, "title": "Migrate to new ORM", "author": "alice", "days_ago": 8.0},
        {"number": 112, "title": "Legacy API deprecation", "author": "charlie", "days_ago": 12.0},
        {"number": 113, "title": "Logging overhaul", "author": "bob", "days_ago": 0.5},
        {"number": 114, "title": "Dark mode support", "author": "diana", "days_ago": 1.9},
    ]

    print(f"[Fetch] Found {len(mock_prs)} open PRs")

    return [
        PullRequest(
            number=pr["number"],
            title=pr["title"],
            author=pr["author"],
            created_at=datetime.fromtimestamp(now - pr["days_ago"] * day),
            age_days=pr["days_ago"],
        )
        for pr in mock_prs
    ]


# --- Chart Rendering ---

AGE_BUCKETS = [
    {"label": "< 1 day ", "min_days": 0, "max_days": 1},
    {"label": "1-3 days", "min_days": 1, "max_days": 3},
    {"label": "4-7 days", "min_days": 4, "max_days": 7},
    {"label": "> 7 days", "min_days": 7, "max_days": float("inf")},
]


def bucket_prs(prs: list[PullRequest]) -> list[AgeBucket]:
    """Sort PRs into age buckets."""
    buckets: list[AgeBucket] = []
    for b in AGE_BUCKETS:
        matching = [
            pr for pr in prs
            if pr.age_days >= b["min_days"] and pr.age_days < b["max_days"]
        ]
        buckets.append(AgeBucket(
            label=b["label"],
            min_days=b["min_days"],
            max_days=b["max_days"],
            prs=matching,
        ))
    return buckets


def render_bar_chart(buckets: list[AgeBucket]) -> None:
    """Render a horizontal bar chart in the terminal."""
    max_count = max((len(b.prs) for b in buckets), default=1)
    max_count = max(max_count, 1)
    max_bar_width = 40

    print("\n[Chart] PR Age Distribution")
    for bucket in buckets:
        count = len(bucket.prs)
        bar_length = round((count / max_count) * max_bar_width)
        bar = "█" * bar_length
        print(f"  {bucket.label}  {bar} {count}")
    print()


# --- Interactive Follow-up ---


def interactive_loop(session: CopilotSession, repo: str, prs: list[PullRequest]) -> None:
    """Run an interactive Q&A loop with Copilot about the PR data."""
    context_parts = [f"Repository: {repo}, {len(prs)} open PRs. Age breakdown:"]
    for b in AGE_BUCKETS:
        count = sum(
            1 for pr in prs
            if pr.age_days >= b["min_days"] and pr.age_days < b["max_days"]
        )
        context_parts.append(f"{b['label'].strip()}: {count}")
    context = " ".join(context_parts)

    print('[Interactive] Ask a follow-up (or "quit"):')

    while True:
        try:
            question = input("> ")
        except (EOFError, KeyboardInterrupt):
            break

        if not question or question.lower() == "quit":
            break

        try:
            response = session.send(f"{context}\n\nUser question: {question}")
            print(response)
        except Exception as e:
            print(f"[Error] {e}")


# --- Main ---


def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize PR age distribution")
    parser.add_argument("--repo", type=str, help="GitHub repo as owner/name")
    args = parser.parse_args()

    api_key = os.environ.get("COPILOT_API_KEY")
    if not api_key:
        raise RuntimeError("Missing COPILOT_API_KEY environment variable.")

    # 1. Detect or accept the target repository.
    repo = resolve_repo(args)

    # 2. Fetch open PRs.
    prs = fetch_open_prs(repo)

    # 3. Bucket by age and render chart.
    buckets = bucket_prs(prs)
    render_bar_chart(buckets)

    # 4. Start an interactive Copilot session for follow-up questions.
    # The real SDK uses built-in capabilities (GitHub MCP Server, code execution)
    # — no custom tools needed.
    client = CopilotClient(api_key=api_key)
    client.start()

    session = client.create_session()

    try:
        interactive_loop(session, repo, prs)
    except Exception as e:
        print(f"[Error] {e}")
    finally:
        session.destroy()
        client.stop()


if __name__ == "__main__":
    main()
