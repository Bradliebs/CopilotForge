'use strict';

const pkg = require('../../package.json');
const VERSION = pkg.version;

// getPlatformForge — returns path-specific FORGE.md template
// Paths A-I have dedicated config. Path J falls back to the generic FORGE_MD.

const PATH_CONFIG = {
  A: {
    name: 'Copilot Studio Agent',
    description: 'one-sentence summary of your agent',
    stack: 'Microsoft Copilot Studio (no-code)',
    prereqs: 'Microsoft 365 license with Copilot Studio access',
    msLearn: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/',
    agentName: 'Studio Guide', agentRole: 'Copilot Studio agent design & publishing', agentFile: 'studio-guide.md',
    skills: [['studio-agent', '"build studio agent"', 'Copilot Studio agent authoring patterns']],
    recipes: [['topics-guide.md', 'Author topics, trigger phrases, and responses'], ['studio-flow-integration.md', 'Connect Copilot Studio to Power Automate flows']],
  },
  B: {
    name: 'Studio + Custom Connector',
    description: 'one-sentence summary of your agent + connector',
    stack: 'Microsoft Copilot Studio + REST API connector',
    prereqs: 'Microsoft 365 license with Copilot Studio access, REST API endpoint',
    msLearn: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/create-or-edit-copilot',
    agentName: 'Studio Guide', agentRole: 'Copilot Studio agent + connector design', agentFile: 'studio-guide.md',
    skills: [['studio-connector', '"add connector"', 'Custom connector authoring and configuration']],
    recipes: [['topics-guide.md', 'Author topics, trigger phrases, and responses'], ['connector-setup.md', 'Register and test a custom REST connector'], ['api-auth-guide.md', 'OAuth and API key auth for connectors'], ['studio-flow-integration.md', 'Connect Copilot Studio to Power Automate flows']],
  },
  C: {
    name: 'Declarative Agent',
    description: 'one-sentence summary of your declarative agent',
    stack: 'Microsoft 365 Copilot Agent Builder (no-code)',
    prereqs: 'Microsoft 365 Copilot license',
    msLearn: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-declarative-agents',
    agentName: 'Declarative Builder', agentRole: 'M365 declarative agent manifest & actions', agentFile: 'declarative-builder.md',
    skills: [['declarative-agent', '"build declarative agent"', 'Declarative agent manifest authoring']],
    recipes: [['manifest-guide.md', 'Declarative agent manifest structure and fields'], ['action-setup.md', 'Configure OpenAPI actions for declarative agents']],
  },
  D: {
    name: 'Canvas App + Copilot Agent',
    description: 'one-sentence summary of your canvas app',
    stack: 'Power Apps Canvas + AI Builder',
    prereqs: 'Power Apps license, Power Platform environment',
    msLearn: 'https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/',
    agentName: 'Canvas Companion', agentRole: 'Canvas app design, Power Fx, and AI Builder', agentFile: 'canvas-companion.md',
    skills: [['canvas-agent', '"build canvas app"', 'Canvas app authoring and Power Fx patterns']],
    recipes: [['powerfx-patterns.md', 'Common Power Fx formulas and patterns'], ['data-connections.md', 'Connect canvas apps to data sources'], ['dataverse-connector.md', 'Dataverse table design and connector setup']],
  },
  E: {
    name: 'Power Automate',
    description: 'one-sentence summary of your automation flow',
    stack: 'Power Automate + AI Builder',
    prereqs: 'Power Automate license, Power Platform environment',
    msLearn: 'https://learn.microsoft.com/en-us/power-automate/',
    agentName: 'Flow Architect', agentRole: 'Power Automate flow design and AI Builder integration', agentFile: 'flow-architect.md',
    skills: [['power-automate', '"build flow"', 'Power Automate flow patterns and AI Builder']],
    recipes: [['flow-patterns.md', 'Common Power Automate flow patterns'], ['trigger-setup.md', 'Configure automated, scheduled, and instant triggers'], ['data-connections.md', 'Connect flows to data sources and connectors']],
  },
  F: {
    name: 'PCF Code Component',
    description: 'one-sentence summary of your PCF component',
    stack: 'TypeScript + PCF Framework + pac CLI',
    prereqs: 'Node.js ≥16, pac CLI, Power Platform environment',
    msLearn: 'https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview',
    agentName: 'Component Engineer', agentRole: 'PCF component development, TypeScript, and pac CLI', agentFile: 'component-engineer.md',
    skills: [['pcf-component', '"build PCF component"', 'PCF TypeScript component authoring and deployment']],
    recipes: [['pcf-component.ts', 'TypeScript PCF component scaffold'], ['pcf-manifest.md', 'ControlManifest.Input.xml structure and field reference']],
  },
  G: {
    name: 'Power BI',
    description: 'one-sentence summary of your Power BI report',
    stack: 'Power BI Desktop + Power BI Service',
    prereqs: 'Power BI Pro or Premium license',
    msLearn: 'https://learn.microsoft.com/en-us/power-bi/',
    agentName: 'Report Architect', agentRole: 'Power BI data modeling, DAX, and report design', agentFile: 'report-architect.md',
    skills: [['powerbi-report', '"build Power BI report"', 'Power BI data modeling and visualization patterns']],
    recipes: [['report-setup.md', 'Power BI report structure and publishing workflow'], ['data-model.md', 'Star schema design and relationship best practices']],
  },
  H: {
    name: 'SharePoint + Teams',
    description: 'one-sentence summary of your SharePoint/Teams solution',
    stack: 'Microsoft 365 Copilot + SharePoint',
    prereqs: 'Microsoft 365 Copilot license, SharePoint admin access',
    msLearn: 'https://learn.microsoft.com/en-us/sharepoint/introduction',
    agentName: 'Studio Guide', agentRole: 'SharePoint + Teams integration and Copilot configuration', agentFile: 'studio-guide.md',
    skills: [['sharepoint-agent', '"build SharePoint agent"', 'SharePoint Copilot agent and Teams integration']],
    recipes: [['sharepoint-connector.md', 'SharePoint data connector and permissions setup'], ['topics-guide.md', 'Author topics, trigger phrases, and responses']],
  },
  I: {
    name: 'Power Pages',
    description: 'one-sentence summary of your Power Pages site',
    stack: 'Power Pages + Dataverse + AI Plugin',
    prereqs: 'Power Pages license, Power Platform environment',
    msLearn: 'https://learn.microsoft.com/en-us/power-pages/',
    agentName: 'Studio Guide', agentRole: 'Power Pages site design and Dataverse integration', agentFile: 'studio-guide.md',
    skills: [['power-pages', '"build Power Pages site"', 'Power Pages site authoring and AI plugin integration']],
    recipes: [['dataverse-connector.md', 'Dataverse table design and connector setup for Power Pages']],
  },
};

