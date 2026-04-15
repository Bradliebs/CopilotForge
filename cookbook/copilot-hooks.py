"""
copilot-hooks.py — CopilotForge Cookbook Recipe

Adapted from: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks

WHAT THIS DOES:
    Generates a complete Copilot CLI hooks setup — a hooks.json config plus
    companion scripts that run custom commands at key points during AI sessions
    (session start/end, prompt submitted, before/after tool use, on errors).

WHEN TO USE THIS:
    When you want to add logging, safety checks, audit trails, or custom
    automation to your Copilot CLI or Copilot cloud agent sessions.

HOW TO RUN:
    1. No pip install needed — uses only Python standard library
    2. python cookbook/copilot-hooks.py

PREREQUISITES:
    - Python 3.10+

EXPECTED OUTPUT:
    [Hooks] Creating .github/hooks/ directory...
    [Hooks] Generated hooks.json with 6 hook types
    [Hooks] Created scripts/hooks/pre-tool-check.sh
    [Hooks] Created scripts/hooks/pre-tool-check.ps1
    [Hooks] Created scripts/hooks/log-prompt.sh
    [Hooks] Created scripts/hooks/log-prompt.ps1
    [Hooks] ✅ Done! Your hooks are ready.
    [Hooks] Commit .github/hooks/ to your default branch to activate.

PLATFORM NOTES:
    - Windows: PowerShell hooks run natively; bash hooks need Git Bash or WSL
    - macOS/Linux: Bash hooks run natively; PowerShell hooks need pwsh installed
    - Both platforms: hooks.json supports both bash and powershell keys simultaneously
"""

from __future__ import annotations

import json
import os
import stat
import sys
from pathlib import Path
from typing import Any


# --- Logging helper ---


def log(message: str) -> None:
    print(f"[Hooks] {message}")


# --- Build the hooks.json config ---


def build_hooks_config() -> dict[str, Any]:
    return {
        "version": 1,
        "hooks": {
            # Log when a session begins and make sure the logs directory exists
            "sessionStart": [
                {
                    "type": "command",
                    "bash": (
                        'mkdir -p logs'
                        ' && echo "[$(date -u +\\"%Y-%m-%dT%H:%M:%SZ\\")] Session started"'
                        " >> logs/session.log"
                    ),
                    "powershell": (
                        "New-Item -ItemType Directory -Force -Path logs | Out-Null; "
                        'Add-Content -Path logs/session.log'
                        ' -Value "[$(Get-Date -Format o)] Session started"'
                    ),
                    "cwd": ".",
                    "timeoutSec": 10,
                }
            ],
            # Log session end with duration summary
            "sessionEnd": [
                {
                    "type": "command",
                    "bash": (
                        'echo "[$(date -u +\\"%Y-%m-%dT%H:%M:%SZ\\")] Session ended"'
                        " >> logs/session.log"
                    ),
                    "powershell": (
                        'Add-Content -Path logs/session.log'
                        ' -Value "[$(Get-Date -Format o)] Session ended"'
                    ),
                    "cwd": ".",
                    "timeoutSec": 10,
                }
            ],
            # Audit trail — log every prompt the user sends
            "userPromptSubmitted": [
                {
                    "type": "command",
                    "bash": "./scripts/hooks/log-prompt.sh",
                    "powershell": "./scripts/hooks/log-prompt.ps1",
                    "cwd": ".",
                    "timeoutSec": 10,
                    "env": {"LOG_LEVEL": "INFO"},
                }
            ],
            # Safety gate — block dangerous file operations before they run
            "preToolUse": [
                {
                    "type": "command",
                    "bash": "./scripts/hooks/pre-tool-check.sh",
                    "powershell": "./scripts/hooks/pre-tool-check.ps1",
                    "cwd": ".",
                    "timeoutSec": 15,
                }
            ],
            # Record tool results and how long each tool took
            "postToolUse": [
                {
                    "type": "command",
                    "bash": (
                        'echo "[$(date -u +\\"%Y-%m-%dT%H:%M:%SZ\\")]'
                        " Tool completed: $COPILOT_TOOL_NAME"
                        ' (exit=$COPILOT_TOOL_EXIT_CODE)"'
                        " >> logs/tool-usage.log"
                    ),
                    "powershell": (
                        "Add-Content -Path logs/tool-usage.log"
                        ' -Value "[$(Get-Date -Format o)]'
                        " Tool completed: $env:COPILOT_TOOL_NAME"
                        ' (exit=$env:COPILOT_TOOL_EXIT_CODE)"'
                    ),
                    "cwd": ".",
                    "timeoutSec": 10,
                }
            ],
            # Capture errors for monitoring — log locally and optionally alert
            "errorOccurred": [
                {
                    "type": "command",
                    "bash": (
                        'echo "[$(date -u +\\"%Y-%m-%dT%H:%M:%SZ\\")]'
                        ' ERROR: $COPILOT_ERROR_MESSAGE"'
                        " >> logs/errors.log"
                    ),
                    "powershell": (
                        "Add-Content -Path logs/errors.log"
                        ' -Value "[$(Get-Date -Format o)]'
                        ' ERROR: $env:COPILOT_ERROR_MESSAGE"'
                    ),
                    "cwd": ".",
                    "timeoutSec": 10,
                    # TODO: Add env vars for your monitoring webhook (e.g., Slack, PagerDuty)
                    "env": {"ALERT_WEBHOOK": ""},
                }
            ],
        },
    }


