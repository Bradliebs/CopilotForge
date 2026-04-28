# CopilotForge Examples

> Real-world examples of what your repo looks like after running CopilotForge.

These examples show the output structure you get after running the wizard. They're **not code projects** — just the CopilotForge scaffolding (skills, agents, memory files, and FORGE.md) so you can see what to expect.

---

## Available Examples

### Next.js App (TypeScript)

**Path:** `examples/nextjs-app/`

A TypeScript/Next.js/Prisma/PostgreSQL project. Shows:
- Full FORGE.md with realistic project values
- Memory files with decisions and patterns
- What the output looks like for a typical modern web app stack

**Stack:** TypeScript, Next.js 14 (App Router), Prisma, PostgreSQL, React, Jest

---

### FastAPI App (Python)

**Path:** `examples/fastapi-app/`

A Python/FastAPI/SQLAlchemy/PostgreSQL API project. Shows:
- FORGE.md for a Python backend stack
- Memory files with Python-specific conventions
- Decisions around async patterns and ORM choice

**Stack:** Python, FastAPI, SQLAlchemy, PostgreSQL, pytest

---

### Minimal Project

**Path:** `examples/minimal/`

A brand-new empty project with no config files. Shows:
- FORGE.md when CopilotForge has minimal information
- How the wizard handles "I'm just starting" scenarios
- Generic conventions when no specific framework is detected

**Stack:** JavaScript (no framework specified)

---

### Oracle Prime Analysis Session

**Path:** `examples/oracle-prime-session/`

A multi-turn Oracle Prime analysis demonstrating the full reasoning pipeline. Shows:
- Adaptive complexity classification triggering the full S1–S7 pipeline
- Session state tracking with Evidence Register and Weight Log
- Scenario Map flipping between turns based on new evidence
- Evolution Block persistence via the forge remember mechanism
- [RIVAL] hypothesis tracking and resolution

**Topic:** Whether to migrate an e-commerce monolith to microservices

---

## How to Use These Examples

### Browse Before Running the Wizard

Open the example that matches your stack to see what you'll get. This helps you understand what CopilotForge generates before you run it.

### Compare After Your Run

After running the wizard on your project, compare your `FORGE.md` and `forge-memory/` files to these examples. This helps you understand what's different about your specific setup.

### Use as Templates

If you're manually creating files (without the wizard), these examples show the correct structure and format.

---

## What's Included in Each Example

Each example includes:

- **FORGE.md** — The control panel with realistic project values
- **forge-memory/decisions.md** — Sample decisions showing why things were set up a certain way
- **forge-memory/patterns.md** — (Optional) Sample conventions when applicable

**Not included:**
- Skills (same across all projects, already in `.github/skills/`)
- Agents (same templates, already in `.copilot/agents/`)
- Cookbook recipes (same code, already in `cookbook/`)

---

## Adding Your Own Example

If you've run CopilotForge on an interesting stack and want to share:

1. Create a new folder: `examples/your-stack-name/`
2. Copy your `FORGE.md` and `forge-memory/` files
3. Redact any sensitive information (API keys, real project names if needed)
4. Add a row to the table above describing the stack
5. Submit a PR!

---

**← Back to [Main README](../README.md)** | **→ See [Getting Started Guide](../docs/GETTING-STARTED.md)**
