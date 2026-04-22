'use strict';

const HELLO_WORLD_TS = `/**
 * hello-world.ts — CopilotForge Cookbook Recipe (Starter)
 *
 * A minimal starter recipe showing the pattern for Copilot SDK usage.
 * Run the wizard ("set up my project") to generate recipes for your stack.
 */

async function main(): Promise<void> {
  console.log('[CopilotForge] Hello, world!');
  console.log('[CopilotForge] Run the wizard to generate real recipes for your project.');
  console.log('[CopilotForge] Open Copilot Chat and say: "set up my project"');
}

main().catch(console.error);
`;

const TASK_LOOP_TS = `/**
 * task-loop.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Implements the autonomous dev loop pattern (Ralph Loop): read a plan
 *   from disk, pick the next pending task, implement it, validate the result,
 *   mark it done (with git commit) or failed, and repeat. State lives on
 *   disk — not in memory — so each iteration starts with fresh context.
 *
 * HARDENED FEATURES (Squad-inspired):
 *   - Safe git staging: stages only specific files, never \`git add -A\`
 *   - Graceful shutdown: check \`.forge-stop\` file or FORGE_STOP env var
 *   - 4-tier error escalation: retry → skip → pause → halt
 *   - Health summary: printed on exit and appended to forge-memory/decisions.md
 *   - Checkpoint persistence: \`.forge-state.json\` survives interruptions
 *   - Configurable max iterations via FORGE_MAX_ITERATIONS env var
 *
 * WHEN TO USE THIS:
 *   When you want an agent to work through an implementation plan
 *   autonomously — picking tasks, writing code, validating, and committing
 *   without human intervention between steps.
 *
 * HOW TO RUN:
 *   1. Create an IMPLEMENTATION_PLAN.md in your project root (see format below)
 *   2. npx ts-node cookbook/task-loop.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - git initialized in the project
 *   - An IMPLEMENTATION_PLAN.md file (format shown in code)
 *
 * EXPECTED OUTPUT:
 *   [Ralph] Loaded 3 tasks from IMPLEMENTATION_PLAN.md
 *   [Ralph] === Iteration 1/10 ===
 *   [Ralph] Picked task: add-utils — "Create utility helpers"
 *   [Ralph] Implementing: add-utils...
 *   [Ralph] Validating: add-utils...
 *   [Ralph] ✅ Task add-utils passed — committing.
 *   [Ralph] === Iteration 2/10 ===
 *   ...
 *   [Ralph] 🏁 All tasks complete. 3 done, 0 failed.
 *   [Ralph] ═══════════════════════════════════
 *   [Ralph] 📊 Health Summary
 *   [Ralph]   Done:    3
 *   [Ralph]   Failed:  0
 *   [Ralph]   Pending: 0
 *   [Ralph]   Time:    12.4s
 *   [Ralph]   Reason:  all tasks complete
 *   [Ralph] ═══════════════════════════════════
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use \$env:VAR (PowerShell) or export VAR (bash)
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

// --- Types ---

type TaskStatus = "pending" | "done" | "failed";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

// --- Plan Parser ---

/**
 * Parses IMPLEMENTATION_PLAN.md into a list of tasks.
 * Expected format — one task per line:
 *   - [ ] task-id — Task title
 *   - [x] task-id — Task title        (done)
 *   - [!] task-id — Task title        (failed)
 */
function parsePlan(filePath: string): Task[] {
  const content = readFileSync(filePath, "utf-8");
  const tasks: Task[] = [];

  for (const line of content.split("\\n")) {
    const match = line.match(/^- \\[(.)\\] (\\S+)\\s*—\\s*(.+)\$/);
    if (!match) continue;

    const [, marker, id, title] = match;
    let status: TaskStatus = "pending";
    if (marker === "x") status = "done";
    else if (marker === "!") status = "failed";

    tasks.push({ id, title: title.trim(), status });
  }

  return tasks;
}

/** Writes the task list back to IMPLEMENTATION_PLAN.md. */
function writePlan(filePath: string, tasks: Task[]): void {
  const lines = ["# Implementation Plan", ""];
  for (const task of tasks) {
    const marker = task.status === "done" ? "x" : task.status === "failed" ? "!" : " ";
    lines.push(\`- [\${marker}] \${task.id} — \${task.title}\`);
  }
  writeFileSync(filePath, lines.join("\\n") + "\\n", "utf-8");
}

// --- Implementation — WIRE YOUR AI HERE ---

/**
 * Called once per task. Replace this body with your actual AI call.
 *
 * Example using the Anthropic SDK:
 *   const Anthropic = require("@anthropic-ai/sdk");
 *   const client = new Anthropic();
 *   const msg = await client.messages.create({
 *     model: "claude-sonnet-4-6",
 *     max_tokens: 4096,
 *     messages: [{ role: "user", content: \`Implement this task: \${task.title}\` }],
 *   });
 *   // write msg.content[0].text to the appropriate file
 */
function implementTask(task: Task): void {
  // TODO: replace with your AI call (see comment above)
  throw new Error(\`implementTask not wired up — see the comment in this function for how to connect your AI for task: \${task.id}\`);
}

// --- Validation — WIRE YOUR CHECKS HERE ---

/**
 * Called after implementTask. Return true if the task output is acceptable.
 * Common choices: run your test suite, do a build check, or lint the output.
 *
 * Example:
 *   execSync("npm test", { stdio: "inherit" });
 *   return true; // if execSync didn't throw
 */
function validateTask(task: Task): boolean {
  // TODO: replace with a real check (see comment above)
  throw new Error(\`validateTask not wired up — see the comment in this function for how to add validation for task: \${task.id}\`);
}

// --- Git Helpers ---

function gitCommit(message: string, files: string[]): void {
  try {
    // Stage specific files only — NEVER git add -A
    for (const f of files) {
      execSync(\`git add "\${f}"\`, { stdio: "pipe" });
    }
    // Always stage the plan file
    execSync('git add "IMPLEMENTATION_PLAN.md"', { stdio: "pipe" });

    // Safety check: verify staged file count
    const staged = execSync("git diff --cached --name-only", { stdio: "pipe" }).toString().trim();
    const fileCount = staged ? staged.split("\\n").length : 0;
    if (fileCount > 20) {
      console.warn(\`[Ralph] ⚠️ WARNING: \${fileCount} files staged — this seems too many for one task. Aborting commit.\`);
      execSync("git reset HEAD", { stdio: "pipe" });
      return;
    }
    if (fileCount > 10) {
      console.warn(\`[Ralph] ⚠️ Note: \${fileCount} files staged — more than usual for a single task.\`);
    }

    execSync(\`git commit -m "\${message}"\`, { stdio: "pipe" });
  } catch {
    console.warn("[Ralph] Git commit skipped (no changes or git not configured).");
  }
}

// --- Graceful Shutdown ---

function shouldStop(): boolean {
  if (existsSync(".forge-stop")) {
    console.log("[Ralph] 🛑 Stop signal detected (.forge-stop file). Shutting down gracefully.");
    return true;
  }
  if (process.env.FORGE_STOP === "1" || process.env.FORGE_STOP === "true") {
    console.log("[Ralph] 🛑 Stop signal detected (FORGE_STOP env). Shutting down gracefully.");
    return true;
  }
  return false;
}

// --- Checkpoint Persistence ---

interface LoopState {
  iteration: number;
  startedAt: string;
  lastTaskId: string;
  totalDone: number;
  totalFailed: number;
}

function saveCheckpoint(state: LoopState): void {
  writeFileSync(".forge-state.json", JSON.stringify(state, null, 2), "utf-8");
}

function loadCheckpoint(): LoopState | null {
  if (!existsSync(".forge-state.json")) return null;
  try {
    return JSON.parse(readFileSync(".forge-state.json", "utf-8"));
  } catch {
    return null;
  }
}

// --- Health Summary ---

function writeHealthSummary(tasks: Task[], startTime: number, reason: string): void {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const done = tasks.filter((t) => t.status === "done").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;

  console.log();
  console.log("[Ralph] ═══════════════════════════════════");
  console.log("[Ralph] 📊 Health Summary");
  console.log(\`[Ralph]   Done:    \${done}\`);
  console.log(\`[Ralph]   Failed:  \${failed}\`);
  console.log(\`[Ralph]   Pending: \${pending}\`);
  console.log(\`[Ralph]   Time:    \${elapsed}s\`);
  console.log(\`[Ralph]   Reason:  \${reason}\`);
  console.log("[Ralph] ═══════════════════════════════════");

  // Write to forge-memory/decisions.md if it exists
  if (existsSync("forge-memory")) {
    const summary = \`\\n## Ralph Loop Run — \${new Date().toISOString()}\\n- Done: \${done}, Failed: \${failed}, Pending: \${pending}\\n- Time: \${elapsed}s\\n- Exit reason: \${reason}\\n\`;
    const decisionsPath = join(".", "forge-memory", "decisions.md");
    if (existsSync(decisionsPath)) {
      appendFileSync(decisionsPath, summary, "utf-8");
    }
  }
}

// --- Ralph Loop ---

function ralphLoop(planPath: string, maxIterations: number = 10): void {
  if (!existsSync(planPath)) {
    console.error(\`[Ralph] Plan not found: \${planPath}\`);
    console.error("[Ralph] Create an IMPLEMENTATION_PLAN.md with tasks like:");
    console.error("  - [ ] task-id — Task title");
    return;
  }

  const startTime = Date.now();
  let consecutiveFailures = 0;
  let totalFailures = 0;

  // Resume from checkpoint if available
  const checkpoint = loadCheckpoint();
  let iteration = checkpoint ? checkpoint.iteration : 0;
  if (checkpoint) {
    console.log(\`[Ralph] Resuming from checkpoint — iteration \${checkpoint.iteration}, last task: \${checkpoint.lastTaskId}\`);
  }

  while (iteration < maxIterations) {
    iteration++;

    // Graceful shutdown check
    if (shouldStop()) {
      const tasks = parsePlan(planPath);
      writeHealthSummary(tasks, startTime, "graceful shutdown requested");
      return;
    }

    // Fresh read from disk on every iteration (key principle).
    const tasks = parsePlan(planPath);

    if (iteration === 1 || (checkpoint && iteration === checkpoint.iteration + 1)) {
      console.log(\`[Ralph] Loaded \${tasks.length} tasks from \${planPath}\`);
    }

    const pending = tasks.find((t) => t.status === "pending");
    if (!pending) {
      const done = tasks.filter((t) => t.status === "done").length;
      const failed = tasks.filter((t) => t.status === "failed").length;
      console.log(\`[Ralph] 🏁 All tasks complete. \${done} done, \${failed} failed.\`);
      writeHealthSummary(tasks, startTime, "all tasks complete");
      return;
    }

    console.log(\`[Ralph] === Iteration \${iteration}/\${maxIterations} ===\`);
    console.log(\`[Ralph] Picked task: \${pending.id} — "\${pending.title}"\`);

    // Implement
    implementTask(pending);
    const implementedFile = join("src", \`\${pending.id}.ts\`);

    // Validate
    const passed = validateTask(pending);

    // Update status on disk
    const freshTasks = parsePlan(planPath);
    const target = freshTasks.find((t) => t.id === pending.id);
    if (target) {
      target.status = passed ? "done" : "failed";
      writePlan(planPath, freshTasks);
    }

    if (passed) {
      consecutiveFailures = 0;
      console.log(\`[Ralph] ✅ Task \${pending.id} passed — committing.\`);
      gitCommit(\`feat: \${pending.id} — \${pending.title}\`, [implementedFile]);
    } else {
      consecutiveFailures++;
      totalFailures++;
      console.log(\`[Ralph] ❌ Task \${pending.id} failed — marked as failed, continuing.\`);

      // Tier 3: Pause and warn after 3 consecutive failures
      if (consecutiveFailures >= 3) {
        console.warn("[Ralph] ⚠️ 3 consecutive failures — something may be wrong.");
        console.warn("[Ralph] Pausing for 10 seconds. Create .forge-stop to halt.");
        execSync('node -e "setTimeout(()=>{},10000)"', { stdio: "pipe" });
      }

      // Tier 4: Halt after 5 total failures
      if (totalFailures >= 5) {
        console.error("[Ralph] 🛑 5+ total failures — halting autonomous execution.");
        writeHealthSummary(freshTasks, startTime, "halted — too many failures");
        return;
      }
    }

    // Save checkpoint after each iteration
    saveCheckpoint({
      iteration,
      startedAt: new Date(startTime).toISOString(),
      lastTaskId: pending.id,
      totalDone: freshTasks.filter((t) => t.status === "done").length,
      totalFailed: freshTasks.filter((t) => t.status === "failed").length,
    });
  }

  const tasks = parsePlan(planPath);
  console.log(\`[Ralph] ⚠️ Reached max iterations (\${maxIterations}). Stopping.\`);
  writeHealthSummary(tasks, startTime, \`max iterations reached (\${maxIterations})\`);
}

// --- Entry Point ---

const maxIterations = parseInt(process.env.FORGE_MAX_ITERATIONS || "10", 10);
const planFile = join(".", "IMPLEMENTATION_PLAN.md");
ralphLoop(planFile, maxIterations);
`;

