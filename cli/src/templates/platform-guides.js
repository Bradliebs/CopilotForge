'use strict';

const COPILOT_STUDIO_GUIDE_MD = `# 🏗️ Copilot Studio — Build Enterprise Agents from VS Code

> **What this does:** Walks you through building and managing Copilot Studio agents
> entirely from VS Code. Clone agents from the cloud, edit YAML locally, sync back.
>
> **When to use this:** When you want to build conversational or autonomous agents
> on Microsoft's enterprise platform with full version control.
>
> **Prerequisites:**
> - VS Code installed
> - [Copilot Studio extension](https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.microsoft-copilot-studio) installed
> - Power Platform environment with Copilot Studio access
> - A Microsoft work or school account

---

## Step 1 — Install the Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Microsoft Copilot Studio"
4. Click **Install**

The extension adds agent-authoring capabilities directly in VS Code with YAML IntelliSense.

## Step 2 — Clone an Agent from Copilot Studio

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Copilot Studio: Clone Agent"
3. Sign in with your Power Platform account when prompted
4. Select the environment containing your agent
5. Choose the agent to clone

The agent's YAML definition downloads to your workspace. You'll see files like:
\`\`\`
my-agent/
├── agent.yaml          ← Main agent definition
├── topics/             ← Conversation flows
│   ├── greeting.yaml
│   └── fallback.yaml
├── tools/              ← External tool definitions
├── knowledge/          ← Knowledge sources
└── triggers/           ← What activates the agent
\`\`\`

## Step 3 — Edit Agent Components Locally

Edit any YAML file. The extension provides:
- **Syntax highlighting** for agent YAML
- **IntelliSense** — auto-complete for properties and values
- **Validation** — red squiggles for invalid configurations

### Example: Adding a new topic
Create a file in \`topics/\` with this structure:
\`\`\`yaml
kind: Topic
name: order-status
description: Handles customer order status inquiries
trigger:
  kind: Intent
  description: User asks about their order status
actions:
  - kind: Message
    text: "I can help you check your order status. What's your order number?"
\`\`\`

## Step 4 — Apply Changes to Copilot Studio

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Copilot Studio: Apply Changes"
3. Review the diff showing what will change
4. Confirm to push changes to your cloud environment

## Step 5 — Test Your Agent

1. Go to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Open your agent
3. Click "Test" to try a conversation
4. Verify your changes work as expected

## Step 6 — Version Control with Git

Since agents are now local YAML files, you can:
\`\`\`bash
git add .
git commit -m "feat: add order-status topic"
git push origin main
\`\`\`

Use pull requests for team review of agent changes.

---

## Tips

- **Start by cloning an existing agent** rather than creating from scratch — it's easier to learn the YAML format by example.
- **Use GitHub Copilot or Claude Code** while editing YAML — they understand the Copilot Studio format and can suggest topics, tools, and triggers.
- **The extension syncs both ways** — you can clone (cloud → local) and apply (local → cloud).

## Learn More

- [Copilot Studio VS Code extension overview](https://learn.microsoft.com/microsoft-copilot-studio/visual-studio-code-extension-overview)
- [Edit agent components locally](https://learn.microsoft.com/microsoft-copilot-studio/visual-studio-code-extension-edit-agent-components)
- [Synchronize changes](https://learn.microsoft.com/microsoft-copilot-studio/visual-studio-code-extension-synchronization)
- [GitHub: microsoft/vscode-copilotstudio](https://github.com/microsoft/vscode-copilotstudio)
`;

