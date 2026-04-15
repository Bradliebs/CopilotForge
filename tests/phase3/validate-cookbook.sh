#!/usr/bin/env bash
# ============================================================================
# CopilotForge Phase 3 — Cookbook Validation Script
# Owner: Tank (Tester)
#
# Validates Phase 3 cookbook output: recipe files, template files, header
# comments, imports, error handling, TODO markers, README completeness,
# FORGE.md markers, and jargon leaks.
# Usage: bash tests/phase3/validate-cookbook.sh <project-root>
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
  ((PASS_COUNT++)) || true
}

fail() {
  echo -e "  ${RED}✗ FAIL${NC}: $1"
  ((FAIL_COUNT++)) || true
}

warn() {
  echo -e "  ${YELLOW}⚠ WARN${NC}: $1"
  ((WARN_COUNT++)) || true
}

section() {
  echo ""
  echo -e "${BOLD}── $1 ──${NC}"
}

# --- Usage ---
if [ $# -lt 1 ]; then
  echo "Usage: bash tests/phase3/validate-cookbook.sh <project-root>"
  echo ""
  echo "  <project-root>  Path to the CopilotForge project directory"
  echo ""
  echo "Example:"
  echo "  bash tests/phase3/validate-cookbook.sh /home/user/Oracle_Prime"
  exit 1
fi

PROJECT_ROOT="$1"

if [ ! -d "$PROJECT_ROOT" ]; then
  echo -e "${RED}Error: '$PROJECT_ROOT' is not a directory${NC}"
  exit 1
fi

echo ""
echo -e "${BOLD}CopilotForge Phase 3 — Cookbook Validation${NC}"
echo "Project: $PROJECT_ROOT"
echo "Date:    $(date)"
echo ""

# ============================================================================
# Recipe & template file lists
# ============================================================================
RECIPE_NAMES=(
  "error-handling"
  "mcp-server"
  "api-client"
  "auth-middleware"
  "db-query"
  "route-handler"
)

TS_EXT=".ts"
PY_EXT=".py"

# ============================================================================
# 1. FILE EXISTENCE
# ============================================================================
section "1. File Existence — Cookbook Recipes (12 files)"

for name in "${RECIPE_NAMES[@]}"; do
  for ext in "$TS_EXT" "$PY_EXT"; do
    filepath="$PROJECT_ROOT/cookbook/${name}${ext}"
    if [ -f "$filepath" ]; then
      pass "Recipe exists: cookbook/${name}${ext}"
    else
      fail "Recipe missing: cookbook/${name}${ext}"
    fi
  done
done

section "1b. File Existence — Template Recipes (12 files)"

for name in "${RECIPE_NAMES[@]}"; do
  for ext in "$TS_EXT" "$PY_EXT"; do
    filepath="$PROJECT_ROOT/templates/cookbook/${name}${ext}"
    if [ -f "$filepath" ]; then
      pass "Template exists: templates/cookbook/${name}${ext}"
    else
      fail "Template missing: templates/cookbook/${name}${ext}"
    fi
  done
done

# ============================================================================
# 2. HEADER COMMENT CHECK
# ============================================================================
section "2. Header Comments — 4 Required Sections"

HEADER_SECTIONS=("WHAT THIS DOES" "WHEN TO USE THIS" "HOW TO RUN" "PREREQUISITES")

for name in "${RECIPE_NAMES[@]}"; do
  for ext in "$TS_EXT" "$PY_EXT"; do
    filepath="$PROJECT_ROOT/cookbook/${name}${ext}"
    [ -f "$filepath" ] || continue
    label="cookbook/${name}${ext}"

    content=$(cat "$filepath")
    missing=()

    for hs in "${HEADER_SECTIONS[@]}"; do
      if ! echo "$content" | grep -qi "$hs"; then
        missing+=("$hs")
      fi
    done

    if [ ${#missing[@]} -eq 0 ]; then
      pass "Header complete (4/4 sections): $label"
    else
      fail "Header missing ${#missing[@]} section(s) in $label: ${missing[*]}"
    fi
  done
done

# ============================================================================
# 3. IMPORT CHECK
# ============================================================================
section "3. Import Statements"

for name in "${RECIPE_NAMES[@]}"; do
  # TypeScript
  filepath="$PROJECT_ROOT/cookbook/${name}${TS_EXT}"
  if [ -f "$filepath" ]; then
    if grep -qE '^\s*import\s' "$filepath"; then
      pass "Has import statements: cookbook/${name}${TS_EXT}"
    else
      fail "No import statements found: cookbook/${name}${TS_EXT}"
    fi
  fi

  # Python
  filepath="$PROJECT_ROOT/cookbook/${name}${PY_EXT}"
  if [ -f "$filepath" ]; then
    if grep -qE '^\s*(import|from)\s' "$filepath"; then
      pass "Has import statements: cookbook/${name}${PY_EXT}"
    else
      fail "No import statements found: cookbook/${name}${PY_EXT}"
    fi
  fi
done

# ============================================================================
# 4. ERROR HANDLING CHECK
# ============================================================================
section "4. Error Handling"

for name in "${RECIPE_NAMES[@]}"; do
  # TypeScript — must have catch or throw
  filepath="$PROJECT_ROOT/cookbook/${name}${TS_EXT}"
  if [ -f "$filepath" ]; then
    if grep -qE '\bcatch\b|\bthrow\b' "$filepath"; then
      pass "Has error handling (catch/throw): cookbook/${name}${TS_EXT}"
    else
      fail "No error handling found (missing catch/throw): cookbook/${name}${TS_EXT}"
    fi
  fi

  # Python — must have except or raise
  filepath="$PROJECT_ROOT/cookbook/${name}${PY_EXT}"
  if [ -f "$filepath" ]; then
    if grep -qE '\bexcept\b|\braise\b' "$filepath"; then
      pass "Has error handling (except/raise): cookbook/${name}${PY_EXT}"
    else
      fail "No error handling found (missing except/raise): cookbook/${name}${PY_EXT}"
    fi
  fi
done

# ============================================================================
# 5. TODO MARKER CHECK
# ============================================================================
section "5. TODO Markers"

for name in "${RECIPE_NAMES[@]}"; do
  for ext in "$TS_EXT" "$PY_EXT"; do
    filepath="$PROJECT_ROOT/cookbook/${name}${ext}"
    [ -f "$filepath" ] || continue

    if grep -q 'TODO' "$filepath"; then
      pass "Has TODO marker: cookbook/${name}${ext}"
    else
      fail "No TODO marker found: cookbook/${name}${ext}"
    fi
  done
done

# ============================================================================
# 6. TEMPLATE PLACEHOLDER CHECK
# ============================================================================
section "6. Template Placeholder Syntax"

for name in "${RECIPE_NAMES[@]}"; do
  for ext in "$TS_EXT" "$PY_EXT"; do
    filepath="$PROJECT_ROOT/templates/cookbook/${name}${ext}"
    [ -f "$filepath" ] || continue

    if grep -q '{{' "$filepath"; then
      pass "Has {{placeholder}}: templates/cookbook/${name}${ext}"
    else
      fail "No {{placeholder}} found: templates/cookbook/${name}${ext}"
    fi
  done
done

# ============================================================================
# 7. README COMPLETENESS
# ============================================================================
section "7. README Completeness"

README_PATH="$PROJECT_ROOT/cookbook/README.md"

if [ ! -f "$README_PATH" ]; then
  fail "cookbook/README.md does not exist"
else
  readme_content=$(cat "$README_PATH")

  # Check every code file in cookbook/ is listed in README
  all_listed=true
  for code_file in "$PROJECT_ROOT"/cookbook/*.ts "$PROJECT_ROOT"/cookbook/*.py "$PROJECT_ROOT"/cookbook/*.go "$PROJECT_ROOT"/cookbook/*.cs; do
    [ -f "$code_file" ] || continue
    basename_file=$(basename "$code_file")

    # Skip README itself
    [ "$basename_file" = "README.md" ] && continue

    if echo "$readme_content" | grep -qF "$basename_file"; then
      pass "Listed in README: $basename_file"
    else
      fail "NOT listed in README: $basename_file"
      all_listed=false
    fi
  done

  if [ "$all_listed" = true ]; then
    pass "All cookbook code files are listed in README.md"
  fi
fi

# ============================================================================
# 8. JARGON CHECK
# ============================================================================
section "8. Jargon Leak Check"

BANNED_TERMS=("cookbook-writer" "skill-writer" "agent-writer" "memory-writer" "specialist")

jargon_found=false

# Check recipes
for code_file in "$PROJECT_ROOT"/cookbook/*.ts "$PROJECT_ROOT"/cookbook/*.py; do
  [ -f "$code_file" ] || continue
  basename_file=$(basename "$code_file")
  content=$(cat "$code_file")

  # Strip HTML comments before checking
  clean_content=$(echo "$content" | sed 's/<!--.*-->//g')

  for term in "${BANNED_TERMS[@]}"; do
    if echo "$clean_content" | grep -qi "$term"; then
      fail "Jargon leak: '$term' found in cookbook/$basename_file"
      jargon_found=true
    fi
  done
done

# Check templates
for tpl_file in "$PROJECT_ROOT"/templates/cookbook/*.ts "$PROJECT_ROOT"/templates/cookbook/*.py; do
  [ -f "$tpl_file" ] || continue
  basename_file=$(basename "$tpl_file")
  content=$(cat "$tpl_file")

  clean_content=$(echo "$content" | sed 's/<!--.*-->//g')

  for term in "${BANNED_TERMS[@]}"; do
    if echo "$clean_content" | grep -qi "$term"; then
      fail "Jargon leak: '$term' found in templates/cookbook/$basename_file"
      jargon_found=true
    fi
  done
done

# Check README
if [ -f "$README_PATH" ]; then
  readme_clean=$(cat "$README_PATH" | sed 's/<!--.*-->//g')
  for term in "${BANNED_TERMS[@]}"; do
    if echo "$readme_clean" | grep -qi "$term"; then
      fail "Jargon leak: '$term' found in cookbook/README.md"
      jargon_found=true
    fi
  done
fi

if [ "$jargon_found" = false ]; then
  pass "No jargon leaks detected in recipes, templates, or README"
fi

# ============================================================================
# 9. FORGE.md MARKERS
# ============================================================================
section "9. FORGE.md Cookbook Markers"

FORGE_PATH="$PROJECT_ROOT/templates/FORGE.md"

if [ ! -f "$FORGE_PATH" ]; then
  fail "templates/FORGE.md does not exist"
else
  forge_content=$(cat "$FORGE_PATH")

  if echo "$forge_content" | grep -q 'forge:cookbook-start'; then
    pass "FORGE.md has <!-- forge:cookbook-start --> marker"
  else
    fail "FORGE.md missing <!-- forge:cookbook-start --> marker"
  fi

  if echo "$forge_content" | grep -q 'forge:cookbook-end'; then
    pass "FORGE.md has <!-- forge:cookbook-end --> marker"
  else
    fail "FORGE.md missing <!-- forge:cookbook-end --> marker"
  fi
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Phase 3 Cookbook Validation Summary${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC}   $PASS_COUNT"
echo -e "  ${RED}Failed:${NC}   $FAIL_COUNT"
echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}RESULT: FAIL${NC} — $FAIL_COUNT check(s) did not pass."
  echo "  This is expected if Phase 3 recipes haven't been created yet."
  echo "  Review the failures above — they tell you what Phase 3 needs to deliver."
  exit 1
else
  echo -e "  ${GREEN}${BOLD}RESULT: PASS${NC} — All Phase 3 cookbook checks passed."
  if [ "$WARN_COUNT" -gt 0 ]; then
    echo "  ($WARN_COUNT warning(s) — review above for optional improvements)"
  fi
  exit 0
fi
