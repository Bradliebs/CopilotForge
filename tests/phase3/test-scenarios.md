# CopilotForge Phase 3 — Test Scenarios

> Owned by **Tank** (Tester). Each scenario is specific enough to execute.
> Status: ⬚ = not tested, ✓ = passed, ✗ = failed

---

## A. Recipe Quality (12 recipes × 4 checks = 48 checks)

Every recipe in `cookbook/` must meet all four quality gates.

### Recipes Under Test

| # | File | Language |
|---|------|----------|
| 1 | `cookbook/error-handling.ts` | TypeScript |
| 2 | `cookbook/error-handling.py` | Python |
| 3 | `cookbook/mcp-server.ts` | TypeScript |
| 4 | `cookbook/mcp-server.py` | Python |
| 5 | `cookbook/api-client.ts` | TypeScript |
| 6 | `cookbook/api-client.py` | Python |
| 7 | `cookbook/auth-middleware.ts` | TypeScript |
| 8 | `cookbook/auth-middleware.py` | Python |
| 9 | `cookbook/db-query.ts` | TypeScript |
| 10 | `cookbook/db-query.py` | Python |
| 11 | `cookbook/route-handler.ts` | TypeScript |
| 12 | `cookbook/route-handler.py` | Python |

---

### RQ-01: Header Comment — All 4 Sections Present

**Rule:** Each recipe starts with a block comment (`/**` for TS, `"""` for Python) containing:
- `WHAT THIS DOES`
- `WHEN TO USE THIS`
- `HOW TO RUN`
- `PREREQUISITES`

**Per-recipe checks:**

- ⬚ `error-handling.ts` — has `/**` block with all 4 sections
- ⬚ `error-handling.py` — has `"""` block with all 4 sections
- ⬚ `mcp-server.ts` — has `/**` block with all 4 sections
- ⬚ `mcp-server.py` — has `"""` block with all 4 sections
- ⬚ `api-client.ts` — has `/**` block with all 4 sections
- ⬚ `api-client.py` — has `"""` block with all 4 sections
- ⬚ `auth-middleware.ts` — has `/**` block with all 4 sections
- ⬚ `auth-middleware.py` — has `"""` block with all 4 sections
- ⬚ `db-query.ts` — has `/**` block with all 4 sections
- ⬚ `db-query.py` — has `"""` block with all 4 sections
- ⬚ `route-handler.ts` — has `/**` block with all 4 sections
- ⬚ `route-handler.py` — has `"""` block with all 4 sections

---

### RQ-02: Imports Declared (No Missing Imports)

**Rule:** Every recipe must declare its imports at the top.
- `.ts` files must have at least one `import` statement
- `.py` files must have at least one `import` or `from ... import` statement

**Per-recipe checks:**

- ⬚ `error-handling.ts` — has `import` statements
- ⬚ `error-handling.py` — has `import` / `from` statements
- ⬚ `mcp-server.ts` — has `import` statements
- ⬚ `mcp-server.py` — has `import` / `from` statements
- ⬚ `api-client.ts` — has `import` statements
- ⬚ `api-client.py` — has `import` / `from` statements
- ⬚ `auth-middleware.ts` — has `import` statements
- ⬚ `auth-middleware.py` — has `import` / `from` statements
- ⬚ `db-query.ts` — has `import` statements
- ⬚ `db-query.py` — has `import` / `from` statements
- ⬚ `route-handler.ts` — has `import` statements
- ⬚ `route-handler.py` — has `import` / `from` statements

---

### RQ-03: Error Handling (No Bare Try/Catch, No Unhandled Promises)

**Rule:** Every recipe demonstrates proper error handling.
- `.ts` files must contain `catch` or `throw` keywords
- `.py` files must contain `except` or `raise` keywords

**Per-recipe checks:**

- ⬚ `error-handling.ts` — has `catch` or `throw`
- ⬚ `error-handling.py` — has `except` or `raise`
- ⬚ `mcp-server.ts` — has `catch` or `throw`
- ⬚ `mcp-server.py` — has `except` or `raise`
- ⬚ `api-client.ts` — has `catch` or `throw`
- ⬚ `api-client.py` — has `except` or `raise`
- ⬚ `auth-middleware.ts` — has `catch` or `throw`
- ⬚ `auth-middleware.py` — has `except` or `raise`
- ⬚ `db-query.ts` — has `catch` or `throw`
- ⬚ `db-query.py` — has `except` or `raise`
- ⬚ `route-handler.ts` — has `catch` or `throw`
- ⬚ `route-handler.py` — has `except` or `raise`

