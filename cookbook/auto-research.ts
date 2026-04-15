/**
 * auto-research.ts — CopilotForge Cookbook Recipe
 *
 * Inspired by: https://github.com/karpathy/autoresearch
 *
 * WHAT THIS DOES:
 *   Autonomous experiment harness — a loop that tracks code modifications,
 *   runs evaluations, keeps improvements, discards failures, and logs
 *   everything to a TSV. Works with ANY codebase where you have a file to
 *   modify and a command to evaluate the result.
 *
 * WHEN TO USE THIS:
 *   When you want to let an AI agent (or yourself) experiment on code
 *   autonomously — trying changes, measuring impact, keeping what works.
 *   Great for: hyperparameter tuning, algorithm optimization, prompt
 *   engineering, performance benchmarking, or any iterative improvement task.
 *
 * HOW TO RUN:
 *   1. No npm install needed — uses only Node.js built-ins
 *   2. Edit the CONFIG section at the top (target file, eval command, metric)
 *   3. npx ts-node cookbook/auto-research.ts
 *      Or: node cookbook/auto-research.ts
 *   4. Optional: create a program.md for AI-driven experimentation:
 *      npx ts-node cookbook/auto-research.ts --generate-program
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - Git (for experiment tracking)
 *
 * EXPECTED OUTPUT:
 *   [AutoResearch] Initializing on branch autoresearch/apr15...
 *   [AutoResearch] Running baseline evaluation...
 *   [Baseline] metric: 0.9979 (recorded)
 *   [Experiment 1] Applied proposal: increase-batch-size.patch
 *   [Experiment 1] metric: 0.9832 ✅ IMPROVED (was 0.9979)
 *   [Experiment 2] Applied proposal: swap-optimizer.patch
 *   [Experiment 2] metric: 1.0100 ❌ WORSE (best: 0.9832) — reverting
 *   [Experiment 3] Evaluation crashed: OOM — reverting
 *   [Summary] 3 experiments: 1 kept, 1 discarded, 1 crashed. Best: 0.9832
 *
 * PLATFORM NOTES:
 *   - Windows: Git must be in PATH. Use PowerShell or Git Bash.
 *   - macOS/Linux: Works natively with bash.
 *   - The eval command runs in a child process with configurable timeout.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync, spawn } from "child_process";

// =======================================================================
// CONFIGURATION — Edit these values for your project
// =======================================================================
const CONFIG = {
  // TODO: Set the file your AI agent will modify
  targetFile: "src/model.ts",

  // TODO: Set the command to evaluate changes (tests, benchmarks, etc.)
  evalCommand: "npm test",

  // TODO: Set a regex to extract the metric from eval output
  // The first capture group should be the numeric value
  metricPattern: /score:\s*([\d.]+)/,

  // TODO: Is lower better (like loss) or higher better (like accuracy)?
  lowerIsBetter: true,

  // TODO: Max seconds per evaluation run
  timeoutSeconds: 300,

  // TODO: Git branch prefix for experiments
  branchPrefix: "autoresearch",

  // TODO: Max experiments (0 = unlimited, runs until stopped)
  maxExperiments: 0,
};

// =======================================================================
// ANSI Color Codes
// =======================================================================
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(message: string) {
  log(`\n${colors.bright}${colors.cyan}[AutoResearch]${colors.reset} ${message}`);
}

function logExperiment(expNum: number, message: string) {
  log(`${colors.bright}[Experiment ${expNum}]${colors.reset} ${message}`);
}

function logBaseline(message: string) {
  log(`${colors.magenta}[Baseline]${colors.reset} ${message}`);
}

function logSuccess(message: string) {
  log(`  ${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message: string) {
  log(`  ${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message: string) {
  log(`  ${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// =======================================================================
// Git Utilities
// =======================================================================
function gitExec(command: string): string {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${command}\n${error.message}`);
  }
}

function getCurrentCommit(): string {
  return gitExec("git rev-parse --short HEAD");
}

function getCurrentBranch(): string {
  return gitExec("git rev-parse --abbrev-ref HEAD");
}

function createExperimentBranch(tag: string): string {
  const branchName = `${CONFIG.branchPrefix}/${tag}`;
  try {
    gitExec(`git checkout -b ${branchName}`);
    log(`Created and switched to branch: ${colors.cyan}${branchName}${colors.reset}`);
  } catch (error) {
    // Branch might already exist, try to switch to it
    try {
      gitExec(`git checkout ${branchName}`);
      log(`Switched to existing branch: ${colors.cyan}${branchName}${colors.reset}`);
    } catch (switchError) {
      throw new Error(`Failed to create or switch to branch ${branchName}`);
    }
  }
  return branchName;
}

function commitChanges(message: string) {
  try {
    gitExec("git add -A");
    gitExec(`git commit -m "${message}"`);
  } catch (error: any) {
    // It's okay if there are no changes to commit
    if (!error.message.includes("nothing to commit")) {
      throw error;
    }
  }
}

function resetToCommit(commitSha: string) {
  gitExec(`git reset --hard ${commitSha}`);
}

// =======================================================================
// Evaluation with Timeout
// =======================================================================
interface EvalResult {
  output: string;
  exitCode: number;
  timedOut: boolean;
  error?: string;
}

function runEvaluation(command: string, timeoutMs: number): Promise<EvalResult> {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutMs);

    child.stdout?.on("data", (data) => {
      output += data.toString();
    });

    child.stderr?.on("data", (data) => {
      output += data.toString();
    });

    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({
        output,
        exitCode: exitCode ?? -1,
        timedOut,
      });
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        output,
        exitCode: -1,
        timedOut: false,
        error: error.message,
      });
    });
  });
}

function extractMetric(output: string, pattern: RegExp): number | null {
  const match = output.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? null : value;
  }
  return null;
}

// =======================================================================
// Results Logging
// =======================================================================
interface ExperimentResult {
  experiment: number;
  commit: string;
  metric: number | string;
  status: "keep" | "discard" | "crash";
  description: string;
  timestamp: string;
}

function initResultsFile(filePath: string) {
  const header = "experiment\tcommit\tmetric\tstatus\tdescription\ttimestamp\n";
  fs.writeFileSync(filePath, header, "utf-8");
}

function appendResult(filePath: string, result: ExperimentResult) {
  const row = `${result.experiment}\t${result.commit}\t${result.metric}\t${result.status}\t${result.description}\t${result.timestamp}\n`;
  fs.appendFileSync(filePath, row, "utf-8");
}

// =======================================================================
// Proposals Pattern
// =======================================================================
function getProposalsDir(): string {
  return path.join(process.cwd(), "proposals");
}

function ensureProposalsDir() {
  const dir = getProposalsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created proposals directory: ${colors.dim}${dir}${colors.reset}`);
    
    // Create example files
    const examplePatch = `# Example patch file
# Place .patch files here for the harness to apply
# Or place replacement files with the same name as your target file
# 
# For a .patch file, use standard unified diff format:
# diff --git a/src/model.ts b/src/model.ts
# --- a/src/model.ts
# +++ b/src/model.ts
# @@ -10,7 +10,7 @@
# -  learningRate: 0.001,
# +  learningRate: 0.01,
`;
    fs.writeFileSync(path.join(dir, "README.txt"), examplePatch, "utf-8");
  }
}

function getNextProposal(): { file: string; type: "patch" | "replacement" } | null {
  const dir = getProposalsDir();
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".patch") || f === path.basename(CONFIG.targetFile))
    .sort();

  if (files.length === 0) return null;

  const file = files[0];
  const type = file.endsWith(".patch") ? "patch" : "replacement";
  return { file: path.join(dir, file), type };
}

function applyProposal(proposal: { file: string; type: string }): string {
  const fileName = path.basename(proposal.file);
  
  if (proposal.type === "patch") {
    try {
      const patchContent = fs.readFileSync(proposal.file, "utf-8");
      fs.writeFileSync("temp.patch", patchContent, "utf-8");
      execSync("git apply temp.patch", { encoding: "utf-8" });
      fs.unlinkSync("temp.patch");
      fs.unlinkSync(proposal.file); // Remove processed proposal
      return `Applied patch: ${fileName}`;
    } catch (error: any) {
      fs.unlinkSync(proposal.file); // Remove bad proposal
      throw new Error(`Failed to apply patch ${fileName}: ${error.message}`);
    }
  } else {
    // Replacement file
    const content = fs.readFileSync(proposal.file, "utf-8");
    fs.writeFileSync(CONFIG.targetFile, content, "utf-8");
    fs.unlinkSync(proposal.file); // Remove processed proposal
    return `Replaced ${CONFIG.targetFile} with ${fileName}`;
  }
}

// =======================================================================
// MODIFICATION STEP — This is where AI agent proposes changes
// =======================================================================
// This is where your AI agent proposes changes to the target file.
// In Karpathy's autoresearch, this is done by the AI agent itself
// (Claude, Codex, Copilot) reading program.md and modifying the code.
//
// Options:
//   1. Run this harness manually and make changes yourself between runs
//   2. Use the Copilot SDK to have an AI propose changes programmatically
//   3. Point your AI assistant at program.md and let it drive the loop
//
// For option 3 (recommended), create a program.md in your repo with
// instructions like Karpathy's autoresearch. Then tell your AI:
//   "Read program.md and start experimenting"
//
// For now, this function reads from a "proposals/" directory where
// you (or an AI) can drop modification patches/files.
// =======================================================================
async function waitForModification(expNum: number): Promise<string> {
  log(`${colors.dim}Waiting for modification...${colors.reset}`);
  log(`${colors.dim}Options:${colors.reset}`);
  log(`${colors.dim}  1. Drop a .patch file in proposals/ directory${colors.reset}`);
  log(`${colors.dim}  2. Drop a replacement file (${path.basename(CONFIG.targetFile)}) in proposals/${colors.reset}`);
  log(`${colors.dim}  3. Manually edit ${CONFIG.targetFile} and press Enter${colors.reset}`);
  log(`${colors.dim}  4. Press Ctrl+C to stop${colors.reset}\n`);

  // Check for proposals first
  let proposal = getNextProposal();
  if (proposal) {
    return applyProposal(proposal);
  }

  // Otherwise, poll for proposals or wait for user input
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const proposal = getNextProposal();
      if (proposal) {
        clearInterval(checkInterval);
        try {
          const description = applyProposal(proposal);
          resolve(description);
        } catch (error: any) {
          logError(error.message);
          resolve(`Failed proposal: ${path.basename(proposal.file)}`);
        }
      }
    }, 2000);

    // Also allow manual proceed by pressing Enter
    process.stdin.once("data", () => {
      clearInterval(checkInterval);
      resolve(`Manual modification (experiment ${expNum})`);
    });
  });
}

// =======================================================================
// Program.md Generator
// =======================================================================
function generateProgramMd() {
  const content = `# Auto-Research Program

This document tells an AI agent how to autonomously experiment on the codebase.

## Target

**File to modify:** \`${CONFIG.targetFile}\`

This is the file you will be editing to try improvements.

## Evaluation

**Command:** \`${CONFIG.evalCommand}\`

**Metric extraction:** The output will contain a metric that looks like this:
\`\`\`
${CONFIG.metricPattern.source}
\`\`\`

**Goal:** ${CONFIG.lowerIsBetter ? "Lower is better (minimize the metric)" : "Higher is better (maximize the metric)"}

## Experiment Protocol

1. **Read** \`results.tsv\` to see what's been tried and what worked
2. **Analyze** the current state of \`${CONFIG.targetFile}\`
3. **Propose** a modification (explain your reasoning)
4. **Create** a patch file or replacement file in the \`proposals/\` directory:
   - For a patch: \`proposals/001-description.patch\` (use \`git diff\` format)
   - For a replacement: \`proposals/${path.basename(CONFIG.targetFile)}\`
5. **Wait** for the harness to apply your change, run the eval, and log the result
6. **Repeat** with the next experiment

## Guidelines

- Start with small, targeted changes
- If something fails, try to understand why before trying something similar
- Keep track of what works and what doesn't by reading \`results.tsv\`
- Don't repeat failed experiments
- Build on successes incrementally
- If you hit a plateau, try a different approach

## Stopping Criteria

The harness will run ${CONFIG.maxExperiments === 0 ? "indefinitely until you stop it (Ctrl+C)" : `for ${CONFIG.maxExperiments} experiments`}.

You should consider stopping when:
- Metric has converged (no improvement in last N experiments)
- You've exhausted reasonable ideas
- Time/resource constraints are reached

## Files You'll Work With

- \`${CONFIG.targetFile}\` — The code you're improving
- \`results.tsv\` — Log of all experiments and their results
- \`proposals/\` — Directory where you place your proposed changes

## Example Workflow

\`\`\`bash
# Terminal 1: Run the harness
npx ts-node cookbook/auto-research.ts

# Terminal 2: Make proposals
# Read the results
cat results.tsv

# Analyze the current code
cat ${CONFIG.targetFile}

# Create a proposal (example: increasing a parameter)
cat > proposals/001-increase-param.patch << 'EOF'
diff --git a/${CONFIG.targetFile} b/${CONFIG.targetFile}
--- a/${CONFIG.targetFile}
+++ b/${CONFIG.targetFile}
@@ -10,7 +10,7 @@
-  learningRate: 0.001,
+  learningRate: 0.01,
EOF

# The harness will automatically detect and apply the proposal
\`\`\`

## Tips for AI Agents

- Use the git history to see what's been tried: \`git log --oneline\`
- Read the evaluation output carefully to understand failures
- Keep a mental model of the parameter space you're exploring
- Don't be afraid to backtrack and try different directions
- Document your reasoning in the patch file name or commit message
`;

  const outputPath = path.join(process.cwd(), "program.md");
  fs.writeFileSync(outputPath, content, "utf-8");
  logSuccess(`Generated program.md at ${outputPath}`);
  log(`\n${colors.bright}Next steps:${colors.reset}`);
  log(`  1. Review and customize program.md`);
  log(`  2. Run: ${colors.cyan}npx ts-node cookbook/auto-research.ts${colors.reset}`);
  log(`  3. Tell your AI agent: "Read program.md and start experimenting"\n`);
}

// =======================================================================
// Main Experiment Loop
// =======================================================================
async function runExperiments() {
  // Ensure we're in a git repo
  try {
    gitExec("git rev-parse --git-dir");
  } catch {
    logError("Not a git repository. Please run 'git init' first.");
    process.exit(1);
  }

  // Setup
  const tag = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const branchName = createExperimentBranch(tag);
  const resultsFile = path.join(process.cwd(), "results.tsv");
  
  ensureProposalsDir();
  initResultsFile(resultsFile);
  
  logSection(`Initialized on branch ${colors.cyan}${branchName}${colors.reset}`);
  log(`Results will be logged to: ${colors.dim}${resultsFile}${colors.reset}`);
  log(`Target file: ${colors.dim}${CONFIG.targetFile}${colors.reset}`);
  log(`Eval command: ${colors.dim}${CONFIG.evalCommand}${colors.reset}\n`);

  // Track metrics
  let bestMetric: number | null = null;
  let experimentCount = 0;
  let keepCount = 0;
  let discardCount = 0;
  let crashCount = 0;

  // Baseline evaluation
  logBaseline("Running baseline evaluation...");
  const baselineCommit = getCurrentCommit();
  const baselineEval = await runEvaluation(CONFIG.evalCommand, CONFIG.timeoutSeconds * 1000);
  
  if (baselineEval.timedOut) {
    logError(`Baseline evaluation timed out after ${CONFIG.timeoutSeconds}s`);
    process.exit(1);
  }

  if (baselineEval.exitCode !== 0) {
    logWarning(`Baseline evaluation exited with code ${baselineEval.exitCode}`);
    log(`${colors.dim}Output:\n${baselineEval.output}${colors.reset}\n`);
  }

  const baselineMetric = extractMetric(baselineEval.output, CONFIG.metricPattern);
  if (baselineMetric === null) {
    logError("Failed to extract metric from baseline output");
    log(`${colors.dim}Pattern: ${CONFIG.metricPattern}${colors.reset}`);
    log(`${colors.dim}Output:\n${baselineEval.output}${colors.reset}\n`);
    process.exit(1);
  }

  bestMetric = baselineMetric;
  logBaseline(`metric: ${colors.bright}${baselineMetric.toFixed(4)}${colors.reset} (recorded)`);
  
  appendResult(resultsFile, {
    experiment: 0,
    commit: baselineCommit,
    metric: baselineMetric.toFixed(4),
    status: "keep",
    description: "baseline",
    timestamp: new Date().toISOString(),
  });

  // Main experiment loop
  const maxExp = CONFIG.maxExperiments || Infinity;
  
  while (experimentCount < maxExp) {
    experimentCount++;
    logExperiment(experimentCount, "Starting...");

    // Wait for modification
    let description: string;
    try {
      description = await waitForModification(experimentCount);
      logExperiment(experimentCount, description);
    } catch (error: any) {
      logError(`Modification failed: ${error.message}`);
      continue;
    }

    // Commit the changes
    const commitMsg = `Experiment ${experimentCount}: ${description}`;
    try {
      commitChanges(commitMsg);
    } catch (error: any) {
      logWarning(`Git commit skipped: ${error.message}`);
    }
    
    const currentCommit = getCurrentCommit();

    // Run evaluation
    log(`  ${colors.dim}Running evaluation...${colors.reset}`);
    const evalResult = await runEvaluation(CONFIG.evalCommand, CONFIG.timeoutSeconds * 1000);

    let status: "keep" | "discard" | "crash";
    let metric: number | string;

    if (evalResult.timedOut) {
      status = "crash";
      metric = "timeout";
      logError(`TIMEOUT after ${CONFIG.timeoutSeconds}s — reverting`);
      resetToCommit(getCurrentCommit() + "~1");
      crashCount++;
    } else if (evalResult.error) {
      status = "crash";
      metric = "error";
      logError(`ERROR: ${evalResult.error} — reverting`);
      resetToCommit(getCurrentCommit() + "~1");
      crashCount++;
    } else {
      const extractedMetric = extractMetric(evalResult.output, CONFIG.metricPattern);
      
      if (extractedMetric === null) {
        status = "crash";
        metric = "parse_error";
        logError("Failed to extract metric from output — reverting");
        log(`${colors.dim}Output:\n${evalResult.output.slice(0, 500)}...${colors.reset}`);
        resetToCommit(getCurrentCommit() + "~1");
        crashCount++;
      } else {
        metric = extractedMetric;
        const improved = CONFIG.lowerIsBetter 
          ? extractedMetric < bestMetric!
          : extractedMetric > bestMetric!;

        if (improved) {
          status = "keep";
          const oldBest = bestMetric;
          bestMetric = extractedMetric;
          logSuccess(`IMPROVED: ${extractedMetric.toFixed(4)} (was ${oldBest!.toFixed(4)})`);
          keepCount++;
        } else {
          status = "discard";
          logError(`WORSE: ${extractedMetric.toFixed(4)} (best: ${bestMetric!.toFixed(4)}) — reverting`);
          resetToCommit(getCurrentCommit() + "~1");
          discardCount++;
        }
      }
    }

    // Log result
    appendResult(resultsFile, {
      experiment: experimentCount,
      commit: currentCommit,
      metric: typeof metric === "number" ? metric.toFixed(4) : metric,
      status,
      description,
      timestamp: new Date().toISOString(),
    });

    // Print summary
    log(`${colors.dim}  [Total: ${experimentCount} | Kept: ${keepCount} | Discarded: ${discardCount} | Crashed: ${crashCount} | Best: ${bestMetric?.toFixed(4)}]${colors.reset}\n`);
  }

  // Final summary
  logSection("Experiment session complete");
  log(`${colors.bright}Results:${colors.reset}`);
  log(`  Total experiments: ${experimentCount}`);
  log(`  Kept: ${colors.green}${keepCount}${colors.reset}`);
  log(`  Discarded: ${colors.red}${discardCount}${colors.reset}`);
  log(`  Crashed: ${colors.yellow}${crashCount}${colors.reset}`);
  log(`  Best metric: ${colors.bright}${colors.cyan}${bestMetric?.toFixed(4)}${colors.reset}`);
  log(`\nResults saved to: ${resultsFile}\n`);
}

// =======================================================================
// CLI Entry Point
// =======================================================================
function main() {
  const args = process.argv.slice(2);

  if (args.includes("--generate-program") || args.includes("-g")) {
    generateProgramMd();
    return;
  }

  // Handle graceful shutdown
  let shutdownRequested = false;
  process.on("SIGINT", () => {
    if (shutdownRequested) {
      log("\n${colors.red}Force quit${colors.reset}");
      process.exit(1);
    }
    shutdownRequested = true;
    log(`\n\n${colors.yellow}Shutdown requested. Finishing current experiment...${colors.reset}`);
    log(`${colors.dim}Press Ctrl+C again to force quit${colors.reset}\n`);
  });

  runExperiments().catch((error) => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

main();