function buildForgeTemplate(letter, cfg) {
  const skillRows = [
    ...cfg.skills.map(([skill, trigger, desc]) => `| ${skill} | ${trigger} | ${desc} |`),
    '| forge-compass | "which path" | Build-path selection and routing |',
    '| power-platform-guide | "platform docs" | Power Platform MS Learn references |',
  ].join('\n');

  const recipeRows = cfg.recipes
    .map(([recipe, desc]) => `| ${recipe} | ${desc} |`)
    .join('\n');

  return `# FORGE.md — [Your Project Name]

<!-- copilotforge: v${VERSION} -->
<!-- copilotforge: path=${letter} -->

## Project Summary
- **Build Path:** ${letter} — ${cfg.name}
- **Description:** [${cfg.description}]
- **Stack:** ${cfg.stack}
- **Prerequisites:** ${cfg.prereqs}
- **MS Learn:** ${cfg.msLearn}

## Team Roster
Agents live in \`.copilot/agents/\` and handle different aspects of your project.

| Agent | Role | File |
|-------|------|------|
| ${cfg.agentName} | ${cfg.agentRole} | \`.copilot/agents/${cfg.agentFile}\` |
| Planner | Orchestrator — runs the wizard | \`.copilot/agents/planner.md\` |

## Skills Index
Skills live in \`.github/skills/\` and teach agents how to handle specific triggers.

| Skill | Trigger | Description |
|-------|---------|-------------|
${skillRows}

## Cookbook
Recipes live in \`cookbook/\` and provide copy-paste patterns.

| Recipe | Description |
|--------|-------------|
${recipeRows}

## Memory
- forge-memory/decisions.md
- forge-memory/patterns.md
- forge-memory/preferences.md
- forge-memory/history.md

## Settings
- Verbosity: normal
- Build Path: ${letter}
- Path Name: ${cfg.name}
`;
}

function getPlatformForge(forgePath) {
  const letter = forgePath && forgePath.toUpperCase();
  const cfg = PATH_CONFIG[letter];
  if (!cfg) {
    const { FORGE_MD } = require('./forge');
    return FORGE_MD; // Path J fallback
  }
  return buildForgeTemplate(letter, cfg);
}

module.exports = { getPlatformForge };
