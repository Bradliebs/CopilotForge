#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates all cookbook recipes against CopilotForge standards.

.DESCRIPTION
    ⚠️  REQUIRES PowerShell Core 7+ (pwsh). This script uses modern PowerShell
    syntax and will NOT work with Windows PowerShell 5.1 (powershell.exe).
    
    Checks every .ts and .py file in cookbook/ for:
    - Header comment present
    - Source attribution (Adapted from: or Inspired by:)
    - Required sections (WHAT THIS DOES, WHEN TO USE THIS, HOW TO RUN, PREREQUISITES)
    - TODO markers exist
    - All imports at top
    - No bare try/catch or except blocks
    - PLATFORM NOTES section
    - Self-contained imports

.EXAMPLE
    pwsh tests/docs/validate-recipes.ps1
    
.NOTES
    ⚠️  Use 'pwsh' not 'powershell' to run this script!
#>

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Green    = [System.ConsoleColor]::Green
    Yellow   = [System.ConsoleColor]::Yellow
    Red      = [System.ConsoleColor]::Red
    DarkGray = [System.ConsoleColor]::DarkGray
}

$CookbookPath = Join-Path (Get-Location) "cookbook"
if (-not (Test-Path $CookbookPath)) {
    Write-Error "cookbook/ directory not found at $CookbookPath"
    exit 1
}

# Collect all .ts and .py files
$RecipeFiles = @(
    @(Get-ChildItem -Path $CookbookPath -Filter "*.ts" -File) +
    @(Get-ChildItem -Path $CookbookPath -Filter "*.py" -File)
) | Sort-Object Name

if ($RecipeFiles.Count -eq 0) {
    Write-Host "No recipe files found in cookbook/" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n📖 Validating cookbook recipes...`n"

# Define checks
$Checks = @(
    @{
        Name     = "Header present"
        Check    = { param($Content, $Ext)
            if ($Ext -eq "ts") {
                return $Content -match '^\s*/\*\*'
            }
            else {
                # Python may have shebang first
                return $Content -match '(^#!.*\n)?\s*"""'
            }
        }
        Required = $true
    }
    @{
        Name     = "Source attribution"
        Check    = { param($Content, $Ext)
            return $Content -match '(Adapted from:|Inspired by:)'
        }
        Required = $false  # Warning only
    }
    @{
        Name     = "WHAT THIS DOES section"
        Check    = { param($Content, $Ext)
            return $Content -match 'WHAT THIS DOES'
        }
        Required = $true
    }
    @{
        Name     = "WHEN TO USE THIS section"
        Check    = { param($Content, $Ext)
            return $Content -match 'WHEN TO USE THIS'
        }
        Required = $true
    }
    @{
        Name     = "HOW TO RUN section"
        Check    = { param($Content, $Ext)
            return $Content -match 'HOW TO RUN'
        }
        Required = $true
    }
    @{
        Name     = "PREREQUISITES section"
        Check    = { param($Content, $Ext)
            return $Content -match 'PREREQUISITES'
        }
        Required = $true
    }
    @{
        Name     = "TODO markers exist"
        Check    = { param($Content, $Ext)
            return $Content -match 'TODO'
        }
        Required = $false  # Warning only
    }
    @{
        Name     = "All imports at top"
        Check    = { param($Content, $Ext)
            if ($Ext -eq "ts") {
                # For TS: imports should come before executable code
                # Interfaces, types, and classes don't count as executable code
                $lines = $Content -split "`n"
                $inHeader = $false
                $lastImportLine = -1
                $firstExecutableCode = -1
                
                foreach ($i in 0..($lines.Count - 1)) {
                    $line = $lines[$i].Trim()
                    
                    # Skip header block comment
                    if ($line -eq "/**") {
                        $inHeader = $true
                        continue
                    }
                    if ($inHeader) {
                        if ($line -eq "*/") {
                            $inHeader = $false
                        }
                        continue
                    }
                    
                    # Skip empty lines and all comments
                    if ($line -eq "" -or $line.StartsWith("//") -or $line.StartsWith("/*") -or $line -match '^\s*\*' -or $line.EndsWith("*/")) {
                        continue
                    }
                    
                    # Track imports
                    if ($line.StartsWith("import ") -or $line.StartsWith("export import ")) {
                        $lastImportLine = $i
                    }
                    # Executable code: function calls, assignments, function definitions (but not declarations)
                    elseif ($firstExecutableCode -eq -1 -and `
                            -not ($line.StartsWith("interface ") -or $line.StartsWith("type ") -or `
                                  $line.StartsWith("class ") -or $line.StartsWith("enum ") -or `
                                  $line.StartsWith("abstract ") -or $line.StartsWith("export ") -or `
                                  $line.StartsWith("declare ") -or $line.StartsWith("const ") -or `
                                  $line.StartsWith("let ") -or $line.StartsWith("var ") -or `
                                  $line -eq "{" -or $line -eq "}" -or $line.StartsWith("//") -or `
                                  $line.StartsWith("function ") -or $line.StartsWith("async "))) {
                        # Check if this looks like executable code (not just a declaration)
                        if ($line -match '^\w+\(' -or $line -match '=\s*(?!.*=>)' -or $line -match 'return ') {
                            $firstExecutableCode = $i
                        }
                    }
                }
                
                # If there are imports and executable code, imports must come first
                if ($lastImportLine -ge 0 -and $firstExecutableCode -ge 0) {
                    return $lastImportLine -lt $firstExecutableCode
                }
                return $true
            }
            else {
                # For Python: imports should come after docstring but before executable code
                # (function defs, classes, constants are OK after imports)
                $lines = $Content -split "`n"
                $inDocstring = $false
                $lastImportLine = -1
                $firstFunctionOrClass = -1
                
                foreach ($i in 0..($lines.Count - 1)) {
                    $line = $lines[$i].Trim()
                    
                    # Handle docstring
                    if ($line.StartsWith('"""') -or $line.StartsWith("'''")) {
                        $inDocstring = -not $inDocstring
                        continue
                    }
                    if ($inDocstring) {
                        continue
                    }
                    
                    # Skip empty lines and comments
                    if ($line -eq "" -or $line.StartsWith("#")) {
                        continue
                    }
                    
                    # Track imports
                    if ($line.StartsWith("import ") -or $line.StartsWith("from ")) {
                        $lastImportLine = $i
                    }
                    # First function or class definition
                    elseif ($firstFunctionOrClass -eq -1 -and ($line.StartsWith("def ") -or $line.StartsWith("class "))) {
                        $firstFunctionOrClass = $i
                    }
                }
                
                # If there are imports and they come after a function/class definition, fail
                if ($lastImportLine -ge 0 -and $firstFunctionOrClass -ge 0) {
                    return $lastImportLine -lt $firstFunctionOrClass
                }
                return $true
            }
        }  # End Check script block
        Required = $true
    }
    @{
        Name     = "No bare try/catch"
        Check    = { param($Content, $Ext)
            if ($Ext -eq "ts") {
                # Should not have catch {} or catch(e) {} with empty body
                # Also check for catch without proper error handling
                if ($Content -match 'catch\s*\(\s*\w*\s*\)\s*\{\s*\}') {
                    return $false  # Found empty catch
                }
                if ($Content -match 'catch\s*\{\s*\}') {
                    return $false  # Found bare catch
                }
                return $true
            }
            else {
                # Python: should not have bare except: or except Exception: pass
                if ($Content -match 'except\s*:\s*pass') {
                    return $false
                }
                if ($Content -match 'except\s+Exception\s*:\s*pass') {
                    return $false
                }
                return $true
            }
        }
        Required = $true
    }
    @{
        Name     = "PLATFORM NOTES section"
        Check    = { param($Content, $Ext)
            return $Content -match 'PLATFORM NOTES'
        }
        Required = $true
    }
    @{
        Name     = "Self-contained imports"
        Check    = { param($Content, $Ext)
            # Should not have imports from parent directories
            if ($Content -match '(import|require|from)\s+.*\.\./|\bfrom\s+\.\.') {
                return $false
            }
            return $true
        }
        Required = $true
    }
)

