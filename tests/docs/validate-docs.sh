#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# CopilotForge Documentation Validator (Bash)
# Run from the repository root.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_ROOT="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"

pass=0
fail=0
warn=0

pass_() { ((pass++)); printf "  \033[32mPASS\033[0m  %s\n" "$1"; }
fail_() { ((fail++)); printf "  \033[31mFAIL\033[0m  %s\n" "$1"; }
warn_() { ((warn++)); printf "  \033[33mWARN\033[0m  %s\n" "$1"; }
section() { printf "\n\033[36m=== %s ===\033[0m\n" "$1"; }

# Helper: strip fenced code blocks and inline code for jargon scanning
strip_code() {
    sed -E '/^```/,/^```/d' | sed -E 's/`[^`]+`//g'
}

echo "CopilotForge Documentation Validator"
echo "Repo root: $REPO_ROOT"
echo ""

README="$REPO_ROOT/README.md"
GETTING="$REPO_ROOT/docs/GETTING-STARTED.md"
HOWITWORKS="$REPO_ROOT/docs/HOW-IT-WORKS.md"

# ══════════════════════════════════════════════════════════════════════════════
# 1. FILE EXISTENCE
# ══════════════════════════════════════════════════════════════════════════════
section "1. File Existence"

[ -f "$README" ]      && pass_ "README.md exists"               || fail_ "README.md missing at repo root"
[ -f "$GETTING" ]     && pass_ "docs/GETTING-STARTED.md exists"  || fail_ "docs/GETTING-STARTED.md missing"
[ -f "$HOWITWORKS" ]  && pass_ "docs/HOW-IT-WORKS.md exists"     || fail_ "docs/HOW-IT-WORKS.md missing"

# ══════════════════════════════════════════════════════════════════════════════
# 2. README STRUCTURE
# ══════════════════════════════════════════════════════════════════════════════
section "2. README Structure"

if [ -f "$README" ]; then
    for heading in "Quick Start" "What Gets Created" "FAQ" "Works Everywhere"; do
        if grep -qiE "^#{1,3}\s+.*${heading}" "$README"; then
            pass_ "README has '$heading' section"
        else
            fail_ "README missing '$heading' section"
        fi
    done
else
    fail_ "README.md is empty or missing - skipping structure checks"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 3. JARGON CHECK
# ══════════════════════════════════════════════════════════════════════════════
section "3. Jargon Check"

jargon_terms=(
    "specialist:\bspecialist\b"
    "delegation protocol:delegation[[:space:]]+protocol"
    "FORGE-CONTEXT:FORGE-CONTEXT"
    "skill-writer:\bskill-writer\b"
    "agent-writer:\bagent-writer\b"
    "memory-writer:\bmemory-writer\b"
    "cookbook-writer:\bcookbook-writer\b"
    "frontmatter:\bfrontmatter\b"
)

for doc_entry in "README.md:$README" "GETTING-STARTED.md:$GETTING" "HOW-IT-WORKS.md:$HOWITWORKS"; do
    doc_name="${doc_entry%%:*}"
    doc_path="${doc_entry#*:}"

    if [ ! -f "$doc_path" ]; then
        warn_ "$doc_name not available for jargon check"
        continue
    fi

    stripped=$(cat "$doc_path" | strip_code)
    doc_clean=true

    for term_entry in "${jargon_terms[@]}"; do
        term_name="${term_entry%%:*}"
        term_pattern="${term_entry#*:}"
        if echo "$stripped" | grep -qiE "$term_pattern"; then
            fail_ "$doc_name contains jargon: '$term_name'"
            doc_clean=false
        fi
    done

    if $doc_clean; then
        pass_ "$doc_name is jargon-free"
    fi
done

# ══════════════════════════════════════════════════════════════════════════════
# 4. LINK CHECK
# ══════════════════════════════════════════════════════════════════════════════
section "4. Link Check"

