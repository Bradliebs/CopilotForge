#!/usr/bin/env bash
# ============================================================================
# CopilotForge Phase 4 — Memory Validation Script
# Owner: Tank (Tester)
#
# Validates Phase 4 memory output: new file existence, SKILL.md memory check,
# memory-writer read protocol, planner memory read phase, FORGE.md memory
# markers, recipe quality, template placeholders, README completeness,
# jargon check, and spec completeness.
# Usage: bash tests/phase4/validate-memory.sh <project-root>
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
  echo "Usage: bash tests/phase4/validate-memory.sh <project-root>"
  echo ""
  echo "  <project-root>  Path to the CopilotForge project directory"
  echo ""
  echo "Example:"
  echo "  bash tests/phase4/validate-memory.sh /home/user/Oracle_Prime"
  exit 1
fi

PROJECT_ROOT="$1"

if [ ! -d "$PROJECT_ROOT" ]; then
  echo -e "${RED}Error: '$PROJECT_ROOT' is not a directory${NC}"
  exit 1
fi

echo ""
echo -e "${BOLD}CopilotForge Phase 4 — Memory Validation${NC}"
echo "Project: $PROJECT_ROOT"
echo "Date:    $(date)"
echo ""

# Helper: strip HTML comments from content
strip_comments() {
  sed 's/<!--.*-->//g' | perl -0777 -pe 's/<!--.*?-->//gs' 2>/dev/null || cat
}

# ============================================================================
# 1. NEW FILE EXISTENCE
# ============================================================================
section "1. File Existence — Phase 4 New Files (10 files)"

NEW_FILES=(
  "templates/forge-memory/preferences.md"
  "templates/forge-memory/history.md"
  "templates/utils/memory-reader.md"
  "templates/utils/memory-summarizer.md"
  "templates/utils/convention-extractor.md"
  "cookbook/memory-reader.ts"
  "cookbook/memory-reader.py"
  "templates/cookbook/memory-reader.ts"
  "templates/cookbook/memory-reader.py"
  "docs/phase4-architecture.md"
)

for rel_path in "${NEW_FILES[@]}"; do
  filepath="$PROJECT_ROOT/$rel_path"
  if [ -f "$filepath" ]; then
    pass "File exists: $rel_path"
  else
    fail "File missing: $rel_path"
  fi
done

# ============================================================================
# 2. SKILL.MD MEMORY CHECK
# ============================================================================
section "2. SKILL.md — Memory Check (Step 0 / Adaptive Wizard)"

SKILL_PATH="$PROJECT_ROOT/.github/skills/planner/SKILL.md"

if [ ! -f "$SKILL_PATH" ]; then
  fail "SKILL.md does not exist at .github/skills/planner/SKILL.md"
else
  SKILL_CONTENT=$(cat "$SKILL_PATH")

  # Step 0 or Memory Check section
  if echo "$SKILL_CONTENT" | grep -qiE 'Step\s*0|Memory\s*Check'; then
    pass "SKILL.md has Step 0 or Memory Check section"
  else
    fail "SKILL.md missing Step 0 / Memory Check section"
  fi

  # Welcome back / returning user flow
  if echo "$SKILL_CONTENT" | grep -qiE 'Welcome\s+back|returning\s+user'; then
    pass "SKILL.md has returning user flow (Welcome back)"
  else
    fail "SKILL.md missing returning user flow (no 'Welcome back' or 'returning user')"
  fi

  # Adaptive wizard logic
  if echo "$SKILL_CONTENT" | grep -qiE 'skip|pre-?populate|adaptive'; then
    pass "SKILL.md has adaptive wizard logic (skip/pre-populate)"
  else
    fail "SKILL.md missing adaptive wizard logic (no skip/pre-populate/adaptive)"
  fi
fi

# ============================================================================
# 3. MEMORY-WRITER READ PROTOCOL
# ============================================================================
section "3. Memory-Writer — Read Protocol"

MW_PATH="$PROJECT_ROOT/.copilot/agents/memory-writer.md"

if [ ! -f "$MW_PATH" ]; then
  fail "memory-writer.md does not exist at .copilot/agents/memory-writer.md"
