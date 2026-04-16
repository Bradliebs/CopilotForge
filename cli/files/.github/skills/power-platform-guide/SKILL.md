---
name: "power-platform-guide"
description: "Routing oracle and per-path reference for all 10 Power Platform build paths — maps Q1/PP diagnostic answers to a BUILD_PATH letter and provides a self-contained guide for each path"
domain: "scaffolding"
confidence: "high"
source: "manual — Phase 13 core deliverable"
triggers:
  - "which path am I on?"
  - "power platform guide"
  - "route my project"
  - "show me path"
  - "what is path"
  - "power platform paths"
---

<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     For the human-friendly guide, see docs/GETTING-STARTED.md -->

# Power Platform Guide

> The routing oracle and per-path reference for CopilotForge's Power Platform coverage. Invoked internally by the Planner after PP diagnostic resolution — or directly by users asking "which path am I on?" or "show me path F?".

## What This Does

This skill serves two purposes:

1. **Routing oracle** — Maps answers from Q1 (project description), PP-Q1 (no-code vs TypeScript/C#), PP-Q2 (connector needed?), and PP-Q3 (output type) to a `BUILD_PATH` letter (A–J). Writes the result into the FORGE-CONTEXT block so all downstream specialists receive consistent routing.

2. **Per-path guide** — Provides a self-contained reference for each path: who it's for, prerequisites, what gets generated, the primary MS Learn URL, and a day-one checklist. Each path section is independently readable — no other context is needed.

**This skill never asks questions.** It reads the FORGE-CONTEXT block, applies the routing table, and either writes a `BUILD_PATH` or surfaces a single tiebreaker question when the answer is genuinely ambiguous.

---
### Capture Decisions (forge remember)

If the user says **"forge remember: [anything]"** at any point in this conversation,
immediately acknowledge it ("Got it — logging that.") and append a new entry to
`forge-memory/decisions.md` in this format:

```
## [YYYY-MM-DD] [brief label]
[the user's exact words]
```

Then continue the conversation without interruption. Do not ask for confirmation.


## Section 1 — Routing Table

### Input Fields

| Field | Source | Values |
|-------|--------|--------|
| `PP-Q1` | Planner diagnostic | `no-code` or `TypeScript/C#` |
| `PP-Q2` | Planner diagnostic | `yes` (connector needed) or `no` |
| `PP-Q3` | Planner diagnostic | `agent`, `agent (declarative)`, `agent (SharePoint/Teams)`, `app`, `flow`, `component`, `report`, `page` |
| Q1 signals | Forge Compass output | PP_SIGNALS and DEV_SIGNALS classification |

### Decision Matrix

| PP-Q1 | PP-Q2 | PP-Q3 | BUILD_PATH | PATH_NAME |
|-------|-------|-------|------------|-----------|
| no-code | no | agent | A | Copilot Studio Agent |
| no-code | yes | agent | B | Studio + Custom Connector |
| no-code | no | agent (declarative) | C | Declarative Agent |
| no-code | no | app | D | Canvas App + Copilot Agent |
| no-code | no | flow | E | Power Automate + AI Builder |
| TypeScript/C# | any | component | F | PCF Code Component |
| no-code | no | report | G | Power BI Report |
| no-code | no | agent (SharePoint/Teams) | H | SharePoint + Teams Copilot |
| no-code | no | page | I | Power Pages + AI Plugin |
| no signals | — | — | J | Developer Project |

### Routing Logic

Apply the matrix in order. Stop at the first row that matches all provided inputs. When PP-Q2 is listed as `any`, it matches regardless of the user's answer.

**If no PP diagnostic answers are present** (Q1 contained no Power Platform signals), default to `BUILD_PATH: J`.

**If PP-Q3 is absent** (user answered PP-Q1 but skipped PP-Q3), surface a single clarifying question:

> What is the primary output of your project?
> **1.** A conversational agent (chatbot)
> **2.** An app users interact with
> **3.** An automated flow or background process
> **4.** A TypeScript/C# code component
> **5.** A report or dashboard
> **6.** A public-facing website

Map the answer to PP-Q3 and re-apply the matrix.

---

## Section 2 — Per-Path Guides

---

### Path A — Copilot Studio Agent

**Who it's for:** Someone building a no-code conversational agent in Microsoft Copilot Studio — no programming required, just a browser and a Microsoft 365 account.

**Prerequisites:**
- Microsoft 365 license that includes Copilot Studio access (standalone or Microsoft 365 Copilot bundle)
- Modern browser (Edge or Chrome recommended)
- No coding knowledge required

**What gets generated:**
- `studio-agent` skill — Copilot Studio authoring conventions and topic design patterns
- `studio-agent.md` agent definition — pre-wired to the studio-agent skill
- `cookbook/topics-guide.md` — topic structure patterns, entity extraction, adaptive card examples

**MS Learn anchor:** https://learn.microsoft.com/en-us/microsoft-copilot-studio/

**Day-one checklist:**
1. Sign in at [copilotstudio.microsoft.com](https://copilotstudio.microsoft.com) and confirm your license includes Copilot Studio.
2. Create a new agent — choose "Start from blank" to follow the scaffolded structure.
3. Add your first topic using the Topics canvas; use the generated `topics-guide.md` for naming and branching patterns.
4. Test in the built-in test chat pane before publishing.
5. Publish to Teams or a web channel when the core conversation flow is working.

---

### Path B — Studio + Custom Connector

**Who it's for:** Someone building a Copilot Studio agent that calls an external REST API — you have a working API endpoint and want your agent to use it.

**Prerequisites:**
- All Path A prerequisites
- A working REST API endpoint (URL, authentication method, and at least one tested endpoint)
- An OpenAPI (Swagger) spec for the API, or enough documentation to build one

**What gets generated:**
- `studio-connector` skill — connector authoring conventions, authentication patterns, action mapping
- `studio-agent.md` agent definition — includes connector action invocation guidance
- `cookbook/connector-setup.md` — step-by-step custom connector creation from an OpenAPI spec
- `cookbook/api-auth-guide.md` — OAuth 2.0, API key, and basic auth setup patterns for connectors

**MS Learn anchor:** https://learn.microsoft.com/en-us/connectors/custom-connectors/

**Day-one checklist:**
1. Validate your API endpoint is publicly reachable (or accessible via a gateway) and returns a documented response.
2. Export or author an OpenAPI 2.0 spec — use the `connector-setup.md` template as a starting point.
3. In Power Automate or Power Apps, navigate to **Custom connectors → New connector → Import an OpenAPI file**.
4. Add the connector to your Copilot Studio agent as a plugin action — test each action in isolation first.
5. Wire the action into a topic trigger so the agent calls the API when the right phrase is detected.

---

### Path C — Declarative Agent

**Who it's for:** Someone building a no-code declarative agent using Microsoft 365 Agent Builder — extends Microsoft 365 Copilot with custom knowledge and instructions, no separate Copilot Studio license needed.

**Prerequisites:**
- Microsoft 365 Copilot license (Business or Enterprise)
- Teams administrator access (or permission from your admin to sideload apps)
- Familiarity with JSON is helpful but not required

**What gets generated:**
- `declarative-agent` skill — declarative agent manifest conventions, knowledge source configuration
- `declarative-agent.md` agent definition — pre-wired to declarative-agent skill
- `cookbook/manifest-guide.md` — annotated `declarativeAgent.json` template with all supported fields

**MS Learn anchor:** https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/

**Day-one checklist:**
1. Confirm your Microsoft 365 Copilot license is active at [admin.microsoft.com](https://admin.microsoft.com).
2. Open Microsoft 365 Agent Builder (Copilot Studio → **Create → New agent → Agent Builder**).
3. Give the agent a name, description, and instructions — use the `manifest-guide.md` instructions field pattern.
4. Add at least one knowledge source (SharePoint site, uploaded file, or website URL).
5. Test in the Agent Builder preview pane, then publish to Teams for user testing.

---

### Path D — Canvas App + Copilot Agent

**Who it's for:** Someone building a Power Apps canvas app with an embedded AI agent — gives you a custom UI with conversational AI built in, all without writing code.

**Prerequisites:**
- Power Apps license (per-app, per-user, or Microsoft 365 E3/E5 with Power Apps included)
- Power Platform environment (created by your admin or your own developer environment)
- Basic familiarity with Power Apps Studio (drag-and-drop canvas)

**What gets generated:**
- `canvas-agent` skill — canvas app design patterns, Power Fx formula conventions, AI control integration
- `canvas-agent.md` agent definition — pre-wired to canvas-agent skill
- `cookbook/powerfx-patterns.md` — commonly used Power Fx formulas for data binding and navigation
- `cookbook/data-connections.md` — connecting canvas apps to Dataverse, SharePoint, and SQL

**MS Learn anchor:** https://learn.microsoft.com/en-us/power-apps/

**Day-one checklist:**
1. Sign in at [make.powerapps.com](https://make.powerapps.com) and confirm your environment is set to the correct region.
2. Create a new canvas app — choose **Blank app (tablet layout)** for the most control.
3. Add a Copilot control from the Insert panel — this embeds a conversational AI component directly in your canvas.
4. Connect to your primary data source using the `data-connections.md` guide (Dataverse is recommended for first-time users).
5. Use `powerfx-patterns.md` to wire up form submissions, navigation between screens, and conditional visibility.

---

### Path E — Power Automate + AI Builder

**Who it's for:** Someone building automated flows with AI processing steps — ideal for document processing, approval workflows, or scheduled data operations that need AI-powered decisions.

**Prerequisites:**
- Power Automate license (per-user, per-flow, or included in Microsoft 365 E3/E5)
- Power Platform environment
- AI Builder add-on credits (required for AI Builder models — check with your admin)

**What gets generated:**
- `power-automate` skill — flow design patterns, trigger selection guide, AI Builder model integration
- `automate-agent.md` agent definition — pre-wired to power-automate skill
- `cookbook/flow-patterns.md` — reusable flow structures for approvals, notifications, and data sync
- `cookbook/trigger-setup.md` — automated, instant, and scheduled trigger configuration with examples

**MS Learn anchor:** https://learn.microsoft.com/en-us/power-automate/

**Day-one checklist:**
1. Sign in at [make.powerautomate.com](https://make.powerautomate.com) and confirm your license includes the flow type you need (automated flows require a trigger, instant flows are manually started).
2. Create a new flow — choose **Automated cloud flow** for event-driven processing or **Scheduled cloud flow** for recurring operations.
3. Add an AI Builder action step — choose a pre-built model (e.g., **Extract information from documents**) or train a custom model.
4. Use `flow-patterns.md` to add approval steps, condition branches, and error handling.
5. Test with a real document or event before enabling for production traffic.

---

### Path F — PCF Code Component

**Who it's for:** A developer building a TypeScript code component for Power Apps or model-driven apps — you write real code that renders inside Power Apps as a reusable, deployable control.

**Prerequisites:**
- Node.js ≥ 16 (LTS recommended; verify with `node --version`)
- Power Platform CLI (`pac`) installed — see [pac CLI installation](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- Power Platform environment with system customizer or system administrator role
- VS Code with the Power Platform Tools extension (recommended)
- Basic TypeScript knowledge

**What gets generated:**
- `pcf-component` skill — PCF lifecycle conventions, TypeScript interface requirements, manifest authoring
- `pcf-agent.md` agent definition — pre-wired to pcf-component skill
- `cookbook/pcf-component.ts` — annotated TypeScript starter implementing the StandardControl interface
- `cookbook/pcf-manifest.md` — annotated `ControlManifest.Input.xml` with all property types documented

**MS Learn anchor:** https://learn.microsoft.com/en-us/power-apps/developer/component-framework/

#### PCF Control Lifecycle

Every PCF control implements four lifecycle methods. Implement all four — the platform calls them in this order:

| Method | When it fires | What to do |
|--------|---------------|------------|
| `init(context, notifyOutputChanged, state, container)` | Component first loads | Initialize state, build DOM, attach event listeners |
| `updateView(context)` | Context or property changes | Re-render with new data — treat as idempotent |
| `getOutputs()` | After `notifyOutputChanged()` is called | Return output property values back to the platform |
| `destroy()` | Component is removed | Clean up event listeners, timers, and subscriptions |

**Key rule:** Call `notifyOutputChanged()` whenever an output property value changes — this signals the platform to call `getOutputs()`.

#### TypeScript Interfaces

| Interface | Use case |
|-----------|----------|
| `ComponentFramework.StandardControl<IInputs, IOutputs>` | Standard controls — most PCF components use this |
| `ComponentFramework.ReactControl<IInputs, IOutputs>` | React-based controls — enables virtual rendering, no direct DOM manipulation |

For React controls, export a function component via `getOutputs()` instead of manipulating `container` directly.

#### pac CLI Quick Reference

```bash
# Initialize a new PCF project (field control or dataset control)
pac pcf init --namespace MyNamespace --name MyControl --template field
pac pcf init --namespace MyNamespace --name MyControl --template dataset

# Build and push to environment (requires active pac auth)
pac pcf push --publisher-prefix dev

# Initialize a solution for packaging
pac solution init --publisher-name MyPublisher --publisher-prefix dev

# Add the PCF project to the solution
pac solution add-reference --path ./MyControl

# Build the solution for distribution
msbuild /t:build /restore

# Authenticate to a Power Platform environment
pac auth create --url https://yourorg.crm.dynamics.com
```

**Day-one checklist:**
1. Run `pac auth create --url https://yourorg.crm.dynamics.com` to connect to your environment.
2. Run `pac pcf init --namespace YourNamespace --name YourControl --template field` to scaffold the project.
3. Open `YourControl/index.ts` and implement all four lifecycle methods — use `cookbook/pcf-component.ts` as the reference.
4. Edit `ControlManifest.Input.xml` to declare your input and output properties — see `cookbook/pcf-manifest.md`.
5. Run `pac pcf push --publisher-prefix dev` to push to your environment and test inside a model-driven app.

---

### Path G — Power BI Report / Semantic Model

**Who it's for:** Someone building a Power BI report or semantic model with AI-powered insights — transforms raw data into interactive dashboards with natural-language Q&A and smart narratives.

**Prerequisites:**
- Power BI Pro license (or Premium Per User) — required for publishing and sharing
- Power BI Desktop installed (free download from [powerbi.microsoft.com](https://powerbi.microsoft.com)) — recommended for model authoring
- Access to your data source (database connection string, file path, or API credentials)

**What gets generated:**
- `powerbi-report` skill — data model design conventions, DAX formula patterns, report layout best practices
- `powerbi-agent.md` agent definition — pre-wired to powerbi-report skill
- `cookbook/report-setup.md` — step-by-step guide for connecting to data, building a star schema, and publishing
- `cookbook/data-model.md` — semantic model conventions: measure naming, relationship cardinality, and calculation groups

**MS Learn anchor:** https://learn.microsoft.com/en-us/power-bi/

**Day-one checklist:**
1. Open Power BI Desktop and connect to your data source — use **Home → Get data** and select your connector.
2. Load and transform data in Power Query — clean nulls, set correct data types, and remove unused columns before loading.
3. Build a star schema: one fact table, dimension tables, and relationships set to single-direction — use `data-model.md` conventions for naming.
4. Write your first measure in DAX using the `report-setup.md` template patterns (`CALCULATE`, `DIVIDE` for safe division).
5. Publish to Power BI Service (**Home → Publish**) and share the workspace link with stakeholders.

---

### Path H — SharePoint + Teams Copilot

**Who it's for:** Someone extending Microsoft 365 Copilot in SharePoint or Teams — surfaces org knowledge, documents, or workflows directly inside the tools your users already live in.

**Prerequisites:**
- Microsoft 365 Copilot license (Business or Enterprise)
- SharePoint administrator access (or site collection administrator on the target site)
- Teams administrator access for deploying the agent to Teams channels

**What gets generated:**
- `sharepoint-agent` skill — SharePoint knowledge source configuration, Teams channel deployment patterns
- `studio-agent.md` agent definition — scoped to Path H with SharePoint knowledge source preamble
- `cookbook/sharepoint-connector.md` — connecting SharePoint document libraries as knowledge sources, permissions checklist

**MS Learn anchor:** https://learn.microsoft.com/en-us/sharepoint/

**Day-one checklist:**
1. Identify the SharePoint site(s) that contain the knowledge your agent should surface — confirm the Copilot service account has read access.
2. In Copilot Studio, create a new agent and add your SharePoint site as a knowledge source under **Knowledge → Add knowledge → SharePoint**.
3. Set the agent's scope using the instructions field — be explicit about what topics it should and should not answer.
4. Use `sharepoint-connector.md` to configure permissions so only licensed users can interact with the agent.
5. Publish to Teams using the **Channels → Microsoft Teams** deployment option, then install the app in the target channel.

---

### Path I — Power Pages + AI Plugin

**Who it's for:** Someone building a public-facing website with AI-powered features using Power Pages — combines a no-code website builder with Dataverse data and conversational AI for external users.

**Prerequisites:**
- Power Pages license (standalone or included in certain Dynamics 365 bundles)
- Power Platform environment with Dataverse enabled
- A Dataverse table containing the data or content the site will display

**What gets generated:**
- `power-pages` skill — Power Pages site design conventions, Liquid templating patterns, Dataverse integration
- `studio-agent.md` agent definition — scoped to Path I with Power Pages and Dataverse preamble
- `cookbook/dataverse-connector.md` — connecting Power Pages to Dataverse tables, column permissions, and web roles

**MS Learn anchor:** https://learn.microsoft.com/en-us/power-pages/

**Day-one checklist:**
1. Sign in at [make.powerpages.microsoft.com](https://make.powerpages.microsoft.com) and create a new site — choose a starter template that matches your use case.
2. Connect the site to your Dataverse table using the Data workspace — confirm table permissions and column-level security.
3. Add an AI-powered chatbot to the site via **Set up → Chatbot** — this embeds a Copilot Studio agent as a site widget.
4. Use `dataverse-connector.md` to configure web roles so unauthenticated visitors only see the columns they're permitted to read.
5. Test the full visitor experience in preview mode before activating the site at a custom domain.

---

### Path J — Developer Project

**Who it's for:** A developer building a code project with Copilot skills, agents, and automation — the default path when no Power Platform signals are detected.

**Prerequisites:**
- Node.js (any LTS version), Git, and VS Code or any code editor
- No platform-specific licenses required

**What gets generated:**
- Standard CopilotForge scaffold (v1.5.0 output — unchanged from the base wizard flow)
- All generated files determined by Q2–Q6 wizard answers (stack, memory, testing, level, extras)

**MS Learn anchor:** *(none — this path is tool-agnostic)*

**Day-one checklist:**
1. Answer all six Planner wizard questions to generate the full scaffold.
2. Review `FORGE.md` — it is your project control panel and lists every generated file.
3. Customize `.copilot/agents/*.md` files to match your team's conventions.
4. Open `forge-memory/decisions.md` — add your first decision entry to start the project log.
5. Run the Planner again when you add new features — it will skip existing files and append to memory.

---

## Section 3 — Tiebreakers and Edge Cases

### Ambiguous Signal Combinations

When inputs conflict, apply exactly one tiebreaker rule and stop — do not apply multiple rules or chain them.

**Rule T1 — "agent" + "TypeScript":**
User mentions building an agent AND uses TypeScript/code language. These signals point to different paths (A or C vs F).

> Are you building a **PCF code component** (a TypeScript control that renders inside Power Apps) or a **Copilot Studio agent** that you'll configure with code actions?
> **1.** PCF component → route to **Path F**
> **2.** Copilot Studio agent → route to **Path A** or **Path C** (continue diagnostic)

**Rule T2 — "report" + "agent":**
User mentions both a Power BI report and a conversational agent. These are different deliverables.

> Is the **primary deliverable** a Power BI report (a dashboard your users read) or a conversational agent (a chatbot your users talk to)?
> **1.** Power BI report → route to **Path G**
> **2.** Conversational agent → continue PP diagnostic to resolve Path A/C/H

**Rule T3 — Complete beginner, no path signals:**
User has not mentioned any Power Platform product and has no clear tech stack.

> Recommend **Path A — Copilot Studio Agent** as the safest starting point.
> Say exactly:
> "Since you're new to this, I'd suggest starting with **Path A — Copilot Studio Agent**. It's the fastest way to build something working without any code. Want to go that route, or do you have a specific tool in mind?"

**Rule T4 — "SharePoint" without "agent" or "Teams":**
User mentions SharePoint but not an agent or Teams context.

> Do not default to Path H. Ask:
> "Are you building a **conversational agent** that uses SharePoint as a knowledge source, or a **website/portal** built in SharePoint itself?"
> **1.** Conversational agent → Path H
> **2.** Website/portal → continue with standard developer diagnostic (likely Path J)

**Rule T5 — PP-Q1 is "TypeScript/C#" but PP-Q3 is not "component":**
Developer language selected but output type isn't a component.

> Do not force Path F. Ask:
> "You mentioned TypeScript or C# — are you building a **PCF code component** for Power Apps, or a **backend service** that connects to Power Platform?"
> **1.** PCF component → Path F
> **2.** Backend service → Path J (Developer Project)

### Edge Case: All Signals Present

If a user's description triggers signals for three or more paths simultaneously (rare, but possible for complex projects), route to Path J and note in the FORGE-CONTEXT:

```
BUILD_PATH: J
PATH_NAME: Developer Project
# Note: Multiple conflicting path signals detected. Defaulting to J pending clarification.
```

Surface a single summary question listing the detected signals and ask which path is primary.

---

## Trigger Phrases

This skill is triggered by the following phrases (case-insensitive):

- "which path am I on?" / "what path am I on?"
- "power platform guide"
- "route my project"
- "show me path [letter]" — e.g., "show me path F", "tell me about path A"
- "what is path [letter]?" — e.g., "what is path C?"
- Invoked internally by the Planner after PP diagnostic resolution (invisible to users)

When triggered with a specific path letter (e.g., "show me path F"), skip Section 1 entirely and jump directly to the matching path subsection in Section 2.

---

## FORGE-CONTEXT Fields Written

After routing is complete, this skill writes or confirms the following fields in the FORGE-CONTEXT block:

| Field | Value |
|-------|-------|
| `BUILD_PATH` | Letter A–J |
| `PATH_NAME` | Human-readable path name |
| `EXTENSION_REQUIRED` | `true` for paths B and F, `false` for all others |
| `MS_LEARN_ANCHOR` | Primary MS Learn URL for the path, or `null` for Path J |
| `PREREQUISITES_CONFIRMED` | `false` (default — set to `true` only after user confirms prerequisites) |
