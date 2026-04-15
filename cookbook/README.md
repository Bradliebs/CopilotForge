# 📖 CopilotForge Cookbook

> Copy-paste-ready code recipes for common CopilotForge tasks. Every recipe includes all imports, error handling, and clear comments — no "install this first" surprises.

---

## Recipes

| Recipe | Language | What It Does |
|--------|----------|--------------|
| [`session-example.ts`](./session-example.ts) | TypeScript | Basic session management — create sessions, send messages, handle timeouts, clean up |
| [`session-example.py`](./session-example.py) | Python | Same session pattern in Python |
| [`delegation-example.ts`](./delegation-example.ts) | TypeScript | Full delegation flow — how the Planner orchestrates specialist agents programmatically |
| [`skill-creation-example.ts`](./skill-creation-example.ts) | TypeScript | Create custom SKILL.md files programmatically from code |

---

## How to Use a Recipe

1. **Find the recipe** in the table above.
2. **Read the header comment** — it explains what the recipe does, when to use it, and prerequisites.
3. **Copy the file** into your project (or reference it directly).
4. **Search for `TODO`** markers — these are the places you need to plug in your actual SDK keys, endpoints, or logic.
5. **Run it** using the instructions in the header comment.

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
