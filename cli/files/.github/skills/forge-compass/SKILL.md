---
name: "forge-compass"
description: "Pre-scaffold gate that reads memory, detects build-path signals, checks for contradictions, and flags prerequisite risks — silently passing through when everything is consistent"
domain: "scaffolding"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "check my path"
  - "validate my path"
  - "compass check"
---

<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     This skill runs automatically before the Planner routes you to a build path. -->

# Forge Compass

> A silent pre-scaffold gate. Compass reads your memory, scans your words for build-path signals, checks for contradictions, and flags risks — all before the wizard routes you anywhere. When everything is consistent, it outputs nothing. When something is off, it surfaces one compact, focused warning.

## What This Does

Compass runs between Question 1 and specialist delegation. It classifies signals from the user's project description into one of 10 build paths (A–J), compares that against stored memory, and surfaces a contradiction warning only when confidence is high enough to challenge. Prerequisite risks for paths that need tooling are flagged in the same pass.

**Compass never blocks scaffolding.** It can warn, flag, and ask a single clarifying question — but it always yields control back to the Planner.

**Build paths:**

| Path | Label | `EXTENSION_REQUIRED` |
|------|-------|----------------------|
| A | Copilot Studio Agent | false |
| B | Studio + Connector | true |
| C | Declarative Agent | false |
| D | Canvas App Agent | false |
| E | Power Automate | false |
| F | PCF Code Component | true |
| G | Power BI | false |
| H | SharePoint / Teams | false |
| I | Power Pages | false |
| J | Developer Project | false |

---
### Capture Decisions (forge remember)

If the user says **"forge remember: [anything]"** at any point in this conversation,
immediately acknowledge it ("Got it — logging that.") and append a new entry to
`forge-memory/decisions.md` in this format:

```
## [YYYY-MM-DD] [brief label]
[the user's exact words]
```

Then continue the conversation without interruption. Do not ask for confirmation.


## Instructions

When this skill is triggered (or invoked internally by the Planner after Q1), execute all five steps in order. Steps 0, 1, and 4 are always silent. Steps 2 and 3 surface output only when specific conditions are met. Complete all steps before returning control.

---

### Step 0 — Memory Read (silent)

1. Check whether `forge-memory/preferences.md` exists.
2. If the file exists, read it and extract `BUILD_PATH` and `PATH_NAME`.
   - Store these as `stored_path` and `stored_path_name`.
3. If the file does not exist, or either field is absent: set `stored_path = null`.

Do not output anything during this step.

---

### Step 1 — Signal Scan (silent)

Review the user's Q1 answer (current session project description). Classify every relevant keyword into one of two buckets:

**PP_SIGNALS** (Power Platform keywords):
- `no-code`, `low-code`, `copilot studio`, `agent`, `connector`, `canvas app`, `power automate`, `flow`, `pcf`, `power component`, `power bi`, `report`, `semantic model`, `sharepoint`, `teams`, `power pages`

**DEV_SIGNALS** (Developer/code keywords):
- `typescript`, `node`, `python`, `api`, `repo`, `github`, `code`, `function`, `endpoint`, `sdk`, `cli`

Use the signal table below to assign `detected_path`:

| Signal pattern | detected_path |
|---|---|
| (`no-code` or `low-code` or `copilot studio`) + `agent` | A |
| (`no-code` or `low-code`) + (`connector` or `api`) | B |
| `canvas app` | D |
| `power automate` or `flow` | E |
| (`typescript` or `node`) + (`pcf` or `component`) | F |
| `power bi` or `report` or `semantic model` | G |
| `sharepoint` + (`agent` or `teams`) | H |
| `power pages` | I |
| `agent` alone (no-code signal absent) | C |
| No matching pattern, or ambiguous | J |

Assign `confidence` based on signal count:
- **High** — 3 or more distinct PP_SIGNALS or a clear pattern match
- **Medium** — 1–2 signals matching a path
- **Low** — ambiguous signals, conflicting signals, or no signals (→ default J)

Do not output anything during this step.

---

### Step 2 — Contradiction Check

Apply this logic in order and stop at the first branch that fires:

1. If `stored_path` is null → **proceed silently** (no memory to contradict).
2. If `stored_path == detected_path` → **proceed silently** (memory and signals agree).
3. If `stored_path != detected_path` AND `confidence` is **Low** → **proceed silently** (insufficient signal to challenge memory).
4. If `stored_path != detected_path` AND `confidence` is **Medium or High** → surface this warning:

