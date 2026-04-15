<#
.SYNOPSIS
    CopilotForge Phase 4 — Memory Validation Script (PowerShell)
    Owner: Tank (Tester)

.DESCRIPTION
    Validates Phase 4 memory output: new file existence, SKILL.md memory check,
    memory-writer read protocol, planner memory read phase, FORGE.md memory markers,
    recipe quality, template placeholders, README completeness, jargon check,
    and spec completeness.
    Exit code 0 = all checks pass, 1 = one or more failures.

.PARAMETER ProjectRoot
    Path to the CopilotForge project directory (the framework repo itself).

.EXAMPLE
    .\tests\phase4\validate-memory.ps1 -ProjectRoot "C:\AI Projects\Oracle_Prime"
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ProjectRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Counters ---
$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0

function Write-Pass {
    param([string]$Message)
    Write-Host "  ✓ PASS" -ForegroundColor Green -NoNewline
    Write-Host ": $Message"
    $script:PassCount++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  ✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host ": $Message"
    $script:FailCount++
}

function Write-Warn {
    param([string]$Message)
    Write-Host "  ⚠ WARN" -ForegroundColor Yellow -NoNewline
    Write-Host ": $Message"
    $script:WarnCount++
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "── $Title ──" -ForegroundColor White
}

# --- Validate ProjectRoot ---
if (-not (Test-Path $ProjectRoot -PathType Container)) {
    Write-Host "Error: '$ProjectRoot' is not a directory" -ForegroundColor Red
    exit 1
}

$ProjectRoot = (Resolve-Path $ProjectRoot).Path

Write-Host ""
Write-Host "CopilotForge Phase 4 — Memory Validation" -ForegroundColor White
Write-Host "Project: $ProjectRoot"
Write-Host "Date:    $(Get-Date)"
Write-Host ""

# ============================================================================
# 1. NEW FILE EXISTENCE
# ============================================================================
Write-Section "1. File Existence — Phase 4 New Files (10 files)"

$newFiles = @(
    "templates\forge-memory\preferences.md",
    "templates\forge-memory\history.md",
    "templates\utils\memory-reader.md",
    "templates\utils\memory-summarizer.md",
    "templates\utils\convention-extractor.md",
    "cookbook\memory-reader.ts",
    "cookbook\memory-reader.py",
    "templates\cookbook\memory-reader.ts",
    "templates\cookbook\memory-reader.py",
    "docs\phase4-architecture.md"
)

foreach ($relPath in $newFiles) {
    $filePath = Join-Path $ProjectRoot $relPath
    if (Test-Path $filePath -PathType Leaf) {
        Write-Pass "File exists: $relPath"
    } else {
        Write-Fail "File missing: $relPath"
    }
}

# ============================================================================
# 2. SKILL.MD MEMORY CHECK
# ============================================================================
Write-Section "2. SKILL.md — Memory Check (Step 0 / Adaptive Wizard)"

$skillPath = Join-Path $ProjectRoot ".github\skills\planner\SKILL.md"

if (-not (Test-Path $skillPath -PathType Leaf)) {
    Write-Fail "SKILL.md does not exist at .github\skills\planner\SKILL.md"
} else {
    $skillContent = Get-Content $skillPath -Raw

    # Step 0 or Memory Check section
    if ($skillContent -match 'Step\s*0|Memory\s*Check') {
        Write-Pass "SKILL.md has Step 0 or Memory Check section"
    } else {
        Write-Fail "SKILL.md missing Step 0 / Memory Check section"
    }

    # Welcome back / returning user flow
    if ($skillContent -imatch 'Welcome\s+back|returning\s+user') {
        Write-Pass "SKILL.md has returning user flow (Welcome back)"
    } else {
        Write-Fail "SKILL.md missing returning user flow (no 'Welcome back' or 'returning user')"
    }

    # Adaptive wizard logic (skip/pre-populate)
    if ($skillContent -imatch 'skip|pre-?populate|adaptive') {
        Write-Pass "SKILL.md has adaptive wizard logic (skip/pre-populate)"
    } else {
        Write-Fail "SKILL.md missing adaptive wizard logic (no skip/pre-populate/adaptive)"
    }
}

# ============================================================================
# 3. MEMORY-WRITER READ PROTOCOL
# ============================================================================
Write-Section "3. Memory-Writer — Read Protocol"

$mwPath = Join-Path $ProjectRoot ".copilot\agents\memory-writer.md"