---

### RQ-04: TODO Markers for Integration Points

**Rule:** Every recipe has at least one `TODO` comment marking where the user needs to plug in their own values (API keys, endpoints, database URLs, etc.).

**Per-recipe checks:**

- ⬚ `error-handling.ts` — has at least one `TODO` marker
- ⬚ `error-handling.py` — has at least one `TODO` marker
- ⬚ `mcp-server.ts` — has at least one `TODO` marker
- ⬚ `mcp-server.py` — has at least one `TODO` marker
- ⬚ `api-client.ts` — has at least one `TODO` marker
- ⬚ `api-client.py` — has at least one `TODO` marker
- ⬚ `auth-middleware.ts` — has at least one `TODO` marker
- ⬚ `auth-middleware.py` — has at least one `TODO` marker
- ⬚ `db-query.ts` — has at least one `TODO` marker
- ⬚ `db-query.py` — has at least one `TODO` marker
- ⬚ `route-handler.ts` — has at least one `TODO` marker
- ⬚ `route-handler.py` — has at least one `TODO` marker

---

## B. Template Quality (12 templates × 3 checks = 36 checks)

Every template in `templates/cookbook/` must meet all three quality gates.

### Templates Under Test

| # | File |
|---|------|
| 1 | `templates/cookbook/error-handling.ts` |
| 2 | `templates/cookbook/error-handling.py` |
| 3 | `templates/cookbook/mcp-server.ts` |
| 4 | `templates/cookbook/mcp-server.py` |
| 5 | `templates/cookbook/api-client.ts` |
| 6 | `templates/cookbook/api-client.py` |
| 7 | `templates/cookbook/auth-middleware.ts` |
| 8 | `templates/cookbook/auth-middleware.py` |
| 9 | `templates/cookbook/db-query.ts` |
| 10 | `templates/cookbook/db-query.py` |
| 11 | `templates/cookbook/route-handler.ts` |
| 12 | `templates/cookbook/route-handler.py` |

---

### TQ-01: Has `{{placeholder}}` Syntax

**Rule:** Each template has at least one `{{placeholder}}` to be customized during scaffolding.

**Per-template checks:**

- ⬚ `templates/cookbook/error-handling.ts` — has `{{…}}`
- ⬚ `templates/cookbook/error-handling.py` — has `{{…}}`
- ⬚ `templates/cookbook/mcp-server.ts` — has `{{…}}`
- ⬚ `templates/cookbook/mcp-server.py` — has `{{…}}`
- ⬚ `templates/cookbook/api-client.ts` — has `{{…}}`
- ⬚ `templates/cookbook/api-client.py` — has `{{…}}`
- ⬚ `templates/cookbook/auth-middleware.ts` — has `{{…}}`
- ⬚ `templates/cookbook/auth-middleware.py` — has `{{…}}`
- ⬚ `templates/cookbook/db-query.ts` — has `{{…}}`
- ⬚ `templates/cookbook/db-query.py` — has `{{…}}`
- ⬚ `templates/cookbook/route-handler.ts` — has `{{…}}`
- ⬚ `templates/cookbook/route-handler.py` — has `{{…}}`

---

### TQ-02: No Hardcoded Example Values

**Rule:** Templates must not contain hardcoded values that should be placeholders. Specifically: no hardcoded port numbers (e.g. `3000`, `8080`), no hardcoded API URLs (e.g. `https://api.example.com`), no hardcoded database connection strings, no hardcoded secret keys that aren't clearly marked as `{{placeholder}}`.

**Per-template checks:**

- ⬚ `templates/cookbook/error-handling.ts` — no hardcoded values
- ⬚ `templates/cookbook/error-handling.py` — no hardcoded values
- ⬚ `templates/cookbook/mcp-server.ts` — no hardcoded values
- ⬚ `templates/cookbook/mcp-server.py` — no hardcoded values
- ⬚ `templates/cookbook/api-client.ts` — no hardcoded values
- ⬚ `templates/cookbook/api-client.py` — no hardcoded values
- ⬚ `templates/cookbook/auth-middleware.ts` — no hardcoded values
- ⬚ `templates/cookbook/auth-middleware.py` — no hardcoded values
- ⬚ `templates/cookbook/db-query.ts` — no hardcoded values
- ⬚ `templates/cookbook/db-query.py` — no hardcoded values
- ⬚ `templates/cookbook/route-handler.ts` — no hardcoded values
- ⬚ `templates/cookbook/route-handler.py` — no hardcoded values

