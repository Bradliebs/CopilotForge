# Stack Detection Specification

> How CopilotForge detects the project's tech stack by examining files in the repository.

---

## Overview

Stack detection runs during the wizard phase to auto-detect frameworks, languages, and tools. The result drives which cookbook recipes, skills, and agent configurations are generated.

---

## Detection Sources

### 1. `package.json` (Node.js / TypeScript / JavaScript)

Parse `dependencies` and `devDependencies` for known framework packages.

| Package Pattern | Detected Framework | Confidence |
|---|---|---|
| `express` | Express.js | high |
| `next` | Next.js | high |
| `react` | React | high |
| `vue` | Vue.js | high |
| `@angular/core` | Angular | high |
| `fastify` | Fastify | high |
| `hono` | Hono | high |
| `@nestjs/core` | NestJS | high |
| `prisma` or `@prisma/client` | Prisma ORM | high |
| `drizzle-orm` | Drizzle ORM | high |
| `typeorm` | TypeORM | high |
| `@modelcontextprotocol/sdk` | MCP SDK | high |
| `zod` | Zod (validation) | medium |
| `jose` | JOSE (JWT/auth) | medium |
| `typescript` (devDep) | TypeScript | high |
| `vitest` or `jest` | Testing framework | high |
| `tailwindcss` | Tailwind CSS | medium |
| `@trpc/server` | tRPC | high |

**Language detection:** If `typescript` is in `devDependencies` or a `tsconfig.json` exists, language is **TypeScript**. Otherwise **JavaScript**.

### 2. `requirements.txt` / `pyproject.toml` / `Pipfile` (Python)

Parse dependency names from any of these files.

| Package Pattern | Detected Framework | Confidence |
|---|---|---|
| `fastapi` | FastAPI | high |
| `flask` | Flask | high |
| `django` | Django | high |
| `sqlalchemy` | SQLAlchemy | high |
| `prisma` | Prisma (Python) | high |
| `mcp` | MCP SDK (Python) | high |
| `pydantic` | Pydantic | medium |
| `httpx` | httpx (HTTP client) | medium |
| `pyjwt` or `python-jose` | JWT auth | medium |
| `pytest` | pytest | high |
| `alembic` | Alembic (migrations) | high |
| `celery` | Celery (task queue) | medium |
| `uvicorn` or `gunicorn` | ASGI/WSGI server | medium |

**For `pyproject.toml`:** Parse `[project.dependencies]` and `[tool.poetry.dependencies]` sections.

### 3. `go.mod` (Go)

Parse `require` directives for module paths.

| Module Pattern | Detected Framework | Confidence |
|---|---|---|
| `github.com/gin-gonic/gin` | Gin | high |
| `github.com/gofiber/fiber` | Fiber | high |
| `github.com/labstack/echo` | Echo | high |
| `net/http` (stdlib) | Standard library HTTP | medium |
| `gorm.io/gorm` | GORM | high |
| `github.com/jmoiron/sqlx` | sqlx | high |

### 4. `*.csproj` (C# / .NET)

Parse `<PackageReference>` elements for NuGet packages.

| Package Pattern | Detected Framework | Confidence |
|---|---|---|
| `Microsoft.AspNetCore.*` | ASP.NET Core | high |
| `Microsoft.EntityFrameworkCore` | EF Core | high |
| `Microsoft.Extensions.DependencyInjection` | .NET DI | medium |
| `Swashbuckle.AspNetCore` | Swagger/OpenAPI | medium |
| `xunit` or `NUnit` or `MSTest` | Testing framework | high |

### 5. File-based Detection (no manifest)

When no package manifest is found, scan for indicator files.

| File/Pattern | Detected Stack | Confidence |
|---|---|---|
| `Dockerfile` | Docker | high |
| `docker-compose.yml` | Docker Compose | high |
| `.github/workflows/*.yml` | GitHub Actions CI | high |
| `terraform/*.tf` | Terraform | high |
| `*.bicep` | Azure Bicep | high |
| `serverless.yml` | Serverless Framework | high |
| `Makefile` | Make build system | low |
| `Cargo.toml` | Rust | high |
| `mix.exs` | Elixir | high |

---

## Fallback: Wizard Stack Answer

If file-based detection yields no results or low confidence, prompt the user:

```
What tech stack does this project use?
Examples: "TypeScript, Express, Prisma", "Python, FastAPI, SQLAlchemy", "Go, Gin"
```

The wizard answer is parsed into individual framework names and assigned **medium** confidence (user-reported, not verified from files).

---

## Output Format

Detection produces a structured list:

```json
{
  "language": "TypeScript",
  "frameworks": [
    { "name": "Express", "source": "package.json", "confidence": "high" },
    { "name": "Prisma", "source": "package.json", "confidence": "high" },
    { "name": "Zod", "source": "package.json", "confidence": "medium" },
    { "name": "MCP SDK", "source": "package.json", "confidence": "high" }
  ],
  "testing": { "name": "vitest", "source": "package.json", "confidence": "high" },
  "infrastructure": [
    { "name": "Docker", "source": "Dockerfile", "confidence": "high" },
    { "name": "GitHub Actions", "source": ".github/workflows", "confidence": "high" }
  ],
  "detectedFrom": ["package.json", "tsconfig.json", "Dockerfile"]
}
```

### Confidence Levels

| Level | Meaning | When to use |
|---|---|---|
| **high** | Package/file directly proves usage | Package in manifest, config file exists |
| **medium** | Strong indicator but not definitive | Utility library, user-reported stack |
| **low** | Weak signal, may be coincidental | Generic file patterns, ambiguous names |

---

## How Detection Drives Scaffolding

| Detected Framework | Generated Recipes | Generated Skills |
|---|---|---|
| Express | `route-handler.ts`, `auth-middleware.ts` | Express conventions |
| FastAPI | `route-handler.py`, `auth-middleware.py` | FastAPI conventions |
| Prisma | `db-query.ts` | Database conventions |
| SQLAlchemy | `db-query.py` | Database conventions |
| MCP SDK (TS) | `mcp-server.ts` | MCP integration |
| MCP SDK (Py) | `mcp-server.py` | MCP integration |
| Any TS project | `error-handling.ts`, `api-client.ts`, `session-example.ts` | — |
| Any Python project | `error-handling.py`, `api-client.py`, `session-example.py` | — |