else
  MW_CONTENT=$(cat "$MW_PATH")

  # Read or Read Protocol mention
  if echo "$MW_CONTENT" | grep -qiE 'read.*protocol|read-write\s+cycle|read\s+phase|read\s+existing'; then
    pass "memory-writer.md mentions read protocol / read-write cycle"
  else
    fail "memory-writer.md missing read protocol reference"
  fi

  # References preferences.md
  if echo "$MW_CONTENT" | grep -qi 'preferences\.md'; then
    pass "memory-writer.md references preferences.md"
  else
    fail "memory-writer.md does not reference preferences.md"
  fi

  # References history.md
  if echo "$MW_CONTENT" | grep -qi 'history\.md'; then
    pass "memory-writer.md references history.md"
  else
    fail "memory-writer.md does not reference history.md"
  fi
fi

# ============================================================================
# 4. PLANNER MEMORY READ PHASE
# ============================================================================
section "4. Planner — Memory Read Phase"

PLANNER_PATH="$PROJECT_ROOT/.copilot/agents/planner.md"

if [ ! -f "$PLANNER_PATH" ]; then
  fail "planner.md does not exist at .copilot/agents/planner.md"
else
  PLANNER_CONTENT=$(cat "$PLANNER_PATH")

  # Memory Read or memory-reader mention
  if echo "$PLANNER_CONTENT" | grep -qiE 'Memory\s+Read|memory-reader'; then
    pass "planner.md mentions Memory Read phase or memory-reader"
  else
    fail "planner.md missing Memory Read phase / memory-reader reference"
  fi

  # FORGE-CONTEXT includes conventions/preferences
  if echo "$PLANNER_CONTENT" | grep -qiE 'conventions|preferences'; then
    pass "planner.md FORGE-CONTEXT references conventions or preferences"
  else
    fail "planner.md FORGE-CONTEXT missing conventions/preferences fields"
  fi
fi

# ============================================================================
# 5. FORGE.MD MEMORY MARKERS
# ============================================================================
section "5. FORGE.md — Memory Markers"

FORGE_PATH="$PROJECT_ROOT/templates/FORGE.md"

if [ ! -f "$FORGE_PATH" ]; then
  fail "templates/FORGE.md does not exist"
else
  FORGE_CONTENT=$(cat "$FORGE_PATH")

  if echo "$FORGE_CONTENT" | grep -q 'forge:memory-start'; then
    pass "FORGE.md has <!-- forge:memory-start --> marker"
  else
    fail "FORGE.md missing <!-- forge:memory-start --> marker"
  fi

  if echo "$FORGE_CONTENT" | grep -q 'forge:memory-end'; then
    pass "FORGE.md has <!-- forge:memory-end --> marker"
  else
    fail "FORGE.md missing <!-- forge:memory-end --> marker"
  fi

  if echo "$FORGE_CONTENT" | grep -qiE 'Memory\s+Status'; then
    pass "FORGE.md has Memory Status section"
  else
    fail "FORGE.md missing Memory Status section heading"
  fi
fi

# ============================================================================
# 6. RECIPE QUALITY — memory-reader.ts and .py
# ============================================================================
section "6. Recipe Quality — memory-reader (Header, Imports, Error Handling, TODO)"

HEADER_SECTIONS=("WHAT THIS DOES" "WHEN TO USE THIS" "HOW TO RUN" "PREREQUISITES")

# --- TypeScript recipe ---
TS_PATH="$PROJECT_ROOT/cookbook/memory-reader.ts"
if [ -f "$TS_PATH" ]; then
  TS_CONTENT=$(cat "$TS_PATH")

  ts_missing=0
  ts_missing_names=""
  for hs in "${HEADER_SECTIONS[@]}"; do
    if ! echo "$TS_CONTENT" | grep -qF "$hs"; then
      ((ts_missing++)) || true
      ts_missing_names="$ts_missing_names, $hs"
    fi
  done
  if [ "$ts_missing" -eq 0 ]; then
    pass "Header complete (4/4 sections): cookbook/memory-reader.ts"
  else
    fail "Header missing ${ts_missing} section(s) in cookbook/memory-reader.ts:${ts_missing_names}"
  fi

  if echo "$TS_CONTENT" | grep -qE '^\s*import\s'; then
    pass "Has import statements: cookbook/memory-reader.ts"
  else
    fail "No import statements found: cookbook/memory-reader.ts"
  fi

  if echo "$TS_CONTENT" | grep -qE '\bcatch\b|\bthrow\b'; then
    pass "Has error handling (catch/throw): cookbook/memory-reader.ts"
  else
    fail "No error handling (missing catch/throw): cookbook/memory-reader.ts"
  fi

  if echo "$TS_CONTENT" | grep -qF 'TODO'; then
    pass "Has TODO marker: cookbook/memory-reader.ts"
  else
    fail "No TODO marker found: cookbook/memory-reader.ts"
  fi
