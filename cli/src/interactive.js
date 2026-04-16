'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { banner, colors, separator, info, menu, exists, warn, success } = require('./utils');
const {
  getPlanData, getMemoryData, getSkillsData, getAgentsData,
  getCookbookData, getGitData, getGreeting,
} = require('./status');

const LABEL_W = 10;

function pad(label) {
  return label.padEnd(LABEL_W);
}

// ── Helpers ─────────────────────────────────────────────────────────────

function waitForEnter(prompt = 'Press Enter to continue...') {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve();
      return;
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`\n  ${colors.dim(prompt)} `, () => {
      rl.close();
      resolve();
    });
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────

function showDashboard(cwd) {
  console.log();
  console.log(`  ${colors.bold(colors.red('\uD83D\uDD25 CopilotForge \u2014 Command Center'))}`);
  console.log(`  ${getGreeting(cwd)}`);
  separator();

  // Plan
  const plan = getPlanData(cwd);
  if (plan.total > 0) {
    const next = plan.nextTask ? ` \u2014 Next: ${colors.cyan(plan.nextTask.id || plan.nextTask.title)}` : '';
    info(`\uD83D\uDCCB ${pad('Plan')}${colors.cyan(`${plan.done}/${plan.total}`)} tasks done${next}`);
  } else {
    info(`\uD83D\uDCCB ${pad('Plan')}${colors.yellow('No plan yet')}`);
  }

  // Memory
  const mem = getMemoryData(cwd);
  const memTotal = mem.decisions + mem.patterns + mem.preferences;
  if (memTotal > 0) {
    const parts = [];
    if (mem.decisions > 0) parts.push(`${mem.decisions} decisions`);
    if (mem.patterns > 0) parts.push(`${mem.patterns} patterns`);
    if (mem.preferences > 0) parts.push(`${mem.preferences} preferences`);
    info(`\uD83E\uDDE0 ${pad('Memory')}${colors.cyan(parts.join(colors.dim(' \u00B7 ')))}`);
  } else {
    info(`\uD83E\uDDE0 ${pad('Memory')}${colors.yellow('Empty')}`);
  }

  // Skills
  const skills = getSkillsData(cwd);
  if (skills.names.length > 0) {
    info(`\uD83D\uDD27 ${pad('Skills')}${colors.cyan(skills.names.join(colors.dim(' \u00B7 ')))}`);
  } else {
    info(`\uD83D\uDD27 ${pad('Skills')}${colors.yellow('None yet')}`);
  }

  // Agents
  const agents = getAgentsData(cwd);
  if (agents.names.length > 0) {
    info(`\uD83E\uDD16 ${pad('Agents')}${colors.cyan(agents.names.join(colors.dim(' \u00B7 ')))}`);
  } else {
    info(`\uD83E\uDD16 ${pad('Agents')}${colors.yellow('None yet')}`);
  }

  // Recipes
  const cookbook = getCookbookData(cwd);
  if (cookbook.count > 0) {
    info(`\uD83D\uDCDA ${pad('Recipes')}${colors.cyan(String(cookbook.count))} files`);
  } else {
    info(`\uD83D\uDCDA ${pad('Recipes')}${colors.yellow('None yet')}`);
  }

  // Git
  const git = getGitData(cwd);
  if (git.branch !== 'unknown') {
    const gitParts = [`branch: ${colors.cyan(git.branch)}`];
    if (git.commitsToday > 0) {
      gitParts.push(`${colors.cyan(String(git.commitsToday))} commits today`);
    }
    info(`\uD83D\uDCCA ${pad('Git')}${gitParts.join(colors.dim(' \u00B7 '))}`);
  } else {
    info(`\uD83D\uDCCA ${pad('Git')}${colors.yellow('Not a git repo')}`);
  }

  separator();
}

// ── Plan Viewer ─────────────────────────────────────────────────────────

