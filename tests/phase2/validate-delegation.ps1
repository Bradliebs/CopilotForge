<#
.SYNOPSIS
    CopilotForge Phase 2 — Delegation Validation Script (PowerShell)
    Owner: Tank (Tester)

.DESCRIPTION
    Validates Phase 2 delegation output: specialist agent files, templates,
    delegation protocol, cookbook recipes, and cross-reference consistency.
    Exit code 0 = all checks pass, 1 = one or more failures.

.PARAMETER ProjectRoot
    Path to the CopilotForge project directory (the framework repo itself).

.EXAMPLE
    .\tests\phase2\validate-delegation.ps1 -ProjectRoot C:\AI Projects\Oracle_Prime
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
Write-Host "CopilotForge Phase 2 — Delegation Validation" -ForegroundColor White
Write-Host "Project: $ProjectRoot"
Write-Host "Date:    $(Get-Date)"
Write-Host ""

# ============================================================================
# 1. SPECIALIST AGENT FILES
# ============================================================================
Write-Section "Specialist Agent Files"

$agentsDir = Join-Path $ProjectRoot ".copilot\agents"
if (-not (Test-Path $agentsDir -PathType Container)) {
    # Phase 2 agents may live under .github\agents (Squad-style) or .copilot\agents
    $agentsDir = Join-Path $ProjectRoot ".github\agents"
}

if (Test-Path $agentsDir -PathType Container) {
    Write-Pass "Agents directory exists: $($agentsDir.Substring($ProjectRoot.Length + 1))"
} else {
    Write-Fail "No agents directory found (.copilot\agents\ or .github\agents\)"
}

# Check for specialist agent files (templates — these are the agent definitions
# that ship with CopilotForge Phase 2)
$specialistAgents = @(
    @{ Name = "skill-writer";   Desc = "Writes skill SKILL.md files" },
    @{ Name = "agent-writer";   Desc = "Writes agent definition files" },
    @{ Name = "memory-writer";  Desc = "Writes forge-memory files" },
    @{ Name = "cookbook-writer"; Desc = "Writes cookbook recipe files" }
)

$agentTemplateDirs = @(
    (Join-Path $ProjectRoot "templates\agents"),
    (Join-Path $ProjectRoot "templates\internal\agents"),
    (Join-Path $ProjectRoot ".copilot\agents"),
    (Join-Path $ProjectRoot ".github\agents")
)

foreach ($specialist in $specialistAgents) {
    $found = $false
    foreach ($searchDir in $agentTemplateDirs) {
        $agentPath = Join-Path $searchDir "$($specialist.Name).md"
        if (Test-Path $agentPath -PathType Leaf) {
            $found = $true
            Write-Pass "Specialist agent file exists: $($agentPath.Substring($ProjectRoot.Length + 1))"

            # Validate required sections
            $content = Get-Content $agentPath -Raw
            $requiredSections = @("Role", "Boundar")
            foreach ($section in $requiredSections) {
                if ($content -imatch $section) {
                    Write-Pass "  Has '$section' section: $($specialist.Name).md"
                } else {
                    Write-Fail "  Missing '$section' section: $($specialist.Name).md"
                }
            }

            # Check file is not trivially short
            $lineCount = (Get-Content $agentPath | Measure-Object -Line).Lines
            if ($lineCount -ge 10) {
                Write-Pass "  Substantial content ($lineCount lines): $($specialist.Name).md"
            } else {
                Write-Warn "  Very short ($lineCount lines) — may be a stub: $($specialist.Name).md"
            }
            break
        }
    }
    if (-not $found) {
        Write-Fail "Specialist agent file missing: $($specialist.Name).md — $($specialist.Desc)"
    }
}

# ============================================================================
# 2. SPECIALIST AGENT REQUIRED SECTIONS
# ============================================================================
Write-Section "Agent File Structure"

$allAgentFiles = @()
foreach ($searchDir in $agentTemplateDirs) {
    if (Test-Path $searchDir) {
        $allAgentFiles += Get-ChildItem -Path $searchDir -Filter "*.md" -ErrorAction SilentlyContinue
    }
}

