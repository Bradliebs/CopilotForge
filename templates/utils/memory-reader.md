# Memory Reader Specification

> How CopilotForge reads project memory to provide cross-session context to the Planner. The memory reader loads, parses, and summarizes forge-memory files so the Planner starts each session already knowing what happened before.

---

## Overview

The memory reader runs at the **start** of every Planner session, before the wizard or any scaffolding. It produces a structured context block (the "memory summary") that the Planner injects into its working context. This lets the Planner make stack-aware, preference-aware, history-aware decisions without re-asking questions.

---

## Memory Loading Algorithm

### Step 1: Check for Memory Directory

```
if forge-memory/ directory does not exist:
    return { isFirstRun: true, summary: null }
```

If the directory exists but is empty, treat it as a first run.

### Step 2: Read `forge-memory/decisions.md`

Parse the file to extract decision entries.

**Parsing rules:**
1. Locate the `## Entries` or `## Setup Decisions` section (both are valid section headers).
2. Each entry starts with `### YYYY-MM-DD — Title` (or `### YYYY-MM-DD: Title`).
3. Within each entry, extract these fields by their bold-label prefix:
   - `**Context:**` or `**What:**` → context
   - `**Decision:**` or `**Why:**` → decision
   - `**Reason:**` or `**Stack:**` → reason
   - `**Impact:**` or `**Options enabled:**` → impact
4. Return the most recent N entries (default: 10, configurable via `preferences.md`).
5. Tag each entry:
   - **Stack decision:** Entry mentions a language name, framework, or contains `**Stack:**`
   - **Preference decision:** Entry contains "user override", "user chose", "changed preference", or "preference"

**Output shape:**

```json
{
  "entries": [
    {
      "date": "2026-04-15",
      "title": "Initial scaffolding",
      "context": "User described their project...",
      "decision": "CopilotForge generated the initial structure",
      "reason": "Starting from scaffold is faster",
      "impact": "All files follow CopilotForge format",
      "tags": ["stack"]
    }
  ],
  "totalCount": 12,
  "returnedCount": 10
}
```

### Step 3: Read `forge-memory/patterns.md`

Parse the file to extract active conventions.

**Parsing rules:**
1. **`## Stack Conventions`** → Technology constraints and framework-specific rules.
   - Each bullet or sub-heading is one convention.
2. **`## File Structure`** → Expected directory layout.
   - Extract directory names and their roles.
3. **`## Naming Conventions`** → Naming rules for files, variables, tests.
   - Extract as category/rule pairs.
4. **`## Project-Specific Patterns`** → Custom patterns added by the user or agents.
   - Each `### Pattern Name` sub-section is one pattern.
   - Extract confidence level if present: `observed`, `confirmed`, `established`.

**Output shape:**

```json
{
  "stackConventions": ["strict mode enabled", "no any types", "path aliases via tsconfig"],
  "fileStructure": { "source": "src/", "tests": "tests/", "config": "root" },
  "namingConventions": { "files": "kebab-case", "components": "PascalCase", "tests": "*.test.ts" },
  "projectPatterns": [
    {
      "name": "API Response Format",
      "confidence": "confirmed",
      "description": "Return { data, error, meta } objects"
    }
  ],
  "totalPatternCount": 8
}
```

### Step 4: Read `forge-memory/preferences.md` (Optional)

This file may not exist — skip gracefully if missing.

**Parsing rules:**
1. Parse as a key-value document. Expected keys:
   - `verbosity` → `beginner` | `intermediate` | `advanced`
   - `stack_preference` → preferred language/framework
   - `testing` → `yes` | `no` | preferred framework name
   - `memory_entries_to_load` → number (overrides the default 10)
   - `generation_style` → `minimal` | `standard` | `verbose`
2. Keys may appear as `**key:** value`, `- key: value`, or YAML-style `key: value`.
3. Any unrecognized keys are returned as-is in a `custom` map.

**Output shape:**

```json
{
  "verbosity": "intermediate",
  "stackPreference": "TypeScript",
  "testing": "vitest",
  "memoryEntriesToLoad": 10,
  "generationStyle": "standard",
  "custom": {}
}
```

### Step 5: Read `forge-memory/history.md` (Optional)

This file may not exist — skip gracefully if missing.

**Parsing rules:**
1. Each session entry starts with `### Session {N}` or `### YYYY-MM-DD` heading.
2. Extract: date, files created count, files updated count, duration (if recorded).
3. Return aggregate stats plus the last 3 session summaries.

**Output shape:**

