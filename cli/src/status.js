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

  // Time-of-day greeting
  const hour = new Date().getHours();
  let greeting = 'Hello';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  // Try to get git user name
  let userName = 'developer';
  try {
    const { execSync } = require('child_process');
    userName =
      execSync('git config user.name', { stdio: 'pipe', cwd })
        .toString()
        .trim() || 'developer';
  } catch {}

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

// ── Plan ────────────────────────────────────────────────────────────────

function showPlan(cwd) {
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (!exists(planPath)) {
    info(
      `\uD83D\uDCCB ${pad('Plan')}${colors.yellow('No plan yet')} ${colors.dim('\u2014 say "set up my project" with Task Automation')}`
    );
    console.log();
    return;
  }

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
          // Parse: - [ ] task-id — Title
          const match = trimmed.match(/^- \[ \]\s+(\S+)\s*\u2014\s*(.+)$/);
          if (match) {
            nextTask = { id: match[1], title: match[2].trim() };
          } else {
            // Fallback: just grab everything after the checkbox
            const fallback = trimmed.replace(/^- \[ \]\s*/, '');
            nextTask = { id: '', title: fallback };
          }
        }
      }
    }

    const total = done + pending + failed;
    const countStr =
      done === total
        ? colors.green(`${done}/${total} tasks done`)
        : colors.cyan(`${done}/${total} tasks done`);

    info(`\uD83D\uDCCB ${pad('Plan')}${countStr}`);

    if (failed > 0) {
      info(`${' '.repeat(LABEL_W + 2)}${colors.yellow(`${failed} failed`)}`);
    }

    if (nextTask) {
      const taskLabel = nextTask.id
        ? `${colors.cyan(nextTask.id)} \u2014 ${nextTask.title}`
        : nextTask.title;
      info(
        `${' '.repeat(LABEL_W + 2)}${colors.dim('Next:')} ${taskLabel}`
      );
    }
  } catch {
    info(
      `\uD83D\uDCCB ${pad('Plan')}${colors.yellow('Could not read plan')}`
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

function showMemory(cwd) {
  const memDir = path.join(cwd, 'forge-memory');
  if (!exists(memDir)) {
    info(`\uD83E\uDDE0 ${pad('Memory')}${colors.yellow('Not enabled')}`);
    console.log();
    return;
  }

  const decisions = countHeadings(path.join(memDir, 'decisions.md'));
  const patterns = countHeadings(path.join(memDir, 'patterns.md'));
  const preferences = countHeadings(path.join(memDir, 'preferences.md'));

  const parts = [];
  if (decisions > 0) parts.push(`${colors.cyan(String(decisions))} decisions`);
  if (patterns > 0) parts.push(`${colors.cyan(String(patterns))} patterns`);
  if (preferences > 0)
    parts.push(`${colors.cyan(String(preferences))} preferences`);

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

function showSkills(cwd) {
  const skillsDir = path.join(cwd, '.github', 'skills');
  if (!exists(skillsDir)) {
    info(
      `\uD83D\uDD27 ${pad('Skills')}${colors.yellow('None yet')} ${colors.dim('\u2014 run the wizard')}`
    );
    console.log();
    return;
  }

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const names = entries
      .filter(
        (e) =>
          e.isDirectory() &&
          exists(path.join(skillsDir, e.name, 'SKILL.md'))
      )
      .map((e) => e.name);

    if (names.length === 0) {
      info(
        `\uD83D\uDD27 ${pad('Skills')}${colors.yellow('None yet')} ${colors.dim('\u2014 run the wizard')}`
      );
    } else {
      info(
        `\uD83D\uDD27 ${pad('Skills')}${colors.green(String(names.length))} active`
      );
      info(
        `${' '.repeat(LABEL_W + 2)}${colors.dim(names.join(' \u00B7 '))}`
      );
    }
  } catch {
    info(
      `\uD83D\uDD27 ${pad('Skills')}${colors.yellow('Could not read skills')}`
    );
  }

  console.log();
}

// ── Agents ──────────────────────────────────────────────────────────────

function showAgents(cwd) {
  const agentsDir = path.join(cwd, '.copilot', 'agents');
  if (!exists(agentsDir)) {
    info(
      `\uD83E\uDD16 ${pad('Agents')}${colors.yellow('None yet')} ${colors.dim('\u2014 run the wizard')}`
    );
    console.log();
    return;
  }

  try {
    const entries = fs.readdirSync(agentsDir);
    const names = entries
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));

    if (names.length === 0) {
      info(
        `\uD83E\uDD16 ${pad('Agents')}${colors.yellow('None yet')} ${colors.dim('\u2014 run the wizard')}`
      );
    } else {
      info(
        `\uD83E\uDD16 ${pad('Agents')}${colors.green(String(names.length))} configured`
      );
      info(
        `${' '.repeat(LABEL_W + 2)}${colors.dim(names.join(' \u00B7 '))}`
      );
    }
  } catch {
    info(
      `\uD83E\uDD16 ${pad('Agents')}${colors.yellow('Could not read agents')}`
    );
  }

  console.log();
}

// ── Cookbook ─────────────────────────────────────────────────────────────

function showCookbook(cwd) {
  const cookbookDir = path.join(cwd, 'cookbook');
  if (!exists(cookbookDir)) {
    info(`\uD83D\uDCDA ${pad('Recipes')}${colors.yellow('None yet')}`);
    console.log();
    return;
  }

  try {
    const entries = fs.readdirSync(cookbookDir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile());

    if (files.length === 0) {
      info(`\uD83D\uDCDA ${pad('Recipes')}${colors.yellow('None yet')}`);
    } else {
      info(
        `\uD83D\uDCDA ${pad('Recipes')}${colors.green(String(files.length))} files in cookbook/`
      );
    }
  } catch {
    info(
      `\uD83D\uDCDA ${pad('Recipes')}${colors.yellow('Could not read cookbook')}`
    );
  }

  console.log();
}

// ── Git ─────────────────────────────────────────────────────────────────

function showGit(cwd) {
  try {
    const { execSync } = require('child_process');
    const opts = { stdio: 'pipe', cwd };

    // Current branch
    let branch = 'unknown';
    try {
      branch = execSync('git branch --show-current', opts).toString().trim() || 'detached';
    } catch {}

    // Commits today
    let todayCount = 0;
    try {
      const logOut = execSync('git log --oneline --since="midnight"', opts)
        .toString()
        .trim();
      todayCount = logOut ? logOut.split('\n').length : 0;
    } catch {}

    // Last commit time
    let lastCommit = '';
    try {
      lastCommit = execSync('git log -1 --format="%cr"', opts)
        .toString()
        .trim();
    } catch {}

    const parts = [`branch: ${colors.cyan(branch)}`];

    if (todayCount > 0) {
      parts.push(`${colors.cyan(String(todayCount))} commits today`);
    }

    if (lastCommit) {
      parts.push(`last: ${colors.dim(lastCommit)}`);
    }

    info(
      `\uD83D\uDCCA ${pad('Git')}${parts.join(colors.dim(' \u00B7 '))}`
    );
  } catch {
    info(
      `\uD83D\uDCCA ${pad('Git')}${colors.yellow('Not a git repo')}`
    );
  }
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

module.exports = { run };
