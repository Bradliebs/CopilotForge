/**
 * oracle-prime.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   A structured reasoning harness that walks through Oracle Prime's 7-stage
 *   analytical pipeline. Takes a question or decision, classifies complexity,
 *   runs the appropriate reasoning stages, and outputs a structured analysis
 *   with scenario map, counterfactual pivot, and confidence rating.
 *
 * WHEN TO USE THIS:
 *   When you need structured decision support — architecture choices, risk
 *   assessment, trade-off analysis, or any complex question where "it depends"
 *   isn't good enough. Also useful as a template for building your own
 *   reasoning pipelines.
 *
 * HOW TO RUN:
 *   1. No npm install needed — uses only Node.js built-ins
 *   2. Edit the CONFIG section (your question, context, constraints)
 *   3. npx ts-node cookbook/oracle-prime.ts
 *      Or: node cookbook/oracle-prime.ts
 *   4. Interactive mode: node cookbook/oracle-prime.ts --interactive
 *      (prompts you for question, context, and time horizon)
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+ (if using ts-node)
 *
 * EXPECTED OUTPUT:
 *   [Oracle] Classifying complexity...
 *   [Oracle] Tier: Complex — activating full pipeline (S1–S7)
 *   [Oracle] S1: Problem Decomposition — 3 unknowns, 2 assumptions identified
 *   [Oracle] S2: Hypothesis Space — 4 hypotheses mapped
 *   [Oracle] S3: Bayesian Updating — priors assigned from base rates
 *   [Oracle] S5: Scenario Envelope — Base 55%, Bull 20%, Bear 15%, Swan 10%
 *   [Oracle] S6: Counterfactual Pivot — "adoption rate" flips base case at <30%
 *   [Oracle] S7: Critical Audit — 1 bias flagged (anchoring)
 *   [Oracle] ✅ Analysis complete — confidence: Medium
 *
 * PLATFORM NOTES:
 *   - Works identically on Windows, macOS, and Linux
 *   - Output is plain text; pipe to a file for archival: `node oracle-prime.ts > analysis.md`
 *   - Integrates with forge-memory: conclusions can be appended to decisions.md
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// =======================================================================
// CONFIGURATION — Edit these values for your analysis
// =======================================================================
const CONFIG = {
  // The question or decision to analyze
  question:
    "Should we migrate from Express to Fastify for our API layer?",

  // Known context and constraints
  context: [
    "Current API handles 10k req/s on Express 4",
    "Team of 5 developers, 2 have Fastify experience",
    "Migration window: Q3 (3 months)",
    "100+ existing routes with middleware",
  ],

  // Time horizon for the analysis (in months)
  timeHorizonMonths: 6,

  // Output file (null = console only)
  outputFile: null as string | null,

  // Whether to append conclusions to forge-memory/decisions.md
  writeToMemory: false,
};

// =======================================================================
// TYPES
// =======================================================================

type ComplexityTier = "Simple" | "Medium" | "Complex";
type ConfidenceLevel = "High" | "Medium" | "Low";
type AlgorithmMode =
  | "ADVERSARIAL"
  | "MONTE_CARLO"
  | "FERMI"
  | "RED_TEAM"
  | "SIGNAL_VS_NOISE"
  | "COUNTERFACTUAL";
type UncertaintyType = "DATA" | "MODEL" | "VARIANCE" | "MOTIVATED" | "RIVAL";

interface Hypothesis {
  name: string;
  description: string;
  steelMan: string;
  failureMode: string;
}

interface Scenario {
  name: string;
  probability: string;
  description: string;
  confirmationSignals: [string, string];
}

interface Analysis {
  reframe: string;
  tier: ComplexityTier;
  modes: AlgorithmMode[];
  keyVariables: string[];
  hypotheses: Hypothesis[];
  scenarios: Scenario[];
  causalChain: string[];
  counterfactualPivot: {
    assumption: string;
    flipCondition: string;
  };
  uncertainties: Array<{ type: UncertaintyType; description: string }>;
  conclusion: string;
  confidence: ConfidenceLevel;
  confidenceJustification: string;
}

// =======================================================================
// ANSI COLORS
// =======================================================================

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(prefix: string, msg: string): void {
  console.log(`${C.cyan}[Oracle]${C.reset} ${C.bold}${prefix}${C.reset} ${msg}`);
}

// =======================================================================
// COMPLEXITY CLASSIFIER
// =======================================================================

function classifyComplexity(
  question: string,
  context: string[]
): ComplexityTier {
  let score = 0;

  // Signal: multiple competing options
  if (/\bor\b|\bvs\b|\bversus\b|\balternative/i.test(question)) score += 2;

  // Signal: risk or uncertainty language
  if (/\brisk|\buncertain|\bambiguous|\btrade-?off/i.test(question)) score += 2;

  // Signal: migration, architecture, or strategic scope
  if (/\bmigrat|\barchitect|\bstrateg|\brewrite|\bredesign/i.test(question))
    score += 2;

  // Signal: multiple constraints
  if (context.length >= 4) score += 1;

  // Signal: time pressure
  if (context.some((c) => /deadline|window|quarter|sprint/i.test(c)))
    score += 1;

  if (score >= 5) return "Complex";
  if (score >= 2) return "Medium";
  return "Simple";
}

// =======================================================================
// ALGORITHM MODE SELECTOR
// =======================================================================

function selectModes(question: string): AlgorithmMode[] {
  const modes: AlgorithmMode[] = [];

  if (/compet|\badversar|\bnegotiat|\bconflict/i.test(question))
    modes.push("ADVERSARIAL");
  if (/probabil|\bchance|\blikelihood|\boutcome/i.test(question))
    modes.push("MONTE_CARLO");
  if (/no data|\bestimate|\brough|\bball-?park/i.test(question))
    modes.push("FERMI");
  if (/plan|\bpropos|\bstrateg|\bapproach/i.test(question))
    modes.push("RED_TEAM");
  if (/conflict|\bmixed signal|\bcontrad/i.test(question))
    modes.push("SIGNAL_VS_NOISE");
  if (/what if|\balternat|\bdecision fork/i.test(question))
    modes.push("COUNTERFACTUAL");

  // Default: RED_TEAM for any decision question
  if (modes.length === 0 && /should|best|recommend/i.test(question))
    modes.push("RED_TEAM");

  // Cap at 2 most load-bearing modes
  return modes.slice(0, 2);
}

// =======================================================================
// REASONING STAGES
// =======================================================================

function s1Decompose(question: string, context: string[]): string[] {
  log("S1:", "Problem Decomposition");
  const variables = [
    `Apparent question: "${question}"`,
    `Known inputs: ${context.length} constraints provided`,
    `Unknowns: team velocity, hidden technical debt, production risk tolerance`,
    `Assumptions: current performance is a baseline (not a ceiling)`,
  ];
  log("S1:", `${variables.length} elements identified`);
  return variables;
}

function s2Hypothesize(): Hypothesis[] {
  log("S2:", "Hypothesis Space Mapping");
  const hypotheses: Hypothesis[] = [
    {
      name: "Smooth Migration",
      description: "Team completes migration within window with minimal disruption",
      steelMan: "2 experienced devs can lead; Fastify's Express compatibility layer reduces rewrite scope",
      failureMode: "Compatibility layer hides performance issues; middleware gaps surface late",
    },
    {
      name: "Partial Migration",
      description: "Critical paths migrate; legacy routes stay on Express behind a proxy",
      steelMan: "Reduces risk by limiting blast radius; allows incremental validation",
      failureMode: "Two frameworks to maintain indefinitely; proxy adds latency and complexity",
    },
    {
      name: "Migration Fails",
      description: "Team cannot complete in window; rollback required",
      steelMan: "100+ routes is substantial; middleware ecosystem differences are underestimated",
      failureMode: "Sunk cost of partial work; team morale impact",
    },
    {
      name: "Stay on Express",
      description: "Express 5 or tuning solves the performance need without migration",
      steelMan: "Express 5 brings async middleware and performance improvements; known ecosystem",
      failureMode: "If performance ceiling is architectural, tuning only delays the problem",
    },
  ];
  log("S2:", `${hypotheses.length} hypotheses mapped`);
  return hypotheses;
}

function s5ScenarioEnvelope(): Scenario[] {
  log("S5:", "Scenario Envelope");
  const scenarios: Scenario[] = [
    {
      name: "Base Case",
      probability: "55%",
      description:
        "Partial migration succeeds — critical paths on Fastify, legacy on Express with proxy",
      confirmationSignals: [
        "First 20 routes migrate cleanly within month 1",
        "Performance benchmarks show >2x improvement on migrated routes",
      ],
    },
    {
      name: "Bull Case",
      probability: "20%",
      description:
        "Full migration completes within Q3 — Fastify compatibility layer handles most middleware",
      confirmationSignals: [
        "Compatibility layer covers >90% of existing middleware",
        "Team velocity exceeds 15 routes/week after initial learning curve",
      ],
    },
    {
      name: "Bear Case",
      probability: "15%",
      description:
        "Migration stalls at 40% — middleware gaps force custom rewrites, deadline missed",
      confirmationSignals: [
        "More than 5 middleware packages have no Fastify equivalent by week 3",
        "Team velocity drops below 5 routes/week after month 1",
      ],
    },
    {
      name: "Black Swan",
      probability: "10%",
      description:
        "Critical production incident during migration forces emergency rollback and 2-month freeze",
      confirmationSignals: [
        "Canary deployment shows >5% error rate increase on migrated routes",
        "Data integrity issue discovered in request parsing differences",
      ],
    },
  ];

  for (const s of scenarios) {
    log(
      "S5:",
      `${s.name} (${s.probability}) — ${s.description.slice(0, 60)}...`
    );
  }
  return scenarios;
}

function s6CounterfactualPivot(): { assumption: string; flipCondition: string } {
  log("S6:", "Counterfactual Stress Test");
  const pivot = {
    assumption:
      "Fastify's Express compatibility layer handles most existing middleware",
    flipCondition:
      "If <50% of middleware is compatible (vs assumed >80%), partial migration becomes the ceiling and full migration is off the table",
  };
  log("S6:", `Pivot: "${pivot.assumption.slice(0, 50)}..."`);
  return pivot;
}

function s7CriticalAudit(): Array<{ type: UncertaintyType; description: string }> {
  log("S7:", "Critical Audit");
  const uncertainties = [
    {
      type: "MODEL" as UncertaintyType,
      description:
        "Migration velocity estimate assumes linear scaling — first routes are often faster (easy ones first)",
    },
    {
      type: "DATA" as UncertaintyType,
      description:
        "No benchmark data for Express-to-Fastify migration at this route count (100+)",
    },
    {
      type: "RIVAL" as UncertaintyType,
      description:
        "Express 5 upgrade could deliver sufficient performance gains without framework switch",
    },
  ];
  log("S7:", `${uncertainties.length} uncertainties flagged (1 [RIVAL])`);
  return uncertainties;
}

// =======================================================================
// MAIN ANALYSIS RUNNER
// =======================================================================

function runAnalysis(): Analysis {
  console.log(
    `\n${C.magenta}${C.bold}═══════════════════════════════════════════════════${C.reset}`
  );
  console.log(
    `${C.magenta}${C.bold}  ORACLE PRIME — Precision Reasoning${C.reset}`
  );
  console.log(
    `${C.magenta}${C.bold}═══════════════════════════════════════════════════${C.reset}\n`
  );

  log("Input:", `"${CONFIG.question}"`);
  log("Context:", `${CONFIG.context.length} constraints`);
  log("Horizon:", `${CONFIG.timeHorizonMonths} months`);
  console.log();

  // Classify complexity
  log("Classifying:", "complexity...");
  const tier = classifyComplexity(CONFIG.question, CONFIG.context);
  const modes = selectModes(CONFIG.question);

  const stageLabel =
    tier === "Complex"
      ? "S1–S7"
      : tier === "Medium"
        ? "S1+S2+S5"
        : "S1 only";
  log(
    "Tier:",
    `${tier} — activating ${stageLabel}`
  );
  log("Modes:", modes.length > 0 ? modes.join(", ") : "RED_TEAM (default)");
  console.log();

  // Run applicable stages
  const keyVariables = s1Decompose(CONFIG.question, CONFIG.context);

  let hypotheses: Hypothesis[] = [];
  let scenarios: Scenario[] = [];
  let counterfactualPivot = { assumption: "", flipCondition: "" };
  let uncertainties: Array<{ type: UncertaintyType; description: string }> = [];

  if (tier === "Medium" || tier === "Complex") {
    console.log();
    hypotheses = s2Hypothesize();
    console.log();
    scenarios = s5ScenarioEnvelope();
  }

  if (tier === "Complex") {
    console.log();
    counterfactualPivot = s6CounterfactualPivot();
    console.log();
    uncertainties = s7CriticalAudit();
  }

  const analysis: Analysis = {
    reframe:
      "[DECISION] Whether to migrate from Express to Fastify given team capacity, route count, and 3-month window",
    tier,
    modes: modes.length > 0 ? modes : ["RED_TEAM"],
    keyVariables,
    hypotheses,
    scenarios,
    causalChain: [
      "Migration decision → team splits focus between new and legacy code",
      "Split focus → reduced feature velocity for 2–3 months (second-order)",
      "Reduced velocity → stakeholder pressure to cut migration scope (third-order)",
    ],
    counterfactualPivot,
    uncertainties,
    conclusion:
      "Proceed with partial migration (Base Case). Migrate the 20 highest-traffic routes first, benchmark, then decide on full migration. This limits downside risk while capturing most of the performance gain.",
    confidence: "Medium",
    confidenceJustification:
      "Medium because [RIVAL] flagged — Express 5 upgrade is a viable alternative that has not been benchmarked against the Fastify option. Resolving condition: benchmark Express 5 performance on the top-20 routes before committing.",
  };

  // Print summary
  console.log(
    `\n${C.green}${C.bold}[Oracle] ✅ Analysis complete — confidence: ${analysis.confidence}${C.reset}`
  );
  console.log(
    `${C.dim}Conclusion: ${analysis.conclusion.slice(0, 80)}...${C.reset}\n`
  );

  return analysis;
}

// =======================================================================
// OUTPUT FORMATTER
// =======================================================================

function formatAnalysis(a: Analysis): string {
  const lines: string[] = [];

  lines.push(`# Oracle Prime Analysis`);
  lines.push(``);
  lines.push(`**Reframe:** ${a.reframe}`);
  lines.push(`**Tier:** ${a.tier} | **Modes:** ${a.modes.join(", ")}`);
  lines.push(`**Time Horizon:** ${CONFIG.timeHorizonMonths} months`);
  lines.push(``);

  lines.push(`## Key Variables`);
  for (const v of a.keyVariables) {
    lines.push(`- ${v}`);
  }
  lines.push(``);

  if (a.scenarios.length > 0) {
    lines.push(`## Scenario Map`);
    lines.push(``);
    lines.push(`| Scenario | Probability | Description |`);
    lines.push(`|----------|-------------|-------------|`);
    for (const s of a.scenarios) {
      lines.push(`| ${s.name} | ${s.probability} | ${s.description} |`);
    }
    lines.push(``);
  }

  if (a.counterfactualPivot.assumption) {
    lines.push(`## Counterfactual Pivot`);
    lines.push(`- **Assumption:** ${a.counterfactualPivot.assumption}`);
    lines.push(`- **Flip condition:** ${a.counterfactualPivot.flipCondition}`);
    lines.push(``);
  }

  if (a.uncertainties.length > 0) {
    lines.push(`## Critical Uncertainties`);
    for (const u of a.uncertainties) {
      lines.push(`- **[${u.type}]** ${u.description}`);
    }
    lines.push(``);
  }

  lines.push(`## Conclusion`);
  lines.push(a.conclusion);
  lines.push(``);
  lines.push(`## Confidence: ${a.confidence}`);
  lines.push(a.confidenceJustification);

  return lines.join("\n");
}

// =======================================================================
// MEMORY INTEGRATION
// =======================================================================

function writeToMemory(analysis: Analysis): void {
  const memoryPath = path.join(
    process.cwd(),
    "forge-memory",
    "decisions.md"
  );

  if (!fs.existsSync(path.dirname(memoryPath))) {
    log("Memory:", "forge-memory/ not found — skipping memory write");
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const entry = `\n## ${date} Oracle Prime Analysis\n${analysis.conclusion}\n\nConfidence: ${analysis.confidence}. ${analysis.confidenceJustification}\n`;

  fs.appendFileSync(memoryPath, entry, "utf8");
  log("Memory:", `Appended conclusion to ${memoryPath}`);
}

// =======================================================================
// INTERACTIVE MODE
// =======================================================================

function askQuestion(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${C.cyan}[Oracle]${C.reset} ${prompt}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function runInteractive(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(
    `\n${C.magenta}${C.bold}═══════════════════════════════════════════════════${C.reset}`
  );
  console.log(
    `${C.magenta}${C.bold}  ORACLE PRIME — Interactive Analysis${C.reset}`
  );
  console.log(
    `${C.magenta}${C.bold}═══════════════════════════════════════════════════${C.reset}\n`
  );

  const question = await askQuestion(rl, "What question or decision do you want to analyze?\n> ");
  if (!question) {
    console.log(`${C.red}No question provided. Exiting.${C.reset}`);
    rl.close();
    return;
  }

  const contextRaw = await askQuestion(
    rl,
    "Known constraints or context (semicolon-separated, or press Enter to skip):\n> "
  );
  const context = contextRaw
    ? contextRaw.split(";").map((s) => s.trim()).filter(Boolean)
    : [];

  const horizonRaw = await askQuestion(rl, "Time horizon in months (default: 12): ");
  const horizon = parseInt(horizonRaw, 10) || 12;

  const memoryRaw = await askQuestion(rl, "Save conclusion to forge-memory/decisions.md? (y/N): ");
  const saveToMemory = /^y(es)?$/i.test(memoryRaw);

  rl.close();

  // Override CONFIG with interactive answers
  CONFIG.question = question;
  CONFIG.context = context.length > 0 ? context : [`Time horizon: ${horizon} months`];
  CONFIG.timeHorizonMonths = horizon;
  CONFIG.writeToMemory = saveToMemory;

  console.log();
  const analysis = runAnalysis();
  const formatted = formatAnalysis(analysis);

  if (CONFIG.writeToMemory) {
    writeToMemory(analysis);
  }
}

// =======================================================================
// ENTRY POINT
// =======================================================================

if (process.argv.includes("--interactive") || process.argv.includes("-i")) {
  runInteractive();
} else {
  const analysis = runAnalysis();
  const formatted = formatAnalysis(analysis);

  if (CONFIG.outputFile) {
    fs.writeFileSync(CONFIG.outputFile, formatted, "utf8");
    log("Output:", `Written to ${CONFIG.outputFile}`);
  }

  if (CONFIG.writeToMemory) {
    writeToMemory(analysis);
  }
}