else
  warn "Skipping recipe quality checks — cookbook/memory-reader.ts does not exist"
fi

# --- Python recipe ---
PY_PATH="$PROJECT_ROOT/cookbook/memory-reader.py"
if [ -f "$PY_PATH" ]; then
  PY_CONTENT=$(cat "$PY_PATH")

  py_missing=0
  py_missing_names=""
  for hs in "${HEADER_SECTIONS[@]}"; do
    if ! echo "$PY_CONTENT" | grep -qF "$hs"; then
      ((py_missing++)) || true
      py_missing_names="$py_missing_names, $hs"
    fi
  done
  if [ "$py_missing" -eq 0 ]; then
    pass "Header complete (4/4 sections): cookbook/memory-reader.py"
  else
    fail "Header missing ${py_missing} section(s) in cookbook/memory-reader.py:${py_missing_names}"
  fi

  if echo "$PY_CONTENT" | grep -qE '^\s*(import|from)\s'; then
    pass "Has import statements: cookbook/memory-reader.py"
  else
    fail "No import statements found: cookbook/memory-reader.py"
  fi

  if echo "$PY_CONTENT" | grep -qE '\bexcept\b|\braise\b'; then
    pass "Has error handling (except/raise): cookbook/memory-reader.py"
  else
    fail "No error handling (missing except/raise): cookbook/memory-reader.py"
  fi

  if echo "$PY_CONTENT" | grep -qF 'TODO'; then
    pass "Has TODO marker: cookbook/memory-reader.py"
  else
    fail "No TODO marker found: cookbook/memory-reader.py"
  fi
else
  warn "Skipping recipe quality checks — cookbook/memory-reader.py does not exist"
fi

# ============================================================================
# 7. TEMPLATE PLACEHOLDERS
# ============================================================================
section "7. Template Placeholder Syntax ({{placeholder}})"

PLACEHOLDER_FILES=(
  "templates/cookbook/memory-reader.ts"
  "templates/cookbook/memory-reader.py"
  "templates/forge-memory/preferences.md"
  "templates/forge-memory/history.md"
)

for rel_path in "${PLACEHOLDER_FILES[@]}"; do
  filepath="$PROJECT_ROOT/$rel_path"
  if [ -f "$filepath" ]; then
    if grep -qF '{{' "$filepath"; then
      pass "Has {{placeholder}}: $rel_path"
    else
      fail "No {{placeholder}} found: $rel_path"
    fi
  else
    fail "File missing (can't check placeholders): $rel_path"
  fi
done

# ============================================================================
# 8. README COMPLETENESS
# ============================================================================
section "8. README Completeness — Memory Recipes Listed"

README_PATH="$PROJECT_ROOT/cookbook/README.md"

if [ ! -f "$README_PATH" ]; then
  fail "cookbook/README.md does not exist"
else
  if grep -qF 'memory-reader.ts' "$README_PATH"; then
    pass "README lists memory-reader.ts"
  else
    fail "README does NOT list memory-reader.ts"
  fi

  if grep -qF 'memory-reader.py' "$README_PATH"; then
    pass "README lists memory-reader.py"
  else
    fail "README does NOT list memory-reader.py"
  fi
fi

# ============================================================================
# 9. JARGON CHECK
# ============================================================================
section "9. Jargon Leak Check — Phase 4 Files"

BANNED_TERMS=("cookbook-writer" "skill-writer" "agent-writer" "memory-writer" "specialist")

JARGON_FOUND=false

