---
title: Examples Registry Specification
description: Format specification for the copilotforge-examples GitHub repository registry.json
---

# Examples Registry Specification

This document defines the `registry.json` format used by the `copilotforge examples` command to discover and present starter projects.

## Repository Structure

The examples live in a separate GitHub repository: `Bradliebs/copilotforge-examples`

```text
copilotforge-examples/
├── registry.json           ← Discovery index (this spec)
├── hello-agent/
│   ├── README.md
│   └── ...project files
├── canvas-todo/
│   ├── README.md
│   └── ...project files
└── ...more examples
```

## Registry Schema

```json
{
  "version": 1,
  "examples": [
    {
      "name": "hello-agent",
      "description": "Minimal Copilot Studio agent — beginner friendly",
      "path": "A",
      "tags": ["beginner", "copilot-studio"],
      "readme": "hello-agent/README.md"
    }
  ]
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | Yes | Schema version. Currently `1`. |
| `examples` | array | Yes | Array of example definitions. |

### Example Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique kebab-case identifier. Used as the clone directory name. |
| `description` | string | Yes | One-sentence description shown in the listing. |
| `path` | string | Yes | Build path letter (A–J for core, K–Z for plugins). |
| `tags` | string[] | Yes | Searchable tags. Include difficulty level and key technologies. |
| `readme` | string | No | Relative path to the example's README.md for preview. |

### Tag Conventions

| Tag | Meaning |
|-----|---------|
| `beginner` | Suitable for first-time users |
| `intermediate` | Requires some familiarity with the stack |
| `advanced` | Complex project structure or advanced patterns |
| `copilot-studio` | Uses Copilot Studio |
| `canvas-app` | Uses Power Apps Canvas |
| `pcf` | Uses PCF Code Components |
| `power-bi` | Uses Power BI |
| `typescript` | Primary language is TypeScript |
| `python` | Primary language is Python |

## Initial Examples

| Name | Path | Difficulty | Description |
|------|------|-----------|-------------|
| `hello-agent` | A | Beginner | Minimal Copilot Studio agent |
| `canvas-todo` | D | Beginner | Canvas App with Copilot AI control |
| `pcf-rating` | F | Intermediate | PCF star rating component |
| `trading-system` | J | Advanced | Algo trading with PostgreSQL + Telegram |
| `powerbi-sales` | G | Intermediate | Power BI sales dashboard with DAX |

## How the CLI Uses This

1. `copilotforge examples` fetches `registry.json` via `fetch()` from the GitHub raw URL
2. The registry is cached locally at `~/.copilotforge/examples-cache.json`
3. If GitHub is unreachable, the CLI falls back to the cache, then to built-in defaults
4. `copilotforge examples <name>` clones the example directory
5. `copilotforge examples preview <name>` fetches and displays the README

## Validation Rules

- `name` must be unique across all entries
- `name` must be kebab-case (lowercase letters, numbers, hyphens)
- `path` must be a single letter A–Z
- `tags` must be a non-empty array
- `description` must be non-empty

## Versioning

The `version` field allows future schema changes:

- **Version 1** (current): Basic example listing with name, description, path, tags
- Future versions may add: dependencies, prerequisites, file manifest, screenshots
