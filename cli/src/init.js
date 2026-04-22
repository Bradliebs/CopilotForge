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

// Files installed by default (simple mode): just the planner skill + a starter recipe + guide
const SIMPLE_CORE_FILES = [
  path.join('.github', 'skills', 'planner', 'SKILL.md'),
  path.join('.github', 'skills', 'planner', 'reference.md'),
];

// Additional files installed with --full (current "full" behavior)
const FULL_CORE_FILES = [
  path.join('.github', 'skills', 'planner', 'SKILL.md'),
  path.join('.github', 'skills', 'planner', 'reference.md'),
  path.join('.github', 'skills', 'plan-executor', 'SKILL.md'),
  path.join('.github', 'skills', 'plan-executor', 'reference.md'),
];

const FULL_EXTRA_FILES = [
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
    dest: path.join('cookbook', 'task-loop.ts'),
    content: templates.TASK_LOOP_TS,
  },
  {
    dest: path.join('cookbook', 'ralph-loop.ts'),
    content: templates.RALPH_LOOP_TS,
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
  {
    dest: path.join('.devcontainer', 'devcontainer.json'),
    content: templates.DEVCONTAINER_JSON,
  },
];

async function run(args) {
  const full = args.includes('--full');
  const minimal = args.includes('--minimal');
  const yes = args.includes('--yes') || args.includes('-y');
  const dryRun = args.includes('--dry-run') || args.includes('--dryRun');
  const beginner = args.includes('--beginner');
  const cwd = process.cwd();

  // Resolve which core files to install
  const coreFiles = full ? FULL_CORE_FILES : SIMPLE_CORE_FILES;

  if (dryRun) {
    console.log('[DRY RUN] Mode:', full ? 'full' : 'simple');
    for (const rel of coreFiles) {
      console.log(`[DRY RUN] Would create: ${rel}`);
    }
    if (!full && !minimal) {
      console.log('[DRY RUN] Would create: START-HERE.md');
      console.log(`[DRY RUN] Would create: ${path.join('.github', 'copilot-instructions.md')}`);
    }
    if (full && !minimal) {
      for (const entry of FULL_EXTRA_FILES) {
        console.log(`[DRY RUN] Would create: ${entry.dest}`);
      }
      console.log(`[DRY RUN] Would create: ${path.join('docs', 'GETTING-STARTED.md')}`);
      if (beginner) {
        console.log(`[DRY RUN] Would create: ${path.join('.github', 'skills', 'planner', 'BEGINNER_NOTES.md')}`);
        console.log(`[DRY RUN] Would create: ${path.join('.github', 'skills', 'plan-executor', 'BEGINNER_NOTES.md')}`);
        console.log('[DRY RUN] Would create: WHAT_THIS_MEANS.md');
      }
    }
    console.log('[DRY RUN] No files were written.');
    return;
  }

  banner();
  if (full) {
    console.log('  Setting up CopilotForge (full mode)...');
  } else {
    console.log('  Setting up CopilotForge...');
  }
  console.log();

  // Check for existing planner directory
  const plannerDir = path.join(cwd, '.github', 'skills', 'planner');
  if (exists(plannerDir)) {
    if (yes) {
      info('Overwriting existing files (--yes)');
      console.log();
    } else {
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
  }

  const createdFiles = [];

  // Copy core skill files
  for (const rel of coreFiles) {
    const dest = path.join(cwd, rel);
    copyFile(rel, dest);
    success(`Created ${rel}`);
    createdFiles.push(rel);
  }

  if (full && !minimal) {
    // Full mode: write all extra files
    console.log();
    for (const entry of FULL_EXTRA_FILES) {
      const dest = path.join(cwd, entry.dest);
      if (exists(dest)) {
        warn(`Skipped ${entry.dest} (already exists)`);
      } else {
        writeFile(dest, entry.content);
        success(`Created ${entry.dest}`);
        createdFiles.push(entry.dest);
      }
    }

    const gsDest = path.join(cwd, 'docs', 'GETTING-STARTED.md');
    if (exists(gsDest)) {
      warn('Skipped docs/GETTING-STARTED.md (already exists)');
    } else {
      writeFile(gsDest, templates.GETTING_STARTED_MD);
      success('Created docs/GETTING-STARTED.md');
      createdFiles.push(path.join('docs', 'GETTING-STARTED.md'));
    }

    if (beginner) {
      console.log();
      const beginnerFiles = [
        {
          dest: path.join('.github', 'skills', 'planner', 'BEGINNER_NOTES.md'),
          content: BEGINNER_NOTES_PLANNER,
        },
        {
          dest: path.join('.github', 'skills', 'plan-executor', 'BEGINNER_NOTES.md'),
          content: BEGINNER_NOTES_PLAN_EXECUTOR,
        },
        { dest: 'WHAT_THIS_MEANS.md', content: WHAT_THIS_MEANS_MD },
      ];
      for (const entry of beginnerFiles) {
        const dest = path.join(cwd, entry.dest);
        writeFile(dest, entry.content);
        success(`Created ${entry.dest}`);
        createdFiles.push(entry.dest);
      }
    }
  } else if (!minimal) {
    // Simple mode (default): START-HERE.md + copilot-instructions.md
    console.log();
    const startHereDest = path.join(cwd, 'START-HERE.md');
    if (exists(startHereDest)) {
      warn('Skipped START-HERE.md (already exists)');
    } else {
      writeFile(startHereDest, templates.START_HERE_MD);
      success('Created START-HERE.md');
      createdFiles.push('START-HERE.md');
    }

    const instructionsDest = path.join(cwd, '.github', 'copilot-instructions.md');
    if (exists(instructionsDest)) {
      warn('Skipped .github/copilot-instructions.md (already exists)');
    } else {
      writeFile(instructionsDest, templates.COPILOT_INSTRUCTIONS_MD);
      success('Created .github/copilot-instructions.md');
      createdFiles.push(path.join('.github', 'copilot-instructions.md'));
    }
  }

  separator();

  // Offer to commit if git is available
  if (hasGit() && createdFiles.length > 0) {
    const commit = yes || await ask('Want to commit these files?', true);
    if (commit) {
      try {
        gitCommit(createdFiles, 'chore: add CopilotForge planner skill');
        console.log();
        success('Committed to git.');
      } catch (err) {
        console.log();
        warn(`Git commit failed: ${err.message}`);
        if (err.stderr) {
          info(colors.dim(`  git said: ${err.stderr.toString().trim()}`));
        }
        info(colors.dim('  Tip: Make sure git user.name and user.email are configured.'));
        info(colors.dim('  Files were created successfully — you can commit them manually.'));
      }
    }
    console.log();
  }

  console.log(`  ${colors.bold(colors.green('\uD83C\uDF89 Done!'))} Your project is CopilotForge-ready.`);
  separator();

  // Local usage tracking (never transmitted — stays in ~/.copilotforge/usage.json)
  try {
    const fs = require('fs');
    const os = require('os');
    const usageDir = path.join(os.homedir(), '.copilotforge');
    const usageFile = path.join(usageDir, 'usage.json');
    if (!exists(usageDir)) {
      fs.mkdirSync(usageDir, { recursive: true });
    }
    let usage = [];
    if (exists(usageFile)) {
      try { usage = JSON.parse(fs.readFileSync(usageFile, 'utf8')); } catch { usage = []; }
    }
    usage.push({ path: 'J', mode: full ? 'full' : minimal ? 'minimal' : 'simple', timestamp: new Date().toISOString() });
    fs.writeFileSync(usageFile, JSON.stringify(usage, null, 2), 'utf8');
  } catch { /* non-fatal */ }

  if (full) {
    // Full mode: show the full next-steps guide
    info('What to do next:');
    console.log();
    info(`${colors.bold('1.')} Open ${colors.cyan('GitHub Copilot Chat')} in VS Code`);
    info(`   ${colors.dim('Also works with Claude Code, Cursor, or any AI that reads your .github/ folder.')}`);
    console.log();
    info(`${colors.bold('2.')} Type: ${colors.cyan('"set up my project"')}`);
    info(`   ${colors.dim('The wizard asks ~6 questions then scaffolds skills, agents, and recipes.')}`);
    console.log();
    info(`${colors.bold(colors.dim('Key files created:'))}`);
    info(`   ${colors.dim('📋 IMPLEMENTATION_PLAN.md  — your living task list')}`);
    info(`   ${colors.dim('🎛️  FORGE.md               — your project control panel')}`);
    info(`   ${colors.dim('🧠 forge-memory/           — AI memory: decisions, patterns, preferences')}`);
    info(`   ${colors.dim('📚 cookbook/               — ready-to-run code recipes')}`);
    console.log();
    info(`${colors.dim('📖 Full guide:     docs/GETTING-STARTED.md')}`);
    info(`${colors.dim('🔍 Verify setup:   npx copilotforge doctor')}`);

    const dashboard = require('./dashboard');
    const dashboardOpened = dashboard.tryOpen(cwd);
    if (dashboardOpened) {
      console.log();
      info(`${colors.green('📊 Opening CopilotForge Command Center...')}`);
      info(colors.dim(`  Reopen anytime: ${colors.cyan('npx copilotforge dashboard')}`));
    }
  } else {
    // Simple mode: just two clear steps
    info('Two steps to get started:');
    console.log();
    info(`${colors.bold('1.')} Open your AI chat`);
    info(`   ${colors.dim('GitHub Copilot Chat, Claude Code, Cursor — any AI that reads your project files.')}`);
    console.log();
    info(`${colors.bold('2.')} Type: ${colors.cyan('"set up my project"')}`);
    info(`   ${colors.dim('Your AI asks 3 questions and creates skills tailored to your project.')}`);
    console.log();
    info(`   ${colors.dim('Open START-HERE.md for a plain-English guide to what was created.')}`);
  }

  separator();
}

// ------------------------------------------------------------------
// Beginner note templates (used only with --full --beginner)
// ------------------------------------------------------------------

const BEGINNER_NOTES_PLANNER = `# What is this folder?

This is the **Planner skill** — it's like giving your AI assistant a job description.

When you open GitHub Copilot Chat and say **"set up my project"**, the AI reads this
file to know exactly how to help you plan and scaffold your codebase.

## How to use it
1. Open GitHub Copilot Chat in VS Code
2. Type: \`set up my project\`
3. Answer the AI's questions — it will create a plan just for you!

## Can I edit this file?
Yes! These are just text files. You can't break anything.
If you make a mistake, you can always run \`npx copilotforge init\` again.

## Where to get help
- GitHub Discussions: https://github.com/Bradliebs/CopilotForge/discussions
- Issues: https://github.com/Bradliebs/CopilotForge/issues
`;

const BEGINNER_NOTES_PLAN_EXECUTOR = `# What is this folder?

This is the **Plan Executor skill** — it helps your AI assistant *execute* a plan
step by step, tracking progress as it goes.

## How to use it
1. Run \`npx copilotforge init\` to create your IMPLEMENTATION_PLAN.md
2. Open GitHub Copilot Chat
3. Type: \`execute the next task\`
4. Watch your AI build features one by one!

## Can I edit this file?
Absolutely — these are just text files. Experiment freely!

## Where to get help
- GitHub Discussions: https://github.com/Bradliebs/CopilotForge/discussions
- Issues: https://github.com/Bradliebs/CopilotForge/issues
`;

const WHAT_THIS_MEANS_MD = `# What CopilotForge just created for you

Welcome! Here's a plain-English guide to everything that was just set up.

---

## Files and folders explained

| File / Folder | What it does |
|---|---|
| \`.github/skills/planner/SKILL.md\` | Teaches your AI how to plan your project |
| \`.github/skills/plan-executor/SKILL.md\` | Teaches your AI how to build features step by step |
| \`FORGE.md\` | Your project control panel — edit this to customise everything |
| \`IMPLEMENTATION_PLAN.md\` | A living to-do list your AI fills in and ticks off |
| \`forge-memory/\` | Notes your AI remembers between sessions |
| \`cookbook/\` | Ready-to-use code examples |

---

## 3 simple steps to get started

**Step 1:** Open GitHub Copilot Chat in VS Code (the speech-bubble icon on the left)

**Step 2:** Type this message:
> set up my project

**Step 3:** Answer the AI's questions. It will create a personalised plan just for you!

---

## You can't break anything

All of these files are just text. If something goes wrong:
- Delete the file and run \`npx copilotforge init\` again
- Or just edit the text yourself

---

## Where to ask for help

- Community: https://github.com/Bradliebs/CopilotForge/discussions
- Bug reports: https://github.com/Bradliebs/CopilotForge/issues
- Full docs: https://github.com/Bradliebs/CopilotForge#readme
`;

module.exports = { run };