foreach ($agentFile in $allAgentFiles) {
    $relPath = $agentFile.FullName.Substring($ProjectRoot.Length + 1)
    $content = Get-Content $agentFile.FullName -Raw

    # Check for key structural elements
    $sections = @(
        @{ Pattern = "(?i)(^|\n)#+\s.*role";         Label = "Role" },
        @{ Pattern = "(?i)(^|\n)#+\s.*responsibilit"; Label = "Responsibilities/Scope" },
        @{ Pattern = "(?i)(^|\n)#+\s.*boundar";       Label = "Boundaries" },
        @{ Pattern = "(?i)skill|reference";            Label = "Skills Reference" }
    )

    $hasSections = 0
    foreach ($s in $sections) {
        if ($content -match $s.Pattern) {
            $hasSections++
        }
    }

    if ($hasSections -ge 2) {
        Write-Pass "Agent has sufficient structure ($hasSections/4 key sections): $relPath"
    } else {
        Write-Warn "Agent has minimal structure ($hasSections/4 key sections): $relPath"
    }
}

# ============================================================================
# 3. DELEGATION PROTOCOL DOCUMENTATION
# ============================================================================
Write-Section "Delegation Protocol"

$delegationPaths = @(
    (Join-Path $ProjectRoot "docs\delegation-protocol.md"),
    (Join-Path $ProjectRoot ".copilot\delegation-protocol.md"),
    (Join-Path $ProjectRoot "templates\delegation-protocol.md")
)

$delegationFound = $false
foreach ($dPath in $delegationPaths) {
    if (Test-Path $dPath -PathType Leaf) {
        $delegationFound = $true
        $relPath = $dPath.Substring($ProjectRoot.Length + 1)
        Write-Pass "Delegation protocol exists: $relPath"

        $dContent = Get-Content $dPath -Raw
        if ($dContent.Length -gt 100) {
            Write-Pass "Delegation protocol has substantial content ($($dContent.Length) chars)"
        } else {
            Write-Warn "Delegation protocol seems very short ($($dContent.Length) chars)"
        }

        # Check for key topics
        $topics = @("skill-writer", "agent-writer", "memory-writer", "cookbook-writer", "order", "depend")
        $topicHits = 0
        foreach ($topic in $topics) {
            if ($dContent -imatch [regex]::Escape($topic)) {
                $topicHits++
            }
        }
        if ($topicHits -ge 3) {
            Write-Pass "Delegation protocol covers key topics ($topicHits/6)"
        } else {
            Write-Warn "Delegation protocol may be incomplete — only $topicHits/6 key topics found"
        }
        break
    }
}

if (-not $delegationFound) {
    Write-Fail "Delegation protocol missing — expected at docs\delegation-protocol.md"
}

# ============================================================================
# 4. SPECIALIST TEMPLATES
# ============================================================================
Write-Section "Specialist Templates"

$templateAgentsDir = Join-Path $ProjectRoot "templates\agents"
$internalAgentsDir = Join-Path $ProjectRoot "templates\internal\agents"

if (Test-Path $templateAgentsDir -PathType Container) {
    Write-Pass "Templates agents directory exists"

    $templateFiles = Get-ChildItem -Path $templateAgentsDir -Filter "*.md" -ErrorAction SilentlyContinue
    $templateCount = ($templateFiles | Measure-Object).Count

    # Internal specialist templates count
    $internalFiles = @()
    if (Test-Path $internalAgentsDir -PathType Container) {
        $internalFiles = Get-ChildItem -Path $internalAgentsDir -Filter "*.md" -ErrorAction SilentlyContinue
    }
    $totalCount = $templateCount + ($internalFiles | Measure-Object).Count

    if ($totalCount -ge 4) {
        Write-Pass "At least 4 agent templates found ($totalCount total, $templateCount user-facing + $(($internalFiles | Measure-Object).Count) internal)"
    } else {
        Write-Warn "Expected 4+ agent templates, found $totalCount"
    }

    # Check each specialist has a template (user-facing OR internal)
    foreach ($specialist in $specialistAgents) {
        $tplPath = Join-Path $templateAgentsDir "$($specialist.Name).md"
        $intPath = Join-Path $internalAgentsDir "$($specialist.Name).md"
        if (Test-Path $tplPath) {
            Write-Pass "Specialist template exists: templates\agents\$($specialist.Name).md"
        } elseif (Test-Path $intPath) {
            Write-Pass "Specialist template exists (internal): templates\internal\agents\$($specialist.Name).md"
        } else {
            Write-Fail "Missing specialist template: $($specialist.Name).md"
        }
    }
} else {
    Write-Fail "Templates agents directory missing: templates\agents\"
}

# ============================================================================
# 5. FORGE.md TEMPLATE INCLUDES NEW AGENTS
# ============================================================================
Write-Section "FORGE.md Template Updates"

