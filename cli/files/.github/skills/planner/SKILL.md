---
name: "copilotforge-planner"
description: "Guided wizard that scaffolds Copilot skills, agents, memory, and cookbook recipes into any repo from a plain-English project description"
domain: "scaffolding"
confidence: "high"
source: "manual — Phase 1 core deliverable"
triggers:
  - "set up my project"
  - "scaffold skills"
  - "create agents"
  - "copilot forge"
  - "forge"
  - "plan my project"
  - "set up copilotforge"
  - "bootstrap this repo"
  - "scaffold my repo"
  - "create project structure"
  - "help me set up copilot"
  - "I want agents for this project"
---

<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# CopilotForge Planner

> Drop this file into any repo at `.github/skills/planner/SKILL.md`. When triggered, it walks you through six questions and scaffolds a complete Copilot-ready project structure — skills, agents, memory, and cookbook recipes. No CLI. No framework. Just markdown.

## What This Does

CopilotForge turns a plain-English project description into a working set of Copilot skills, agent definitions, persistent memory files, and copy-paste code recipes. You describe what you're building; it builds the scaffolding.

**Output structure after this skill runs:**

```
.copilot/
  agents/
    planner.md           ← this orchestrator (self-reference)
    {role}.md            ← generated for your use case
.github/
  skills/
    planner/
      SKILL.md           ← this file
      reference.md       ← format reference
    {your-skill}/
      SKILL.md           ← trigger + instructions
forge-memory/
  decisions.md           ← what was built and why
  patterns.md            ← reusable conventions
  preferences.md         ← your settings and overrides
  history.md             ← session activity log
cookbook/
  {recipe}.{ext}         ← SDK/code recipes for your stack
FORGE.md                 ← human-readable control panel
```

---

## Instructions

When this skill is triggered, follow every step below in order. Do not skip steps (though Step 0 may shorten the wizard for returning users). Do not assume answers — ask each question and wait for the user's response, unless memory provides the answer.

### Step 0 — Check for Existing Memory

Before greeting or asking questions, check if this repo already has CopilotForge memory:

1. Check if `forge-memory/decisions.md` exists.
2. Check if `forge-memory/patterns.md` exists.
3. Check if `forge-memory/preferences.md` exists.
4. Check if `FORGE.md` exists.

**If memory files exist (returning user):**

Read whatever memory files are present. If any file is missing or unreadable, skip it gracefully — use only what's available.

- Read `forge-memory/decisions.md` — extract the most recent 5 decisions (entries under `### {date}` headings)
- Read `forge-memory/patterns.md` — extract all active patterns (headings under `## Stack Conventions` and `## Project-Specific Patterns`)
- Read `forge-memory/preferences.md` — extract verbosity level, stack preferences, and any user overrides
- Read `FORGE.md` — extract the Project section (description, stack, settings) and the Skills/Agents tables

Present a context summary to the user:

> 👋 **Welcome back!** I found your project context:
> - **Project:** {project description from FORGE.md or last decision}
> - **Stack:** {stack from patterns.md or FORGE.md}
> - **Last run:** {date of most recent decision}
> - **Decisions:** {count} recorded
> - **Patterns:** {count} active conventions
> - **Agents:** {agent names from FORGE.md Agents table}
>
> What would you like to do? *(add a skill, add an agent, update recipes, or describe what's changed)*

Then skip to Step 2 (Confirm & Generate) with pre-populated answers from memory.
Only ask questions for information that's **missing** from memory — see Step 1 adaptive logic below.

**If no memory files exist (first-time user):**

Proceed to Step 1 as normal (the full greeting and 5-question wizard).

**If memory files exist but are corrupted or incomplete:**

Treat any readable data as valid context. For anything unreadable, fall back to asking the question. Never crash or abort because of bad memory — degrade gracefully and note the issue in the validation summary.

---

### Step 1 — Greet and Explain

**First-time users** (no memory found in Step 0):

Say exactly this (adjust tone for friendliness, keep the meaning):

> **Welcome to CopilotForge!** I'll ask you five quick questions about your project, then scaffold a complete set of Copilot skills, agent definitions, memory files, and code recipes into this repo. Takes about two minutes. Let's go.

**Returning users** (memory found in Step 0):

Skip this greeting — the welcome-back summary from Step 0 replaces it. Proceed directly to the adaptive wizard questions below. Only ask questions whose answers are **missing** from memory.

### Step 1a — Run the Wizard (Adaptive)

Ask each question one at a time. Wait for the user's answer before asking the next. If the user gives a single block of answers covering multiple questions, accept them and move on.

**For returning users:** Each question checks memory first. If the answer is already known, show it and ask for confirmation instead of asking from scratch. This makes re-runs fast — most questions become one-word confirmations.

**Question 1 — Project Description**

*If already in memory (from FORGE.md or decisions.md):*
> Your project: **{project description from memory}**
> Still accurate? *(yes / or tell me what's changed)*

*If not in memory:*
> What are you building? Describe your project in a sentence or two.
> *(Example: "A REST API for a pet adoption platform" or "A React dashboard for monitoring CI pipelines")*

**Question 2 — Tech Stack**

*If already in memory (from patterns.md or FORGE.md):*
> Your stack: **{stack from memory}**
> Still using this stack? *(yes / or tell me what's changed)*

*If not in memory:*
> What's your stack? List languages, frameworks, and key tools.
> *(Example: "TypeScript, Next.js, Prisma, PostgreSQL" or "Python, FastAPI, SQLAlchemy")*

**If no config files are found** (`package.json`, `requirements.txt`, `go.mod`, `.csproj`, etc.) **and the user's answer is vague** ("I'm using Python" with no framework mentioned):
Ask: *"I couldn't detect your tech stack automatically from config files. What language or framework are you using?"* Accept any answer and use it as the stack. Note this in `decisions.md`.

**If the user's answer conflicts with detected config** (e.g., user says "Django" but `package.json` has Express):
Trust the user's answer but note both in `decisions.md`: "User specified Django; detected Express in package.json — user answer takes precedence."

**Question 3 — Memory**

*If memory files already exist:*
Skip this question entirely — memory is already enabled. Use `yes`.

*If no memory files exist:*
> Do you want memory across sessions? This creates `forge-memory/` files so agents remember decisions and patterns between conversations.
> *(yes / no — default: **yes**)*

If the user skips or says nothing, default to **yes**.

**Question 4 — Test Automation**

*If already in memory (from preferences.md or FORGE.md settings):*
> Test automation is currently **{enabled/disabled}**.
> Keep this setting? *(yes / change)*

*If not in memory but test-related files exist* (e.g., `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`, `jest.config.*`, `pytest.ini`, `.github/skills/testing/`):
> I see you already have test files in this repo. I'll keep test automation **enabled**.
> *(Say "no" if you want to skip the tester agent and testing skill)*

*If not in memory and no test files found:*
> Do you want test automation? This generates a tester agent and testing skill with conventions for your stack.
> *(yes / no — default: **yes**)*

If the user skips or says nothing, default to **yes**.

**Question 5 — Skill Level**

*If already in memory (from preferences.md):*
> Your verbosity level is set to **{level from memory}**.
> Keep this? *(yes / change)*

*If not in memory:*
> What's your experience level? This controls how verbose the generated files are.
> - **beginner** — extra comments, explanations in every file
> - **intermediate** — standard detail, assumes you know your stack
> - **advanced** — minimal comments, just the essentials
>
> *(default: **beginner**)*

If the user skips or says nothing, default to **beginner**.

### Step 2 — Confirm Before Scaffolding

After collecting all five answers, present a summary and ask for confirmation:

> **Here's what I'll create:**
>
> - **Project:** {answer to Q1}
> - **Stack:** {answer to Q2}
> - **Memory:** {yes/no}
> - **Test automation:** {yes/no}
> - **Verbosity:** {beginner/intermediate/advanced}
>
> I'll generate skills, agents, memory files, cookbook recipes, and a FORGE.md control panel. Ready to go?

Wait for confirmation. If the user says "change X," adjust and re-confirm. Do not scaffold until the user confirms.

### Step 3 — Scaffold the Project

Create all files described below. Use the user's answers to customize content. Every generated file must be valid markdown (or valid code for cookbook recipes).

---

#### 3a. Skills — `.github/skills/`

Generate SKILL.md files based on the project description and stack. At minimum, create:

1. **A project-conventions skill** at `.github/skills/{project-slug}-conventions/SKILL.md`
   - Frontmatter: name, description, domain ("project-conventions"), confidence ("medium"), source ("generated by CopilotForge")
   - Sections: Context, Patterns (error handling, file structure, naming conventions based on the stack), Examples, Anti-Patterns
   - Populate patterns with stack-appropriate conventions (e.g., for TypeScript: strict mode, path aliases; for Python: type hints, virtual envs)

2. **A code-review skill** at `.github/skills/code-review/SKILL.md`
   - Triggers: "review this", "check my code", "code review"
   - Instructions for reviewing PRs/code changes with stack-specific linting rules
   - Include the stack's common pitfalls as review checkpoints

3. **If test automation = yes:** A testing skill at `.github/skills/testing/SKILL.md`
   - Triggers: "write tests", "test this", "add test coverage"
   - Instructions for the stack's test framework (Jest for TS/JS, pytest for Python, etc.)
   - Patterns for test file naming, assertion style, mocking

Each generated SKILL.md must follow this format:

```markdown
---
name: "{skill-name}"
description: "{what it does}"
domain: "{domain}"
confidence: "medium"
source: "generated by CopilotForge"
---

## Context

{Why this skill exists and when it applies.}

## Patterns

### {Pattern Name}
{Description of the pattern.}

## Examples

{Concrete examples showing correct usage.}

## Anti-Patterns

- {Thing to avoid} — {Why it's bad.}
```

---

#### 3b. Agents — `.copilot/agents/`

Generate agent definition files. At minimum:

1. **planner.md** — Self-reference to this skill. Role: orchestrator. Scope: project scaffolding, skill generation, structure decisions.

2. **reviewer.md** — Code reviewer agent. Role: quality gate. Scope: PR review, convention enforcement, stack-specific lint rules. System prompt must reference the code-review skill.

3. **If test automation = yes:** **tester.md** — Test author agent. Role: test coverage. Scope: writing tests, identifying edge cases, maintaining test conventions. System prompt must reference the testing skill.

Each agent file must follow this format:

```markdown
# {Agent Name}

## Role
{One sentence: what this agent does.}

## Scope
{Bullet list of what this agent owns.}

## System Prompt
{The actual system prompt the agent uses. Write this as executable instructions — another LLM should be able to follow it verbatim.}

## Boundaries
- **I handle:** {list}
- **I don't handle:** {list}

## Skills
- {skill-name} — {why this agent uses it}
```

---

#### 3c. Memory — `forge-memory/`

**If memory = yes**, create:

1. **decisions.md**

```markdown
# Forge Decisions

Decisions made during project setup and ongoing development. Append new decisions — never delete old ones.

## Setup Decisions

### {today's date}: Initial scaffolding
**What:** CopilotForge generated the initial project structure.
**Why:** User requested scaffolding for: {project description}
**Stack:** {stack}
**Options enabled:** Memory: {yes/no}, Testing: {yes/no}
```

2. **patterns.md**

```markdown
# Forge Patterns

Reusable conventions for this project. Updated as the team learns what works.

## Stack Conventions

{Stack-specific patterns derived from Q2. For example:}
{- TypeScript: strict mode, path aliases, barrel exports}
{- Python: type hints, virtual envs, pyproject.toml}

## File Structure

{Describe the expected project layout based on the stack.}
```

**If memory = no**, skip this step entirely. Do not create the `forge-memory/` directory.

---

#### 3d. Cookbook — `cookbook/`

Generate code recipes based on the project's detected stack. Recipes are copy-paste-ready code files with comments explaining what they do. The cookbook auto-selects recipes based on the frameworks and packages found in your project — the more specific your stack, the more targeted the recipes.

**Recipe categories** — each category has stack-specific variants:

| Category | What it teaches | Example stacks |
|---|---|---|
| Error handling | Try/catch patterns, custom error types, graceful failures | All languages |
| MCP integration | Building an MCP server with tool definitions for the Copilot ecosystem | TypeScript, Python |
| API client | HTTP client with auth, retry, typed responses | All languages |
| Auth patterns | Middleware for authentication and authorization | All languages |
| Database | ORM query patterns — CRUD, transactions, error handling | Prisma, SQLAlchemy, GORM, EF Core |
| Component scaffold | Typed UI component with props and common patterns | React, Blazor |
| Route handler | Web route with validation, middleware, error responses | Express, FastAPI, net/http, ASP.NET |

**How recipes are selected:**

Recipes are auto-selected based on what's detected in your project:
- If you have `package.json` with Express → you get an Express route handler recipe
- If you have `requirements.txt` with FastAPI and SQLAlchemy → you get both a FastAPI route and a SQLAlchemy database recipe
- If you have MCP-related packages → you get an MCP server recipe (high-value for Copilot workflows)
- You always get an error handling recipe and an API client recipe for your primary language

The goal is: every recipe matches something you actually use. No generic filler.

Always generate `cookbook/README.md` listing all recipes with one-line descriptions.

The cookbook section in FORGE.md is tracked between `<!-- forge:cookbook-start -->` and `<!-- forge:cookbook-end -->` markers. On re-runs, new recipes are added without removing existing ones.

Adjust verbosity based on skill level:
- **beginner**: Heavy comments explaining every section
- **intermediate**: Comments on non-obvious parts only
- **advanced**: Minimal comments, just the code

---

#### 3e. FORGE.md — Control Panel

Create `FORGE.md` at the repo root. This is the human-readable dashboard. Format:

```markdown
# 🔧 FORGE.md — CopilotForge Control Panel

> Edit this file to customize your CopilotForge setup. This is your project's AI configuration dashboard.

## Project

- **Description:** {Q1 answer}
- **Stack:** {Q2 answer}
- **Memory:** {enabled/disabled}
- **Test automation:** {enabled/disabled}
- **Verbosity:** {beginner/intermediate/advanced}

## Skills

| Skill | Path | Purpose |
|---|---|---|
| {name} | `.github/skills/{name}/SKILL.md` | {one-line purpose} |

## Agents

| Agent | Path | Role |
|---|---|---|
| {name} | `.copilot/agents/{name}.md` | {one-line role} |

## Cookbook Recipes

| Recipe | Path | Description |
|---|---|---|
| {name} | `cookbook/{file}` | {one-line description} |

## Memory

| File | Purpose |
|---|---|
| `forge-memory/decisions.md` | Architectural decisions log |
| `forge-memory/patterns.md` | Reusable project conventions |
| `forge-memory/preferences.md` | Your settings and overrides |
| `forge-memory/history.md` | Session activity log |

## What's Next

- [ ] Review generated skills and customize patterns for your codebase
- [ ] Try: "Review this code" to test the code-review skill
- [ ] Try: "Write tests for {module}" to test the testing skill
- [ ] Edit this file to add or remove skills and agents
```

---

### Step 4 — Validation Summary

After all files are created, print a plain-English summary of everything that was generated. Format:

> **✅ CopilotForge scaffolding complete!**
>
> I created:
> - **{N} skills** — {list names with one-line descriptions}
> - **{N} agents** — {list names with one-line descriptions}
> - **{N} cookbook recipes** — {list names}
> - **{N} memory files** — decisions.md, patterns.md, preferences.md, history.md
> - **1 control panel** — FORGE.md
>
> **What each file does:**
> {Brief description of each generated file — one line each}
>
> **Start here:** Open `FORGE.md` to see your full setup. Edit it anytime to add or remove skills.

---

### Step 5 — Start Building

After the validation summary, output a build-transition prompt. This bridges "I described my project" → "now build it" — especially helpful for beginners who just finished the wizard and aren't sure what to do next.

Customize the prompt using the user's actual wizard answers:
- Replace `{project type}` with the type of project from Q1 (e.g., "REST API," "React dashboard," "CLI tool")
- Replace `{stack}` with the Q2 answer (e.g., "TypeScript, Next.js, Prisma")
- Replace `{first feature or goal}` with the primary goal extracted from Q1 (e.g., "the pet adoption endpoints," "the CI monitoring dashboard")

Output this as the very last thing the wizard shows:

> ---
>
> ## 🚀 Ready to Build!
>
> Your project is set up. Here's a prompt you can copy and paste to start building:
>
> ---
>
> **Copy this prompt and give it to your AI assistant:**
>
> > I have a {project type} project using {stack}. The project structure is already
> > scaffolded — see FORGE.md for the team configuration and forge-memory/ for
> > context. Start by reading FORGE.md, then help me build {first feature or goal
> > from Question 1}.
>
> ---
>
> Or just say: **"Read FORGE.md and let's start building."**
>
> 💡 **Tip:** Your AI assistant will read FORGE.md and forge-memory/ to understand
> your project's conventions, team setup, and goals — no need to re-explain anything.

The copy-paste prompt references FORGE.md and forge-memory/ — the artifacts the wizard just created. The one-liner alternative is for users who want to keep it simple. Both work because the AI assistant reads the project's memory files to understand context automatically.

---

## Portability

This skill works in:
- **VS Code GitHub Copilot** — place in `.github/skills/planner/SKILL.md`
- **Claude Code** — paste the Instructions section (Steps 0–5) as a prompt
- **Any LLM** — copy Steps 0–5 into a chat session

No CLI, no dependencies, no lock-in. It's just markdown instructions that any language model can execute.

## Anti-Patterns

- ❌ Scaffolding before the user confirms the summary (Step 2)
- ❌ Skipping questions without checking memory first — always either ask or confirm from memory
- ❌ Ignoring memory files when they exist — always read them before starting the wizard
- ❌ Generating empty or placeholder files — every file must have real, usable content
- ❌ Hardcoding a single stack — recipes and conventions must adapt to the user's answers
- ❌ Creating `forge-memory/` when the user said no to memory
- ❌ Using jargon without explanation when skill level is "beginner"
- ❌ Generating agent files that reference skills which don't exist
- ❌ Forgetting the validation summary — the user needs to know what was created
- ❌ Skipping the build-transition prompt — the user needs a clear next step after scaffolding
