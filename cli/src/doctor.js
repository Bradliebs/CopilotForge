'use strict';

const path = require('path');
const { banner, success, warn, info, separator, exists, hasGit, colors } = require('./utils');

function run() {
  const cwd = process.cwd();

  banner();
  console.log(`  ${colors.bold('\uD83D\uDD0D CopilotForge Health Check')}`);
  console.log();

  let issues = 0;
  let checks = 0;

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

  // Git
  if (hasGit()) {
    success('Git repository detected');
    checks++;
  } else {
    warn('Not a git repository');
  }

  separator();

  if (issues === 0) {
    info(
      `${colors.green('Status: Ready')} \u2014 say ${colors.cyan('"set up my project"')} in Copilot Chat`
    );
  } else {
    info(
      `${colors.yellow('Status: Incomplete')} \u2014 run ${colors.cyan('npx copilotforge init')} first`
    );
  }

  console.log();
}

module.exports = { run };
