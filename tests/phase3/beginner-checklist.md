# CopilotForge Phase 3 — Beginner QA Checklist

> This checklist is written from the perspective of someone who has **never used
> CopilotForge, MCP, or any AI coding framework**. Phase 3 adds cookbook recipes
> for error handling, MCP servers, API clients, auth, databases, and routing.
> Every recipe must be approachable for a complete beginner.

---

## Recipe Header Comments

Read each recipe's header comment *without looking at the code below it*.
Can you understand what this recipe is for?

- [ ] **error-handling.ts** — I understand what errors this handles and when I'd
      use it. The "WHAT THIS DOES" section uses plain language, not function signatures.

- [ ] **error-handling.py** — Same check in Python. The header explains the same
      concept without assuming I know TypeScript.

- [ ] **mcp-server.ts** — I know what MCP stands for (it's spelled out on first
      use). I understand what an MCP server does in plain terms — even though
      I've never built one.

- [ ] **mcp-server.py** — Same MCP explanation in Python. I'm not told to "just
      read the TypeScript version."

- [ ] **api-client.ts** — I understand what an API client does and why I'd want
      a wrapper around fetch/axios. The header doesn't assume I know what
      "retry logic" means without a brief explanation.

- [ ] **api-client.py** — Same check. "Requests wrapper" is explained, not
      assumed knowledge.

- [ ] **auth-middleware.ts** — I understand what middleware is (explained briefly)
      and what "auth" means in this context. JWT is spelled out if mentioned.

- [ ] **auth-middleware.py** — Same check. No assumption that I know Express or
      FastAPI middleware concepts.

- [ ] **db-query.ts** — I understand what database queries this demonstrates.
      "ORM" or "Prisma" is explained if mentioned.

- [ ] **db-query.py** — Same check. "SQLAlchemy" or "ORM" explained on first use.

- [ ] **route-handler.ts** — I understand what a route handler is (explained) and
      when I'd use this pattern.

- [ ] **route-handler.py** — Same check for the Python version.

---

## Prerequisites Are Clear

For each recipe, check the PREREQUISITES section in the header comment.

- [ ] **Every prerequisite lists what to install.** Not "requires Express" but
      "Install Express: `npm install express`" or a link to installation docs.

- [ ] **API keys or environment variables are called out.** If a recipe needs
      an API key, the prerequisite says where to get one and what env var to set.

- [ ] **No assumed toolchain knowledge.** If a recipe needs `ts-node` or `uvicorn`,
      the prerequisite explains how to install it — not just its name.

- [ ] **Python recipes mention virtual environments.** At minimum, a note like
      "We recommend using a virtual environment: `python -m venv .venv`".

- [ ] **TypeScript recipes mention Node.js version.** At minimum, "Requires
      Node.js 18+" or similar.

---

## README.md Is Scannable

Open `cookbook/README.md` and time yourself.

- [ ] **I can find the right recipe in under 10 seconds.** The table is organized
      so I can scan by topic (error handling, auth, database) or by language
      (TypeScript, Python).

- [ ] **Every recipe has a one-line description.** Not just a filename — a plain
      English description of what it does.

- [ ] **The table has no broken links.** Every `[filename](./path)` link points
      to a file that exists.

- [ ] **The "How to Use" section is at the top or immediately after the table.**
      I don't have to scroll to find instructions.

- [ ] **No wall of text.** The README is structured with headings and a table.
      I'm not reading paragraphs to find what I need.

---

## TODO Markers Are Actionable

Open 4+ recipes and search for `TODO`.

- [ ] **Every TODO explains what to replace.** Not `// TODO: implement` but
      `// TODO: Replace "your-api-key" with your actual API key from https://...`

- [ ] **Every TODO explains why.** Why does this need to be replaced? What will
      break if I don't?

- [ ] **TODOs are near the code they affect.** Not at the top of the file in a
      list — inline with the relevant code.

- [ ] **I can find all TODOs with a search.** All use the exact string `TODO`
      (not `FIXME`, `HACK`, `XXX` for integration points).

- [ ] **After replacing all TODOs, the code would work.** The TODO instructions
      are complete enough that I know exactly what values to fill in.

---

## MCP Recipes Are Approachable

MCP (Model Context Protocol) is the newest concept. Extra scrutiny here.

- [ ] **"MCP" is defined on first use.** The first time MCP appears in any recipe,
      it says "MCP (Model Context Protocol)" — not just "MCP".

- [ ] **I understand what an MCP server does.** The header explains it in
      beginner terms: something like "An MCP server lets AI tools call functions
      in your code" — not "implements the MCP transport layer."

- [ ] **The recipe shows a complete, minimal example.** I can see the entire
      flow: define a tool, start the server, see it respond. Not just fragments.

- [ ] **I know how to test it locally.** The "HOW TO RUN" section tells me
      how to start the server and verify it works — with an actual command I
      can copy-paste.

- [ ] **Error messages in the MCP recipe help me debug.** If the server fails
      to start, the error message tells me what went wrong (port in use,
      missing config) — not just "server error."

- [ ] **I'm not scared off by complexity.** The recipe starts simple and builds
      up. It doesn't throw transport protocols, JSON-RPC, or stdio configuration
      at me in the first 10 lines.

---

## Error Messages Are Helpful

Check error handling patterns across all 12 recipes.

- [ ] **Error messages say what went wrong.** Not `console.error(err)` alone,
      but `console.error("Failed to connect to database:", err.message)`.

- [ ] **Error messages suggest what to do.** At least one error path per recipe
      includes a hint: "Check your DATABASE_URL environment variable" or
      "Verify the API endpoint is correct."

- [ ] **Errors don't expose internal details to end users.** Recipes that serve
      HTTP responses show user-safe messages (not stack traces) to the client,
      while logging details for the developer.

- [ ] **Python recipes use specific exception types.** Not bare `except:` but
      `except ConnectionError:` or `except ValueError:`.

- [ ] **TypeScript recipes handle promise rejections.** Async functions have
      try/catch or .catch() — no unhandled promise warnings.

---

## Overall Phase 3 Beginner Experience

Looking at everything together:

- [ ] **I could use these recipes with zero prior CopilotForge experience.**
      The cookbook stands on its own. I don't need to read FORGE.md or
      understand agents to use a recipe.

- [ ] **The recipes teach me something.** Each recipe isn't just boilerplate —
      it shows a pattern I can learn from (error handling strategy, auth flow,
      etc.).

- [ ] **Python and TypeScript recipes feel equally polished.** Python isn't
      an afterthought port of TypeScript. It uses Python idioms and patterns.

- [ ] **I can tell which recipe I need.** Between the README table and the
      header comments, I never grab the wrong recipe.

- [ ] **Nothing feels auto-generated or low-effort.** Comments are thoughtful,
      variable names are clear, error messages are specific.

---

## Checklist Metadata

| Field | Value |
|-------|-------|
| **Tester** | *(your name)* |
| **Date** | *(date of test)* |
| **Platform** | *(Windows / macOS / Linux)* |
| **Recipes present?** | ⬚ Yes / ⬚ No (run validator first) |
| **Phase 2 still working?** | ⬚ Yes / ⬚ No (run Phase 2 validator first) |
| **Overall verdict** | ⬚ Pass / ⬚ Fail — *(notes)* |
