# Phase 3 Architecture Contract — Cookbook Layer

> **Author:** Morpheus (Lead Architect)
> **Date:** 2026-04-16
> **Status:** Draft — Pending Team Consensus
> **Depends on:** Phase 2 (Wizard + Delegation) — Complete

---

## Overview

Phase 3 delivers the **Cookbook Layer** — the full catalog of pre-built, copy-paste-runnable SDK recipe templates that the Planner slots into `cookbook/` based on the user's stack. This is the third pillar called out in the original spec:

> "Pre-built SDK recipe templates (session management, error handling, MCP integration) that the Planner slots into cookbook/ based on your stack."

Phase 3 also delivers the **FORGE.md Live Config Surface**, deferred from Phase 2 — letting users add, remove, and customize recipes by editing FORGE.md directly.

### What Changes

| Component | Phase 2 (Today) | Phase 3 (Target) |
|---|---|---|
| Recipe catalog | 4 recipes (session × 2, delegation, skill-creation) | 21+ recipes across 7 categories |
| Template catalog | 2 templates (session × 2) | 21+ templates — one per concrete recipe |
| Stack detection | Substring match on `stack` string | File-based detection + wizard fallback |
| FORGE.md cookbook section | Static, regenerated on re-run | Editable with merge markers |
| cookbook-writer agent | Basic stack matching table | Expanded catalog, detection logic, FORGE.md integration |
| Verbosity levels | Defined but only 1 level implemented | All 3 levels (beginner/intermediate/advanced) functional |

---

## 1. Recipe Catalog Design

### Naming Convention

All recipe files follow: `cookbook/{category}-{variant}.{ext}`

- `{category}` — the recipe category slug (e.g., `session`, `error-handling`, `mcp`)
- `{variant}` — optional differentiator when a category has multiple recipes for one stack (e.g., `mcp-tool`, `mcp-resource`)
- `{ext}` — the language extension (`.ts`, `.py`, `.go`, `.cs`, `.tsx`, `.vue`)

Templates follow the same names under `templates/cookbook/`.

### 1.1 Session Management

**Already exists.** Phase 3 adds template versions for all existing concrete recipes and ensures parity.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| Session (TS) | `session-example.ts` | TypeScript / JavaScript | Multi-turn session lifecycle, timeout, cleanup |
| Session (PY) | `session-example.py` | Python | Same pattern, Python-idiomatic |

**Phase 3 work:** Create templates for the two session recipes (templates exist today but need audit for `{{placeholder}}` completeness). No new recipes in this category.

### 1.2 Error Handling Patterns