```json
{
  "sessionCount": 5,
  "lastSessionDate": "2026-04-15",
  "totalFilesCreated": 42,
  "totalFilesUpdated": 8,
  "recentSessions": [
    { "date": "2026-04-15", "filesCreated": 3, "filesUpdated": 1 }
  ]
}
```

---

## Context Summary Format

The memory reader combines all parsed data into a single structured block that the Planner can inject at the top of its working context.

```
--- FORGE-MEMORY ---
project: {project name from most recent decision}
stack: {primary stack from patterns — e.g., "TypeScript, Express, Prisma"}
skill_level: {from preferences, or "not set"}
last_run: {date of most recent session or decision}
session_count: {total sessions from history, or "1" if only decisions exist}
decisions_count: {total decision entries}
patterns_count: {total active patterns}

recent_decisions:
  - {date}: {title} — {one-line summary of the decision}
  - {date}: {title} — {one-line summary of the decision}
  - {date}: {title} — {one-line summary of the decision}

active_conventions:
  - naming: {summary of naming rules — e.g., "kebab-case files, PascalCase components"}
  - structure: {summary of file structure — e.g., "src/ for source, tests/ for tests"}
  - stack: {summary of stack conventions — e.g., "strict TS, no any, Prisma schema-first"}

user_preferences:
  - verbosity: {level or "not set"}
  - testing: {preference or "not set"}
  - {any custom overrides as key: value}
--- END FORGE-MEMORY ---
```

**Formatting rules:**
- Keep the summary under 40 lines. Truncate long lists with `... and {N} more`.
- Use single-line summaries for decisions (not the full multi-field entry).
- If a section has no data, show the key with `not found` as the value.

---

## Error Handling

The memory reader must **never crash** the Planner. All errors are handled gracefully.

| Scenario | Behavior |
|---|---|
| `forge-memory/` directory missing | Return `isFirstRun: true`, empty summary |
| `forge-memory/` directory empty | Return `isFirstRun: true`, empty summary |
| `decisions.md` missing | Skip; set `decisions_count: "not found"` in summary |
| `patterns.md` missing | Skip; set `patterns_count: "not found"` in summary |
| `preferences.md` missing | Skip; use defaults (verbosity: intermediate, etc.) |
| `history.md` missing | Skip; set `session_count: "not found"` in summary |
| Any file has malformed content | Skip the corrupted section, parse what's valid |
| Entry missing expected fields | Use `"unknown"` for missing fields, don't skip the entry |
| File is unexpectedly large (>100KB) | Read only the first 100KB, note truncation in summary |
| File encoding is not UTF-8 | Attempt to read as UTF-8, skip file if it fails |

**Logging:**
- Log warnings for skipped files or malformed sections (to console or a debug channel).
- Never surface warnings to the user — they're for agent diagnostics only.

---

## Integration Points

### How the Planner Uses the Summary

1. **Before the wizard:** If memory exists, the Planner can skip questions whose answers are already known (e.g., stack, skill level).
2. **During scaffolding:** The Planner passes active conventions to generators so generated code follows established patterns.
3. **After scaffolding:** The memory writer appends new decisions, and the convention extractor scans for new patterns.

### Configuration

| Setting | Default | Override Location |
|---|---|---|
| Max entries to load | 10 | `preferences.md` → `memory_entries_to_load` |
| Max recent sessions | 3 | Hardcoded (change in reader implementation) |
| Max summary lines | 40 | Hardcoded |
| File size limit | 100KB | Hardcoded |

---

## Query Helpers

The reader should support these filtered queries for downstream use:

| Query | Description |
|---|---|
| `getStackDecisions()` | Return only decisions tagged as stack-related |
| `getPreferenceDecisions()` | Return only decisions tagged as user-preference changes |
| `getPatternsAboveConfidence(level)` | Return patterns at or above the given confidence level |
| `getRecentDecisions(n)` | Return the N most recent decisions |
| `getActiveConventions()` | Return all conventions from patterns.md as a flat list |
| `hasMemory()` | Return true if forge-memory/ exists with at least one parseable file |

---

## Relationship to Other Specs

| Spec | Relationship |
|---|---|
| `memory-summarizer.md` | Summarizer compresses what the reader reads — they share the same file format |
| `convention-extractor.md` | Extractor writes new patterns that the reader will load next session |
| `rerun-detection.md` | Re-run detection triggers before the reader; if first run, reader returns empty |
| `stack-detection.md` | Stack detection results are stored in patterns.md, which the reader parses |
