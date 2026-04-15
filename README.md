# 🔥 CopilotForge

> Describe what you want. Get a fully-configured AI team. No CLI required.

CopilotForge turns a plain-English description of your project into a working set of AI-powered tools — all inside your repo. You tell it what you're building, answer five quick questions, and it creates everything: coding assistants that know your stack, code review checklists, test helpers, ready-to-use code recipes, and a memory system that gets smarter over time. No install. No command line. Just drop one file into your repo and start talking.

---

## What It Does (30-Second Version)

**Before CopilotForge:**
> "I want AI help with my Next.js app but I don't know where to start with skills, agents, or configuration."

**After CopilotForge:**
> You answered 5 questions. Now your repo has a code reviewer that knows TypeScript conventions, a test writer that uses Jest, copy-paste code recipes for Express and Prisma, and a memory system that remembers your decisions. All from one conversation.

---

## Quick Start

### Step 1 — Copy the Planner Skill

Copy the `.github/skills/planner/` folder into your project:

```
your-project/
  .github/
    skills/
      planner/
        SKILL.md      ← this is the magic file
```

That's it. One folder, one file. No packages to install, no config to write.

> 💡 If your project doesn't have a `.github/` folder yet, just create it.

### Step 2 — Trigger It

Open your AI coding assistant (GitHub Copilot Chat, Claude Code, or any LLM that can read your repo files) and say:

```
set up my project
```

Other phrases that work: `forge`, `copilot forge`, `plan my project`, `scaffold my repo`, `bootstrap this repo`.

The Planner reads the SKILL.md file and starts the wizard.

### Step 3 — Answer Five Questions

The wizard asks five questions, one at a time. Here's what to expect:

| # | Question | Example Answer |
|---|----------|----------------|
| 1 | **What are you building?** | "A task management app with a REST API and React frontend" |
| 2 | **What's your stack?** | "TypeScript, Next.js, Prisma, PostgreSQL" |
| 3 | **Do you want memory?** | "yes" *(so it remembers your choices next time)* |
| 4 | **Do you want test automation?** | "yes" *(creates a test-writing helper)* |
| 5 | **What's your experience level?** | "beginner" *(adds extra comments to everything)* |

You'll see a summary of your answers. Say "yes" to confirm, or change anything before it starts building.

### Step 4 — You're Done

In about a minute, your repo gets a full set of AI-ready files:

| What | Where | What It Does |
|------|-------|--------------|
| 🎯 **Skills** | `.github/skills/` | Rules and instructions that teach your AI assistant how to work in this project |
| 🤖 **Agents** | `.copilot/agents/` | AI team members — a code reviewer, a test writer, etc. |
| 📖 **Recipes** | `cookbook/` | Copy-paste code examples for your specific stack |
| 🧠 **Memory** | `forge-memory/` | Decision log and conventions — so the AI remembers what you decided |
| 📋 **Control panel** | `FORGE.md` | One file that shows everything that was set up |

**Open `FORGE.md` to see the full picture.**

---

## What Gets Created

Here's a real example of what your repo looks like after running CopilotForge on a TypeScript/Next.js/Prisma project:

```
your-project/
├── .copilot/
│   └── agents/
│       ├── planner.md          # The wizard (already set up)
│       ├── reviewer.md         # Reviews your code, knows your conventions
│       └── tester.md           # Writes tests using Jest patterns
│
├── .github/
│   └── skills/
│       ├── planner/
│       │   └── SKILL.md        # The wizard itself
│       ├── my-app-conventions/
│       │   └── SKILL.md        # Your project's coding rules
│       ├── code-review/
│       │   └── SKILL.md        # How to review code in your stack
│       └── testing/
│           └── SKILL.md        # How to write tests in your stack
│
├── cookbook/
│   ├── README.md               # Recipe index
│   ├── error-handling.ts       # Error patterns for TypeScript
│   ├── api-client.ts           # HTTP client with retry and auth
│   ├── auth-middleware.ts      # Express JWT auth
│   ├── db-query.ts             # Prisma CRUD patterns
│   ├── route-handler.ts        # Express routes with validation
│   └── ...                     # More recipes based on your stack
│
├── forge-memory/
│   ├── decisions.md            # What was decided and why
│   ├── patterns.md             # Coding conventions for this project
│   ├── preferences.md          # Your settings (verbosity, etc.)
│   └── history.md              # Session log
│
└── FORGE.md                    # Your control panel — start here
```