```
⚠️ Your memory shows you were on **[stored_path_name]** (Path [stored_path]). Your current answers suggest **[detected_path_name]** (Path [detected_path]). Are you switching paths? (yes / no, stay on [stored_path_name])
```

Replace `[stored_path_name]`, `[stored_path]`, `[detected_path_name]`, and `[detected_path]` with the actual values. Wait for the user's answer before proceeding.

- If user answers **yes**: update `detected_path` to the new path and continue.
- If user answers **no** (stay): set `detected_path = stored_path` and continue.

---

### Step 3 — Prerequisite Risk Flag

Check `detected_path` and surface the matching flag if present. Only one flag fires per run.

| detected_path | Flag to surface |
|---|---|
| F | `⚠️ Path F (PCF Code Component) requires Node.js ≥16 and the pac CLI. Confirm you have these before continuing.` |
| B | `⚠️ Path B requires a working REST API endpoint to wrap as a connector.` |
| All others | *(silent)* |

---

### Step 4 — Motivated Reasoning Detection (silent unless mismatch is clear)

If the user has stated an explicit path preference (e.g., "I want to build a Power BI report" but their Q1 description contains only DEV_SIGNALS), and the mismatch between stated preference and `detected_path` is unambiguous:

```
Just checking: you mentioned [stated preference] but your description sounds more like [detected_path_name] (Path [detected_path]). Want to continue with [stated preference]?
```

Only trigger this if the mismatch is clear — not on ambiguous or partial overlaps. When in doubt, stay silent.

---

### Step 5 — Output and Context Write

**Output:**
- If no warnings or flags were triggered in Steps 2–4: output **nothing**. The skill passes through silently.
- If any warnings were triggered: output them in a single compact block, one item per line. No preamble.

**Always write these FORGE-CONTEXT fields** based on `detected_path`:

| Field | Value |
|---|---|
| `BUILD_PATH` | `detected_path` (A–J) |
| `PATH_NAME` | Human-readable label from the path table above |
| `EXTENSION_REQUIRED` | `true` only for paths B and F; `false` for all others |

**Memory write rule:**
- Write `BUILD_PATH` to `forge-memory/preferences.md` **only after** the user confirms (if Step 2 triggered a contradiction warning), or immediately on first run when `stored_path` is null.
- Do not write during a no-contradiction silent pass if memory already has a matching value.

---

## Examples

### Silent pass-through (no signals, no memory)

User Q1: "I'm building a customer support tool."
- Step 0: `forge-memory/preferences.md` not found → `stored_path = null`
- Step 1: No PP_SIGNALS, no DEV_SIGNALS → `detected_path = J`, confidence = Low
- Steps 2–4: All silent
- Step 5: Output nothing. Set `BUILD_PATH: J`, `PATH_NAME: Developer Project`, `EXTENSION_REQUIRED: false`.

### Contradiction warning fires

User Q1: "I need a canvas app with an agent."
- Step 0: preferences.md found → `stored_path = G`, `stored_path_name = Power BI`
- Step 1: `canvas app` signal → `detected_path = D`, confidence = High
- Step 2: `stored_path (G) != detected_path (D)`, confidence = High → surface warning:
  > ⚠️ Your memory shows you were on **Power BI** (Path G). Your current answers suggest **Canvas App Agent** (Path D). Are you switching paths? (yes / no, stay on Power BI)

### PCF prerequisite flag

User Q1: "I want to build a TypeScript PCF component for my model-driven app."
- Step 0: `stored_path = null`
- Step 1: `typescript` + `pcf` → `detected_path = F`, confidence = High
- Step 2: Silent (stored_path null)
- Step 3: Path F → flag: `⚠️ Path F (PCF Code Component) requires Node.js ≥16 and the pac CLI. Confirm you have these before continuing.`
- Step 5: Set `BUILD_PATH: F`, `PATH_NAME: PCF Code Component`, `EXTENSION_REQUIRED: true`.

---

## Anti-Patterns

- **Asking the user what path they're on** — Compass detects the path from signals. Never ask "Which path are you on?" directly; infer it.
- **Surfacing a warning for Low confidence** — Low confidence means insufficient signal to challenge. Stay silent.
- **Outputting multiple contradiction warnings** — One warning per run. The path table produces a single `detected_path`; one contradiction is possible.
- **Blocking scaffolding** — Compass warns; it never stops the wizard. If the user ignores a flag, continue.
- **Writing memory before confirmation** — When a contradiction warning fires, wait for the user's yes/no before writing `BUILD_PATH` to `preferences.md`.
- **Triggering motivated reasoning on partial overlap** — Only fire Step 4 when the mismatch is unambiguous. Partial or weak overlaps get silence.
