# Phase 4 Architecture Contract — Memory & Iteration

> **Author:** Morpheus (Lead Architect)
> **Date:** 2026-04-16
> **Status:** Draft — Pending Team Consensus
> **Depends on:** Phase 3 (Cookbook Layer) — Complete

---

## Overview

Phase 4 delivers the **Memory & Iteration** system — the mechanism that makes CopilotForge learn from itself across sessions. From the original spec:

> "The Planner learns from decisions.md across sessions, so the second time you add something it already knows your conventions."

Today, memory is **write-only**. The Planner scaffolds `forge-memory/decisions.md` and `forge-memory/patterns.md`, the memory generator appends on re-runs, but nothing reads memory back to inform behavior. Phase 4 closes that loop.

### What Changes

| Component | Phase 3 (Today) | Phase 4 (Target) |
|---|---|---|
| Memory read-back | None — memory is write-only | Planner reads memory before wizard starts |
| Wizard behavior | Same questions every run | Adaptive — skips known answers, shows summary |
| Convention learning | Static patterns from wizard answers | Dynamic extraction from generated output |
| Cross-session context | Decisions append, nothing compounds | History log + preferences file + summarization |
| Per-agent memory | delegates have no learned context | Each delegate reads relevant memory sections |
| Memory lifecycle | Create and append forever | Create → accumulate → summarize → archive |
| FORGE.md memory surface | Static memory table | Live memory status with counts and last-run date |

### Design Principles

1. **Memory is advisory, never blocking.** If memory is corrupted, missing, or contradictory, the system degrades to the Phase 3 flow (full wizard, no context). The user never gets stuck because of memory.
2. **Users own their memory.** Every memory file is hand-editable markdown. The system handles edits gracefully — even messy ones.
3. **Context budget is fixed.** Memory loading has a hard token ceiling. When memory grows past that, older entries get summarized. Recent decisions always appear verbatim.
4. **No external dependencies.** Memory is markdown files in `forge-memory/`. No databases, no APIs, no binary formats. Works anywhere the Planner works.
5. **Progressive disclosure.** Beginners see "I remember your project." Advanced users can inspect and edit every memory file.

---

## 1. Memory Read-Back Protocol

### 1.1 Trigger

On every Planner invocation, **before** Step 1 (Greet and Explain), execute the memory probe:

```
Planner triggered
  │
  ▼
Check: does forge-memory/ exist?
  │
  ├── NO  → First-time user. Run full wizard (Phase 3 flow).
  │
  └── YES → Returning user. Execute read-back protocol.
        │
        ├── Read forge-memory/decisions.md
        ├── Read forge-memory/patterns.md
        ├── Read forge-memory/history.md (if exists)
        └── Read forge-memory/preferences.md (if exists)
        │
        ▼
      Parse into Project Knowledge Block
        │
        ▼
      Run adaptive wizard (Section 2)
```

### 1.2 Parsing: Decisions

Extract from `decisions.md`:

| Field | Source | Use |
|---|---|---|
| Project description | Most recent `**Context:**` line | Pre-fill wizard Q1 |
| Stack | Most recent `**Stack:**` or `**Decision:**` mentioning stack | Pre-fill wizard Q2 |
| Memory preference | Existence of the file itself | Skip wizard Q3 (already yes) |
| Testing preference | `**Options enabled:**` line | Pre-fill wizard Q4 |
| Skill level | `**Skill level:**` line | Pre-fill wizard Q5 |
| Decision count | Count of `### ` headings under `## Entries` | Memory status metric |
| Last run date | Date from the most recent entry heading | Memory status metric |
| Stack changes | Multiple `**Stack:**` lines with different values | Flag for user confirmation |

**Parse strategy:** Line-by-line heading scan. Look for `### ` entries, extract `**bold-key:**` values. No regex engine required — an LLM can do this as structured text extraction.

### 1.3 Parsing: Patterns

Extract from `patterns.md`:

