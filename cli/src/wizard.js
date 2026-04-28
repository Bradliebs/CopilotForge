'use strict';

const readline = require('readline');
const path = require('path');
const { banner, colors, separator, info, success, warn, exists } = require('./utils');

// Power Platform signal keywords (from forge-compass)
const PP_SIGNALS = [
  'no-code', 'low-code', 'copilot studio', 'connector', 'canvas app',
  'power automate', 'flow', 'pcf', 'power component', 'power bi',
  'report', 'semantic model', 'sharepoint', 'teams', 'power pages',
];

// Known extras list (matching Q6 in planner SKILL.md)
const EXTRAS = [
  { key: 'task-automation', label: '🔄 Task automation', desc: 'AI writes a step-by-step plan and builds it for you' },
  { key: 'auto-experiments', label: '🧪 Auto-experiments', desc: 'AI tries code changes, runs tests, keeps what works' },
  { key: 'knowledge-wiki', label: '📚 Knowledge wiki', desc: 'Drop in notes and articles, get a searchable reference' },
  { key: 'cli-hooks', label: '🔗 CLI hooks', desc: 'Auto-logging and safety checks during AI sessions' },
  { key: 'blog-writer', label: '✍️ Blog writer', desc: 'Turns your pull requests into blog posts' },
  { key: 'template-factory', label: '📋 Template factory', desc: 'Auto-generates READMEs, issue templates, project docs' },
  { key: 'pr-dashboard', label: '📊 PR dashboard', desc: 'Live charts of open PRs, reviewers, and age' },
  { key: 'command-center', label: '🏠 Command center', desc: 'Terminal dashboard showing your project at a glance' },
  { key: 'copilot-studio', label: '🏗️ Copilot Studio', desc: 'Build enterprise agents (requires Power Platform)' },
  { key: 'code-apps', label: '💻 Code Apps', desc: 'Power Apps with React/TypeScript (requires Power Platform)' },
  { key: 'custom-agents', label: '🧩 Custom agents', desc: '.agent.md profiles for GitHub Copilot' },
  { key: 'oracle-prime', label: '🔮 Oracle Prime', desc: 'Precision reasoning for complex decisions and risk analysis' },
];

