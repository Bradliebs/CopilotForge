/**
 * pr-visualization.ts — CopilotForge Cookbook Recipe
 *
 * Adapted from: https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk/nodejs/pr-visualization.md
 *
 * WHAT THIS DOES:
 *   Interactive CLI tool that visualizes PR age distribution for a GitHub repo.
 *   Auto-detects the repo from git remote or accepts a --repo flag, fetches
 *   open PRs, buckets them by age, and renders a bar chart in the terminal.
 *
 * WHEN TO USE THIS:
 *   When you want to understand your team's PR review cadence — quickly see
 *   how many PRs are fresh vs. stale, and ask follow-up questions interactively.
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Set your API key:
 *        bash/zsh:     export COPILOT_API_KEY="your-key-here"
 *        PowerShell:   $env:COPILOT_API_KEY="your-key-here"
 *        Windows cmd:  set COPILOT_API_KEY=your-key-here
 *   3. npx ts-node cookbook/pr-visualization.ts
 *      npx ts-node cookbook/pr-visualization.ts --repo owner/repo
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid Copilot API key
 *   - git CLI available (for auto-detect)
 *
 * EXPECTED OUTPUT:
 *   [Detect] Repository: owner/repo-name
 *   [Fetch] Found 14 open PRs
 *   [Chart] PR Age Distribution
 *     < 1 day   ████████ 4
 *     1-3 days  ██████████████ 7
 *     4-7 days  ████ 2
 *     > 7 days  ██ 1
 *   [Interactive] Ask a follow-up (or "quit"):
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join()
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

import { execSync } from "node:child_process";
import * as readline from "node:readline";

// --- Types ---

interface PullRequest {
  number: number;
  title: string;
  author: string;
  createdAt: Date;
  ageDays: number;
}

interface AgeBucket {
  label: string;
  minDays: number;
  maxDays: number;
  prs: PullRequest[];
}

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
  createSession(): CopilotSession;
  stop(): void;
}

// --- Mock SDK (replace with real import) ---
// TODO: Replace with: import { CopilotClient } from "@github/copilot-sdk";

function createCopilotClient(config: CopilotClientConfig): CopilotClient {
  const sessionId = `sess_${Date.now()}`;
  return {
    start() {
      console.log("[Client] Starting...");
    },
    createSession(): CopilotSession {
      return {
        id: sessionId,
        async send(message: string): Promise<string> {
          // TODO: Real SDK uses built-in GitHub MCP Server for PR data.
          return `[Copilot] Analyzed your request: "${message.slice(0, 60)}..."`;
        },
        destroy() {},
      };
    },
    stop() {
      console.log("[Client] Stopped.");
    },
  };
}

// --- Repo Detection ---

function detectRepoFromGit(): string | null {
  try {
    const remoteUrl = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();

    // Handle SSH: git@github.com:owner/repo.git
    const sshMatch = remoteUrl.match(/github\.com[:/](.+?\/.+?)(?:\.git)?$/);
    if (sshMatch) return sshMatch[1];

    // Handle HTTPS: https://github.com/owner/repo.git
    const httpsMatch = remoteUrl.match(/github\.com\/(.+?\/.+?)(?:\.git)?$/);
    if (httpsMatch) return httpsMatch[1];

    return null;
  } catch {
    return null;
  }
}

function parseRepoArg(args: string[]): string | null {
  const idx = args.indexOf("--repo");
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

function resolveRepo(args: string[]): string {
  const fromArg = parseRepoArg(args);
  if (fromArg) {
    console.log(`[Detect] Repository (from --repo): ${fromArg}`);
    return fromArg;
  }

  const fromGit = detectRepoFromGit();
  if (fromGit) {
    console.log(`[Detect] Repository (from git remote): ${fromGit}`);
    return fromGit;
  }

  throw new Error(
    "Could not detect repository. Run from a git repo or pass --repo owner/name."
  );
}

// --- Mock PR Fetching ---
// TODO: Replace with actual GitHub API calls or let Copilot's built-in
//       GitHub MCP Server tools handle PR fetching automatically.

function fetchOpenPRs(repo: string): PullRequest[] {
  const now = Date.now();
  const day = 86_400_000;

  // Simulated PR data for demonstration.
  const mockPRs: Array<{ number: number; title: string; author: string; daysAgo: number }> = [
    { number: 101, title: "Add user authentication", author: "alice", daysAgo: 0.3 },
    { number: 102, title: "Fix pagination bug", author: "bob", daysAgo: 0.8 },
    { number: 103, title: "Update dependencies", author: "alice", daysAgo: 1.2 },
    { number: 104, title: "Refactor database layer", author: "charlie", daysAgo: 1.5 },
    { number: 105, title: "Add rate limiting", author: "bob", daysAgo: 2.0 },
    { number: 106, title: "New dashboard UI", author: "diana", daysAgo: 2.8 },
    { number: 107, title: "CI pipeline improvements", author: "alice", daysAgo: 3.5 },
    { number: 108, title: "API versioning support", author: "charlie", daysAgo: 4.0 },
    { number: 109, title: "Fix memory leak in worker", author: "bob", daysAgo: 5.2 },
    { number: 110, title: "Add search functionality", author: "diana", daysAgo: 6.0 },
    { number: 111, title: "Migrate to new ORM", author: "alice", daysAgo: 8.0 },
    { number: 112, title: "Legacy API deprecation", author: "charlie", daysAgo: 12.0 },
    { number: 113, title: "Logging overhaul", author: "bob", daysAgo: 0.5 },
    { number: 114, title: "Dark mode support", author: "diana", daysAgo: 1.9 },
  ];

  console.log(`[Fetch] Found ${mockPRs.length} open PRs`);

  return mockPRs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.author,
    createdAt: new Date(now - pr.daysAgo * day),
    ageDays: pr.daysAgo,
  }));
}

// --- Chart Rendering ---

const AGE_BUCKETS: Array<{ label: string; minDays: number; maxDays: number }> = [
  { label: "< 1 day ", minDays: 0, maxDays: 1 },
  { label: "1-3 days", minDays: 1, maxDays: 3 },
  { label: "4-7 days", minDays: 4, maxDays: 7 },
  { label: "> 7 days", minDays: 7, maxDays: Infinity },
];

function bucketPRs(prs: PullRequest[]): AgeBucket[] {
  return AGE_BUCKETS.map((bucket) => ({
    ...bucket,
    prs: prs.filter((pr) => pr.ageDays >= bucket.minDays && pr.ageDays < bucket.maxDays),
  }));
}

function renderBarChart(buckets: AgeBucket[]): void {
  const maxCount = Math.max(...buckets.map((b) => b.prs.length), 1);
  const maxBarWidth = 40;

  console.log("\n[Chart] PR Age Distribution");
  for (const bucket of buckets) {
    const count = bucket.prs.length;
    const barLength = Math.round((count / maxCount) * maxBarWidth);
    const bar = "█".repeat(barLength);
    console.log(`  ${bucket.label}  ${bar} ${count}`);
  }
  console.log("");
}

// --- Interactive Follow-up ---

async function interactiveLoop(
  session: CopilotSession,
  repo: string,
  prs: PullRequest[]
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  const context = `Repository: ${repo}, ${prs.length} open PRs. ` +
    `Age breakdown: ${AGE_BUCKETS.map((b) => {
      const count = prs.filter((pr) => pr.ageDays >= b.minDays && pr.ageDays < b.maxDays).length;
      return `${b.label.trim()}: ${count}`;
    }).join(", ")}`;

  console.log("[Interactive] Ask a follow-up (or \"quit\"):");

  while (true) {
    const question = await prompt("> ");
    if (!question || question.toLowerCase() === "quit") {
      break;
    }

    try {
      const response = await session.send(`${context}\n\nUser question: ${question}`);
      console.log(response);
    } catch (error) {
      console.error("[Error]", error instanceof Error ? error.message : error);
    }
  }

  rl.close();
}

// --- Main ---

async function main(): Promise<void> {
  const apiKey = process.env.COPILOT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing COPILOT_API_KEY environment variable.");
  }

  // 1. Detect or accept the target repository.
  const repo = resolveRepo(process.argv.slice(2));

  // 2. Fetch open PRs.
  const prs = fetchOpenPRs(repo);

  // 3. Bucket by age and render chart.
  const buckets = bucketPRs(prs);
  renderBarChart(buckets);

  // 4. Start an interactive Copilot session for follow-up questions.
  // The real SDK uses built-in capabilities (GitHub MCP Server, code execution)
  // — no custom tools needed.
  const client = createCopilotClient({ apiKey });
  client.start();

  const session = client.createSession();

  try {
    await interactiveLoop(session, repo, prs);
  } catch (error) {
    console.error("[Error]", error instanceof Error ? error.message : error);
  } finally {
    session.destroy();
    client.stop();
  }
}

// Run the example.
main().catch(console.error);