$Results = @()
$TotalFailed = 0
$TotalWarnings = 0

foreach ($File in $RecipeFiles) {
    $Ext = $File.Extension.TrimStart('.')
    $Content = Get-Content -Path $File.FullName -Raw
    
    $PassedChecks = 0
    $FailedChecks = @()
    $WarningChecks = @()
    
    foreach ($Check in $Checks) {
        try {
            $CheckResult = & $Check.Check $Content $Ext
            
            if ($CheckResult) {
                $PassedChecks++
            }
            else {
                if ($Check.Required) {
                    $FailedChecks += $Check.Name
                }
                else {
                    $WarningChecks += $Check.Name
                }
            }
        }
        catch {
            if ($Check.Required) {
                $FailedChecks += "$($Check.Name) (error: $_)"
            }
        }
    }
    
    $Results += @{
        File          = $File.Name
        Passed        = $PassedChecks
        Total         = $Checks.Count
        FailedChecks  = $FailedChecks
        WarningChecks = $WarningChecks
    }
    
    if ($FailedChecks.Count -gt 0) {
        $TotalFailed++
    }
    if ($WarningChecks.Count -gt 0) {
        $TotalWarnings++
    }
}

# Output results
foreach ($Result in $Results) {
    $Status = "✅"
    $Color = $Colors.Green
    
    if ($Result.FailedChecks.Count -gt 0) {
        $Status = "❌"
        $Color = $Colors.Red
    }
    elseif ($Result.WarningChecks.Count -gt 0) {
        $Status = "⚠️ "
        $Color = $Colors.Yellow
    }
    
    $PassCount = "$($Result.Passed)/$($Result.Total)"
    Write-Host "  $Status $($Result.File.PadRight(30)) ($PassCount checks passed)" -ForegroundColor $Color
    
    if ($Result.FailedChecks.Count -gt 0) {
        $Missing = $Result.FailedChecks -join ", "
        Write-Host "     ❌ Failed: $Missing" -ForegroundColor $Colors.Red
    }
    
    if ($Result.WarningChecks.Count -gt 0) {
        $Missing = $Result.WarningChecks -join ", "
        Write-Host "     ⚠️  Warnings: $Missing" -ForegroundColor $Colors.Yellow
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Colors.DarkGray

$PassedCount = $Results.Count - $TotalFailed
$WarningText = if ($TotalWarnings -gt 0) { ", $TotalWarnings warning(s)" } else { "" }
Write-Host "Results: $PassedCount/$($Results.Count) passed$WarningText`n"

# Exit codes
$ExitCode = 0
if ($TotalFailed -gt 0) {
    $ExitCode = 1
}

exit $ExitCode
