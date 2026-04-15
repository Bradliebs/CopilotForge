/**
 * template-creator.ts — CopilotForge Cookbook Recipe
 *
 * Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/communicate-effectively/creating-templates
 *
 * WHAT THIS DOES:
 *   Generates reusable project templates (README, issue templates, PR templates,
 *   contributing guides, and more) using structured Copilot prompts. Ensures
 *   consistency across all your projects.
 *
 * WHEN TO USE THIS:
 *   When starting a new project and need standard templates, when you want to
 *   ensure all repos follow the same documentation format, or when you need to
 *   quickly scaffold project boilerplate.
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Set your API key:
 *        bash/zsh:     export COPILOT_API_KEY="your-key-here"
 *        PowerShell:   $env:COPILOT_API_KEY="your-key-here"
 *        Windows cmd:  set COPILOT_API_KEY=your-key-here
 *   3. npx ts-node cookbook/template-creator.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid Copilot API key
 *
 * EXPECTED OUTPUT:
 *   [TemplateCreator] Starting template generation...
 *   [Config] Project: my-api | Stack: Node.js + Express
 *   [Generate] Creating README template...
 *   [Generate] Creating CONTRIBUTING template...
 *   [Generate] Creating issue templates (bug, feature, question)...
 *   [Generate] Creating PR template...
 *   [Saved] 6 templates written to ./templates/
 *   [Done] Template suite ready — customize and commit!
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join()
 *   - macOS/Linux: Forward slashes work natively
 *   - Output files use LF line endings by default
 *
 * SOURCE:
 *   Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/communicate-effectively/creating-templates
 */

import * as fs from "fs";
import * as path from "path";

// --- Template types ---

type TemplateType =
  | "readme"
  | "contributing"
  | "issue-bug"
  | "issue-feature"
  | "issue-question"
  | "pull-request"
  | "changelog"
  | "code-of-conduct"
  | "docs-api"
  | "docs-getting-started";

interface TemplateConfig {
  projectName: string;
  stack: string;
  description: string;
  templateTypes: TemplateType[];
  outputDir: string;
  customSections?: string[];
}

interface GeneratedTemplate {
  type: TemplateType;
  filename: string;
  content: string;
}

// --- Types (simulating @github/copilot-sdk) ---

interface CopilotClientConfig {
  apiKey: string;
}

interface CopilotSession {
  id: string;
  send(message: string): Promise<string>;
  destroy(): void;
}

interface CopilotClient {
  start(): void;
  createSession(options: { sessionId: string }): CopilotSession;
  stop(): void;
}

// --- Mock SDK (replace with real import) ---
// TODO: Replace with: import { CopilotClient } from "@github/copilot-sdk";

function createCopilotClient(config: CopilotClientConfig): CopilotClient {
  return {
    start() {
      console.log("[TemplateCreator] Starting template generation...");
    },

    createSession(options: { sessionId: string }): CopilotSession {
      return {
        id: options.sessionId,
        async send(message: string): Promise<string> {
          // TODO: Replace mock with real Copilot SDK call
          return `[Mock response for: ${message.slice(0, 60)}...]`;
        },
        destroy() {},
      };
    },

    stop() {
      console.log("[Done] Template suite ready — customize and commit!");
    },
  };
}

// --- Prompt builder ---

