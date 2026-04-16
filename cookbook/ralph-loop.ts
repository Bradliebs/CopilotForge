#!/usr/bin/env tsx
/**
 * ralph-loop.ts — CopilotForge Autonomous Development Loop
 *
 * HOW TO RUN:
 *   npx tsx cookbook/ralph-loop.ts [plan|build] [max_iterations]
 *
 *   npx tsx cookbook/ralph-loop.ts plan 5    — populate IMPLEMENTATION_PLAN.md
 *   npx tsx cookbook/ralph-loop.ts build 50  — work through the plan
 *   npx tsx cookbook/ralph-loop.ts build     — build mode, default 50 iterations
 *
 * STOP ANYTIME: Press Ctrl+C — exits cleanly, no data lost.
 * PAUSE VIA DASHBOARD: The Command Center pause button writes RALPH_PAUSE
 *   to the project root; Ralph detects it and exits at the next iteration.
 *
 * NOTE: This is a CopilotForge development tool. It is NOT copied into
 *   user repos by `copilotforge init`. It lives only in cookbook/.
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

// --- Config from CLI args ---

const mode = (process.argv[2] ?? "build") as "plan" | "build";
const maxIterations = parseInt(process.argv[3] ?? "50", 10);
const projectRoot = process.cwd();
const startedAt = new Date().toISOString();

if (mode !== "plan" && mode !== "build") {
  console.error(`❌ Unknown mode "${mode}". Use "plan" or "build".`);
  process.exit(1);
}

if (isNaN(maxIterations) || maxIterations < 1) {
  console.error(`❌ max_iterations must be a positive integer.`);
  process.exit(1);
}

// --- Load prompt file ---

const promptFile = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";
const promptPath = join(projectRoot, promptFile);

if (!existsSync(promptPath)) {
  console.error(`❌ Prompt file not found: ${promptPath}`);
  console.error(`   Create ${promptFile} at the project root first.`);
  process.exit(1);
}

const prompt = readFileSync(promptPath, "utf-8").trim();

// --- ralph-status.json (read by Command Center dashboard) ---

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
      JSON.stringify(
        { running, iteration, maxIterations, currentTask, lastCommit: getLastCommit(), mode, startedAt },
        null,
        2
      )
    );
  } catch {
    // Non-fatal — dashboard is optional
  }
}

// --- RALPH_PAUSE sentinel (written by Command Center pause button) ---

function checkPause(iteration: number): boolean {
  const pausePath = join(projectRoot, "RALPH_PAUSE");
  if (existsSync(pausePath)) {
    console.log("\n⏸  RALPH_PAUSE detected — exiting cleanly.");
    writeStatus(iteration, "paused by user", false);
    try {
      unlinkSync(pausePath);
    } catch {}
    return true;
  }
  return false;
}

// --- Completion detection ---

function isComplete(text: string): boolean {
  const signals = [
    "no_more_tasks",
    "board is clear",
    "all tasks complete",
    "nothing left to do",
    "done",
  ];
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

// --- Main loop ---

async function runLoop(): Promise<void> {
  console.log(`🔄 Ralph Loop — ${mode} mode — max ${maxIterations} iterations`);
  console.log(`📁 Working directory: ${projectRoot}\n`);

  const client = new CopilotClient();
  await client.start();

  // Clean exit on Ctrl+C
  process.on("SIGINT", async () => {
    console.log("\n⏹  Interrupted — shutting down cleanly.");
    writeStatus(0, "interrupted", false);
    await client.stop();
    process.exit(0);
  });

  for (let i = 1; i <= maxIterations; i++) {
    // Check for pause before starting each iteration
    if (checkPause(i)) break;

    writeStatus(i, "working...", true);
    console.log(`\n--- Iteration ${i}/${maxIterations} [${mode} mode] ---`);

    try {
      // approveAll auto-approves every tool call — no permission prompts
      const session = await client.createSession({
        onPermissionRequest: approveAll,
      });

      // Log each tool call so progress is visible
      session.on("tool.execution_start", (event: any) => {
        const name = event?.data?.name ?? event?.data?.toolName ?? "tool";
        console.log(`  ⚙ ${name}`);
      });

      const result = await session.sendAndWait({ prompt });
      const responseText = result?.data?.content ?? "";

      writeStatus(i, "iteration complete", true);
      console.log(`  ✓ Iteration complete`);

      await session.disconnect();

      if (isComplete(responseText)) {
        console.log("\n✅ All tasks complete. Ralph Loop exiting.");
        writeStatus(i, "all tasks complete", false);
        break;
      }
    } catch (err) {
      console.error(`  ❌ Iteration ${i} failed:`, err instanceof Error ? err.message : err);
      // Never crash the whole loop on a single bad iteration
    }
  }

  writeStatus(maxIterations, "loop finished", false);
  await client.stop();
  console.log(`\n🔄 Ralph Loop finished — ${mode} mode — ${maxIterations} iterations max`);
}

runLoop().catch(console.error);