# --- Companion script content ---


PRE_TOOL_CHECK_BASH = """\
#!/usr/bin/env bash
# pre-tool-check.sh — Block dangerous file operations before the agent runs them.
#
# Copilot sets COPILOT_TOOL_NAME and COPILOT_TOOL_INPUT as environment variables
# before calling preToolUse hooks. A non-zero exit code tells the agent to skip
# the tool invocation.

set -euo pipefail

TOOL_NAME="${COPILOT_TOOL_NAME:-}"
TOOL_INPUT="${COPILOT_TOOL_INPUT:-}"

# Patterns that should never appear in file-operation arguments
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf /*"
  "del /s /q C:\\\\"
  "> /dev/sda"
  "mkfs."
  ":(){:|:&};:"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if [[ "$TOOL_INPUT" == *"$pattern"* ]]; then
    echo "[pre-tool-check] BLOCKED: dangerous pattern detected — \\"$pattern\\""
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] BLOCKED tool=$TOOL_NAME pattern=$pattern" >> logs/blocked-tools.log
    exit 1
  fi
done

# TODO: Add your own project-specific safety rules here
#   Example: block writes outside your project directory
#   Example: require approval for network-related tools

echo "[pre-tool-check] OK: $TOOL_NAME passed safety check"
exit 0
"""


PRE_TOOL_CHECK_POWERSHELL = """\
# pre-tool-check.ps1 — Block dangerous file operations before the agent runs them.
#
# Copilot sets COPILOT_TOOL_NAME and COPILOT_TOOL_INPUT as environment variables
# before calling preToolUse hooks. A non-zero exit code tells the agent to skip
# the tool invocation.

$ErrorActionPreference = "Stop"

$ToolName = $env:COPILOT_TOOL_NAME
$ToolInput = $env:COPILOT_TOOL_INPUT

# Patterns that should never appear in file-operation arguments
$DangerousPatterns = @(
    "rm -rf /",
    "rm -rf /*",
    "del /s /q C:\\",
    "> /dev/sda",
    "mkfs.",
    ":(){:|:&};:"
)

foreach ($pattern in $DangerousPatterns) {
    if ($ToolInput -like "*$pattern*") {
        Write-Host "[pre-tool-check] BLOCKED: dangerous pattern detected — '$pattern'"
        $timestamp = Get-Date -Format "o"
        Add-Content -Path logs/blocked-tools.log -Value "[$timestamp] BLOCKED tool=$ToolName pattern=$pattern"
        exit 1
    }
}

# TODO: Add your own project-specific safety rules here
#   Example: block writes outside your project directory
#   Example: require approval for network-related tools

Write-Host "[pre-tool-check] OK: $ToolName passed safety check"
exit 0
"""