---

## How It Works (Plain English)

Here's the whole flow:

1. **You describe your project** in one or two sentences.
2. **The wizard asks four more questions** — your stack, whether you want memory, whether you want test automation, and your experience level.
3. **CopilotForge looks at your project** — it reads your `package.json`, `requirements.txt`, or other config files to understand exactly which frameworks you're using.
4. **It generates everything** — skills, agents, code recipes, memory files, and a control panel. Every file is customized for your stack.
5. **You're ready to go** — start using phrases like "review this code" or "write tests for this module" and your AI assistant already knows your conventions.

On the **second run**, the wizard remembers your previous answers. Instead of asking five questions again, it shows you what it knows and asks what you'd like to change. The more you use it, the less setup you need.

---

## The Five Questions

Here's exactly what the wizard asks and what each answer controls.

### Question 1 — What Are You Building?

> *"Describe your project in a sentence or two."*

This sets the theme for everything. The generated skills, agents, and recipes all reference your project description so your AI assistant understands the context.

**Examples:**
- "A REST API for a pet adoption platform"
- "A React dashboard for monitoring CI pipelines"
- "A CLI tool that converts CSV files to JSON"

### Question 2 — What's Your Stack?

> *"List languages, frameworks, and key tools."*

This is the most important answer. CopilotForge uses it to pick the right code recipes, the right test framework, and the right conventions.

**Examples:**
- "TypeScript, Next.js, Prisma, PostgreSQL"
- "Python, FastAPI, SQLAlchemy"
- "Go, Gin, GORM"
- "C#, ASP.NET Core, Entity Framework"

CopilotForge also scans your repo for config files (`package.json`, `requirements.txt`, `go.mod`, `.csproj`) to auto-detect frameworks. The more specific you are, the better the output.

### Question 3 — Memory?

> *"Do you want memory across sessions?"*

If you say **yes** (the default), CopilotForge creates a `forge-memory/` folder that tracks decisions, conventions, and preferences. This means the next time you run the wizard, it already knows your project and skips questions it can answer from memory.

If you say **no**, you still get everything else — you just won't get the memory files.

### Question 4 — Test Automation?

> *"Do you want test automation?"*

If you say **yes** (the default), you get a test-writing agent and a testing skill configured for your stack's test framework (Jest for TypeScript, pytest for Python, etc.).

If you say **no**, the tester agent and testing skill are skipped.

### Question 5 — Experience Level?

> *"What's your experience level? beginner / intermediate / advanced"*

This controls how much explanation appears in generated files:

| Level | What You Get |
|-------|--------------|
| **beginner** | Extra comments explaining every section. More examples. Detailed instructions. |
| **intermediate** | Standard detail. Comments on non-obvious parts only. |
| **advanced** | Minimal comments. Just the essentials. |

Default is **beginner**.

---

## Customizing Your Setup

Everything CopilotForge creates is plain markdown and code files. There's no hidden config — what you see is what you get. Edit anything, anytime.

### Editing FORGE.md

`FORGE.md` is your control panel. It lists every skill, agent, recipe, and memory file in your project. Think of it as a dashboard.

Want to change something? Just edit the file. For example, to update your project description, change the `Description` field in the Project section. The next time the wizard runs, it'll read your changes.

### Adding a Skill

A skill teaches your AI assistant how to handle a specific request. To add one:

1. Create a new folder in `.github/skills/` — for example, `.github/skills/deploy/`
2. Create a `SKILL.md` file inside it
3. Add a description of when the skill should activate and what it should do

```markdown
---
name: "deploy-helper"
description: "Guides deployment steps for this project"
---

## Context
When to use this skill and why it exists.

## Patterns
Step-by-step instructions the AI should follow.

## Examples
Concrete examples of correct output.

## Anti-Patterns
- Things to avoid and why.
```

### Adding an Agent

An agent is an AI team member with a specific job. To add one:

1. Create a new `.md` file in `.copilot/agents/` — for example, `.copilot/agents/api-designer.md`
2. Define its role, scope, and instructions