const TEMPLATE_PROMPTS: Record<TemplateType, (config: TemplateConfig) => string> = {
  readme: (c) =>
    `Create a professional README.md for "${c.projectName}", a ${c.description} built with ${c.stack}. ` +
    `Include sections for: Overview, Features, Getting Started, Installation, Usage, ` +
    `Configuration, API Reference, Contributing, License.` +
    (c.customSections?.length ? ` Also include: ${c.customSections.join(", ")}.` : "") +
    ` Use clear markdown formatting with badges, code blocks, and a table of contents.`,

  contributing: (c) =>
    `Create a CONTRIBUTING.md for "${c.projectName}" (${c.stack}). ` +
    `Include sections for: How to Contribute, Development Setup, Coding Standards, ` +
    `Commit Message Format, Pull Request Process, Code Review Guidelines, ` +
    `Reporting Issues. Keep it beginner-friendly with step-by-step instructions.`,

  "issue-bug": (c) =>
    `Create a GitHub issue template for bug reports in "${c.projectName}" (${c.stack}). ` +
    `Use YAML front matter with name, description, title prefix, and labels. ` +
    `Include fields for: Bug Description, Steps to Reproduce, Expected Behavior, ` +
    `Actual Behavior, Environment (OS, ${c.stack} version), Screenshots, Additional Context.`,

  "issue-feature": (c) =>
    `Create a GitHub issue template for feature requests in "${c.projectName}". ` +
    `Use YAML front matter. Include fields for: Feature Description, Use Case, ` +
    `Proposed Solution, Alternatives Considered, Additional Context.`,

  "issue-question": (c) =>
    `Create a GitHub issue template for questions about "${c.projectName}". ` +
    `Use YAML front matter. Include fields for: Question, Context, ` +
    `What I've Tried, Related Documentation.`,

  "pull-request": (c) =>
    `Create a GitHub pull request template for "${c.projectName}" (${c.stack}). ` +
    `Include sections for: Description, Type of Change (bugfix/feature/breaking/docs), ` +
    `Testing Done, Checklist (tests pass, docs updated, lint clean), Related Issues.`,

  changelog: (c) =>
    `Create a CHANGELOG.md template for "${c.projectName}" following Keep a Changelog format. ` +
    `Include sections for: Unreleased, with subsections for Added, Changed, Deprecated, ` +
    `Removed, Fixed, Security. Add an example 1.0.0 entry.`,

  "code-of-conduct": (c) =>
    `Create a CODE_OF_CONDUCT.md for "${c.projectName}" based on the Contributor Covenant. ` +
    `Include sections for: Our Pledge, Our Standards, Enforcement Responsibilities, ` +
    `Scope, Enforcement, Attribution.`,

  "docs-api": (c) =>
    `Create an API documentation template for "${c.projectName}" (${c.stack}). ` +
    `Include sections for: Authentication, Base URL, Endpoints (with method, path, ` +
    `parameters, request body, response, examples), Error Codes, Rate Limiting.`,

  "docs-getting-started": (c) =>
    `Create a Getting Started guide for "${c.projectName}" (${c.stack}). ` +
    `Include sections for: Prerequisites, Installation, Quick Start (5-minute tutorial), ` +
    `Project Structure, Next Steps. Use numbered steps and code blocks.`,
};

const TEMPLATE_FILENAMES: Record<TemplateType, string> = {
  readme: "README.md",
  contributing: "CONTRIBUTING.md",
  "issue-bug": ".github/ISSUE_TEMPLATE/bug_report.md",
  "issue-feature": ".github/ISSUE_TEMPLATE/feature_request.md",
  "issue-question": ".github/ISSUE_TEMPLATE/question.md",
  "pull-request": ".github/PULL_REQUEST_TEMPLATE.md",
  changelog: "CHANGELOG.md",
  "code-of-conduct": "CODE_OF_CONDUCT.md",
  "docs-api": "docs/API.md",
  "docs-getting-started": "docs/GETTING-STARTED.md",
};

// --- Mock template content (simulates what Copilot would generate) ---

