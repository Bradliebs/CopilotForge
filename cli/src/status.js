'use strict';

const fs = require('fs');
const path = require('path');
const { banner, colors, separator, info, exists } = require('./utils');

// Consistent label width for alignment
const LABEL_W = 16;

function pad(label) {
  return label.padEnd(LABEL_W);
}

function run() {
  const cwd = process.cwd();

  banner();
  console.log(`  ${colors.bold('\uD83D\uDCCA Command Center')}`);
  console.log();

  const { greeting, userName } = _greetingParts(cwd);
  console.log(
    `  ${greeting}, ${colors.cyan(userName)}! Here's your project at a glance.`
  );
  console.log();
  separator();

  showPlan(cwd);
  showMemory(cwd);
  showSkills(cwd);
  showAgents(cwd);
  showCookbook(cwd);
  showGit(cwd);

  separator();
  showNextStep(cwd);
  console.log();
}

// ── Greeting ────────────────────────────────────────────────────────────

function _greetingParts(cwd) {
  const hour = new Date().getHours();
  let greeting = 'Hello';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  let userName = 'developer';
  try {
    const { execSync } = require('child_process');
    userName =
      execSync('git config user.name', { stdio: 'pipe', cwd })
        .toString()
        .trim() || 'developer';
  } catch {}

  return { greeting, userName };
}

function getGreeting(cwd = process.cwd()) {
  const { greeting, userName } = _greetingParts(cwd);
  return `${greeting}, ${userName}! Here's your project at a glance.`;
}

// ── Plan ────────────────────────────────────────────────────────────────

function getPlanData(cwd = process.cwd()) {
  const defaults = { done: 0, failed: 0, pending: 0, total: 0, nextTask: null };
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (!exists(planPath)) return defaults;

  try {
    const content = fs.readFileSync(planPath, 'utf8');
    const lines = content.split('\n');

    let done = 0;
    let pending = 0;
    let failed = 0;
    let nextTask = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^- \[x\]/i.test(trimmed)) {
        done++;
      } else if (/^- \[!\]/.test(trimmed)) {
        failed++;
      } else if (/^- \[ \]/.test(trimmed)) {
        pending++;
        if (!nextTask) {
          const match = trimmed.match(/^- \[ \]\s+(\S+)\s*\u2014\s*(.+)$/);
          if (match) {
            nextTask = { id: match[1], title: match[2].trim() };
          } else {
            const fallback = trimmed.replace(/^- \[ \]\s*/, '');
            nextTask = { id: '', title: fallback };
          }
        }
      }
    }

    const total = done + pending + failed;
    return { done, failed, pending, total, nextTask };
  } catch {
    return defaults;
  }
}

function showPlan(cwd) {
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (!exists(planPath)) {
    info(
      `\uD83D\uDCCB ${pad('Plan')}${colors.yellow('No plan yet')} ${colors.dim('\u2014 say "set up my project" with Task Automation')}`
    );
    console.log();
    return;
  }

  const data = getPlanData(cwd);

  if (data.total === 0) {
    info(
      `\uD83D\uDCCB ${pad('Plan')}${colors.yellow('Could not read plan')}`
    );
    console.log();
    return;
  }

  const countStr =
    data.done === data.total
      ? colors.green(`${data.done}/${data.total} tasks done`)
      : colors.cyan(`${data.done}/${data.total} tasks done`);

  info(`\uD83D\uDCCB ${pad('Plan')}${countStr}`);

  if (data.failed > 0) {
    info(`${' '.repeat(LABEL_W + 2)}${colors.yellow(`${data.failed} failed`)}`);
  }

  if (data.nextTask) {
    const taskLabel = data.nextTask.id
      ? `${colors.cyan(data.nextTask.id)} \u2014 ${data.nextTask.title}`
      : data.nextTask.title;
    info(
      `${' '.repeat(LABEL_W + 2)}${colors.dim('Next:')} ${taskLabel}`
    );
  }

  console.log();
}

