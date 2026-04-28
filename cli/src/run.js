'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { colors } = require('./utils');

const PLAN_FILE = 'IMPLEMENTATION_PLAN.md';
const SKILLS_DIR = path.join('.github', 'skills');

function isInitialized(projectPath) {
  const planExists = fs.existsSync(path.join(projectPath, PLAN_FILE));
  const skillsExist = fs.existsSync(path.join(projectPath, SKILLS_DIR));
  return planExists && skillsExist;
}

// Parse pending tasks from IMPLEMENTATION_PLAN.md
function getPendingTasks(projectPath) {
  const planPath = path.join(projectPath, PLAN_FILE);
  if (!fs.existsSync(planPath)) return [];
  const content = fs.readFileSync(planPath, 'utf-8');
  const pending = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^- \[ \] (\S+)\s*(?:—|-)\s*(.+)$/);
    if (m) pending.push({ id: m[1], title: m[2].trim() });
  }
  return pending;
}

function getDoneFailed(projectPath) {
  const planPath = path.join(projectPath, PLAN_FILE);
  if (!fs.existsSync(planPath)) return { done: 0, failed: 0, total: 0 };
  const content = fs.readFileSync(planPath, 'utf-8');
  let done = 0, failed = 0, total = 0;
  for (const line of content.split('\n')) {
    if (line.match(/^- \[[x!? ]\]/)) total++;
    if (line.match(/^- \[x\]/)) done++;
    if (line.match(/^- \[!\]/)) failed++;
  }
  return { done, failed, total };
}

function resolveTaskLoopScript(projectPath) {
  // Look for task-loop.ts in the project's cookbook/ directory first,
  // then fall back to the global copilotforge install
  const local = path.join(projectPath, 'cookbook', 'task-loop.ts');
  if (fs.existsSync(local)) return local;
  // Fall back: walk up node_modules to find the copilotforge version
  const pkgLocal = path.join(projectPath, 'node_modules', 'copilotforge', 'cookbook', 'task-loop.ts');
  if (fs.existsSync(pkgLocal)) return pkgLocal;
  return null;
}

function runTaskLoop(projectPath, taskLoopScript, args) {
  const taskArgs = ['tsx', taskLoopScript, ...args];
  console.log();
  console.log(`  ${colors.bold(colors.cyan('▶ Starting plan executor'))}`);
  console.log(`  ${colors.dim('Script: ' + path.relative(projectPath, taskLoopScript))}`);
  console.log();

  // Spawn inline (inherits stdio so user sees live output and can Ctrl+C)
  const child = spawn('npx', taskArgs, {
    cwd: projectPath,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log();
      console.log(`  ${colors.bold(colors.green('✅ Plan executor finished — all tasks complete.'))}`);

      // Run post-execution evaluation
      try {
        const { evaluate } = require('./evaluator');
        evaluate(
          { id: 'plan-run', title: 'Plan execution complete' },
          { cwd: projectPath }
        ).then((result) => {
          if (result.verdict === 'confirmed') {
            console.log(`  ${colors.green('✅')} Evaluator: ${result.verdict}`);
          } else {
            console.log(`  ${colors.yellow('⚠')} Evaluator: ${result.verdict}`);
          }
        }).catch(() => {});
      } catch { /* evaluator is optional */ }
    } else {
      console.log();
      console.log(`  ${colors.bold(colors.red('❌ Plan executor exited with code ' + code))}`);
      console.log(`  ${colors.dim('Check the output above for details.')}`);

      // Fire TaskFailed hook
      try {
        const { fireHooks } = require('./hooks');
        fireHooks('TaskFailed', { exitCode: code, cwd: projectPath }).catch(() => {});
      } catch { /* hooks are optional */ }
    }
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error(`\n  ${colors.red('Error:')} ${err.message}\n`);
    process.exit(1);
  });
}

