# 🔍 How CopilotForge Works

> A gentle look under the hood. This is for people who want to understand how the pieces fit together — not required to use CopilotForge.

---

## Table of Contents

- [The Big Picture](#the-big-picture)
- [The Planner Skill](#the-planner-skill)
- [What Are Skills?](#what-are-skills)
- [What Are Agents?](#what-are-agents)
- [The Memory System](#the-memory-system)
- [The Cookbook](#the-cookbook)
- [How Re-Runs Work](#how-re-runs-work)
- [Architecture Diagram](#architecture-diagram)

---

## The Big Picture

CopilotForge has four main layers:

1. **The Planner** — The wizard. It asks questions, figures out what you need, and creates everything.
2. **Skills** — Instruction files that teach AI assistants how to do specific tasks (review code, write tests, etc.).
3. **Agents** — AI team members, each with a specific job and a set of skills.
4. **Memory** — Files that track decisions, conventions, and preferences so the system gets smarter over time.

When you run CopilotForge, the Planner coordinates everything. It collects your answers, detects your stack, generates the right files, and produces a summary. The other layers are the output.

```
You describe your project
        ↓
   The Planner asks 5 questions
        ↓
   It scans your repo (package.json, requirements.txt, etc.)
        ↓
   It generates: Skills + Agents + Recipes + Memory + FORGE.md
        ↓
   You're ready to go
```

---

## The Planner Skill

The Planner lives at `.github/skills/planner/SKILL.md`. It's the entry point — everything starts here.

### What's in the file

The SKILL.md file contains:

- **Metadata** at the top (name, description, trigger phrases)
- **Instructions** — a step-by-step protocol the AI assistant follows when triggered

The metadata includes trigger phrases — words you can say to activate the wizard. Things like "set up my project," "forge," "plan my project," and "scaffold my repo."

### What it does step by step

1. **Checks for memory** — Looks for existing `forge-memory/` files. If found, it's a returning user.
2. **Runs the wizard** — Asks five questions (or fewer, if memory has the answers).
3. **Confirms with you** — Shows a summary and waits for your "yes."
4. **Detects your stack** — Scans manifest files (`package.json`, `requirements.txt`, `go.mod`, `.csproj`) to identify your frameworks.
5. **Generates files** — Creates skills, agents, recipes, memory files, and the FORGE.md control panel.
6. **Reports results** — Shows a summary of everything that was created.

### Why it's just a markdown file

CopilotForge is intentionally dependency-free. The entire wizard is a markdown file with instructions that any language model can follow. There's no executable, no runtime, no package manager. This means:

- It works in GitHub Copilot Chat, Claude Code, ChatGPT, or any LLM
- You can read and edit the wizard's behavior by opening the file
- There's nothing to install, update, or break

---

## What Are Skills?

A skill is a markdown file that teaches an AI assistant how to handle a specific type of request.

### The format

Every skill follows the same structure:

```markdown
---
name: "skill-name"
description: "What this skill does"
domain: "category"
---

## Context
Why this skill exists and when it should be used.

## Patterns
Specific instructions, conventions, and rules to follow.

## Examples
Concrete examples showing correct behavior.

## Anti-Patterns
Things to avoid and why.
```

The metadata at the top (between the `---` marks) is used by AI assistants to know when the skill applies. The body is the actual instruction set.

### Skills CopilotForge generates

| Skill | What It Teaches |
|-------|----------------|
| **Project conventions** | Your project's coding standards — naming, file structure, error handling |
| **Code review** | How to review code for your specific stack, with common pitfalls to check |
| **Testing** | How to write tests using your stack's test framework (Jest, pytest, etc.) |

### Where they live

Skills live in `.github/skills/`. Each skill gets its own folder with a `SKILL.md` file inside:

```
.github/
  skills/
    my-app-conventions/
      SKILL.md
    code-review/
      SKILL.md
    testing/
      SKILL.md
```

### How they're used

When you say something like "review this code" in your AI assistant, the assistant checks if any skill in your repo matches that request. The `code-review` skill has triggers for "review this," "check my code," and similar phrases. The assistant reads the skill's instructions and follows them.

You don't need to activate skills manually. They work in the background, providing context to your AI assistant whenever a matching request comes in.

---

## What Are Agents?

An agent is an AI team member with a specific job. Where skills are the "how," agents are the "who."

### The format

Every agent is a markdown file with:

```markdown
# Agent Name

## Role
One sentence: what this agent does.

## Scope
What this agent is responsible for.

## System Prompt
Instructions the AI follows when acting as this agent.

## Boundaries
What this agent handles vs. what it doesn't.

## Skills
Which skills this agent uses.
```

### Agents CopilotForge generates

| Agent | Job |
|-------|-----|
| **Planner** | Runs the CopilotForge wizard |
| **Reviewer** | Reviews code against your project's conventions |
| **Tester** | Writes tests using your stack's test framework |

### How agents and skills work together

Think of it this way:

- The **reviewer agent** is a team member whose job is code review
- The **code-review skill** is the checklist that reviewer follows
- When you say "review my code," the reviewer agent activates and uses the code-review skill to know what to check

Agents reference skills by name. The reviewer's configuration says "use the code-review skill" — so any changes you make to the skill automatically change how the reviewer works.

### Where they live

Agents live in `.copilot/agents/`:

```
.copilot/
  agents/
    planner.md
    reviewer.md
    tester.md
```

---

## The Memory System

Memory is what makes CopilotForge get smarter over time. It's a folder called `forge-memory/` with four plain-text files.

### The four memory files

| File | What It Stores | Example Entry |
|------|---------------|---------------|
| `decisions.md` | Architectural decisions with context and reasoning | "2026-04-16 — Chose Prisma over raw SQL because we need type-safe queries and migrations" |
| `patterns.md` | Coding conventions and project rules | "TypeScript: always use strict mode and path aliases" |
| `preferences.md` | Your wizard settings and overrides | "Verbosity: intermediate, Primary: TypeScript" |
| `history.md` | Session log — when CopilotForge ran | "2026-04-16 — Initial setup, created 17 files" |

### Memory Privacy & Security

Your memory files live in your repo (`forge-memory/`), stored as plain markdown. **Nothing is sent to external servers.** You can read, edit, or delete them anytime.

**For public repos:** If you don't want your decisions visible publicly, add `forge-memory/` to your `.gitignore`.

### How memory is used

When you run the wizard again, the Planner reads all memory files before asking questions. This means:

- **It knows your project** — no need to describe it again
- **It knows your stack** — no need to list frameworks again
- **It knows your preferences** — no need to re-select experience level
- **It respects your conventions** — new files follow the patterns already established

Instead of five questions, returning users see a summary and can jump straight to what they want to change.

### How memory grows

Memory uses an **append-only** approach:

- New decisions are added to the top of `decisions.md`
- New patterns are added to `patterns.md`
- Previous entries are never deleted

This creates a history you can browse. If you want to understand why something was set up a certain way, check `decisions.md`.

### Memory is optional

If you said "no" to memory (Question 3), none of these files are created. Everything else still works — you just start from scratch each time you run the wizard.

### Memory budget

To keep things efficient, memory files have a soft limit of about 500 total lines. When files get long, older entries are summarized (compressed into shorter versions) to make room for new ones. The summarization is logged as its own decision, so you know it happened.

---

## The Cookbook

The cookbook is a library of copy-paste code recipes in `cookbook/`. Unlike skills (which are instructions) and agents (which are team members), recipes are actual runnable code files.

### How recipes are selected

When you run the wizard, CopilotForge picks recipes based on your stack:

1. **It scans your config files** — `package.json`, `requirements.txt`, `go.mod`, `.csproj`
2. **It maps packages to recipes** — If you have Express, you get an Express route handler. If you have Prisma, you get Prisma CRUD patterns.
3. **It avoids duplicates** — If a more specific recipe exists (like `db-prisma.ts`), it won't also generate a generic `db-query.ts`.
4. **It always includes basics** — Error handling and API client recipes are generated for every project.

### Recipe structure

Every recipe follows the same pattern:

```typescript
/**
 * Recipe Name — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES: Description
 * WHEN TO USE THIS: Use case
 * HOW TO RUN: Instructions
 * PREREQUISITES: What you need installed
 */

// All imports included — nothing to install separately

// TODO markers show where you plug in your values
```

The `TODO` markers are intentional. Search for "TODO" in any recipe to find the spots you need to customize.

### Verbosity levels

The same recipe has different amounts of comments depending on your experience level:

- **Beginner** — Comments explain every section, with examples and why things are done a certain way
- **Intermediate** — Comments on non-obvious parts only
- **Advanced** — Minimal comments, just the code

### Available recipes

CopilotForge includes recipes for:

| Category | TypeScript | Python |
|----------|-----------|--------|
| Error handling | ✅ | ✅ |
| API client | ✅ | ✅ |
| Auth middleware | ✅ (Express/JWT) | ✅ (FastAPI/JWT) |
| Database | ✅ (Prisma) | ✅ (SQLAlchemy) |
| Route handlers | ✅ (Express) | ✅ (FastAPI) |
| MCP server | ✅ | ✅ |
| Session management | ✅ | ✅ |
| Memory reader | ✅ | ✅ |

Go and C# recipes are available for core categories as well.

---


## What is MCP?

**MCP stands for Model Context Protocol** — it's a standard way for AI assistants to use external tools and capabilities.

Think of it like **USB for AI**: just as USB lets you plug in a keyboard, mouse, or storage device into a computer, MCP lets you plug in capabilities (a database, file system, API, code analyzer) into an AI assistant. The assistant can then use those tools to do more powerful work.

CopilotForge includes an MCP recipe showing how to build one. You can find examples in:
- **TypeScript:** cookbook/mcp-server.ts
- **Python:** cookbook/mcp-server.py

If you're curious about how it works under the hood, these recipes show the structure and how to connect your tool to an AI assistant.

## How Re-Runs Work

CopilotForge is designed to be run multiple times on the same project. Here's how it handles that:

### File preservation

**CopilotForge never overwrites files you might have edited.** When it detects existing files:

- **Skills, agents, recipes:** Skipped. If the file exists, it's left alone.
- **Memory files:** Appended to. New decisions are added; old ones are never deleted.
- **FORGE.md:** Regenerated (with your permission) to reflect the current state.

### The returning user flow

1. The wizard checks for `forge-memory/` files
2. If found, it reads your project description, stack, preferences, and decisions
3. Instead of the normal greeting, you see: "Welcome back! Here's what I know..."
4. Only questions with missing answers are asked — everything else is pre-filled from memory
5. You can change any previous answer, or just add what's new

### What triggers a re-run?

Common reasons to re-run:

- You added a new framework (e.g., WebSocket support)
- You want additional agents or skills
- You want to update cookbook recipes for a new stack component
- You accidentally deleted a generated file and want it back

### Safety rails

- Deleted files are re-created (with a note in the summary)
- Your `forge-memory/` folder is never deleted, even if you say "no" to memory on a re-run
- FORGE.md regeneration always asks for confirmation first
- The summary at the end tells you exactly what was created, skipped, and changed

---

## Architecture Diagram

For a visual overview of how all the pieces connect, see the architecture diagram:

![CopilotForge Architecture](../copilot_forge_framework.svg)

This diagram shows the flow from user input through the wizard, stack detection, file generation, and the relationship between skills, agents, memory, and the cookbook.

---

## Summary

| Layer | What It Is | Where It Lives |
|-------|-----------|----------------|
| **Planner** | The wizard that orchestrates everything | `.github/skills/planner/SKILL.md` |
| **Skills** | Instruction files for specific tasks | `.github/skills/{name}/SKILL.md` |
| **Agents** | AI team members with defined roles | `.copilot/agents/{name}.md` |
| **Memory** | Decision log, conventions, preferences | `forge-memory/` |
| **Cookbook** | Copy-paste code recipes | `cookbook/` |
| **FORGE.md** | Dashboard showing everything | Repo root |

Everything is plain markdown and code. No hidden config, no binaries, no magic. What you see is what you get.

---

**← Back to [README](../README.md)** | **→ Recipe index: [cookbook/README.md](../cookbook/README.md)**

