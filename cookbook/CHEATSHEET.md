# 🗺️ Cookbook Cheatsheet

> Not sure which recipe to use? Start here. Pick a goal, find the recipe, copy it.

---

## I Want To...

| Goal | Recipe | File |
|------|--------|------|
| **Say hello to the Copilot SDK** | Hello World | `hello-world.ts` / `.py` |
| **Manage chat sessions** | Session Example | `session-example.ts` / `.py` |
| **Handle multiple conversations** | Multiple Sessions | `multiple-sessions.ts` / `.py` |
| **Save/restore conversations** | Persisting Sessions | `persisting-sessions.ts` / `.py` |
| **Handle errors gracefully** | Error Handling | `error-handling.ts` / `.py` |
| **Build an MCP server** | MCP Integration | `mcp-server.ts` / `.py` |
| **Make API calls** | API Client | `api-client.ts` / `.py` |
| **Add authentication** | Auth Middleware | `auth-middleware.ts` / `.py` |
| **Query a database** | Database Patterns | `db-query.ts` / `.py` |
| **Set up route handlers** | Route Handlers | `route-handler.ts` / `.py` |
| **Read CopilotForge memory** | Memory Reader | `memory-reader.ts` / `.py` |
| **Organize files** | File Management | `managing-local-files.ts` / `.py` |
| **Write blog posts from code** | Blog Writer | `blog-writer.ts` / `.py` |
| **Generate project templates** | Template Creator | `template-creator.ts` / `.py` |
| **Visualize PR activity** | PR Visualization | `pr-visualization.ts` / `.py` |
| **Add Copilot CLI hooks** | Copilot Hooks | `copilot-hooks.ts` / `.py` |
| **Run autonomous experiments** | Auto-Research | `auto-research.ts` / `.py` |
| **Build a personal knowledge base** | Knowledge Wiki | `knowledge-wiki.ts` / `.py` |
| **Build an autonomous dev loop** | Ralph Loop | `ralph-loop.ts` / `.py` |
| **I want AI to build my project from a plan** | Ralph Loop + IMPLEMENTATION_PLAN.md | `cookbook/ralph-loop.ts` | beginner+ |
| **Execute my implementation plan** | Say "run the plan" | Plan Executor skill reads IMPLEMENTATION_PLAN.md, implements tasks one by one |
| **I want to see my project status at a glance** | Command Center | `cookbook/command-center.ts` / `.py` | beginner+ |
| **See delegation in action** | Delegation Example | `delegation-example.ts` |
| **Create custom skills** | Skill Creation | `skill-creation-example.ts` |

---

## By Skill Level

### 🟢 Start Here (Beginner)

These recipes teach the basics. Pick one and run it.

1. **`hello-world`** — Your first Copilot SDK recipe
   - What: Connect, send a message, print response, disconnect
   - Run: `ts-node hello-world.ts` or `python hello-world.py`

2. **`session-example`** — Basic conversation management
   - What: Create sessions, send messages, handle timeouts, clean up
   - Run: `ts-node session-example.ts` or `python session-example.py`

3. **`error-handling`** — Don't let errors crash your app
   - What: Custom error types, retry with backoff, graceful failure
   - Run: `ts-node error-handling.ts` or `python error-handling.py`

---

### 🟡 Build Something (Intermediate)

These recipes let you build features. Combine them.

4. **`api-client`** — HTTP calls with retry and auth
   - What: Typed HTTP client, authentication, timeout, response parsing
   - When: Calling external APIs from your app
   - Files: `api-client.ts` / `.py`

5. **`auth-middleware`** — JWT authentication
   - What: Express/FastAPI middleware, token verification, role-based access
   - When: Building a secure API endpoint
   - Files: `auth-middleware.ts` / `.py`

6. **`db-query`** — Database CRUD operations
   - What: Prisma/SQLAlchemy patterns, transactions, error handling
   - When: Working with databases (PostgreSQL, MySQL, SQLite)
   - Files: `db-query.ts` / `.py`

7. **`route-handler`** — API endpoints
   - What: Express/FastAPI routes, Zod/Pydantic validation, error responses
   - When: Setting up a REST API
   - Files: `route-handler.ts` / `.py`

8. **`managing-local-files`** — File organization
   - What: Organize files by metadata (extension, date, size), dry-run mode
   - When: Building file management tools
   - Files: `managing-local-files.ts` / `.py`

9. **`multiple-sessions`** — Multiple concurrent conversations
   - What: Manage independent Copilot sessions with custom IDs
   - When: Building multi-user or multi-context applications
   - Files: `multiple-sessions.ts` / `.py`

10. **`persisting-sessions`** — Save and restore conversations
    - What: Persist session state to disk, resume later, list sessions
    - When: Building chatbots or conversation UIs
    - Files: `persisting-sessions.ts` / `.py`

11. **`memory-reader`** — Read CopilotForge memory files
    - What: Parse decisions, patterns, preferences, history
    - When: Your app needs project context
    - Files: `memory-reader.ts` / `.py`

12. **`blog-writer`** — Generate blog posts
    - What: Multi-step pipeline — brainstorm from PRs, outline, draft, refine
    - When: Converting code decisions into blog content
    - Files: `blog-writer.ts` / `.py`

---

### 🔴 Power User (Advanced)

These recipes show advanced patterns. Build custom tools.