| Field | Source | Use |
|---|---|---|
| Naming conventions | `## Naming Conventions` or `### File Naming` section | Constrain generated file names |
| File structure | `## File Structure` section | Constrain directory layout |
| Stack conventions | `## Stack Conventions` section | Inform recipe selection and code style |
| Project-specific patterns | `## Project-Specific Patterns` section | Pass to delegates as constraints |
| Pattern count | Count of `### ` headings | Memory status metric |

**Parse strategy:** Section-level extraction. Each `## ` heading maps to a pattern category. Content under each heading is passed as-is to the relevant delegate.

### 1.4 Parsing: History (New File)

Extract from `forge-memory/history.md` (if it exists):

| Field | Source | Use |
|---|---|---|
| Session count | Count of `### Session` entries | Memory status metric |
| Recent actions | Last 3 session entries | Show user what happened recently |
| Generated file inventory | Union of all `**Files created:**` lists | Know what exists without filesystem scan |

### 1.5 Parsing: Preferences (New File)

Extract from `forge-memory/preferences.md` (if it exists):

| Field | Source | Use |
|---|---|---|
| Style preferences | `## Style` section | Pass to all delegates |
| Framework preferences | `## Frameworks` section | Weight recipe selection |
| Verbosity override | `## Verbosity` section | Override wizard Q5 default |
| Convention priorities | `## Priorities` section | Weight pattern enforcement |

### 1.6 Project Knowledge Block

All parsed data is assembled into a **FORGE-MEMORY** context block — an extension of the existing FORGE-CONTEXT inter-delegate contract:

```yaml
# <!-- FORGE-MEMORY -->
returning_user: true
last_run: "2026-04-16"
session_count: 3
project_description: "A REST API for a pet adoption platform"
stack: "TypeScript, Express, Prisma, PostgreSQL"
memory_enabled: true
testing_enabled: true
skill_level: "intermediate"
decision_count: 7
pattern_count: 12
known_answers:
  q1: "A REST API for a pet adoption platform"
  q2: "TypeScript, Express, Prisma, PostgreSQL"
  q3: "yes"
  q4: "yes"
  q5: "intermediate"
active_patterns:
  naming: "kebab-case files, PascalCase components, camelCase functions"
  file_structure: "src/ with routes/, services/, models/ subdirs"
  error_handling: "Custom AppError class, never bare try/catch"
  testing: "Jest with .test.ts suffix, colocated with source"
preferences:
  style: "functional over OOP where possible"
  verbosity: "intermediate"
recent_history:
  - "2026-04-16: Added auth-example.ts and error-handling.ts recipes"
  - "2026-04-15: Initial scaffolding — 3 skills, 3 agents, 5 recipes"
# <!-- /FORGE-MEMORY -->
```

This block is appended to the FORGE-CONTEXT block before delegate dispatch.

### 1.7 Memory Budget

The context window is shared between memory, wizard interaction, and generation instructions. Memory must not crowd out working space.

| Memory source | Budget | Rationale |
|---|---|---|
| decisions.md | Last 10 entries verbatim, older entries summarized to 1-line each | Recent decisions are most relevant; old ones provide background |
| patterns.md | Full file up to 200 lines; truncate with "[N more patterns — see forge-memory/patterns.md]" | Patterns are dense and directly actionable |
| history.md | Last 5 sessions verbatim, older sessions as 1-line summaries | Recent sessions matter most |
| preferences.md | Full file (expected to be small — under 50 lines) | Preferences are always relevant |
| **Total ceiling** | ~500 lines of memory context | Leaves ample room for wizard + generation in a 4K–8K instruction window |

**If total memory exceeds 500 lines:** Trigger summarization (see Section 4.4).

---

## 2. Adaptive Wizard

### 2.1 Decision Tree

```
Memory read-back complete
  │
  ├── All 5 answers known from memory
  │     → Returning User Flow (Section 2.2)
  │
  ├── Some answers known, some missing
  │     → Partial Memory Flow (Section 2.3)
  │
  └── Memory exists but unparseable
        → Degraded Flow (Section 2.4)
```

### 2.2 Returning User Flow (All Answers Known)

Replace the full 5-question wizard with a **confirmation prompt**:

> **Welcome back to CopilotForge!** I found your project context:
>
> - **Project:** {project description from memory}
> - **Stack:** {stack from memory}
> - **Memory:** enabled
> - **Test automation:** {yes/no from memory}
> - **Verbosity:** {skill level from memory}
>
> Last run: {date}. {decision_count} decisions logged, {pattern_count} patterns established.
>
> **What would you like to do?**
> 1. **Add something new** — describe what you want to add
> 2. **Change settings** — update stack, verbosity, or options
> 3. **Re-scaffold** — regenerate with current settings
> 4. **Start fresh** — clear memory and start over

Wait for the user's response. Route based on choice:

| Choice | Action |
|---|---|
| 1 (Add) | Ask: "What do you want to add?" Then run only relevant delegates. |
| 2 (Change) | Ask only the questions whose answers are changing. Update memory. |
| 3 (Re-scaffold) | Skip wizard entirely. Run all delegates with existing answers. |
| 4 (Start fresh) | Clear `forge-memory/` contents (see Section 6.3). Run full wizard. |

### 2.3 Partial Memory Flow (Some Answers Missing)

Show what's known and ask only what's missing:

> **Welcome back to CopilotForge!** I remember some things about your project:
>
> - **Project:** {known or "not found — I'll ask"}
> - **Stack:** {known or "not found — I'll ask"}
> - **Memory:** enabled (you're using it right now)
> - **Test automation:** {known or "I'll ask"}
> - **Verbosity:** {known or "I'll ask"}
>
> Let me fill in the gaps.

Then ask only the missing questions, in the same order as the original wizard (Q1 → Q5). Skip questions that have known answers.

### 2.4 Degraded Flow (Memory Exists but Unparseable)

If memory files exist but parsing fails (corrupted format, hand-edited beyond recognition):

> **Welcome back to CopilotForge!** I found your memory files but couldn't fully parse them. I'll ask the full set of questions to make sure I have everything right. Your existing memory files will be preserved — I'll only append new entries.

Run the full 5-question wizard (Phase 3 behavior). Do not modify or delete the unparseable memory files.

### 2.5 Conflict Resolution

If the user provides an answer that contradicts existing memory:

```
User says: "My stack is Python, FastAPI"
Memory says: stack = "TypeScript, Express, Prisma"
  │
  ▼
Ask: "I see your project was previously using TypeScript/Express/Prisma.
      Are you switching stacks, or is this a different component?"
  │
  ├── "Switching" → Update memory, log decision: "Stack changed from X to Y"
  └── "Different component" → Add new stack entry, keep old one
```

Log every conflict resolution as a decision in `decisions.md`.

---

## 3. Convention Learning Algorithm

### 3.1 Extraction Pipeline

After each scaffolding run, before the validation summary (Step 5), the memory generator runs a **pattern extraction pass**:

```
All delegates complete
  │
  ▼
memory generator receives:
  - generated_files: list of all files created this run
  - wizard_answers: current answers
  - existing_patterns: current patterns.md content
  │
  ▼
Extract new patterns from generated output
  │
  ▼
Compare against existing patterns
  │
  ├── New pattern (no match) → Add with confidence: "observed"
  ├── Matching pattern (same convention) → Bump confidence: "confirmed" or "established"
  └── Contradicting pattern → Add as variant, flag for user review
  │
  ▼
Write updated patterns.md
```

### 3.2 Pattern Categories

| Category | What's Extracted | Example |
|---|---|---|
| Naming | File names, variable naming style, test naming | "kebab-case for files, camelCase for functions" |
| File structure | Directory layout, file locations | "routes in src/routes/, tests colocated" |
| Error handling | Error patterns used in generated recipes | "Custom AppError class with status codes" |
| API design | Route patterns, response shapes | "RESTful routes, { data, error } response shape" |
| Testing | Test framework, assertion style, mock patterns | "Jest, describe/it blocks, jest.mock for deps" |
| Dependencies | Package choices, version preferences | "Prisma for ORM, Zod for validation" |

### 3.3 Confidence Levels

| Level | Threshold | Behavior |
|---|---|---|
| **observed** | 1 instance (first seen) | Recorded but not enforced. delegates see it as a suggestion. |
| **confirmed** | 2+ instances, no contradictions | delegates treat it as a default. Can be overridden by explicit user input. |
| **established** | 3+ instances, no contradictions | delegates follow it unless the user explicitly asks for something different. Shown to user as an active convention. |

Confidence is tracked inline in `patterns.md`:

```markdown
### File Naming
<!-- confidence: established (seen 4 times, no contradictions) -->
- kebab-case for all source files
- PascalCase for React components
- .test.ts suffix for test files
```

The confidence comment is a machine-readable annotation. The memory generator reads it; users can ignore it or edit it.

### 3.4 Contradiction Handling

When a new pattern contradicts an existing one:

1. Do **not** delete the old pattern.
2. Add the new pattern with a `<!-- supersedes: {old pattern heading} -->` annotation.
3. Log the contradiction as a decision in `decisions.md`.
4. On the next read-back, the parser uses the most recent (superseding) pattern.

Example:

```markdown
### File Naming
<!-- confidence: established (seen 4 times, no contradictions) -->
- kebab-case for all source files

### File Naming (Updated 2026-04-20)
<!-- confidence: observed (seen 1 time) -->
<!-- supersedes: File Naming -->
- snake_case for all source files (project switched to Python-first conventions)
```

---

## 4. Cross-Session Context Compounding

### 4.1 Existing Files (Unchanged)

- **`forge-memory/decisions.md`** — Append-only chronological log. Already designed in Phase 2. No changes to write behavior.
- **`forge-memory/patterns.md`** — Additive merge. Already designed in Phase 2. Enhanced with confidence tracking (Section 3.3).

### 4.2 New File: `forge-memory/history.md`

A per-session activity log that records what was done and what changed.

```markdown
# Session History

> Automatic log of CopilotForge sessions. Each entry records what happened during a run.

---

## Sessions

### Session 3 — 2026-04-16

**Trigger:** User requested "add auth patterns"
**Mode:** Returning user (adaptive wizard — skipped most questions)
**delegates invoked:** cookbook generator, memory generator
**Files created:**
- cookbook/auth-middleware.ts
- cookbook/auth-jwt.ts
**Files updated:**
- forge-memory/decisions.md (appended 1 entry)
- forge-memory/patterns.md (added 2 patterns)
- FORGE.md (regenerated cookbook section)
**Duration context:** Wizard: 1 question, Generation: 2 delegates

---

### Session 2 — 2026-04-15

**Trigger:** User requested "add testing"
...
```

**Write rules:**
- New sessions prepend (most recent first), matching `decisions.md` convention.
- Each session entry is written by the Planner after all delegates complete, before the validation summary.
- Never delete or edit past session entries.

### 4.3 New File: `forge-memory/preferences.md`

Extracted user preferences that span across sessions. Unlike patterns (which describe code conventions), preferences describe how the user likes to work.

```markdown
# User Preferences

> Extracted from your interactions with CopilotForge. Edit freely — these guide how the system behaves.

---

## Style

- Prefer functional patterns over OOP
- Explicit over implicit (no magic)
- Readable over clever

## Frameworks

- Prefer Prisma over raw SQL
- Prefer Zod for validation
- Prefer pnpm over npm

## Verbosity

- Current level: intermediate
- Changed from beginner on 2026-04-15 (Session 2)

## Priorities

- Testing coverage is important — always generate test recipes
- Performance matters — include optimization notes in recipes
```

**Write rules:**
- Created on first run if memory is enabled. Starts mostly empty — populated with wizard answers.
- Updated by the memory generator after each run. New preferences are **additive** (append, don't replace).
- The user is expected to hand-edit this file. The memory generator respects existing content.
- If a preference contradicts a previous one, add the new one with a date annotation. Do not delete the old one.

### 4.4 Memory Lifecycle

```
Session 1: CREATE
  forge-memory/decisions.md  → Initial entry
  forge-memory/patterns.md   → Stack conventions
  forge-memory/history.md    → Session 1 log
  forge-memory/preferences.md → Initial preferences

Sessions 2–N: ACCUMULATE
  decisions.md  → Append new entries
  patterns.md   → Add new patterns, bump confidence
  history.md    → Prepend session log
  preferences.md → Add new preferences

When total memory > 500 lines: SUMMARIZE
  decisions.md  → Keep last 10 verbatim, summarize older to 1-line each
  history.md    → Keep last 5 sessions verbatim, summarize older to 1-line each
  patterns.md   → No summarization (patterns are already dense)
  preferences.md → No summarization (expected to stay small)

After 50+ sessions: ARCHIVE (deferred — Phase 5)
  Move summarized content to forge-memory/archive/
  Keep only active context in main files
```

### 4.5 Summarization Strategy

When memory exceeds the 500-line budget, the memory generator performs in-place summarization:

**For `decisions.md`:**
- Count entries. If >10, summarize entries 11+ into a `## Summary (Older Decisions)` section.
- Each summarized entry becomes one line: `- {date}: {decision title} — {one-sentence impact}`
- The original verbose entries are replaced by summaries. This is the one exception to the append-only rule.
- Before summarizing, add a decision entry: "Memory summarized — {N} older decisions condensed."

**For `history.md`:**
- Count sessions. If >5, summarize sessions 6+ into a `## Earlier Sessions` section.
- Each summarized session becomes one line: `- Session {N} ({date}): {trigger} — {files created count} files`

**Summarization is idempotent.** Running it twice on already-summarized content produces the same output.

---

## 5. Per-Agent Memory (delegate Context)

### 5.1 Memory Routing

Each delegate receives the full FORGE-MEMORY block, but only **reads** the sections relevant to its work. This is instruction-level filtering — the Planner tells each delegate which memory sections to prioritize.

| delegate | Reads | Uses for |
|---|---|---|
| **skill generator** | `active_patterns.naming`, `active_patterns.file_structure`, `preferences.style` | Naming generated skills, structuring SKILL.md content, matching style preferences |
| **agent generator** | `active_patterns.naming`, `decision_count`, `preferences.style` | Agent file naming, system prompt tone, knowing how mature the project is |
| **memory generator** | Full memory (all files) | Pattern extraction, confidence updates, conflict detection, summarization |
| **cookbook generator** | `active_patterns.*`, `preferences.frameworks`, `recent_history` | Recipe selection, code style, avoiding re-generating recently created recipes |

### 5.2 delegate Memory Instructions

Each delegate's agent definition (`.copilot/agents/{delegate}.md`) gets a new section:

```markdown
## Memory Context

Before generating, check the FORGE-MEMORY block for:
- {delegate-specific items from table above}

If FORGE-MEMORY is present:
- Apply active patterns as constraints on your output.
- Check recent_history to avoid duplicating recently created files.
- Respect preferences as soft defaults (user can override).

If FORGE-MEMORY is absent or empty:
- Proceed with Phase 3 behavior (no memory context). Do not warn about missing memory.
```

### 5.3 cookbook generator Enhancement

The cookbook generator gets the most significant memory upgrade because recipe selection is the most context-sensitive operation:

**Before generating recipes, the cookbook generator:**
1. Reads `recent_history` to find recipes already generated in previous sessions.
2. Reads `active_patterns` to match code style (error handling pattern, naming convention).
3. Reads `preferences.frameworks` to weight framework-specific recipes higher.
4. Checks the FORGE.md cookbook manifest comment to know what recipes exist.

**New behavior:** If the user says "add recipes," the cookbook generator generates only recipes that don't already exist — informed by both filesystem detection (skip-on-exist) and memory (know what was generated even if files were moved or renamed).

### 5.4 skill generator Enhancement

**Before generating skills, the skill generator:**
1. Reads `active_patterns.naming` to name skills consistently with existing ones.
2. Reads `active_patterns.testing` to populate testing skill with established test conventions.
3. Reads `decision_count` — if the project has >5 decisions, add a "project maturity" note to the conventions skill.

### 5.5 agent generator Enhancement

**Before generating agents, the agent generator:**
1. Reads `active_patterns.naming` for agent file naming.
2. Reads `preferences.style` to set the tone of agent system prompts (formal vs. casual, verbose vs. terse).
3. If this is a re-run and agents exist, reads the names of existing agents from `recent_history` to avoid naming collisions.

---

## 6. Memory Integrity & Safety

### 6.1 Graceful Degradation

Memory is parsed by an LLM, not a strict parser. But LLMs can still fail on sufficiently mangled input. The degradation ladder:

| Condition | Behavior |
|---|---|
| Memory files exist and parse cleanly | Full adaptive wizard + memory context |
| Memory files exist but one file fails to parse | Use parsed files, ignore the failed one, log warning |
| All memory files fail to parse | Degraded flow (Section 2.4) — full wizard, preserve files |
| `forge-memory/` directory exists but is empty | Treat as first run with memory enabled |
| `forge-memory/` directory doesn't exist | Treat as first run (Phase 3 flow) |

**Implementation:** The Planner wraps all memory parsing in a try-parse block. If parsing throws (malformed markdown, unexpected structure), catch and degrade. Never crash, never lose user data.

### 6.2 Hand-Edited Memory

Users are encouraged to edit memory files. The system handles common edits:

| User action | System response |
|---|---|
| Added a custom decision entry | Parsed and included in context. Format doesn't need to match exactly — extract what's recognizable. |
| Deleted a decision entry | No error. Decision count decreases. |
| Changed a pattern | New pattern is treated as authoritative. Confidence resets to "observed" on next extraction pass. |
| Added free-form notes between sections | Ignored during parsing (not under a recognized heading). Preserved on write. |
| Renamed section headings | Parser falls back to content-based extraction. If it can't find expected headings, that section is treated as missing. |

**Key principle:** The parser is forgiving. It extracts what it can and ignores what it can't. It never rewrites user content that it doesn't understand.

### 6.3 Memory Clearing ("Start Fresh")

When the user chooses "Start fresh" (wizard option 4) or explicitly says "clear memory":

1. **Do not delete files.** Instead, archive current content.
2. Rename each file: `decisions.md` → `decisions.md.bak.{date}`, etc.
3. Create fresh files from templates (same as first-run behavior).
4. Log a decision in the new `decisions.md`: "Memory cleared. Previous memory archived as .bak.{date} files."

**Rationale:** Deletion is irreversible. Archival lets users recover if they change their mind. `.bak` files are easily deleted manually.

### 6.4 Privacy & Security

Memory files must **never** contain:
- API keys, tokens, or secrets
- Passwords or credentials
- PII (names, emails, addresses) beyond what the user explicitly provides in wizard answers
- File contents (only file paths and descriptions)

**Implementation:** The memory generator's system prompt includes an explicit prohibition:

> Never write API keys, tokens, passwords, secrets, or personally identifiable information into memory files. If the user's project description contains such data, redact it before writing. Memory files track decisions and patterns — never credentials.

### 6.5 Memory Versioning

Memory files include a version comment on line 1:

```markdown
<!-- forge-memory/decisions.md — Generated by CopilotForge v1 -->
```

If CopilotForge's memory format changes in a future version:

1. Read the version comment.
2. If version is current: parse normally.
3. If version is older: attempt parse with best-effort compatibility. Log a decision: "Memory format upgraded from v{old} to v{new}."
4. If version is missing: treat as v1 (current Phase 4 format).

**Rationale:** Version comments are cheap insurance. They don't affect the user but give us a migration path.

---

## 7. FORGE.md as Memory Surface

### 7.1 Memory Status Section

Add a new section to FORGE.md between `## Memory` and `## What's Next`:

```markdown
## 🧠 Memory Status

<!-- forge:memory-status-start -->
| Metric | Value |
|---|---|
| Last run | 2026-04-16 |
| Sessions | 3 |
| Decisions logged | 7 |
| Patterns established | 12 |
| Preferences tracked | 5 |
| Memory health | ✅ All files readable |
<!-- forge:memory-status-end -->

> **Tip:** Edit `forge-memory/preferences.md` to tell CopilotForge about your coding style. Edit `forge-memory/patterns.md` to establish conventions agents should follow.
```

### 7.2 Merge Behavior

The Memory Status section is bounded by `<!-- forge:memory-status-start -->` and `<!-- forge:memory-status-end -->` merge markers, consistent with the Phase 3 FORGE.md merge pattern.

On re-runs:
- **Regenerate** the content between the markers with current metrics.
- **Preserve** any user content outside the markers.

### 7.3 Memory Health Indicator

The `Memory health` row reflects the parse result from Section 1:

| Parse result | Health display |
|---|---|
| All files parsed cleanly | ✅ All files readable |
| One file failed to parse | ⚠️ {filename} has parse issues — still usable |
| All files failed to parse | ❌ Memory unreadable — running in no-memory mode |
| Memory files don't exist | 📭 No memory yet — will be created on next run |

---

## 8. Phase Boundary

### 8.1 In Scope (Phase 4 Delivers)

| Deliverable | Description |
|---|---|
| Memory read-back protocol | Planner reads `forge-memory/` before wizard |
| FORGE-MEMORY context block | Structured memory passed to delegates |
| Adaptive wizard | Returning users see summary + options, not the same questions again |
| Partial memory handling | Missing answers are asked; known answers are pre-filled |
| Conflict resolution | Contradictions between memory and user input are resolved explicitly |
| Convention learning | Pattern extraction after each run with confidence levels |
| `forge-memory/history.md` | Per-session activity log |
| `forge-memory/preferences.md` | Extracted user preferences |
| Memory summarization | In-place summarization when memory exceeds budget |
| Per-agent memory routing | Each delegate reads relevant memory sections |
| Memory integrity & safety | Graceful degradation, hand-edit support, privacy rules |
| Memory clearing | Archive-based "start fresh" mechanism |
| Memory versioning | Version comments for future migration |
| FORGE.md memory surface | Live memory status section with merge markers |

### 8.2 Deferred (Not Phase 4)

| Item | Deferred To | Rationale |
|---|---|---|
| Custom delegate agents (user-defined) | Phase 5 | Requires agent plugin architecture — separate design pass |
| Plugin system for cookbook recipes | Phase 5 | Recipe system needs to stabilize before allowing plugins |
| CI/CD integration | Phase 5 | Memory in CI requires non-interactive mode first |
| Memory sharing across repos | Phase 5 | Cross-repo memory raises privacy and scope questions |
| Memory archival to `forge-memory/archive/` | Phase 5 | Summarization in Phase 4 is sufficient; archival adds file management complexity |
| Angular component recipes | Phase 5 | Deferred from Phase 3 — complex component model |
| Go/C# MCP recipes | Phase 5 | Deferred from Phase 3 — SDK stability |
| User-defined skill types in wizard | Phase 5 | Needs memory system to be stable first |
| Multi-repo scaffolding | Phase 6 | Requires cross-repo memory (Phase 5 prerequisite) |

---

## 9. Decisions

All architectural decisions made in this contract, with rationale.

### D4-01: Memory is advisory, never blocking

**Decision:** If memory parsing fails, the system degrades to the full wizard. Memory never prevents the Planner from running.

**Rationale:** A beginner who hand-edits `decisions.md` and breaks the format should not get a cryptic error. The whole point of CopilotForge is zero friction. Failing open (no memory) is always better than failing closed (can't run).

### D4-02: FORGE-MEMORY block extends FORGE-CONTEXT

**Decision:** Memory data is passed to delegates as a FORGE-MEMORY block appended to the existing FORGE-CONTEXT, not as a separate mechanism.

**Rationale:** FORGE-CONTEXT is the established inter-delegate contract from Phase 2. Adding a parallel system creates confusion. One context block, two sections.

### D4-03: Confidence levels tracked as inline HTML comments

**Decision:** Pattern confidence (`observed`, `confirmed`, `established`) is stored as HTML comments in `patterns.md`, not as visible metadata.

**Rationale:** Users read `patterns.md` for conventions. Machine metadata should be invisible to casual readers but accessible to the memory generator. HTML comments are invisible in rendered markdown but present in raw text.

### D4-04: Memory clearing archives rather than deletes

**Decision:** "Start fresh" renames memory files to `.bak.{date}` instead of deleting them.

**Rationale:** Deletion is irreversible. A user who clears memory and regrets it has no recourse. `.bak` files are trivially deletable but provide a safety net. This follows the same philosophy as "never overwrite existing files" from Phase 1.

### D4-05: Two new memory files — history.md and preferences.md

**Decision:** Add `forge-memory/history.md` (session log) and `forge-memory/preferences.md` (user preferences) as new memory surfaces.

**Rationale:** `decisions.md` tracks *what was decided*. `patterns.md` tracks *what conventions exist*. Neither tracks *what happened across sessions* (history) or *how the user likes to work* (preferences). These are distinct concerns that deserve distinct files. Keeping them separate means each can have its own read/write/summarize rules.

### D4-06: 500-line memory budget with in-place summarization

**Decision:** Total memory loaded into context is capped at ~500 lines. When exceeded, older entries are summarized in-place.

**Rationale:** LLM context windows are finite. Memory that exceeds the working window is worse than no memory — it crowds out the actual generation instructions. 500 lines accommodates ~10 detailed decisions + full patterns + 5 session logs + preferences, with headroom for growth. In-place summarization (rather than external archives) keeps the system single-file-per-concern.

### D4-07: Adaptive wizard shows four options for returning users

**Decision:** Returning users see a summary of known context and four action choices (add, change, re-scaffold, start fresh) instead of asking all questions again.

**Rationale:** Asking the same questions on every run is the antithesis of "learning." If the system already knows the answers, proving it by showing them builds trust. Four options cover the major returning-user intents: extending, tweaking, regenerating, and resetting.

### D4-08: Per-agent memory is instruction-filtered, not file-filtered

**Decision:** All delegates receive the full FORGE-MEMORY block. The Planner's dispatch instructions tell each delegate which sections to prioritize.

**Rationale:** Splitting memory into per-delegate files would create a synchronization problem (who updates what?) and add file management overhead. A single memory block with delegate-specific reading instructions is simpler and more maintainable. The LLM is good at following "focus on these sections" instructions.

### D4-09: Summarization is the sole exception to append-only decisions

**Decision:** When `decisions.md` is summarized, older verbose entries are replaced with one-line summaries. This is the only case where existing decision content is modified.

**Rationale:** Append-only is sacred — it prevents data loss. But unbounded append creates unusable files. Summarization is a controlled compression that preserves meaning while reducing volume. It's logged as a decision itself ("Memory summarized"), creating an audit trail.

### D4-10: Memory versioning via line-1 HTML comment

**Decision:** Memory files include a version comment on line 1 (`<!-- forge-memory/decisions.md — Generated by CopilotForge v1 -->`).

**Rationale:** If we change the memory format in Phase 5+, we need to know what version a user's memory is in. A line-1 comment is unobtrusive, doesn't affect rendering, and gives us a migration hook. Cost: one line per file. Benefit: future-proofing.

---

## File Manifest

Files created or modified by Phase 4 implementation:

| File | Action | Owner |
|---|---|---|
| `docs/phase4-architecture.md` | Created | Morpheus |
| `.copilot/agents/memory generator.md` | Updated — add read-back, extraction, summarization protocols | Neo |
| `.copilot/agents/skill generator.md` | Updated — add Memory Context section | Neo |
| `.copilot/agents/agent generator.md` | Updated — add Memory Context section | Neo |
| `.copilot/agents/cookbook generator.md` | Updated — add Memory Context section + recipe dedup logic | Neo |
| `.copilot/agents/planner.md` | Updated — add memory probe + adaptive wizard flow | Neo |
| `.github/skills/planner/SKILL.md` | Updated — Step 0 (memory probe) before Step 1 | Trinity |
| `templates/forge-memory/history.md` | Created — session history template | Neo |
| `templates/forge-memory/preferences.md` | Created — user preferences template | Neo |
| `templates/forge-memory/decisions.md` | Updated — add version comment | Neo |
| `templates/forge-memory/patterns.md` | Updated — add confidence comment syntax | Neo |
| `templates/utils/rerun-detection.md` | Updated — add memory read-back step | Neo |
| `tests/phase4/` | Created — validation scenarios for memory flows | Tank |
| `.squad/decisions.md` | Appended — Phase 4 decisions | Morpheus |