**New category.** Every stack gets a recipe showing structured error handling: custom error classes, error boundaries, retry logic, and graceful degradation.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| Error Handling (TS) | `error-handling.ts` | TypeScript / JavaScript | Custom error classes, typed error responses, retry with backoff, error boundary pattern |
| Error Handling (PY) | `error-handling.py` | Python | Custom exceptions, context managers for cleanup, retry decorator, structured error logging |
| Error Handling (Go) | `error-handling.go` | Go | Sentinel errors, error wrapping (`%w`), retry helper, structured error returns |
| Error Handling (C#) | `error-handling.cs` | C# | Custom exception hierarchy, Result pattern, Polly-style retry, `IDisposable` cleanup |

### 1.3 MCP Integration

**New category.** The original spec explicitly calls this out. Recipes show how to build MCP servers (tools and resources) and MCP clients that connect to them.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| MCP Tool Server (TS) | `mcp-tool-server.ts` | TypeScript / JavaScript | Defining an MCP tool, handling tool calls, input validation, returning structured results |
| MCP Resource Server (TS) | `mcp-resource-server.ts` | TypeScript / JavaScript | Defining MCP resources, URI templates, resource reads, subscriptions |
| MCP Client (TS) | `mcp-client.ts` | TypeScript / JavaScript | Connecting to an MCP server, discovering tools, calling tools, handling errors |
| MCP Tool Server (PY) | `mcp-tool-server.py` | Python | Same MCP tool server pattern, Python SDK |
| MCP Client (PY) | `mcp-client.py` | Python | Same MCP client pattern, Python SDK |

**Design note:** MCP recipes are TS/PY only in Phase 3. Go and C# MCP SDKs are less mature; we defer those to Phase 4 when SDK stability improves.

### 1.4 API Client Patterns

**New category.** Shows how to build robust API clients with auth, retry, timeout, and typed responses.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| API Client (TS) | `api-client.ts` | TypeScript / JavaScript | Fetch wrapper with auth headers, retry, timeout, typed JSON responses, error mapping |
| API Client (PY) | `api-client.py` | Python | `httpx` / `requests` wrapper with auth, retry, timeout, response models |
| API Client (Go) | `api-client.go` | Go | `net/http` wrapper with context, retry, timeout, JSON decode, structured errors |
| API Client (C#) | `api-client.cs` | C# | `HttpClient` wrapper with `IHttpClientFactory`, retry (Polly), typed responses, cancellation |

### 1.5 Database / ORM Patterns

**New category.** Stack-specific recipes for the detected ORM or database library.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| Prisma Queries (TS) | `db-prisma.ts` | Prisma (detected in `package.json`) | CRUD operations, transactions, error handling, relation queries, pagination |
| SQLAlchemy (PY) | `db-sqlalchemy.py` | SQLAlchemy (detected in `requirements.txt` / `pyproject.toml`) | Session management, CRUD, transactions, relationship loading, migration patterns |
| GORM (Go) | `db-gorm.go` | GORM (detected in `go.mod`) | Model definition, CRUD, transactions, scopes, error handling |
| EF Core (C#) | `db-efcore.cs` | Entity Framework Core (detected in `.csproj`) | DbContext setup, CRUD, transactions, migrations, query patterns |
| Generic SQL (TS) | `db-query.ts` | TypeScript without Prisma | Raw query patterns, connection pooling, parameterized queries, transaction wrapper |
| Generic SQL (PY) | `db-query.py` | Python without SQLAlchemy | `sqlite3` / `psycopg` patterns, connection management, parameterized queries |

**Selection logic:** If a specific ORM is detected, generate the ORM-specific recipe. If only a generic database driver is detected (or the stack says "PostgreSQL" without naming an ORM), generate the generic SQL recipe. Never generate both for the same language.

### 1.6 Component Scaffolds

**New category.** Frontend framework component templates with proper typing, props, state, and lifecycle patterns.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| React Component (TSX) | `component-react.tsx` | React / Next.js | Typed props interface, `useState`/`useEffect`, error boundary, loading state |
| Vue Component (Vue) | `component-vue.vue` | Vue / Nuxt | Vue 3 SFC with Composition API, typed props, `ref`/`computed`, emit, lifecycle hooks |
| Svelte Component | `component-svelte.svelte` | Svelte / SvelteKit | Typed props, reactive declarations, lifecycle, slot patterns |

**Design note:** Angular is deferred to Phase 4 — its component model (decorators, modules, DI) needs a significantly more complex recipe that warrants its own design pass.

### 1.7 Auth Patterns

**New category.** Shows how to implement authentication middleware or guards for the detected framework.

| Recipe | File | Stack trigger | Demonstrates |
|---|---|---|---|
| Auth Middleware (TS) | `auth-middleware.ts` | Express / Fastify | JWT verification middleware, role-based guards, token refresh pattern, error responses |
| Auth (Next.js) | `auth-nextjs.ts` | Next.js | Server-side session checks, middleware-based auth, protected API routes |
| Auth Middleware (PY) | `auth-middleware.py` | FastAPI / Flask / Django | Dependency injection auth (FastAPI), decorator auth (Flask/Django), JWT verification |
| Auth Middleware (Go) | `auth-middleware.go` | Go (any HTTP framework) | HTTP middleware for JWT, context-based user propagation, role checks |
| Auth Middleware (C#) | `auth-middleware.cs` | ASP.NET Core | `[Authorize]` attribute patterns, JWT bearer setup, policy-based auth, claims |

### Catalog Summary

| Category | Recipes | Languages |
|---|---|---|
| Session Management | 2 | TS, PY |
| Error Handling | 4 | TS, PY, Go, C# |
| MCP Integration | 5 | TS, PY |
| API Client | 4 | TS, PY, Go, C# |
| Database / ORM | 6 | TS, PY, Go, C# |
| Component Scaffolds | 3 | TSX, Vue, Svelte |
| Auth Patterns | 5 | TS, PY, Go, C# |
| **Total** | **29** | **6 extensions** |

### Recipe Header Template

Every recipe — concrete and template — starts with this header:

```
/**
 * {filename} — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   {1-2 sentence description of what the recipe demonstrates}
 *
 * WHEN TO USE THIS:
 *   {Scenario that makes this recipe relevant}
 *
 * HOW TO RUN:
 *   1. {install step}
 *   2. {config step}
 *   3. {run command}
 *
 * PREREQUISITES:
 *   - {runtime version}
 *   - {framework version, if applicable}
 *   - {any API keys or services needed}
 */
```

Python equivalent uses `"""..."""` docstring. Go uses `// ...` line comments. C# uses `/// ...` XML doc or `// ...` block.

---

## 2. Stack Detection Logic

### Detection Algorithm

The cookbook-writer determines which recipes to generate by inspecting the target repository's files **before** consulting the wizard's `stack` answer. File-based detection is authoritative; the wizard answer is the fallback.

```
1. SCAN target repo for manifest files:
   a. package.json          → parse "dependencies" + "devDependencies"
   b. requirements.txt      → parse package names
   c. pyproject.toml        → parse [project.dependencies] + [tool.poetry.dependencies]
   d. go.mod                → parse "require" block
   e. *.csproj              → parse <PackageReference> elements

2. BUILD a normalized set of detected technologies:
   For each manifest, extract framework/library names and normalize:
   - "express" in package.json deps       → { stack: "express", lang: "ts" }
   - "react" in package.json deps         → { stack: "react", lang: "tsx" }
   - "prisma" in package.json deps        → { stack: "prisma", lang: "ts" }
   - "fastapi" in requirements.txt        → { stack: "fastapi", lang: "py" }
   - "sqlalchemy" in requirements.txt     → { stack: "sqlalchemy", lang: "py" }
   - "github.com/gin-gonic/gin" in go.mod → { stack: "gin", lang: "go" }
   - "gorm.io/gorm" in go.mod            → { stack: "gorm", lang: "go" }
   - "Microsoft.EntityFrameworkCore" in .csproj → { stack: "efcore", lang: "cs" }
   (Full mapping table below.)

3. IF no manifest files found:
   a. Parse the wizard "stack" answer as a comma-separated string.
   b. Normalize each token against the same mapping table.
   c. Mark detection source as "wizard" (lower confidence).

4. DETERMINE primary language:
   a. If only one language detected → that's primary.
   b. If multiple languages → the one with the most framework matches is primary.
   c. If tie → prefer the language that appeared first in the wizard answer.

5. SELECT recipes:
   a. Always include: error-handling.{primary_ext}, api-client.{primary_ext}
   b. Include MCP recipes if primary language is TS or PY.
   c. Include DB recipe if an ORM or database is detected.
   d. Include component recipe if a frontend framework is detected.
   e. Include auth recipe if a server framework is detected.
   f. Include session recipe for the primary language.
   g. Always include cookbook/README.md.

6. FILTER against existing files:
   a. If cookbook/{recipe} exists in existing_files → skip with "skipped: true".
   b. If user removed a recipe from FORGE.md cookbook section → do not re-generate.
```

### Complete Stack → Recipe Mapping Table

This table is the authoritative reference. The cookbook-writer agent will embed this table directly.

| Detection Source | Lookup Key | Recipes Generated |
|---|---|---|
| `package.json` has `typescript` or `.ts` files exist | TypeScript detected | `error-handling.ts`, `api-client.ts`, `session-example.ts` |
| `package.json` has `express` | Express detected | `auth-middleware.ts` (Express variant) |
| `package.json` has `fastify` | Fastify detected | `auth-middleware.ts` (Fastify variant) |
| `package.json` has `next` | Next.js detected | `auth-nextjs.ts`, `component-react.tsx` |
| `package.json` has `react` (without Next) | React detected | `component-react.tsx` |
| `package.json` has `vue` | Vue detected | `component-vue.vue` |
| `package.json` has `svelte` | Svelte detected | `component-svelte.svelte` |
| `package.json` has `prisma` or `@prisma/client` | Prisma detected | `db-prisma.ts` |
| `package.json` has `pg`, `mysql2`, `better-sqlite3` (no ORM) | Generic DB (TS) | `db-query.ts` |
| `package.json` has `@modelcontextprotocol/sdk` | MCP SDK (TS) detected | `mcp-tool-server.ts`, `mcp-resource-server.ts`, `mcp-client.ts` |
| `requirements.txt` / `pyproject.toml` has `fastapi` | FastAPI detected | `auth-middleware.py` (FastAPI variant) |
| `requirements.txt` / `pyproject.toml` has `flask` | Flask detected | `auth-middleware.py` (Flask variant) |
| `requirements.txt` / `pyproject.toml` has `django` | Django detected | `auth-middleware.py` (Django variant) |
| `requirements.txt` / `pyproject.toml` has `sqlalchemy` | SQLAlchemy detected | `db-sqlalchemy.py` |
| `requirements.txt` / `pyproject.toml` has `psycopg` or `sqlite3` usage (no ORM) | Generic DB (PY) | `db-query.py` |
| `requirements.txt` / `pyproject.toml` has `mcp` | MCP SDK (PY) detected | `mcp-tool-server.py`, `mcp-client.py` |
| `go.mod` exists | Go detected | `error-handling.go`, `api-client.go`, `session-example.go`* |
| `go.mod` has `gorm.io/gorm` | GORM detected | `db-gorm.go` |
| `go.mod` has `gin-gonic`, `echo`, `chi`, or `net/http` usage | Go HTTP server detected | `auth-middleware.go` |
| `.csproj` exists | C# detected | `error-handling.cs`, `api-client.cs` |
| `.csproj` has `Microsoft.EntityFrameworkCore` | EF Core detected | `db-efcore.cs` |
| `.csproj` has `Microsoft.AspNetCore` | ASP.NET Core detected | `auth-middleware.cs` |

*\* `session-example.go` is a Phase 3 stretch goal — only if time permits. Go session recipe is lower priority because Go agents are less common.*

### MCP Auto-Detection

MCP recipes are **opt-in by detection**:
- If `@modelcontextprotocol/sdk` is in `package.json` → generate all 3 TS MCP recipes.
- If `mcp` is in Python dependencies → generate both PY MCP recipes.
- If neither is detected but the wizard answer mentions "MCP" → generate MCP recipes for the primary language.
- If MCP is not mentioned anywhere → do not generate MCP recipes (they're specialized, don't push them on beginners).

### Detection Confidence

| Source | Confidence | Behavior |
|---|---|---|
| Manifest file (package.json, etc.) | **High** | Generate recipes without confirmation |
| Wizard answer string | **Medium** | Generate recipes, note source in README ("Based on your description…") |
| No detection at all | **Low** | Generate only `error-handling.{ext}` and `api-client.{ext}` for the wizard's stated primary language |

---

## 3. Template vs. Concrete Recipe Strategy

### Principle

Every recipe exists in two forms:

| Location | Purpose | Syntax | Audience |
|---|---|---|---|
| `cookbook/{recipe}.{ext}` | Concrete, runnable example for the CopilotForge repo itself | Real code, no placeholders | CopilotForge contributors and documentation readers |
| `templates/cookbook/{recipe}.{ext}` | Scaffolding template used by cookbook-writer to generate user recipes | `{{placeholder}}` syntax | The cookbook-writer agent (internal) |

**Rule: Every template MUST have a concrete counterpart. Every concrete recipe MUST have a template counterpart.**

### Placeholder Conventions

Templates use these placeholders (and only these):

| Placeholder | Replaced With | Example |
|---|---|---|
| `{{project_name}}` | The user's project name (slug form) | `my-api` |
| `{{project_description}}` | The user's project description | `A REST API for task management` |
| `{{primary_language}}` | Detected primary language | `TypeScript` |
| `{{framework}}` | Detected framework name | `Express` |
| `{{api_base_url}}` | Placeholder API URL | `https://api.example.com` |
| `{{model_name}}` | Placeholder model/entity name | `User` |
| `{{date}}` | Scaffolding date (ISO format) | `2026-04-16` |
| `{{skill_level}}` | beginner / intermediate / advanced | `intermediate` |

### Concrete ↔ Template Parity Checklist

During Phase 3 implementation, the following must be true for every recipe:

1. `cookbook/{name}.{ext}` exists and passes lint for its language.
2. `templates/cookbook/{name}.{ext}` exists and is identical to the concrete version **except** for `{{placeholder}}` substitutions in project-specific values.
3. Both files share the same header comment structure.
4. Both files are listed in `cookbook/README.md` (concrete) or documented in the cookbook-writer's recipe table (template).

### Existing File Audit (Phase 3 Entry)

| Concrete (`cookbook/`) | Template (`templates/cookbook/`) | Status |
|---|---|---|
| `session-example.ts` | `session-example.ts` | ✅ Exists — audit for placeholder completeness |
| `session-example.py` | `session-example.py` | ✅ Exists — audit for placeholder completeness |
| `delegation-example.ts` | *(missing)* | ⚠️ Create template or mark as CopilotForge-internal-only |
| `skill-creation-example.ts` | *(missing)* | ⚠️ Create template or mark as CopilotForge-internal-only |

**Decision:** `delegation-example.ts` and `skill-creation-example.ts` are CopilotForge-internal recipes that demonstrate the framework itself. They do NOT get templates because they are not scaffolded into user repos. They remain in `cookbook/` as documentation for contributors. The `cookbook/README.md` will mark them as "CopilotForge Examples" in a separate section from the user-facing recipe table.

---

## 4. FORGE.md Live Config Surface

### Problem

Today, FORGE.md is regenerated on each run. Users can't add or remove cookbook entries without risk of overwrite. Phase 2 deferred section-level merge to Phase 3 (see `decisions.md`, item 12).

### Solution: Marker-Based Section Merge

FORGE.md's cookbook section uses HTML comment markers to separate generated content from user content.

#### FORGE.md Cookbook Section Format

```markdown
## 📖 Cookbook Recipes

<!-- forge:cookbook:start -->
| Recipe | File | Description |
|---|---|---|
| Session Management | `cookbook/session-example.ts` | Multi-turn session lifecycle |
| Error Handling | `cookbook/error-handling.ts` | Structured error patterns with retry |
| API Client | `cookbook/api-client.ts` | HTTP client with auth and retry |
<!-- forge:cookbook:end -->

<!-- forge:cookbook:user:start -->
<!-- Add your own recipes here. This section is preserved on re-runs. -->
| My Custom Recipe | `cookbook/my-recipe.ts` | My team's custom pattern |
<!-- forge:cookbook:user:end -->
```

#### Merge Algorithm

On re-run, the Planner (via cookbook-writer) executes:

```
1. READ FORGE.md
2. LOCATE <!-- forge:cookbook:start --> and <!-- forge:cookbook:end --> markers
3. PARSE the generated recipe table between markers
4. DIFF: compare generated table against what cookbook-writer would generate now
   a. New recipes (not in table) → ADD rows
   b. Existing recipes (in table and in catalog) → PRESERVE (do not update description — user may have edited it)
   c. Recipes in table but NOT in current catalog → PRESERVE (user may have added them manually)
   d. Recipes REMOVED by user (were in previous generation, absent now) → DO NOT re-add
5. REPLACE only the content between forge:cookbook:start and forge:cookbook:end
6. PRESERVE everything between forge:cookbook:user:start and forge:cookbook:user:end untouched
7. PRESERVE all other FORGE.md sections untouched
```

#### Removal Detection

How does the cookbook-writer know a user deliberately removed a recipe vs. it never being generated?

```
1. FORGE.md contains a hidden metadata comment (not rendered in preview):
   <!-- forge:cookbook:manifest:["session-example.ts","error-handling.ts","api-client.ts"] -->

2. On re-run:
   a. Parse the manifest comment → these are recipes that WERE generated.
   b. Parse the current table → these are recipes that EXIST now.
   c. If a recipe is in the manifest but NOT in the table → user removed it. Do not re-add.
   d. If a recipe is NOT in the manifest → it was never generated. Safe to add if the catalog says so.

3. After generation, UPDATE the manifest comment to reflect the new generated set.
```

#### cookbook-writer Reads FORGE.md

The cookbook-writer receives `existing_files` from the Planner (Phase 2 contract). Phase 3 extends this:

**New input field for cookbook-writer:**
```yaml
forge_md_cookbook_manifest: string[]   # Parsed from FORGE.md manifest comment
forge_md_cookbook_current: string[]    # Recipe filenames currently in the FORGE.md table
```

The Planner is responsible for parsing FORGE.md and passing these two lists. The cookbook-writer uses them in its skip logic:
- If recipe is in `existing_files` → skip (file exists on disk).
- If recipe is in `forge_md_cookbook_manifest` but NOT in `forge_md_cookbook_current` → skip (user removed it).
- Otherwise → generate.

---

## 5. cookbook-writer Agent Updates

### Changes Required

The `.copilot/agents/cookbook-writer.md` agent definition needs these updates:

#### 5.1 Expanded Recipe Selection Table

Replace the current 10-row table with the full 29-recipe catalog from Section 1. The table format stays the same but grows significantly:

```markdown
| Stack includes | Recipe file | Recipe content |
|---|---|---|
| TypeScript / JavaScript | `cookbook/error-handling.ts` | Custom error classes, typed errors, retry with backoff |
| TypeScript / JavaScript | `cookbook/api-client.ts` | Fetch wrapper with auth, retry, timeout, typed responses |
| TypeScript + MCP SDK | `cookbook/mcp-tool-server.ts` | MCP tool definition, call handling, validation |
| ... (full table from Section 1) |
```

#### 5.2 Stack Detection Instructions

Add a new section: **### Stack Detection**

```markdown
### Stack Detection

Before selecting recipes, detect the project's stack from its files:

1. Check for `package.json` → read dependencies for framework names.
2. Check for `requirements.txt` or `pyproject.toml` → read for Python packages.
3. Check for `go.mod` → read require block for Go packages.
4. Check for `*.csproj` → read PackageReference elements for .NET packages.
5. If no manifest files exist, use the `stack` string from wizard answers.
6. The detection result determines which rows in the Recipe Selection table are activated.
```

#### 5.3 FORGE.md Integration

Add a new section: **### FORGE.md Integration**

```markdown
### FORGE.md Integration

You receive two additional inputs from the Planner:
- `forge_md_cookbook_manifest` — recipes that were previously generated (from FORGE.md manifest comment).
- `forge_md_cookbook_current` — recipes currently listed in the FORGE.md table.

Skip logic (in order):
1. If the target file exists on disk → skip (file preserved).
2. If the recipe is in the manifest but NOT in the current table → skip (user removed it).
3. Otherwise → generate the recipe.

After generating recipes, return the updated manifest list in your output so the Planner can update FORGE.md.
```

#### 5.4 New Output Fields

Extend the output contract:

```yaml
recipes-created:
  - name: string
    path: string
    language: string
    category: string         # NEW — e.g., "error-handling", "mcp", "auth"
    description: string
    skipped: boolean
    skip_reason: string      # NEW — "file_exists" | "user_removed" | null
updated_manifest: string[]   # NEW — list of all recipe filenames now generated
detection_source: string     # NEW — "manifest" | "wizard" | "none"
detected_stack: object       # NEW — { lang: string, frameworks: string[], orms: string[] }
```

#### 5.5 Verbosity Implementation

The verbosity section already defines three levels. Phase 3 makes this operational:

- The cookbook-writer MUST check `skill_level` for every recipe it generates.
- Each template in `templates/cookbook/` contains all three verbosity variants in conditional blocks.
- The cookbook-writer selects the appropriate variant when rendering.

**Template conditional syntax:**

```
{{#if skill_level == "beginner"}}
// WHY: This retry logic prevents transient network errors from crashing your app.
// It waits progressively longer between attempts (exponential backoff).
{{/if}}
{{#if skill_level == "intermediate"}}
// Exponential backoff retry.
{{/if}}
{{#if skill_level == "advanced"}}
{{/if}}
```

**Implementation note:** The cookbook-writer doesn't execute conditionals programmatically — it reads the template and includes only the comments matching the user's skill level. The `{{#if}}` / `{{/if}}` markers are rendering instructions for the agent, not a template engine.

---

## 6. Phase Boundary

### Phase 3 Delivers

| Deliverable | Description |
|---|---|
| 29 concrete recipes | All recipes from the catalog (Section 1), runnable in `cookbook/` |
| 23 template recipes | Templates for all user-scaffolded recipes (excludes CopilotForge-internal recipes) |
| Stack detection logic | File-based detection with wizard fallback (Section 2) |
| FORGE.md live config | Marker-based merge with manifest tracking (Section 4) |
| Updated cookbook-writer | Expanded catalog, detection, FORGE.md integration (Section 5) |
| Updated cookbook/README.md | Full catalog index with category sections |
| Verbosity implementation | All 3 levels functional across all recipes |
| Template ↔ Concrete parity check | Automated validator confirming every template has a concrete counterpart |
| Updated delegation-protocol.md | Reflects new cookbook-writer inputs/outputs |
| 40+ test scenarios | Per Tank's Phase 2 pattern, extended for Phase 3 |

### Deferred to Phase 4

| Item | Rationale |
|---|---|
| Angular component recipes | Complex component model (decorators, modules, DI) needs its own design pass |
| Go and C# MCP recipes | MCP SDKs for Go/C# not yet stable enough for "run as-is" recipes |
| Plugin system for custom recipe categories | Users can add individual recipes in Phase 3, but custom categories (with auto-detection rules) are Phase 4 |
| Memory iteration across sessions | Orthogonal to cookbook; stays on Phase 4 track |
| User-defined skill types in wizard | No cookbook dependency |
| CI/CD integration | Recipes are static files; CI integration for recipe validation is Phase 4 |
| Multi-repo scaffolding | Phase 4 scope per original plan |
| Recipe versioning / changelogs | If a recipe template changes between CopilotForge versions, how do users get updates? Deferred — Phase 3 re-runs just skip existing files. Phase 4 may introduce a "recipe update" flow. |
| `session-example.go` | Stretch goal for Phase 3; if not delivered, moves to Phase 4 |
| Strict mode validator | Tank recommended (Phase 2 decisions) — validates scaffolded output has no `{{placeholder}}` remnants. Moves to Phase 3 testing if feasible, otherwise Phase 4. |

### Phase 3 Exit Criteria

Phase 3 is complete when:

1. All 29 concrete recipes exist in `cookbook/` and pass language-specific lint.
2. All 23 template recipes exist in `templates/cookbook/` and contain valid `{{placeholder}}` syntax.
3. The cookbook-writer agent successfully generates the correct recipe set for these stacks: TS+Express+Prisma, Python+FastAPI+SQLAlchemy, Go+GORM, C#+ASP.NET+EF Core.
4. FORGE.md merge preserves user edits and respects removal intent across re-runs.
5. All 3 verbosity levels produce visually distinct output (beginner has `// WHY:` comments, advanced has none).
6. No jargon leaks — user-facing files never mention "cookbook-writer", "specialist", or internal agent names.
7. Tank's test suite passes all Phase 3 scenarios.

---

## 7. Decisions

### Decision 3.1: File-Based Stack Detection Over Wizard-Only

**Rationale:** The wizard answer is a free-text string that's hard to parse reliably ("I use React with TypeScript and Prisma" vs. "TS, React, Prisma"). Manifest files are structured and unambiguous. File-based detection also works for re-runs where the wizard doesn't run again.

**Trade-off:** Adds complexity (must parse 5 different manifest formats). Worth it because wrong recipe selection frustrates users more than a slightly slower detection step.

### Decision 3.2: MCP Recipes Are Detection-Gated, Not Default

**Rationale:** MCP is a specialized protocol. Beginners who asked for "a React app" shouldn't get MCP recipes they don't understand. Only generate MCP recipes when the MCP SDK is detected in dependencies or the wizard answer explicitly mentions MCP.

**Trade-off:** Power users who want MCP but haven't installed the SDK yet won't get recipes automatically. Mitigation: FORGE.md's user section lets them add recipes manually, and the cookbook/README.md documents all available recipes.

### Decision 3.3: ORM-Specific Beats Generic — Never Both

**Rationale:** Generating both `db-prisma.ts` and `db-query.ts` for a Prisma project confuses beginners ("which one do I use?"). One recipe per category per language. If an ORM is detected, the generic version is suppressed.

**Trade-off:** Users who use raw SQL alongside their ORM don't get the generic recipe. Mitigation: they can add it via FORGE.md's user section.

### Decision 3.4: FORGE.md Manifest Comment for Removal Tracking

**Rationale:** Without a manifest, we can't distinguish "user removed this recipe" from "this recipe was never generated." The manifest comment is invisible in rendered markdown but machine-readable for the merge algorithm.

**Trade-off:** Adds a hidden comment to FORGE.md that could confuse users who read the raw source. Mitigation: the comment is self-documenting (`<!-- forge:cookbook:manifest:[...] -->`), and FORGE.md already has HTML comments for generated sections.

### Decision 3.5: CopilotForge-Internal Recipes Don't Get Templates

**Rationale:** `delegation-example.ts` and `skill-creation-example.ts` demonstrate CopilotForge's own internals. They're documentation for contributors, not patterns users scaffold into their projects. Creating templates for them would violate the "no jargon leaks" rule (they reference internal specialist names).

**Trade-off:** The "every recipe must have a template" rule gets an exception. Mitigated by clearly marking these as "CopilotForge Examples" in a separate README section.

### Decision 3.6: Verbosity as Agent Instruction, Not Template Engine

**Rationale:** Building a real conditional template engine (`{{#if}}`) adds implementation complexity and a new dependency. Instead, templates include all three verbosity variants as marked blocks, and the cookbook-writer agent (an LLM) simply selects the appropriate block. This keeps the system dependency-free and works in any LLM context.

**Trade-off:** Templates are longer (3× comment blocks). LLM may occasionally mix verbosity levels. Mitigation: self-check protocol validates output against skill level.

### Decision 3.7: Phase 3 Covers 4 Languages (TS, PY, Go, C#)

**Rationale:** These four cover >90% of Copilot agent development. Ruby, PHP, Java, and Rust are valid but niche for agent workflows. Adding them now would triple the recipe count without proportional user value.

**Trade-off:** Ruby/PHP/Java/Rust users get the generic `starter.{ext}` fallback from Phase 2's cookbook-writer. Phase 4 can add language packs.

---

## Appendix A: File Manifest

Complete list of files Phase 3 creates or modifies.

### New Files (Concrete Recipes — `cookbook/`)

```
cookbook/error-handling.ts
cookbook/error-handling.py
cookbook/error-handling.go
cookbook/error-handling.cs
cookbook/mcp-tool-server.ts
cookbook/mcp-resource-server.ts
cookbook/mcp-client.ts
cookbook/mcp-tool-server.py
cookbook/mcp-client.py
cookbook/api-client.ts
cookbook/api-client.py
cookbook/api-client.go
cookbook/api-client.cs
cookbook/db-prisma.ts
cookbook/db-sqlalchemy.py
cookbook/db-gorm.go
cookbook/db-efcore.cs
cookbook/db-query.ts
cookbook/db-query.py
cookbook/component-react.tsx
cookbook/component-vue.vue
cookbook/component-svelte.svelte
cookbook/auth-middleware.ts
cookbook/auth-nextjs.ts
cookbook/auth-middleware.py
cookbook/auth-middleware.go
cookbook/auth-middleware.cs
```

### New Files (Templates — `templates/cookbook/`)

Same filenames as above, under `templates/cookbook/`. Excludes `delegation-example.ts` and `skill-creation-example.ts` (CopilotForge-internal only).

### Modified Files

```
cookbook/README.md               — Expanded with full catalog index
.copilot/agents/cookbook-writer.md — Expanded per Section 5
docs/delegation-protocol.md     — Updated cookbook-writer I/O contract
.squad/decisions.md             — Phase 3 decisions appended
```

---

## Appendix B: Migration Path from Phase 2

For repos that already ran CopilotForge in Phase 2:

1. **Re-run is safe.** New recipes are added; existing recipes are preserved.
2. **FORGE.md gains markers.** On the first Phase 3 re-run, the Planner wraps the existing cookbook section in `<!-- forge:cookbook:start/end -->` markers and adds the manifest comment. This is a one-time migration.
3. **No data loss.** The merge algorithm preserves all user content outside the markers.
4. **Old recipes stay.** Session examples from Phase 2 are never overwritten.