for doc_entry in "README.md:$README" "GETTING-STARTED.md:$GETTING" "HOW-IT-WORKS.md:$HOWITWORKS"; do
    doc_name="${doc_entry%%:*}"
    doc_path="${doc_entry#*:}"

    if [ ! -f "$doc_path" ]; then
        warn_ "$doc_name not available for link check"
        continue
    fi

    doc_dir=$(dirname "$doc_path")
    link_clean=true

    # Extract relative links (not http, not anchor-only, not templates)
    while IFS= read -r target; do
        [ -z "$target" ] && continue
        # Skip mailto and template placeholders
        echo "$target" | grep -qE '^mailto:|[{]' && continue

        # Try resolving relative to doc directory, then repo root
        if [ ! -e "$doc_dir/$target" ] && [ ! -e "$REPO_ROOT/$target" ]; then
            fail_ "$doc_name has broken link: $target"
            link_clean=false
        fi
    done < <(grep -oE '\[[^]!][^]]*\]\((?!https?://|#)([^)#]+)' "$doc_path" | sed -E 's/.*\(//;s/\)$//' | sort -u)

    if $link_clean; then
        pass_ "$doc_name all relative links resolve"
    fi
done

# ══════════════════════════════════════════════════════════════════════════════
# 5. MINIMUM CONTENT
# ══════════════════════════════════════════════════════════════════════════════
section "5. Minimum Content"

check_min_lines() {
    local name="$1" path="$2" min="$3"
    if [ -f "$path" ]; then
        count=$(wc -l < "$path")
        if [ "$count" -ge "$min" ]; then
            pass_ "$name has $count lines (minimum: $min)"
        else
            fail_ "$name has only $count lines (minimum: $min)"
        fi
    else
        fail_ "$name is empty or missing (minimum: $min lines)"
    fi
}

check_min_lines "README.md"          "$README"      100
check_min_lines "GETTING-STARTED.md" "$GETTING"     150
check_min_lines "HOW-IT-WORKS.md"    "$HOWITWORKS"  100

# ══════════════════════════════════════════════════════════════════════════════
# 6. BEGINNER FRIENDLINESS
# ══════════════════════════════════════════════════════════════════════════════
section "6. Beginner Friendliness"

if [ -f "$README" ]; then
    # Addresses reader directly
    if grep -qiw "you" "$README"; then
        pass_ "README.md addresses the reader with 'you'"
    else
        fail_ "README.md does not address the reader with 'you'"
    fi

    # Contains trigger phrase examples
    if grep -qiE "(trigger|phrase|say|ask|tell|type)" "$README" && \
       grep -qiE "(scaffold|create|generate|build|set up)" "$README"; then
        pass_ "README.md contains trigger/action language"
    else
        fail_ "README.md missing trigger phrase examples"
    fi
else
    fail_ "README.md not available for friendliness check"
    fail_ "README.md not available for trigger phrase check"
fi

if [ -f "$GETTING" ]; then
    if grep -qiE "(wizard|question|step [0-9]|prompt)" "$GETTING" && \
       grep -qiE "(answer|response|reply|Q:|A:)" "$GETTING"; then
        pass_ "GETTING-STARTED.md contains wizard Q&A examples"
    elif grep -qiE "(wizard|question|step [0-9]|prompt)" "$GETTING"; then
        pass_ "GETTING-STARTED.md contains wizard walkthrough content"
    else
        fail_ "GETTING-STARTED.md missing wizard Q&A examples"
    fi
else
    fail_ "GETTING-STARTED.md not available for Q&A check"
fi

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "======================================"
if [ "$fail" -eq 0 ]; then
    printf "  \033[32mPASS: %d   FAIL: %d   WARN: %d\033[0m\n" "$pass" "$fail" "$warn"
    echo "======================================"
    printf "  \033[32mAll checks passed!\033[0m\n"
    exit 0
else
    printf "  \033[31mPASS: %d   FAIL: %d   WARN: %d\033[0m\n" "$pass" "$fail" "$warn"
    echo "======================================"
    printf "  \033[31m%d check(s) failed.\033[0m\n" "$fail"
    exit 1
fi