const COPILOT_STUDIO_AGENT_YAML = `# copilot-studio-agent.yaml — CopilotForge Cookbook Example
#
# WHAT THIS IS:
#   An example Copilot Studio agent definition in YAML format.
#   This is what you'll see when you clone an agent from Copilot Studio
#   to your local VS Code workspace.
#
# HOW TO USE:
#   1. Install the Copilot Studio VS Code extension
#   2. Clone an agent (this gives you real YAML files like this one)
#   3. Edit the YAML locally — the extension provides IntelliSense
#   4. Apply changes back to Copilot Studio
#
# NOTE: This is a simplified example for learning. Real agent definitions
#       may have more properties. See the extension docs for the full schema.

kind: Agent
name: project-helper
description: A helpful assistant that answers questions about your project
language: en

# Knowledge sources — what the agent can reference
knowledge:
  - kind: File
    name: project-docs
    description: Project documentation and guides
    files:
      - README.md
      - docs/GETTING-STARTED.md

# Topics — conversation flows the agent can handle
topics:
  - kind: Topic
    name: greeting
    description: Welcome message when conversation starts
    trigger:
      kind: OnConversationStart
    actions:
      - kind: Message
        text: "Hi! I'm your project helper. I can answer questions about the project, explain how things work, or help you get started. What would you like to know?"

  - kind: Topic
    name: explain-architecture
    description: Explains the project architecture
    trigger:
      kind: Intent
      description: User asks about architecture or how the project is structured
    actions:
      - kind: Message
        text: "Let me look at the project docs and explain the architecture..."
      - kind: SearchKnowledge
        source: project-docs
      - kind: GenerateAnswer

  - kind: Topic
    name: fallback
    description: Handles unrecognized requests
    trigger:
      kind: OnUnknownIntent
    actions:
      - kind: Message
        text: "I'm not sure about that. Try asking about the project architecture, getting started, or specific features."

# Settings
settings:
  orchestrator:
    enabled: true
  generativeAI:
    enabled: true
`;

const CODE_APPS_GUIDE_MD = `# 💻 Code Apps — Build Power Apps with React & TypeScript

> **What this does:** Walks you through creating a Power App using React and
> TypeScript code instead of the traditional low-code canvas editor.
>
> **When to use this:** When you want the full power of a code IDE (VS Code)
> combined with Power Platform's data connectors and enterprise features.
>
> **Prerequisites:**
> - Node.js LTS (18+)
> - [Power Platform CLI](https://learn.microsoft.com/power-platform/developer/cli/introduction) (\`pac\`)
> - Power Platform environment with [code apps enabled](https://learn.microsoft.com/power-apps/developer/code-apps/overview#enable-code-apps-on-a-power-platform-environment)
> - A Microsoft work or school account

---

## Step 1 — Scaffold Your App

Open a terminal and run:

\`\`\`bash
npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app
cd my-app
\`\`\`

This creates a Vite-based React/TypeScript project pre-configured for Power Apps.

## Step 2 — Authenticate with Power Platform

\`\`\`bash
pac auth create
\`\`\`

Sign in with your Power Platform account when prompted. This connects your local tools to your cloud environment.

Then select your target environment:

\`\`\`bash
pac env select --environment <your-environment-id>
\`\`\`

> **How to find your environment ID:** Go to [Power Platform admin center](https://admin.powerplatform.microsoft.com), click your environment, and copy the ID from the URL.

## Step 3 — Install and Initialize

\`\`\`bash
npm install
pac code init --displayname "My First Code App"
\`\`\`

This:
- Installs the \`@microsoft/power-apps\` client library
- Creates a \`power.config.json\` file linking your app to Power Platform
- Sets up the connection between your code and the platform

## Step 4 — Run Locally

\`\`\`bash
npm run dev
\`\`\`

Open the **Local Play** URL shown in the terminal. Use the same browser profile as your Power Platform account.

> ⚠️ **Browser note:** Chrome and Edge may block localhost connections. If you see an error, grant permission for local network access in your browser settings.

## Step 5 — Build and Publish

When you're ready to deploy:

\`\`\`bash
npm run build | pac code push
\`\`\`

This compiles your React app and publishes it to Power Platform. You'll get a Power Apps URL to share with users.

## Step 6 — Connect to Data (Optional)

Code Apps can use Power Platform connectors for data. To add a connector:

\`\`\`bash
pac code add-connection --connector <connector-name>
\`\`\`

This generates TypeScript models and services in your project that you import and use like any other TypeScript module.

---

## Architecture Overview

\`\`\`
Your React/TypeScript Code
        ↓
Power Apps Client Library (@microsoft/power-apps)
        ↓
Power Platform Connectors (SharePoint, Dataverse, SQL, etc.)
        ↓
Data Sources
\`\`\`

The \`power.config.json\` file manages metadata. The client library handles authentication, connector access, and hosting integration. Your code stays as standard React/TypeScript.

## Tips

- **Start with the Vite template** — it has everything pre-configured.
- **Use \`npm run dev\` frequently** — hot reload works, so you see changes instantly.
- **Connectors give you enterprise data** — SharePoint lists, Dataverse tables, SQL databases, and 1000+ other sources, all with built-in auth.

## Learn More

- [Create a code app from scratch](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/create-an-app-from-scratch)
- [Code apps architecture](https://learn.microsoft.com/power-apps/developer/code-apps/architecture)
- [System limits and configuration](https://learn.microsoft.com/power-apps/developer/code-apps/system-limits-configuration)
- [Connect your code app to data](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/connect-to-data)
`;

