#!/usr/bin/env tsx
/**
 * ralph-loop.ts — CopilotForge Development Tool
 *
 * WHAT THIS DOES:
 *   Autonomous development loop runner for CopilotForge. Reads a prompt
 *   file from the project root (PROMPT_plan.md or PROMPT_build.md) and
 *   drives a Copilot session in a loop until all tasks are done or the
 *   iteration cap is reached. Every tool call is logged (⚙ toolName) so
 *   progress is always visible.
 *
 * WHEN TO USE THIS:
 *   When you want to run CopilotForge's development cycle without sitting
 *   at the keyboard. Choose plan mode to populate the backlog, build mode
 *   to work through it. Sessions are fully autonomous — no permission
 *   prompts, no interruptions.
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Create PROMPT_plan.md or PROMPT_build.md at the project root
 *   3. npx tsx cookbook/ralph-loop.ts [plan|build] [max_iterations]
 *
 *   Examples:
 *     npx tsx cookbook/ralph-loop.ts build        # build mode, 50 iterations
 *     npx tsx cookbook/ralph-loop.ts plan 10      # plan mode, 10 iterations
 *     npx tsx cookbook/ralph-loop.ts build 5      # build mode, 5 iterations
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+ (tsx or ts-node for direct execution)
 *   - @github/copilot-sdk (npm install @github/copilot-sdk)
 *   - PROMPT_plan.md or PROMPT_build.md at the project root
 *
 * EXPECTED OUTPUT:
 *   🔄 Ralph Loop — build mode — max 50 iterations
 *   📁 Working directory: /your/project/root
 *
 *   --- Iteration 1/50 [build mode] ---
 *     ⚙ read_file
 *     ⚙ edit_file
 *     ⚙ run_command
 *     ✓ Iteration complete
 *
 *   --- Iteration 2/50 [build mode] ---
 *     ⚙ git_commit
 *     ✓ Iteration complete
 *
 *   ✅ All tasks complete. Ralph Loop exiting.
 *   🔄 Ralph Loop finished — build mode — 50 iterations max
 *
 * PLATFORM NOTES:
 *   - Windows: Use `npx tsx` rather than `npx ts-node` for best results
 *   - macOS/Linux: Both tsx and ts-node work
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 *
 * NOTE: This file is a CopilotForge development tool — it is NOT scaffolded
 *   into user repos by `copilotforge init`. It lives only in cookbook/.
 */

// TODO: Replace mock types with the real import once @github/copilot-sdk is installed:
//   import { CopilotClient } from "@github/copilot-sdk";
//   npm install @github/copilot-sdk

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// --- Types ---

/** A tool-use event emitted by the session as it works. */
interface ToolCallEvent {
  name: string;
}

/** The callback fired when the session wants to use a tool. */
type ToolCallHandler = (toolName: string) => void;

/** Passed to onPermissionRequest; contains tool name and arguments. */
interface PermissionRequest {
  toolName: string;
  args?: Record<string, unknown>;
}

/** Return this from onPermissionRequest to grant or deny tool use. */
interface PermissionResponse {
  approved: boolean;
}

/** Options forwarded to session.sendAndWait. */
interface SendOptions {
  onToolCall?: ToolCallHandler;
}

/** A single autonomous Copilot session. */
interface CopilotSession {
  sendAndWait(prompt: string, options?: SendOptions): Promise<string>;
}

/** Configuration for creating a CopilotSession. */
interface SessionConfig {
  workingDirectory: string;
  onPermissionRequest: (req: PermissionRequest) => Promise<PermissionResponse>;
}

/** Top-level SDK client. */
interface CopilotClientInterface {
  createSession(config: SessionConfig): Promise<CopilotSession>;
}

