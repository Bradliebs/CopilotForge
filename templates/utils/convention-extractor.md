# Convention Extractor Specification

> How CopilotForge discovers and records new conventions after each scaffolding run. The extractor scans generated files for recurring patterns and writes them to `forge-memory/patterns.md` so future runs stay consistent.

---

## Overview

Every time CopilotForge scaffolds files, it establishes implicit conventions — naming styles, import ordering, error shapes, directory layouts. The convention extractor makes these conventions explicit by scanning generated output and recording patterns with confidence levels. Over time, patterns graduate from `observed` → `confirmed` → `established`, giving the Planner increasingly reliable conventions to follow.

---

## When to Run

The extractor runs **after scaffolding completes** and **after the memory writer finishes**, as the final step before session end.

```
1. generators generate files
2. Memory writer logs decisions and base patterns
3. Convention extractor scans generated files → appends new patterns
4. Summarizer runs (if thresholds are exceeded)
5. Session ends
```

**Skip conditions:**
- If `memory=no` in wizard answers, the extractor does not run.
- If no files were generated (everything skipped on re-run), the extractor does not run.
- On first run, the extractor always runs (even a single file can establish an initial convention).

---

## Extraction Algorithm

### 1. Naming Patterns

Scan the file names of all generated files to detect naming conventions.

**Detection rules:**

| Pattern | Example | Convention Name |
|---|---|---|
| All lowercase with hyphens | `session-example.ts` | kebab-case files |
| PascalCase | `UserProfile.tsx` | PascalCase components |
| snake_case | `user_profile.py` | snake_case modules |
| camelCase | `sessionManager.ts` | camelCase modules |
| Dot-separated | `user.controller.ts` | dot-separated roles |
| ALL_CAPS | `DATABASE_CONFIG.ts` | SCREAMING_SNAKE constants |

**Algorithm:**
1. Collect all generated file names (without extension).
2. Classify each name into one of the patterns above.
3. Count occurrences of each pattern per file extension group (`.ts`, `.py`, `.md`, etc.).
4. The dominant pattern for each extension group becomes the detected convention.

### 2. Import Patterns

Scan generated code files for import/require statements to detect ordering conventions.

**Detection rules:**
1. **Group 1 — Standard library:** `import { x } from "node:*"`, `from pathlib import`, `import os`
2. **Group 2 — Third-party:** `import { x } from "express"`, `from fastapi import`
3. **Group 3 — Local:** `import { x } from "./..."`, `import { x } from "../..."`, `from . import`

**Algorithm:**
1. For each generated code file, extract all import lines.
2. Classify each import into Group 1, 2, or 3.
3. Check if imports appear in group order (stdlib → third-party → local).
4. If group ordering is consistent across files, record as a convention.
5. Also detect: blank lines between groups, alphabetical ordering within groups.

### 3. Error Handling Patterns

Scan generated code files for error handling structures.

**What to look for:**

| Pattern | Detection Signal |
|---|---|
| Custom error hierarchy | Classes extending `Error` or `Exception` with a `code` field |
| Error codes enum | `ErrorCode` enum or const object with string error codes |
| Structured error responses | `{ error: { code, message } }` return shapes |
| Retry patterns | `withRetry`, `@with_retry`, exponential backoff logic |
| Graceful degradation | `withFallback`, try/catch returning defaults |
| Never bare catch | Every catch block has meaningful handling (not just `console.log`) |

**Algorithm:**
1. Scan for class definitions that extend `Error` (TS) or `Exception` (Python).
2. Scan for consistent error response shapes across multiple files.
3. If a pattern appears, record the specific shape/hierarchy used.

### 4. Directory Structure Patterns

Scan the paths of all created directories to detect layout conventions.

**What to look for:**

| Pattern | Detection Signal |
|---|---|
| `src/` source root | Generated code files live under `src/` |
| `lib/` source root | Generated code files live under `lib/` |
| Flat structure | Generated code files at repo root |
| `tests/` separate | Test files in a dedicated `tests/` directory |
| Co-located tests | `*.test.ts` files next to source files |
| `config/` directory | Configuration files grouped separately |
| Feature folders | Directories named after features (`auth/`, `users/`) |

**Algorithm:**
1. Build a list of all directory paths created during scaffolding.
2. Classify the top-level structure (src-based, lib-based, flat).
3. Determine test file placement strategy.
4. Record the detected layout.

### 5. Code Style Patterns

Scan generated code files for style choices.

**What to look for:**

| Pattern | Detection Signal |
|---|---|
| Semicolons (TS/JS) | Lines ending with `;` vs. no semicolons |
| Quote style | Single quotes `'` vs. double quotes `"` |
| Indentation | 2-space vs. 4-space vs. tabs |
| Trailing commas | Last items in arrays/objects have trailing `,` |
| Type annotations | Python type hints present on function signatures |
| Async/await style | `async/await` vs. `.then()` chains |
| Export style (TS) | Named exports vs. default exports |