const CODE_APPS_SETUP_TS = `/**
 * code-apps-setup.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Checks prerequisites for Power Apps Code Apps development and guides
 *   you through the initial setup. Verifies Node.js, PAC CLI, and
 *   Power Platform authentication are properly configured.
 *
 * WHEN TO USE THIS:
 *   Before starting your first Code App. Catches missing dependencies
 *   early so you don't hit errors mid-setup.
 *
 * HOW TO RUN:
 *   npx ts-node cookbook/code-apps-setup.ts
 *   Or: node cookbook/code-apps-setup.ts (if compiled)
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *
 * EXPECTED OUTPUT:
 *   🔍 Code Apps Prerequisites Check
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   ✅ Node.js     v20.11.0 (LTS — good!)
 *   ✅ npm         v10.2.0
 *   ❌ PAC CLI     Not found — install: npm install -g @microsoft/pac-cli
 *   ⚠️  Auth       Run 'pac auth create' after installing PAC CLI
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { execSync } from "node:child_process";

// --- ANSI helpers ---
const c = {
  reset: "\\x1b[0m",
  bold: "\\x1b[1m",
  dim: "\\x1b[2m",
  green: "\\x1b[32m",
  red: "\\x1b[31m",
  yellow: "\\x1b[33m",
  cyan: "\\x1b[36m",
};

const ok = \`\${c.green}✅\${c.reset}\`;
const fail = \`\${c.red}❌\${c.reset}\`;
const warn = \`\${c.yellow}⚠️\${c.reset}\`;
const line = "━".repeat(44);

interface CheckResult {
  label: string;
  status: "ok" | "fail" | "warn";
  detail: string;
}

function runCmd(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

function checkNode(): CheckResult {
  const version = runCmd("node --version");
  if (!version) return { label: "Node.js", status: "fail", detail: "Not found — install from https://nodejs.org" };
  const major = parseInt(version.replace("v", "").split(".")[0], 10);
  if (major < 18) return { label: "Node.js", status: "warn", detail: \`\${version} (need 18+ LTS)\` };
  return { label: "Node.js", status: "ok", detail: \`\${version} (LTS — good!)\` };
}

function checkNpm(): CheckResult {
  const version = runCmd("npm --version");
  if (!version) return { label: "npm", status: "fail", detail: "Not found — comes with Node.js" };
  return { label: "npm", status: "ok", detail: \`v\${version}\` };
}

function checkPac(): CheckResult {
  const version = runCmd("pac --version");
  if (!version) return { label: "PAC CLI", status: "fail", detail: "Not found — install: dotnet tool install -g Microsoft.PowerApps.CLI.Tool" };
  return { label: "PAC CLI", status: "ok", detail: version };
}

function checkPacAuth(): CheckResult {
  const output = runCmd("pac auth list");
  if (!output) return { label: "Auth", status: "warn", detail: "Run 'pac auth create' to authenticate" };
  if (output.includes("No profiles")) return { label: "Auth", status: "warn", detail: "No auth profiles — run 'pac auth create'" };
  return { label: "Auth", status: "ok", detail: "Authenticated" };
}

function formatResult(r: CheckResult): string {
  const icon = r.status === "ok" ? ok : r.status === "fail" ? fail : warn;
  return \`  \${icon} \${r.label.padEnd(12)} \${c.dim}\${r.detail}\${c.reset}\`;
}

// --- Main ---
console.log(\`\\n  \${c.bold}🔍 Code Apps Prerequisites Check\${c.reset}\`);
console.log(\`  \${c.dim}\${line}\${c.reset}\`);

const checks = [checkNode(), checkNpm(), checkPac(), checkPacAuth()];
checks.forEach((r) => console.log(formatResult(r)));

console.log(\`  \${c.dim}\${line}\${c.reset}\`);

const failures = checks.filter((r) => r.status === "fail");
const warnings = checks.filter((r) => r.status === "warn");

if (failures.length === 0 && warnings.length === 0) {
  console.log(\`\\n  \${c.green}\${c.bold}All good!\${c.reset} You're ready to create a Code App.\`);
  console.log(\`  Run: \${c.cyan}npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app\${c.reset}\\n\`);
} else if (failures.length === 0) {
  console.log(\`\\n  \${c.yellow}\${c.bold}Almost there!\${c.reset} Fix the warnings above, then you're ready.\`);
  console.log(\`  Guide: \${c.cyan}cookbook/code-apps-guide.md\${c.reset}\\n\`);
} else {
  console.log(\`\\n  \${c.red}\${c.bold}Some things need fixing.\${c.reset} See the ❌ items above.\`);
  console.log(\`  Guide: \${c.cyan}cookbook/code-apps-guide.md\${c.reset}\\n\`);
}
`;

