'use strict';

// getPlatformForge — returns path-specific FORGE.md template (Phase 13 Task 9)
// Paths A-I have dedicated templates. Path J falls back to the generic FORGE_MD.

function getPlatformForgeA() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=A -->

## Project Summary
- **Build Path:** A — Copilot Studio Agent
- **Description:** [one-sentence summary of your agent]
- **Stack:** Microsoft Copilot Studio (no-code)
- **Prerequisites:** Microsoft 365 license with Copilot Studio access
- **MS Learn:** https://learn.microsoft.com/en-us/microsoft-copilot-studio/

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | Copilot Studio agent design & publishing | \`.copilot/agents/studio-guide.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| studio-agent | "build studio agent" | Copilot Studio agent authoring patterns |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| topics-guide.md | Author topics, trigger phrases, and responses |
| studio-flow-integration.md | Connect Copilot Studio to Power Automate flows |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: A
- Path Name: Copilot Studio Agent
`;
}

function getPlatformForgeB() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=B -->

## Project Summary
- **Build Path:** B — Studio + Custom Connector
- **Description:** [one-sentence summary of your agent + connector]
- **Stack:** Microsoft Copilot Studio + REST API connector
- **Prerequisites:** Microsoft 365 license with Copilot Studio access, REST API endpoint
- **MS Learn:** https://learn.microsoft.com/en-us/microsoft-copilot-studio/create-or-edit-copilot

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | Copilot Studio agent + connector design | \`.copilot/agents/studio-guide.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| studio-connector | "add connector" | Custom connector authoring and configuration |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| topics-guide.md | Author topics, trigger phrases, and responses |
| connector-setup.md | Register and test a custom REST connector |
| api-auth-guide.md | OAuth and API key auth for connectors |
| studio-flow-integration.md | Connect Copilot Studio to Power Automate flows |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: B
- Path Name: Studio + Custom Connector
`;
}

function getPlatformForgeC() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=C -->

## Project Summary
- **Build Path:** C — Declarative Agent
- **Description:** [one-sentence summary of your declarative agent]
- **Stack:** Microsoft 365 Copilot Agent Builder (no-code)
- **Prerequisites:** Microsoft 365 Copilot license
- **MS Learn:** https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-declarative-agents

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Declarative Builder | M365 declarative agent manifest & actions | \`.copilot/agents/declarative-builder.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| declarative-agent | "build declarative agent" | Declarative agent manifest authoring |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| manifest-guide.md | Declarative agent manifest structure and fields |
| action-setup.md | Configure OpenAPI actions for declarative agents |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: C
- Path Name: Declarative Agent
`;
}

function getPlatformForgeD() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=D -->

## Project Summary
- **Build Path:** D — Canvas App + Copilot Agent
- **Description:** [one-sentence summary of your canvas app]
- **Stack:** Power Apps Canvas + AI Builder
- **Prerequisites:** Power Apps license, Power Platform environment
- **MS Learn:** https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Canvas Companion | Canvas app design, Power Fx, and AI Builder | \`.copilot/agents/canvas-companion.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| canvas-agent | "build canvas app" | Canvas app authoring and Power Fx patterns |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| powerfx-patterns.md | Common Power Fx formulas and patterns |
| data-connections.md | Connect canvas apps to data sources |
| dataverse-connector.md | Dataverse table design and connector setup |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: D
- Path Name: Canvas App + Copilot Agent
`;
}

function getPlatformForgeE() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=E -->

## Project Summary
- **Build Path:** E — Power Automate
- **Description:** [one-sentence summary of your automation flow]
- **Stack:** Power Automate + AI Builder
- **Prerequisites:** Power Automate license, Power Platform environment
- **MS Learn:** https://learn.microsoft.com/en-us/power-automate/

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Flow Architect | Power Automate flow design and AI Builder integration | \`.copilot/agents/flow-architect.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| power-automate | "build flow" | Power Automate flow patterns and AI Builder |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| flow-patterns.md | Common Power Automate flow patterns |
| trigger-setup.md | Configure automated, scheduled, and instant triggers |
| data-connections.md | Connect flows to data sources and connectors |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: E
- Path Name: Power Automate
`;
}

