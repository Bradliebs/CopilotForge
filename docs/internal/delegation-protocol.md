# Delegation Protocol — CopilotForge Phase 2

> Engineering specification for how the Planner delegates work to specialist agents.
> This is the internal spec, not the user-facing doc.

---

## Overview

In Phase 1, the Planner did everything: intake, generation, validation. Phase 2 splits generation into four specialist agents that the Planner orchestrates. The Planner becomes a coordinator — it runs the wizard, collects answers, then delegates file creation to specialists.

---

## Delegation Flow

```
User
  │
  ▼
Planner (wizard intake — 6 questions)
  │
  ▼
Confirm summary with user
  │
  ▼
Planner dispatches specialists:
  │
  ├── skill-writer ──────────────────────┐
  │     Generates: .github/skills/*      │
  │     Output: list of skill names      │
  │                                      │
  │   ┌──────────── waits for skill names │
  │   ▼                                  │
  ├── agent-writer                       │  (sequential — needs skill names)
  │     Generates: .copilot/agents/*     │
  │     Output: list of agent names      │
  │                                      │
  ├── memory-writer ─────────────────────┤  (parallel — no dependencies)
  │     Generates: forge-memory/*        │
  │     Output: confirmation             │
  │                                      │
  └── cookbook-writer ────────────────────┘  (parallel — no dependencies)
        Generates: cookbook/*
        Output: list of recipe names
  │
  ▼
Planner collects all outputs
  │
  ▼
Planner generates FORGE.md (needs all names/paths)
  │
  ▼
Planner prints validation summary
```

### Execution Order

1. **skill-writer** runs first (other agents may reference skill names).
2. **agent-writer** runs after skill-writer completes (agents reference skills).
3. **memory-writer** and **cookbook-writer** run in parallel with agent-writer (no cross-dependencies).
4. **Planner** assembles FORGE.md after all specialists finish.

---

## Input/Output Contracts

### Planner → All Specialists (Common Input)

Every specialist receives the same base context from the Planner:

```yaml
project-name: string        # From wizard Q1 (slug form)
project-description: string  # From wizard Q1 (full text)
stack: string                # From wizard Q2
memory-enabled: boolean      # From wizard Q3
testing-enabled: boolean     # From wizard Q4
skill-level: string          # From wizard Q5 (beginner|intermediate|advanced)
date: string                 # ISO date of scaffolding run
existing-files: string[]     # List of CopilotForge files already in the repo
```

### skill-writer

**Input:** Common context (above).

**Output:**
```yaml
skills-created:
  - name: string             # e.g., "project-conventions"
    path: string             # e.g., ".github/skills/project-conventions/SKILL.md"
    domain: string           # e.g., "project-conventions"
    description: string      # One-line summary
status: "success" | "partial" | "failed"
errors: string[]             # Empty on success
```

**Behavior:**
- Always generates `project-conventions` skill.
- Always generates `code-review` skill.
- Generates `testing` skill only if `testing-enabled: true`.
- Adapts patterns/conventions to the declared `stack`.

### agent-writer

**Input:** Common context + skill-writer output (skill names and paths).

**Output:**
```yaml
agents-created:
  - name: string             # e.g., "reviewer"
    path: string             # e.g., ".copilot/agents/reviewer.md"
    role: string             # One-line role
    skills-referenced: string[]  # Which skills this agent uses
status: "success" | "partial" | "failed"
errors: string[]
```

**Behavior:**
- Always generates `planner.md` (self-referencing orchestrator).
- Always generates `reviewer.md` (references code-review skill).
- Generates `tester.md` only if `testing-enabled: true`.
- Each agent's System Prompt / Skills section references the correct skill paths from skill-writer output.

### memory-writer

**Input:** Common context.

**Output:**
```yaml
memory-created:
  - name: string             # e.g., "decisions.md"
    path: string             # e.g., "forge-memory/decisions.md"
status: "success" | "partial" | "failed"
errors: string[]
```

**Behavior:**
- Skips entirely if `memory-enabled: false`.
- Creates `decisions.md` with initial scaffolding entry.
- Creates `patterns.md` with stack-specific conventions.
- On re-run: follows merge/append strategy (see Re-Run Detection).

### cookbook-writer

**Input:** Common context.

**Output:**
```yaml
recipes-created:
  - name: string             # e.g., "session-example.ts"
    path: string             # e.g., "cookbook/session-example.ts"
    language: string         # e.g., "TypeScript"
    description: string      # One-line summary
status: "success" | "partial" | "failed"
errors: string[]
```

**Behavior:**
- Always generates `cookbook/README.md`.
- Generates stack-appropriate recipes based on declared `stack`.
- Adjusts comment verbosity based on `skill-level`.

---

## Re-Run Detection