```markdown
# API Designer

## Role
Design consistent REST API endpoints for this project.

## Scope
- Endpoint naming and URL structure
- Request/response schemas
- Error response format

## System Prompt
You are an API designer. When asked to design an endpoint, follow RESTful
conventions and match the patterns in this project's code-review skill.

## Boundaries
- **I handle:** API design, schema review, endpoint naming
- **I don't handle:** Implementation, testing, deployment
```

### Adding a Recipe

A recipe is a copy-paste code example. To add one:

1. Create a new file in `cookbook/` — for example, `cookbook/caching-example.ts`
2. Start with a header comment explaining what it does
3. Include all imports — no "install this first" surprises
4. Mark integration points with `TODO` comments

```typescript
/**
 * Caching Example — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Redis caching layer with TTL and invalidation
 *
 * WHEN TO USE THIS:
 *   When you need to cache API responses or database queries
 *
 * PREREQUISITES:
 *   npm install redis
 */

import { createClient } from "redis";

// TODO: Replace with your Redis connection string
const client = createClient({ url: "redis://localhost:6379" });
```

---

## Memory (Optional)

If you said "yes" to memory (Question 3), your project gets a `forge-memory/` folder with four files:

| File | What It Tracks |
|------|----------------|
| `decisions.md` | What was decided and why — a changelog for your project's direction |
| `patterns.md` | Coding conventions — naming rules, file structure, style preferences |
| `preferences.md` | Your settings — experience level, stack preferences, generation options |
| `history.md` | A session log — when CopilotForge ran and what it did |

**Why this matters:** The next time you run CopilotForge, it reads these files first. Instead of asking all five questions again, it shows what it already knows and only asks about what's changed. Over time, the wizard gets faster because it already knows your project.

Memory is append-only — it never deletes previous entries. If you want to start fresh, rename or delete the `forge-memory/` folder and run the wizard again.

---

## Cookbook Recipes

The `cookbook/` folder contains ready-to-use code recipes for common tasks. Each recipe is a real, runnable code file — not a snippet or a pseudocode example.

### Recipe Categories

| Category | What You Get |
|----------|-------------|
| **Error Handling** | Custom error types, retry with backoff, graceful failure |
| **API Clients** | HTTP client with auth, retry, timeout, typed responses |
| **Auth & Middleware** | JWT authentication, role-based access control |
| **Database** | ORM patterns — CRUD, transactions, error handling (Prisma, SQLAlchemy) |
| **Route Handlers** | Web routes with validation and error responses (Express, FastAPI) |
| **MCP Integration** | Building a tool server for the Copilot ecosystem |
| **Session Management** | Create sessions, handle timeouts, clean up resources |
| **Memory** | Read and parse CopilotForge memory files programmatically |

### How to Use a Recipe

1. Open the recipe file in `cookbook/`
2. Read the header comment — it explains what the recipe does
3. Copy the file into your project
4. Search for `TODO` — those are the spots you fill in with your actual values
5. Run it using the instructions in the header

Recipes come in TypeScript and Python. The wizard picks which ones to generate based on your stack.

📖 **Full recipe index:** [cookbook/README.md](cookbook/README.md)

---

## Works Everywhere

CopilotForge is just markdown files. There's no framework to install, no CLI to learn, no package manager involved.

| Tool | How to Use It |
|------|---------------|
| **VS Code + GitHub Copilot** | Drop `.github/skills/planner/SKILL.md` into your repo. Copilot reads it automatically. |
| **Claude Code** | Paste the Instructions section from SKILL.md as a prompt. |
| **Any LLM** | Copy the wizard steps into a chat session. It works anywhere a language model can read text. |

No lock-in. If you stop using CopilotForge, the generated files are still useful on their own — they're just markdown and code.

---

## FAQ

### "What if I already have a `.copilot/` folder?"

CopilotForge won't overwrite existing files. If it finds files that already exist, it skips them and tells you what was skipped. Your existing setup is safe.

### "Can I use this with an existing project?"

Yes — that's the main use case. Drop the Planner skill into any repo, run the wizard, and it generates files alongside your existing code. It reads your project's config files (`package.json`, `requirements.txt`, etc.) to understand your stack.

