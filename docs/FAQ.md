# ❓ Frequently Asked Questions

> Quick answers to common questions about CopilotForge.

---

## General Questions

### What if I already have a `.copilot/` folder?

CopilotForge won't overwrite existing files. If it finds files that already exist, it skips them and tells you what was skipped in the validation summary. Your existing setup is safe.

### Can I use this with an existing project?

Yes — that's the main use case. Drop the Planner skill into any repo, run the wizard, and it generates files alongside your existing code. It reads your project's config files (`package.json`, `requirements.txt`, etc.) to understand your stack.

### What if I want to start over?

Delete the generated files (or the whole `forge-memory/` folder) and run the wizard again. Memory files track choices with append-only entries, so you can also just re-run the wizard — it'll show you your previous answers and let you change them.

Alternatively, tell the wizard "start fresh" and it will bypass memory and run the full 5-question setup again.

### Do I need to understand skills or agents to use this?

No. CopilotForge creates and configures everything for you. You can use the generated agents and skills without ever opening the files. If you want to customize later, every file is plain markdown with comments explaining what it does.

### What languages and frameworks are supported?

CopilotForge generates code recipes for **TypeScript**, **Python**, **Go**, and **C#**. It recognizes frameworks like Express, Next.js, React, Prisma, FastAPI, SQLAlchemy, Gin, GORM, ASP.NET, Entity Framework, and more.

The skills and agents work with any language — they're instructions, not code. Only the cookbook recipes are language-specific.

---

## Setup & Scaffolding

### I got an error during scaffolding — what do I do?

CopilotForge handles partial failures gracefully. If one part fails, the rest still generates. Check the validation summary at the end — it lists what was created and what was skipped.

Try running the wizard again. It'll detect existing files and only generate what's missing.

### The wizard froze or went silent

Check that your AI assistant has access to read and write files in your project. Some setups require you to open the project folder first or enable file access permissions.

If the wizard stops mid-flow, just run it again. It will pick up where it left off (or show you the welcome-back screen if memory was already created).

### I have no config files in my repo

That's perfectly fine! CopilotForge works with brand-new empty repos. When the wizard asks about your stack (Question 2), just describe what you're planning to use:
- "Python with Flask"
- "JavaScript"
- "Go with Gin"

The wizard will generate conventions and recipes for that stack, even though you haven't created config files yet.

### Can I use this with a monorepo?

Yes, but you'll need to run the wizard separately for each sub-project. Place a `.github/skills/planner/` folder at the root of each sub-project, or at the monorepo root if you want shared skills and agents.

Generated agents and skills are scoped to the directory where the wizard runs. If you want workspace-wide setup, run it from the monorepo root.

### My recipes don't run — I get "module not found"

Check the recipe's header comment for the PREREQUISITES section. You need to install the packages listed there:
- **TypeScript/JavaScript:** `npm install <package-name>`
- **Python:** `pip install <package-name>`
- **Go:** `go get <package-name>`
- **C#:** `dotnet add package <package-name>`

If you get "Cannot find module 'ts-node'", run: `npm install -D ts-node typescript @types/node`

---

## Memory & Re-Runs

### How do I add memory to an existing project?

If you initially said "no" to memory and want to enable it:

1. Run the wizard again
2. When it asks about memory, say "yes"
3. It will create the `forge-memory/` folder and populate it with your current setup

Your existing files (skills, agents, recipes) are preserved. Memory just adds decision tracking for future runs.

### What if I want to start completely over?

Three options:

1. **Tell the wizard "start fresh"** — bypasses all memory and runs the full setup again
2. **Delete the `forge-memory/` folder** — next run treats it like a first-time setup
3. **Delete all generated files** — completely clean slate

Option 1 is safest because it logs the reset as a decision. Options 2 and 3 permanently delete data.

---

## Privacy & Data

### Is my data sent anywhere?

No. CopilotForge is just markdown files with instructions. Everything stays local:
- Memory files are stored in your repo (`forge-memory/`)
- No data is sent to external servers
- The wizard runs in your AI assistant, which uses your assistant's normal data policies

You can read, edit, or delete any file CopilotForge creates — they're all plain text.

### Should I commit `forge-memory/` to Git?

**For private repos:** Yes — memory files are useful context for your team.

