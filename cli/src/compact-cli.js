'use strict';

const fs = require('fs');
const path = require('path');
const { banner, colors, separator, info, success, warn } = require('./utils');
const { compact, totalChars, DEFAULT_CONFIG } = require('./compaction');

function run(args = []) {
  const cwd = process.cwd();
  const inputFile = args.find((a) => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const stats = args.includes('--stats');

  banner();
  console.log(`  ${colors.bold('📦 Context Compaction')}`);
  console.log();

  if (!inputFile) {
    // No file — show config and usage
    info(`${colors.bold('Usage:')}`);
    console.log(`  npx copilotforge compact <file>          Compact a conversation transcript`);
    console.log(`  npx copilotforge compact <file> --dry-run Preview without writing`);
    console.log(`  npx copilotforge compact --stats          Show compaction config`);
    console.log();

    if (stats) {
      separator();
      info(`${colors.bold('Compaction Configuration')}`);
      console.log();
      console.log(`  Max context:       ${colors.cyan(String(DEFAULT_CONFIG.maxContextChars))} chars (~${Math.round(DEFAULT_CONFIG.maxContextChars / 4000)}K tokens)`);
      console.log(`  Budget per result: ${colors.cyan(String(DEFAULT_CONFIG.budgetPerResult))} chars`);
      console.log(`  Snip threshold:    ${colors.cyan(String(DEFAULT_CONFIG.snipThreshold * 100))}%`);
      console.log(`  Microcompact:      ${colors.cyan(String(DEFAULT_CONFIG.microcompactThreshold * 100))}%`);
      console.log(`  Collapse:          ${colors.cyan(String(DEFAULT_CONFIG.collapseThreshold * 100))}%`);
      console.log(`  Auto-compact:      ${colors.cyan(String(DEFAULT_CONFIG.autocompactThreshold * 100))}%`);
      console.log();

      separator();
      info(`${colors.bold('Five-Layer Pipeline')}`);
      console.log();
      console.log(`  ${colors.cyan('1.')} Budget reduction  — Cap individual message sizes`);
      console.log(`  ${colors.cyan('2.')} Snip             — Drop older history segments`);
      console.log(`  ${colors.cyan('3.')} Microcompact     — Compress code blocks and lists`);
      console.log(`  ${colors.cyan('4.')} Context collapse — Replace completed tasks with summaries`);
      console.log(`  ${colors.cyan('5.')} Auto-compact     — Heuristic summarization (last resort)`);
      console.log();
      info(colors.dim('Each layer runs only if previous layers haven\'t reduced context below threshold.'));
    }

    console.log();
    return;
  }

  // Compact a file
  const filePath = path.resolve(cwd, inputFile);

  if (!fs.existsSync(filePath)) {
    warn(`File not found: ${inputFile}`);
    console.log();
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Parse as JSONL (session transcript) or plain text
  let messages;
  try {
    // Try JSONL (one JSON object per line)
    messages = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean)
      .map((entry) => ({
        role: entry.role || 'assistant',
        content: entry.content || entry.text || JSON.stringify(entry),
      }));
  } catch {
    // Fall back to plain text — treat entire file as one message
    messages = [{ role: 'assistant', content }];
  }

  if (messages.length === 0) {
    warn('No messages found in file.');
    console.log();
    return;
  }

  const inputChars = totalChars(messages);
  info(`Input: ${messages.length} messages, ${inputChars.toLocaleString()} chars`);
  console.log();

  // Run compaction
  compact(messages).then(({ messages: compacted, stats: compactionStats }) => {
    const outputChars = totalChars(compacted);
    const ratio = inputChars > 0 ? ((1 - outputChars / inputChars) * 100).toFixed(1) : '0';

    separator();
    info(`${colors.bold('Results')}`);
    console.log();
    console.log(`  Input:    ${colors.dim(inputChars.toLocaleString() + ' chars')} (${messages.length} messages)`);
    console.log(`  Output:   ${colors.cyan(outputChars.toLocaleString() + ' chars')} (${compacted.length} messages)`);
    console.log(`  Saved:    ${colors.green(ratio + '%')}`);
    console.log();

    // Show which layers fired
    info(`${colors.bold('Layers applied:')}`);
    for (const layer of compactionStats.layers) {
      const detail = Object.entries(layer)
        .filter(([k]) => k !== 'name')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      console.log(`  ${colors.cyan('✓')} ${layer.name}${detail ? ` — ${colors.dim(detail)}` : ''}`);
    }
    console.log();

    if (dryRun) {
      info(colors.dim('[dry-run] No files were written.'));
    } else {
      // Write compacted output
      const outputPath = filePath.replace(/(\.\w+)$/, '.compacted$1');
      const outputContent = compacted
        .map((m) => JSON.stringify({ role: m.role, content: m.content }))
        .join('\n');
      fs.writeFileSync(outputPath, outputContent, 'utf8');
      success(`Written to ${path.relative(cwd, outputPath)}`);
    }
    console.log();
  });
}

module.exports = { run };
