# CopilotForge VS Code Extension

Native VS Code integration for CopilotForge — trust indicators, playbook sidebar, and skill/agent browser.

## Features

- **Status bar trust indicator** — shows current trust level (cautious → autonomous) with click-to-detail
- **Sidebar panels** — Trust Trajectory, Playbook entries, Skills & Agents browser
- **Auto-refresh** — watches `forge-memory/` for changes and updates views automatically
- **Command palette** — init, doctor, status, trust, playbook, wizard accessible from Ctrl+Shift+P
- **File watchers** — detects workspace changes to FORGE.md and forge-memory/

## Development

```bash
cd vscode-extension
npm install
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host.

## Structure

```
vscode-extension/
├── package.json              Extension manifest
├── tsconfig.json             TypeScript config
└── src/
    ├── extension.ts          Activation, status bar, commands
    └── views/
        ├── trust-provider.ts     Trust trajectory tree view
        ├── playbook-provider.ts  Playbook entries tree view
        └── skills-provider.ts    Skills & agents tree view
```

## Status

This extension is a scaffold — ready for development. It activates when a CopilotForge project is detected (FORGE.md, forge-memory/, or .github/skills/planner/SKILL.md exists in the workspace).
