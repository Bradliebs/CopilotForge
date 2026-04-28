'use strict';

const { banner, colors, separator, info, success, warn } = require('./utils');
const {
  readPlaybook, searchPlaybook, getTopEntries, consolidatePlaybook,
  ENTRY_TYPES, getPlaybookPath,
} = require('./experiential-memory');
const { exists } = require('./utils');

function run(args = []) {
  const cwd = process.cwd();
  const search = args.find((a) => !a.startsWith('--'));
  const consolidate = args.includes('--consolidate');
  const top = args.includes('--top');

  banner();
  console.log(`  ${colors.bold('📖 Experiential Memory Playbook')}`);
  console.log();

  const playbookPath = getPlaybookPath(cwd);

  if (!exists(playbookPath)) {
    info('No playbook found yet.');
    info(colors.dim('Run `npx copilotforge init --full` to seed starter strategies,'));
    info(colors.dim('or use Oracle Prime analysis to accumulate entries over time.'));
    console.log();
    return;
  }

  // --consolidate: prune and summarize
  if (consolidate) {
    const result = consolidatePlaybook({ cwd });
    success(`Consolidated: kept ${result.kept} entries, pruned ${result.pruned}`);
    console.log();
    return;
  }

  // --top: show highest-scored entries
  if (top) {
    const entries = getTopEntries(10, cwd);
    info(`${colors.bold('Top entries')} ${colors.dim(`(${entries.length})`)}`);
    console.log();
    for (const e of entries) {
      const scoreStr = e.score > 1 ? colors.cyan(` (score: ${e.score})`) : '';
      console.log(`  ${colors.bold(`[${e.type}]`)} ${e.title}${scoreStr}`);
      console.log(`  ${colors.dim(e.date)}  ${colors.dim(e.content.split('\n')[0].slice(0, 80))}`);
      console.log();
    }
    return;
  }

  // search: find entries matching a keyword
  if (search) {
    const results = searchPlaybook(search, cwd);
    if (results.length === 0) {
      info(`No entries matching "${search}"`);
      console.log();
      return;
    }
    info(`${colors.bold('Search results')} for "${search}" ${colors.dim(`(${results.length})`)}`);
    console.log();
    for (const e of results) {
      console.log(`  ${colors.bold(`[${e.type}]`)} ${e.title}`);
      console.log(`  ${colors.dim(e.content.split('\n')[0].slice(0, 80))}`);
      console.log();
    }
    return;
  }

  // Default: show all entries
  const { entries } = readPlaybook(cwd);

  if (entries.length === 0) {
    info('Playbook is empty. Entries accumulate from Oracle Prime Evolution Blocks.');
    console.log();
    return;
  }

  // Summary by type
  const byCat = {};
  for (const type of ENTRY_TYPES) byCat[type] = 0;
  for (const e of entries) {
    if (byCat[e.type] !== undefined) byCat[e.type]++;
  }

  info(`${colors.bold('Playbook')} — ${entries.length} entries`);
  console.log();

  const catEmoji = { STRATEGY: '🎯', PATTERN: '🔄', ANTIPATTERN: '⚠️', INSIGHT: '💡' };
  for (const [type, count] of Object.entries(byCat)) {
    if (count > 0) {
      console.log(`  ${catEmoji[type] || '•'} ${type}: ${colors.cyan(String(count))}`);
    }
  }
  console.log();

  separator();

  // Show recent entries
  const recent = entries.slice(-5);
  info(`${colors.bold('Recent entries')} ${colors.dim(`(last ${recent.length})`)}`);
  console.log();
  for (const e of recent) {
    const scoreStr = e.score > 1 ? colors.cyan(` (score: ${e.score})`) : '';
    console.log(`  ${colors.bold(`[${e.type}]`)} ${e.title}${scoreStr}`);
    console.log(`  ${colors.dim(e.date)}  ${colors.dim(e.content.split('\n')[0].slice(0, 80))}`);
    console.log();
  }

  info(colors.dim('Commands: playbook <search> | playbook --top | playbook --consolidate'));
  console.log();
}

module.exports = { run };
