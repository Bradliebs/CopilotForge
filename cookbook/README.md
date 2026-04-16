# 📖 CopilotForge Cookbook

> Copy-paste-ready code recipes for common tasks. Every recipe includes all imports, error handling, and clear comments — no "install this first" surprises.

---

### 🆕 New to CopilotForge?

This is the recipe library — a collection of ready-to-use code examples generated for your stack. If you're just getting started, head to the **[main README](../README.md)** for the full picture, or check out the **[Getting Started guide](../docs/GETTING-STARTED.md)** for a step-by-step walkthrough.

The short version: run the CopilotForge wizard (say "set up my project" in your AI assistant), and it picks the right recipes for your project automatically. You can also browse and copy recipes from here directly.

---

## 🚀 Quick Start — First 5 Recipes

> **Starting from zero?** Run these five recipes in order. You'll go from "hello world" to building real features in under an hour.

| # | Recipe | What You'll Learn | Run It |
|---|--------|-------------------|--------|
| 1 | [`hello-world`](./hello-world.ts) | Connect to Copilot SDK, send a message, get a response | `npx ts-node hello-world.ts` |
| 2 | [`session-example`](./session-example.ts) | Sessions, context management, cleanup | `npx ts-node session-example.ts` |
| 3 | [`error-handling`](./error-handling.ts) | Retry logic, custom errors, graceful degradation | `npx ts-node error-handling.ts` |
| 4 | [`memory-reader`](./memory-reader.ts) | Read forge-memory files (decisions, patterns) | `npx ts-node memory-reader.ts` |
| 5 | [`api-client`](./api-client.ts) | HTTP clients with auth, retry, and typed responses | `npx ts-node api-client.ts` |

> 💡 All recipes are available in both **TypeScript** and **Python**. Swap `.ts` for `.py` if Python is your thing.

---

## 🗺️ Recommended Learning Path

> Inspired by the Squad SDK's sample organization. Work through these tiers in order — each recipe builds on concepts from the previous ones.

### 🟢 Beginner — Start Here

| # | Recipe | What It Teaches |
|---|--------|-----------------|
| 1 | [`hello-world`](./hello-world.ts) | Your first Copilot SDK recipe — basic setup, connect, send, receive |
| 2 | [`session-example`](./session-example.ts) | Understand sessions and context management |
| 3 | [`error-handling`](./error-handling.ts) | Proper error handling patterns — retries, custom errors, graceful failure |
| 4 | [`memory-reader`](./memory-reader.ts) | Read from forge-memory files — decisions, patterns, preferences, history |

### 🟡 Intermediate — Expand Your Skills

| # | Recipe | What It Teaches |
|---|--------|-----------------|
| 5 | [`api-client`](./api-client.ts) | Build API clients with auth, retry, timeout, typed responses |
| 6 | [`auth-middleware`](./auth-middleware.ts) | JWT/session authentication middleware (Express/FastAPI) |
| 7 | [`route-handler`](./route-handler.ts) | Express/FastAPI route patterns with validation |
| 8 | [`db-query`](./db-query.ts) | Database queries and ORM patterns (Prisma/SQLAlchemy) |
| 9 | [`managing-local-files`](./managing-local-files.ts) | File system operations — organize, move, categorize |
| 10 | [`persisting-sessions`](./persisting-sessions.ts) | Save and restore session state across restarts |
| 11 | [`copilot-hooks`](./copilot-hooks.ts) | Git hooks and automation triggers for Copilot CLI |

### 🔴 Advanced — Full Power

| # | Recipe | What It Teaches |
|---|--------|-----------------|
| 12 | [`ralph-loop`](./ralph-loop.ts) | Autonomous task execution loop — pick, implement, validate, commit |
| 13 | [`multiple-sessions`](./multiple-sessions.ts) | Multi-agent coordination with concurrent sessions |
| 14 | [`mcp-server`](./mcp-server.ts) | Build MCP servers that extend Copilot with custom tools |
| 15 | [`auto-research`](./auto-research.ts) | Automated web research and experiment pipelines |
| 16 | [`knowledge-wiki`](./knowledge-wiki.ts) | Knowledge base management — ingest, search, cross-reference |
| 17 | [`command-center`](./command-center.ts) | Project dashboard and monitoring |
| 18 | [`pr-visualization`](./pr-visualization.ts) | PR analytics and visualization |
| 19 | [`delegation-example`](./delegation-example.ts) | Agent delegation patterns — orchestrator → delegate flows |
| 20 | [`skill-creation-example`](./skill-creation-example.ts) | Create custom SKILL.md files programmatically |
| 21 | [`template-creator`](./template-creator.ts) | Template factory pattern — generate docs, READMEs, issues in bulk |
| 22 | [`blog-writer`](./blog-writer.ts) | Content generation pipelines — PRs → blog posts |

### 🏗️ Platform Guides

| # | Guide | What It Covers |
|---|-------|----------------|
| 23 | [`copilot-studio-guide`](./copilot-studio-guide.md) | Copilot Studio + VS Code extension — enterprise agent development |
| 24 | [`code-apps-guide`](./code-apps-guide.md) | Power Apps Code Apps — building with React/TypeScript |
| 25 | [`copilot-agents-guide`](./copilot-agents-guide.md) | GitHub Copilot custom agents — `.agent.md` profiles and configuration |