if (-not (Test-Path $mwPath -PathType Leaf)) {
    Write-Fail "memory-writer.md does not exist at .copilot\agents\memory-writer.md"
} else {
    $mwContent = Get-Content $mwPath -Raw

    # Read or Read Protocol mention
    if ($mwContent -imatch '\bread\b.*protocol|read-write\s+cycle|\bread\s+phase\b|\bread\s+existing\b') {
        Write-Pass "memory-writer.md mentions read protocol / read-write cycle"
    } else {
        Write-Fail "memory-writer.md missing read protocol reference"
    }

    # References preferences.md
    if ($mwContent -imatch 'preferences\.md') {
        Write-Pass "memory-writer.md references preferences.md"
    } else {
        Write-Fail "memory-writer.md does not reference preferences.md"
    }

    # References history.md
    if ($mwContent -imatch 'history\.md') {
        Write-Pass "memory-writer.md references history.md"
    } else {
        Write-Fail "memory-writer.md does not reference history.md"
    }
}

# ============================================================================
# 4. PLANNER MEMORY READ PHASE
# ============================================================================
Write-Section "4. Planner — Memory Read Phase"

$plannerPath = Join-Path $ProjectRoot ".copilot\agents\planner.md"

if (-not (Test-Path $plannerPath -PathType Leaf)) {
    Write-Fail "planner.md does not exist at .copilot\agents\planner.md"
} else {
    $plannerContent = Get-Content $plannerPath -Raw

    # Memory Read or memory-reader mention
    if ($plannerContent -imatch 'Memory\s+Read|memory-reader') {
        Write-Pass "planner.md mentions Memory Read phase or memory-reader"
    } else {
        Write-Fail "planner.md missing Memory Read phase / memory-reader reference"
    }

    # FORGE-CONTEXT includes conventions/preferences
    if ($plannerContent -imatch 'conventions|preferences') {
        Write-Pass "planner.md FORGE-CONTEXT references conventions or preferences"
    } else {
        Write-Fail "planner.md FORGE-CONTEXT missing conventions/preferences fields"
    }
}

# ============================================================================
# 5. FORGE.MD MEMORY MARKERS
# ============================================================================
Write-Section "5. FORGE.md — Memory Markers"

$forgePath = Join-Path $ProjectRoot "templates\FORGE.md"

if (-not (Test-Path $forgePath -PathType Leaf)) {
    Write-Fail "templates\FORGE.md does not exist"
} else {
    $forgeContent = Get-Content $forgePath -Raw

    # forge:memory-start marker
    if ($forgeContent -match 'forge:memory-start') {
        Write-Pass "FORGE.md has <!-- forge:memory-start --> marker"
    } else {
        Write-Fail "FORGE.md missing <!-- forge:memory-start --> marker"
    }

    # forge:memory-end marker
    if ($forgeContent -match 'forge:memory-end') {
        Write-Pass "FORGE.md has <!-- forge:memory-end --> marker"
    } else {
        Write-Fail "FORGE.md missing <!-- forge:memory-end --> marker"
    }

    # Memory Status section between markers
    if ($forgeContent -imatch 'Memory\s+Status') {
        Write-Pass "FORGE.md has Memory Status section"
    } else {
        Write-Fail "FORGE.md missing Memory Status section heading"
    }
}

# ============================================================================
# 6. RECIPE QUALITY — memory-reader.ts and .py
# ============================================================================
Write-Section "6. Recipe Quality — memory-reader (Header, Imports, Error Handling, TODO)"

$headerSections = @("WHAT THIS DOES", "WHEN TO USE THIS", "HOW TO RUN", "PREREQUISITES")

# --- TypeScript recipe ---
$tsPath = Join-Path $ProjectRoot "cookbook\memory-reader.ts"
if (Test-Path $tsPath -PathType Leaf) {
    $tsContent = Get-Content $tsPath -Raw

    # Header comment (4 sections)
    $tsMissing = @()
    foreach ($hs in $headerSections) {
        if ($tsContent -notmatch [regex]::Escape($hs)) {
            $tsMissing += $hs
        }
    }
    if ($tsMissing.Count -eq 0) {
        Write-Pass "Header complete (4/4 sections): cookbook\memory-reader.ts"
    } else {
        Write-Fail "Header missing $($tsMissing.Count) section(s) in cookbook\memory-reader.ts: $($tsMissing -join ', ')"
    }

    # Imports
    if ($tsContent -match '(?m)^\s*import\s') {
        Write-Pass "Has import statements: cookbook\memory-reader.ts"
    } else {
        Write-Fail "No import statements found: cookbook\memory-reader.ts"
    }

    # Error handling
    if ($tsContent -match '\bcatch\b|\bthrow\b') {
        Write-Pass "Has error handling (catch/throw): cookbook\memory-reader.ts"
    } else {
        Write-Fail "No error handling (missing catch/throw): cookbook\memory-reader.ts"
    }

    # TODO markers
    if ($tsContent -match 'TODO') {
        Write-Pass "Has TODO marker: cookbook\memory-reader.ts"
    } else {
        Write-Fail "No TODO marker found: cookbook\memory-reader.ts"
    }
} else {
    Write-Warn "Skipping recipe quality checks — cookbook\memory-reader.ts does not exist"
}