function mockTemplateContent(type: TemplateType, config: TemplateConfig): string {
  const headers: Record<TemplateType, string> = {
    readme: [
      `# ${config.projectName}`,
      "",
      `> ${config.description}`,
      "",
      "## Table of Contents",
      "- [Features](#features)",
      "- [Getting Started](#getting-started)",
      "- [Installation](#installation)",
      "- [Usage](#usage)",
      "- [Contributing](#contributing)",
      "- [License](#license)",
      "",
      "## Features",
      "",
      `- Built with ${config.stack}`,
      "- <!-- Add your features here -->",
      "",
      "## Getting Started",
      "",
      "### Prerequisites",
      "",
      `- ${config.stack} installed`,
      "",
      "### Installation",
      "",
      "```bash",
      "# Clone the repository",
      `git clone https://github.com/your-org/${config.projectName}.git`,
      `cd ${config.projectName}`,
      "",
      "# Install dependencies",
      "npm install",
      "```",
      "",
      "## Usage",
      "",
      "```bash",
      "npm start",
      "```",
      "",
      "## Contributing",
      "",
      "See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.",
      "",
      "## License",
      "",
      "MIT",
    ].join("\n"),

    contributing: [
      `# Contributing to ${config.projectName}`,
      "",
      "Thank you for your interest in contributing! This guide will help you get started.",
      "",
      "## How to Contribute",
      "",
      "1. Fork the repository",
      "2. Create a feature branch (`git checkout -b feature/my-feature`)",
      "3. Commit your changes (`git commit -m 'Add my feature'`)",
      "4. Push to the branch (`git push origin feature/my-feature`)",
      "5. Open a Pull Request",
      "",
      "## Development Setup",
      "",
      "```bash",
      `git clone https://github.com/your-org/${config.projectName}.git`,
      `cd ${config.projectName}`,
      "npm install",
      "npm test",
      "```",
      "",
      "## Coding Standards",
      "",
      "- Follow the existing code style",
      "- Write tests for new features",
      "- Keep commits atomic and well-described",
      "",
      "## Pull Request Process",
      "",
      "1. Update documentation if needed",
      "2. Add tests for new functionality",
      "3. Ensure all tests pass",
      "4. Request review from maintainers",
    ].join("\n"),

    "issue-bug": [
      "---",
      "name: Bug Report",
      "about: Report a bug to help us improve",
      'title: "[BUG] "',
      "labels: bug",
      "---",
      "",
      "## Bug Description",
      "A clear description of the bug.",
      "",
      "## Steps to Reproduce",
      "1. Go to '...'",
      "2. Click on '...'",
      "3. See error",
      "",
      "## Expected Behavior",
      "What you expected to happen.",
      "",
      "## Actual Behavior",
      "What actually happened.",
      "",
      "## Environment",
      `- OS: [e.g., Windows 11, macOS 14]`,
      `- ${config.stack} version: [e.g., 20.x]`,
      "",
      "## Screenshots",
      "If applicable, add screenshots.",
    ].join("\n"),

    "issue-feature": [
      "---",
      "name: Feature Request",
      "about: Suggest a new feature",
      'title: "[FEATURE] "',
      "labels: enhancement",
      "---",
      "",
      "## Feature Description",
      "A clear description of the feature.",
      "",
      "## Use Case",
      "Why this feature would be useful.",
      "",
      "## Proposed Solution",
      "How you think this could work.",
      "",
      "## Alternatives Considered",
      "Other approaches you've thought about.",
    ].join("\n"),

    "issue-question": [
      "---",
      "name: Question",
      "about: Ask a question about the project",
      'title: "[QUESTION] "',
      "labels: question",
      "---",
      "",
      "## Question",
      "Your question here.",
      "",
      "## Context",
      "What are you trying to accomplish?",
      "",
      "## What I've Tried",
      "Steps you've already taken.",
      "",
      "## Related Documentation",
      "Links to docs you've already read.",
    ].join("\n"),

    "pull-request": [
      "## Description",
      "Describe your changes here.",
      "",
      "## Type of Change",
      "- [ ] Bug fix",
      "- [ ] New feature",
      "- [ ] Breaking change",
      "- [ ] Documentation update",
      "",
      "## Testing Done",
      "Describe how you tested these changes.",
      "",
      "## Checklist",
      "- [ ] Tests pass locally",
      "- [ ] Documentation updated",
      "- [ ] Lint checks pass",
      "- [ ] No breaking changes (or documented)",
      "",
      "## Related Issues",
      "Closes #",
    ].join("\n"),

    changelog: [
      `# Changelog — ${config.projectName}`,
      "",
      "All notable changes to this project will be documented in this file.",
      "",
      "Format follows [Keep a Changelog](https://keepachangelog.com/).",
      "",
      "## [Unreleased]",
      "",
      "### Added",
      "- ",
      "",
      "### Changed",
      "- ",
      "",
      "### Fixed",
      "- ",
      "",
      "## [1.0.0] - YYYY-MM-DD",
      "",
      "### Added",
      "- Initial release",
    ].join("\n"),

    "code-of-conduct": [
      `# Code of Conduct — ${config.projectName}`,
      "",
      "## Our Pledge",
      "We pledge to make participation in our project a harassment-free experience for everyone.",
      "",
      "## Our Standards",
      "- Be respectful and inclusive",
      "- Accept constructive criticism gracefully",
      "- Focus on what is best for the community",
      "",
      "## Enforcement",
      "Project maintainers are responsible for clarifying standards of acceptable behavior.",
      "",
      "## Attribution",
      "Adapted from the [Contributor Covenant](https://www.contributor-covenant.org/).",
    ].join("\n"),

    "docs-api": [
      `# API Documentation — ${config.projectName}`,
      "",
      "## Authentication",
      "All requests require a Bearer token in the Authorization header.",
      "",
      "## Base URL",
      "```",
      "https://api.example.com/v1",
      "```",
      "",
      "## Endpoints",
      "",
      "### GET /resource",
      "Retrieve a list of resources.",
      "",
      "**Response:**",
      "```json",
      '{ "data": [], "total": 0 }',
      "```",
      "",
      "## Error Codes",
      "| Code | Description |",
      "|------|-------------|",
      "| 400  | Bad Request |",
      "| 401  | Unauthorized |",
      "| 404  | Not Found |",
      "| 500  | Internal Server Error |",
    ].join("\n"),

    "docs-getting-started": [
      `# Getting Started with ${config.projectName}`,
      "",
      "## Prerequisites",
      `- ${config.stack} installed`,
      "- Git",
      "",
      "## Quick Start",
      "",
      "```bash",
      `git clone https://github.com/your-org/${config.projectName}.git`,
      `cd ${config.projectName}`,
      "npm install",
      "npm start",
      "```",
      "",
      "## Project Structure",
      "```",
      "├── src/          # Source code",
      "├── tests/        # Test files",
      "├── docs/         # Documentation",
      "└── package.json  # Dependencies",
      "```",
      "",
      "## Next Steps",
      "- Read the [API docs](./API.md)",
      "- Check out [Contributing](../CONTRIBUTING.md)",
    ].join("\n"),
  };

  return headers[type] || `# ${type} template for ${config.projectName}`;
}

