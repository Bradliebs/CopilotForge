# CopilotForge

> One command to set up AI-powered coding assistants in any project.

CopilotForge scaffolds [GitHub Copilot](https://github.com/features/copilot) skills, agents, memory, and cookbook recipes into any repo — from a plain-English project description.

## Quick Start

```bash
cd your-project
npx copilotforge init
```

Then open your AI assistant (GitHub Copilot Chat, Claude Code, etc.) and say:

> "set up my project"

Answer a few questions and CopilotForge generates a complete Copilot-ready structure for your project.

## Commands

| Command | Description |
|---------|-------------|
| `npx copilotforge init` | Set up CopilotForge in your project (full scaffold) |
| `npx copilotforge init --minimal` | Set up with planner skill only (2 files) |
| `npx copilotforge doctor` | Check if setup is correct |
| `npx copilotforge uninstall` | Remove CopilotForge files |
| `npx copilotforge --version` | Show version |

## What It Does

The `init` command scaffolds the full CopilotForge structure into your project:

```
.github/skills/planner/SKILL.md       ← The wizard skill
.github/skills/planner/reference.md   ← Reference material
FORGE.md                              ← Project control panel
.copilot/agents/planner.md            ← Planner agent
forge-memory/decisions.md             ← Architecture decisions
forge-memory/patterns.md              ← Coding patterns
forge-memory/preferences.md           ← User preferences
cookbook/hello-world.ts                ← Starter recipe (TypeScript)
cookbook/hello-world.py                ← Starter recipe (Python)
docs/GETTING-STARTED.md               ← Quick-start guide
```

With `--minimal`, you get only the planner skill (2 files):

```
.github/skills/planner/SKILL.md       ← The wizard skill
.github/skills/planner/reference.md   ← Reference material
```

## How It Works

1. **CLI scaffolds files** — `npx copilotforge init` puts the full structure into your repo
2. **Wizard runs in chat** — Open Copilot Chat and say "set up my project"
3. **A few questions** — Project name, stack, memory prefs, testing prefs, skill level, extras shopping list
4. **Full scaffolding** — Skills, agents, memory, and cookbook recipes generated for your stack

## Zero Dependencies

CopilotForge uses only Node.js built-ins. No runtime dependencies to install, audit, or maintain.

## Requirements

- Node.js 18+
- Any AI assistant that reads `.github/skills/` (GitHub Copilot Chat, Claude Code, etc.)

## Learn More

- [Getting Started Guide](https://github.com/Bradliebs/CopilotForge/blob/main/docs/GETTING-STARTED.md)
- [Repository](https://github.com/Bradliebs/CopilotForge)

## License

MIT