13. **`mcp-server`** — Extend AI with custom tools
    - What: Build an MCP tool server with Zod validation
    - When: Creating tools the Copilot ecosystem can call
    - Files: `mcp-server.ts` / `.py`

14. **`template-creator`** — Generate project templates
    - What: Create README, issues, PRs, docs with structured prompts
    - When: Generating boilerplate or onboarding docs
    - Files: `template-creator.ts` / `.py`

15. **`pr-visualization`** — Visualize PR activity
    - What: Interactive CLI — fetch PRs, generate age charts via Copilot
    - When: Analyzing repository health and activity
    - Files: `pr-visualization.ts` / `.py`

16. **`copilot-hooks`** — Copilot CLI session hooks
    - What: Generate hooks.json for session logging, safety checks, audit trails
    - When: Instrumenting Copilot CLI for compliance or debugging
    - Files: `copilot-hooks.ts` / `.py`

17. **`auto-research`** — Autonomous experiment loops
    - What: Self-running experiment loops inspired by Karpathy's "Let's Verify Step by Step"
    - When: Building agents that learn and improve autonomously
    - Files: `auto-research.ts` / `.py`

18. **`ralph-loop`** — Autonomous development cycle
    - What: Pick task → implement → validate → commit → repeat
    - When: Building AI-driven continuous development systems
    - Files: `ralph-loop.ts` / `.py`

19. **`delegation-example`** — Delegation patterns
    - What: How the Planner orchestrates delegate generators
    - When: Understanding how to build multi-agent systems
    - Files: `delegation-example.ts` (TypeScript only)

20. **`skill-creation-example`** — Custom skills
    - What: Create SKILL.md files programmatically
    - When: Generating skills for new domains
    - Files: `skill-creation-example.ts` (TypeScript only)

---

## What Are These? (Plain English)

Not sure what some of these recipes are? Here's what they do in everyday terms:

| Recipe | Think of it as... |
|--------|-------------------|
| **Hello World** | Your first "it works!" moment — like turning on a new gadget for the first time |
| **Ralph Loop** | A robot that works through your TODO list while you sleep — picks a task, does it, moves on |
| **Auto-Research** | A tireless experimenter — tries changes to your code, keeps what works, throws away what doesn't |
| **Knowledge Wiki** | Your personal Wikipedia — you feed it articles and notes, it organizes everything and connects the dots |
| **MCP Server** | A custom toolbox for AI — lets your AI assistant use tools YOU built (search files, look up data, etc.) |
| **Copilot Hooks** | Automatic actions during AI sessions — like security cameras that log what happens and block dangerous commands |
| **Blog Writer** | Turns your code changes into blog posts — reads your PRs and writes about what you built |
| **Template Creator** | A document factory — generates README files, issue templates, and project docs in bulk |
| **PR Visualization** | A dashboard for your pull requests — shows charts of what's open, how old they are, who's reviewing |
| **Delegation Example** | A behind-the-scenes look at how AI agents hand off work to each other (for the curious) |

> 💡 **Still confused?** Every recipe has a header comment that explains exactly what it does, when to use it, and how to run it. Just open the file and read the top.

---

## When Would I Use X vs Y?

**auto-research vs ralph-loop?**
- Use **auto-research** when you want to *optimize* something — make code faster, find better settings, improve a score
- Use **ralph-loop** when you want to *build* things — work through a task list, implement features, fix bugs

**knowledge-wiki vs forge-memory?**
- **knowledge-wiki** is for YOU — a personal research tool for any topic (articles, papers, notes)
- **forge-memory** is for your PROJECT — it remembers coding decisions so the AI wizard gets smarter over time
- They're different tools for different jobs. You might use both or neither.

**session-example vs multiple-sessions vs persisting-sessions?**
- **session-example**: One conversation at a time (start here)
- **multiple-sessions**: Many conversations at once (like a support desk handling multiple customers)
- **persisting-sessions**: Save conversations and come back to them later (like chat history)

---

## Quick Tips

- **Read the header comment first** — every recipe starts with WHAT, WHEN, HOW, and PREREQUISITES
- **Search for `TODO`** — that's where you plug in your values (SDK keys, endpoints, logic)
- **Use `ts-node` for TypeScript:** `npx ts-node recipe-name.ts` (needs `npm install -D ts-node typescript @types/node`)
- **Use Python directly:** `python recipe-name.py`
- **Combine recipes** — middleware → route handler → database query
- **Check the cookbook README** — full index with detailed descriptions at [`README.md`](README.md)

---

## Troubleshooting

**"Module not found" error?**
- TypeScript/JavaScript: `npm install <package-name>`
- Python: `pip install <package-name>`
- See PREREQUISITES section in the recipe header

**"Cannot find module 'ts-node'"?**
- Install dev dependencies: `npm install -D ts-node typescript @types/node`

**"Environment variable not set"?**
- PowerShell: `$env:YOUR_VAR="value"`
- Unix/Mac: `export YOUR_VAR="value"`
- Or create a `.env` file if the recipe uses dotenv

**Still stuck?** Check the full troubleshooting guide in [`README.md`](README.md#troubleshooting).

---

## Next Steps

1. Pick a recipe from "By Skill Level" that matches your goal
2. Read the header comment to understand what it does
3. Copy the file into your project
4. Search for `TODO` and fill in your values
5. Run it with the command in the header

**Happy building!** 🚀
