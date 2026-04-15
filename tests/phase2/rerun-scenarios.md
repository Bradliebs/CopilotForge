# CopilotForge Phase 2 — Re-Run Test Matrix

> Owned by **Tank** (Tester). This matrix defines expected behavior for every
> CopilotForge-generated file on first run vs. re-run.

---

## How to Read This Matrix

| Column | Meaning |
|--------|---------|
| **File/Directory** | The path CopilotForge generates |
| **First Run** | What happens when this file doesn't exist yet |
| **Re-Run (Unmodified)** | What happens when the file exists and user hasn't edited it |
| **Re-Run (User Modified)** | What happens when the user has manually edited the file |
| **Re-Run (User Deleted)** | What happens when the user has deleted the file |
| **Stack Changed** | What happens when the user re-runs with a different stack |

### Action Legend

| Symbol | Meaning |
|--------|---------|
| ➕ CREATE | File is created fresh |
| ⏭ SKIP | File already exists, left untouched |
| 🔀 MERGE | Existing content preserved, new content added |
| 📝 APPEND | New entries added to the end, nothing removed |
| 🔄 REPLACE | File is regenerated (old content lost) |
| ♻️ RECREATE | File was missing and is regenerated |
| ⚠️ WARN | User is warned about the situation |
| 🚫 PRESERVE | File is never touched (user's property) |

---

## Directory Structure

| Directory | First Run | Re-Run (Exists) | Re-Run (Deleted) | Notes |
|-----------|-----------|------------------|-------------------|-------|
| `.copilot/agents/` | ➕ CREATE | ⏭ SKIP | ♻️ RECREATE | Directory only — files handled below |
| `.github/skills/` | ➕ CREATE | ⏭ SKIP | ♻️ RECREATE | Directory only |
| `forge-memory/` | ➕ CREATE (if memory=yes) | ⏭ SKIP | ♻️ RECREATE + ⚠️ WARN | Contains user data — warn if re-creating |
| `cookbook/` | ➕ CREATE | ⏭ SKIP | ♻️ RECREATE | Directory only |
| `docs/` | ➕ CREATE | ⏭ SKIP | ♻️ RECREATE | For delegation-protocol.md |

---

## Core Files

| File | First Run | Re-Run (Unmodified) | Re-Run (User Modified) | Re-Run (User Deleted) | Stack Changed |
|------|-----------|---------------------|------------------------|----------------------|---------------|
| `FORGE.md` | ➕ CREATE | 🔀 MERGE (update tables) | 🔀 MERGE (preserve custom sections, update generated tables) | ♻️ RECREATE | 🔀 MERGE (add new stack info) |
| `docs/delegation-protocol.md` | ➕ CREATE | ⏭ SKIP | ♻️ RECREATE | ⏭ SKIP (internal doc, stack-independent) |

---

## Agent Files (`.copilot/agents/`)

| File | First Run | Re-Run (Unmodified) | Re-Run (User Modified) | Re-Run (User Deleted) | Stack Changed |
|------|-----------|---------------------|------------------------|----------------------|---------------|
| `planner.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE + ⚠️ WARN | 🔀 MERGE (add stack references) |
| `reviewer.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE + ⚠️ WARN | 🔀 MERGE |
| `tester.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE + ⚠️ WARN | 🔀 MERGE |
| `<custom-agent>.md` | N/A (user-created) | 🚫 PRESERVE | 🚫 PRESERVE | N/A | 🚫 PRESERVE |

### Key Rule: User-modified agent files are NEVER overwritten. User-created agent files are NEVER touched.

---

## Skill Files (`.github/skills/`)

| File | First Run | Re-Run (Unmodified) | Re-Run (User Modified) | Re-Run (User Deleted) | Stack Changed |
|------|-----------|---------------------|------------------------|----------------------|---------------|
| `planner/SKILL.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE + ⚠️ WARN | 🔀 MERGE |
| `planner/reference.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE | 🔀 MERGE |
| `<stack-specific>/SKILL.md` | ➕ CREATE (if stack matches) | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE | ➕ CREATE new skills for new stack |
| `<custom-skill>/SKILL.md` | N/A (user-created) | 🚫 PRESERVE | 🚫 PRESERVE | N/A | 🚫 PRESERVE |

### Key Rule: New stack = new skill directories added. Old skill directories are never removed.

---

## Memory Files (`forge-memory/`)

| File | First Run | Re-Run (Unmodified) | Re-Run (User Modified) | Re-Run (User Deleted) | Stack Changed |
|------|-----------|---------------------|------------------------|----------------------|---------------|
| `decisions.md` | ➕ CREATE | 📝 APPEND (add re-run entry) | 📝 APPEND (preserve all existing, add new at end) | ♻️ RECREATE + ⚠️ WARN ("Previous decisions were lost") | 📝 APPEND (record stack change decision) |
| `patterns.md` | ➕ CREATE | 🔀 MERGE (add new patterns) | 🔀 MERGE (preserve custom patterns, add new) | ♻️ RECREATE + ⚠️ WARN | 🔀 MERGE (add stack-specific patterns) |

### Key Rules:
- **decisions.md is APPEND-ONLY.** Entries are never deleted, edited, or reordered.
- **patterns.md uses MERGE.** Existing patterns stay, new patterns are added, duplicates are skipped.
- **If memory=no on re-run but files exist:** Files are PRESERVED with a warning. Never delete user data.

---

## Cookbook Files (`cookbook/`)

| File | First Run | Re-Run (Unmodified) | Re-Run (User Modified) | Re-Run (User Deleted) | Stack Changed |
|------|-----------|---------------------|------------------------|----------------------|---------------|
| `session-example.ts` | ➕ CREATE (if TS stack) | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE | ⏭ SKIP (preserve existing) |
| `session-example.py` | ➕ CREATE (if Python stack) | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE | ⏭ SKIP (preserve existing) |
| `<new-stack-recipe>.*` | N/A | N/A | N/A | N/A | ➕ CREATE (add for new stack) |
| `<custom-recipe>.*` | N/A (user-created) | 🚫 PRESERVE | 🚫 PRESERVE | N/A | 🚫 PRESERVE |

### Key Rule: New stack = new recipes added. Existing recipes (generated or custom) are never removed or modified.

---

## Specialist Agent Templates (`templates/agents/`)

These are the Phase 2 specialist definitions that ship with the CopilotForge framework itself, NOT with scaffolded projects. Re-run behavior is less relevant here (they're part of the framework, not user output), but listed for completeness.

| File | First Run | Re-Run (Unmodified) | Re-Run (User Modified) | Re-Run (User Deleted) |
|------|-----------|---------------------|------------------------|----------------------|
| `templates/agents/skill-writer.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE |
| `templates/agents/agent-writer.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE |
| `templates/agents/memory-writer.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE |
| `templates/agents/cookbook-writer.md` | ➕ CREATE | ⏭ SKIP | 🚫 PRESERVE | ♻️ RECREATE |

---

## Decision Summary: Re-Run Philosophy

These are the principles that should govern re-run behavior. They're Tank's recommendations, pending team confirmation:

1. **User data is sacred.** Never delete, overwrite, or reorder content the user created or edited.
2. **Append, don't replace.** For decision logs and pattern libraries, only add — never subtract.
3. **Merge, don't duplicate.** For structured files (FORGE.md tables), update existing rows rather than appending duplicates.
4. **Warn on re-creation.** If a file was deleted and is being re-created, tell the user.
5. **New stack = additive.** Changing the stack adds new files; it never removes files from the old stack.
6. **Disabling a feature ≠ deleting its data.** Setting memory=no on re-run doesn't delete `forge-memory/`.
7. **Idempotent on identical inputs.** Running the same wizard with the same answers twice should produce identical output (second run is a no-op or equivalent).

---

## Edge Cases Not Yet Covered

| Scenario | Question | Tank's Recommendation |
|----------|----------|----------------------|
| File has merge conflict markers | What if a user's manual edit left `<<<<<<<` markers? | Treat as user-modified — PRESERVE, don't try to parse |
| Binary files in cookbook | What if user added a .png or .wasm to cookbook/? | PRESERVE — we don't manage files we didn't create |
| Symlinked directories | What if `.copilot/agents/` is a symlink? | Follow the symlink, treat as normal directory |
| Git-ignored files | What if generated files are in .gitignore? | Still create them — .gitignore is the user's choice |
| Concurrent re-runs | What if two re-runs happen simultaneously? | Undefined — flag as known limitation |