// --- Single template generation ---

async function generateTemplate(
  session: CopilotSession,
  config: TemplateConfig,
  type: TemplateType
): Promise<GeneratedTemplate> {
  const promptBuilder = TEMPLATE_PROMPTS[type];
  const prompt = promptBuilder(config);
  const filename = TEMPLATE_FILENAMES[type];

  console.log(`[Generate] Creating ${type} template...`);

  // Send prompt to Copilot — in production this returns real generated content
  await session.send(prompt);

  // Use mock content for demonstration (replace with session response in production)
  const content = mockTemplateContent(type, config);

  return { type, filename, content };
}

// --- Template customization ---

async function customizeTemplate(
  session: CopilotSession,
  template: GeneratedTemplate,
  instruction: string
): Promise<GeneratedTemplate> {
  console.log(`[Customize] Refining ${template.type}: "${instruction}"`);

  const prompt =
    `Refine this ${template.type} template based on the following instruction:\n` +
    `"${instruction}"\n\n` +
    `Current template:\n\`\`\`markdown\n${template.content}\n\`\`\`\n\n` +
    `Return the updated template in full.`;

  const response = await session.send(prompt);

  return {
    ...template,
    content: template.content + `\n\n<!-- Customized: ${instruction} -->`,
  };
}

// --- Batch generation ---

