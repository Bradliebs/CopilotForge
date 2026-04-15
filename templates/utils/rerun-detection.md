# Re-Run Detection — CopilotForge

> This specification tells the Planner how to handle re-runs — when a user triggers CopilotForge in a repo that already has CopilotForge files. Read this before dispatching specialists.

---

## Detection: Is This a Re-Run?

Check for these files in order. If **any** exist, this is a re-run.

| Check | Path | Confirms |
|---|---|---|
| 1 | `FORGE.md` | Repo has been forged before |
| 2 | `forge-memory/decisions.md` | Memory was enabled |
| 3 | `.copilot/agents/planner.md` | Agents were generated |
| 4 | `.github/skills/*/SKILL.md` | Skills were generated |
| 5 | `cookbook/README.md` | Cookbook was generated |

**If none exist:** This is a fresh run. Proceed normally.

**If any exist:** This is a re-run. Follow the strategies below.

---

## File-by-File Strategy

### FORGE.md — Merge

FORGE.md has user-editable sections and generated sections. On re-run:

**Preserve (never overwrite):**
- `## Project Summary` — the user may have edited the description
- `## 📝 How to Edit This File` — static, but don't touch it

**Regenerate (replace with current data):**
- `## 👥 Team Roster` — rebuild from agent-writer output
- `## ⚡ Skills Index` — rebuild from skill-writer output
- `## 📖 Cookbook Index` — rebuild from cookbook-writer output
- `## 🧠 Memory Status` — rebuild from memory-writer output
- `## 🚀 Quick Actions` — regenerate with current agent names

**How to merge:**
1. Read existing FORGE.md.
2. Extract the `## Project Summary` section (from `## Project Summary` to the next `---`).
3. Generate a fresh FORGE.md with current specialist outputs.
4. Replace the generated Project Summary with the preserved one.
5. Write the merged file.

---

### forge-memory/decisions.md — Append

Decisions are a chronological log. Never delete old entries.

**On re-run:**
1. Read existing `decisions.md`.
2. Find the `## Entries` section.
3. Insert a new entry **at the top** of Entries (most recent first):

```markdown
### {date} — CopilotForge re-scaffolded this project

**Context:** Re-run triggered. Previous scaffolding detected.
**Decision:** Updated project structure with new/changed specialists.
**Reason:** {user's reason — e.g., "stack changed", "adding testing", "routine update"}
**Impact:** {list what was added/changed/skipped}
```

4. Write the updated file.

**If the file doesn't exist but memory is now enabled:** Create it fresh.

---

### forge-memory/patterns.md — Additive Merge

Patterns accumulate. New patterns get added; existing patterns are never removed.

**On re-run:**
1. Read existing `patterns.md`.
2. Parse existing pattern headings (e.g., `### File Naming`, `### API Response Format`).
3. For each new pattern the memory-writer wants to add:
   - If a pattern with the same heading already exists: **skip it** (user may have customized it).
   - If no matching heading exists: **append it** to the appropriate section.
4. Write the updated file.

**Conflict resolution:** If a new stack pattern contradicts an existing one (e.g., user switched from Python to TypeScript), add the new pattern in a `## Stack Conventions (Updated {date})` subsection. Do not delete the old one — the user decides what to keep.

---

### .copilot/agents/*.md — Skip Existing

Agent definitions are frequently customized by users.

**On re-run:**
1. List existing files in `.copilot/agents/`.
2. For each agent the agent-writer wants to create:
   - If the file already exists: **skip it entirely**.
   - If the file doesn't exist: **create it**.
3. Report which agents were skipped and which were created.

**Exception:** If the user explicitly says "regenerate agents" or "overwrite agents," regenerate all agent files. Require explicit confirmation before overwriting.

---

### .github/skills/*/SKILL.md — Skip Existing

Skills are customizable and may have user edits.

**On re-run:**
1. List existing skill directories in `.github/skills/`.
2. For each skill the skill-writer wants to create:
   - If the skill directory already exists: **skip it entirely**.
   - If the skill directory doesn't exist: **create it**.
3. Report which skills were skipped and which were created.

**Exception:** Same as agents — explicit "regenerate" request overrides skip behavior.

---

### cookbook/* — Skip Existing

Cookbook recipes may have been edited or extended by the user.

**On re-run:**
1. List existing files in `cookbook/`.
2. For each recipe the cookbook-writer wants to create:
   - If the file already exists: **skip it**.
   - If the file doesn't exist: **create it**.
3. **Special case — `cookbook/README.md`:** Always regenerate to include the full current recipe list. But preserve any user-added content below a `<!-- user content below -->` marker if present.

---

## Re-Run Summary Template

After a re-run, the Planner reports:

```
🔄 CopilotForge re-scaffolding complete!

Created (new):
- {list of newly created files}

Updated (merged/appended):
- {list of files that were merged or appended to}

Skipped (already exist):
- {list of files that were skipped}

Your existing edits to FORGE.md, agents, skills, and recipes were preserved.
```

---

## Edge Cases

### User deleted some files but not others
Treat each file independently. If `FORGE.md` exists but `forge-memory/` doesn't, it's a partial re-run — create missing files, merge/append existing ones.

### User changed the stack between runs
Add new stack patterns to `patterns.md` without removing old ones. Flag this in the decisions log: "Stack changed from {old} to {new}."

### User wants a complete fresh start
If the user says "start fresh" or "overwrite everything," bypass all re-run logic. Generate everything from scratch. Record this as a decision: "Full regeneration requested — previous scaffolding overwritten."
