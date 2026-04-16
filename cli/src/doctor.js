'use strict';

const fs = require('fs');
const path = require('path');
const { banner, success, warn, fail, info, separator, exists, hasGit, colors } = require('./utils');

// Phase 13: path stamp reader
function readPathStamp(forgeContent) {
  if (!forgeContent) return null;
  const match = forgeContent.match(/<!-- copilotforge: path=([A-J]) -->/);
  return match ? match[1] : null;
}

const PATH_NAMES = {
  A: 'Copilot Studio Agent',
  B: 'Studio Connector',
  C: 'Declarative Agent',
  D: 'Canvas App Agent',
  E: 'Power Automate',
  F: 'PCF Component',
  G: 'Power BI Report',
  H: 'SharePoint Agent',
  I: 'Power Pages',
};

// Phase 13: path-specific prerequisite checks
function runPathChecks(pathStamp) {
  const { execSync } = require('child_process');
  let pathIssues = 0;
  let pathChecks = 0;
  const pathName = PATH_NAMES[pathStamp] || pathStamp;

  try {
    info(`ℹ️  Power Platform path ${pathStamp} (${pathName}) detected. Run \`pac auth create\` to authenticate with your environment before scaffolding.`);

    if (pathStamp === 'F') {
      try {
        const nodeVer = process.version;
        const nodeMajor = parseInt(nodeVer.slice(1).split('.')[0], 10);
        if (nodeMajor >= 16) {
          success(`Node.js ${nodeVer} meets PCF Component Framework requirement (≥16)`);
          pathChecks++;
        } else {
          fail(`PCF Component Framework requires Node.js ≥16. You have ${nodeVer}. Please upgrade.`);
          pathIssues++;
        }
      } catch (e) {
        warn(`Could not run path ${pathStamp} check: ${e.message}`);
      }

      try {
        const pacOut = execSync('pac --version', { stdio: 'pipe' }).toString().trim();
        success(`pac CLI found (${pacOut})`);
        pathChecks++;
      } catch {
        warn('pac CLI not found. Install Power Platform CLI: https://aka.ms/PowerAppsCLI');
      }
    }

    if (pathStamp === 'B' || pathStamp === 'I') {
      try {
        execSync('paconn --version', { stdio: 'pipe' });
        success('paconn CLI found');
        pathChecks++;
      } catch {
        warn('paconn not found. Custom connector dev needs: npm install -g paconn');
      }
    }

    if (pathStamp === 'G') {
      info('ℹ️  Path G (Power BI Report): Power BI Desktop is required for local development. Download at https://aka.ms/pbidesktopstore');
    }
  } catch (e) {
    warn(`Could not run path ${pathStamp} check: ${e.message}`);
  }

  return { pathIssues, pathChecks };
}

function run() {
  const cwd = process.cwd();

  banner();
  console.log(`  ${colors.bold('\uD83D\uDD0D CopilotForge Health Check')}`);
  console.log();

  let issues = 0;
  let checks = 0;
  let forgeContent = null;

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
      forgeContent = fs.readFileSync(forgeMdPath, 'utf8');
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

  // Phase 13: path-aware checks
  const pathStamp = readPathStamp(forgeContent);
  if (pathStamp && pathStamp !== 'J') {
    const { pathIssues, pathChecks } = runPathChecks(pathStamp);
    issues += pathIssues;
    checks += pathChecks;
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
