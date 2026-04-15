# Memory Summarizer Specification

> How CopilotForge condenses memory files when they grow too large. The summarizer keeps memory fast to load and cheap to parse without losing important context.

---

## Overview

As a project evolves, memory files accumulate entries. Left unchecked, `decisions.md` could have hundreds of entries and `history.md` dozens of sessions. The summarizer compresses old data into concise summaries while archiving the originals, so the memory reader stays fast and the Planner's context window stays lean.

---

## When to Summarize

Summarization triggers are checked at the **end** of each Planner session, after the memory writer has finished appending new entries.

| File | Trigger Condition | Action |
|---|---|---|
| `forge-memory/decisions.md` | More than 50 entries | Summarize entries older than 30 days |
| `forge-memory/patterns.md` | More than 30 patterns | Merge overlapping patterns |
| `forge-memory/history.md` | More than 20 sessions | Summarize sessions older than 60 days |

**If no trigger fires:** Do nothing. Summarization is opt-in by threshold, never forced.

---

## Summarization Strategies

### Decisions: Collapse Old Entries

**What to keep in full:** All entries from the last 30 days remain as-is with all fields.

**What to summarize:** Entries older than 30 days are collapsed into one-liners:

```markdown
### Archived Decisions (before {cutoff_date})

- **2026-03-10:** Switched from REST to GraphQL — better for nested data queries
- **2026-03-05:** Added Redis caching — API response times exceeded 500ms
- **2026-02-28:** Initial scaffolding — TypeScript, Express, Prisma stack
```

**Rules:**
- Each one-liner follows the format: `**{date}:** {title} — {decision or reason in ≤15 words}`
- Archived one-liners are grouped under a single `### Archived Decisions` heading
- If an `### Archived Decisions` section already exists, append to it (don't create a second one)
- Stack decisions get a `[stack]` tag for easy scanning: `**2026-03-10:** [stack] Switched to GraphQL`
- Preference decisions get a `[pref]` tag: `**2026-03-01:** [pref] Set verbosity to advanced`

### Archive: Preserve Full Entries

Before summarizing, copy the full original entries to an archive file.

**Archive path:** `forge-memory/archive/decisions-{year}.md`

**Archive format:**

```markdown
# Decisions Archive — {year}

> Full entries archived by CopilotForge memory summarizer on {date}.
> These entries were summarized in forge-memory/decisions.md.

---

{full original entries, verbatim, in chronological order}
```

**Rules:**
- Create the `forge-memory/archive/` directory if it doesn't exist.
- If the archive file for the current year already exists, append new archived entries below existing ones.
- Never modify previously archived entries.
- Add a separator (`---`) between archive batches with the archive date.

### Patterns: Merge Overlapping

When `patterns.md` exceeds 30 patterns, look for merge opportunities.

**Merge candidates:**
1. **Same category, different specifics:** Two `### API Response Format` patterns → merge into one with both examples.
2. **Superseded patterns:** If a newer pattern explicitly updates an older one (same heading with a later date), keep only the newer one and note the merge.
3. **Confidence promotion:** If multiple `observed` patterns in the same category exist, merge them into one `confirmed` pattern.

**Merge format:**

```markdown
### API Response Format (established)
**When to use:** All API endpoints.
**Pattern:** Return `{ data, error, meta }` objects.
**Confidence:** established (merged from 3 related patterns)
**History:** Merged from "API Response Format (observed)" on 2026-03-10 and "API Error Shape (confirmed)" on 2026-03-15.
```

**Rules:**
- Never merge patterns from different categories (don't merge a naming pattern with a structure pattern).
- Add a `**History:**` field showing what was merged and when.
- If in doubt, don't merge — it's safer to keep patterns separate than to lose nuance.

### History: Collapse Old Sessions

Sessions older than 60 days are collapsed into monthly summaries.

**Summary format:**

```markdown
### Monthly Summary — {Month Year}

| Metric | Value |
|---|---|
| Sessions | {count} |
| Files created | {total} |
| Files updated | {total} |
| Key changes | {comma-separated list of notable changes} |
```

**Rules:**
- "Key changes" is derived from the session entries' descriptions — pick the 3 most significant.
- Individual session entries within the month are removed after summarization.
- Sessions from the last 60 days remain as full individual entries.

---

## Safety Guarantees

### 1. Always Archive Before Summarizing

No data is summarized in-place without first being archived. The sequence is always:

```
1. Read current file
2. Identify entries to summarize
3. Write those entries to the archive file (append)
4. Rewrite the main file with summarized versions
```

If step 3 fails (archive write error), **do not proceed to step 4**. Abort and log the error.

### 2. Idempotent

Running the summarizer twice in a row produces the same result:
- Entries already summarized (one-liners) are not re-summarized.
- Entries already archived are not re-archived (check the archive file for duplicates by date+title).
- Monthly history summaries are not re-summarized.

**How to detect already-summarized entries:**
- One-liner entries (no sub-fields like `**Context:**`) are already summarized — skip them.
- Entries under `### Archived Decisions` are already summarized — skip them.
- `### Monthly Summary` headings in history are already collapsed — skip them.

### 3. User Can Restore

If a user wants to see the full original entries:
1. Open `forge-memory/archive/decisions-{year}.md`.
2. Copy the entries they want.
3. Paste them back into `forge-memory/decisions.md`.

The reader treats restored entries the same as any other entry — no special handling needed.

### 4. Never Delete Raw Data

The summarizer transforms data in the main files but never deletes archive files. Even if the main file is cleared, the archive retains the full history.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| File just barely exceeds threshold (e.g., 51 entries) | Summarize — don't wait for a larger buffer |
| All entries are less than 30 days old | Nothing to summarize; no-op |
| Archive file is very large (>500KB) | Start a new archive: `decisions-{year}-2.md` |
| Entry has no date | Treat as "oldest" — summarize it first |
| Patterns have identical names but different content | Don't merge — flag as "conflicting" in a comment |
| History has gaps (missing months) | Summarize each month independently; gaps are fine |
| `forge-memory/archive/` has user-added files | Ignore them — only read/write `decisions-*.md` and `history-*.md` |

---

## Trigger Integration

The summarizer is invoked by the Planner at the end of a session:

```
1. Memory writer finishes (decisions appended, patterns updated)
2. Planner checks summarization triggers:
   a. Count entries in decisions.md → if > 50, invoke decision summarizer
   b. Count patterns in patterns.md → if > 30, invoke pattern merger
   c. Count sessions in history.md → if > 20, invoke history summarizer
3. Summarizer runs (archive, then compress)
4. Session ends
```

The summarizer does **not** run on first-run sessions (nothing to summarize yet).

---

## Relationship to Other Specs

| Spec | Relationship |
|---|---|
| `memory-reader.md` | Reader consumes the files that summarizer compresses — same format |
| `convention-extractor.md` | Extractor adds patterns; summarizer merges them when they grow |
| `rerun-detection.md` | Re-run detection is unaffected by summarization (file existence unchanged) |