function run(args) {
  const projectPath = process.cwd();
  const flags = {
    yes: args.includes('--yes') || args.includes('-y'),
    dryRun: args.includes('--dry-run'),
    taskId: null,
  };

  // Support --task <id> for running a specific task
  const taskIdx = args.indexOf('--task');
  if (taskIdx !== -1 && args[taskIdx + 1]) {
    flags.taskId = args[taskIdx + 1];
  }

  console.log();
  console.log(`  ${colors.bold(colors.red('🔥 CopilotForge'))} ${colors.dim('— run')}`);
  console.log();

  // Step 1 — check initialization
  if (!isInitialized(projectPath)) {
    const missingPlan = !fs.existsSync(path.join(projectPath, PLAN_FILE));
    const missingSkills = !fs.existsSync(path.join(projectPath, SKILLS_DIR));

    console.log(`  ${colors.yellow('⚠')} Project is not fully set up:`);
    if (missingPlan) console.log(`      Missing: ${PLAN_FILE}`);
    if (missingSkills) console.log(`      Missing: ${SKILLS_DIR}/`);
    console.log();
    console.log(`  Run this first:`);
    console.log(`    ${colors.cyan('npx copilotforge init --full')}`);
    console.log();
    console.log(`  Then describe your project in VS Code Copilot Chat to generate a plan,`);
    console.log(`  and run ${colors.cyan('npx copilotforge run')} again.`);
    console.log();
    process.exit(1);
  }

  // Step 2 — check for pending tasks
  const pending = getPendingTasks(projectPath);
  const { done, failed, total } = getDoneFailed(projectPath);

  if (total === 0) {
    console.log(`  ${colors.yellow('⚠')} ${PLAN_FILE} exists but contains no tasks.`);
    console.log();
    console.log(`  Open VS Code Copilot Chat and say:`);
    console.log(`    ${colors.dim('"set up my project"')}`);
    console.log(`  to generate a plan, then run ${colors.cyan('npx copilotforge run')} again.`);
    console.log();
    process.exit(0);
  }

  if (pending.length === 0) {
    console.log(`  ${colors.green('✅')} All tasks complete! (${done}/${total} done${failed > 0 ? `, ${failed} failed` : ''})`);
    console.log();
    console.log(`  To retry failed tasks, change ${colors.dim('[!]')} back to ${colors.dim('[ ]')} in ${PLAN_FILE}`);
    console.log(`  and run ${colors.cyan('npx copilotforge run')} again.`);
    console.log();
    process.exit(0);
  }

  // Step 3 — show status and confirm or dry-run
  console.log(`  ${colors.bold('Plan status:')} ${done} done, ${pending.length} pending${failed > 0 ? `, ${failed} failed` : ''} (${total} total)`);
  console.log();
  console.log(`  ${colors.bold('Pending tasks:')}`);
  for (const t of pending.slice(0, 5)) {
    console.log(`    ${colors.dim('[ ]')} ${colors.cyan(t.id)} — ${t.title}`);
  }
  if (pending.length > 5) {
    console.log(`    ${colors.dim('... and ' + (pending.length - 5) + ' more')}`);
  }
  console.log();

  if (flags.dryRun) {
    console.log(`  ${colors.dim('[dry-run] Would start plan executor now.')}`);
    console.log();
    process.exit(0);
  }

  // Step 4 — find the task-loop script
  const taskLoopScript = resolveTaskLoopScript(projectPath);
  if (!taskLoopScript) {
    console.log(`  ${colors.red('❌')} Ralph loop script not found.`);
    console.log(`  Your project may need re-initialization. Run:`);
    console.log(`    ${colors.cyan('npx copilotforge init --full')}`);
    console.log();
    process.exit(1);
  }

  // Step 5 — launch
  const loopArgs = [];
  if (flags.taskId) loopArgs.push('--single-task', flags.taskId);

  runTaskLoop(projectPath, taskLoopScript, loopArgs);
}

module.exports = { run, isInitialized, getPendingTasks, getDoneFailed, resolveTaskLoopScript };
