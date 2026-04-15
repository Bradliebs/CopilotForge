<#
.SYNOPSIS
    CopilotForge Phase 1 — Scaffold Validation Script (PowerShell)
    Owner: Tank (Tester)

.DESCRIPTION
    Validates the output of a Planner skill run against expected structure.
    Exit code 0 = all checks pass, 1 = one or more failures.

.PARAMETER ProjectRoot
    Path to the scaffolded project directory.

.EXAMPLE
    .\tests\validate-scaffold.ps1 -ProjectRoot C:\Users\dev\my-project
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
Write-Host "CopilotForge Phase 1 — Scaffold Validation" -ForegroundColor White
Write-Host "Project: $ProjectRoot"
Write-Host "Date:    $(Get-Date)"
Write-Host ""

# ============================================================================
# 1. DIRECTORY EXISTENCE
# ============================================================================
Write-Section "Directory Structure"

$RequiredDirs = @(
    ".copilot\agents",
    ".github\skills",
    "forge-memory",
    "cookbook"
)

foreach ($dir in $RequiredDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (Test-Path $fullPath -PathType Container) {
        Write-Pass "Directory exists: $dir\"
    } else {
        Write-Fail "Missing directory: $dir\"
    }
}

# ============================================================================
# 2. REQUIRED FILES
# ============================================================================
Write-Section "Required Files"

$RequiredFiles = @(
    "FORGE.md",
    "forge-memory\decisions.md",
    "forge-memory\patterns.md"
)

foreach ($file in $RequiredFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath -PathType Leaf) {
        Write-Pass "File exists: $file"
    } else {
        Write-Fail "Missing file: $file"
    }
}

# Check agent files
$agentsDir = Join-Path $ProjectRoot ".copilot\agents"
if (Test-Path $agentsDir) {
    $agentFiles = Get-ChildItem -Path $agentsDir -Filter "*.md" -ErrorAction SilentlyContinue
    $agentCount = ($agentFiles | Measure-Object).Count

    if ($agentCount -gt 0) {
        Write-Pass "Agent files found: $agentCount .md file(s) in .copilot\agents\"
    } else {
        Write-Fail "No agent .md files found in .copilot\agents\"
    }

    foreach ($agent in @("planner", "reviewer", "tester")) {
        $agentPath = Join-Path $agentsDir "$agent.md"
        if (Test-Path $agentPath) {
            Write-Pass "Agent file exists: .copilot\agents\$agent.md"
        } else {
            Write-Warn "Expected agent file missing: .copilot\agents\$agent.md"
        }
    }
} else {
    Write-Fail "Cannot check agent files — .copilot\agents\ does not exist"
}

# Check skill directories
$skillsDir = Join-Path $ProjectRoot ".github\skills"
if (Test-Path $skillsDir) {
    $skillDirs = Get-ChildItem -Path $skillsDir -Directory -ErrorAction SilentlyContinue
    $skillCount = ($skillDirs | Measure-Object).Count

    if ($skillCount -gt 0) {
        Write-Pass "Skill directories found: $skillCount in .github\skills\"
    } else {
        Write-Fail "No skill directories found in .github\skills\"
    }

    foreach ($skillDir in $skillDirs) {
        $skillMd = Join-Path $skillDir.FullName "SKILL.md"
        if (Test-Path $skillMd) {
            Write-Pass "SKILL.md exists in .github\skills\$($skillDir.Name)\"
        } else {
            Write-Fail "Missing SKILL.md in .github\skills\$($skillDir.Name)\"
        }
    }
} else {
    Write-Fail "Cannot check skills — .github\skills\ does not exist"
}

# ============================================================================
# 3. FORGE.md CONTENT VALIDATION
# ============================================================================
Write-Section "FORGE.md Content"

