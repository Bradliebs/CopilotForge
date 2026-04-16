# CopilotForge — Jargon-Leak Regression Validator
# Owner: Tank (Tester)
# Run: pwsh tests/validate-jargon.ps1
# Exit 0 = clean, Exit 1 = violations found

[CmdletBinding()]
param(
    [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:PassCount = 0
$script:FailCount = 0

function Write-Pass { param([string]$Msg) Write-Host "  [PASS] $Msg" -ForegroundColor Green; $script:PassCount++ }
function Write-Fail { param([string]$Msg) Write-Host "  [FAIL] $Msg" -ForegroundColor Red;  $script:FailCount++ }

# ---------------------------------------------------------------------------
# FORBIDDEN WORDS — specialist names that must NEVER appear in user-facing files
# ---------------------------------------------------------------------------
$ForbiddenWords = @(
    "skill-writer",
    "agent-writer",
    "memory-writer",
    "cookbook-writer"
)

# ---------------------------------------------------------------------------
# USER-FACING SCAN TARGETS
# ---------------------------------------------------------------------------
$ScanTargets = @(
    (Join-Path $ProjectRoot "templates\agents"),       # agent templates shipped to users
    (Join-Path $ProjectRoot ".github\skills"),         # skill definitions shipped to users
    (Join-Path $ProjectRoot "cli\src\templates.js")   # strings written to user files by the CLI
)

# ---------------------------------------------------------------------------
# EXCLUSION PATTERNS — paths that are legitimately allowed to contain these words
# Matched against the full path (case-insensitive contains check)
# ---------------------------------------------------------------------------
$ExclusionPatterns = @(
    [regex]::new("\\templates\\internal\\", "IgnoreCase"),   # specialist templates live here
    [regex]::new("\\.copilot\\agents\\",    "IgnoreCase"),   # the specialists themselves
    [regex]::new("\\.squad\\",              "IgnoreCase"),   # internal coordination
    [regex]::new("\\docs\\internal\\",      "IgnoreCase"),   # internal docs
    [regex]::new("\\tests\\",              "IgnoreCase")     # scanner scripts reference words
)

function Should-Exclude {
    param([string]$FullPath)
    foreach ($pattern in $ExclusionPatterns) {
        if ($pattern.IsMatch($FullPath)) { return $true }
    }
    return $false
}

# ---------------------------------------------------------------------------
# SCAN
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "CopilotForge Jargon-Leak Regression Scan" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
Write-Host "Date:    $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""
Write-Host "Forbidden words: $($ForbiddenWords -join ', ')"
Write-Host ""

$violations = [System.Collections.Generic.List[string]]::new()

foreach ($target in $ScanTargets) {
    if (-not (Test-Path $target)) {
        Write-Host "  [SKIP] Not found: $target" -ForegroundColor DarkGray
        continue
    }

    if (Test-Path $target -PathType Leaf) {
        $files = @(Get-Item $target)
    } else {
        $files = @(Get-ChildItem $target -Recurse -File -ErrorAction SilentlyContinue)
    }

    foreach ($file in $files) {
        if (Should-Exclude $file.FullName) { continue }

        $relPath = $file.FullName.Substring($ProjectRoot.Length).TrimStart('\')
        $lines   = Get-Content $file.FullName -ErrorAction SilentlyContinue

        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            foreach ($word in $ForbiddenWords) {
                if ($line -imatch [regex]::Escape($word)) {
                    $msg = "Jargon '$word' in $relPath (line $($i + 1)): $($line.Trim())"
                    $violations.Add($msg)
                    Write-Fail $msg
                }
            }
        }
    }
}

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ("=" * 60)

if ($violations.Count -eq 0) {
    Write-Host "  RESULT: CLEAN — 0 jargon leaks detected" -ForegroundColor Green
    Write-Host ("=" * 60)
    exit 0
} else {
    Write-Host "  RESULT: $($violations.Count) jargon leak(s) detected — MUST FIX before ship" -ForegroundColor Red
    Write-Host ("=" * 60)
    exit 1
}