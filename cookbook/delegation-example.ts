/**
 * delegation-example.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates the CopilotForge delegation pattern — how the Planner
 *   orchestrates delegate generators (for skills, agents, memory, and cookbook recipes) to scaffold a project programmatically.
 *
 * WHEN TO USE THIS:
 *   When you want to automate CopilotForge scaffolding in a CI pipeline,
 *   a CLI tool, or a custom integration — instead of running the wizard
 *   interactively in Copilot chat.
 *
 * HOW TO RUN:
 *   1. npm install
 *   2. npx ts-node cookbook/delegation-example.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

// --- Types ---

/** The five wizard answers that drive scaffolding. */
interface WizardAnswers {
  projectName: string;
  projectDescription: string;
  stack: string;
  memoryEnabled: boolean;
  testingEnabled: boolean;
  skillLevel: "beginner" | "intermediate" | "advanced";
}

/** Common context passed to every delegate. */
interface delegateContext {
  answers: WizardAnswers;
  date: string;
  existingFiles: string[];
}

/** Output from any delegate. */
interface delegateOutput {
  filesCreated: Array<{ name: string; path: string; description: string }>;
  status: "success" | "partial" | "failed";
  errors: string[];
}

/** skill generator adds skill names to its output. */
interface SkillGeneratorOutput extends delegateOutput {
  skillNames: string[];
}

// --- Re-Run Detection ---

const FORGE_MARKERS = [
  "FORGE.md",
  "forge-memory/decisions.md",
  ".copilot/agents/planner.md",
  "cookbook/README.md",
];

/** Checks if CopilotForge files already exist in the target directory. */
function detectRerun(targetDir: string): string[] {
  return FORGE_MARKERS.filter((marker) => existsSync(join(targetDir, marker)));
}

// --- delegate Stubs ---

/**
 * Generates SKILL.md files for the project.
 * In production, this calls the skill generator agent or uses templates.
 */
async function runSkillGenerator(ctx: delegateContext): Promise<SkillGeneratorOutput> {
  const skills: SkillGeneratorOutput = {
    filesCreated: [],
    skillNames: [],
    status: "success",
    errors: [],
  };

  // Always generate project-conventions skill
  const conventionsDir = join(".github", "skills", `${slugify(ctx.answers.projectName)}-conventions`);
  skills.filesCreated.push({
    name: `${slugify(ctx.answers.projectName)}-conventions`,
    path: join(conventionsDir, "SKILL.md"),
    description: `Stack conventions for ${ctx.answers.stack}`,
  });
  skills.skillNames.push(`${slugify(ctx.answers.projectName)}-conventions`);

  // Always generate code-review skill
  skills.filesCreated.push({
    name: "code-review",
    path: join(".github", "skills", "code-review", "SKILL.md"),
    description: "Code review checklist and standards",
  });
  skills.skillNames.push("code-review");

  // Conditionally generate testing skill
  if (ctx.answers.testingEnabled) {
    skills.filesCreated.push({
      name: "testing",
      path: join(".github", "skills", "testing", "SKILL.md"),
      description: `Test patterns for ${ctx.answers.stack}`,
    });
    skills.skillNames.push("testing");
  }

  // TODO: Replace with actual template rendering.
  // Each skill would be generated from templates/agents/skill generator.md logic.
  console.log(`[skill generator] Generated ${skills.filesCreated.length} skills`);
  return skills;
}

/**
 * Generates agent definition files.
 * Depends on skill generator output for skill references.
 */
async function runAgentWriter(
  ctx: delegateContext,
  skillNames: string[]
): Promise<delegateOutput> {
  const output: delegateOutput = {
    filesCreated: [],
    status: "success",
    errors: [],
  };

  const agents = [
    { name: "planner", role: "Orchestrator", skills: skillNames },
    { name: "reviewer", role: "Code Reviewer", skills: ["code-review"] },
  ];

  if (ctx.answers.testingEnabled) {
    agents.push({ name: "tester", role: "Quality Assurance", skills: ["testing"] });
  }

  for (const agent of agents) {
    output.filesCreated.push({
      name: agent.name,
      path: join(".copilot", "agents", `${agent.name}.md`),
      description: `${agent.role} — uses skills: ${agent.skills.join(", ")}`,
    });
  }

  // TODO: Replace with actual template rendering.
  console.log(`[agent generator] Generated ${output.filesCreated.length} agents`);
  return output;
}

/**
 * Generates forge-memory files.
 * Runs in parallel — no dependencies on other delegates.
 */
async function runMemoryWriter(ctx: delegateContext): Promise<delegateOutput> {
  const output: delegateOutput = {
    filesCreated: [],
    status: "success",
    errors: [],
  };

  if (!ctx.answers.memoryEnabled) {
    console.log("[memory generator] Skipped — memory disabled");
    return output;
  }

  output.filesCreated.push(
    {
      name: "decisions.md",
      path: join("forge-memory", "decisions.md"),
      description: "Architectural decisions log",
    },
    {
      name: "patterns.md",
      path: join("forge-memory", "patterns.md"),
      description: "Reusable project conventions",
    }
  );

  // TODO: Replace with actual template rendering.
  console.log(`[memory generator] Generated ${output.filesCreated.length} memory files`);
  return output;
}

