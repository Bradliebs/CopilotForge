# CopilotForge

> One command. AI skills tailored to your project.

CopilotForge adds a skill file to your repo that teaches your AI assistant how to set up itself for your project. You answer three questions and it creates a code reviewer, a test writer, and a starter code example — all customised for your stack.

**Everything it creates is plain text.** No framework to install, no runtime, no lock-in.

---

## What You'll Need

- **An AI coding assistant** — [GitHub Copilot](https://github.com/features/copilot), [Claude Code](https://claude.ai/code), [Cursor](https://cursor.sh), or similar
- **A code project** — new or existing, any language
- **Node.js 18+** — only needed to run the one-time `npx` command

---

## Quick Start

```bash
cd your-project
npx copilotforge init
```

Then open your AI chat and say:

```
set up my project
```

That's it. The wizard takes about one minute.

> **No Node.js?** Copy `.github/skills/planner/` from this repo into your project manually — it works the same way.

---

## What the Wizard Asks

Three questions, one at a time:

| # | Question | Example |
|---|----------|---------|
| 1 | What are you building? | "A REST API for a todo app" |
| 2 | What language and framework? | "TypeScript with Express" |
| 3 | What's your experience level? | beginner / intermediate / advanced |

You see a summary before anything is created. Say yes to confirm or change any answer.

---

## What You Get

After the wizard runs, your repo has three new skill files:

| File | What it does | How to use it |
|------|-------------|---------------|
| `.github/skills/code-review/SKILL.md` | Teaches your AI to review your code | Say **"review this code"** |
| `.github/skills/test-helper/SKILL.md` | Teaches your AI to write tests for your stack | Say **"write tests for this"** |
| `cookbook/starter.{ext}` | A working code example for your stack | Open and copy from it |

`START-HERE.md` in your project root explains everything in plain English.

---

## Using Your Skills

Once the wizard has run, you interact with your AI normally — just use the trigger phrases:

```
review this code        → checks the file you paste for issues
write tests for this    → writes tests for the function you paste
```

The skills know your stack (TypeScript vs Python vs Go, etc.) and your experience level (beginners get explanations, advanced users get concise output).

---

## Advanced Setup (--full)

The default install is intentionally minimal. If you want the full setup — memory system, agent definitions, 20+ recipes, live dashboard, and autonomous task runner — use:

```bash
npx copilotforge init --full
```

This restores the original behaviour: FORGE.md control panel, forge-memory/ decision log, plan-executor skill, Ralph Loop task automation, and the browser dashboard.

```bash
npx copilotforge init --full --yes   # skip all prompts
npx copilotforge init --dry-run      # preview what would be created
npx copilotforge init --minimal      # planner skill only (2 files)
```

### Full-mode commands

```bash
npx copilotforge status      # terminal dashboard — plan, memory, skills, git
npx copilotforge doctor      # verify your setup is correct
npx copilotforge dashboard   # browser dashboard at http://localhost:3731
npx copilotforge watch       # persistent autonomous task runner
npx copilotforge run         # one-shot task runner
npx copilotforge upgrade     # update framework files to latest
npx copilotforge uninstall   # remove CopilotForge files
```

---

## Customising Your Skills

All generated files are plain text — edit anything, anytime. You can't break it. If something goes wrong, delete the file and run `npx copilotforge init` again.

### Add a skill

Create a folder in `.github/skills/` with a `SKILL.md`:

```markdown
---
name: "deploy-helper"
triggers:
  - "help me deploy"
  - "deployment checklist"
---

# Deploy Helper

When triggered, walk through the deployment checklist for this project:
1. Run tests
2. Build the project
3. ...
```

Your AI assistant picks it up immediately — no restart needed.

### Add a recipe

Create a file in `cookbook/` with a comment explaining what it does, then copy from it when you need that pattern.

---

## Works With Any AI

CopilotForge generates plain markdown. It works with any AI that can read your project files:

| Tool | How it reads skills |
|------|---------------------|
| GitHub Copilot (VS Code) | Reads `.github/skills/` automatically |
| Claude Code | Reads `.github/skills/` automatically |
| Cursor | Reads `.github/skills/` automatically |
| Any LLM | Paste the SKILL.md content as a prompt |

No lock-in. The files are useful on their own even without CopilotForge.

---

## FAQ

**What if I already have a `.github/skills/` folder?**
CopilotForge won't overwrite existing files. It skips anything already there and tells you what was skipped.

**Can I use this with an existing project?**
Yes — that's the main use case. Drop the planner skill into any repo, run the wizard, and it generates skills alongside your existing code.

**What if I want to start over?**
Delete `START-HERE.md` and `.github/skills/planner/` then run `npx copilotforge init` again.

**What's the difference between a skill and an agent?**
A **skill** is a set of instructions for a specific task ("how to review TypeScript code"). An **agent** is an AI team member that uses skills ("the code reviewer"). For most projects, skills are all you need — agents are a `--full` feature.

---

## Contributing

- **Add a recipe:** create a file in `cookbook/` with a clear header comment
- **Improve a skill:** edit files in `.github/skills/`
- **Report issues:** [open an issue](../../issues)
- **Docs:** PRs for documentation improvements are always welcome

| Resource | |
|----------|-|
| [LICENSE](LICENSE) | MIT |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guidelines and workflow |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

> Stuck? Check [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) or [open an issue](../../issues).