$forgeTemplatePath = Join-Path $ProjectRoot "templates\FORGE.md"
if (Test-Path $forgeTemplatePath) {
    $forgeTemplateContent = Get-Content $forgeTemplatePath -Raw

    # Check for team roster section
    if ($forgeTemplateContent -imatch "team roster") {
        Write-Pass "FORGE.md template has Team Roster section"
    } else {
        Write-Fail "FORGE.md template missing Team Roster section"
    }

    # Check for skills index
    if ($forgeTemplateContent -imatch "skills index") {
        Write-Pass "FORGE.md template has Skills Index section"
    } else {
        Write-Fail "FORGE.md template missing Skills Index section"
    }

    # Check for Quick Actions
    if ($forgeTemplateContent -imatch "quick action") {
        Write-Pass "FORGE.md template has Quick Actions section"
    } else {
        Write-Fail "FORGE.md template missing Quick Actions section"
    }

    # Check for Memory Status
    if ($forgeTemplateContent -imatch "memory") {
        Write-Pass "FORGE.md template references memory"
    } else {
        Write-Warn "FORGE.md template doesn't seem to reference memory"
    }
} else {
    Write-Fail "FORGE.md template missing: templates\FORGE.md"
}

# ============================================================================
# 6. COOKBOOK RECIPES
# ============================================================================
Write-Section "Cookbook Templates"

$cookbookTemplateDir = Join-Path $ProjectRoot "templates\cookbook"
if (Test-Path $cookbookTemplateDir -PathType Container) {
    $cookbookFiles = Get-ChildItem -Path $cookbookTemplateDir -File -ErrorAction SilentlyContinue
    $cbCount = ($cookbookFiles | Measure-Object).Count

    if ($cbCount -ge 1) {
        Write-Pass "Cookbook templates found: $cbCount file(s)"

        foreach ($cbFile in $cookbookFiles) {
            $relPath = $cbFile.FullName.Substring($ProjectRoot.Length + 1)
            $content = Get-Content $cbFile.FullName -Raw

            if ($cbFile.Length -eq 0) {
                Write-Fail "Empty cookbook template: $relPath"
                continue
            }

            # Check for header comment
            $firstLine = (Get-Content $cbFile.FullName -TotalCount 1)
            if ($firstLine -match "^(//|#|/\*|<!--|''')") {
                Write-Pass "Has header comment: $relPath"
            } else {
                Write-Warn "Missing header comment: $relPath — recipes should explain their purpose"
            }

            Write-Pass "Cookbook template is non-empty: $relPath"
        }
    } else {
        Write-Warn "No cookbook template files found"
    }
} else {
    Write-Fail "Cookbook templates directory missing: templates\cookbook\"
}

# ============================================================================
# 7. CROSS-REFERENCE CONSISTENCY
# ============================================================================
Write-Section "Cross-Reference Consistency"

# Collect all skill names
$skillNames = @()
$skillsDir = Join-Path $ProjectRoot ".github\skills"
if (Test-Path $skillsDir) {
    $skillDirs = Get-ChildItem -Path $skillsDir -Directory -ErrorAction SilentlyContinue
    foreach ($sd in $skillDirs) {
        $skillNames += $sd.Name
    }
}

# Collect all agent names
$agentNames = @()
foreach ($searchDir in $agentTemplateDirs) {
    if (Test-Path $searchDir) {
        $aFiles = Get-ChildItem -Path $searchDir -Filter "*.md" -ErrorAction SilentlyContinue
        foreach ($af in $aFiles) {
            $agentNames += $af.BaseName
        }
    }
}

# Check agent files don't reference nonexistent skills
foreach ($searchDir in $agentTemplateDirs) {
    if (-not (Test-Path $searchDir)) { continue }
    $aFiles = Get-ChildItem -Path $searchDir -Filter "*.md" -ErrorAction SilentlyContinue
    foreach ($af in $aFiles) {
        $relPath = $af.FullName.Substring($ProjectRoot.Length + 1)
        $content = Get-Content $af.FullName -Raw

        # Look for skill references (common patterns)
        $skillRefPattern = '\.github[/\\]skills[/\\]([^\s\)\]`"\/\\]+)'
        $skillRefs = [regex]::Matches($content, $skillRefPattern)
        foreach ($ref in $skillRefs) {
            $refSkill = $ref.Groups[1].Value -replace '[.,;:!?)]+$', ''
            # Skip template placeholders like {{name}} or {name}
            if ($refSkill -match '^\{') {
                Write-Warn "Template placeholder in skill reference: $relPath → $refSkill (skipped)"
                continue
            }
            if ($skillNames -contains $refSkill) {
                Write-Pass "Valid skill reference in $relPath → $refSkill"
            } else {
                Write-Fail "Broken skill reference in $relPath → $refSkill (skill not found)"
            }
        }
    }
}