---

### TQ-03: Structurally Matches Concrete Counterpart

**Rule:** Each template should have the same overall structure as its corresponding concrete recipe — same sections, same import patterns, same error handling shape — with specifics replaced by `{{placeholders}}`.

**Per-template checks:**

- ⬚ `templates/cookbook/error-handling.ts` — matches `cookbook/error-handling.ts`
- ⬚ `templates/cookbook/error-handling.py` — matches `cookbook/error-handling.py`
- ⬚ `templates/cookbook/mcp-server.ts` — matches `cookbook/mcp-server.ts`
- ⬚ `templates/cookbook/mcp-server.py` — matches `cookbook/mcp-server.py`
- ⬚ `templates/cookbook/api-client.ts` — matches `cookbook/api-client.ts`
- ⬚ `templates/cookbook/api-client.py` — matches `cookbook/api-client.py`
- ⬚ `templates/cookbook/auth-middleware.ts` — matches `cookbook/auth-middleware.ts`
- ⬚ `templates/cookbook/auth-middleware.py` — matches `cookbook/auth-middleware.py`
- ⬚ `templates/cookbook/db-query.ts` — matches `cookbook/db-query.ts`
- ⬚ `templates/cookbook/db-query.py` — matches `cookbook/db-query.py`
- ⬚ `templates/cookbook/route-handler.ts` — matches `cookbook/route-handler.ts`
- ⬚ `templates/cookbook/route-handler.py` — matches `cookbook/route-handler.py`

---

## C. Cookbook Structure (6 checks)

### CS-01: README Lists All Recipes

**Rule:** `cookbook/README.md` must list every recipe — both existing (Phase 1-2) and new (Phase 3).

**Validation:**
- ⬚ README table includes `session-example.ts`
- ⬚ README table includes `session-example.py`
- ⬚ README table includes `delegation-example.ts`
- ⬚ README table includes `skill-creation-example.ts`
- ⬚ README table includes all 12 new recipes (error-handling, mcp-server, api-client, auth-middleware, db-query, route-handler — .ts and .py each)

**Status:** ⬚

---

### CS-02: Every File in `cookbook/` Listed in README

**Rule:** Scan `cookbook/` for all `.ts`, `.py`, `.go`, `.cs` files. Each one must appear in `cookbook/README.md`.

**Status:** ⬚

---

### CS-03: Every Recipe Has a Template Counterpart

**Rule:** Every new recipe file in `cookbook/` has a corresponding template file in `templates/cookbook/` with the same filename. (Pre-existing Phase 1-2 recipes that already have templates are fine; those without are grandfathered in.)

**Status:** ⬚

---

### CS-04: FORGE.md Has Cookbook Markers

**Rule:** `templates/FORGE.md` contains both:
- `<!-- forge:cookbook-start -->`
- `<!-- forge:cookbook-end -->`

**Status:** ⬚

---

### CS-05: FORGE.md Cookbook Section Lists Categories

**Rule:** The section between the cookbook markers lists recipe categories (e.g., Error Handling, MCP Server, API Client, Auth Middleware, Database Queries, Route Handlers).

**Status:** ⬚

---

### CS-06: Stack Detection Spec Exists

**Rule:** `templates/utils/stack-detection.md` exists and is non-empty.

**Status:** ⬚

---

## D. Stack Detection (8 checks)

### SD-01: Covers package.json Parsing

**Rule:** `templates/utils/stack-detection.md` mentions `package.json` and describes how to extract stack info from it (e.g., reading `dependencies`, `devDependencies`).

**Status:** ⬚

---

### SD-02: Covers requirements.txt / pyproject.toml Parsing

**Rule:** The spec mentions both `requirements.txt` and `pyproject.toml` as Python stack detection sources.

**Status:** ⬚

---

### SD-03: Covers go.mod Parsing

**Rule:** The spec mentions `go.mod` as a Go stack detection source.

**Status:** ⬚

---

### SD-04: Covers .csproj Parsing

**Rule:** The spec mentions `.csproj` as a C# / .NET stack detection source.

**Status:** ⬚

---

### SD-05: Defines Fallback to Wizard Answer

**Rule:** The spec describes what happens when no manifest file is found — falls back to the wizard's stack answer.

**Status:** ⬚

---

### SD-06: Defines Output Format

