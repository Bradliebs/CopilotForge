#!/usr/bin/env node

'use strict';

const pkg = require('../package.json');
const { colors } = require('../src/utils');

const args = process.argv.slice(2);
const command = args[0] || '';

// --version flag
if (args.includes('--version') || args.includes('-v')) {
  console.log(`copilotforge v${pkg.version}`);
  process.exit(0);
}

// Route commands
switch (command) {
  case 'init': {
    const init = require('../src/init');
    init.run(args.slice(1)).catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case 'doctor': {
    const doctor = require('../src/doctor');
    try {
      doctor.run();
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'upgrade': {
    const upgrade = require('../src/upgrade');
    upgrade.run(args.slice(1)).catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case 'status': {
    const status = require('../src/status');
    try {
      status.run();
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'uninstall': {
    const uninstall = require('../src/uninstall');
    try {
      uninstall.run();
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'dashboard': {
    const dashboard = require('../src/dashboard');
    dashboard.run().catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case 'interactive':
  case '': {
    const interactive = require('../src/interactive');
    interactive.run().catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case '--help':
  case '-h':
    printHelp();
    break;

  default:
    console.log();
    console.log(`  ${colors.red('Unknown command:')} ${command}`);
    console.log();
    printHelp();
    process.exit(1);
}

function printHelp() {
  console.log(`
  ${colors.bold(colors.red('\uD83D\uDD25 CopilotForge'))} ${colors.dim('\u2014 AI team scaffolding in one command')}

  ${colors.bold('Usage:')}
    npx copilotforge                  Interactive command center (default)
    npx copilotforge init             Set up CopilotForge in your project
    npx copilotforge init --minimal   Planner skill only (2 files)
    npx copilotforge init --yes       Skip all prompts (auto-overwrite, auto-commit)
    npx copilotforge init --dry-run   Preview what would be created (no files written)
    npx copilotforge init --beginner  Also create beginner-friendly guide files
    npx copilotforge status           Show project dashboard
    npx copilotforge doctor           Check if setup is correct
    npx copilotforge doctor --json    Output health check results as JSON
    npx copilotforge upgrade          Update framework files to latest
    npx copilotforge upgrade --force  Update without confirmation prompts
    npx copilotforge upgrade --dry-run  Preview what would change
    npx copilotforge uninstall        Remove CopilotForge files
    npx copilotforge uninstall --dry-run  Preview what would be deleted
    npx copilotforge dashboard        Open the live dashboard app
    npx copilotforge --version        Show version

  ${colors.bold('Flags:')}
    --yes, -y     Skip all confirmation prompts (for init and upgrade)
    --dry-run     Preview changes without writing or deleting files
    --beginner    Create extra beginner-friendly guide files (for init)
    --json        Output results as JSON (for doctor)

  ${colors.bold('Quick start:')}
    cd your-project
    npx copilotforge init
    ${colors.dim('# Then open Copilot Chat and say: "set up my project"')}

  ${colors.dim('Learn more: https://github.com/Bradliebs/CopilotForge')}
`);
}
