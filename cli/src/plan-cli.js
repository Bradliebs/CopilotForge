'use strict';

const path = require('path');
const { banner, colors, separator, info, success, warn } = require('./utils');
const { generatePlan, writePlan, extractFeatures, detectStack } = require('./plan-generator');

function run(args = []) {
  const cwd = process.cwd();
  const dryRun = args.includes('--dry-run');
  const description = args.filter((a) => !a.startsWith('--')).join(' ');

  banner();
  console.log(`  ${colors.bold('📋 Plan Generator')}`);
  console.log();

  if (!description) {
    info(`${colors.bold('Usage:')}`);
    console.log(`  npx copilotforge plan "project description" [--stack "tech stack"]`);
    console.log(`  npx copilotforge plan "A REST API with auth" --stack "TypeScript, Express"`);
    console.log(`  npx copilotforge plan "Chat app with WebSocket" --dry-run`);
    console.log();
    info(colors.dim('Generates IMPLEMENTATION_PLAN.md from a project description.'));
    info(colors.dim('The Ralph Loop can then execute the plan autonomously.'));
    console.log();
    return;
  }

  // Parse --stack flag
  let stack = '';
  const stackIdx = args.indexOf('--stack');
  if (stackIdx !== -1 && args[stackIdx + 1]) {
    stack = args[stackIdx + 1];
  }

  // Show what we detected
  const features = extractFeatures(description);
  const stackKeys = detectStack(stack);

  info(`${colors.bold('Project:')} ${description}`);
  if (stack) info(`${colors.bold('Stack:')}   ${stack}`);
  console.log();

  info(`${colors.bold('Detected features:')}`);
  for (const f of features) {
    console.log(`  ${colors.cyan('•')} ${f.title}`);
  }
  console.log();

  if (stackKeys.length > 0) {
    info(`${colors.bold('Stack components:')} ${stackKeys.join(', ')}`);
    console.log();
  }

  // Generate plan
  const answers = { project: description, stack, cwd };
  const plan = generatePlan(answers);
  const taskCount = (plan.match(/^- \[ \]/gm) || []).length;

  separator();

  if (dryRun) {
    info(`${colors.bold('Preview')} (${taskCount} tasks):`);
    console.log();
    const taskLines = plan.split('\n').filter((l) => l.startsWith('- [ ]'));
    for (const line of taskLines) {
      console.log(`  ${line}`);
    }
    console.log();
    info(colors.dim('[dry-run] No files were written.'));
  } else {
    const { written } = writePlan(answers, cwd);
    if (written) {
      success(`Generated IMPLEMENTATION_PLAN.md with ${taskCount} tasks`);
      console.log();
      info('Next steps:');
      console.log(`  ${colors.cyan('1.')} Review the plan: ${colors.dim('open IMPLEMENTATION_PLAN.md')}`);
      console.log(`  ${colors.cyan('2.')} Start building:  ${colors.dim('say "run the plan" in Copilot Chat')}`);
      console.log(`  ${colors.cyan('3.')} Or run Ralph:    ${colors.dim('npx copilotforge run')}`);
    } else {
      warn('IMPLEMENTATION_PLAN.md already exists. Delete it first or use --dry-run to preview.');
    }
  }

  console.log();
}

module.exports = { run };