$forgePath = Join-Path $ProjectRoot "FORGE.md"
if (Test-Path $forgePath) {
    $forgeContent = Get-Content $forgePath -Raw

    $requiredSections = @{
        "project summary" = "Tells the user what was created and why"
        "team roster"     = "Lists the agents and their roles"
        "skills index"    = "Lists available skills and how to use them"
    }

    foreach ($section in $requiredSections.GetEnumerator()) {
        if ($forgeContent -imatch [regex]::Escape($section.Key)) {
            Write-Pass "FORGE.md contains section: $($section.Key)"
        } else {
            Write-Fail "FORGE.md missing section: $($section.Key) — $($section.Value)"
        }
    }

    $forgeLines = (Get-Content $forgePath | Measure-Object -Line).Lines
    if ($forgeLines -ge 20) {
        Write-Pass "FORGE.md has substantial content ($forgeLines lines)"
    } else {
        Write-Warn "FORGE.md seems short ($forgeLines lines) — may be incomplete"
    }

    if ($forgeContent -imatch "how to|getting started|next steps|what to do") {
        Write-Pass "FORGE.md contains actionable instructions"
    } else {
        Write-Fail "FORGE.md lacks actionable instructions (how to edit, next steps, etc.)"
    }
} else {
    Write-Fail "Cannot validate FORGE.md content — file does not exist"
}

# ============================================================================
# 4. SKILL.md FRONTMATTER VALIDATION
# ============================================================================
Write-Section "SKILL.md Frontmatter"

function Test-Frontmatter {
    param([string]$FilePath, [string]$RelPath)

    $lines = Get-Content $FilePath

    if ($lines.Count -eq 0) {
        Write-Fail "Empty SKILL.md file: $RelPath"
        return
    }

    if ($lines[0].Trim() -ne "---") {
        Write-Fail "No frontmatter found (file doesn't start with '---'): $RelPath"
        return
    }

    $closingIndex = -1
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq "---") {
            $closingIndex = $i
            break
        }
    }

    if ($closingIndex -eq -1) {
        Write-Fail "Frontmatter missing closing '---': $RelPath"
        return
    }

    Write-Pass "Valid frontmatter delimiters: $RelPath"

    $frontmatter = $lines[1..($closingIndex - 1)] -join "`n"

    if ($frontmatter -match "(?m)^name:") {
        Write-Pass "Frontmatter has 'name' field: $RelPath"
    } else {
        Write-Warn "Frontmatter missing 'name' field: $RelPath"
    }

    if ($frontmatter -match "(?m)^description:") {
        Write-Pass "Frontmatter has 'description' field: $RelPath"
    } else {
        Write-Warn "Frontmatter missing 'description' field: $RelPath"
    }

    if ($frontmatter -match "`t") {
        Write-Fail "Frontmatter contains tabs (invalid YAML): $RelPath"
    } else {
        Write-Pass "Frontmatter uses spaces not tabs: $RelPath"
    }
}

$skillFiles = Get-ChildItem -Path (Join-Path $ProjectRoot ".github\skills") -Recurse -Filter "SKILL.md" -ErrorAction SilentlyContinue
if (($skillFiles | Measure-Object).Count -gt 0) {
    foreach ($sf in $skillFiles) {
        $relPath = $sf.FullName.Substring($ProjectRoot.Length + 1)
        Test-Frontmatter -FilePath $sf.FullName -RelPath $relPath
    }
} else {
    Write-Fail "No SKILL.md files found to validate frontmatter"
}

# ============================================================================
# 5. COOKBOOK SYNTAX CHECKS
# ============================================================================
Write-Section "Cookbook Validation"

