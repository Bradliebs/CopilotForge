'use strict';

const path = require('path');
const {
  banner,
  success,
  warn,
  info,
  separator,
  ask,
  copyFile,
  writeFile,
  exists,
  hasGit,
  gitCommit,
  colors,
} = require('./utils');

const templates = require('./templates');

// Core files installed by `init` (relative to CWD)
const CORE_FILES = [
  path.join('.github', 'skills', 'planner', 'SKILL.md'),
  path.join('.github', 'skills', 'planner', 'reference.md'),
  path.join('.github', 'skills', 'plan-executor', 'SKILL.md'),
  path.join('.github', 'skills', 'plan-executor', 'reference.md'),
];

// Extra files installed by default (skipped with --minimal)
const FULL_FILES = [
  { dest: 'FORGE.md', content: templates.FORGE_MD },
  {
    dest: path.join('.copilot', 'agents', 'planner.md'),
    content: templates.PLANNER_AGENT_MD,
  },
  {
    dest: path.join('forge-memory', 'decisions.md'),
    content: templates.DECISIONS_MD,
  },
  {
    dest: path.join('forge-memory', 'patterns.md'),
    content: templates.PATTERNS_MD,
  },
  {
    dest: path.join('forge-memory', 'preferences.md'),
    content: templates.PREFERENCES_MD,
  },
  {
    dest: path.join('cookbook', 'hello-world.ts'),
    content: templates.HELLO_WORLD_TS,
  },
  {
    dest: path.join('cookbook', 'hello-world.py'),
    content: templates.HELLO_WORLD_PY,
  },
  {
    dest: path.join('cookbook', 'task-loop.ts'),
    content: templates.TASK_LOOP_TS,
  },
  {
    dest: path.join('cookbook', 'task-loop.py'),
    content: templates.TASK_LOOP_PY,
  },
  {
    dest: 'IMPLEMENTATION_PLAN.md',
    content: templates.IMPLEMENTATION_PLAN_MD,
  },
  {
    dest: path.join('cookbook', 'copilot-studio-guide.md'),
    content: templates.COPILOT_STUDIO_GUIDE_MD,
  },
  {
    dest: path.join('cookbook', 'copilot-studio-agent.yaml'),
    content: templates.COPILOT_STUDIO_AGENT_YAML,
  },
  {
    dest: path.join('cookbook', 'code-apps-guide.md'),
    content: templates.CODE_APPS_GUIDE_MD,
  },
  {
    dest: path.join('cookbook', 'code-apps-setup.ts'),
    content: templates.CODE_APPS_SETUP_TS,
  },
  {
    dest: path.join('cookbook', 'copilot-agents-guide.md'),
    content: templates.COPILOT_AGENTS_GUIDE_MD,
  },
  {
    dest: path.join('cookbook', 'copilot-agents-example.agent.md'),
    content: templates.COPILOT_AGENTS_EXAMPLE_MD,
  },
];

async function run(args) {
  const minimal = args.includes('--minimal');
  const cwd = process.cwd();

  banner();
  console.log('  Setting up your project...');
  console.log();

  // Check for existing planner directory
  const plannerDir = path.join(cwd, '.github', 'skills', 'planner');
  if (exists(plannerDir)) {
    warn('CopilotForge planner already exists in this project.');
    const overwrite = await ask('Overwrite existing files?', false);
    if (!overwrite) {
      console.log();
      info('Aborted. No files were changed.');
      console.log();
      return;
    }
    console.log();
  }

  // Copy core skill files from the package's files/ directory
  const createdFiles = [];

  for (const rel of CORE_FILES) {
    const dest = path.join(cwd, rel);
    // Source path inside the package: .github/skills/planner/SKILL.md
    copyFile(rel, dest);
    success(`Created ${rel}`);
    createdFiles.push(rel);
  }

  // Default: write all template files (skip with --minimal)
  if (!minimal) {
    console.log();
    for (const entry of FULL_FILES) {
      const dest = path.join(cwd, entry.dest);
      if (exists(dest)) {
        warn(`Skipped ${entry.dest} (already exists)`);
      } else {
        writeFile(dest, entry.content);
        success(`Created ${entry.dest}`);
        createdFiles.push(entry.dest);
      }
    }

    // Create getting-started guide
    const gsDest = path.join(cwd, 'docs', 'GETTING-STARTED.md');
    if (exists(gsDest)) {
      warn('Skipped docs/GETTING-STARTED.md (already exists)');
    } else {
      writeFile(gsDest, templates.GETTING_STARTED_MD);
      success('Created docs/GETTING-STARTED.md');
      createdFiles.push(path.join('docs', 'GETTING-STARTED.md'));
    }
  }

  separator();

  // Offer to commit if git is available
  if (hasGit() && createdFiles.length > 0) {
    const commit = await ask('Want to commit these files?', false);
    if (commit) {
      try {
        gitCommit(createdFiles, 'chore: add CopilotForge planner skill');
        console.log();
        success('Committed to git.');
      } catch (err) {
        console.log();
        warn(`Git commit failed: ${err.message}`);
      }
    }
    console.log();
  }

  console.log(`  ${colors.bold(colors.green('\uD83C\uDF89 Done!'))} Your project is CopilotForge-ready.`);
  separator();

  info('What to do next:');
  info(`${colors.bold('1.')} Open your AI assistant (GitHub Copilot Chat, Claude Code, etc.)`);
  info(`${colors.bold('2.')} Say: ${colors.cyan('"set up my project"')}`);
  info(`${colors.bold('3.')} Answer a few questions about what you're building`);
  info(`${colors.bold('4.')} Your AI assistant creates skills, agents, and recipes — customized for your stack!`);
  console.log();
  info(`${colors.dim('\uD83D\uDCD6 Quick guide: docs/GETTING-STARTED.md')}`);
  info(`${colors.dim('\uD83D\uDCCB Control panel: FORGE.md')}`);
  separator();
}

module.exports = { run };