Before dispatching specialists, the Planner scans for existing CopilotForge files. See `templates/utils/rerun-detection.md` for the full specification.

### Detection Heuristic

The Planner checks for these marker files:
1. `FORGE.md` — if present, this repo has been forged before.
2. `forge-memory/decisions.md` — if present, memory was enabled.
3. `.copilot/agents/planner.md` — if present, agents exist.
4. `.github/skills/*/SKILL.md` — if present, skills exist.

### Decision Matrix

| File Exists? | Action |
|---|---|
| `FORGE.md` | Merge: preserve Project section, regenerate tables |
| `forge-memory/decisions.md` | Append: add new scaffolding entry, keep old entries |
| `forge-memory/patterns.md` | Merge: keep existing patterns, add new stack patterns |
| `.copilot/agents/*.md` | Skip existing, create only new agents |
| `.github/skills/*/SKILL.md` | Skip existing, create only new skills |
| `cookbook/*` | Skip existing, create only new recipes |

### User Notification

On re-run detection, the Planner informs the user:

> **I detected an existing CopilotForge setup.** I'll preserve your edits and only add what's new. Here's what I'll do:
> - {list of skip/merge/append actions}
> Ready to proceed?

---

## Error Handling

### Specialist Failure Modes

| Failure | Recovery |
|---|---|
| Specialist produces invalid markdown | Planner catches malformed output, retries once with stricter instructions |
| Specialist times out (no response) | Planner logs the gap, continues with other specialists, reports partial result |
| Specialist creates file that already exists | Skipped — existing files are never overwritten without explicit user consent |
| skill-writer fails (blocks agent-writer) | Planner falls back to generating agents without skill references, logs warning |
| Multiple specialists fail | Planner generates what it can, reports partial scaffolding with clear list of what's missing |

### Partial Scaffolding

If any specialist fails, the Planner still:
1. Creates FORGE.md with whatever was generated.
2. Marks missing items in the validation summary with ⚠️.
3. Records the partial run in `forge-memory/decisions.md`.
4. Tells the user exactly what to re-run.

Example output on partial failure:

```
✅ CopilotForge scaffolding partially complete.

Created:
- 2 skills — project-conventions, code-review
- 2 agents — planner, reviewer
- 1 control panel — FORGE.md

⚠️ Could not create:
- cookbook recipes (cookbook-writer failed — no recipes generated)
- memory files (memory-writer timed out)

To finish: Run "Re-scaffold" to retry the missing pieces.
```

### Idempotency Guarantee

Running the Planner twice with the same answers produces the same result (minus timestamps). No existing user edits are destroyed. This is the core safety property of the delegation protocol.

---

## Sequence Diagram (Detailed)

```
User          Planner         skill-writer    agent-writer    memory-writer   cookbook-writer
  │               │                │               │               │               │
  │──"forge"─────▶│               │               │               │               │
  │               │               │               │               │               │
  │◀──Q1─────────│               │               │               │               │
  │──answer──────▶│               │               │               │               │
  │◀──Q2─────────│               │               │               │               │
  │──answer──────▶│               │               │               │               │
  │◀──Q3─────────│               │               │               │               │
  │──answer──────▶│               │               │               │               │
  │◀──Q4─────────│               │               │               │               │
  │──answer──────▶│               │               │               │               │
  │◀──Q5─────────│               │               │               │               │
  │──answer──────▶│               │               │               │               │
  │               │               │               │               │               │
  │◀──summary────│               │               │               │               │
  │──confirm─────▶│               │               │               │               │
  │               │               │               │               │               │
  │               │──context─────▶│               │               │               │
  │               │               │──generates───▶│               │               │
  │               │◀──skill list──│               │               │               │
  │               │               │               │               │               │
  │               │──context+skills──────────────▶│               │               │
  │               │──context─────────────────────────────────────▶│               │
  │               │──context──────────────────────────────────────────────────────▶│
  │               │               │               │               │               │
  │               │◀──agent list─────────────────│               │               │
  │               │◀──memory status──────────────────────────────│               │
  │               │◀──recipe list────────────────────────────────────────────────│
  │               │               │               │               │               │
  │               │──assemble FORGE.md            │               │               │
  │               │               │               │               │               │
  │◀──summary────│               │               │               │               │
  │               │               │               │               │               │
```

---

## Implementation Notes

- Specialists are Copilot agents (markdown definitions in `.copilot/agents/`), not code. They execute within the Copilot chat context.
- The Planner "dispatches" by including the specialist's instructions and context in its own response, asking the LLM to role-play as each specialist in sequence.
- In environments that support multi-agent orchestration (e.g., VS Code Copilot with agent routing), the Planner can delegate to actual agent endpoints.
- The input/output contracts above are conceptual — in practice, the data flows as structured markdown sections within the conversation.