**Rule:** The spec defines a structured output format (e.g., a JSON schema, a typed interface, or a clearly defined key-value set) for the detected stack info.

**Status:** ⬚

---

### SD-07: cookbook-writer Agent References Stack Detection

**Rule:** `.copilot/agents/cookbook-writer.md` references `stack-detection` or `templates/utils/stack-detection.md`.

**Status:** ⬚

---

### SD-08: Stack Mapping Table Covers All Recipe Categories

**Rule:** The cookbook-writer agent's stack-matching table covers all 6 recipe categories: error-handling, mcp-server, api-client, auth-middleware, db-query, route-handler.

**Status:** ⬚

---

## E. Jargon Leak (3 checks — carried forward from Phase 2)

### JL-01: No Banned Terms in Recipes

**Rule:** No recipe in `cookbook/` mentions "cookbook-writer", "skill-writer", "agent-writer", "memory-writer", or "specialist" outside of HTML comments.

**Validation:**
- ⬚ Scan all `.ts` and `.py` files in `cookbook/` — none contain banned terms (excluding `<!-- ... -->` blocks)

**Status:** ⬚

---

### JL-02: No Banned Terms in Templates

**Rule:** No template in `templates/cookbook/` mentions the banned terms outside of HTML comments.

**Status:** ⬚

---

### JL-03: cookbook/README.md Is Jargon-Free

**Rule:** `cookbook/README.md` does not mention "cookbook-writer", "skill-writer", "agent-writer", "memory-writer", or "specialist" outside of HTML comments.

**Status:** ⬚

---

## F. Beginner Experience (5 checks)

### BE-01: README Explains Usage in Plain English

**Rule:** `cookbook/README.md` has a "How to Use" section (or equivalent) that explains the steps without technical jargon. A beginner who has never used CopilotForge should understand what to do.

**Status:** ⬚

---

### BE-02: Header Comments Understandable Without Prior Knowledge

**Rule:** For each recipe, read the header comment in isolation. It should make sense to someone who has never seen the repo before. The "WHAT THIS DOES" section should be a plain-English description, not a list of function names.

**Per-recipe spot check (test at least 4):**
- ⬚ `error-handling.ts` header is clear standalone
- ⬚ `mcp-server.py` header is clear standalone
- ⬚ `api-client.ts` header is clear standalone
- ⬚ `db-query.py` header is clear standalone

**Status:** ⬚

---

### BE-03: No Unexplained Acronyms

**Rule:** If "MCP" appears in a recipe, it must be defined on first use (e.g., "MCP (Model Context Protocol)"). Other acronyms (HTTP, API, SQL, JWT) are common enough to pass without explanation, but anything domain-specific to CopilotForge or less common must be explained.

**Status:** ⬚

---

### BE-04: TODO Markers Have Clear Instructions

**Rule:** Every `TODO` comment includes actionable text — not just `// TODO` or `# TODO: implement`. Must describe what to replace and why (e.g., `// TODO: Replace with your API key from https://...`).

**Per-recipe spot check (test at least 4):**
- ⬚ `auth-middleware.ts` TODOs have clear instructions
- ⬚ `db-query.py` TODOs have clear instructions
- ⬚ `mcp-server.ts` TODOs have clear instructions
- ⬚ `api-client.py` TODOs have clear instructions

**Status:** ⬚

---

### BE-05: Error Handling Includes User-Friendly Messages

**Rule:** Error handling patterns in recipes include human-readable error messages (not just `console.error(err)` or `raise`). At least one error path per recipe should show a user-friendly message that a beginner could understand.

**Status:** ⬚

---

## Summary

| Category | Check Count | Status |
|----------|------------|--------|
| A. Recipe Quality | 48 | ⬚ |
| B. Template Quality | 36 | ⬚ |
| C. Cookbook Structure | 6 | ⬚ |
| D. Stack Detection | 8 | ⬚ |
| E. Jargon Leak | 3 | ⬚ |
| F. Beginner Experience | 5 | ⬚ |
| **Total** | **106** | ⬚ |

---

## Metadata

| Field | Value |
|-------|-------|
| **Owner** | Tank (Tester) |
| **Phase** | 3 — Cookbook Layer |
| **Created** | Phase 3 kickoff |
| **Validators** | `tests/phase3/validate-cookbook.ps1`, `tests/phase3/validate-cookbook.sh` |
| **Automated checks** | 9 categories in validator scripts (see validator section headers) |
| **Manual checks** | Beginner experience (see `tests/phase3/beginner-checklist.md`) |
