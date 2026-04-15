#!/usr/bin/env bash
# ============================================================================
# CopilotForge Phase 1 — Scaffold Validation Script
# Owner: Tank (Tester)
#
# Validates the output of a Planner skill run against expected structure.
# Usage: bash tests/validate-scaffold.sh <project-root>
# Exit code 0 = all checks pass, 1 = one or more failures
# ============================================================================

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

# --- Counters ---
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
  echo -e "  ${GREEN}✓ PASS${NC}: $1"
  ((PASS_COUNT++))
}

fail() {
  echo -e "  ${RED}✗ FAIL${NC}: $1"
  ((FAIL_COUNT++))
}

warn() {
  echo -e "  ${YELLOW}⚠ WARN${NC}: $1"
  ((WARN_COUNT++))
}

section() {
  echo ""
  echo -e "${BOLD}── $1 ──${NC}"
}

# --- Usage ---
if [ $# -lt 1 ]; then
  echo "Usage: bash tests/validate-scaffold.sh <project-root>"
  echo ""
  echo "  <project-root>  Path to the scaffolded project directory"
  echo ""
  echo "Example:"
  echo "  bash tests/validate-scaffold.sh /home/user/my-project"
  exit 1
fi

PROJECT_ROOT="$1"

if [ ! -d "$PROJECT_ROOT" ]; then
  echo -e "${RED}Error: '$PROJECT_ROOT' is not a directory${NC}"
  exit 1
fi

echo ""
echo -e "${BOLD}CopilotForge Phase 1 — Scaffold Validation${NC}"
echo "Project: $PROJECT_ROOT"
echo "Date:    $(date)"
echo ""

# ============================================================================
# 1. DIRECTORY EXISTENCE
# ============================================================================
section "Directory Structure"

REQUIRED_DIRS=(
  ".copilot/agents"
  ".github/skills"
  "forge-memory"
  "cookbook"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$PROJECT_ROOT/$dir" ]; then
    pass "Directory exists: $dir/"
  else
    fail "Missing directory: $dir/"
  fi
done

# ============================================================================
# 2. REQUIRED FILES
# ============================================================================
section "Required Files"

REQUIRED_FILES=(
  "FORGE.md"
  "forge-memory/decisions.md"
  "forge-memory/patterns.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/$file" ]; then
    pass "File exists: $file"
  else
    fail "Missing file: $file"
  fi
done

# Check that at least one agent file exists
AGENT_COUNT=$(find "$PROJECT_ROOT/.copilot/agents" -name "*.md" 2>/dev/null | wc -l)
if [ "$AGENT_COUNT" -gt 0 ]; then
  pass "Agent files found: $AGENT_COUNT .md file(s) in .copilot/agents/"
else
  fail "No agent .md files found in .copilot/agents/"
fi

# Check for expected agent files (planner, reviewer, tester)
for agent in planner reviewer tester; do
  if [ -f "$PROJECT_ROOT/.copilot/agents/${agent}.md" ]; then
    pass "Agent file exists: .copilot/agents/${agent}.md"
  else
    warn "Expected agent file missing: .copilot/agents/${agent}.md"
  fi
done

# Check that at least one skill directory exists
SKILL_COUNT=$(find "$PROJECT_ROOT/.github/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
if [ "$SKILL_COUNT" -gt 0 ]; then
  pass "Skill directories found: $SKILL_COUNT in .github/skills/"
else
  fail "No skill directories found in .github/skills/"
fi

# Check each skill directory has a SKILL.md
if [ "$SKILL_COUNT" -gt 0 ]; then
  for skill_dir in "$PROJECT_ROOT/.github/skills"/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "${skill_dir}SKILL.md" ]; then
      pass "SKILL.md exists in .github/skills/${skill_name}/"
    else
      fail "Missing SKILL.md in .github/skills/${skill_name}/"
    fi
  done
fi

# ============================================================================
# 3. FORGE.md CONTENT VALIDATION
# ============================================================================
section "FORGE.md Content"

if [ -f "$PROJECT_ROOT/FORGE.md" ]; then
  FORGE_CONTENT=$(cat "$PROJECT_ROOT/FORGE.md")

  # Required sections (case-insensitive search for headers)
  declare -A REQUIRED_SECTIONS
  REQUIRED_SECTIONS=(
    ["project summary"]="Tells the user what was created and why"
    ["team roster"]="Lists the agents and their roles"
    ["skills index"]="Lists available skills and how to use them"
  )

  for section_name in "${!REQUIRED_SECTIONS[@]}"; do
    if echo "$FORGE_CONTENT" | grep -qi "$section_name"; then
      pass "FORGE.md contains section: $section_name"
    else
      fail "FORGE.md missing section: $section_name — ${REQUIRED_SECTIONS[$section_name]}"
    fi
  done

  # Check FORGE.md is not empty or trivially short
  FORGE_LINES=$(echo "$FORGE_CONTENT" | wc -l)
  if [ "$FORGE_LINES" -ge 20 ]; then
    pass "FORGE.md has substantial content ($FORGE_LINES lines)"
  else
    warn "FORGE.md seems short ($FORGE_LINES lines) — may be incomplete"
  fi

  # Check for "how to edit" / "how to add" instructions
  if echo "$FORGE_CONTENT" | grep -qi "how to\|getting started\|next steps\|what to do"; then
    pass "FORGE.md contains actionable instructions"
  else
    fail "FORGE.md lacks actionable instructions (how to edit, next steps, etc.)"
  fi
else
  fail "Cannot validate FORGE.md content — file does not exist"
fi

# ============================================================================
# 4. SKILL.md FRONTMATTER VALIDATION
# ============================================================================
section "SKILL.md Frontmatter"

validate_frontmatter() {
  local file="$1"
  local rel_path="${file#$PROJECT_ROOT/}"

  # Check file starts with ---
  if head -1 "$file" | grep -q "^---"; then
    # Check for closing ---
    local closing_line=$(tail -n +2 "$file" | grep -n "^---" | head -1 | cut -d: -f1)
    if [ -n "$closing_line" ]; then
      pass "Valid frontmatter delimiters: $rel_path"

      # Extract frontmatter and check for required fields
      local frontmatter=$(sed -n "2,${closing_line}p" "$file")

      # Check for 'name' field
      if echo "$frontmatter" | grep -q "^name:"; then
        pass "Frontmatter has 'name' field: $rel_path"
      else
        warn "Frontmatter missing 'name' field: $rel_path"
      fi

      # Check for 'description' field
      if echo "$frontmatter" | grep -q "^description:"; then
        pass "Frontmatter has 'description' field: $rel_path"
      else
        warn "Frontmatter missing 'description' field: $rel_path"
      fi

      # Basic YAML validity: no tabs (YAML uses spaces)
      if echo "$frontmatter" | grep -qP "\t"; then
        fail "Frontmatter contains tabs (invalid YAML): $rel_path"
      else
        pass "Frontmatter uses spaces not tabs: $rel_path"
      fi
    else
      fail "Frontmatter missing closing '---': $rel_path"
    fi
  else
    fail "No frontmatter found (file doesn't start with '---'): $rel_path"
  fi
}

SKILL_FILES=$(find "$PROJECT_ROOT/.github/skills" -name "SKILL.md" 2>/dev/null)
if [ -n "$SKILL_FILES" ]; then
  while IFS= read -r skill_file; do
    validate_frontmatter "$skill_file"
  done <<< "$SKILL_FILES"
else
  fail "No SKILL.md files found to validate frontmatter"
fi

# ============================================================================
# 5. COOKBOOK SYNTAX CHECKS
# ============================================================================
section "Cookbook Validation"

COOKBOOK_DIR="$PROJECT_ROOT/cookbook"
if [ -d "$COOKBOOK_DIR" ]; then
  COOKBOOK_FILES=$(find "$COOKBOOK_DIR" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) 2>/dev/null)

  if [ -n "$COOKBOOK_FILES" ]; then
    while IFS= read -r cb_file; do
      rel_path="${cb_file#$PROJECT_ROOT/}"

      # Check file is not empty
      if [ ! -s "$cb_file" ]; then
        fail "Empty cookbook file: $rel_path"
        continue
      fi

      # TypeScript/JavaScript basic syntax check
      if [[ "$cb_file" == *.ts ]] || [[ "$cb_file" == *.js ]]; then
        # Check for unmatched braces (simple heuristic)
        OPEN_BRACES=$(grep -o "{" "$cb_file" | wc -l)
        CLOSE_BRACES=$(grep -o "}" "$cb_file" | wc -l)
        if [ "$OPEN_BRACES" -eq "$CLOSE_BRACES" ]; then
          pass "Balanced braces: $rel_path ({$OPEN_BRACES} / }$CLOSE_BRACES)"
        else
          fail "Unbalanced braces: $rel_path ({$OPEN_BRACES} / }$CLOSE_BRACES)"
        fi

        # If node is available, try syntax check
        if command -v node &>/dev/null && [[ "$cb_file" == *.js ]]; then
          if node --check "$cb_file" 2>/dev/null; then
            pass "Node syntax check passed: $rel_path"
          else
            fail "Node syntax check failed: $rel_path"
          fi
        fi
      fi

      # Python basic syntax check
      if [[ "$cb_file" == *.py ]]; then
        if command -v python3 &>/dev/null; then
          if python3 -c "import ast; ast.parse(open('$cb_file').read())" 2>/dev/null; then
            pass "Python syntax check passed: $rel_path"
          else
            fail "Python syntax check failed: $rel_path"
          fi
        elif command -v python &>/dev/null; then
          if python -c "import ast; ast.parse(open('$cb_file').read())" 2>/dev/null; then
            pass "Python syntax check passed: $rel_path"
          else
            fail "Python syntax check failed: $rel_path"
          fi
        else
          warn "Python not available — skipping syntax check: $rel_path"
        fi
      fi

      pass "Cookbook file is non-empty: $rel_path"
    done <<< "$COOKBOOK_FILES"
  else
    warn "No .ts, .js, or .py files found in cookbook/"
  fi
else
  fail "cookbook/ directory does not exist"
fi

# ============================================================================
# 6. CROSS-REFERENCE CONSISTENCY
# ============================================================================
section "Cross-Reference Consistency"

if [ -f "$PROJECT_ROOT/FORGE.md" ]; then
  # Extract file paths referenced in FORGE.md (look for paths with extensions or known dirs)
  REFERENCED_PATHS=$(grep -oP '(?:\.copilot|\.github|forge-memory|cookbook)/[^\s\)\]`"'"'"']+' "$PROJECT_ROOT/FORGE.md" 2>/dev/null | sort -u)

  if [ -n "$REFERENCED_PATHS" ]; then
    while IFS= read -r ref_path; do
      # Strip trailing punctuation
      ref_path=$(echo "$ref_path" | sed 's/[.,;:!?)]*$//')
      if [ -e "$PROJECT_ROOT/$ref_path" ]; then
        pass "Referenced path exists: $ref_path"
      else
        fail "FORGE.md references non-existent path: $ref_path"
      fi
    done <<< "$REFERENCED_PATHS"
  else
    warn "No file paths detected in FORGE.md — cross-reference check skipped"
  fi
else
  fail "Cannot check cross-references — FORGE.md does not exist"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Validation Summary${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC}   $PASS_COUNT"
echo -e "  ${RED}Failed:${NC}   $FAIL_COUNT"
echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}RESULT: FAIL${NC} — $FAIL_COUNT check(s) did not pass."
  echo "  Review the failures above and re-run the Planner skill."
  exit 1
else
  echo -e "  ${GREEN}${BOLD}RESULT: PASS${NC} — All checks passed."
  if [ "$WARN_COUNT" -gt 0 ]; then
    echo "  ($WARN_COUNT warning(s) — review above for optional improvements)"
  fi
  exit 0
fi