# --- Python recipe ---
$pyPath = Join-Path $ProjectRoot "cookbook\memory-reader.py"
if (Test-Path $pyPath -PathType Leaf) {
    $pyContent = Get-Content $pyPath -Raw

    # Header comment (4 sections)
    $pyMissing = @()
    foreach ($hs in $headerSections) {
        if ($pyContent -notmatch [regex]::Escape($hs)) {
            $pyMissing += $hs
        }
    }
    if ($pyMissing.Count -eq 0) {
        Write-Pass "Header complete (4/4 sections): cookbook\memory-reader.py"
    } else {
        Write-Fail "Header missing $($pyMissing.Count) section(s) in cookbook\memory-reader.py: $($pyMissing -join ', ')"
    }

    # Imports
    if ($pyContent -match '(?m)^\s*(import|from)\s') {
        Write-Pass "Has import statements: cookbook\memory-reader.py"
    } else {
        Write-Fail "No import statements found: cookbook\memory-reader.py"
    }

    # Error handling
    if ($pyContent -match '\bexcept\b|\braise\b') {
        Write-Pass "Has error handling (except/raise): cookbook\memory-reader.py"
    } else {
        Write-Fail "No error handling (missing except/raise): cookbook\memory-reader.py"
    }

    # TODO markers
    if ($pyContent -match 'TODO') {
        Write-Pass "Has TODO marker: cookbook\memory-reader.py"
    } else {
        Write-Fail "No TODO marker found: cookbook\memory-reader.py"
    }
} else {
    Write-Warn "Skipping recipe quality checks — cookbook\memory-reader.py does not exist"
}

# ============================================================================
# 7. TEMPLATE PLACEHOLDERS
# ============================================================================
Write-Section "7. Template Placeholder Syntax ({{placeholder}})"

$placeholderFiles = @(
    "templates\cookbook\memory-reader.ts",
    "templates\cookbook\memory-reader.py",
    "templates\forge-memory\preferences.md",
    "templates\forge-memory\history.md"
)

foreach ($relPath in $placeholderFiles) {
    $filePath = Join-Path $ProjectRoot $relPath
    if (Test-Path $filePath -PathType Leaf) {
        $content = Get-Content $filePath -Raw
        if ($content -match '\{\{') {
            Write-Pass "Has {{placeholder}}: $relPath"
        } else {
            Write-Fail "No {{placeholder}} found: $relPath"
        }
    } else {
        Write-Fail "File missing (can't check placeholders): $relPath"
    }
}

# ============================================================================
# 8. README COMPLETENESS
# ============================================================================
Write-Section "8. README Completeness — Memory Recipes Listed"

$readmePath = Join-Path $ProjectRoot "cookbook\README.md"

if (-not (Test-Path $readmePath -PathType Leaf)) {
    Write-Fail "cookbook\README.md does not exist"
} else {
    $readmeContent = Get-Content $readmePath -Raw

    if ($readmeContent -match 'memory-reader\.ts') {
        Write-Pass "README lists memory-reader.ts"
    } else {
        Write-Fail "README does NOT list memory-reader.ts"
    }

    if ($readmeContent -match 'memory-reader\.py') {
        Write-Pass "README lists memory-reader.py"
    } else {
        Write-Fail "README does NOT list memory-reader.py"
    }
}

# ============================================================================
# 9. JARGON CHECK
# ============================================================================
Write-Section "9. Jargon Leak Check — Phase 4 Files"

$bannedTerms = @("cookbook-writer", "skill-writer", "agent-writer", "memory-writer", "specialist")

$jargonFound = $false

