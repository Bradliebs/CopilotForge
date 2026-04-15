<#
.SYNOPSIS
    CopilotForge Phase 3 — Cookbook Validation Script (PowerShell)
    Owner: Tank (Tester)

.DESCRIPTION
    Validates Phase 3 cookbook output: recipe files, template files, header
    comments, imports, error handling, TODO markers, README completeness,
    FORGE.md markers, and jargon leaks.
    Exit code 0 = all checks pass, 1 = one or more failures.

.PARAMETER ProjectRoot
    Path to the CopilotForge project directory (the framework repo itself).

.EXAMPLE
    .\tests\phase3\validate-cookbook.ps1 -ProjectRoot "C:\AI Projects\Oracle_Prime"
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
Write-Host "CopilotForge Phase 3 — Cookbook Validation" -ForegroundColor White
Write-Host "Project: $ProjectRoot"
Write-Host "Date:    $(Get-Date)"
Write-Host ""

# ============================================================================
# Recipe & template file lists
# ============================================================================
$recipeNames = @(
    "error-handling",
    "mcp-server",
    "api-client",
    "auth-middleware",
    "db-query",
    "route-handler"
)
$extensions = @(".ts", ".py")

# ============================================================================
# 1. FILE EXISTENCE
# ============================================================================
Write-Section "1. File Existence — Cookbook Recipes (12 files)"

foreach ($name in $recipeNames) {
    foreach ($ext in $extensions) {
        $filePath = Join-Path $ProjectRoot "cookbook\$name$ext"
        if (Test-Path $filePath -PathType Leaf) {
            Write-Pass "Recipe exists: cookbook\$name$ext"
        } else {
            Write-Fail "Recipe missing: cookbook\$name$ext"
        }
    }
}

Write-Section "1b. File Existence — Template Recipes (12 files)"

foreach ($name in $recipeNames) {
    foreach ($ext in $extensions) {
        $filePath = Join-Path $ProjectRoot "templates\cookbook\$name$ext"
        if (Test-Path $filePath -PathType Leaf) {
            Write-Pass "Template exists: templates\cookbook\$name$ext"
        } else {
            Write-Fail "Template missing: templates\cookbook\$name$ext"
        }
    }
}

# ============================================================================
# 2. HEADER COMMENT CHECK
# ============================================================================
Write-Section "2. Header Comments — 4 Required Sections"

$headerSections = @("WHAT THIS DOES", "WHEN TO USE THIS", "HOW TO RUN", "PREREQUISITES")

foreach ($name in $recipeNames) {
    foreach ($ext in $extensions) {
        $filePath = Join-Path $ProjectRoot "cookbook\$name$ext"
        if (-not (Test-Path $filePath -PathType Leaf)) { continue }
        $label = "cookbook\$name$ext"

        $content = Get-Content $filePath -Raw
        $missing = @()

        foreach ($hs in $headerSections) {
            if ($content -notmatch [regex]::Escape($hs)) {
                $missing += $hs
            }
        }

        if ($missing.Count -eq 0) {
            Write-Pass "Header complete (4/4 sections): $label"
        } else {
            Write-Fail "Header missing $($missing.Count) section(s) in ${label}: $($missing -join ', ')"
        }
    }
}

# ============================================================================
# 3. IMPORT CHECK
# ============================================================================
Write-Section "3. Import Statements"

foreach ($name in $recipeNames) {
    # TypeScript
    $tsPath = Join-Path $ProjectRoot "cookbook\$name.ts"
    if (Test-Path $tsPath -PathType Leaf) {
        $tsContent = Get-Content $tsPath -Raw
        if ($tsContent -match '(?m)^\s*import\s') {
            Write-Pass "Has import statements: cookbook\$name.ts"
        } else {
            Write-Fail "No import statements found: cookbook\$name.ts"
        }
    }

    # Python
    $pyPath = Join-Path $ProjectRoot "cookbook\$name.py"
    if (Test-Path $pyPath -PathType Leaf) {
        $pyContent = Get-Content $pyPath -Raw
        if ($pyContent -match '(?m)^\s*(import|from)\s') {
            Write-Pass "Has import statements: cookbook\$name.py"
        } else {
            Write-Fail "No import statements found: cookbook\$name.py"
        }
    }
}

# ============================================================================
# 4. ERROR HANDLING CHECK
# ============================================================================
Write-Section "4. Error Handling"

foreach ($name in $recipeNames) {
    # TypeScript — must have catch or throw
    $tsPath = Join-Path $ProjectRoot "cookbook\$name.ts"
    if (Test-Path $tsPath -PathType Leaf) {
        $tsContent = Get-Content $tsPath -Raw
        if ($tsContent -match '\bcatch\b|\bthrow\b') {
            Write-Pass "Has error handling (catch/throw): cookbook\$name.ts"
        } else {
            Write-Fail "No error handling found (missing catch/throw): cookbook\$name.ts"
        }
    }

    # Python — must have except or raise
    $pyPath = Join-Path $ProjectRoot "cookbook\$name.py"
    if (Test-Path $pyPath -PathType Leaf) {
        $pyContent = Get-Content $pyPath -Raw
        if ($pyContent -match '\bexcept\b|\braise\b') {
            Write-Pass "Has error handling (except/raise): cookbook\$name.py"
        } else {
            Write-Fail "No error handling found (missing except/raise): cookbook\$name.py"
        }
    }
}

# ============================================================================
# 5. TODO MARKER CHECK
# ============================================================================
Write-Section "5. TODO Markers"

