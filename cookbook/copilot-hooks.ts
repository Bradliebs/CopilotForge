/**
 * copilot-hooks.ts — CopilotForge Cookbook Recipe
 *
 * Adapted from: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks
 *
 * WHAT THIS DOES:
 *   Generates a complete Copilot CLI hooks setup — a hooks.json config plus
 *   companion scripts that run custom commands at key points during AI sessions
 *   (session start/end, prompt submitted, before/after tool use, on errors).
 *
 * WHEN TO USE THIS:
 *   When you want to add logging, safety checks, audit trails, or custom
 *   automation to your Copilot CLI or Copilot cloud agent sessions.
 *
 * HOW TO RUN:
 *   1. No npm install needed — uses only Node.js built-ins
 *   2. npx ts-node cookbook/copilot-hooks.ts
 *      Or with plain Node: node cookbook/copilot-hooks.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *
 * EXPECTED OUTPUT:
 *   [Hooks] Creating .github/hooks/ directory...
 *   [Hooks] Generated hooks.json with 6 hook types
 *   [Hooks] Created scripts/hooks/pre-tool-check.sh
 *   [Hooks] Created scripts/hooks/pre-tool-check.ps1
 *   [Hooks] Created scripts/hooks/log-prompt.sh
 *   [Hooks] Created scripts/hooks/log-prompt.ps1
 *   [Hooks] ✅ Done! Your hooks are ready.
 *   [Hooks] Commit .github/hooks/ to your default branch to activate.
 *
 * PLATFORM NOTES:
 *   - Windows: PowerShell hooks run natively; bash hooks need Git Bash or WSL
 *   - macOS/Linux: Bash hooks run natively; PowerShell hooks need pwsh installed
 *   - Both platforms: hooks.json supports both bash and powershell keys simultaneously
 */

import * as fs from "fs";
import * as path from "path";

// --- Types ---

interface HookCommand {
  type: "command";
  bash: string;
  powershell: string;
  cwd?: string;
  timeoutSec?: number;
  env?: Record<string, string>;
}

interface HooksConfig {
  version: number;
  hooks: {
    sessionStart: HookCommand[];
    sessionEnd: HookCommand[];
    userPromptSubmitted: HookCommand[];
    preToolUse: HookCommand[];
    postToolUse: HookCommand[];
    errorOccurred: HookCommand[];
  };
}

// --- Logging helper ---

function log(message: string): void {
  console.log(`[Hooks] ${message}`);
}

// --- Directory creation ---