// ── Readline helpers ────────────────────────────────────────────────────

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(`  ${question}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

function promptYN(rl, question, defaultYes = true) {
  const hint = defaultYes ? '(Y/n)' : '(y/N)';
  return new Promise((resolve) => {
    rl.question(`  ${question} ${hint} `, (answer) => {
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

// ── Power Platform detection ────────────────────────────────────────────

function detectPPSignals(description) {
  const lower = description.toLowerCase();
  return PP_SIGNALS.filter((s) => lower.includes(s));
}

// ── Main wizard ─────────────────────────────────────────────────────────

async function run() {
  // Non-interactive: fall through to interactive menu
  if (!process.stdin.isTTY) {
    info(colors.dim('Non-interactive terminal — falling back to status dashboard'));
    require('./status').run();
    return;
  }

  // Graceful Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n');
    info(colors.dim('Wizard cancelled.'));
    process.exit(0);
  });

  banner();
  console.log(`  ${colors.bold('🚀 CopilotForge Setup Wizard')}`);
  console.log(`  ${colors.dim('Answer a few questions to scaffold your project.')}`);

  // Trust trajectory — record session and get behavior
  let trustBehavior = { level: 'cautious', skipConfirmation: false, suggestExtras: false, verbosity: 'verbose' };
  try {
    const { recordSession, getTrustBehavior } = require('./trust');
    recordSession();
    trustBehavior = getTrustBehavior();
    if (trustBehavior.level !== 'cautious') {
      console.log(`  ${colors.dim(`Trust level: ${trustBehavior.level} (score: ${trustBehavior.score})`)}`);
    }
  } catch { /* trust is optional */ }

  separator();

  const rl = createRL();
  const answers = {};

  // Smart build path detection (Phase 18)
  let detectedPath = null;
  try {
    const { detectBuildPath } = require('./smart-detect');
    const detection = detectBuildPath(process.cwd());
    if (detection.confidence === 'explicit') {
      info(`  Build path: ${colors.cyan(detection.path)} — ${detection.name} (from FORGE.md)`);
      detectedPath = detection;
    } else if (detection.confidence === 'high') {
      info(`  Detected: ${colors.cyan(detection.path)} — ${detection.name}`);
      info(colors.dim(`  ${detection.reason}`));
      detectedPath = detection;
    } else if (detection.confidence === 'medium') {
      info(`  Possible: ${colors.cyan(detection.path)} — ${detection.name}`);
      detectedPath = detection;
    }
    if (detectedPath) console.log();
  } catch { /* smart-detect is optional */ }

  // Q1 — What are you building?
  let q1 = '';
  while (!q1) {
    q1 = await prompt(rl, `${colors.cyan('Q1.')} What are you building?\n  > `);
    if (!q1) console.log(`  ${colors.yellow('Please enter a project description.')}`);
  }
  answers.project = q1;
  console.log();

  // Detect Power Platform signals
  const ppSignals = detectPPSignals(q1);
  if (ppSignals.length > 0) {
    info(colors.dim(`Detected Power Platform signals: ${ppSignals.join(', ')}`));
    console.log();
  }

  // Q2 — What's your stack?
  const q2 = await prompt(rl, `${colors.cyan('Q2.')} What's your stack? ${colors.dim('(or press Enter to auto-detect)')}\n  > `);
  answers.stack = q2 || 'auto-detect';
  console.log();

  // Q3 — Persistent memory?
  const q3 = await promptYN(rl, `${colors.cyan('Q3.')} Enable persistent memory across sessions?`, true);
  answers.memory = q3;
  console.log();

  // Q4 — Test automation?
  const q4 = await promptYN(rl, `${colors.cyan('Q4.')} Enable test automation?`, true);
  answers.testing = q4;
  console.log();

  // Q5 — Experience level
  let q5 = '';
  while (!['beginner', 'intermediate', 'advanced'].includes(q5)) {
    q5 = await prompt(rl, `${colors.cyan('Q5.')} Experience level? ${colors.dim('(beginner / intermediate / advanced)')}\n  > `);
    q5 = q5.toLowerCase() || 'beginner';
    if (!['beginner', 'intermediate', 'advanced'].includes(q5)) {
      console.log(`  ${colors.yellow('Choose: beginner, intermediate, or advanced')}`);
      q5 = '';
    }
  }
  answers.level = q5;
  console.log();

  // Q6 — Extras
  if (trustBehavior.suggestExtras) {
    console.log(`  ${colors.cyan('Q6.')} Suggested extras for your trust level (${trustBehavior.level}):`);
    console.log(`  ${colors.dim('Task automation + Oracle Prime are popular picks at your level.')}`);
  } else {
    console.log(`  ${colors.cyan('Q6.')} Want to add any extras? ${colors.dim('(enter numbers separated by commas, or press Enter to skip)')}`);
  }  console.log();
  for (let i = 0; i < EXTRAS.length; i++) {
    console.log(`  ${colors.cyan(`[${i + 1}]`)} ${EXTRAS[i].label} — ${colors.dim(EXTRAS[i].desc)}`);
  }
  console.log();
  const q6 = await prompt(rl, '> ');
  const selectedExtras = [];
  if (q6) {
    const nums = q6.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= EXTRAS.length);
    for (const n of nums) {
      selectedExtras.push(EXTRAS[n - 1].key);
    }
  }
  answers.extras = selectedExtras;
  console.log();

  rl.close();

  // Summary
  separator();
  console.log(`  ${colors.bold('📋 Summary')}`);
  console.log();
  console.log(`  ${colors.dim('Project:')}   ${answers.project}`);
  console.log(`  ${colors.dim('Stack:')}     ${answers.stack}`);
  console.log(`  ${colors.dim('Memory:')}    ${answers.memory ? 'yes' : 'no'}`);
  console.log(`  ${colors.dim('Testing:')}   ${answers.testing ? 'yes' : 'no'}`);
  console.log(`  ${colors.dim('Level:')}     ${answers.level}`);
  console.log(`  ${colors.dim('Extras:')}    ${answers.extras.length > 0 ? answers.extras.join(', ') : 'none'}`);

  if (ppSignals.length > 0) {
    console.log(`  ${colors.dim('PP signals:')} ${ppSignals.join(', ')}`);
  }

  separator();

  // Confirm
  const rl2 = createRL();
  let proceed;

  if (trustBehavior.skipConfirmation) {
    // Trust level 'autonomous' — skip confirmation
    console.log(`  ${colors.green('✅')} Auto-confirmed (trust level: ${trustBehavior.level})`);
    proceed = true;
  } else {
    proceed = await promptYN(rl2, 'Proceed with scaffolding?', true);
  }
  rl2.close();

  if (!proceed) {
    console.log();
    info('Cancelled. Run the wizard anytime with: npx copilotforge');
    console.log();
    return;
  }

  // Record trust signal: user confirmed without changes
  try {
    const { recordSignal } = require('./trust');
    recordSignal('confirmations');
    if (answers.extras.length > 0) {
      recordSignal('extrasSelected', answers.extras.length);
    }
  } catch { /* trust is optional */ }

  // Fire WizardComplete hook
  try {
    const { fireHooks } = require('./hooks');
    await fireHooks('WizardComplete', { answers });
  } catch { /* hooks are optional */ }

  // Run init with answers
  const answersJson = JSON.stringify(answers);
  const initArgs = ['--full', '--yes', '--answers', answersJson];
  console.log();
  await require('./init').run(initArgs);

  // Auto-generate implementation plan from wizard answers
  try {
    const { writePlan } = require('./plan-generator');
    const { taskCount, written } = writePlan(answers);
    if (written) {
      success(`Generated IMPLEMENTATION_PLAN.md with ${taskCount} tasks`);
      info(colors.dim('  Say "run the plan" in Copilot Chat to start building automatically.'));
    }
  } catch { /* plan generation is optional */ }
}

module.exports = { run, EXTRAS, PP_SIGNALS, detectPPSignals };