async function showPlanViewer(cwd) {
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  let content;
  try {
    content = fs.readFileSync(planPath, 'utf8');
  } catch {
    warn('Could not read IMPLEMENTATION_PLAN.md');
    await waitForEnter();
    return;
  }

  console.log();
  console.log(`  ${colors.bold('\uD83D\uDCCB Implementation Plan')}`);
  console.log();

  const lines = content.split('\n');
  let done = 0;
  let failed = 0;
  let total = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^- \[x\]/i.test(trimmed)) {
      done++;
      total++;
      console.log(`  \u2705 ${trimmed.replace(/^- \[x\]\s*/i, '')}`);
    } else if (/^- \[!\]/.test(trimmed)) {
      failed++;
      total++;
      console.log(`  \u274C ${colors.red(trimmed.replace(/^- \[!\]\s*/, ''))}`);
    } else if (/^- \[ \]/.test(trimmed)) {
      total++;
      console.log(`  \u2B1C ${colors.dim(trimmed.replace(/^- \[ \]\s*/, ''))}`);
    } else if (trimmed.startsWith('#')) {
      console.log(`  ${colors.bold(trimmed)}`);
    } else if (trimmed) {
      console.log(`  ${trimmed}`);
    }
  }

  console.log();
  const summary = [`${done}/${total} done`];
  if (failed > 0) summary.push(`${failed} failed`);
  info(colors.dim(summary.join(' \u00B7 ')));

  await waitForEnter('Press Enter to go back...');
}

// ── Guide Viewer ────────────────────────────────────────────────────────

async function showGuide(cwd) {
  const guidePath = path.join(cwd, 'docs', 'GETTING-STARTED.md');
  let content;
  try {
    content = fs.readFileSync(guidePath, 'utf8');
  } catch {
    warn('Could not read docs/GETTING-STARTED.md');
    await waitForEnter();
    return;
  }

  console.log();

  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      console.log(`  ${colors.dim(line)}`);
    } else if (inCodeBlock) {
      console.log(`  ${colors.cyan(line)}`);
    } else if (line.trim().startsWith('#')) {
      console.log(`  ${colors.bold(line)}`);
    } else {
      console.log(`  ${line}`);
    }
  }

  await waitForEnter('Press Enter to go back...');
}

// ── Menu Builder ────────────────────────────────────────────────────────

function buildMenuItems(cwd) {
  const hasInit = exists(path.join(cwd, '.github', 'skills', 'planner', 'SKILL.md'));
  const hasPlan = exists(path.join(cwd, 'IMPLEMENTATION_PLAN.md'));
  const hasGuide = exists(path.join(cwd, 'docs', 'GETTING-STARTED.md'));

  return [
    { label: '\uD83D\uDE80 Set up my project',       value: 'init',    show: !hasInit },
    { label: '\uD83D\uDD0D Check my setup (doctor)',  value: 'doctor',  show: true },
    { label: '\u2B06\uFE0F  Update to latest',        value: 'upgrade', show: hasInit },
    { label: '\uD83D\uDCCB View my plan',             value: 'plan',    show: hasPlan },
    { label: '\uD83D\uDCD6 Getting started guide',    value: 'guide',   show: hasGuide },
    { label: '\uD83D\uDD04 Refresh dashboard',        value: 'refresh', show: true },
    { label: '\u274C Exit',                            value: 'exit',    show: true },
  ];
}

// ── Action Handler ──────────────────────────────────────────────────────

async function handleChoice(choice, cwd) {
  switch (choice) {
    case 'init':
      await require('./init').run([]);
      await waitForEnter();
      break;
    case 'doctor':
      require('./doctor').run();
      await waitForEnter();
      break;
    case 'upgrade':
      await require('./upgrade').run([]);
      await waitForEnter();
      break;
    case 'plan':
      await showPlanViewer(cwd);
      break;
    case 'guide':
      await showGuide(cwd);
      break;
    case 'refresh':
      // Just loop back — dashboard refreshes on each iteration
      break;
    case 'exit':
      return false;
    default:
      break;
  }
  return true;
}

// ── Main Loop ───────────────────────────────────────────────────────────

async function run() {
  const cwd = process.cwd();

  // Non-interactive: fall through to static status output
  if (!process.stdin.isTTY) {
    require('./status').run();
    return;
  }

  // Graceful Ctrl+C
  process.on('SIGINT', () => {
    console.log();
    process.exit(0);
  });

  let firstIteration = true;

  while (true) {
    if (!firstIteration) {
      console.clear();
    }
    firstIteration = false;

    showDashboard(cwd);

    const menuItems = buildMenuItems(cwd);
    const choice = await menu(menuItems);

    const continueLoop = await handleChoice(choice, cwd);
    if (!continueLoop) break;
  }

  console.log();
  info(colors.dim('Goodbye! \uD83D\uDC4B'));
  console.log();
}

module.exports = { run };
