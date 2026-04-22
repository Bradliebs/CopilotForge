'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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
  let pathIssues = 0;
  let pathChecks = 0;
  const pathName = PATH_NAMES[pathStamp] || pathStamp;

  try {
    info(`Info Power Platform path ${pathStamp} (${pathName}) detected. Run pac auth create to authenticate.`);

    if (pathStamp === 'F') {
      try {
        const nodeVer = process.version;
        const nodeMajor = parseInt(nodeVer.slice(1).split('.')[0], 10);
        if (nodeMajor >= 16) {
          success(`Node.js ${nodeVer} meets PCF Component Framework requirement`);
          pathChecks++;
        } else {
          fail(`PCF Component Framework requires Node.js >=16. You have ${nodeVer}. Please upgrade.`);
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
      info('Path G (Power BI Report): Power BI Desktop required for local development. Download at https://aka.ms/pbidesktopstore');
    }
  } catch (e) {
    warn(`Could not run path ${pathStamp} check: ${e.message}`);
  }

  return { pathIssues, pathChecks };
}

function run() {
  const cwd = process.cwd();
  const jsonMode = process.argv.includes('--json');
  const pkg = require('../package.json');

  const checkResults = [];

  function recordCheck(name, status, message, detail) {
    checkResults.push({ name, status, message, detail: detail || '' });
    if (!jsonMode) {
      if (status === 'pass') success(message);
      else if (status === 'warn') warn(message);
      else fail(message);
    }
  }

  if (!jsonMode) {
    banner();
    console.log(`  \u{1F50D} CopilotForge Health Check`);
    console.log();
  }

  // Node.js version (>=18)
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (major >= 18) {
    recordCheck('Node.js version', 'pass', `Node.js ${nodeVersion} -- OK`, 'Required: >=18.0.0');
  } else {
    recordCheck('Node.js version', 'fail', `Node.js ${nodeVersion} -- requires >=18.0.0`, 'Required: >=18.0.0');
  }

  // git user.name
  try {
    const name = execSync('git config user.name', { stdio: 'pipe', cwd }).toString().trim();
    if (name) {
      recordCheck('git user.name', 'pass', 'git user.name configured -- OK', '');
    } else {
      recordCheck('git user.name', 'warn', "git user.name not set -- commits may fail (run: git config --global user.name 'Your Name')", '');
    }
  } catch {
    recordCheck('git user.name', 'warn', "git user.name not set -- commits may fail (run: git config --global user.name 'Your Name')", '');
  }

  // git user.email
  try {
    const email = execSync('git config user.email', { stdio: 'pipe', cwd }).toString().trim();
    if (email) {
      recordCheck('git user.email', 'pass', 'git user.email configured -- OK', '');
    } else {
      recordCheck('git user.email', 'warn', "git user.email not set -- commits may fail (run: git config --global user.email 'you@example.com')", '');
    }
  } catch {
    recordCheck('git user.email', 'warn', "git user.email not set -- commits may fail (run: git config --global user.email 'you@example.com')", '');
  }

  // VS Code CLI (soft -- warn only)
  let vscodeFound = false;
  try {
    execSync('code --version', { stdio: 'pipe' });
    vscodeFound = true;
    recordCheck('VS Code', 'pass', 'VS Code detected -- OK', '');
  } catch {
    recordCheck('VS Code', 'warn', 'VS Code not found in PATH -- install from https://code.visualstudio.com or add code to PATH', '');
  }

  // GitHub Copilot extension (only if VS Code found)
  if (vscodeFound) {
    try {
      const extensions = execSync('code --list-extensions', { stdio: 'pipe' }).toString().toLowerCase();
      if (extensions.includes('github.copilot')) {
        recordCheck('GitHub Copilot extension', 'pass', 'GitHub Copilot extension detected -- OK', '');
      } else {
        recordCheck('GitHub Copilot extension', 'warn', 'GitHub Copilot extension not found -- install from VS Code marketplace', '');
      }
    } catch {
      recordCheck('GitHub Copilot extension', 'warn', 'GitHub Copilot extension not found -- install from VS Code marketplace', '');
    }
  }

  let forgeContent = null;

  const skillPath = path.join(cwd, '.github', 'skills', 'planner', 'SKILL.md');
  const refPath = path.join(cwd, '.github', 'skills', 'planner', 'reference.md');

  if (exists(skillPath)) {
    recordCheck('planner SKILL.md', 'pass', '.github/skills/planner/SKILL.md exists', '');
  } else {
    recordCheck('planner SKILL.md', 'warn', '.github/skills/planner/SKILL.md not found (run: npx copilotforge init)', '');
  }

  if (exists(refPath)) {
    recordCheck('planner reference.md', 'pass', '.github/skills/planner/reference.md exists', '');
  } else {
    recordCheck('planner reference.md', 'warn', '.github/skills/planner/reference.md not found (run: npx copilotforge init)', '');
  }

  const forgeMd = path.join(cwd, 'FORGE.md');
  if (exists(forgeMd)) {
    recordCheck('FORGE.md', 'pass', 'FORGE.md exists', '');
  } else {
    recordCheck('FORGE.md', 'warn', 'No FORGE.md found (run the wizard to create one)', '');
  }

  const agentsDir = path.join(cwd, '.copilot', 'agents');
  if (exists(agentsDir)) {
    recordCheck('.copilot/agents/', 'pass', '.copilot/agents/ found', '');
  } else {
    recordCheck('.copilot/agents/', 'warn', 'No .copilot/agents/ found (run the wizard to create agents)', '');
  }

  const memoryDir = path.join(cwd, 'forge-memory');
  if (exists(memoryDir)) {
    recordCheck('forge-memory/', 'pass', 'forge-memory/ found', '');

    // Nudge if memory files still contain placeholder text after 7+ days
    const patternsPath = path.join(memoryDir, 'patterns.md');
    if (exists(patternsPath)) {
      try {
        const patternsContent = fs.readFileSync(patternsPath, 'utf8');
        const stat = fs.statSync(patternsPath);
        const ageMs = Date.now() - stat.mtimeMs;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays > 7 && patternsContent.includes('(Describe your naming conventions here)')) {
          recordCheck('forge-memory usage', 'warn',
            'forge-memory/patterns.md still has placeholder text -- fill it in so your AI remembers your conventions',
            'Tip: describe your naming conventions, file structure, and code style');
        }
      } catch { /* ignore read errors */ }
    }
  } else {
    recordCheck('forge-memory/', 'warn', 'No forge-memory/ found (run the wizard to create memory)', '');
  }

  const cookbookDir = path.join(cwd, 'cookbook');
  if (exists(cookbookDir)) {
    recordCheck('cookbook/', 'pass', 'cookbook/ found', '');
  } else {
    recordCheck('cookbook/', 'warn', 'No cookbook/ found (run the wizard to create recipes)', '');
  }

  const planMd = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (!jsonMode) {
    if (exists(planMd)) {
      success('IMPLEMENTATION_PLAN.md exists');
    } else {
      info('Optional: IMPLEMENTATION_PLAN.md (for Ralph Loop planning mode)');
    }
  }

  if (hasGit()) {
    recordCheck('git repository', 'pass', 'Git repository detected', '');
  } else {
    recordCheck('git repository', 'warn', 'Not a git repository', '');
  }

  const testFile = path.join(cwd, '.copilotforge-test-write');
  try {
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    recordCheck('write permissions', 'pass', 'Write permissions OK', '');
  } catch {
    recordCheck('write permissions', 'warn', 'Cannot write to project directory -- check folder permissions', '');
  }

  if (!jsonMode) {
    info(`CopilotForge CLI v${pkg.version}`);
  }

  const forgeMdPath = path.join(cwd, 'FORGE.md');
  if (exists(forgeMdPath)) {
    try {
      forgeContent = fs.readFileSync(forgeMdPath, 'utf8');
      const stampMatch = forgeContent.match(/<!-- copilotforge: v([\d.]+) -->/);
      if (stampMatch) {
        const installedVersion = stampMatch[1];
        const currentVersion = pkg.version;
        if (installedVersion === currentVersion) {
          recordCheck('FORGE.md version', 'pass', `FORGE.md version: v${installedVersion} (current)`, '');
        } else {
          recordCheck('FORGE.md version', 'warn', `FORGE.md version: v${installedVersion} (latest: v${currentVersion})`, 'Run: npx copilotforge upgrade');
          if (!jsonMode) info(`  Run npx copilotforge upgrade to update`);
        }
      } else if (!jsonMode) {
        info('  FORGE.md has no version stamp (created before v1.6.0)');
      }
    } catch {
      // ignore
    }
  }

  const pathStamp = readPathStamp(forgeContent);
  if (pathStamp && pathStamp !== 'J') {
    const { pathIssues, pathChecks } = runPathChecks(pathStamp);
    void pathIssues; void pathChecks;
  }

  if (jsonMode) {
    const total = checkResults.length;
    const passed = checkResults.filter(c => c.status === 'pass').length;
    const warned = checkResults.filter(c => c.status === 'warn').length;
    const failed = checkResults.filter(c => c.status === 'fail').length;
    const healthy = failed === 0;

    const output = {
      version: pkg.version,
      timestamp: new Date().toISOString(),
      checks: checkResults,
      summary: { total, passed, warned, failed },
      healthy,
    };
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    process.exit(healthy ? 0 : 1);
    return;
  }

  separator();

  const failCount = checkResults.filter(c => c.status === 'fail').length;
  const warnCount = checkResults.filter(c => c.status === 'warn').length;
  const issues = failCount + warnCount;
  const checks = checkResults.filter(c => c.status === 'pass').length;

  if (issues === 0) {
    console.log(`  All checks passed (${checks} checks)`);
    console.log();
    info(`Ready! Say "set up my project" in Copilot Chat`);
  } else {
    console.log(`  ${issues} issue(s) found (${checks} checks passed)`);
    console.log();
    info(`Fix the issues above, then run npx copilotforge doctor again.`);
  }

  console.log();
}

module.exports = { run, readPathStamp, PATH_NAMES };