function getPlatformForgeF() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=F -->

## Project Summary
- **Build Path:** F — PCF Code Component
- **Description:** [one-sentence summary of your PCF component]
- **Stack:** TypeScript + PCF Framework + pac CLI
- **Prerequisites:** Node.js ≥16, pac CLI, Power Platform environment
- **MS Learn:** https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Component Engineer | PCF component development, TypeScript, and pac CLI | \`.copilot/agents/component-engineer.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| pcf-component | "build PCF component" | PCF TypeScript component authoring and deployment |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| pcf-component.ts | TypeScript PCF component scaffold |
| pcf-manifest.md | ControlManifest.Input.xml structure and field reference |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: F
- Path Name: PCF Code Component
`;
}

function getPlatformForgeG() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=G -->

## Project Summary
- **Build Path:** G — Power BI
- **Description:** [one-sentence summary of your Power BI report]
- **Stack:** Power BI Desktop + Power BI Service
- **Prerequisites:** Power BI Pro or Premium license
- **MS Learn:** https://learn.microsoft.com/en-us/power-bi/

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Report Architect | Power BI data modeling, DAX, and report design | \`.copilot/agents/report-architect.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| powerbi-report | "build Power BI report" | Power BI data modeling and visualization patterns |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| report-setup.md | Power BI report structure and publishing workflow |
| data-model.md | Star schema design and relationship best practices |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: G
- Path Name: Power BI
`;
}

function getPlatformForgeH() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=H -->

## Project Summary
- **Build Path:** H — SharePoint + Teams
- **Description:** [one-sentence summary of your SharePoint/Teams solution]
- **Stack:** Microsoft 365 Copilot + SharePoint
- **Prerequisites:** Microsoft 365 Copilot license, SharePoint admin access
- **MS Learn:** https://learn.microsoft.com/en-us/sharepoint/introduction

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | SharePoint + Teams integration and Copilot configuration | \`.copilot/agents/studio-guide.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| sharepoint-agent | "build SharePoint agent" | SharePoint Copilot agent and Teams integration |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| sharepoint-connector.md | SharePoint data connector and permissions setup |
| topics-guide.md | Author topics, trigger phrases, and responses |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: H
- Path Name: SharePoint + Teams
`;
}

function getPlatformForgeI() {
  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v2.0.0 -->
<!-- copilotforge: path=I -->

## Project Summary
- **Build Path:** I — Power Pages
- **Description:** [one-sentence summary of your Power Pages site]
- **Stack:** Power Pages + Dataverse + AI Plugin
- **Prerequisites:** Power Pages license, Power Platform environment
- **MS Learn:** https://learn.microsoft.com/en-us/power-pages/

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| Studio Guide | Power Pages site design and Dataverse integration | \`.copilot/agents/studio-guide.md\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
| power-pages | "build Power Pages site" | Power Pages site authoring and AI plugin integration |
| forge-compass | "which path" | Build-path selection and routing |
| power-platform-guide | "platform docs" | Power Platform MS Learn references |

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
| dataverse-connector.md | Dataverse table design and connector setup for Power Pages |

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: I
- Path Name: Power Pages
`;
}

function getPlatformForge(forgePath) {
  const variants = {
    A: getPlatformForgeA,
    B: getPlatformForgeB,
    C: getPlatformForgeC,
    D: getPlatformForgeD,
    E: getPlatformForgeE,
    F: getPlatformForgeF,
    G: getPlatformForgeG,
    H: getPlatformForgeH,
    I: getPlatformForgeI,
  };
  const fn = variants[forgePath && forgePath.toUpperCase()];
  const { FORGE_MD } = require('./forge');
  return fn ? fn() : FORGE_MD; // Path J fallback
}

module.exports = { getPlatformForge };