async function batchGenerate(
  session: CopilotSession,
  config: TemplateConfig
): Promise<GeneratedTemplate[]> {
  const results: GeneratedTemplate[] = [];

  for (const type of config.templateTypes) {
    const template = await generateTemplate(session, config, type);
    results.push(template);
  }

  return results;
}

// --- Save templates to disk ---

function saveTemplates(templates: GeneratedTemplate[], outputDir: string): void {
  for (const template of templates) {
    const filePath = path.join(outputDir, template.filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, template.content, "utf-8");
  }

  console.log(`[Saved] ${templates.length} templates written to ${outputDir}`);
}

// --- Project detection ---

function detectProjectInfo(projectDir: string): Partial<TemplateConfig> {
  // Try package.json (Node.js/TypeScript)
  const packageJsonPath = path.join(projectDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const frameworks: string[] = [];

      if (deps["express"]) frameworks.push("Express");
      if (deps["fastify"]) frameworks.push("Fastify");
      if (deps["react"]) frameworks.push("React");
      if (deps["next"]) frameworks.push("Next.js");
      if (deps["vue"]) frameworks.push("Vue");
      if (deps["typescript"]) frameworks.push("TypeScript");

      return {
        projectName: pkg.name || path.basename(projectDir),
        description: pkg.description || "",
        stack: frameworks.length > 0 ? `Node.js + ${frameworks.join(" + ")}` : "Node.js",
      };
    } catch {
      // Ignore parse errors
    }
  }

  // Try pyproject.toml (Python)
  const pyprojectPath = path.join(projectDir, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, "utf-8");
      const nameMatch = content.match(/^name\s*=\s*"(.+)"/m);
      const descMatch = content.match(/^description\s*=\s*"(.+)"/m);

      return {
        projectName: nameMatch?.[1] || path.basename(projectDir),
        description: descMatch?.[1] || "",
        stack: "Python",
      };
    } catch {
      // Ignore parse errors
    }
  }

  return {
    projectName: path.basename(projectDir),
    stack: "Unknown",
  };
}

// --- Main ---

async function main(): Promise<void> {
  const apiKey = process.env.COPILOT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing COPILOT_API_KEY environment variable.");
  }

  const client = createCopilotClient({ apiKey });
  client.start();

  try {
    // 1. Configure what to generate.
    // TODO: Replace with interactive prompts or CLI args for your workflow.
    const detected = detectProjectInfo(process.cwd());
    const config: TemplateConfig = {
      projectName: detected.projectName || "my-api",
      stack: detected.stack || "Node.js + Express",
      description: detected.description || "A RESTful API service",
      templateTypes: [
        "readme",
        "contributing",
        "issue-bug",
        "issue-feature",
        "issue-question",
        "pull-request",
      ],
      outputDir: "./templates",
    };

    console.log(`[Config] Project: ${config.projectName} | Stack: ${config.stack}`);

    const session = client.createSession({ sessionId: "template-gen" });

    // 2. Batch-generate the full template suite.
    const templates = await batchGenerate(session, config);

    // 3. Customize a template (example: make contributing guide more beginner-friendly).
    const contributingIdx = templates.findIndex((t) => t.type === "contributing");
    if (contributingIdx >= 0) {
      templates[contributingIdx] = await customizeTemplate(
        session,
        templates[contributingIdx],
        "Make it shorter and more beginner-friendly with emoji section headers"
      );
    }

    // 4. Save all templates to disk.
    saveTemplates(templates, config.outputDir);

    session.destroy();
  } catch (error) {
    console.error("[Error]", error instanceof Error ? error.message : error);
  } finally {
    client.stop();
  }
}

// Run the example.
main().catch(console.error);
