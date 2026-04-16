---
name: "pcf-component"
description: "PCF code component development guide for Path F — TypeScript lifecycle implementation, ControlManifest authoring, pac CLI commands, and environment deployment"
domain: "power-platform"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "I'm building a PCF component"
  - "code component help"
  - "pac pcf init"
  - "TypeScript control for Power Apps"
  - "PCF lifecycle"
  - "power apps component framework"
---
<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# F — PCF Code Component
> Write a TypeScript control that renders inside Power Apps — a reusable, deployable UI component you build with code and package into a solution.

## Build Path
Path F: PCF Code Component | EXTENSION_REQUIRED: true | MS_LEARN_ANCHOR: https://learn.microsoft.com/en-us/power-apps/developer/component-framework/

## Who This Is For
You are a developer comfortable with TypeScript who wants to build a custom UI control — like a color picker, signature pad, or data grid — that runs inside Power Apps model-driven or canvas apps.

## Prerequisites
- Node.js ≥ 16 (LTS recommended; verify with `node --version`)
- Power Platform CLI (`pac`) installed — see [pac CLI installation guide](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- Power Platform environment with system customizer or system administrator role
- VS Code with the Power Platform Tools extension (recommended for IntelliSense and deployment shortcuts)
- Basic TypeScript knowledge (interfaces, classes, and type annotations)

### Capture Decisions (forge remember)

If the user says **"forge remember: [anything]"** at any point in this conversation,
immediately acknowledge it ("Got it — logging that.") and append a new entry to
`forge-memory/decisions.md` in this format:

```
## [YYYY-MM-DD] [brief label]
[the user's exact words]
```

Then continue the conversation without interruption. Do not ask for confirmation.

## What Gets Generated
- `.github/skills/pcf-component/SKILL.md` — this file; PCF lifecycle conventions and TypeScript interface requirements
- `.copilot/agents/pcf-agent.md` — agent definition pre-wired to this skill
- `cookbook/pcf-component.ts` — annotated TypeScript starter implementing the `StandardControl` interface
- `cookbook/pcf-manifest.md` — annotated `ControlManifest.Input.xml` with all property types documented

## Day-One Checklist
1. Run `pac auth create --url https://yourorg.crm.dynamics.com` to connect the CLI to your Power Platform environment.
2. Run `pac pcf init --namespace YourNamespace --name YourControl --template field` to scaffold the project folder.
3. Open `YourControl/index.ts` and implement all four lifecycle methods — use `cookbook/pcf-component.ts` as the reference for structure and comments.
4. Edit `ControlManifest.Input.xml` to declare your input and output properties — see `cookbook/pcf-manifest.md` for all supported property types.
5. Run `pac pcf push --publisher-prefix dev` to push to your environment and test inside a model-driven app form.

## PCF Control Lifecycle
- **init(context, notifyOutputChanged, state, container)** — called once on load; initialize state, build the DOM, and attach event listeners here
- **updateView(context)** — called whenever input properties or context change; re-render with new data — treat this as idempotent (safe to call multiple times)
- **getOutputs()** — called by the platform after you call `notifyOutputChanged()`; return the current output property values
- **destroy()** — called before the component is removed; clean up event listeners, timers, and subscriptions to avoid memory leaks

## TypeScript Interfaces
- `ComponentFramework.StandardControl<IInputs, IOutputs>` — for standard controls that manage their own DOM inside `container`
- `ComponentFramework.ReactControl<IInputs, IOutputs>` — for React-based controls that use virtual rendering; export a function component instead of manipulating `container` directly

## pac CLI Quick Reference
| Command | Purpose |
|---------|---------|
| `pac pcf init --namespace MyNS --name MyControl --template field` | Initialize PCF project |
| `pac pcf push --publisher-prefix dev` | Push to environment |
| `pac solution init --publisher-name Dev --publisher-prefix dev` | Init solution |
| `pac solution add-reference --path .` | Add PCF to solution |

## Agents Available on This Path
- planner — walks you through setup questions and generates your project scaffolding
- reviewer — checks your TypeScript lifecycle implementation and manifest for common errors
- tester — validates that your skill and agent definition files are complete before you package the solution

## MS Learn Integration
Key resources for this path:
- [Power Apps component framework overview](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/)
- [Implementing a PCF control](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls)
- [Power Platform CLI introduction](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)

## forge remember: Support
When you say "forge remember: [decision]", this skill captures it to forge-memory/decisions.md with today's date.
Example: "forge remember: using ReactControl interface for all new PCF components"

## Trigger Phrases
- "I'm building a PCF component"
- "how do I implement the PCF lifecycle"
- "pac pcf push not working"
- "TypeScript control for Power Apps"