function ensureDir(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    // EEXIST is fine — directory already exists
    if (error.code !== "EEXIST") {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

// --- File writer with logging ---

function writeFile(filePath: string, content: string): void {
  try {
    fs.writeFileSync(filePath, content, { encoding: "utf-8" });
    log(`Created ${filePath}`);
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    throw new Error(`Failed to write ${filePath}: ${error.message}`);
  }
}

// --- Build the hooks.json config ---

function buildHooksConfig(): HooksConfig {
  return {
    version: 1,
    hooks: {
      // Log when a session begins and make sure the logs directory exists
      sessionStart: [
        {
          type: "command",
          bash: [
            'mkdir -p logs',
            'echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Session started" >> logs/session.log',
          ].join(" && "),
          powershell: [
            'New-Item -ItemType Directory -Force -Path logs | Out-Null',
            'Add-Content -Path logs/session.log -Value "[$(Get-Date -Format o)] Session started"',
          ].join("; "),
          cwd: ".",
          timeoutSec: 10,
        },
      ],

      // Log session end with duration summary
      sessionEnd: [
        {
          type: "command",
          bash: 'echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Session ended" >> logs/session.log',
          powershell:
            'Add-Content -Path logs/session.log -Value "[$(Get-Date -Format o)] Session ended"',
          cwd: ".",
          timeoutSec: 10,
        },
      ],

      // Audit trail — log every prompt the user sends
      userPromptSubmitted: [
        {
          type: "command",
          bash: "./scripts/hooks/log-prompt.sh",
          powershell: "./scripts/hooks/log-prompt.ps1",
          cwd: ".",
          timeoutSec: 10,
          env: { LOG_LEVEL: "INFO" },
        },
      ],

      // Safety gate — block dangerous file operations before they run
      preToolUse: [
        {
          type: "command",
          bash: "./scripts/hooks/pre-tool-check.sh",
          powershell: "./scripts/hooks/pre-tool-check.ps1",
          cwd: ".",
          timeoutSec: 15,
        },
      ],

      // Record tool results and how long each tool took
      postToolUse: [
        {
          type: "command",
          bash: [
            'echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Tool completed: $COPILOT_TOOL_NAME (exit=$COPILOT_TOOL_EXIT_CODE)"',
            ">> logs/tool-usage.log",
          ].join(" "),
          powershell: [
            'Add-Content -Path logs/tool-usage.log',
            '-Value "[$(Get-Date -Format o)] Tool completed: $env:COPILOT_TOOL_NAME (exit=$env:COPILOT_TOOL_EXIT_CODE)"',
          ].join(" "),
          cwd: ".",
          timeoutSec: 10,
        },
      ],

      // Capture errors for monitoring — log locally and optionally alert
      errorOccurred: [
        {
          type: "command",
          bash: [
            'echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: $COPILOT_ERROR_MESSAGE"',
            ">> logs/errors.log",
          ].join(" "),
          powershell: [
            'Add-Content -Path logs/errors.log',
            '-Value "[$(Get-Date -Format o)] ERROR: $env:COPILOT_ERROR_MESSAGE"',
          ].join(" "),
          cwd: ".",
          timeoutSec: 10,
          // TODO: Add env vars for your monitoring webhook (e.g., Slack, PagerDuty)
          env: { ALERT_WEBHOOK: "" },
        },
      ],
    },
  };
}

// --- Companion script: pre-tool safety check (bash) ---

function buildPreToolCheckBash(): string {
  return `#!/usr/bin/env bash
# pre-tool-check.sh — Block dangerous file operations before the agent runs them.
#
# Copilot sets COPILOT_TOOL_NAME and COPILOT_TOOL_INPUT as environment variables
# before calling preToolUse hooks. A non-zero exit code tells the agent to skip
# the tool invocation.

set -euo pipefail

TOOL_NAME="\${COPILOT_TOOL_NAME:-}"
TOOL_INPUT="\${COPILOT_TOOL_INPUT:-}"

# Patterns that should never appear in file-operation arguments
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf /*"
  "del /s /q C:\\\\"
  "> /dev/sda"
  "mkfs."
  ":(){:|:&};:"
)

for pattern in "\${DANGEROUS_PATTERNS[@]}"; do
  if [[ "\$TOOL_INPUT" == *"\$pattern"* ]]; then
    echo "[pre-tool-check] BLOCKED: dangerous pattern detected — \\"\$pattern\\""
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] BLOCKED tool=\$TOOL_NAME pattern=\$pattern" >> logs/blocked-tools.log
    exit 1
  fi
done

# TODO: Add your own project-specific safety rules here
#   Example: block writes outside your project directory
#   Example: require approval for network-related tools

echo "[pre-tool-check] OK: \$TOOL_NAME passed safety check"
exit 0
`;
}

// --- Companion script: pre-tool safety check (PowerShell) ---

function buildPreToolCheckPowershell(): string {
  return `# pre-tool-check.ps1 — Block dangerous file operations before the agent runs them.
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
`;
}

// --- Companion script: prompt logger (bash) ---

function buildLogPromptBash(): string {
  return `#!/usr/bin/env bash
# log-prompt.sh — Log every user prompt for audit purposes.
#
# Copilot sets COPILOT_USER_PROMPT as an environment variable when the
# userPromptSubmitted hook fires.

set -euo pipefail

LOG_FILE="logs/prompts.log"
mkdir -p "$(dirname "$LOG_FILE")"

TIMESTAMP="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
PROMPT="\${COPILOT_USER_PROMPT:-<empty>}"
LEVEL="\${LOG_LEVEL:-INFO}"

echo "[\$TIMESTAMP] [\$LEVEL] \$PROMPT" >> "\$LOG_FILE"

# TODO: Forward to your audit system if required (e.g., curl to a logging API)
# TODO: Add prompt content filtering if you need to redact sensitive data
`;
}

// --- Companion script: prompt logger (PowerShell) ---

function buildLogPromptPowershell(): string {
  return `# log-prompt.ps1 — Log every user prompt for audit purposes.
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
`;
}

// --- Main generator ---

function generate(rootDir: string): void {
  const hooksDir = path.join(rootDir, ".github", "hooks");
  const scriptsDir = path.join(rootDir, "scripts", "hooks");

  // Create output directories
  log("Creating .github/hooks/ directory...");
  ensureDir(hooksDir);
  ensureDir(scriptsDir);
  ensureDir(path.join(rootDir, "logs"));

  // Write hooks.json
  const config = buildHooksConfig();
  const configPath = path.join(hooksDir, "hooks.json");
  writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
  log(`Generated hooks.json with ${Object.keys(config.hooks).length} hook types`);

  // Write companion scripts
  writeFile(path.join(scriptsDir, "pre-tool-check.sh"), buildPreToolCheckBash());
  writeFile(path.join(scriptsDir, "pre-tool-check.ps1"), buildPreToolCheckPowershell());
  writeFile(path.join(scriptsDir, "log-prompt.sh"), buildLogPromptBash());
  writeFile(path.join(scriptsDir, "log-prompt.ps1"), buildLogPromptPowershell());

  // Make bash scripts executable on Unix (no-op on Windows)
  try {
    fs.chmodSync(path.join(scriptsDir, "pre-tool-check.sh"), 0o755);
    fs.chmodSync(path.join(scriptsDir, "log-prompt.sh"), 0o755);
  } catch {
    // chmod may fail on Windows — that's expected
  }

  log("✅ Done! Your hooks are ready.");
  log("Commit .github/hooks/ to your default branch to activate.");
}

// --- CLI entry point ---

function main(): void {
  // Default to current working directory; override with --dir <path>
  let rootDir = process.cwd();

  const args = process.argv.slice(2);
  const dirIndex = args.indexOf("--dir");
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    rootDir = path.resolve(args[dirIndex + 1]);
  }

  try {
    generate(rootDir);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Hooks] ❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
