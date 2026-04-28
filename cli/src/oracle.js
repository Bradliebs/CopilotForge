'use strict';

const { banner, info, colors, separator } = require('./utils');

function run(args) {
  const question = args.filter((a) => !a.startsWith('--')).join(' ');

  banner();
  console.log(`  ${colors.bold('🔮 Oracle Prime — Precision Reasoning')}`);
  console.log();

  if (question) {
    console.log(`  ${colors.dim('Question:')} ${question}`);
    console.log();
  }

  separator();

  console.log(`  Oracle Prime is an AI reasoning framework, not a standalone CLI tool.`);
  console.log(`  It activates inside your AI assistant (GitHub Copilot, Claude, etc.).`);
  console.log();
  console.log(`  ${colors.bold('How to use Oracle Prime:')}`);
  console.log();
  console.log(`  ${colors.cyan('1.')} Open Copilot Chat (Ctrl+Alt+I)`);
  console.log(`  ${colors.cyan('2.')} Say one of these trigger phrases:`);
  console.log(`     ${colors.dim('•')} "deep analysis"       — full 7-stage reasoning pipeline`);
  console.log(`     ${colors.dim('•')} "oracle prime"         — invoke by name`);
  console.log(`     ${colors.dim('•')} "scenario analysis"    — map probability-weighted scenarios`);
  console.log(`     ${colors.dim('•')} "stress test this"     — counterfactual stress testing`);
  console.log(`     ${colors.dim('•')} "what are the risks"   — risk assessment mode`);
  console.log(`     ${colors.dim('•')} "red team this"        — strongest case against your plan`);
  console.log();
  console.log(`  ${colors.bold('Install Oracle Prime:')}`);
  console.log(`     npx copilotforge init --oracle-prime`);
  console.log();
  console.log(`  ${colors.bold('Files created:')}`);
  console.log(`     ${colors.dim('•')} .github/instructions/oracle-prime.instructions.md  (always-on)`);
  console.log(`     ${colors.dim('•')} .github/skills/oracle-prime/SKILL.md               (deep analysis)`);
  console.log(`     ${colors.dim('•')} .copilot/agents/oracle-prime.md                    (agent template)`);

  separator();

  info(`Learn more: ${colors.cyan('examples/oracle-prime-session/README.md')}`);
  console.log();
}

module.exports = { run };