**For public repos:** Your choice. Memory files contain decisions and conventions, not secrets or code. If you don't want them visible publicly, add `forge-memory/` to your `.gitignore`.

---

## Customization

### Can I use this without Git?

Yes. Git is recommended but not required. CopilotForge creates files in your project directory — it doesn't care if they're tracked by Git or not.

If you don't use Git, you won't have version history for your generated files, but everything else works normally.

### What's the difference between a skill and an agent?

A **skill** is a set of instructions — like a playbook for handling a specific task ("how to review code," "how to write tests").

An **agent** is an AI team member with a job title — it knows which skills to use and when. Think of skills as the "how" and agents as the "who."

### Can I edit the generated files?

Absolutely. Every file CopilotForge creates is plain markdown or code. Edit anything you want:
- Change coding conventions in skills
- Adjust agent behavior in agent definitions
- Modify recipes to match your actual patterns
- Add custom sections to FORGE.md

CopilotForge won't overwrite your changes on re-runs — it skips files that already exist.

### How do I add a new skill?

1. Create a new folder in `.github/skills/` — example: `.github/skills/deployment/`
2. Create a `SKILL.md` file inside it
3. Follow the format from existing skills (frontmatter + Context + Patterns + Examples + Anti-Patterns)
4. Update `FORGE.md` to add it to the Skills table

### How do I add a new agent?

1. Create a new `.md` file in `.copilot/agents/` — example: `.copilot/agents/optimizer.md`
2. Define its Role, Scope, System Prompt, Boundaries, and Skills
3. Use an existing agent as a template
4. Update `FORGE.md` to add it to the Agents table

### How do I add a new recipe?

1. Create a new file in `cookbook/` — example: `cookbook/caching-example.ts`
2. Start with a header comment (WHAT, WHEN, HOW, PREREQUISITES)
3. Include all imports — no "install this first" surprises
4. Mark integration points with `TODO` comments
5. Add a row to `cookbook/README.md`

---

## Compatibility

### Does this work with GitHub Copilot?

Yes. Place the `.github/skills/planner/SKILL.md` file in your repo. GitHub Copilot reads it automatically. Say "set up my project" in Copilot Chat to trigger the wizard.

### Does this work with Claude Code?

Yes. Paste the Instructions section from `SKILL.md` as a prompt in Claude Code, or just say "set up my project" if Claude can read your repo files.

### Does this work with Cursor?

Yes. Cursor supports GitHub Copilot skills. Follow the same steps as GitHub Copilot.

### Does this work with ChatGPT or other LLMs?

Yes, with some manual steps. Copy the wizard instructions (Steps 1-4 from `SKILL.md`) into a chat session. You'll need to manually create files based on the LLM's output, since most LLMs can't write files directly.

---

## Troubleshooting

### "The wizard didn't start when I said 'set up my project'"

Check that the SKILL.md file is in the right location:
```
your-project/.github/skills/planner/SKILL.md
```

The path must be exact. Also check that your AI assistant can read repo files — some setups require you to open the project folder first or enable file access.

### "FORGE.md has placeholder values like `{{project-name}}`"

You're looking at the template, not a generated file. The template lives in `templates/FORGE.md`. After running the wizard, the real `FORGE.md` at your repo root has your actual values filled in.

### "The generated files don't match my stack"

Be specific in Question 2 (tech stack). Instead of "JavaScript," say "TypeScript, Express, Prisma." The more specific you are, the more targeted the output.

CopilotForge also reads your config files (`package.json`, `requirements.txt`, etc.) to auto-detect frameworks. Make sure these files are up to date.

### "I want to remove something that was generated"

Just delete the file. CopilotForge won't re-create deleted files unless you run the wizard again — and even then, it asks before regenerating. Your choices are always respected.

---

## Cost & Licensing

### Is this free?

CopilotForge itself is free. It's just markdown files. You need access to an AI coding assistant (GitHub Copilot, Claude Code, etc.) to run the wizard, but CopilotForge doesn't add any cost on top of that.

### What's the license?

MIT — use it however you want. Modify it, redistribute it, use it in commercial projects. No restrictions.

---

**Still have questions?** Open an issue on the [CopilotForge repo](https://github.com/yourusername/copilotforge) or check the full docs:

- [Getting Started Guide](GETTING-STARTED.md)
- [How It Works](HOW-IT-WORKS.md)
- [Main README](../README.md)
