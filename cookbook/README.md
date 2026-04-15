# 📖 CopilotForge Cookbook

> Copy-paste-ready code recipes for common tasks. Every recipe includes all imports, error handling, and clear comments — no "install this first" surprises.

---

### 🆕 New to CopilotForge?

This is the recipe library — a collection of ready-to-use code examples generated for your stack. If you're just getting started, head to the **[main README](../README.md)** for the full picture, or check out the **[Getting Started guide](../docs/GETTING-STARTED.md)** for a step-by-step walkthrough.

The short version: run the CopilotForge wizard (say "set up my project" in your AI assistant), and it picks the right recipes for your project automatically. You can also browse and copy recipes from here directly.

---

## Recipes

### Session Management

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`session-example.ts`](./session-example.ts) | TypeScript | Basic session management — create sessions, send messages, handle timeouts, clean up |
| [`session-example.py`](./session-example.py) | Python | Same session pattern in Python |

### Multiple Sessions

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`multiple-sessions.ts`](./multiple-sessions.ts) | TypeScript | Manage multiple independent conversations — custom IDs, listing, cleanup |
| [`multiple-sessions.py`](./multiple-sessions.py) | Python | Same multi-session pattern in Python |

### Error Handling

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`error-handling.ts`](./error-handling.ts) | TypeScript | Custom error hierarchy, retry with exponential backoff, graceful degradation |
| [`error-handling.py`](./error-handling.py) | Python | Custom exception hierarchy, retry decorator, structured error responses |

### MCP Integration

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`mcp-server.ts`](./mcp-server.ts) | TypeScript | MCP server with tools (file search, data lookup, status check), Zod validation |
| [`mcp-server.py`](./mcp-server.py) | Python | MCP server using FastMCP with tool decorators, type hints, error handling |

### API Clients

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`api-client.ts`](./api-client.ts) | TypeScript | Typed HTTP client (native fetch) — retry, auth, timeout, response parsing |
| [`api-client.py`](./api-client.py) | Python | Async HTTP client (httpx) — retry, auth, timeout, typed responses |

### Auth & Middleware

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`auth-middleware.ts`](./auth-middleware.ts) | TypeScript | Express JWT middleware — verify tokens, role-based access, token generation |
| [`auth-middleware.py`](./auth-middleware.py) | Python | FastAPI JWT dependency — verify tokens, role extraction, HTTP error responses |

### Database Patterns

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`db-query.ts`](./db-query.ts) | TypeScript | Prisma CRUD, transactions, error handling, connection management |
| [`db-query.py`](./db-query.py) | Python | SQLAlchemy async CRUD, transactions, session management, error handling |

### Route Handlers

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`route-handler.ts`](./route-handler.ts) | TypeScript | Express routes with Zod validation, error middleware, typed request/response |
| [`route-handler.py`](./route-handler.py) | Python | FastAPI routes with Pydantic models, dependency injection, proper status codes |

### Memory

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`memory-reader.ts`](./memory-reader.ts) | TypeScript | Read and parse forge-memory files — decisions, patterns, preferences, history |
| [`memory-reader.py`](./memory-reader.py) | Python | Same memory reader in Python — dataclass models, query helpers, context formatter |

### File Management

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`managing-local-files.ts`](./managing-local-files.ts) | TypeScript | Organize files by metadata — extension, date, size — with dry-run mode |
| [`managing-local-files.py`](./managing-local-files.py) | Python | Same file organization pattern in Python |

### Delegation & Skills

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
