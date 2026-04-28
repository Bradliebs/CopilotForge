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

  case 'oracle': {
    const oracle = require('../src/oracle');
    try {
      oracle.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'plan': {
    const planCli = require('../src/plan-cli');
    try {
      planCli.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'trust': {
    const trustCli = require('../src/trust-cli');
    try {
      trustCli.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'compact': {
    const compactCli = require('../src/compact-cli');
    try {
      compactCli.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'playbook': {
    const playbookCli = require('../src/playbook-cli');
    try {
      playbookCli.run(args.slice(1));
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'wizard': {
    const wizard = require('../src/wizard');
    wizard.run().catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case 'mcp': {
    const mcpServer = require('../src/mcp-server');
    try {
      mcpServer.run();
    } catch (err) {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }
    break;
  }

  case 'extension': {
    const extensionServer = require('../src/extension-server');
    extensionServer.run(args.slice(1));
    break;
  }

  case 'team': {
    const team = require('../src/team');
    team.run(args.slice(1));
    break;
  }

  case 'marketplace': {
    const marketplace = require('../src/marketplace');
    marketplace.run(args.slice(1)).catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case 'multi-repo': {
    const multiRepo = require('../src/multi-repo');
    multiRepo.run(args.slice(1));
    break;
  }

  case 'telemetry': {
    const telemetry = require('../src/telemetry');
    telemetry.run(args.slice(1));
    break;
  }

  case 'discover': {
    const discover = require('../src/discover');
    discover.run(args.slice(1));
    break;
  }

  case 'detect': {
    const smartDetect = require('../src/smart-detect');
    const result = smartDetect.detectBuildPath(process.cwd());
    const { colors: c } = require('../src/utils');
    console.log();
    console.log(`  Build path: ${c.cyan(result.path)} — ${result.name}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Reason:     ${result.reason}`);
    console.log();
    break;
  }

  case 'rollback': {
    const rollback = require('../src/rollback');
    rollback.run(args.slice(1)).catch((err) => {
      console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    });
    break;
  }

  case 'examples': {
    const examples = require('../src/examples');
    examples.run(args.slice(1)).catch((err) => {
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
    npx copilotforge init             Set up CopilotForge in your project (full setup)
    npx copilotforge init --full      Full setup with all files (default — same as above)
    npx copilotforge init --minimal   Planner skill only (2 files)
    npx copilotforge init --yes       Skip all prompts (auto-overwrite, auto-commit)
    npx copilotforge init --dry-run   Preview what would be created (no files written)
    npx copilotforge init --beginner  Also create beginner-friendly guide files
    npx copilotforge init --oracle-prime  Install only Oracle Prime reasoning framework
    npx copilotforge status           Show project dashboard
    npx copilotforge doctor           Check if setup is correct
    npx copilotforge doctor --json    Output health check results as JSON
    npx copilotforge upgrade          Update framework files to latest
    npx copilotforge upgrade --force  Update without confirmation prompts
    npx copilotforge upgrade --dry-run  Preview what would change
    npx copilotforge uninstall        Remove CopilotForge files
    npx copilotforge uninstall --dry-run  Preview what would be deleted
    npx copilotforge dashboard        Open the live dashboard app
    npx copilotforge watch            Start autonomous plan executor (persistent)
    npx copilotforge watch --health   Check if watch is running and show status
    npx copilotforge watch --interval 30  Poll every 30 seconds (default: 10)
    npx copilotforge run              Check setup, show pending tasks, start executor
    npx copilotforge run --dry-run    Preview what run would do without executing
    npx copilotforge run --task <id>  Run a single task by ID and exit
    npx copilotforge oracle           Show Oracle Prime usage guide and trigger phrases
    npx copilotforge plan "desc"      Generate implementation plan from a project description
    npx copilotforge plan "desc" --dry-run  Preview plan without writing
    npx copilotforge trust            View trust trajectory (level, score, history)
    npx copilotforge trust --reset    Reset trust state to defaults
    npx copilotforge playbook         View experiential memory playbook entries
    npx copilotforge playbook <query> Search playbook by keyword
    npx copilotforge playbook --top   Show highest-scored entries
    npx copilotforge playbook --consolidate  Prune low-score entries
    npx copilotforge compact <file>       Compact a conversation transcript
    npx copilotforge compact --stats      Show compaction pipeline configuration
    npx copilotforge wizard           Run the conversational setup wizard (Q1-Q6)
    npx copilotforge rollback         Restore files from a previous init/upgrade snapshot
    npx copilotforge rollback --list  Show available snapshots
    npx copilotforge rollback --latest  Restore the most recent snapshot
    npx copilotforge examples         Browse example projects
    npx copilotforge examples <name>  Clone an example project
    npx copilotforge mcp              Start MCP server (stdio transport for AI clients)
    npx copilotforge extension        Start Copilot Extension agent server (HTTP/SSE)
    npx copilotforge extension --port 8080  Use a custom port (default: 3456)
    npx copilotforge team init        Install git hooks for shared team memory
    npx copilotforge team sync        Pull and merge remote memory changes
    npx copilotforge team status      Show team workspace sync status
    npx copilotforge team uninstall   Remove team workspace git hooks
    npx copilotforge marketplace      Browse community skills, agents, and recipes
    npx copilotforge marketplace search <query>  Search marketplace by keyword
    npx copilotforge marketplace install <name>  Install a marketplace item
    npx copilotforge multi-repo status  Show linked repos and trust summary
    npx copilotforge multi-repo link    Link current repo to shared workspace
    npx copilotforge multi-repo sync    Sync playbook across linked repos
    npx copilotforge telemetry          Show local usage analytics dashboard
    npx copilotforge telemetry enable   Start collecting local usage data
    npx copilotforge detect             Auto-detect build path from project files
    npx copilotforge discover            Scan codebase for playbook patterns
    npx copilotforge discover --apply    Add discovered patterns to playbook
    npx copilotforge --version        Show version

  ${colors.bold('Flags:')}
    --yes, -y     Skip all confirmation prompts (for init and upgrade)
    --dry-run     Preview changes without writing or deleting files
    --full        Full setup with all files — skills, cookbook, memory, docs (init default)
    --beginner    Create extra beginner-friendly guide files (for init)
    --oracle-prime  Install only Oracle Prime precision reasoning files (for init)
    --answers       Accept pre-filled wizard answers as JSON string (for init, CI/testing)
    --json        Output results as JSON (for doctor)

  ${colors.bold('Quick start:')}
    cd your-project
    npx copilotforge init
    ${colors.dim('# Then open Copilot Chat and say: "set up my project"')}

  ${colors.dim('Learn more: https://github.com/Bradliebs/CopilotForge')}
`);
}