function Test-Jargon {
    param([string]$FilePath, [string]$Label)

    if (-not (Test-Path $FilePath -PathType Leaf)) { return }

    $content = Get-Content $FilePath -Raw
    # Strip HTML comments (non-greedy across lines)
    $cleanContent = $content -replace '(?s)<!--.*?-->', ''

    foreach ($term in $bannedTerms) {
        if ($cleanContent -imatch [regex]::Escape($term)) {
            Write-Fail "Jargon leak: '$term' found in $Label"
            $script:jargonFound = $true
        }
    }
}

# New recipes
Test-Jargon -FilePath (Join-Path $ProjectRoot "cookbook\memory-reader.ts") -Label "cookbook\memory-reader.ts"
Test-Jargon -FilePath (Join-Path $ProjectRoot "cookbook\memory-reader.py") -Label "cookbook\memory-reader.py"

# New templates
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\cookbook\memory-reader.ts") -Label "templates\cookbook\memory-reader.ts"
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\cookbook\memory-reader.py") -Label "templates\cookbook\memory-reader.py"
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\forge-memory\preferences.md") -Label "templates\forge-memory\preferences.md"
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\forge-memory\history.md") -Label "templates\forge-memory\history.md"

# Utility specs
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\utils\memory-reader.md") -Label "templates\utils\memory-reader.md"
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\utils\memory-summarizer.md") -Label "templates\utils\memory-summarizer.md"
Test-Jargon -FilePath (Join-Path $ProjectRoot "templates\utils\convention-extractor.md") -Label "templates\utils\convention-extractor.md"

# Architecture doc
Test-Jargon -FilePath (Join-Path $ProjectRoot "docs\phase4-architecture.md") -Label "docs\phase4-architecture.md"

if (-not $jargonFound) {
    Write-Pass "No jargon leaks detected in Phase 4 files"
}

# ============================================================================
# 10. SPEC COMPLETENESS
# ============================================================================
Write-Section "10. Spec Completeness — Utility Specs"

# memory-reader.md — Error Handling section
$mrSpec = Join-Path $ProjectRoot "templates\utils\memory-reader.md"
if (Test-Path $mrSpec -PathType Leaf) {
    $mrContent = Get-Content $mrSpec -Raw
    if ($mrContent -imatch 'Error\s+Handling') {
        Write-Pass "memory-reader.md has Error Handling section"
    } else {
        Write-Fail "memory-reader.md missing Error Handling section"
    }
} else {
    Write-Fail "templates\utils\memory-reader.md does not exist (can't check spec)"
}

# memory-summarizer.md — Summarization or Archive
$msSpec = Join-Path $ProjectRoot "templates\utils\memory-summarizer.md"
if (Test-Path $msSpec -PathType Leaf) {
    $msContent = Get-Content $msSpec -Raw
    if ($msContent -imatch 'Summariz|Archive') {
        Write-Pass "memory-summarizer.md has Summarization/Archive content"
    } else {
        Write-Fail "memory-summarizer.md missing Summarization/Archive content"
    }
} else {
    Write-Fail "templates\utils\memory-summarizer.md does not exist (can't check spec)"
}

# convention-extractor.md — Confidence
$ceSpec = Join-Path $ProjectRoot "templates\utils\convention-extractor.md"
if (Test-Path $ceSpec -PathType Leaf) {
    $ceContent = Get-Content $ceSpec -Raw
    if ($ceContent -imatch '[Cc]onfidence') {
        Write-Pass "convention-extractor.md mentions confidence levels"
    } else {
        Write-Fail "convention-extractor.md missing confidence level content"
    }
} else {
    Write-Fail "templates\utils\convention-extractor.md does not exist (can't check spec)"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Phase 4 Memory Validation Summary" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Passed:   $script:PassCount" -ForegroundColor Green
Write-Host "  Failed:   $script:FailCount" -ForegroundColor Red
Write-Host "  Warnings: $script:WarnCount" -ForegroundColor Yellow
Write-Host ""

if ($script:FailCount -gt 0) {
    Write-Host "  RESULT: FAIL — $script:FailCount check(s) did not pass." -ForegroundColor Red
    Write-Host "  This is expected if Phase 4 files haven't been created yet."
    Write-Host "  Review the failures above — they tell you what Phase 4 needs to deliver."
    exit 1
} else {
    Write-Host "  RESULT: PASS — All Phase 4 memory checks passed." -ForegroundColor Green
    if ($script:WarnCount -gt 0) {
        Write-Host "  ($script:WarnCount warning(s) — review above for optional improvements)"
    }
    exit 0
}