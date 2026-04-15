# 🚀 Getting Started with CopilotForge

> A complete walkthrough from zero to a fully scaffolded project. We'll set up a task management app with Next.js and Prisma as our running example.

**Time needed:** About 5 minutes.

**What you need:** A project repo and an AI coding assistant (GitHub Copilot Chat, Claude Code, or any LLM).

---

## Table of Contents

- [The Example Project](#the-example-project)
- [Step 1 — Add the Planner Skill](#step-1--add-the-planner-skill)
- [Step 2 — Start the Wizard](#step-2--start-the-wizard)
- [Step 3 — Answer the Questions](#step-3--answer-the-questions)
- [Step 4 — Confirm and Generate](#step-4--confirm-and-generate)
- [Step 5 — Explore What Was Created](#step-5--explore-what-was-created)
- [Testing That It Worked](#testing-that-it-worked)
- [Customizing the Output](#customizing-the-output)
- [Running It Again (Memory in Action)](#running-it-again-memory-in-action)
- [Troubleshooting](#troubleshooting)

---

## The Example Project

Let's say you're building **TaskFlow** — a task management app with:

- **Frontend:** React (via Next.js)
- **API:** Next.js API routes
- **Database:** PostgreSQL via Prisma
- **Language:** TypeScript
- **Testing:** Jest

Your repo currently looks like this:

```
taskflow/
├── package.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── tsconfig.json
```

Let's add CopilotForge to it.

---

## Step 1 — Add the Planner Skill

Create the following folder structure in your project:

```
taskflow/
  .github/
    skills/
      planner/
        SKILL.md
```

Copy the `SKILL.md` file from CopilotForge's `.github/skills/planner/SKILL.md` into that location.

> 💡 **Already have a `.github/` folder?** That's fine — just add the `skills/planner/` subfolder inside it. CopilotForge won't touch your existing workflows or settings.

That's the only setup step. No packages, no config files, no CLI tools.

---

## Step 2 — Start the Wizard

Open your AI assistant and type:

```
set up my project
```

The Planner skill activates and greets you:

> **Welcome to CopilotForge!** I'll ask you five quick questions about your project, then scaffold a complete set of Copilot skills, agent definitions, memory files, and code recipes into this repo. Takes about two minutes. Let's go.

---

## Step 3 — Answer the Questions

The wizard asks questions one at a time. Here's exactly how the conversation goes for our TaskFlow example:

### Question 1 — Project Description

> **Wizard:** What are you building? Describe your project in a sentence or two.

**You:** A task management app where teams can create, assign, and track tasks with due dates and priority levels.

### Question 2 — Tech Stack

> **Wizard:** What's your stack? List languages, frameworks, and key tools.

**You:** TypeScript, Next.js, Prisma, PostgreSQL, React, Jest

> 💡 The wizard also scans your repo automatically. Since you have a `package.json` and `prisma/schema.prisma`, it already knows you're using TypeScript and Prisma. Your answer confirms and adds detail.

### Question 3 — Memory

> **Wizard:** Do you want memory across sessions? This creates `forge-memory/` files so agents remember decisions and patterns between conversations.

**You:** yes

### Question 4 — Test Automation

> **Wizard:** I see you already have test files in this repo. I'll keep test automation enabled. Say "no" if you want to skip the tester agent and testing skill.

**You:** yes

> 💡 The wizard noticed your Jest config and auto-detected test automation. Smart!

### Question 5 — Experience Level

> **Wizard:** What's your experience level? This controls how verbose the generated files are.
> - **beginner** — extra comments, explanations in every file
> - **intermediate** — standard detail, assumes you know your stack
> - **advanced** — minimal comments, just the essentials

**You:** intermediate

---

## Step 4 — Confirm and Generate

The wizard shows you a summary:

> **Here's what I'll create:**
>
> - **Project:** A task management app where teams can create, assign, and track tasks
> - **Stack:** TypeScript, Next.js, Prisma, PostgreSQL, React, Jest
> - **Memory:** yes
> - **Test automation:** yes
> - **Verbosity:** intermediate
>
> I'll generate skills, agents, memory files, cookbook recipes, and a FORGE.md control panel. Ready to go?

**You:** yes

The wizard creates all the files. When it's done, you see a summary:

> **✅ CopilotForge scaffolding complete!**
>
> I created:
> - **3 skills** — taskflow-conventions, code-review, testing
> - **3 agents** — planner, reviewer, tester
> - **6 cookbook recipes** — error-handling.ts, api-client.ts, auth-middleware.ts, db-query.ts, route-handler.ts, mcp-server.ts
> - **4 memory files** — decisions.md, patterns.md, preferences.md, history.md
> - **1 control panel** — FORGE.md
>
> **Start here:** Open FORGE.md to see your full setup.

---

## Step 5 — Explore What Was Created

Your repo now looks like this:

```
taskflow/
├── .copilot/
│   └── agents/
│       ├── planner.md            # The wizard
│       ├── reviewer.md           # Code reviewer — knows TypeScript + Prisma conventions
│       └── tester.md             # Test writer — uses Jest patterns
│
├── .github/
│   └── skills/
│       ├── planner/
│       │   └── SKILL.md          # The wizard skill
│       ├── taskflow-conventions/
│       │   └── SKILL.md          # Your project's coding standards
│       ├── code-review/
│       │   └── SKILL.md          # Code review checklist for your stack
│       └── testing/
│           └── SKILL.md          # Testing patterns for Jest + TypeScript
│
├── cookbook/
│   ├── README.md                 # Recipe index
│   ├── error-handling.ts         # TypeScript error patterns
│   ├── api-client.ts             # HTTP client with retry and auth
│   ├── auth-middleware.ts        # Next.js/Express JWT middleware
│   ├── db-query.ts               # Prisma CRUD, transactions, error handling
│   ├── route-handler.ts          # Next.js API routes with Zod validation
│   └── mcp-server.ts             # MCP tool server for Copilot
│
├── forge-memory/
│   ├── decisions.md              # "Scaffolded TaskFlow with Next.js + Prisma"
│   ├── patterns.md               # TypeScript strict mode, path aliases, Prisma conventions
│   ├── preferences.md            # Intermediate verbosity, TypeScript primary
│   └── history.md                # "2026-04-16 — Initial setup, 17 files"
│
├── FORGE.md                      # Your control panel — open this first
│
├── package.json                  # (your existing file, untouched)
├── prisma/                       # (your existing folder, untouched)
├── src/                          # (your existing folder, untouched)
└── tsconfig.json                 # (your existing file, untouched)
```

### What each file does

**Skills** (`.github/skills/`):

| File | Purpose |
|------|---------|
| `taskflow-conventions/SKILL.md` | Defines coding standards for your project — naming conventions, TypeScript strict mode, Prisma patterns, error handling approach |
| `code-review/SKILL.md` | Instructions for reviewing code — what to check for in TypeScript, common Next.js pitfalls, Prisma anti-patterns |
| `testing/SKILL.md` | Instructions for writing tests — Jest conventions, mocking Prisma, testing API routes |

**Agents** (`.copilot/agents/`):

| File | Purpose |
|------|---------|
| `reviewer.md` | An AI code reviewer that knows your project's conventions and stack-specific rules |
| `tester.md` | An AI test writer that creates Jest tests following your project's patterns |
| `planner.md` | The wizard itself — this is how CopilotForge runs the setup flow |

**Cookbook** (`cookbook/`):

| File | Purpose |
|------|---------|
| `error-handling.ts` | Custom error types, retry with exponential backoff, graceful degradation |
| `api-client.ts` | Typed HTTP client with auth headers, retry logic, and timeout handling |
| `auth-middleware.ts` | JWT authentication middleware for Express/Next.js with role-based access |
| `db-query.ts` | Prisma CRUD operations, transactions, connection management, error handling |
| `route-handler.ts` | Next.js/Express route with Zod input validation and typed responses |
| `mcp-server.ts` | An MCP server with tool definitions — useful if you build Copilot integrations |

**Memory** (`forge-memory/`):

| File | Purpose |
|------|---------|
| `decisions.md` | Records what CopilotForge decided and why — your project's decision log |
| `patterns.md` | Coding conventions — TypeScript strict mode, Prisma naming, file structure |
| `preferences.md` | Your wizard settings — verbosity, stack, testing preference |
| `history.md` | When CopilotForge ran and what it did |

---

## Testing That It Worked

Try these commands in your AI assistant to test the generated setup:

### Test the code reviewer

```
Review this code:

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  return task;
}
```

Your reviewer agent should flag things like: missing error handling, no null check, should validate the `id` parameter.

### Test the test writer

```
Write tests for the getTask function above
```

Your tester agent should generate Jest tests with Prisma mocking, covering the happy path, missing task, and invalid ID scenarios.

### Test the project conventions

```
What are the coding conventions for this project?
```

Your AI assistant should reference the `taskflow-conventions` skill and describe your TypeScript/Prisma conventions.

---

## Customizing the Output

Everything CopilotForge generates is plain text. Edit any file anytime.

### Change your coding conventions

Open `.github/skills/taskflow-conventions/SKILL.md` and edit the Patterns section. Add your team's specific rules — import ordering, component structure, API response format, whatever matters to you.

### Adjust the code reviewer

Open `.copilot/agents/reviewer.md` and edit the System Prompt. Add checklist items specific to your project, or remove ones that don't apply.

### Modify a cookbook recipe

Open any recipe in `cookbook/`, change the code to match your project's actual patterns, and save. Recipes are starting points — they're meant to be customized.

### Add a new agent

Create a new `.md` file in `.copilot/agents/`. Use `reviewer.md` as a template. Define the role, scope, and instructions. Update `FORGE.md` to add it to the agents table.

### Add a new skill

Create a new folder in `.github/skills/` with a `SKILL.md` file inside. Follow the format in the existing skills — describe when it activates and what it does.

---

## Running It Again (Memory in Action)

Let's say a month later, you've added a WebSocket layer to TaskFlow. Run the wizard again:

```
set up my project
```

This time, the greeting is different:

> 👋 **Welcome back!** I found your project context:
> - **Project:** A task management app where teams can create, assign, and track tasks
> - **Stack:** TypeScript, Next.js, Prisma, PostgreSQL, React, Jest
> - **Last run:** 2026-04-16
> - **Decisions:** 1 recorded
> - **Patterns:** 5 active conventions
> - **Agents:** planner, reviewer, tester
>
> What would you like to do?

**You:** I added WebSocket support with socket.io. Can you update my setup?

The wizard now:
- **Skips questions it already knows** — your project description, stack preferences, and verbosity are all in memory
- **Asks only about what's new** — confirms the WebSocket addition, checks if you want new recipes
- **Preserves your existing files** — it won't overwrite your customized reviewer or conventions
- **Appends to memory** — adds a new decision entry: "Added WebSocket support"
- **Generates new recipes** — might add a `websocket-handler.ts` to the cookbook

Your customizations survive every re-run. Memory only grows — it never deletes.

---

## Troubleshooting

### "The wizard didn't start when I said 'set up my project'"

**Check that the SKILL.md file is in the right location:**
```
your-project/.github/skills/planner/SKILL.md
```

The path must be exact. The file needs to be inside a `planner/` folder, which is inside `skills/`, which is inside `.github/`.

**Check that your AI assistant can read repo files.** Some setups require you to open the project folder first or enable file access.

### "I got an error during scaffolding"

CopilotForge is designed to handle partial failures gracefully. If one part fails, the rest still generates. Check the validation summary at the end — it lists what was created and what was skipped.

Try running the wizard again. It'll detect existing files and only generate what's missing.

### "The generated files don't match my stack"

Be specific in Question 2 (tech stack). Instead of "JavaScript," say "TypeScript, Express, Prisma." The more specific you are, the more targeted the output.

CopilotForge also reads your config files (`package.json`, `requirements.txt`, etc.) to auto-detect frameworks. Make sure these files are up to date.

### "I want to remove something that was generated"

Just delete the file. CopilotForge won't re-create deleted files unless you run the wizard again — and even then, it asks before regenerating. Your choices are always respected.

### "FORGE.md has placeholder values like `{{project-name}}`"

This means you're looking at the template, not a generated file. The template lives in `templates/FORGE.md` and uses `{{placeholder}}` syntax. After running the wizard, the real `FORGE.md` at your repo root has your actual values filled in.

### "Can I use CopilotForge without GitHub Copilot?"

Yes. The SKILL.md file is just a set of instructions that any language model can follow. Paste the Instructions section into Claude Code, ChatGPT, or any AI assistant that can create files in your project.

### "I want to use Python, not TypeScript"

Just answer "Python" (and your frameworks) in Question 2. CopilotForge generates Python recipes — FastAPI routes, SQLAlchemy CRUD, Python error handling, pytest conventions. Everything adapts to your stack.

---

## Next Steps

- **Read the recipes:** Browse `cookbook/README.md` for the full recipe index
- **Understand the internals:** Read [HOW-IT-WORKS.md](HOW-IT-WORKS.md) for a look under the hood
- **Go back to the README:** [README.md](../README.md)
