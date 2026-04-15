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

Answer 5 questions and CopilotForge generates a complete Copilot-ready structure for your project.

## Commands

| Command | Description |
|---------|-------------|
| `npx copilotforge init` | Set up CopilotForge in your project |
| `npx copilotforge init --full` | Set up with starter templates included |
| `npx copilotforge doctor` | Check if setup is correct |
| `npx copilotforge uninstall` | Remove CopilotForge files |
| `npx copilotforge --version` | Show version |

## What It Does

The `init` command copies two files into your project:

```
.github/skills/planner/SKILL.md       ← The wizard skill
.github/skills/planner/reference.md   ← Reference material
```

With `--full`, you also get starter templates:

```
FORGE.md                              ← Project control panel
.copilot/agents/planner.md            ← Planner agent
forge-memory/decisions.md             ← Architecture decisions
forge-memory/patterns.md              ← Coding patterns
forge-memory/preferences.md           ← User preferences
cookbook/hello-world.ts                ← Starter recipe (TypeScript)
cookbook/hello-world.py                ← Starter recipe (Python)
```

## How It Works

1. **CLI copies files** — `npx copilotforge init` puts the planner skill into your repo
2. **Wizard runs in chat** — Open Copilot Chat and say "set up my project"
3. **5 questions** — Project name, stack, memory prefs, testing prefs, skill level
4. **Full scaffolding** — Skills, agents, memory, and cookbook recipes generated for your stack

## Zero Dependencies

CopilotForge uses only Node.js built-ins. No runtime dependencies to install, audit, or maintain.

## Requirements

- Node.js 18+
- Any AI assistant that reads `.github/skills/` (GitHub Copilot Chat, Claude Code, etc.)

## Learn More

- [Getting Started Guide](https://github.com/BradLiebworthy/CopilotForge/blob/main/docs/GETTING-STARTED.md)
- [Repository](https://github.com/BradLiebworthy/CopilotForge)

## License

MIT