check_jargon() {
  local filepath="$1"
  local label="$2"

  if [ ! -f "$filepath" ]; then return; fi

  # Strip HTML comments, then check for banned terms
  local clean_content
  clean_content=$(cat "$filepath" | perl -0777 -pe 's/<!--.*?-->//gs' 2>/dev/null || cat "$filepath")

  for term in "${BANNED_TERMS[@]}"; do
    if echo "$clean_content" | grep -qiF "$term"; then
      fail "Jargon leak: '$term' found in $label"
      JARGON_FOUND=true
    fi
  done
}

# New recipes
check_jargon "$PROJECT_ROOT/cookbook/memory-reader.ts" "cookbook/memory-reader.ts"
check_jargon "$PROJECT_ROOT/cookbook/memory-reader.py" "cookbook/memory-reader.py"

# New templates
check_jargon "$PROJECT_ROOT/templates/cookbook/memory-reader.ts" "templates/cookbook/memory-reader.ts"
check_jargon "$PROJECT_ROOT/templates/cookbook/memory-reader.py" "templates/cookbook/memory-reader.py"
check_jargon "$PROJECT_ROOT/templates/forge-memory/preferences.md" "templates/forge-memory/preferences.md"
check_jargon "$PROJECT_ROOT/templates/forge-memory/history.md" "templates/forge-memory/history.md"

# Utility specs
check_jargon "$PROJECT_ROOT/templates/utils/memory-reader.md" "templates/utils/memory-reader.md"
check_jargon "$PROJECT_ROOT/templates/utils/memory-summarizer.md" "templates/utils/memory-summarizer.md"
check_jargon "$PROJECT_ROOT/templates/utils/convention-extractor.md" "templates/utils/convention-extractor.md"

# Architecture doc
check_jargon "$PROJECT_ROOT/docs/phase4-architecture.md" "docs/phase4-architecture.md"

if [ "$JARGON_FOUND" = false ]; then
  pass "No jargon leaks detected in Phase 4 files"
fi

# ============================================================================
# 10. SPEC COMPLETENESS
# ============================================================================
section "10. Spec Completeness — Utility Specs"

# memory-reader.md — Error Handling section
MR_SPEC="$PROJECT_ROOT/templates/utils/memory-reader.md"
if [ -f "$MR_SPEC" ]; then
  if grep -qiE 'Error\s+Handling' "$MR_SPEC"; then
    pass "memory-reader.md has Error Handling section"
  else
    fail "memory-reader.md missing Error Handling section"
  fi
else
  fail "templates/utils/memory-reader.md does not exist (can't check spec)"
fi

# memory-summarizer.md — Summarization or Archive
MS_SPEC="$PROJECT_ROOT/templates/utils/memory-summarizer.md"
if [ -f "$MS_SPEC" ]; then
  if grep -qiE 'Summariz|Archive' "$MS_SPEC"; then
    pass "memory-summarizer.md has Summarization/Archive content"
  else
    fail "memory-summarizer.md missing Summarization/Archive content"
  fi
else
  fail "templates/utils/memory-summarizer.md does not exist (can't check spec)"
fi

# convention-extractor.md — Confidence
CE_SPEC="$PROJECT_ROOT/templates/utils/convention-extractor.md"
if [ -f "$CE_SPEC" ]; then
  if grep -qi 'confidence' "$CE_SPEC"; then
    pass "convention-extractor.md mentions confidence levels"
  else
    fail "convention-extractor.md missing confidence level content"
  fi
else
  fail "templates/utils/convention-extractor.md does not exist (can't check spec)"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Phase 4 Memory Validation Summary${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:   $PASS_COUNT${NC}"
echo -e "  ${RED}Failed:   $FAIL_COUNT${NC}"
echo -e "  ${YELLOW}Warnings: $WARN_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "  ${RED}RESULT: FAIL — ${FAIL_COUNT} check(s) did not pass.${NC}"
  echo "  This is expected if Phase 4 files haven't been created yet."
  echo "  Review the failures above — they tell you what Phase 4 needs to deliver."
  exit 1
else
  echo -e "  ${GREEN}RESULT: PASS — All Phase 4 memory checks passed.${NC}"
  if [ "$WARN_COUNT" -gt 0 ]; then
    echo "  ($WARN_COUNT warning(s) — review above for optional improvements)"
  fi
  exit 0
fi