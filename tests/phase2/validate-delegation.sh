#!/usr/bin/env bash
# ============================================================================
# CopilotForge Phase 2 — Delegation Validation Script
# Owner: Tank (Tester)
#
# Validates Phase 2 delegation output: specialist agent files, templates,
# delegation protocol, cookbook recipes, and cross-reference consistency.
# Usage: bash tests/phase2/validate-delegation.sh <project-root>
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
  echo "Usage: bash tests/phase2/validate-delegation.sh <project-root>"
  echo ""
  echo "  <project-root>  Path to the CopilotForge project directory"
  echo ""
  echo "Example:"
  echo "  bash tests/phase2/validate-delegation.sh /home/user/Oracle_Prime"
  exit 1
fi

PROJECT_ROOT="$1"

if [ ! -d "$PROJECT_ROOT" ]; then
  echo -e "${RED}Error: '$PROJECT_ROOT' is not a directory${NC}"
  exit 1
fi

echo ""
echo -e "${BOLD}CopilotForge Phase 2 — Delegation Validation${NC}"
echo "Project: $PROJECT_ROOT"
echo "Date:    $(date)"
echo ""

# ============================================================================
# 1. SPECIALIST AGENT FILES
# ============================================================================
section "Specialist Agent Files"

AGENTS_DIR=""
if [ -d "$PROJECT_ROOT/.copilot/agents" ]; then
  AGENTS_DIR="$PROJECT_ROOT/.copilot/agents"
  pass "Agents directory exists: .copilot/agents/"
elif [ -d "$PROJECT_ROOT/.github/agents" ]; then
  AGENTS_DIR="$PROJECT_ROOT/.github/agents"
  pass "Agents directory exists: .github/agents/"
else
  fail "No agents directory found (.copilot/agents/ or .github/agents/)"
fi

SPECIALISTS=("skill-writer" "agent-writer" "memory-writer" "cookbook-writer")
SPECIALIST_DESCS=(
  "Writes skill SKILL.md files"
  "Writes agent definition files"
  "Writes forge-memory files"
  "Writes cookbook recipe files"
)

SEARCH_DIRS=(
  "$PROJECT_ROOT/templates/agents"
  "$PROJECT_ROOT/.copilot/agents"
  "$PROJECT_ROOT/.github/agents"
)

for i in "${!SPECIALISTS[@]}"; do
  name="${SPECIALISTS[$i]}"
  desc="${SPECIALIST_DESCS[$i]}"
  found=false

  for search_dir in "${SEARCH_DIRS[@]}"; do
    agent_path="$search_dir/${name}.md"
    if [ -f "$agent_path" ]; then
      found=true
      rel_path="${agent_path#$PROJECT_ROOT/}"
      pass "Specialist agent file exists: $rel_path"

      content=$(cat "$agent_path")

      # Check for Role section
      if echo "$content" | grep -qi "role"; then
        pass "  Has 'Role' section: ${name}.md"
      else
        fail "  Missing 'Role' section: ${name}.md"
      fi

      # Check for Boundaries section
      if echo "$content" | grep -qi "boundar"; then
        pass "  Has 'Boundaries' section: ${name}.md"
      else
        fail "  Missing 'Boundaries' section: ${name}.md"
      fi

      # Check file length
      line_count=$(wc -l < "$agent_path")
      if [ "$line_count" -ge 10 ]; then
        pass "  Substantial content ($line_count lines): ${name}.md"
      else
        warn "  Very short ($line_count lines) — may be a stub: ${name}.md"
      fi
      break
    fi
  done

  if [ "$found" = false ]; then
    fail "Specialist agent file missing: ${name}.md — $desc"
  fi
done

# ============================================================================
# 2. DELEGATION PROTOCOL DOCUMENTATION
# ============================================================================
section "Delegation Protocol"

DELEGATION_PATHS=(
  "$PROJECT_ROOT/docs/delegation-protocol.md"
  "$PROJECT_ROOT/.copilot/delegation-protocol.md"
  "$PROJECT_ROOT/templates/delegation-protocol.md"
)

