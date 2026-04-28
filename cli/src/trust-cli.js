'use strict';

const { banner, colors, separator, info, success, warn } = require('./utils');
const { readTrust, recordSignal, defaultTrustState, scoreToLevel } = require('./trust');

function run(args = []) {
  const cwd = process.cwd();
  const reset = args.includes('--reset');

  banner();
  console.log(`  ${colors.bold('🤝 Trust Trajectory')}`);
  console.log();

  if (reset) {
    const { writeTrust } = require('./trust');
    writeTrust(defaultTrustState(), cwd);
    success('Trust state reset to defaults.');
    console.log();
    return;
  }

  const state = readTrust(cwd);

  if (state.sessionCount === 0) {
    info('No sessions recorded yet. Run the wizard to start building trust.');
    console.log();
    return;
  }

  // Level display with emoji
  const levelEmoji = {
    cautious: '🔒',
    standard: '🔑',
    trusted: '🤝',
    autonomous: '🚀',
  };

  const emoji = levelEmoji[state.level] || '🔒';

  console.log(`  ${emoji} ${colors.bold('Level:')}      ${colors.cyan(state.level)}`);
  console.log(`  📊 ${colors.bold('Score:')}      ${colors.cyan(String(state.trustScore))} / 100`);
  console.log(`  📅 ${colors.bold('Sessions:')}   ${state.sessionCount}`);
  console.log();

  // Signal breakdown
  separator();
  console.log(`  ${colors.bold('Signal Breakdown')}`);
  console.log();

  const s = state.signals;
  const signals = [
    { label: 'Confirmations', value: s.confirmations, effect: '+3 each' },
    { label: 'Tasks completed', value: s.tasksCompleted, effect: '+1 each' },
    { label: 'Extras selected', value: s.extrasSelected, effect: '+1 each' },
    { label: 'Overrides', value: s.overrides, effect: '-2 each' },
    { label: 'Rollbacks', value: s.rollbacks, effect: '-5 each' },
    { label: 'Tasks failed', value: s.tasksFailed, effect: '-3 each' },
    { label: 'File edits', value: s.fileEdits, effect: 'tracked' },
  ];

  for (const sig of signals) {
    const valueStr = sig.value > 0 ? colors.cyan(String(sig.value)) : colors.dim('0');
    console.log(`  ${sig.label.padEnd(20)} ${valueStr}  ${colors.dim(sig.effect)}`);
  }

  console.log();

  // Level thresholds
  separator();
  console.log(`  ${colors.bold('Trust Levels')}`);
  console.log();
  const levels = [
    { name: 'cautious', range: '0–39', desc: 'More prompts, verbose output' },
    { name: 'standard', range: '40–59', desc: 'Normal interaction' },
    { name: 'trusted', range: '60–79', desc: 'Extras suggested, reduced prompts' },
    { name: 'autonomous', range: '80–100', desc: 'Skip confirmations, auto features' },
  ];

  for (const level of levels) {
    const marker = level.name === state.level ? colors.green('►') : ' ';
    const name = level.name === state.level ? colors.bold(colors.cyan(level.name)) : colors.dim(level.name);
    console.log(`  ${marker} ${name.padEnd(25)} ${colors.dim(level.range.padEnd(8))} ${colors.dim(level.desc)}`);
  }

  console.log();

  // History
  if (state.history.length > 0) {
    separator();
    console.log(`  ${colors.bold('Recent History')} ${colors.dim(`(last ${state.history.length})`)}`);
    console.log();
    for (const h of state.history.slice(-5)) {
      console.log(`  ${colors.dim(h.date)}  score: ${colors.cyan(String(h.score))}  ${colors.dim(h.signal)}`);
    }
    console.log();
  }

  info(`${colors.dim('Reset: npx copilotforge trust --reset')}`);
  console.log();
}

module.exports = { run };
