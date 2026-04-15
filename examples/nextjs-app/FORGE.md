# 🔨 FORGE.md

> **This file is your project's control panel.** CopilotForge generated it based on your description. Edit any section to update how Copilot agents work in this repo.

---

## Project Summary

| Field | Value |
|-------|-------|
| **Name** | TaskMaster |
| **Description** | A task management platform with real-time collaboration, Kanban boards, and team analytics |
| **Stack** | TypeScript, Next.js 14, Prisma, PostgreSQL, React, Jest |
| **Created** | 2026-04-16 |
| **Forged by** | CopilotForge |

TaskMaster helps teams organize, prioritize, and track work across multiple projects. Features include drag-and-drop Kanban boards, real-time updates via WebSockets, role-based permissions, and analytics dashboards.

---

## 👥 Team Roster

These agents live in `.copilot/agents/` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Planner | Orchestrator — runs the wizard, builds your project structure | `.copilot/agents/planner.md` |
| Reviewer | Code Quality — reviews code against your stack's best practices | `.copilot/agents/reviewer.md` |
| Tester | QA — generates and maintains tests for your project | `.copilot/agents/tester.md` |

> **Want to add an agent?** Add a row to this table, then create a matching `.md` file in `.copilot/agents/`. Use an existing agent file as a template.

---

## ⚡ Skills Index

Skills live in `.github/skills/` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| taskmaster-conventions | (always active) | TypeScript strict mode, Next.js App Router patterns, Prisma schema-first development |
| code-review | `review this`, `check my code` | Review checklist for TypeScript/Next.js/Prisma stack |
| testing | `write tests`, `test this` | Jest + React Testing Library patterns with Prisma mocking |

> **Want to add a skill?** Create a new folder in `.github/skills/` with a `SKILL.md` file. See existing skills for the format.

---

## 📖 Cookbook Index

<!-- forge:cookbook-start -->
Recipes in `cookbook/` are copy-paste-runnable code examples for common tasks.

### Error Handling
| Recipe | Language | What it does |
|--------|----------|--------------|
| `error-handling.ts` | TypeScript | Custom error hierarchy, retry with exponential backoff, graceful degradation |

### API Clients
| Recipe | Language | What it does |
|--------|----------|--------------|
| `api-client.ts` | TypeScript | Typed HTTP client with retry, auth headers, timeout handling |

### Auth & Middleware
| Recipe | Language | What it does |
|--------|----------|--------------|
| `auth-middleware.ts` | TypeScript | Express/Next.js JWT middleware with role-based access control |

### Database Patterns
| Recipe | Language | What it does |
|--------|----------|--------------|
| `db-query.ts` | TypeScript | Prisma CRUD operations, transactions, connection management |

### Route Handlers
| Recipe | Language | What it does |
|--------|----------|--------------|
| `route-handler.ts` | TypeScript | Next.js API routes with Zod validation and typed responses |

### MCP Integration
| Recipe | Language | What it does |
|--------|----------|--------------|
| `mcp-server.ts` | TypeScript | MCP tool server for Copilot integration |

### Session Management
| Recipe | Language | What it does |
|--------|----------|--------------|
| `session-example.ts` | TypeScript | Session lifecycle — create, send, timeout, cleanup |

### Memory
| Recipe | Language | What it does |
|--------|----------|--------------|
| `memory-reader.ts` | TypeScript | Read and parse forge-memory files programmatically |

<!-- forge:cookbook-end -->

> **Want to add a recipe?** Add a row between the markers above, then drop the recipe file in `cookbook/`. Include a header comment explaining what it does.

---

## 🧠 Memory Status
<!-- forge:memory-start -->

CopilotForge stores project memory in `forge-memory/` so agents remember decisions across sessions.

| Metric | Value |
|--------|-------|
| Last run | 2026-04-16 |
| Sessions | 1 |
| Decisions | 3 |
| Patterns | 7 active |
| Preferences | Set |

### Recent Decisions
- **2026-04-16:** Initial scaffolding — chose Next.js App Router over Pages Router for better server component support
- **2026-04-16:** Prisma over raw SQL — need type-safe queries and automatic migrations
- **2026-04-16:** Jest + React Testing Library — standard for Next.js projects

### Active Conventions
- **TypeScript:** Strict mode enabled, no `any` types, path aliases configured
- **Next.js:** Server components by default, `'use client'` only when needed
- **Prisma:** Schema-first development, migrations for all changes
- **Testing:** Jest for unit tests, React Testing Library for component tests, Prisma mocking via jest-mock-extended
- **Error Handling:** Custom error types with stack traces, never swallow errors silently
- **API Routes:** Zod validation on all inputs, typed responses via NextResponse.json()
- **File Structure:** `/app` for routes, `/components` for UI, `/lib` for utilities, `/prisma` for schema

> 💡 Edit `forge-memory/patterns.md` to update conventions. Edit `forge-memory/preferences.md` to change generation preferences.
<!-- forge:memory-end -->

---

## 🚀 Quick Actions

Copy-paste these into your Copilot chat to get things done:

### Scaffolding
- **Full scaffold:** *"Run the CopilotForge planner to scaffold my project"*
- **Re-scaffold:** *"Re-run the CopilotForge planner to update the project structure"*

### Skills & Agents
- **Add a skill:** *"Create a skill that triggers on [event] and does [action]"*
- **Add an agent:** *"Create a new agent for [role]"*
- **Add a cookbook recipe:** *"Create a cookbook recipe for [task] in TypeScript"*

### Memory & Maintenance
- **Record a decision:** *"Update forge-memory/decisions.md: we decided to [decision] because [reason]"*
- **Add a pattern:** *"Update forge-memory/patterns.md: we now follow [convention] because [reason]"*
- **Check scaffold status:** *"Show me what was generated in the last scaffold run"*

---

## 📝 How to Edit This File

This is just markdown. Change anything you want:

1. **Project Summary** — Update if your project scope changes
2. **Team Roster** — Add/remove agents as your needs evolve
3. **Skills Index** — Keep this in sync with `.github/skills/`
4. **Cookbook** — Add entries when you create new recipes
5. **Memory** — These files are auto-maintained, but you can edit them

**Editing FORGE.md is safe** — it's a reference file. Changes here don't break your agents or recipes. They just update what Copilot knows about your project.

CopilotForge reads this file to understand your project. The more accurate it is, the better your agents work.