/**
 * Generates cookbook recipes.
 * Runs in parallel — no dependencies on other delegates.
 */
async function runCookbookWriter(ctx: delegateContext): Promise<delegateOutput> {
  const output: delegateOutput = {
    filesCreated: [],
    status: "success",
    errors: [],
  };

  // Always generate README
  output.filesCreated.push({
    name: "README.md",
    path: join("cookbook", "README.md"),
    description: "Cookbook recipe index",
  });

  // Stack-specific recipes
  if (ctx.answers.stack.toLowerCase().includes("typescript")) {
    output.filesCreated.push({
      name: "session-example.ts",
      path: join("cookbook", "session-example.ts"),
      description: "Session management with error handling",
    });
  }

  if (ctx.answers.stack.toLowerCase().includes("python")) {
    output.filesCreated.push({
      name: "session-example.py",
      path: join("cookbook", "session-example.py"),
      description: "Session management with error handling",
    });
  }

  // TODO: Replace with actual template rendering.
  console.log(`[cookbook generator] Generated ${output.filesCreated.length} recipes`);
  return output;
}

// --- Planner Orchestrator ---

/**
 * The main delegation loop. This is what the Planner does:
 * 1. Collect wizard answers (provided here as input).
 * 2. Detect re-runs.
 * 3. Dispatch delegates in the correct order.
 * 4. Assemble FORGE.md from all outputs.
 * 5. Print validation summary.
 */
async function runPlanner(answers: WizardAnswers, targetDir: string): Promise<void> {
  const date = new Date().toISOString().split("T")[0];

  // Step 1: Detect re-run
  const existing = detectRerun(targetDir);
  if (existing.length > 0) {
    console.log(`\n🔄 Re-run detected. Existing files: ${existing.join(", ")}`);
    console.log("   Will preserve existing files and only add what's new.\n");
  } else {
    console.log("\n🆕 Fresh run — no existing CopilotForge files detected.\n");
  }

  // Step 2: Build delegate context
  const ctx: delegateContext = {
    answers,
    date,
    existingFiles: existing,
  };

  // Step 3: Run skill generator FIRST (agent generator depends on it)
  console.log("--- Phase 1: Skills ---");
  const skillResult = await runSkillGenerator(ctx);

  // Step 4: Run agent generator (sequential), memory generator + cookbook generator (parallel)
  console.log("\n--- Phase 2: Agents + Memory + Cookbook (parallel) ---");
  const [agentResult, memoryResult, cookbookResult] = await Promise.all([
    runAgentWriter(ctx, skillResult.skillNames),
    runMemoryWriter(ctx),
    runCookbookWriter(ctx),
  ]);

  // Step 5: Assemble FORGE.md
  console.log("\n--- Phase 3: FORGE.md Assembly ---");
  const allFiles = [
    ...skillResult.filesCreated,
    ...agentResult.filesCreated,
    ...memoryResult.filesCreated,
    ...cookbookResult.filesCreated,
  ];
  // TODO: Generate actual FORGE.md from template with all file references.
  console.log(`[planner] FORGE.md assembled with ${allFiles.length} file references`);

  // Step 6: Validation summary
  printSummary(skillResult, agentResult, memoryResult, cookbookResult);
}

// --- Helpers ---

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function printSummary(
  skills: SkillGeneratorOutput,
  agents: delegateOutput,
  memory: delegateOutput,
  cookbook: delegateOutput
): void {
  const allResults = [skills, agents, memory, cookbook];
  const failed = allResults.filter((r) => r.status === "failed");

  if (failed.length === 0) {
    console.log("\n✅ CopilotForge scaffolding complete!\n");
  } else {
    console.log("\n⚠️ CopilotForge scaffolding partially complete.\n");
  }

  console.log(`  Skills:  ${skills.filesCreated.length} created`);
  console.log(`  Agents:  ${agents.filesCreated.length} created`);
  console.log(`  Memory:  ${memory.filesCreated.length} created`);
  console.log(`  Recipes: ${cookbook.filesCreated.length} created`);
  console.log(`  Total:   ${allResults.reduce((sum, r) => sum + r.filesCreated.length, 0)} files\n`);

  // Print any errors
  for (const result of allResults) {
    for (const err of result.errors) {
      console.log(`  ⚠️ ${err}`);
    }
  }

  console.log("  Start here: Open FORGE.md to see your full setup.");
}

// --- Run ---

async function main() {
  // Example: automate scaffolding with pre-filled answers.
  const answers: WizardAnswers = {
    projectName: "my-api",
    projectDescription: "A REST API for managing tasks with authentication and real-time updates",
    stack: "TypeScript, Express, Prisma, PostgreSQL",
    memoryEnabled: true,
    testingEnabled: true,
    skillLevel: "intermediate",
  };

  await runPlanner(answers, process.cwd());
}

main().catch(console.error);