const RALPH_LOOP_TS = `#!/usr/bin/env tsx
/**
 * ralph-loop.ts — CopilotForge Autonomous Development Loop
 *
 * HOW TO RUN:
 *   npx tsx cookbook/ralph-loop.ts [plan|build] [max_iterations]
 *
 *   npx tsx cookbook/ralph-loop.ts plan 5    — plan mode: populate IMPLEMENTATION_PLAN.md
 *   npx tsx cookbook/ralph-loop.ts build 50  — build mode: work through the plan
 *   npx tsx cookbook/ralph-loop.ts build     — build mode, default 50 iterations
 *
 * PREREQUISITES:
 *   npm install -D @github/copilot-sdk tsx
 *   A PROMPT_build.md file at your project root (what the loop tells Copilot each iteration)
 *
 * WHAT THIS DOES:
 *   Drives GitHub Copilot autonomously — no approval prompts, no human-in-the-loop.
 *   Each iteration: sends your prompt to Copilot → waits for response → loops.
 *   Copilot reads IMPLEMENTATION_PLAN.md, picks the next task, writes code, commits.
 *
 * STOP ANYTIME:
 *   Press Ctrl+C — exits cleanly, no data lost.
 *   Or click Pause in the CopilotForge Command Center.
 *
 * CREATE PROMPT_build.md — example contents:
 *   Read IMPLEMENTATION_PLAN.md, pick the next pending [ ] task, implement it,
 *   run the tests, mark it [x] done, commit, and stop. Reply with the task ID only.
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const mode = (process.argv[2] ?? "build") as "plan" | "build";
const maxIterations = parseInt(process.argv[3] ?? "50", 10);
const projectRoot = process.cwd();
const startedAt = new Date().toISOString();

if (mode !== "plan" && mode !== "build") {
  console.error(\`❌ Unknown mode "\${mode}". Use "plan" or "build".\`);
  process.exit(1);
}

const promptFile = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";
const promptPath = join(projectRoot, promptFile);

if (!existsSync(promptPath)) {
  console.error(\`❌ Prompt file not found: \${promptPath}\`);
  console.error(\`   Create \${promptFile} at your project root.\`);
  console.error(\`   Example content: "Read IMPLEMENTATION_PLAN.md, pick the next [ ] task, implement it, commit, and stop."\`);
  process.exit(1);
}

const prompt = readFileSync(promptPath, "utf-8").trim();

function getLastCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: "pipe" }).toString().trim();
  } catch {
    return "";
  }
}

function writeStatus(iteration: number, currentTask: string, running: boolean): void {
  try {
    writeFileSync(
      join(projectRoot, "ralph-status.json"),
      JSON.stringify({ running, iteration, maxIterations, currentTask, lastCommit: getLastCommit(), mode, startedAt }, null, 2)
    );
  } catch {
    // Non-fatal — dashboard is optional
  }
}

function checkPause(iteration: number): boolean {
  const pausePath = join(projectRoot, "RALPH_PAUSE");
  if (existsSync(pausePath)) {
    console.log("\\n⏸  RALPH_PAUSE detected — exiting cleanly.");
    writeStatus(iteration, "paused by user", false);
    try { unlinkSync(pausePath); } catch {}
    return true;
  }
  return false;
}

function isComplete(text: string): boolean {
  const signals = ["no_more_tasks", "board is clear", "all tasks complete", "nothing left to do", "done"];
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

async function runLoop(): Promise<void> {
  console.log(\`🔄 Ralph Loop — \${mode} mode — max \${maxIterations} iterations\`);
  console.log(\`📁 Project: \${projectRoot}\\n\`);

  const client = new CopilotClient();
  await client.start();

  process.on("SIGINT", async () => {
    console.log("\\n⏹  Interrupted — shutting down cleanly.");
    writeStatus(0, "interrupted", false);
    await client.stop();
    process.exit(0);
  });

  for (let i = 1; i <= maxIterations; i++) {
    if (checkPause(i)) break;

    writeStatus(i, "working...", true);
    console.log(\`\\n--- Iteration \${i}/\${maxIterations} [\${mode} mode] ---\`);

    try {
      const session = await client.createSession({ onPermissionRequest: approveAll });

      session.on("tool.execution_start", (event: any) => {
        const name = event?.data?.name ?? event?.data?.toolName ?? "tool";
        console.log(\`  ⚙ \${name}\`);
      });

      const result = await session.sendAndWait({ prompt });
      const responseText = result?.data?.content ?? "";

      writeStatus(i, "iteration complete", true);
      console.log(\`  ✓ Iteration complete\`);
      await session.disconnect();

      if (isComplete(responseText)) {
        console.log("\\n✅ All tasks complete. Ralph Loop exiting.");
        writeStatus(i, "all tasks complete", false);
        break;
      }
    } catch (err) {
      console.error(\`  ❌ Iteration \${i} failed:\`, err instanceof Error ? err.message : err);
    }
  }

  writeStatus(maxIterations, "loop finished", false);
  await client.stop();
  console.log(\`\\n🔄 Ralph Loop finished — \${maxIterations} iterations max\`);
}

runLoop().catch(console.error);
`;

module.exports = { HELLO_WORLD_TS, TASK_LOOP_TS, RALPH_LOOP_TS };