// TODO: Remove this mock class once @github/copilot-sdk is installed.
//       Replace instantiation below with: const client = new CopilotClient();
class MockCopilotClient implements CopilotClientInterface {
  async createSession(config: SessionConfig): Promise<CopilotSession> {
    // Simulate a session that auto-approves and echoes tool call events.
    return {
      async sendAndWait(prompt: string, options?: SendOptions): Promise<string> {
        // Simulate two tool calls per iteration so the log output is meaningful.
        const simulatedTools = ["read_file", "edit_file"];
        for (const tool of simulatedTools) {
          options?.onToolCall?.(tool);
          await new Promise((r) => setTimeout(r, 50));
        }
        // Return a non-terminal response so the loop runs to max iterations.
        return "Working on next task…";
      },
    };
  }
}

// --- Prompt loader ---

/**
 * Reads the mode-specific prompt file from the project root.
 * Throws if the file is missing so the user gets a clear message.
 */
function loadPrompt(mode: "plan" | "build", projectRoot: string): string {
  const fileName = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";
  const filePath = join(projectRoot, fileName);

  if (!existsSync(filePath)) {
    throw new Error(
      `Prompt file not found: ${filePath}\n` +
        `Create ${fileName} at the project root before running ralph-loop.`
    );
  }

  return readFileSync(filePath, "utf-8").trim();
}

// --- Completion detector ---

/**
 * Returns true when the session response signals that no more tasks remain.
 * Extend this list as the project adds new completion signals.
 */
function isComplete(response: string): boolean {
  const signals = [
    "NO_MORE_TASKS",
    "Board is clear",
    "DONE",
    "All tasks complete",
    "nothing left to do",
  ];
  const lower = response.toLowerCase();
  return signals.some((s) => lower.includes(s.toLowerCase()));
}

// --- Main loop ---

async function runLoop(): Promise<void> {
  const mode = (process.argv[2] ?? "build") as "plan" | "build";
  const maxIterations = parseInt(process.argv[3] ?? "50", 10);
  const projectRoot = process.cwd();

  if (mode !== "plan" && mode !== "build") {
    console.error(`❌ Unknown mode "${mode}". Use "plan" or "build".`);
    process.exit(1);
  }

  if (isNaN(maxIterations) || maxIterations < 1) {
    console.error(`❌ max_iterations must be a positive integer. Got: ${process.argv[3]}`);
    process.exit(1);
  }

  console.log(`🔄 Ralph Loop — ${mode} mode — max ${maxIterations} iterations`);
  console.log(`📁 Working directory: ${projectRoot}\n`);

  let prompt: string;
  try {
    prompt = loadPrompt(mode, projectRoot);
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // TODO: Replace MockCopilotClient with the real SDK:
  //   import { CopilotClient } from "@github/copilot-sdk";
  //   const client = new CopilotClient();
  const client: CopilotClientInterface = new MockCopilotClient();

  let tasksCompleted = 0;
  let lastCommitMessage = "(none)";

  for (let i = 1; i <= maxIterations; i++) {
    console.log(`\n--- Iteration ${i}/${maxIterations} [${mode} mode] ---`);

    try {
      const session = await client.createSession({
        workingDirectory: projectRoot,
        // Auto-approve every tool call — no interactive prompts.
        onPermissionRequest: async (_req: PermissionRequest): Promise<PermissionResponse> => ({
          approved: true,
        }),
      });

      const response = await session.sendAndWait(prompt, {
        onToolCall: (toolName: string) => {
          console.log(`  ⚙ ${toolName}`);
          // Track git commits for the exit summary.
          if (toolName === "git_commit" || toolName === "create_commit") {
            tasksCompleted += 1;
            lastCommitMessage = `commit detected at iteration ${i}`;
          }
        },
      });

      console.log(`  ✓ Iteration complete`);

      if (isComplete(response)) {
        console.log("\n✅ All tasks complete. Ralph Loop exiting.");
        break;
      }
    } catch (err) {
      console.error(
        `  ❌ Iteration ${i} failed:`,
        err instanceof Error ? err.message : err
      );
      // Log and continue — never crash the entire loop on a single bad iteration.
    }
  }

  console.log(`\n🔄 Ralph Loop finished — ${mode} mode — ${maxIterations} iterations max`);
  console.log(`   Tasks completed (commits detected): ${tasksCompleted}`);
  console.log(`   Last commit note: ${lastCommitMessage}`);
}

runLoop().catch(console.error);