foreach ($name in $recipeNames) {
    foreach ($ext in $extensions) {
        $filePath = Join-Path $ProjectRoot "cookbook\$name$ext"
        if (-not (Test-Path $filePath -PathType Leaf)) { continue }

        $content = Get-Content $filePath -Raw
        if ($content -match 'TODO') {
            Write-Pass "Has TODO marker: cookbook\$name$ext"
        } else {
            Write-Fail "No TODO marker found: cookbook\$name$ext"
        }
    }
}

# ============================================================================
# 6. TEMPLATE PLACEHOLDER CHECK
# ============================================================================
Write-Section "6. Template Placeholder Syntax"

foreach ($name in $recipeNames) {
    foreach ($ext in $extensions) {
        $filePath = Join-Path $ProjectRoot "templates\cookbook\$name$ext"
        if (-not (Test-Path $filePath -PathType Leaf)) { continue }

        $content = Get-Content $filePath -Raw
        if ($content -match '\{\{') {
            Write-Pass "Has {{placeholder}}: templates\cookbook\$name$ext"
        } else {
            Write-Fail "No {{placeholder}} found: templates\cookbook\$name$ext"
        }
    }
}

# ============================================================================
# 7. README COMPLETENESS
# ============================================================================
Write-Section "7. README Completeness"

$readmePath = Join-Path $ProjectRoot "cookbook\README.md"

if (-not (Test-Path $readmePath -PathType Leaf)) {
    Write-Fail "cookbook\README.md does not exist"
} else {
    $readmeContent = Get-Content $readmePath -Raw

    $allListed = $true
    $cookbookDir = Join-Path $ProjectRoot "cookbook"
    $codeFiles = Get-ChildItem -Path $cookbookDir -File -ErrorAction SilentlyContinue |
                 Where-Object { $_.Extension -in @('.ts', '.py', '.go', '.cs') }

    foreach ($cf in $codeFiles) {
        if ($readmeContent -match [regex]::Escape($cf.Name)) {
            Write-Pass "Listed in README: $($cf.Name)"
        } else {
            Write-Fail "NOT listed in README: $($cf.Name)"
            $allListed = $false
        }
    }

    if ($allListed) {
        Write-Pass "All cookbook code files are listed in README.md"
    }
}

# ============================================================================
# 8. JARGON CHECK
# ============================================================================
Write-Section "8. Jargon Leak Check"

$bannedTerms = @("cookbook-writer", "skill-writer", "agent-writer", "memory-writer", "specialist")

$jargonFound = $false

# Helper: strip HTML comments and check for banned terms
function Test-Jargon {
    param([string]$FilePath, [string]$Label)

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

# Recipes
$cookbookDir = Join-Path $ProjectRoot "cookbook"
$recipeFiles = Get-ChildItem -Path $cookbookDir -File -ErrorAction SilentlyContinue |
               Where-Object { $_.Extension -in @('.ts', '.py') }
foreach ($rf in $recipeFiles) {
    Test-Jargon -FilePath $rf.FullName -Label "cookbook\$($rf.Name)"
}

# Templates
$tplDir = Join-Path $ProjectRoot "templates\cookbook"
if (Test-Path $tplDir) {
    $tplFiles = Get-ChildItem -Path $tplDir -File -ErrorAction SilentlyContinue |
                Where-Object { $_.Extension -in @('.ts', '.py') }
    foreach ($tf in $tplFiles) {
        Test-Jargon -FilePath $tf.FullName -Label "templates\cookbook\$($tf.Name)"
    }
}

# README
$readmePath = Join-Path $ProjectRoot "cookbook\README.md"
if (Test-Path $readmePath -PathType Leaf) {
    Test-Jargon -FilePath $readmePath -Label "cookbook\README.md"
}

if (-not $jargonFound) {
    Write-Pass "No jargon leaks detected in recipes, templates, or README"
}

# ============================================================================
# 9. FORGE.md MARKERS
# ============================================================================
Write-Section "9. FORGE.md Cookbook Markers"

$forgePath = Join-Path $ProjectRoot "templates\FORGE.md"

if (-not (Test-Path $forgePath -PathType Leaf)) {
    Write-Fail "templates\FORGE.md does not exist"
} else {
    $forgeContent = Get-Content $forgePath -Raw

    if ($forgeContent -match 'forge:cookbook-start') {
        Write-Pass "FORGE.md has <!-- forge:cookbook-start --> marker"
    } else {
        Write-Fail "FORGE.md missing <!-- forge:cookbook-start --> marker"
    }

    if ($forgeContent -match 'forge:cookbook-end') {
        Write-Pass "FORGE.md has <!-- forge:cookbook-end --> marker"
    } else {
        Write-Fail "FORGE.md missing <!-- forge:cookbook-end --> marker"
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Phase 3 Cookbook Validation Summary" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Passed:   $script:PassCount" -ForegroundColor Green
Write-Host "  Failed:   $script:FailCount" -ForegroundColor Red
Write-Host "  Warnings: $script:WarnCount" -ForegroundColor Yellow
Write-Host ""

if ($script:FailCount -gt 0) {
    Write-Host "  RESULT: FAIL — $script:FailCount check(s) did not pass." -ForegroundColor Red
    Write-Host "  This is expected if Phase 3 recipes haven't been created yet."
    Write-Host "  Review the failures above — they tell you what Phase 3 needs to deliver."
    exit 1
} else {
    Write-Host "  RESULT: PASS — All Phase 3 cookbook checks passed." -ForegroundColor Green
    if ($script:WarnCount -gt 0) {
        Write-Host "  ($script:WarnCount warning(s) — review above for optional improvements)"
    }
    exit 0
}