const COPILOT_AGENTS_GUIDE_MD = `# 🧩 Custom Agents — Create Specialized GitHub Copilot Profiles

> **What this does:** Walks you through creating custom agent profiles
> (\`.agent.md\` files) for GitHub Copilot. Each agent gets its own
> personality, tools, and expertise.
>
> **When to use this:** When you want specialized AI assistants for
> different tasks — a test writer, a code reviewer, a documentation
> expert, a security auditor — each with tailored instructions.
>
> **Prerequisites:**
> - GitHub Copilot subscription (Pro, Pro+, Business, or Enterprise)
> - VS Code with GitHub Copilot extension, or access to GitHub.com

---

## Step 1 — Create the Agents Directory

In your repository, create a \`.github/agents/\` directory:

\`\`\`bash
mkdir -p .github/agents
\`\`\`

This is where all your custom agent profiles live.

## Step 2 — Create an Agent Profile

Create a file with the pattern \`{name}.agent.md\`. For example, \`test-writer.agent.md\`:

\`\`\`bash
touch .github/agents/test-writer.agent.md
\`\`\`

> **Naming rules:** Filenames can only contain: \`.\`, \`-\`, \`_\`, \`a-z\`, \`A-Z\`, \`0-9\`

## Step 3 — Configure the YAML Frontmatter

Open the file and add YAML frontmatter at the top:

\`\`\`yaml
---
name: test-writer
description: Writes comprehensive tests with high coverage and clear descriptions
tools: ["read", "edit", "search", "shell"]
model: claude-sonnet-4
---
\`\`\`

**Properties explained:**
| Property | Required | What it does |
|----------|----------|--------------|
| \`name\` | No | Display name (defaults to filename) |
| \`description\` | **Yes** | What the agent does — Copilot uses this to decide when to suggest it |
| \`tools\` | No | Which tools the agent can use (omit = all tools available) |
| \`model\` | No | AI model preference (VS Code/JetBrains only) |
| \`mcp-servers\` | No | MCP server configurations for extended capabilities |

## Step 4 — Write the System Prompt

Below the frontmatter, write instructions in Markdown:

\`\`\`markdown
You are a testing specialist focused on improving code quality through
comprehensive testing. Your responsibilities:

- Analyze existing tests and identify coverage gaps
- Write unit tests, integration tests, and end-to-end tests
- Follow the project's existing test patterns and conventions
- Use the test framework already configured in the project
- Focus only on test files — avoid modifying production code
- Always include clear test descriptions

When writing tests:
1. Read the source file to understand the API
2. Check for existing tests to match the style
3. Write tests that cover happy paths, edge cases, and error cases
4. Run tests to verify they pass before finishing
\`\`\`

## Step 5 — Commit and Use

\`\`\`bash
git add .github/agents/test-writer.agent.md
git commit -m "feat: add test-writer custom agent"
git push
\`\`\`

In VS Code: Open Copilot Chat → click the agents dropdown → select **test-writer**.

On GitHub.com: Go to the agents tab → select **test-writer** from the dropdown.

---

## More Examples

### Code Reviewer Agent
\`\`\`yaml
---
name: code-reviewer
description: Reviews code for bugs, security issues, and best practices
tools: ["read", "search"]
---
You are a code review specialist. Review changes for:
- Logic errors and potential bugs
- Security vulnerabilities (injection, auth bypass, data exposure)
- Performance issues (N+1 queries, unnecessary allocations)
- Best practices for the language and framework in use

Only flag real issues. Never comment on style or formatting.
\`\`\`

### Documentation Agent
\`\`\`yaml
---
name: docs-writer
description: Writes and updates project documentation
tools: ["read", "edit", "search"]
---
You are a documentation specialist. Write clear, concise docs that:
- Explain the "why" not just the "what"
- Include code examples for every concept
- Use simple language (no jargon without definitions)
- Follow the project's existing documentation style
\`\`\`

### Security Auditor Agent (with MCP)
\`\`\`yaml
---
name: security-auditor
description: Audits code for security vulnerabilities and compliance issues
tools: ["read", "search", "security-scanner"]
mcp-servers:
  security-scanner:
    command: npx
    args: ["-y", "@example/security-mcp"]
---
You are a security specialist. Audit code for OWASP Top 10 vulnerabilities,
check dependency versions for known CVEs, and verify auth patterns.
\`\`\`

---

## Tips

- **Start simple** — create one agent, use it, then iterate. You can always add more tools and instructions later.
- **The \`description\` matters most** — Copilot reads it to decide when to suggest the agent. Be specific about what tasks the agent handles.
- **Omit \`tools\` to give full access** — only restrict tools when you want the agent to be read-only or limited.
- **Custom agents work everywhere** — VS Code, JetBrains, Eclipse, Xcode, GitHub.com, and the Copilot CLI.
- **Combine with CopilotForge skills** — your custom agents can reference skills in \`.github/skills/\` for even more specialized behavior.

## Learn More

- [Create custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-custom-agents)
- [Test custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/test-custom-agents)
- [Add skills to agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/add-skills)
- [Custom agents configuration reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [awesome-copilot agent examples](https://github.com/github/awesome-copilot/tree/main/agents)
`;

const COPILOT_AGENTS_EXAMPLE_MD = `---
name: project-expert
description: Answers questions about this project's architecture, conventions, and codebase
tools: ["read", "search"]
---

You are an expert on this project. When answering questions:

1. **Read first** — always look at the relevant source files before answering.
2. **Be specific** — reference exact file names, function names, and line numbers.
3. **Explain the why** — don't just describe what the code does, explain the design decisions.
4. **Use project conventions** — follow the patterns established in this codebase.

When asked about architecture:
- Start with the high-level overview (what the project does)
- Explain the directory structure and what lives where
- Describe how components interact
- Reference any documentation in \`docs/\` or \`README.md\`

When asked about a specific file or function:
- Read the file
- Explain its purpose and how it fits into the larger system
- Note any important dependencies or side effects
- Suggest related files the user might want to look at

Keep answers concise but thorough. Use code blocks for examples.
`;

module.exports = {
  COPILOT_STUDIO_GUIDE_MD,
  COPILOT_STUDIO_AGENT_YAML,
  CODE_APPS_GUIDE_MD,
  CODE_APPS_SETUP_TS,
  COPILOT_AGENTS_GUIDE_MD,
  COPILOT_AGENTS_EXAMPLE_MD,
};