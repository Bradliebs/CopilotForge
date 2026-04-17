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

  case 'watch': {
    const watch = require('../src/watch');
    try {
      watch.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'run': {
    const runCmd = require('../src/run');
    try {
      runCmd.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
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
  ${colors.bold(colors.red('\uD83D\uDD25 CopilotForge'))} ${colors.dim('\u2014 AI skills for your project in one command')}

  ${colors.bold('Usage:')}
    npx copilotforge init             Set up CopilotForge in your project
    npx copilotforge --version        Show version

  ${colors.bold('Quick start:')}
    cd your-project
    npx copilotforge init
    ${colors.dim('# Then open your AI chat and say: "set up my project"')}

  ${colors.bold('Options for init:')}
    --full        Full setup — memory system, agents, 20+ recipes, dashboard
    --dry-run     Preview what would be created (no files written)
    --yes, -y     Skip all prompts (for CI / scripting)
    --minimal     Planner skill only (2 files, no extras)

  ${colors.dim('Advanced commands: status, doctor, upgrade, uninstall, dashboard, watch, run')}
  ${colors.dim('Learn more: https://github.com/Bradliebs/CopilotForge')}
`);
}