delegation_found=false
for dpath in "${DELEGATION_PATHS[@]}"; do
  if [ -f "$dpath" ]; then
    delegation_found=true
    rel_path="${dpath#$PROJECT_ROOT/}"
    pass "Delegation protocol exists: $rel_path"

    content=$(cat "$dpath")
    char_count=${#content}
    if [ "$char_count" -gt 100 ]; then
      pass "Delegation protocol has substantial content ($char_count chars)"
    else
      warn "Delegation protocol seems very short ($char_count chars)"
    fi

    # Check for key topics
    topic_hits=0
    for topic in "skill-writer" "agent-writer" "memory-writer" "cookbook-writer" "order" "depend"; do
      if echo "$content" | grep -qi "$topic"; then
        ((topic_hits++)) || true
      fi
    done
    if [ "$topic_hits" -ge 3 ]; then
      pass "Delegation protocol covers key topics ($topic_hits/6)"
    else
      warn "Delegation protocol may be incomplete — only $topic_hits/6 key topics found"
    fi
    break
  fi
done

if [ "$delegation_found" = false ]; then
  fail "Delegation protocol missing — expected at docs/delegation-protocol.md"
fi

# ============================================================================
# 3. SPECIALIST TEMPLATES
# ============================================================================
section "Specialist Templates"

TEMPLATE_AGENTS_DIR="$PROJECT_ROOT/templates/agents"
if [ -d "$TEMPLATE_AGENTS_DIR" ]; then
  pass "Templates agents directory exists"

  template_count=$(find "$TEMPLATE_AGENTS_DIR" -maxdepth 1 -name "*.md" | wc -l)
  if [ "$template_count" -ge 4 ]; then
    pass "At least 4 agent templates found ($template_count total)"
  else
    warn "Expected 4+ agent templates, found $template_count"
  fi

  for name in "${SPECIALISTS[@]}"; do
    tpl_path="$TEMPLATE_AGENTS_DIR/${name}.md"
    if [ -f "$tpl_path" ]; then
      pass "Specialist template exists: templates/agents/${name}.md"
    else
      fail "Missing specialist template: templates/agents/${name}.md"
    fi
  done
else
  fail "Templates agents directory missing: templates/agents/"
fi

# ============================================================================
# 4. FORGE.md TEMPLATE UPDATES
# ============================================================================
section "FORGE.md Template Updates"

FORGE_TEMPLATE="$PROJECT_ROOT/templates/FORGE.md"
if [ -f "$FORGE_TEMPLATE" ]; then
  forge_content=$(cat "$FORGE_TEMPLATE")

  if echo "$forge_content" | grep -qi "team roster"; then
    pass "FORGE.md template has Team Roster section"
  else
    fail "FORGE.md template missing Team Roster section"
  fi

  if echo "$forge_content" | grep -qi "skills index"; then
    pass "FORGE.md template has Skills Index section"
  else
    fail "FORGE.md template missing Skills Index section"
  fi

  if echo "$forge_content" | grep -qi "quick action"; then
    pass "FORGE.md template has Quick Actions section"
  else
    fail "FORGE.md template missing Quick Actions section"
  fi

  if echo "$forge_content" | grep -qi "memory"; then
    pass "FORGE.md template references memory"
  else
    warn "FORGE.md template doesn't seem to reference memory"
  fi
else
  fail "FORGE.md template missing: templates/FORGE.md"
fi

# ============================================================================
# 5. COOKBOOK TEMPLATES
# ============================================================================
section "Cookbook Templates"

COOKBOOK_TEMPLATE_DIR="$PROJECT_ROOT/templates/cookbook"
if [ -d "$COOKBOOK_TEMPLATE_DIR" ]; then
  cb_count=$(find "$COOKBOOK_TEMPLATE_DIR" -maxdepth 2 -type f | wc -l)

  if [ "$cb_count" -ge 1 ]; then
    pass "Cookbook templates found: $cb_count file(s)"

    for cb_file in "$COOKBOOK_TEMPLATE_DIR"/*; do
      [ -f "$cb_file" ] || continue
      rel_path="${cb_file#$PROJECT_ROOT/}"

      if [ ! -s "$cb_file" ]; then
        fail "Empty cookbook template: $rel_path"
        continue
      fi

      # Check for header comment
      first_line=$(head -1 "$cb_file")
      if echo "$first_line" | grep -qE "^(//|#|/\*|<!--|''')" ; then
        pass "Has header comment: $rel_path"
      else
        warn "Missing header comment: $rel_path — recipes should explain their purpose"
      fi

      pass "Cookbook template is non-empty: $rel_path"
    done
  else
    warn "No cookbook template files found"
  fi
else
  fail "Cookbook templates directory missing: templates/cookbook/"
fi

# ============================================================================
# 6. CROSS-REFERENCE CONSISTENCY
# ============================================================================
section "Cross-Reference Consistency"

# Collect skill names
SKILL_NAMES=()
SKILLS_DIR="$PROJECT_ROOT/.github/skills"
if [ -d "$SKILLS_DIR" ]; then
  for skill_dir in "$SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    SKILL_NAMES+=("$(basename "$skill_dir")")
  done
fi

# Check agent files don't reference nonexistent skills
for search_dir in "${SEARCH_DIRS[@]}"; do
  [ -d "$search_dir" ] || continue
  for af in "$search_dir"/*.md; do
    [ -f "$af" ] || continue
    rel_path="${af#$PROJECT_ROOT/}"
    content=$(cat "$af")

    # Look for skill references
    skill_refs=$(echo "$content" | grep -oP '\.github/skills/\K[^\s\)\]`"'"'"'/]+' 2>/dev/null || true)
    if [ -n "$skill_refs" ]; then
      while IFS= read -r ref_skill; do
        ref_skill=$(echo "$ref_skill" | sed 's/[.,;:!?)]*$//')
        # Skip template placeholders like {{name}} or {name}
        if echo "$ref_skill" | grep -q '^\{'; then
          warn "Template placeholder in skill reference: $rel_path → $ref_skill (skipped)"
          continue
        fi
        found_skill=false
        for sn in "${SKILL_NAMES[@]}"; do
          if [ "$sn" = "$ref_skill" ]; then
            found_skill=true
            break
          fi
        done
        if [ "$found_skill" = true ]; then
          pass "Valid skill reference in $rel_path → $ref_skill"
        else
          fail "Broken skill reference in $rel_path → $ref_skill (skill not found)"
        fi
      done <<< "$skill_refs"
    fi
  done
done

# ============================================================================
# 7. JARGON LEAK CHECK
# ============================================================================
section "Jargon Leak Check (User-Facing Files)"

BANNED_TERMS=("skill-writer" "agent-writer" "memory-writer" "cookbook-writer" "specialist" "dispatch")

USER_FACING_FILES=()
if [ -f "$PROJECT_ROOT/templates/FORGE.md" ]; then
  USER_FACING_FILES+=("$PROJECT_ROOT/templates/FORGE.md")
fi
for uf_dir in "$PROJECT_ROOT/templates/agents" "$PROJECT_ROOT/templates/cookbook" "$PROJECT_ROOT/templates/forge-memory"; do
  if [ -d "$uf_dir" ]; then
    while IFS= read -r uf_file; do
      USER_FACING_FILES+=("$uf_file")
    done < <(find "$uf_dir" -type f 2>/dev/null)
  fi
done

jargon_found=false
for uf_file in "${USER_FACING_FILES[@]}"; do
  [ -f "$uf_file" ] || continue
  rel_path="${uf_file#$PROJECT_ROOT/}"
  content=$(cat "$uf_file")

  # Strip HTML comments before checking
  clean_content=$(echo "$content" | sed 's/<!--.*-->//g')

  for term in "${BANNED_TERMS[@]}"; do
    if echo "$clean_content" | grep -qi "$term"; then
      fail "Jargon leak: '$term' found in user-facing file $rel_path"
      jargon_found=true
    fi
  done
done

if [ "$jargon_found" = false ]; then
  pass "No jargon leaks detected in user-facing templates"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Phase 2 Delegation Validation Summary${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC}   $PASS_COUNT"
echo -e "  ${RED}Failed:${NC}   $FAIL_COUNT"
echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}RESULT: FAIL${NC} — $FAIL_COUNT check(s) did not pass."
  echo "  This is expected if Phase 2 specialist agents haven't been created yet."
  echo "  Review the failures above — they tell you what Phase 2 needs to deliver."
  exit 1
else
  echo -e "  ${GREEN}${BOLD}RESULT: PASS${NC} — All Phase 2 delegation checks passed."
  if [ "$WARN_COUNT" -gt 0 ]; then
    echo "  ($WARN_COUNT warning(s) — review above for optional improvements)"
  fi
  exit 0
fi