---

## Recipes

### 🟢 Hello World

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`hello-world.ts`](./hello-world.ts) | TypeScript | Simplest Copilot SDK recipe — connect, send one message, print response, disconnect |
| [`hello-world.py`](./hello-world.py) | Python | Same hello-world pattern in Python |

### 🔴 Ralph Loop (Autonomous Dev Loop)

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`ralph-loop.ts`](./ralph-loop.ts) | TypeScript | Autonomous dev loop — pick task, implement, validate, commit, repeat |
| [`ralph-loop.py`](./ralph-loop.py) | Python | Same ralph-loop pattern in Python |

### 🟢 Session Management

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`session-example.ts`](./session-example.ts) | TypeScript | Basic session management — create sessions, send messages, handle timeouts, clean up |
| [`session-example.py`](./session-example.py) | Python | Same session pattern in Python |

### 🔴 Multiple Sessions

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`multiple-sessions.ts`](./multiple-sessions.ts) | TypeScript | Manage multiple independent conversations — custom IDs, listing, cleanup |
| [`multiple-sessions.py`](./multiple-sessions.py) | Python | Same multi-session pattern in Python |

### 🟢 Error Handling

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`error-handling.ts`](./error-handling.ts) | TypeScript | Custom error hierarchy, retry with exponential backoff, graceful degradation |
| [`error-handling.py`](./error-handling.py) | Python | Custom exception hierarchy, retry decorator, structured error responses |

### 🔴 MCP Integration

> 🔧 **What's MCP?** A way to give AI assistants custom tools — like file search, data lookup, or status checks. Think of it as a plugin system for AI.

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`mcp-server.ts`](./mcp-server.ts) | TypeScript | MCP server with tools (file search, data lookup, status check), Zod validation |
| [`mcp-server.py`](./mcp-server.py) | Python | MCP server using FastMCP with tool decorators, type hints, error handling |

### 🟡 API Clients

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`api-client.ts`](./api-client.ts) | TypeScript | Typed HTTP client (native fetch) — retry, auth, timeout, response parsing |
| [`api-client.py`](./api-client.py) | Python | Async HTTP client (httpx) — retry, auth, timeout, typed responses |

### 🟡 Auth & Middleware

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`auth-middleware.ts`](./auth-middleware.ts) | TypeScript | Express JWT middleware — verify tokens, role-based access, token generation |
| [`auth-middleware.py`](./auth-middleware.py) | Python | FastAPI JWT dependency — verify tokens, role extraction, HTTP error responses |

### 🟡 Database Patterns

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`db-query.ts`](./db-query.ts) | TypeScript | Prisma CRUD, transactions, error handling, connection management |
| [`db-query.py`](./db-query.py) | Python | SQLAlchemy async CRUD, transactions, session management, error handling |

### 🟡 Route Handlers

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`route-handler.ts`](./route-handler.ts) | TypeScript | Express routes with Zod validation, error middleware, typed request/response |
| [`route-handler.py`](./route-handler.py) | Python | FastAPI routes with Pydantic models, dependency injection, proper status codes |

### 🟢 Memory

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`memory-reader.ts`](./memory-reader.ts) | TypeScript | Read and parse forge-memory files — decisions, patterns, preferences, history |
| [`memory-reader.py`](./memory-reader.py) | Python | Same memory reader in Python — dataclass models, query helpers, context formatter |

### 🟡 File Management

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`managing-local-files.ts`](./managing-local-files.ts) | TypeScript | Organize files by metadata — extension, date, size — with dry-run mode |
| [`managing-local-files.py`](./managing-local-files.py) | Python | Same file organization pattern in Python |

### 🔴 Blog & Discussion Writer

> ✍️ **What's the Blog Writer?** A multi-step pipeline that reads your PRs and code changes, then writes blog posts about them. Great for developer blogs and release notes.

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`blog-writer.ts`](./blog-writer.ts) | TypeScript | Multi-step blog generator — brainstorm topics from PRs/issues, outline, draft, and refine |
| [`blog-writer.py`](./blog-writer.py) | Python | Same blog writing pipeline in Python |

### 🟡 Session Persistence

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`persisting-sessions.ts`](./persisting-sessions.ts) | TypeScript | Save and restore conversations — custom IDs, resume, list, delete, get history |
| [`persisting-sessions.py`](./persisting-sessions.py) | Python | Same session persistence pattern in Python |

### 🔴 PR Visualization

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`pr-visualization.ts`](./pr-visualization.ts) | TypeScript | Interactive CLI tool — detect GitHub repo, fetch PRs, generate age charts via Copilot |
| [`pr-visualization.py`](./pr-visualization.py) | Python | Same PR visualization pattern in Python |

### 🔴 Template Creator

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`template-creator.ts`](./template-creator.ts) | TypeScript | Generate project templates (README, issues, PRs, docs) with structured Copilot prompts |
| [`template-creator.py`](./template-creator.py) | Python | Same template generation pipeline in Python |

