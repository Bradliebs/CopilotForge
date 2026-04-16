'use strict';

const fs = require('fs');
const path = require('path');
const { banner, success, warn, info, separator, exists, hasGit, colors } = require('./utils');

function run() {
  const cwd = process.cwd();

  banner();
  console.log(`  ${colors.bold('\uD83D\uDD0D CopilotForge Health Check')}`);
  console.log();

  let issues = 0;
  let checks = 0;

  // Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (major >= 18) {
    success(`Node.js ${nodeVersion}`);
    checks++;
  } else {
    warn(`Node.js ${nodeVersion} — version 18+ recommended`);
    issues++;
  }

  // Core files
  const skillPath = path.join(cwd, '.github', 'skills', 'planner', 'SKILL.md');
  const refPath = path.join(cwd, '.github', 'skills', 'planner', 'reference.md');

  if (exists(skillPath)) {
    success('.github/skills/planner/SKILL.md exists');
    checks++;
  } else {
    warn('.github/skills/planner/SKILL.md not found (run: npx copilotforge init)');
    issues++;
  }

  if (exists(refPath)) {
    success('.github/skills/planner/reference.md exists');
    checks++;
  } else {
    warn('.github/skills/planner/reference.md not found (run: npx copilotforge init)');
    issues++;
  }

  // Optional files (informational)
  const forgeMd = path.join(cwd, 'FORGE.md');
  if (exists(forgeMd)) {
    success('FORGE.md exists');
    checks++;
  } else {
    warn('No FORGE.md found (run the wizard to create one)');
  }

  const agentsDir = path.join(cwd, '.copilot', 'agents');
  if (exists(agentsDir)) {
    success('.copilot/agents/ found');
    checks++;
  } else {
    warn('No .copilot/agents/ found (run the wizard to create agents)');
  }

  const memoryDir = path.join(cwd, 'forge-memory');
  if (exists(memoryDir)) {
    success('forge-memory/ found');
    checks++;
  } else {
    warn('No forge-memory/ found (run the wizard to create memory)');
  }

  const cookbookDir = path.join(cwd, 'cookbook');
  if (exists(cookbookDir)) {
    success('cookbook/ found');
    checks++;
  } else {
    warn('No cookbook/ found (run the wizard to create recipes)');
  }

  // Optional: IMPLEMENTATION_PLAN.md
  const planMd = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (exists(planMd)) {
    success('IMPLEMENTATION_PLAN.md exists');
    checks++;
  } else {
    info('Optional: IMPLEMENTATION_PLAN.md (for Ralph Loop planning mode)');
  }

  // Git
  if (hasGit()) {
    success('Git repository detected');
    checks++;

    // Check git user config
    try {
      const { execSync } = require('child_process');
      const opts = { stdio: 'pipe', cwd };
      const name = execSync('git config user.name', opts).toString().trim();
      const email = execSync('git config user.email', opts).toString().trim();
      if (name && email) {
        success(`Git user: ${name} <${email}>`);
        checks++;
      } else {
        warn('Git user.name or user.email not configured — commits may fail');
        issues++;
      }
    } catch {
      warn('Git user.name/user.email not set — run: git config --global user.name "Your Name"');
      issues++;
    }
  } else {
    warn('Not a git repository');
  }

  // Write permissions
  const testFile = path.join(cwd, '.copilotforge-test-write');
  try {
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    success('Write permissions OK');
    checks++;
  } catch {
    warn('Cannot write to project directory — check folder permissions');
    issues++;
  }

  // Version check
  const pkg = require('../package.json');
  info(`${colors.dim(`CopilotForge CLI v${pkg.version}`)}`);

  // Version stamp check
  const forgeMdPath = path.join(cwd, 'FORGE.md');
  if (exists(forgeMdPath)) {
    try {
      const forgeContent = fs.readFileSync(forgeMdPath, 'utf8');
      const stampMatch = forgeContent.match(/<!-- copilotforge: v([\d.]+) -->/);
      if (stampMatch) {
        const installedVersion = stampMatch[1];
        const currentVersion = pkg.version;
        if (installedVersion === currentVersion) {
          success(`FORGE.md version: v${installedVersion} (current)`);
          checks++;
        } else {
          warn(`FORGE.md version: v${installedVersion} (latest: v${currentVersion})`);
          info(`  Run ${colors.cyan('npx copilotforge upgrade')} to update`);
          issues++;
        }
      } else {
        info(colors.dim('  FORGE.md has no version stamp (created before v1.5.0)'));
      }
    } catch {
      // FORGE.md read error — already checked for existence above
    }
  }

  separator();

  if (issues === 0) {
    console.log(`  ${colors.green('✅ All checks passed')} (${checks} checks)`);
    console.log();
    info(
      `Ready! Say ${colors.cyan('"set up my project"')} in Copilot Chat`
    );
  } else {
    console.log(`  ${colors.yellow(`⚠️  ${issues} issue(s) found`)} (${checks} checks passed)`);
    console.log();
    info(`Fix the issues above, then run ${colors.cyan('npx copilotforge doctor')} again.`);
  }

  console.log();
}

module.exports = { run };
