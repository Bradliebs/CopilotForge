/**
 * ralph-loop.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Implements the autonomous dev loop pattern (Ralph Loop): read a plan
 *   from disk, pick the next pending task, implement it, validate the result,
 *   mark it done (with git commit) or failed, and repeat. State lives on
 *   disk — not in memory — so each iteration starts with fresh context.
 *
 * WHEN TO USE THIS:
 *   When you want an agent to work through an implementation plan
 *   autonomously — picking tasks, writing code, validating, and committing
 *   without human intervention between steps.
 *
 * HOW TO RUN:
 *   1. Create an {{PLAN_FILE}} in your project root (see format below)
 *   2. npx ts-node cookbook/ralph-loop.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - git initialized in the project
 *   - An {{PLAN_FILE}} file (format shown in code)
 *
 * EXPECTED OUTPUT:
 *   [Ralph] Loaded 3 tasks from {{PLAN_FILE}}
 *   [Ralph] === Iteration 1/{{MAX_ITERATIONS}} ===
 *   [Ralph] Picked task: add-utils — "Create utility helpers"
 *   [Ralph] Implementing: add-utils...
 *   [Ralph] Validating: add-utils...
 *   [Ralph] ✅ Task add-utils passed — committing.
 *   ...
 *   [Ralph] 🏁 All tasks complete. 3 done, 0 failed.
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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
 * Parses {{PLAN_FILE}} into a list of tasks.
 * Expected format — one task per line:
 *   - [ ] task-id — Task title
 *   - [x] task-id — Task title        (done)
 *   - [!] task-id — Task title        (failed)
 */
function parsePlan(filePath: string): Task[] {
  const content = readFileSync(filePath, "utf-8");
  const tasks: Task[] = [];

  for (const line of content.split("\n")) {
    const match = line.match(/^- \[(.)\] (\S+)\s*—\s*(.+)$/);
    if (!match) continue;

    const [, marker, id, title] = match;
    let status: TaskStatus = "pending";
    if (marker === "x") status = "done";
    else if (marker === "!") status = "failed";

    tasks.push({ id, title: title.trim(), status });
  }

  return tasks;
}

/** Writes the task list back to {{PLAN_FILE}}. */
function writePlan(filePath: string, tasks: Task[]): void {
  const lines = ["# Implementation Plan", ""];
  for (const task of tasks) {
    const marker = task.status === "done" ? "x" : task.status === "failed" ? "!" : " ";
    lines.push(`- [${marker}] ${task.id} — ${task.title}`);
  }
  writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");
}

// --- Implementation (simulated) ---

/**
 * Simulate implementing a task — creates or modifies a file.
 * TODO: Replace with actual {{SDK_PACKAGE}} call to generate code.
 */
function implementTask(task: Task): void {
  const outDir = join(".", "{{OUTPUT_DIR}}");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const filePath = join(outDir, `${task.id}.ts`);
  const content = `// Auto-generated for task: ${task.id}\n// ${task.title}\nexport {};\n`;
  writeFileSync(filePath, content, "utf-8");
  console.log(`[Ralph] Implementing: ${task.id}...`);
}

// --- Validation (simulated) ---

/**
 * Simulate validation — run tests or a build check.
 * TODO: Replace with actual validation (e.g., execSync("{{VALIDATE_COMMAND}}")).
 */
function validateTask(task: Task): boolean {
  console.log(`[Ralph] Validating: ${task.id}...`);
  return true;
}

// --- Git Helpers ---

function gitCommit(message: string): void {
  try {
    execSync("git add -A", { stdio: "pipe" });
    execSync(`git commit -m "${message}" --allow-empty`, { stdio: "pipe" });
  } catch {
    console.warn("[Ralph] Git commit skipped (no changes or git not configured).");
  }
}

// --- Ralph Loop ---

function ralphLoop(planPath: string, maxIterations: number = {{MAX_ITERATIONS}}): void {
  if (!existsSync(planPath)) {
    console.error(`[Ralph] Plan not found: ${planPath}`);
    console.error('[Ralph] Create an {{PLAN_FILE}} with tasks like:');
    console.error("  - [ ] task-id — Task title");
    return;
  }

  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    const tasks = parsePlan(planPath);

    if (iteration === 1) {
      console.log(`[Ralph] Loaded ${tasks.length} tasks from ${planPath}`);
    }

    const pending = tasks.find((t) => t.status === "pending");
    if (!pending) {
      const done = tasks.filter((t) => t.status === "done").length;
      const failed = tasks.filter((t) => t.status === "failed").length;
      console.log(`[Ralph] 🏁 All tasks complete. ${done} done, ${failed} failed.`);
      return;
    }

    console.log(`[Ralph] === Iteration ${iteration}/${maxIterations} ===`);
    console.log(`[Ralph] Picked task: ${pending.id} — "${pending.title}"`);

    implementTask(pending);

    const passed = validateTask(pending);

    const freshTasks = parsePlan(planPath);
    const target = freshTasks.find((t) => t.id === pending.id);
    if (target) {
      target.status = passed ? "done" : "failed";
      writePlan(planPath, freshTasks);
    }

    if (passed) {
      console.log(`[Ralph] ✅ Task ${pending.id} passed — committing.`);
      gitCommit(`feat: ${pending.id} — ${pending.title}`);
    } else {
      console.log(`[Ralph] ❌ Task ${pending.id} failed — logged.`);
    }
  }

  console.log(`[Ralph] ⚠️ Reached max iterations (${maxIterations}). Stopping.`);
}

// --- Entry Point ---

const planFile = join(".", "{{PLAN_FILE}}");
ralphLoop(planFile);