### 🟡 Copilot CLI Hooks

> 🔗 **What are Hooks?** Automatic commands that run during AI sessions — like logging what happened, blocking dangerous operations, or sending alerts. Think of them as event triggers.

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`copilot-hooks.ts`](./copilot-hooks.ts) | TypeScript | Generate hooks.json + scripts for session logging, safety checks, and audit trails |
| [`copilot-hooks.py`](./copilot-hooks.py) | Python | Same Copilot hooks generator in Python |

### 🔴 Auto-Research (Autonomous Experiments)

> 🧪 **What's Auto-Research?** An AI that experiments on your code automatically — tries changes, measures results, keeps improvements. Inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch).

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`auto-research.ts`](./auto-research.ts) | TypeScript | Autonomous experiment loop — modify code, evaluate, keep/discard, log results. Inspired by Karpathy's autoresearch |
| [`auto-research.py`](./auto-research.py) | Python | Same auto-research harness in Python |

### 🔴 Knowledge Wiki (Personal Knowledge Base)

> 📚 **What's a Knowledge Wiki?** A personal encyclopedia that an AI builds and maintains for you. Drop in articles, notes, or documents — it organizes everything with cross-references. Inspired by [Karpathy's wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`knowledge-wiki.ts`](./knowledge-wiki.ts) | TypeScript | Personal knowledge wiki — ingest sources, search, lint, maintain a compounding knowledge base with AI |
| [`knowledge-wiki.py`](./knowledge-wiki.py) | Python | Same knowledge wiki manager in Python |

### 🔴 Delegation & Skills

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`delegation-example.ts`](./delegation-example.ts) | TypeScript | Full delegation flow — how the Planner orchestrates delegate generators programmatically |
| [`skill-creation-example.ts`](./skill-creation-example.ts) | TypeScript | Create custom SKILL.md files programmatically from code |

---

## How to Use a Recipe

1. **Find the recipe** in the table above.
2. **Read the header comment** — it explains what the recipe does, when to use it, and prerequisites.
3. **Copy the file** into your project (or reference it directly).
4. **Search for `TODO`** markers — these are the places you need to plug in your actual SDK keys, endpoints, or logic.
5. **Run it** using the instructions in the header comment.

> 📝 **Platform Note:** On Windows, use `\` instead of `/` in file paths shown in recipes. PowerShell accepts both.

---

## Troubleshooting

### "Module not found" errors
**Problem:** You get an error like `Cannot find module 'express'` or `ModuleNotFoundError: No module named 'fastapi'`

**Solution:** Check the recipe's PREREQUISITES section at the top. Install the required packages:
- **TypeScript/JavaScript:** `npm install <package-name>`
- **Python:** `pip install <package-name>`
- **Go:** `go get <package-name>`
- **C#:** `dotnet add package <package-name>`

### "Cannot find module 'ts-node'"
**Problem:** TypeScript recipes fail with `Cannot find module 'ts-node'`

**Solution:** Install TypeScript development dependencies:
```bash
npm install -D ts-node typescript @types/node
```

### "Permission denied"
**Problem:** You get a permission error when running a recipe

**Solution:** Check file permissions:
- **Unix/Mac:** `chmod +x recipe-file.sh`
- **Windows:** Run PowerShell as Administrator, or check file ownership in Properties

### "Environment variable not set"
**Problem:** Recipe fails because an environment variable is missing (e.g., `$API_KEY`)

**Solution:** Set the environment variable before running:
- **Unix/Mac:** `export API_KEY=your-key-here`
- **PowerShell:** `$env:API_KEY="your-key-here"`
- **Windows cmd:** `set API_KEY=your-key-here`

Or create a `.env` file if the recipe uses dotenv.

---

## Recipe Conventions

All recipes in this cookbook follow these rules (from `forge-memory/patterns.md`):

- **Self-contained:** Every recipe includes all necessary imports. No "install this separately" surprises.
- **Header comment:** Every recipe starts with a block comment explaining what, when, how, and prerequisites.
- **Error handling:** No bare `try/catch`. Every error path does something meaningful.
- **TODO markers:** Integration points (SDK calls, API keys) are marked with `TODO` so you can find them with a search.
- **Language-idiomatic:** TypeScript recipes use TypeScript patterns. Python recipes use Python patterns.

---

## Adding a Recipe

1. Create a new file: `cookbook/{topic}-example.{ext}`
2. Start with the header comment template:
   ```
   /**
    * {name} — CopilotForge Cookbook Recipe
    *
    * WHAT THIS DOES:
    *   {description}
    *
    * WHEN TO USE THIS:
    *   {use case}
    *
    * HOW TO RUN:
    *   {steps}
    *
    * PREREQUISITES:
    *   {requirements}
    */
   ```
3. Add a row to the table in this README.
4. If your recipe introduces a new pattern, add it to `forge-memory/patterns.md`.

---

## Template Recipes

The `templates/cookbook/` directory contains recipe templates with `{{placeholder}}` syntax. These are used by CopilotForge during scaffolding to generate project-specific recipes. The files in this `cookbook/` directory are the concrete, runnable versions.