// ── Memory ──────────────────────────────────────────────────────────────

function countHeadings(filePath) {
  try {
    if (!exists(filePath)) return 0;
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/^## .+$/gm);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

function getMemoryData(cwd = process.cwd()) {
  const memDir = path.join(cwd, 'forge-memory');
  if (!exists(memDir)) return { decisions: 0, patterns: 0, preferences: 0 };

  return {
    decisions: countHeadings(path.join(memDir, 'decisions.md')),
    patterns: countHeadings(path.join(memDir, 'patterns.md')),
    preferences: countHeadings(path.join(memDir, 'preferences.md')),
  };
}

function showMemory(cwd) {
  const memDir = path.join(cwd, 'forge-memory');
  if (!exists(memDir)) {
    info(`\uD83E\uDDE0 ${pad('Memory')}${colors.yellow('Not enabled')}`);
    console.log();
    return;
  }

  const data = getMemoryData(cwd);

  const parts = [];
  if (data.decisions > 0) parts.push(`${colors.cyan(String(data.decisions))} decisions`);
  if (data.patterns > 0) parts.push(`${colors.cyan(String(data.patterns))} patterns`);
  if (data.preferences > 0)
    parts.push(`${colors.cyan(String(data.preferences))} preferences`);

  if (parts.length === 0) {
    info(
      `\uD83E\uDDE0 ${pad('Memory')}${colors.yellow('Empty')} ${colors.dim('\u2014 files exist but no entries yet')}`
    );
  } else {
    info(`\uD83E\uDDE0 ${pad('Memory')}${parts.join(colors.dim(' \u00B7 '))}`);
  }

  console.log();
}

// ── Skills ──────────────────────────────────────────────────────────────

function getSkillsData(cwd = process.cwd()) {
  const skillsDir = path.join(cwd, '.github', 'skills');
  if (!exists(skillsDir)) return { names: [] };

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const names = entries
      .filter(
        (e) =>
          e.isDirectory() &&
          exists(path.join(skillsDir, e.name, 'SKILL.md'))
      )
      .map((e) => e.name);
    return { names };
  } catch {
    return { names: [] };
  }
}

function showSkills(cwd) {
  const data = getSkillsData(cwd);

  if (data.names.length === 0) {
    info(
      `\uD83D\uDD27 ${pad('Skills')}${colors.yellow('None yet')} ${colors.dim('\u2014 run the wizard')}`
    );
    console.log();
    return;
  }

  info(
    `\uD83D\uDD27 ${pad('Skills')}${colors.green(String(data.names.length))} active`
  );

  const styledNames = data.names.map((n) =>
    n === 'oracle-prime' ? `\uD83D\uDD2E ${n}` : n
  );
  info(
    `${' '.repeat(LABEL_W + 2)}${colors.dim(styledNames.join(' \u00B7 '))}`
  );

  console.log();
}

// ── Agents ──────────────────────────────────────────────────────────────

function getAgentsData(cwd = process.cwd()) {
  const agentsDir = path.join(cwd, '.copilot', 'agents');
  if (!exists(agentsDir)) return { names: [] };

  try {
    const entries = fs.readdirSync(agentsDir);
    const names = entries
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
    return { names };
  } catch {
    return { names: [] };
  }
}

function showAgents(cwd) {
  const data = getAgentsData(cwd);

  if (data.names.length === 0) {
    info(
      `\uD83E\uDD16 ${pad('Agents')}${colors.yellow('None yet')} ${colors.dim('\u2014 run the wizard')}`
    );
    console.log();
    return;
  }

  info(
    `\uD83E\uDD16 ${pad('Agents')}${colors.green(String(data.names.length))} configured`
  );
  info(
    `${' '.repeat(LABEL_W + 2)}${colors.dim(data.names.join(' \u00B7 '))}`
  );

  console.log();
}

// ── Cookbook ─────────────────────────────────────────────────────────────

function getCookbookData(cwd = process.cwd()) {
  const cookbookDir = path.join(cwd, 'cookbook');
  if (!exists(cookbookDir)) return { count: 0 };

  try {
    const entries = fs.readdirSync(cookbookDir, { withFileTypes: true });
    const count = entries.filter((e) => e.isFile()).length;
    return { count };
  } catch {
    return { count: 0 };
  }
}

function showCookbook(cwd) {
  const data = getCookbookData(cwd);
  const cookbookDir = path.join(cwd, 'cookbook');

  if (!exists(cookbookDir) || data.count === 0) {
    info(`\uD83D\uDCDA ${pad('Recipes')}${colors.yellow('None yet')}`);
    console.log();
    return;
  }

  info(
    `\uD83D\uDCDA ${pad('Recipes')}${colors.green(String(data.count))} files in cookbook/`
  );

  console.log();
}

// ── Git ─────────────────────────────────────────────────────────────────

function getGitData(cwd = process.cwd()) {
  try {
    const { execSync } = require('child_process');
    const opts = { stdio: 'pipe', cwd };

    let branch = 'unknown';
    try {
      branch = execSync('git branch --show-current', opts).toString().trim() || 'detached';
    } catch {}

    let commitsToday = 0;
    try {
      const logOut = execSync('git log --oneline --since="midnight"', opts)
        .toString()
        .trim();
      commitsToday = logOut ? logOut.split('\n').length : 0;
    } catch {}

    let lastCommit = '';
    try {
      lastCommit = execSync('git log -1 --format="%cr"', opts)
        .toString()
        .trim();
    } catch {}

    return { branch, commitsToday, lastCommit };
  } catch {
    return { branch: 'unknown', commitsToday: 0, lastCommit: '' };
  }
}

function showGit(cwd) {
  const data = getGitData(cwd);

  if (data.branch === 'unknown' && data.commitsToday === 0 && !data.lastCommit) {
    info(
      `\uD83D\uDCCA ${pad('Git')}${colors.yellow('Not a git repo')}`
    );
    return;
  }

  const parts = [`branch: ${colors.cyan(data.branch)}`];

  if (data.commitsToday > 0) {
    parts.push(`${colors.cyan(String(data.commitsToday))} commits today`);
  }

  if (data.lastCommit) {
    parts.push(`last: ${colors.dim(data.lastCommit)}`);
  }

  info(
    `\uD83D\uDCCA ${pad('Git')}${parts.join(colors.dim(' \u00B7 '))}`
  );
}

// ── Next Step ───────────────────────────────────────────────────────────

function showNextStep(cwd) {
  const hasSkill = exists(
    path.join(cwd, '.github', 'skills', 'planner', 'SKILL.md')
  );
  const hasForge = exists(path.join(cwd, 'FORGE.md'));
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  const hasPlan = exists(planPath);

  let hasPending = false;
  if (hasPlan) {
    try {
      const content = fs.readFileSync(planPath, 'utf8');
      hasPending = /^- \[ \]/m.test(content);
    } catch {}
  }

  let tip;

  if (!hasSkill) {
    tip = `Run ${colors.cyan('npx copilotforge init')} to get started`;
  } else if (!hasForge) {
    tip = `Say ${colors.cyan('"set up my project"')} in Copilot Chat`;
  } else if (hasPending) {
    tip = `Say ${colors.cyan('"run the plan"')} to continue building`;
  } else {
    tip = `Say ${colors.cyan('"review this code"')} or ${colors.cyan('"write tests"')} to use your skills`;
  }

  info(`\uD83D\uDCA1 ${colors.bold('Next step:')} ${tip}`);
}

module.exports = { run, getPlanData, getMemoryData, getSkillsData, getAgentsData, getCookbookData, getGitData, getGreeting };