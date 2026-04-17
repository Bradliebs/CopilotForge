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
  // devcontainer for Codespaces (Win 2)
  {
    dest: path.join('.devcontainer', 'devcontainer.json'),
    content: templates.DEVCONTAINER_JSON,
  },
];

// Beginner note templates (Win 6)
const BEGINNER_NOTES_PLANNER = `# 🌱 What is this folder?

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

const BEGINNER_NOTES_PLAN_EXECUTOR = `# 🌱 What is this folder?

This is the **Plan Executor skill** — it helps your AI assistant *execute* a plan
step by step, tracking progress as it goes.

When you have an IMPLEMENTATION_PLAN.md in your project, the AI reads this skill
to know how to pick the next task and implement it autonomously.

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

const WHAT_THIS_MEANS_MD = `# 🎉 What CopilotForge just created for you

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
| \`docs/GETTING-STARTED.md\` | A longer guide to get the most out of CopilotForge |
| \`.devcontainer/devcontainer.json\` | Makes GitHub Codespaces work perfectly out of the box |

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

- 💬 Community: https://github.com/Bradliebs/CopilotForge/discussions
- 🐛 Bug reports: https://github.com/Bradliebs/CopilotForge/issues
- 📖 Full docs: https://github.com/Bradliebs/CopilotForge#readme

**You've got this! 🚀**
`;

async function run(args) {
  const minimal = args.includes('--minimal');
  const yes = args.includes('--yes') || args.includes('-y');
  const dryRun = args.includes('--dry-run') || args.includes('--dryRun');
  const beginner = args.includes('--beginner');
  const cwd = process.cwd();

  // --dry-run: print what would happen and exit without writing
  if (dryRun) {
    for (const rel of CORE_FILES) {
      console.log(`[DRY RUN] Would create: ${rel}`);
    }
    if (!minimal) {
      for (const entry of FULL_FILES) {
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
  console.log('  Setting up your project...');
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

    // --beginner: write extra guidance files (Win 6)
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
  }

  separator();

  // Offer to commit if git is available — default YES so Enter just works
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

  info('What to do next:');
  console.log();
  info(`${colors.bold('1.')} Open ${colors.cyan('GitHub Copilot Chat')} in VS Code`);
  info(`   ${colors.dim('Look for the speech-bubble icon in the left sidebar.')}`);
  info(`   ${colors.dim('Also works with Claude Code, Cursor, or any AI that reads your .github/ folder.')}`);
  console.log();
  info(`${colors.bold('2.')} Type exactly: ${colors.cyan('"set up my project"')}`);
  info(`   ${colors.dim('Your AI reads the new skills and runs a guided setup wizard.')}`);
  info(`   ${colors.dim('It will ask ~6 questions: stack, what you\'re building, features, automation.')}`);
  console.log();
  info(`${colors.bold('3.')} Answer the wizard — takes about 2 minutes.`);
  info(`   ${colors.dim('Your AI writes a personalised IMPLEMENTATION_PLAN.md just for your project.')}`);
  console.log();
  info(`${colors.bold('4.')} Say: ${colors.cyan('"run the plan"')}`);
  info(`   ${colors.dim('Your AI picks up each task one by one — implements, validates, commits, repeats.')}`);
  info(`   ${colors.dim('You can watch it build your project step by step, or let it run autonomously.')}`);
  console.log();
  info(`${colors.bold(colors.dim('Key files created:'))}`);
  info(`   ${colors.dim('📋 IMPLEMENTATION_PLAN.md  — your living task list (the AI fills this in)')}`);
  info(`   ${colors.dim('🎛️  FORGE.md               — your project control panel (edit this to customise)')}`);
  info(`   ${colors.dim('🧠 forge-memory/           — AI memory: decisions, patterns, preferences')}`);
  info(`   ${colors.dim('📚 cookbook/               — ready-to-run code recipes and examples')}`);
  console.log();
  info(`${colors.dim('📖 Full guide:     docs/GETTING-STARTED.md')}`);
  info(`${colors.dim('🔍 Verify setup:   npx copilotforge doctor')}`);
  info(`${colors.dim('🩺 Health check:   npx copilotforge status')}`);

  // --beginner banner (Win 6)
  if (beginner) {
    console.log();
    info(`${colors.cyan('💡 Beginner tip: Open WHAT_THIS_MEANS.md to understand everything that was just created!')}`);
  }

  // Auto-open the Command Center dashboard pointed at this project
  const dashboard = require('./dashboard');
  const dashboardOpened = dashboard.tryOpen(cwd);
  if (dashboardOpened) {
    console.log();
    info(`${colors.green('📊 Opening CopilotForge Command Center...')}`);
    info(colors.dim('  The dashboard will show your plan and Ralph status live.'));
    info(colors.dim(`  If it closes, reopen it with: ${colors.cyan('npx copilotforge dashboard')}`));
  } else {
    console.log();
    info(colors.dim(`📊 Want a live dashboard? Install it: ${colors.cyan('npx copilotforge dashboard')}`));
  }

  separator();
}

module.exports = { run };