**Algorithm:**
1. Sample the first 50 lines of each generated code file.
2. Count occurrences of each style choice.
3. The dominant choice (>70% of occurrences) becomes the detected convention.
4. If no clear dominant choice, don't record a convention (ambiguous).

---

## Pattern Confidence Levels

Each detected pattern is assigned a confidence level based on how many times it has been observed.

| Level | Criteria | Meaning |
|---|---|---|
| `observed` | Pattern seen in 1 generated file | First sighting — may be coincidental |
| `confirmed` | Pattern seen in 2–3 generated files | Recurring pattern — likely intentional |
| `established` | Pattern seen in 4+ files **or** user has edited `patterns.md` to include it | Reliable convention — should be followed |

**Confidence promotion:**
- A pattern starts at `observed` when first detected.
- On subsequent runs, if the same pattern is detected again, its confidence is promoted.
- If a user manually adds or edits a pattern in `patterns.md`, it is immediately `established`.
- Confidence never demotes — once `confirmed`, it stays `confirmed` or higher.

**How to detect "same pattern":**
- Match by pattern name (case-insensitive heading match in `patterns.md`).
- If an existing pattern has the same name, update its confidence level instead of adding a duplicate.

---

## Pattern Storage

New patterns are appended to `forge-memory/patterns.md` under the `## Project-Specific Patterns` section.

**Storage format:**

```markdown
### {Pattern Name} ({confidence})
**When to use:** {context where this pattern applies}
**Pattern:** {one-line description of the convention}
**Confidence:** {confidence} (seen in {count} generated files)
```

**Examples:**

```markdown
### File Naming — kebab-case (confirmed)
**When to use:** All source files except React components.
**Pattern:** Use `kebab-case` for file names: `user-profile.ts`, `api-client.py`
**Confidence:** confirmed (seen in 3 generated files)

### Import Ordering — stdlib first (observed)
**When to use:** All TypeScript files.
**Pattern:** Group imports: node: builtins → third-party packages → local modules. Blank line between groups.
**Confidence:** observed (seen in 1 generated file)

### Error Response Shape (established)
**When to use:** All API endpoints.
**Pattern:** Return `{ error: { code, message, details? } }` for error responses.
**Confidence:** established (seen in 5 generated files)
```

---

## Conflict Resolution

When a newly detected pattern contradicts an existing one:

| Scenario | Action |
|---|---|
| New pattern contradicts `observed` existing | Replace existing with new (low confidence, safe to update) |
| New pattern contradicts `confirmed` existing | Add new pattern with a `**Note:**` field explaining the conflict |
| New pattern contradicts `established` existing | Do **not** add new pattern — established conventions take priority |
| User-edited pattern (any confidence) | Never overwrite — user edits are sacrosanct |

**How to detect user-edited patterns:**
- Compare the pattern entry against the original version from the previous run.
- If any text has changed beyond confidence level, treat it as user-edited.
- Alternatively, if the pattern has no `(seen in N generated files)` marker, it was manually added.

---

## Extraction Limits

To avoid noisy or overly specific patterns:

- **Minimum file count:** Don't extract patterns from a single small file (<20 lines). Wait for at least one substantial file (20+ lines) or two files of any size.
- **Maximum patterns per run:** Extract at most 10 new patterns per session. If more are detected, prioritize by confidence level (higher first) and category diversity.
- **Skip trivial patterns:** Don't record patterns for markdown files (their "style" is irrelevant to code conventions).
- **Skip template artifacts:** Ignore any files containing `{{placeholder}}` syntax — they're templates, not generated code.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No code files generated (only markdown) | Skip extraction entirely |
| Mixed naming in one language (some kebab, some camelCase) | Record both as `observed`; don't pick a winner |
| Generated files were skipped (re-run) | Don't extract from pre-existing files — only analyze newly created files |
| `patterns.md` doesn't exist yet | Create `## Project-Specific Patterns` section and write patterns there |
| Pattern name is too generic (e.g., "code") | Prefix with category: "Code Style — semicolons" |
| Detected pattern already exists at same confidence | No-op — don't create a duplicate |

---

## Relationship to Other Specs

| Spec | Relationship |
|---|---|
| `memory-reader.md` | Reader loads the patterns that the extractor writes |
| `memory-summarizer.md` | Summarizer merges patterns when the extractor has added too many |
| `stack-detection.md` | Stack detection identifies technologies; the extractor identifies how they're used |
| `rerun-detection.md` | On re-runs, the extractor only scans newly created files |
