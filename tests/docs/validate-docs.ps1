#Requires -Version 5.1
<#
.SYNOPSIS
    Validates CopilotForge documentation for structure, jargon leaks, and beginner-friendliness.
.DESCRIPTION
    Automated checks for README.md, docs/GETTING-STARTED.md, and docs/HOW-IT-WORKS.md.
    Run from the repository root.
#>

param(
    [string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = 'Continue'

# ── Counters ─────────────────────────────────────────────────────────────────
$pass = 0
$fail = 0
$warn = 0

function Write-Pass { param([string]$msg) $script:pass++; Write-Host "  PASS  $msg" -ForegroundColor Green }
function Write-Fail { param([string]$msg) $script:fail++; Write-Host "  FAIL  $msg" -ForegroundColor Red }
function Write-Warn { param([string]$msg) $script:warn++; Write-Host "  WARN  $msg" -ForegroundColor Yellow }
function Write-Section { param([string]$msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# ── Helper: read file lines (returns empty array if missing) ────────────────
function Get-Lines {
    param([string]$Path)
    if (Test-Path $Path) {
        return @(Get-Content -Path $Path -Encoding UTF8)
    }
    return @()
}

# ── Helper: get raw content as single string ────────────────────────────────
function Get-Raw {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-Content -Path $Path -Encoding UTF8 -Raw)
    }
    return ""
}

# ── Helper: check if content has a markdown heading containing text ─────────
function Has-Section {
    param([string]$Content, [string]$Heading)
    return ($Content -match "(?mi)^#{1,3}\s+.*$([regex]::Escape($Heading))")
}

# ── Helper: strip code blocks from content for jargon scanning ──────────────
function Strip-CodeBlocks {
    param([string]$Content)
    # Remove fenced code blocks (``` ... ```)
    $stripped = $Content -replace '(?ms)```.*?```', ''
    # Remove inline code (`...`)
    $stripped = $stripped -replace '`[^`]+`', ''
    return $stripped
}

# ══════════════════════════════════════════════════════════════════════════════
Write-Host "CopilotForge Documentation Validator" -ForegroundColor White
Write-Host "Repo root: $RepoRoot" -ForegroundColor DarkGray
Write-Host ""

$readme   = Join-Path $RepoRoot "README.md"
$getting  = Join-Path $RepoRoot "docs\GETTING-STARTED.md"
$howitworks = Join-Path $RepoRoot "docs\HOW-IT-WORKS.md"

# ══════════════════════════════════════════════════════════════════════════════
# 1. FILE EXISTENCE
# ══════════════════════════════════════════════════════════════════════════════
Write-Section "1. File Existence"

if (Test-Path $readme)       { Write-Pass "README.md exists" }
else                          { Write-Fail "README.md missing at repo root" }

if (Test-Path $getting)      { Write-Pass "docs/GETTING-STARTED.md exists" }
else                          { Write-Fail "docs/GETTING-STARTED.md missing" }

if (Test-Path $howitworks)   { Write-Pass "docs/HOW-IT-WORKS.md exists" }
else                          { Write-Fail "docs/HOW-IT-WORKS.md missing" }

# ══════════════════════════════════════════════════════════════════════════════
# 2. README STRUCTURE
# ══════════════════════════════════════════════════════════════════════════════
Write-Section "2. README Structure"

$readmeRaw = Get-Raw $readme
if ($readmeRaw) {
    $sections = @("Quick Start", "What Gets Created", "FAQ", "Works Everywhere")
    foreach ($s in $sections) {
        if (Has-Section $readmeRaw $s) { Write-Pass "README has '$s' section" }
        else                            { Write-Fail "README missing '$s' section" }
    }
} else {
    Write-Fail "README.md is empty or missing - skipping structure checks"
}

# ══════════════════════════════════════════════════════════════════════════════
# 3. JARGON CHECK (across all 3 docs)
# ══════════════════════════════════════════════════════════════════════════════
Write-Section "3. Jargon Check"

$jargonTerms = @(
    @{ Term = "specialist";          Pattern = "\bspecialist\b" },
    @{ Term = "delegation protocol"; Pattern = "delegation\s+protocol" },
    @{ Term = "FORGE-CONTEXT";       Pattern = "FORGE-CONTEXT" },
    @{ Term = "skill-writer";        Pattern = "\bskill-writer\b" },
    @{ Term = "agent-writer";        Pattern = "\bagent-writer\b" },
    @{ Term = "memory-writer";       Pattern = "\bmemory-writer\b" },
    @{ Term = "cookbook-writer";      Pattern = "\bcookbook-writer\b" },
    @{ Term = "frontmatter";         Pattern = "\bfrontmatter\b" }
)

$docFiles = @(
    @{ Name = "README.md";              Path = $readme },
    @{ Name = "GETTING-STARTED.md";     Path = $getting },
    @{ Name = "HOW-IT-WORKS.md";        Path = $howitworks }
)

foreach ($doc in $docFiles) {
    $raw = Get-Raw $doc.Path
    if (-not $raw) {
        Write-Warn "$($doc.Name) not available for jargon check"
        continue
    }
    $stripped = Strip-CodeBlocks $raw
    $docClean = $true
    foreach ($j in $jargonTerms) {
        if ($stripped -match $j.Pattern) {
            Write-Fail "$($doc.Name) contains jargon: '$($j.Term)'"
            $docClean = $false
        }
    }
    if ($docClean) {
        Write-Pass "$($doc.Name) is jargon-free"
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# 4. LINK CHECK
# ══════════════════════════════════════════════════════════════════════════════
Write-Section "4. Link Check"

foreach ($doc in $docFiles) {
    $raw = Get-Raw $doc.Path
    if (-not $raw) {
        Write-Warn "$($doc.Name) not available for link check"
        continue
    }

    $docDir = Split-Path (Resolve-Path $doc.Path -ErrorAction SilentlyContinue) -Parent 2>$null
    if (-not $docDir) {
        # File doesn't exist yet, compute expected directory
        $docDir = Split-Path $doc.Path -Parent
    }

    # Find all markdown links [text](path) — exclude URLs, anchors-only, and images
    $links = [regex]::Matches($raw, '\[(?![!])([^\]]*)\]\((?!https?://)(?!#)([^)#]+?)(?:#[^)]*)?\)')
    $linkClean = $true
    foreach ($link in $links) {
        $target = $link.Groups[2].Value.Trim()
        # Skip mailto and template placeholders
        if ($target -match '^mailto:' -or $target -match '\{') { continue }

        # Resolve relative to the doc's directory
        $resolved = Join-Path $docDir $target
        if (-not (Test-Path $resolved)) {
            # Also try relative to repo root
            $resolvedFromRoot = Join-Path $RepoRoot $target
            if (-not (Test-Path $resolvedFromRoot)) {
                Write-Fail "$($doc.Name) has broken link: $target"
                $linkClean = $false
            }
        }
    }
    if ($linkClean) {
        Write-Pass "$($doc.Name) all relative links resolve"
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# 5. MINIMUM CONTENT
# ══════════════════════════════════════════════════════════════════════════════
Write-Section "5. Minimum Content"

$minimums = @(
    @{ Name = "README.md";          Path = $readme;      Min = 100 },
    @{ Name = "GETTING-STARTED.md"; Path = $getting;     Min = 150 },
    @{ Name = "HOW-IT-WORKS.md";    Path = $howitworks;  Min = 100 }
)

foreach ($m in $minimums) {
    $lines = Get-Lines $m.Path
    $count = $lines.Count
    if ($count -ge $m.Min) {
        Write-Pass "$($m.Name) has $count lines (minimum: $($m.Min))"
    } elseif ($count -gt 0) {
        Write-Fail "$($m.Name) has only $count lines (minimum: $($m.Min))"
    } else {
        Write-Fail "$($m.Name) is empty or missing (minimum: $($m.Min) lines)"
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# 6. BEGINNER FRIENDLINESS
# ══════════════════════════════════════════════════════════════════════════════
Write-Section "6. Beginner Friendliness"

# README addresses reader directly
if ($readmeRaw -match '\byou\b') {
    Write-Pass "README.md addresses the reader with 'you'"
} elseif ($readmeRaw) {
    Write-Fail "README.md does not address the reader with 'you'"
} else {
    Write-Fail "README.md not available for friendliness check"
}

# README contains trigger phrase examples
if ($readmeRaw -match '(?i)(trigger|phrase|say|ask|tell|type)' -and $readmeRaw -match '(?i)(scaffold|create|generate|build|set up)') {
    Write-Pass "README.md contains trigger/action language"
} elseif ($readmeRaw) {
    Write-Fail "README.md missing trigger phrase examples"
} else {
    Write-Fail "README.md not available for trigger phrase check"
}

# GETTING-STARTED has wizard Q&A examples
$gettingRaw = Get-Raw $getting
if ($gettingRaw -match '(?ms)(Q:|question|wizard|ask|prompt).*?(A:|answer|response|reply)') {
    Write-Pass "GETTING-STARTED.md contains wizard Q&A examples"
} elseif ($gettingRaw -match '(?i)(wizard|question|step\s+\d|prompt)') {
    Write-Pass "GETTING-STARTED.md contains wizard walkthrough content"
} elseif ($gettingRaw) {
    Write-Fail "GETTING-STARTED.md missing wizard Q&A examples"
} else {
    Write-Fail "GETTING-STARTED.md not available for Q&A check"
}

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "======================================" -ForegroundColor White
Write-Host "  PASS: $pass   FAIL: $fail   WARN: $warn" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
Write-Host "======================================" -ForegroundColor White

if ($fail -eq 0) {
    Write-Host "  All checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  $fail check(s) failed." -ForegroundColor Red
    exit 1
}