# Check FORGE.md template references
if (Test-Path $forgeTemplatePath) {
    $forgeTplContent = Get-Content $forgeTemplatePath -Raw

    # Extract referenced paths (use alternation instead of char class for PS5.1 compat)
    $pathRefPattern = '(?:\.copilot|\.github|forge-memory|cookbook)(?:/|\\)\S+'
    $pathMatches = [regex]::Matches($forgeTplContent, $pathRefPattern)
    $templatePaths = @()
    foreach ($match in $pathMatches) {
        $refPath = $match.Value -replace '[.,;:!?)]+$', ''
        $refPath = $refPath -replace '/', '\'
        # Skip template placeholders
        if ($refPath -match '\{\{') { continue }
        $templatePaths += $refPath
    }

    foreach ($tPath in $templatePaths) {
        $fullPath = Join-Path $ProjectRoot $tPath
        if (Test-Path $fullPath) {
            Write-Pass "FORGE.md template path exists: $tPath"
        } else {
            Write-Warn "FORGE.md template references path that may be generated at runtime: $tPath"
        }
    }
}

# Check for orphaned agents (agent file exists but not referenced in FORGE.md template)
if ((Test-Path $forgeTemplatePath) -and $agentNames.Count -gt 0) {
    $forgeTplText = Get-Content $forgeTemplatePath -Raw
    $unreferenced = @()
    foreach ($name in ($agentNames | Sort-Object -Unique)) {
        if ($forgeTplText -imatch [regex]::Escape($name)) {
            # Referenced — OK
        } else {
            $unreferenced += $name
        }
    }
    if ($unreferenced.Count -eq 0) {
        Write-Pass "All agent names are referenced in FORGE.md template"
    } else {
        foreach ($u in $unreferenced) {
            Write-Warn "Agent '$u' not referenced in FORGE.md template (may be intentional)"
        }
    }
}

# ============================================================================
# 8. JARGON LEAK CHECK
# ============================================================================
Write-Section "Jargon Leak Check (User-Facing Files)"

$bannedTerms = @(
    "skill-writer",
    "agent-writer",
    "memory-writer",
    "cookbook-writer",
    "specialist",
    "dispatch"
)

$userFacingDirs = @(
    (Join-Path $ProjectRoot "templates\FORGE.md"),
    (Join-Path $ProjectRoot "templates\agents"),
    (Join-Path $ProjectRoot "templates\cookbook"),
    (Join-Path $ProjectRoot "templates\forge-memory")
)

$jargonFound = $false
foreach ($ufPath in $userFacingDirs) {
    if (-not (Test-Path $ufPath)) { continue }

    $filesToCheck = @()
    if (Test-Path $ufPath -PathType Leaf) {
        $filesToCheck += Get-Item $ufPath
    } else {
        $filesToCheck += Get-ChildItem -Path $ufPath -Recurse -File -ErrorAction SilentlyContinue
    }

    foreach ($f in $filesToCheck) {
        $relPath = $f.FullName.Substring($ProjectRoot.Length + 1)
        $content = Get-Content $f.FullName -Raw

        foreach ($term in $bannedTerms) {
            if ($content -imatch [regex]::Escape($term)) {
                # Skip HTML comments
                $nonCommentContent = $content -replace '<!--.*?-->', ''
                if ($nonCommentContent -imatch [regex]::Escape($term)) {
                    Write-Fail "Jargon leak: '$term' found in user-facing file $relPath"
                    $jargonFound = $true
                }
            }
        }
    }
}

if (-not $jargonFound) {
    Write-Pass "No jargon leaks detected in user-facing templates"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Phase 2 Delegation Validation Summary" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor White
Write-Host "  Passed:   $script:PassCount" -ForegroundColor Green
Write-Host "  Failed:   $script:FailCount" -ForegroundColor Red
Write-Host "  Warnings: $script:WarnCount" -ForegroundColor Yellow
Write-Host ""

if ($script:FailCount -gt 0) {
    Write-Host "  RESULT: FAIL — $script:FailCount check(s) did not pass." -ForegroundColor Red
    Write-Host "  This is expected if Phase 2 specialist agents haven't been created yet."
    Write-Host "  Review the failures above — they tell you what Phase 2 needs to deliver."
    exit 1
} else {
    Write-Host "  RESULT: PASS — All Phase 2 delegation checks passed." -ForegroundColor Green
    if ($script:WarnCount -gt 0) {
        Write-Host "  ($script:WarnCount warning(s) — review above for optional improvements)"
    }
    exit 0
}
