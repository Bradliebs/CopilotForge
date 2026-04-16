/**
 * command-center.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Builds a terminal-based project dashboard that shows everything at a glance.
 *   Reads your CopilotForge project files (plan, memory, skills, agents, recipes)
 *   and displays a unified status view. Inspired by command-center-lite.
 *
 * WHEN TO USE THIS:
 *   When you want a quick overview of your project state without opening
 *   multiple files. Run it daily as your "morning briefing."
 *
 * HOW TO RUN:
 *   npx ts-node cookbook/command-center.ts           Interactive dashboard
 *   npx copilotforge status                          Static dashboard
 *   npx copilotforge                                 Interactive (built-in)
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A CopilotForge-initialized project
 *
 * EXPECTED OUTPUT:
 *   🔥 Project Dashboard — My API Project
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   📋 Plan       5/12 tasks done
 *   🧠 Memory     3 decisions · 2 patterns
 *   🔧 Skills     planner · code-review · testing
 *   🤖 Agents     planner · reviewer · tester
 *   📊 Git        branch: main · 3 commits today
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join()
 *   - macOS/Linux: Forward slashes work natively
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

// --- ANSI helpers ---

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

const LINE = "━".repeat(48);

// --- Widget interface — extend the dashboard with your own sections ---

interface Widget {
  name: string;
  emoji: string;
  render(): string[];
}

const widgets: Widget[] = [];

function registerWidget(widget: Widget): void {
  widgets.push(widget);
}

// --- Built-in scanners ---

function scanPlan(): string {
  const planPath = join(".", "IMPLEMENTATION_PLAN.md");
  if (!existsSync(planPath)) return `${c.dim}no plan found${c.reset}`;
  const lines = readFileSync(planPath, "utf-8").split("\n");
  const done = lines.filter((l) => /^- \[x\]/.test(l)).length;
  const failed = lines.filter((l) => /^- \[!\]/.test(l)).length;
  const total = lines.filter((l) => /^- \[.\]/.test(l)).length;
  const next = lines.find((l) => /^- \[ \]/.test(l))?.match(/\] (\S+)/)?.[1];
  let out = `${c.green}${done}/${total} tasks done${c.reset}`;
  if (failed) out += ` · ${c.yellow}${failed} failed${c.reset}`;
  if (next) out += ` — Next: ${c.cyan}${next}${c.reset}`;
  return out;
}

function scanMemory(): string {
  const memDir = join(".", "forge-memory");
  if (!existsSync(memDir)) return `${c.dim}no memory${c.reset}`;
  const counts: string[] = [];
  for (const file of readdirSync(memDir).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(memDir, file), "utf-8");
    const headings = text.split("\n").filter((l) => /^#{1,3} /.test(l)).length;
    counts.push(`${headings} ${basename(file, ".md")}`);
  }
  return counts.join(" · ") || `${c.dim}empty${c.reset}`;
}

function scanSkills(): string {
  const dir = join(".", ".github", "skills");
  if (!existsSync(dir)) return `${c.dim}none${c.reset}`;
  const skills = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "SKILL.md")))
    .map((d) => d.name);
  return skills.join(" · ") || `${c.dim}none${c.reset}`;
}

function scanAgents(): string {
  const dir = join(".", ".copilot", "agents");
  if (!existsSync(dir)) return `${c.dim}none${c.reset}`;
  const agents = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => basename(f, ".md"));
  return agents.join(" · ") || `${c.dim}none${c.reset}`;
}

function scanGit(): string {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: "pipe" }).toString().trim();
    const today = new Date().toISOString().slice(0, 10);
    const log = execSync(`git log --oneline --after="${today}T00:00:00"`, { stdio: "pipe" }).toString().trim();
    const commits = log ? log.split("\n").length : 0;
    const last = execSync('git log -1 --format="%ar"', { stdio: "pipe" }).toString().trim();
    return `branch: ${c.cyan}${branch}${c.reset} · ${commits} commits today · last: ${last}`;
  } catch {
    return `${c.dim}git not available${c.reset}`;
  }
}

// --- Example custom widget — add your own data sources ---

const calendarWidget: Widget = {
  name: "Calendar",
  emoji: "📅",
  render() {
    // TODO: Connect to WorkIQ MCP or any calendar API
    return ["No meetings today — focus time!"];
  },
};

// Register custom widgets here (uncomment to enable):
// registerWidget(calendarWidget);

// --- Render dashboard ---

function renderDashboard(): void {
  const projectName = existsSync("package.json")
    ? JSON.parse(readFileSync("package.json", "utf-8")).name ?? "My Project"
    : "My Project";

  const pad = (label: string) => label.padEnd(10);

  console.log();
  console.log(`${c.bold}🔥 Project Dashboard — ${projectName}${c.reset}`);
  console.log(LINE);
  console.log(`📋 ${c.bold}${pad("Plan")}${c.reset} ${scanPlan()}`);
  console.log(`🧠 ${c.bold}${pad("Memory")}${c.reset} ${scanMemory()}`);
  console.log(`🔧 ${c.bold}${pad("Skills")}${c.reset} ${scanSkills()}`);
  console.log(`🤖 ${c.bold}${pad("Agents")}${c.reset} ${scanAgents()}`);
  console.log(`📊 ${c.bold}${pad("Git")}${c.reset} ${scanGit()}`);

  for (const w of widgets) {
    const lines = w.render();
    console.log(`${w.emoji} ${c.bold}${pad(w.name)}${c.reset} ${lines[0] ?? ""}`);
    for (const line of lines.slice(1)) console.log(`   ${" ".repeat(10)} ${line}`);
  }

  console.log(LINE);
  console.log();
}

// --- Interactive menu functions ---

async function showMenu(): Promise<string> {
  console.log(`${c.cyan}What would you like to do?${c.reset}`);
  console.log();
  console.log(`  ${c.bold}[1]${c.reset} 📋 View plan details`);
  console.log(`  ${c.bold}[2]${c.reset} 🔄 Refresh dashboard`);
  console.log(`  ${c.bold}[3]${c.reset} ❌ Exit`);
  console.log();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${c.yellow}Choose an option (1–3): ${c.reset}`, (answer) => {
      rl.close();
      if (answer === "1" || answer === "plan") resolve("plan");
      if (answer === "2" || answer === "refresh") resolve("refresh");
      if (answer === "3" || answer === "exit") resolve("exit");
      resolve("refresh");
    });
  });
}

function viewPlan(): void {
  const planPath = join(".", "IMPLEMENTATION_PLAN.md");
  if (!existsSync(planPath)) {
    console.log(`${c.yellow}❌ No IMPLEMENTATION_PLAN.md found${c.reset}`);
    promptEnter();
    return;
  }

  const lines = readFileSync(planPath, "utf-8").split("\n");
  const tasks = lines.filter((l) => /^- \[.\]/.test(l));

  console.log();
  console.log(`${c.bold}📋 Plan Details${c.reset}`);
  console.log(LINE);

  let done = 0,
    pending = 0,
    failed = 0;

  for (const task of tasks) {
    if (/^- \[x\]/.test(task)) {
      console.log(`${c.green}✅${c.reset} ${task.substring(6)}`);
      done++;
    } else if (/^- \[!\]/.test(task)) {
      console.log(`${c.yellow}❌${c.reset} ${task.substring(6)}`);
      failed++;
    } else {
      console.log(`${c.dim}⬜${c.reset} ${task.substring(6)}`);
      pending++;
    }
  }

  console.log(LINE);
  const total = tasks.length;
  console.log(
    `${c.bold}Summary:${c.reset} ${done}/${total} done · ${pending} pending · ${failed} failed`
  );
  console.log();

  promptEnter();
}

function promptEnter(): void {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`${c.dim}Press Enter to return...${c.reset}`, () => {
    rl.close();
  });
}

async function interactiveDashboard(): Promise<void> {
  let firstRun = true;
  while (true) {
    if (!firstRun) console.clear();
    firstRun = false;
    renderDashboard();
    const choice = await showMenu();
    if (choice === "exit") break;
    if (choice === "plan") viewPlan();
  }
}

// --- Entry Point ---

interactiveDashboard().catch(() => process.exit(0));