$cookbookDir = Join-Path $ProjectRoot "cookbook"
if (Test-Path $cookbookDir) {
    $cookbookFiles = Get-ChildItem -Path $cookbookDir -Recurse -File -Include "*.ts", "*.js", "*.py" -ErrorAction SilentlyContinue

    if (($cookbookFiles | Measure-Object).Count -gt 0) {
        foreach ($cbFile in $cookbookFiles) {
            $relPath = $cbFile.FullName.Substring($ProjectRoot.Length + 1)

            if ($cbFile.Length -eq 0) {
                Write-Fail "Empty cookbook file: $relPath"
                continue
            }

            $content = Get-Content $cbFile.FullName -Raw

            # TypeScript / JavaScript brace balance check
            if ($cbFile.Extension -in ".ts", ".js") {
                $openBraces = ([regex]::Matches($content, "\{")).Count
                $closeBraces = ([regex]::Matches($content, "\}")).Count
                if ($openBraces -eq $closeBraces) {
                    Write-Pass "Balanced braces: $relPath ({$openBraces / }$closeBraces)"
                } else {
                    Write-Fail "Unbalanced braces: $relPath ({$openBraces / }$closeBraces)"
                }

                # Node syntax check for .js files
                if ($cbFile.Extension -eq ".js") {
                    $nodePath = Get-Command node -ErrorAction SilentlyContinue
                    if ($nodePath) {
                        $result = & node --check $cbFile.FullName 2>&1
                        if ($LASTEXITCODE -eq 0) {
                            Write-Pass "Node syntax check passed: $relPath"
                        } else {
                            Write-Fail "Node syntax check failed: $relPath"
                        }
                    }
                }
            }

            # Python syntax check
            if ($cbFile.Extension -eq ".py") {
                $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
                if (-not $pythonCmd) { $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue }
                if ($pythonCmd) {
                    $escaped = $cbFile.FullName -replace "'", "''"
                    $result = & $pythonCmd.Source -c "import ast; ast.parse(open('$escaped').read())" 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Pass "Python syntax check passed: $relPath"
                    } else {
                        Write-Fail "Python syntax check failed: $relPath"
                    }
                } else {
                    Write-Warn "Python not available — skipping syntax check: $relPath"
                }
            }

            Write-Pass "Cookbook file is non-empty: $relPath"
        }
    } else {
        Write-Warn "No .ts, .js, or .py files found in cookbook\"
    }
} else {
    Write-Fail "cookbook\ directory does not exist"
}

# ============================================================================
# 6. CROSS-REFERENCE CONSISTENCY
# ============================================================================
Write-Section "Cross-Reference Consistency"

if (Test-Path $forgePath) {
    $forgeText = Get-Content $forgePath -Raw
    $pathMatches = [regex]::Matches($forgeText, '(?:\.copilot|\.github|forge-memory|cookbook)[/\\][^\s\)\]`"'']+')

    if ($pathMatches.Count -gt 0) {
        $checkedPaths = @{}
        foreach ($match in $pathMatches) {
            $refPath = $match.Value -replace '[.,;:!?)]+$', ''
            # Normalize to backslashes for Windows
            $refPath = $refPath -replace '/', '\'

            if ($checkedPaths.ContainsKey($refPath)) { continue }
            $checkedPaths[$refPath] = $true

            $fullRefPath = Join-Path $ProjectRoot $refPath
            if (Test-Path $fullRefPath) {
                Write-Pass "Referenced path exists: $refPath"
            } else {
                Write-Fail "FORGE.md references non-existent path: $refPath"
            }
        }
    } else {
        Write-Warn "No file paths detected in FORGE.md — cross-reference check skipped"
    }
} else {
    Write-Fail "Cannot check cross-references — FORGE.md does not exist"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Validation Summary" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Passed:   $script:PassCount" -ForegroundColor Green
Write-Host "  Failed:   $script:FailCount" -ForegroundColor Red
Write-Host "  Warnings: $script:WarnCount" -ForegroundColor Yellow
Write-Host ""

if ($script:FailCount -gt 0) {
    Write-Host "  RESULT: FAIL — $script:FailCount check(s) did not pass." -ForegroundColor Red
    Write-Host "  Review the failures above and re-run the Planner skill."
    exit 1
} else {
    Write-Host "  RESULT: PASS — All checks passed." -ForegroundColor Green
    if ($script:WarnCount -gt 0) {
        Write-Host "  ($script:WarnCount warning(s) — review above for optional improvements)"
    }
    exit 0
}
