# 🔥 CopilotForge — Full System Breakdown

> A complete map of every layer, file, command, and design decision in this repo.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Layer 1 — CLI](#layer-1--cli)
- [Layer 2 — Skills](#layer-2--skills)
- [Build Path Routing (Phase 13)](#build-path-routing-phase-13)
- [Layer 3 — Agents](#layer-3--agents)
- [Layer 4 — Memory](#layer-4--memory)
- [Layer 5 — Cookbook](#layer-5--cookbook)
- [Layer 6 — FORGE.md](#layer-6--forgemd)
- [Layer 7 — Squad (Internal Dev Team)](#layer-7--squad-internal-dev-team)
- [Data Flow](#data-flow)
- [Key Design Principles](#key-design-principles)
- [Development Phase History](#development-phase-history)
- [Test Coverage](#test-coverage)
- [Examples](#examples)
- [Open Issues & Known Gaps](#open-issues--known-gaps)

---

## Project Overview

| Field | Value |
|-------|-------|
| **Name** | CopilotForge (repo: Oracle_Prime) |
| **Owner** | Brad Liebs |
| **npm package** | `copilotforge` |
| **CLI version** | 1.9.0 |
| **Node requirement** | >=18.0.0 |
| **Dependencies** | Zero (pure Node.js + markdown) |

CopilotForge scaffolds AI-powered tooling — skills, agents, memory, cookbook recipes — into any repo from a plain-English project description. One command, no installs, no frameworks required in the target project.

---

## Architecture at a Glance

```
User / AI Chat
      │
      ▼
┌──────────────────────────────────────┐
│  Layer 1: CLI  (npx copilotforge)    │  ← Entry point for humans
│  cli/bin/copilotforge.js             │
└──────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│  Layer 2: Skills                     │  ← Planner + Plan-Executor
│  .github/skills/{name}/SKILL.md      │
└──────────────────────────────────────┘
      │  triggers
      ▼
┌──────────────────────────────────────┐
│  Layer 3: Agents                     │  ← Planner + 4 internal specialists
│  .copilot/agents/{name}.md           │
└──────────────────────────────────────┘
      │  generates
      ▼
┌───────────┬──────────────┬───────────┐
│  Layer 4  │   Layer 5    │  Layer 6  │
│  Memory   │  Cookbook    │  FORGE.md │
│forge-mem/ │  cookbook/   │  (root)   │
└───────────┴──────────────┴───────────┘
      │
      ▼
┌──────────────────────────────────────┐
│  Layer 7: Squad Team  (.squad/)      │  ← Internal AI team that builds CopilotForge
└──────────────────────────────────────┘
```

---

## Layer 1 — CLI

**Location:** `cli/`  
**Entry point:** `cli/bin/copilotforge.js`  
**Published as:** `copilotforge` on npm

The CLI is the human-facing entry point. It installs, upgrades, diagnoses, and manages the framework files. It does NOT run the wizard — that's the Planner skill's job.

### Commands

| Command | Source file | What it does |
|---------|-------------|-------------|
| `copilotforge` (no args) | `src/interactive.js` | Interactive terminal UI — dashboard + numbered menu loop |
| `copilotforge init` | `src/init.js` | Copies core skill files + writes template files into the target project |
| `copilotforge init --minimal` | `src/init.js` | Core skill files only (2 files) |
| `copilotforge init --yes` | `src/init.js` | Non-interactive — auto-overwrite + auto-commit |
| `copilotforge upgrade` | `src/upgrade.js` | Updates framework-owned files; preserves all user state |
| `copilotforge upgrade --dry-run` | `src/upgrade.js` | Preview what would change without touching files |
| `copilotforge upgrade --force` | `src/upgrade.js` | Upgrade without confirmation prompts |
| `copilotforge status` | `src/status.js` | Dashboard: plan tasks, memory, skills, agents, cookbook, git |
| `copilotforge doctor` | `src/doctor.js` | Health check: Node version, files, git config, permissions, version stamp |
| `copilotforge uninstall` | `src/uninstall.js` | Removes only CLI-installed skill files; never touches user-generated content |

### Source Modules

| File | Purpose |
|------|---------|
| `bin/copilotforge.js` | Entry point — routes args to modules, handles `--help` / `--version` |
| `src/init.js` | Copies `CORE_FILES` from `cli/files/`, writes `FULL_FILES` from templates; offers git commit |
| `src/upgrade.js` | Diffs `FRAMEWORK_FILES` + `COOKBOOK_TEMPLATES` against disk; only updates changed; never touches user state |
| `src/doctor.js` | 10+ checks: Node version, file existence, git config, write perms, FORGE.md version stamp; Phase 13: reads `<!-- copilotforge: path=[A-J] -->` stamp, Node≥16/pac CLI/paconn probes per path |
| `src/status.js` | Reads IMPLEMENTATION_PLAN.md, forge-memory, FORGE.md, cookbook — exports 7 data-returning functions |
| `src/interactive.js` | readline-based home screen — context-aware numbered menu that loops until Exit |
| `src/utils.js` | Shared primitives: banner, colors, ask(), copyFile(), writeFile(), exists(), hasGit(), gitCommit(), menu() |
| `src/templates.js` | 5-line shim — re-exports from `cli/src/templates/` (Phase 13 modular split) |
| `src/uninstall.js` | Removes only CLI-installed planner skill files; removes empty parent dirs |
| `src/wizard.js` | Q1–Q6 conversational terminal wizard with PP signal detection (Phase 14) |
| `src/rollback.js` | Snapshot capture/restore/prune for safe undo of init/upgrade (Phase 14) |
| `src/mcp-server.js` | MCP JSON-RPC server over stdio for AI client integration (Phase 14) |
| `src/examples.js` | Examples gallery — fetch, cache, preview, clone starter projects (Phase 14) |
| `src/plugin-loader.js` | Plugin discovery, validation (K–Z paths), path detection integration (Phase 14) |
| `src/oracle.js` | Oracle Prime CLI usage guide and trigger phrase reference |
| `src/hooks.js` | Hook lifecycle system — 16 events, callback + command hooks, priority ordering (Phase 15) |
| `src/experiential-memory.js` | Experiential memory playbook — strategies, patterns, scoring, consolidation (Phase 15) |
| `src/evaluator.js` | Generator-evaluator separation — Sprint Contract pattern for task verification (Phase 15) |
| `src/compaction.js` | Five-layer graduated context compaction pipeline (Phase 15) |
| `src/trust.js` | Trust trajectory tracking — 7 signals, 4 levels, behavior recommendations (Phase 15) |
| `src/plan-generator.js` | AI plan generation from project description + stack detection (Phase 16) |
| `src/plan-cli.js` | CLI wrapper for plan generation with --stack and --dry-run flags (Phase 16) |
| `src/compact-cli.js` | CLI wrapper for five-layer compaction pipeline (Phase 16) |
| `src/playbook-cli.js` | CLI wrapper for playbook search, top entries, consolidation (Phase 16) |
| `src/trust-cli.js` | CLI wrapper for trust trajectory display and reset (Phase 16) |
| `src/extension-server.js` | GitHub Copilot Extension HTTP/SSE agent server (Phase 17) |

### Templates Modular Split (Phase 13)

`src/templates.js` is now a 5-line shim that re-exports from `cli/src/templates/`:

| Module | Contents |
|--------|---------|
| `cli/src/templates/forge.js` | Generic FORGE.md template (Path J fallback) |
| `cli/src/templates/platform-forge.js` | 9 path-specific FORGE.md templates (Paths A–I) |
| `cli/src/templates/agents.js` | Agent template strings |
| `cli/src/templates/memory.js` | Memory file templates |
| `cli/src/templates/cookbook.js` | Cookbook recipe templates |
| `cli/src/templates/init.js` | Init file templates |
| `cli/src/templates/platform-guides.js` | Platform guide templates |
| `cli/src/templates/index.js` | Barrel — re-exports all of the above |

### What `init` Creates

**Core files** (always, copied from `cli/files/`):
```
.github/skills/planner/SKILL.md
.github/skills/planner/reference.md
.github/skills/plan-executor/SKILL.md
.github/skills/plan-executor/reference.md
```

**Full files** (default, skip-if-exists, from `src/templates.js`):
```
FORGE.md
IMPLEMENTATION_PLAN.md
.copilot/agents/planner.md
forge-memory/decisions.md
forge-memory/patterns.md
forge-memory/preferences.md
cookbook/hello-world.ts|.py
cookbook/task-loop.ts|.py
cookbook/copilot-studio-guide.md + agent.yaml
cookbook/code-apps-guide.md + setup.ts
cookbook/copilot-agents-guide.md + example.agent.md
docs/GETTING-STARTED.md
```

### Upgrade Safety Model

| File category | Upgrade behavior |
|---------------|-----------------|
| Core skills (SKILL.md, reference.md) | Always updatable — framework owns these |
| Planner agent, GETTING-STARTED.md | Always updatable |
| Cookbook recipes | Ask for confirmation; skip if user declined |
| `forge-memory/`, custom agents, FORGE.md | **NEVER touched** — user owns these |

---

## Layer 2 — Skills

**Location:** `.github/skills/`

Skills are markdown instruction files that AI assistants read as context. When you say a trigger phrase in Copilot Chat, the matching skill activates and the AI follows its instructions.

### Planner Skill

**Path:** `.github/skills/planner/SKILL.md`  
**Companion:** `.github/skills/planner/reference.md` (format spec + re-run rules)

**Trigger phrases:** "set up my project", "forge", "copilot forge", "plan my project", "scaffold my repo", "bootstrap this repo"

**The 6 wizard questions:**

| # | Question | What it controls |
|---|----------|-----------------|
| 1 | What are you building? | Project description seeded into all files |
| 2 | What's your tech stack? | Drives recipe selection + skill generation |
| 3 | Do you want memory? | Creates `forge-memory/` if yes |
| 4 | Do you want test automation? | Generates tester skill if yes |
| 5 | Experience level? | Verbosity of comments in generated files |
| 6 | Advanced features? | Task automation, auto-experiments, etc. |

**Execution flow:**

```
1. Check forge-memory/ — returning user OR first-timer?
2. Run wizard (skip already-answered questions for returning users)
3. Show summary → wait for user confirmation
4. Scan repo manifests (package.json, requirements.txt, go.mod, .csproj)
5. Assemble FORGE-CONTEXT data block
6. Delegate to specialists:
     skill-writer   → .github/skills/{name}/SKILL.md
     agent-writer   → .copilot/agents/{name}.md
     memory-writer  → forge-memory/*.md  (append-only on re-runs)
     cookbook-writer→ cookbook/{recipe}.ts|.py
7. Generate FORGE.md (planner does this itself, not delegated)
8. Output build-transition prompt (ready-to-use for next AI session)
```

**Specialist ordering:** `skill-writer` → `agent-writer` → (`memory-writer` ∥ `cookbook-writer`)

**Data passing between specialists:** FORGE-CONTEXT block (inline in planner instructions)

### FORGE-CONTEXT Schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `PROJECT_NAME` | string | — | User's project name |
| `DESCRIPTION` | string | — | Plain-English project description |
| `STACK` | string | — | Tech stack (from wizard Q2 or manifest scan) |
| `EXPERIENCE` | string | intermediate | Verbosity level (beginner / intermediate / advanced) |
| `MEMORY` | boolean | false | Whether forge-memory/ was requested |
| `BUILD_PATH` | string | J | Build path letter (A–J) — *Phase 13* |
| `PATH_NAME` | string | Developer Project | Human-readable path name — *Phase 13* |
| `PREREQUISITES_CONFIRMED` | boolean | false | User confirmed path prereqs — *Phase 13* |
| `EXTENSION_REQUIRED` | boolean | false | Extension (e.g. PAC CLI) needed for this path — *Phase 13* |
| `MS_LEARN_ANCHOR` | string | null | MS Learn URL for this path — *Phase 13* |

**No jargon leak rule:** Specialist names (`skill-writer`, `agent-writer`, etc.) must NEVER appear in user-facing output.

### Plan-Executor Skill (The Ralph Loop)

**Path:** `.github/skills/plan-executor/SKILL.md`  
**Companion:** `.github/skills/plan-executor/reference.md`

**Trigger phrases:** "run the plan", "execute the plan", "work through tasks", "continue the plan"

**What it does:**

```
1. Find IMPLEMENTATION_PLAN.md (error if missing)
2. Find next pending task [ ]
3. Implement it — write real, working code
4. Validate: compile, run tests, check syntax
5. Mark [x] done  OR  [!] failed
6. Git commit with task ID + description
7. Loop back to step 2 until all tasks done
```

**Failure handling — 4-tier escalation:**

| Tier | Trigger | Action |
|------|---------|--------|
| 1 | First failure | Retry once |
| 2 | Second failure | Skip task, mark [!], move to next |
| 3 | Multiple failures | Alert user, pause loop |
| 4 | Unrecoverable | Halt, preserve checkpoint |

**Safety:** No `git add .` — targeted commits only. Graceful shutdown saves checkpoint (Ctrl+C resumes).

### Path Skills (Phase 13)

Nine path-specific skills plus two routing/classification skills scaffold Power Platform build workflows:

| Skill | Path | Description |
|-------|------|-------------|
| `oracle-prime` | All | Adaptive precision reasoning — Bayesian scenario analysis, counterfactual stress testing, structured decision support |
| `forge-compass` | All | Silent path classifier — reads FORGE-CONTEXT, detects contradictions, gates path transitions |
| `power-platform-guide` | All | Master routing oracle — 10-path decision matrix with tiebreakers |
| `studio-agent` | A | Copilot Studio Agent (also covers B/H/I path variants) |
| `studio-connector` | B | Custom Connector via Copilot Studio + REST API |
| `declarative-agent` | C | Declarative Agent for Microsoft 365 |
| `canvas-agent` | D | Canvas App Agent using Power Apps + AI Builder |
| `power-automate` | E | Power Automate Flow with AI Builder |
| `pcf-component` | F | PCF Code Component (TypeScript, Node≥16, pac CLI) |
| `powerbi-report` | G | Power BI Report (Desktop + Service, DAX) |
| `sharepoint-agent` | H | SharePoint + Teams agent via M365 Copilot |
| `power-pages` | I | Power Pages site with Dataverse + AI Plugin |

---

## Build Path Routing (Phase 13)

CopilotForge v1.6.0 introduced 10 named build paths. The Planner wizard detects the path silently after Q1 and writes `BUILD_PATH` to FORGE-CONTEXT. `forge-compass` acts as a gate between path transitions.

| Path | Name | Skill File | Agent Template | Key Tools |
|------|------|-----------|----------------|-----------|
| A | Copilot Studio Agent | studio-agent | studio-agent.md | Copilot Studio, PAC CLI |
| B | Studio Connector | studio-connector | studio-agent.md | Power Automate, paconn |
| C | Declarative Agent | declarative-agent | declarative-agent.md | Teams Toolkit, VS Code |
| D | Canvas App Agent | canvas-agent | canvas-agent.md | Power Apps, Power Fx |
| E | Power Automate | power-automate | automate-agent.md | Power Automate, Dataverse |
| F | PCF Component | pcf-component | pcf-agent.md | Node≥16, pac CLI, TypeScript |
| G | Power BI Report | powerbi-report | powerbi-agent.md | Power BI Desktop, DAX |
| H | SharePoint Agent | sharepoint-agent | studio-agent.md | SharePoint, PAC CLI |
| I | Power Pages | power-pages | studio-agent.md | Power Pages Studio, paconn |
| J | Developer Project | (planner default) | (planner default) | git, Node.js |

**Path detection:** After wizard Q1, the Planner silently classifies intent. Ambiguous answers trigger a 3-question Power Platform diagnostic. Path J is the unchanged generic fallback.

---

## Layer 3 — Agents

### Internal Specialists (in THIS repo — template source)

These power the Planner's delegation. They are CopilotForge internals, invisible to end users.

**Location:** `.copilot/agents/`

| Agent | File | Role |
|-------|------|------|
| Planner | `planner.md` | Orchestrator — runs the wizard, delegates to specialists |
| skill-writer | `skill-writer.md` | Generates SKILL.md files for the user's project |
| agent-writer | `agent-writer.md` | Generates agent definition files |
| memory-writer | `memory-writer.md` | Creates/appends forge-memory files |
| cookbook-writer | `cookbook-writer.md` | Selects and generates cookbook recipes based on stack |

### Templates for User Agents (`templates/agents/`)

These are what get scaffolded INTO the user's repo:

| Template | Resulting agent | Job |
|----------|----------------|-----|
| `planner.md` | Planner | Runs the wizard (orchestrates specialists) |
| `reviewer.md` | Reviewer | Reviews code against project conventions |
| `tester.md` | Tester | Writes tests using the project's test framework |

**Phase 13 path-specific agent templates:**

| Template | Paths | Role |
|----------|-------|------|
| `oracle-prime.md` | All | Precision reasoning analyst — deep analysis, risk assessment, scenario modeling |
| `studio-agent.md` | A, B, H, I | Copilot Studio / SharePoint / Power Pages guide |
| `declarative-agent.md` | C | Declarative Agent builder for M365 |
| `canvas-agent.md` | D | Canvas App + AI Builder companion |
| `automate-agent.md` | E | Power Automate Flow architect |
| `pcf-agent.md` | F | PCF Code Component engineer |
| `powerbi-agent.md` | G | Power BI Report architect |

### How Agents and Skills Connect

```
reviewer agent  ──uses──▶  code-review skill
tester agent    ──uses──▶  testing skill
planner agent   ──delegates──▶  skill-writer
                              agent-writer
                              memory-writer
                              cookbook-writer
```

---

## Layer 4 — Memory

**Location:** `forge-memory/`

Four append-only plain-text files. Nothing is sent externally. Add `forge-memory/` to `.gitignore` for public repos.

| File | What it stores | Write policy |
|------|---------------|-------------|
| `decisions.md` | Architectural decisions with date + reasoning | Append-only (newest at top) |
| `patterns.md` | Coding conventions and project rules | Additive merge |
| `preferences.md` | Wizard settings (verbosity, stack, features) | Updated each session |
| `history.md` | Session activity log (when wizard ran, what changed) | Append-only |

### How Memory Is Used

On each wizard run, the Planner reads all 4 files before asking questions:
- **First-timer:** All 6 questions asked
- **Returning user:** Summary shown ("Welcome back!") → only missing/changed answers asked → 4 action choices instead of a full re-wizard

### Memory Budget

Soft limit: ~500 total lines across all files. When exceeded, older entries are summarized in-place. Summarization is logged as its own decision entry (so you know it happened).

### Confidence Levels (patterns.md)

Tracked via invisible HTML comments — machine metadata that doesn't clutter the file:

| Level | Meaning |
|-------|---------|
| `observed` | First time this pattern was noticed |
| `confirmed` | Multiple sessions independently saw it |
| `established` | Consistently applied, team-agreed |

---

## Layer 5 — Cookbook

**Location:** `cookbook/`

Copy-paste code recipes — actual runnable files, not instructions. 50+ files, mostly language-paired (TypeScript + Python).

### Recipe Selection Rules

1. **ORM-specific beats generic** — If Prisma detected → `db-prisma.ts` not `db-query.ts`. Never both.
2. **MCP recipes are detection-gated** — Only generated if MCP SDK found in dependencies.
3. **Error handling + API client always included** — Every project gets these basics.
4. **Stack detected from manifests first** — `package.json`, `requirements.txt`, `go.mod`, `.csproj` are authoritative; wizard answer is fallback.

### Recipe Catalog

| Category | TypeScript | Python | Notes |
|----------|-----------|--------|-------|
| Starter | `hello-world.ts` | `hello-world.py` | Minimal Copilot SDK example |
| Task automation | `task-loop.ts` | `task-loop.py` | Ralph Loop runner (headless) |
| API client | `api-client.ts` | `api-client.py` | HTTP client patterns |
| Auth middleware | `auth-middleware.ts` | `auth-middleware.py` | JWT (Express / FastAPI) |
| Database | `db-query.ts` | `db-query.py` | Generic; replaced if ORM detected |
| Routes | `route-handler.ts` | `route-handler.py` | Express / FastAPI patterns |
| MCP server | `mcp-server.ts` | `mcp-server.py` | Model Context Protocol server |
| Sessions | `session-example.ts` | `session-example.py` | Session management |
| Persistence | `persisting-sessions.ts` | `persisting-sessions.py` | — |
| Memory reader | `memory-reader.ts` | `memory-reader.py` | Reads forge-memory files |
| Multi-session | `multiple-sessions.ts` | `multiple-sessions.py` | — |
| Command center | `command-center.ts` | `command-center.py` | — |
| Auto-research | `auto-research.ts` | `auto-research.py` | — |
| Copilot hooks | `copilot-hooks.ts` | `copilot-hooks.py` | — |
| PR visualization | `pr-visualization.ts` | `pr-visualization.py` | — |
| Knowledge wiki | — | `knowledge-wiki.py` | Python only |
| Managing files | `managing-local-files.ts` | `managing-local-files.py` | — |
| Oracle Prime | `oracle-prime.ts` | `oracle-prime.py` | Structured reasoning harness |

**Platform guides (markdown):**
- `copilot-studio-guide.md` + `copilot-studio-agent.yaml`
- `code-apps-guide.md` + `code-apps-setup.ts`
- `copilot-agents-guide.md` + `copilot-agents-example.agent.md`

**Internal-only (contributor reference, NOT scaffolded into user repos):**
- `delegation-example.ts` — shows specialist delegation internals
- `skill-creation-example.ts` — shows skill authoring patterns

### Verbosity Levels

Every recipe has 3 comment densities, selected based on user's experience level:

| Level | Comment style |
|-------|--------------|
| Beginner | Every section explained, with examples and rationale |
| Intermediate | Non-obvious parts only |
| Advanced | Minimal — just the code |

---

## Layer 6 — FORGE.md

**Location:** repo root  
**Generated by:** Planner (not delegated to a specialist)

The user's control panel. A single markdown file that shows the state of everything CopilotForge created.

### Sections

| Section | What it shows |
|---------|--------------|
| Project Summary | Name, description, stack, creation date |
| Team Roster | Agents by name, role, and file path |
| Skills Index | Skill name, trigger phrase, description |
| Cookbook | Recipe name, language, description |

### Version Stamp

`<!-- copilotforge: v1.6.0 -->` on line 1 — read by `doctor` to detect outdated installs.

### Re-Run Behavior

Confirm-and-replace (user gets a prompt before FORGE.md is regenerated). Section-level merge with HTML markers is deferred to a future phase.

---

## Layer 7 — Squad (Internal Dev Team)

**Location:** `.squad/`

The AI team that builds and maintains CopilotForge itself. Uses the Squad framework.

### Team Roster (Matrix universe)

| Name | Role | Emoji |
|------|------|-------|
| Morpheus | Lead | 🏗️ |
| Trinity | Prompt Engineer | ⚛️ |
| Neo | Developer | 🔧 |
| Tank | Tester | 🧪 |
| Scribe | Session Logger | 📋 |
| Ralph | Work Monitor | 🔄 |

### .squad/ File Structure

| Path | Purpose |
|------|---------|
| `team.md` | Authoritative team roster |
| `routing.md` | Work routing rules (who handles what) |
| `ceremonies.md` | Team ceremony definitions and triggers |
| `decisions.md` | Canonical architectural decision ledger |
| `decisions/inbox/` | Drop-box for agent decision proposals (Scribe merges) |
| `config.json` | Model overrides + default model settings |
| `agents/{name}/charter.md` | Agent identity, role, and boundaries |
| `agents/{name}/history.md` | Agent's personal learnings (append-only) |
| `casting/registry.json` | Persistent agent-to-name mapping |
| `casting/history.json` | Universe usage history + snapshots |
| `orchestration-log/` | Per-agent run logs (written by Scribe, never edited) |
| `log/` | Per-session logs |
| `templates/` | Format guides for runtime files |

### Squad Tooling (Development Tools)

| File | What it does |
|------|-------------|
| `cookbook/ralph-loop.ts` | Autonomous build/plan loop runner. `npx tsx cookbook/ralph-loop.ts [plan\|build] [max_iterations]`. Auto-approves all tool calls. Reads PROMPT_plan.md or PROMPT_build.md per mode. Logs `⚙ toolName` per iteration. Default 50 iterations. |
| `PROMPT_plan.md` | Planning mode prompt: gap analysis vs SYSTEM-BREAKDOWN.md, writes IMPLEMENTATION_PLAN.md. |
| `PROMPT_build.md` | Build mode prompt: pick one task, implement, test, commit, exit. One task per iteration. |
| `AGENTS.md` | Operational guide loaded every iteration: validation commands, commit rules, sacred files, jargon leak rule. |

### GitHub Workflows (`.github/workflows/`)

| Workflow | What it does |
|---------|-------------|
| `squad-heartbeat.yml` | Periodic check for squad work items |
| `squad-issue-assign.yml` | Auto-assign issues to squad members via labels |
| `squad-triage.yml` | Triage new issues with squad labels |
| `sync-squad-labels.yml` | Sync `squad:{member}` labels from `team.md` |

---

## Data Flow

```
User says "set up my project"
          │
          ▼
   Planner SKILL.md activates
          │
          ├── reads forge-memory/ → returning user OR first-timer
          │
          ├── asks wizard questions (skips already-answered)
          │
          ├── shows summary → waits for confirmation
          │
          ├── scans repo manifests (package.json, requirements.txt, etc.)
          │
          ├── assembles FORGE-CONTEXT block
          │
          ├── scaffolds skills    → .github/skills/{name}/SKILL.md
          ├── scaffolds agents    → .copilot/agents/{name}.md
          ├── initializes memory  → forge-memory/*.md  (append-only)
          ├── generates recipes   → cookbook/{recipe}.ts|.py
          │
          ├── generates FORGE.md (planner does this itself)
          │
          └── outputs build-transition prompt
                    │
                    ▼
          User copies prompt into AI assistant
                    │
                    ▼
          Plan-Executor runs IMPLEMENTATION_PLAN.md
          (pick task → implement → validate → commit → repeat)
```

---

## Key Design Principles

| Principle | What it means |
|-----------|--------------|
| **Zero dependencies** | No npm install in user repos. The wizard is pure markdown — works in any LLM. |
| **Transparent delegation** | Users see only the Planner. Specialist agents are completely invisible. |
| **Skip-on-exist** | Generated files never overwrite user edits. Re-runs are safe. |
| **Append-only memory** | Decisions and history only grow; nothing is ever deleted. |
| **No jargon leak** | Internal names (skill-writer, agent-writer, etc.) never appear in user-facing output. |
| **Memory is advisory** | Broken memory degrades to the full wizard — never blocks scaffolding. |
| **ORM-specific beats generic** | One DB recipe per language — no "which one do I use?" confusion. |
| **MCP detection-gated** | MCP recipes only appear when the MCP SDK is actually in the project. |
| **Verbosity as instruction** | Templates include all 3 verbosity variants; the scaffolding process selects based on experience level. |
| **Adaptive reasoning** | Oracle Prime scales reasoning depth to task complexity — lightweight for simple tasks, full Bayesian pipeline for complex decisions. |

---

## Development Phase History

| Phase | Status | What was built | Version |
|-------|--------|---------------|---------|
| 1 | ✅ Done | Planner skill — 6-question wizard, file generation |
| 2 | ✅ Done | Specialist delegation — transparent orchestration via FORGE-CONTEXT |
| 3 | ✅ Done | Full cookbook catalog — 29 recipes, 7 categories, stack detection |
| 4 | ✅ Done | Memory & iteration — read-back loop, adaptive returning-user wizard |
| 5 | ✅ Done | Polish & docs |
| 6 | ✅ Done | Deep polish |
| 7 | ✅ Done | Beginner navigation |
| 8 | ✅ Done | Wizard Q6 extras |
| 9 | ✅ Done | Squad-inspired upgrades — `upgrade` command, git safety, hardened task loop |
| 10 | ✅ Done | Interactive Command Center — `copilotforge` no-args dashboard |
| 11 | ✅ Done | Autonomy audit |
| 12 | ✅ Done | Perfect 10 companion |
| 13 | ✅ Done | Path Awareness — 10 build paths (A–J), forge-compass, power-platform-guide, path-specific skills/agents/cookbook, doctor.js path checks, forge-remember, conflict detection | v1.6.0 |
| — | ✅ Done | Oracle Prime — adaptive precision reasoning framework (global instructions + deep-analysis skill + agent template) | v1.6.0 |
| 14 | ✅ Done | Conversational Wizard & Distribution — zero-arg wizard, rollback system, MCP server, examples gallery, plugin API | v1.7.0 |
| 15 | ✅ Done | Agent Harness Runtime — hook lifecycle (16 events), experiential memory (playbook), generator-evaluator separation, 5-layer compaction pipeline, trust trajectory tracking | v1.7.0 |

---

## Test Coverage

### CLI Tests (`cli/tests/`)

Run with: `node --test tests/*.test.js`

| File | What it tests |
|------|--------------|
| `init.test.js` | Init command behavior — file creation, skip logic, git commit |
| `upgrade.test.js` | Upgrade logic — file diffing, confirmation, dry-run |
| `status.test.js` | Dashboard data parsing from plan, memory, cookbook |
| `interactive.test.js` | Menu rendering, context-aware item visibility |
| `utils.test.js` | File ops, prompts, git helpers |

**Test framework:** Node.js built-in `--test` runner — zero external dependencies.

### Phase Validators (`tests/`)

| Path | Coverage |
|------|---------|
| `tests/phase2/` | 40 scenarios: delegation flow, re-run, specialist self-checks, FORGE-CONTEXT, E2E |
| `tests/phase3/` | Cookbook stack detection, recipe selection rules |
| `tests/phase4/` | Memory read-back, adaptive wizard, summarization |
| `tests/e2e-validate.js` | End-to-end scaffold validation |
| `tests/validate-scaffold.ps1` + `.sh` | Cross-platform scaffold validators |
| `tests/test-scenarios.md` | Human-readable test scenario descriptions |

**CI gap:** The wizard is conversational — most scenarios require manual testing. A `--dry-run` / `--non-interactive` JSON-input mode would unlock CI for ~30 of 40 scenarios. (Recommended for a future phase.)

---

## Examples

**Location:** `examples/`

| Example | What it shows |
|---------|--------------|
| `examples/minimal/` | Bare minimum CopilotForge setup (just the skill files) |
| `examples/nextjs-app/` | Next.js project with full scaffold |
| `examples/fastapi-app/` | FastAPI project with full scaffold |

---

## Open Issues & Known Gaps

| Issue | Status | Owner |
|-------|--------|-------|
| Jargon leak: specialist names in user-facing templates | ✅ Fixed (Phase 13, Task 1) | Neo |
| No automated wizard test harness | Carried from Phase 1 | Tank |
| Specialist agent templates contain cross-references visible to users | Known | Neo |
| Re-run sub-decisions (3 scenarios still open) | Pending consensus | Tank |
| Angular component recipes | Deferred Phase 4 | — |
| Go/C# MCP recipes (SDKs not yet stable) | Deferred Phase 4 | — |
| Recipe plugin system for custom categories | Deferred Phase 4 | — |
| Strict mode validator (no `{{placeholder}}` in scaffolded output) | Deferred Phase 4 | — |
| Recipe versioning / update flow for existing users | Deferred Phase 4 | — |

---

**← [README](../README.md)** | **[HOW-IT-WORKS.md](HOW-IT-WORKS.md)** | **[GETTING-STARTED.md](GETTING-STARTED.md)**