LOG_PROMPT_BASH = """\
#!/usr/bin/env bash
# log-prompt.sh — Log every user prompt for audit purposes.
#
# Copilot sets COPILOT_USER_PROMPT as an environment variable when the
# userPromptSubmitted hook fires.

set -euo pipefail

LOG_FILE="logs/prompts.log"
mkdir -p "$(dirname "$LOG_FILE")"

TIMESTAMP="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
PROMPT="${COPILOT_USER_PROMPT:-<empty>}"
LEVEL="${LOG_LEVEL:-INFO}"

echo "[$TIMESTAMP] [$LEVEL] $PROMPT" >> "$LOG_FILE"

# TODO: Forward to your audit system if required (e.g., curl to a logging API)
# TODO: Add prompt content filtering if you need to redact sensitive data
"""


LOG_PROMPT_POWERSHELL = """\
# log-prompt.ps1 — Log every user prompt for audit purposes.
#
# Copilot sets COPILOT_USER_PROMPT as an environment variable when the
# userPromptSubmitted hook fires.

$ErrorActionPreference = "Stop"

$LogFile = "logs/prompts.log"
$LogDir = Split-Path -Parent $LogFile
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}

$Timestamp = Get-Date -Format "o"
$Prompt = if ($env:COPILOT_USER_PROMPT) { $env:COPILOT_USER_PROMPT } else { "<empty>" }
$Level = if ($env:LOG_LEVEL) { $env:LOG_LEVEL } else { "INFO" }

Add-Content -Path $LogFile -Value "[$Timestamp] [$Level] $Prompt"

# TODO: Forward to your audit system if required (e.g., Invoke-RestMethod to a logging API)
# TODO: Add prompt content filtering if you need to redact sensitive data
"""


# --- File writer with logging ---


def write_file(file_path: Path, content: str) -> None:
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        log(f"Created {file_path}")
    except OSError as exc:
        raise RuntimeError(f"Failed to write {file_path}: {exc}") from exc


def make_executable(file_path: Path) -> None:
    """Add execute permission on Unix; no-op on Windows."""
    try:
        current = file_path.stat().st_mode
        file_path.chmod(current | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    except OSError:
        # chmod not supported on Windows — expected
        pass


# --- Main generator ---


def generate(root_dir: Path) -> None:
    hooks_dir = root_dir / ".github" / "hooks"
    scripts_dir = root_dir / "scripts" / "hooks"
    logs_dir = root_dir / "logs"

    # Create output directories
    log("Creating .github/hooks/ directory...")
    hooks_dir.mkdir(parents=True, exist_ok=True)
    scripts_dir.mkdir(parents=True, exist_ok=True)
    logs_dir.mkdir(parents=True, exist_ok=True)

    # Write hooks.json
    config = build_hooks_config()
    config_path = hooks_dir / "hooks.json"
    write_file(config_path, json.dumps(config, indent=2) + "\n")
    log(f"Generated hooks.json with {len(config['hooks'])} hook types")

    # Write companion scripts
    write_file(scripts_dir / "pre-tool-check.sh", PRE_TOOL_CHECK_BASH)
    write_file(scripts_dir / "pre-tool-check.ps1", PRE_TOOL_CHECK_POWERSHELL)
    write_file(scripts_dir / "log-prompt.sh", LOG_PROMPT_BASH)
    write_file(scripts_dir / "log-prompt.ps1", LOG_PROMPT_POWERSHELL)

    # Make bash scripts executable on Unix
    make_executable(scripts_dir / "pre-tool-check.sh")
    make_executable(scripts_dir / "log-prompt.sh")

    log("✅ Done! Your hooks are ready.")
    log("Commit .github/hooks/ to your default branch to activate.")


# --- CLI entry point ---


def main() -> None:
    root_dir = Path.cwd()

    # Simple --dir flag support
    args = sys.argv[1:]
    if "--dir" in args:
        idx = args.index("--dir")
        if idx + 1 < len(args):
            root_dir = Path(args[idx + 1]).resolve()

    try:
        generate(root_dir)
    except RuntimeError as exc:
        print(f"[Hooks] ❌ Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