### "What if I want to start over?"

Delete the generated files (or the whole `forge-memory/` folder) and run the wizard again. Memory files track choices with append-only entries, so you can also just re-run the wizard — it'll show you your previous answers and let you change them.

### "Do I need to understand skills or agents to use this?"

No. CopilotForge creates and configures everything for you. You can use the generated agents and skills without ever opening the files. If you want to customize later, every file is plain markdown with comments explaining what it does.

### "What languages and frameworks are supported?"

CopilotForge generates code recipes for **TypeScript**, **Python**, **Go**, and **C#**. It recognizes frameworks like Express, Next.js, React, Prisma, FastAPI, SQLAlchemy, Gin, GORM, ASP.NET, Entity Framework, and more.

The skills and agents work with any language — they're instructions, not code. Only the cookbook recipes are language-specific.

### "What's the difference between a skill and an agent?"

A **skill** is a set of instructions — like a playbook for handling a specific task ("how to review code," "how to write tests").

An **agent** is an AI team member with a job title — it knows which skills to use and when. Think of skills as the "how" and agents as the "who."

### "Is this free?"

CopilotForge itself is free. It's just markdown files. You need access to an AI coding assistant (GitHub Copilot, Claude Code, etc.) to run the wizard, but CopilotForge doesn't add any cost on top of that.

---

## Architecture

For a visual overview of how CopilotForge is structured, see the architecture diagram:

![CopilotForge Architecture](copilot_forge_framework.svg)

---

## Project Structure

Here's the full layout of the CopilotForge repo:

```
Oracle_Prime/
├── .copilot/
│   └── agents/                  # Agent definitions (the AI team)
│       ├── planner.md           # Wizard orchestrator
│       ├── reviewer.md          # Code review template
│       ├── tester.md            # Test writing template
│       └── ...                  # Internal agents (you don't need these)
│
├── .github/
│   └── skills/
│       └── planner/
│           └── SKILL.md         # ⭐ The main skill — copy this into your repo
│
├── cookbook/                     # Code recipe library
│   ├── README.md                # Recipe index
│   ├── error-handling.ts        # Error patterns (TypeScript)
│   ├── error-handling.py        # Error patterns (Python)
│   ├── api-client.ts            # HTTP client (TypeScript)
│   ├── api-client.py            # HTTP client (Python)
│   ├── auth-middleware.ts       # JWT auth (TypeScript)
│   ├── auth-middleware.py       # JWT auth (Python)
│   ├── db-query.ts              # Prisma CRUD (TypeScript)
│   ├── db-query.py              # SQLAlchemy CRUD (Python)
│   ├── route-handler.ts         # Express routes (TypeScript)
│   ├── route-handler.py         # FastAPI routes (Python)
│   ├── mcp-server.ts            # MCP tool server (TypeScript)
│   ├── mcp-server.py            # MCP tool server (Python)
│   ├── session-example.ts       # Session management (TypeScript)
│   ├── session-example.py       # Session management (Python)
│   ├── memory-reader.ts         # Memory file parser (TypeScript)
│   └── memory-reader.py         # Memory file parser (Python)
│
├── templates/                   # Internal templates (used during scaffolding)
│   ├── FORGE.md                 # FORGE.md template
│   ├── agents/                  # Agent definition templates
│   ├── cookbook/                 # Recipe templates with placeholders
│   └── forge-memory/            # Memory file templates
│
├── docs/                        # Documentation
│   ├── GETTING-STARTED.md       # Full walkthrough with examples
│   └── HOW-IT-WORKS.md          # How CopilotForge works under the hood
│
├── tests/                       # Validation scripts and test scenarios
├── copilot_forge_framework.svg  # Architecture diagram
└── FORGE.md                     # Template control panel
```

---

## Contributing

CopilotForge is built on plain markdown and code. Contributions welcome!

- **Add a recipe:** Create a file in `cookbook/` following the [recipe conventions](cookbook/README.md#recipe-conventions)
- **Improve a skill:** Edit files in `.github/skills/`
- **Fix docs:** PRs for documentation improvements are always welcome
- **Report issues:** Open an issue describing what went wrong

See [`docs/`](docs/) for detailed technical documentation.

---

## License

MIT — use it however you want.
