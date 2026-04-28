'use strict';

/**
 * CopilotForge Terminal UI Helpers — Phase 19
 *
 * Zero-dependency terminal UI primitives:
 *   - Progress bar with percentage
 *   - Spinner for async operations
 *   - Boxed messages
 *   - Table formatting
 */

const { colors } = require('./utils');

// ── Progress bar ────────────────────────────────────────────────────────

/**
 * Render a progress bar string.
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {number} [width=30] - Bar width in characters
 * @returns {string} Formatted progress bar
 */
function progressBar(current, total, width = 30) {
  const pct = total > 0 ? Math.min(current / total, 1) : 0;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const bar = colors.green('█'.repeat(filled)) + colors.dim('░'.repeat(empty));
  const label = `${Math.round(pct * 100)}%`;
  return `${bar} ${label} (${current}/${total})`;
}

// ── Spinner ─────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Create a terminal spinner.
 * @param {string} message - Message to display
 * @returns {{ stop: (finalMessage?: string) => void }}
 */
function createSpinner(message) {
  let frame = 0;
  const interval = setInterval(() => {
    const symbol = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
    process.stderr.write(`\r  ${colors.cyan(symbol)} ${message}`);
    frame++;
  }, 80);

  return {
    stop(finalMessage) {
      clearInterval(interval);
      process.stderr.write(`\r  ${colors.green('✓')} ${finalMessage || message}\n`);
    },
    fail(finalMessage) {
      clearInterval(interval);
      process.stderr.write(`\r  ${colors.red('✗')} ${finalMessage || message}\n`);
    },
  };
}

// ── Box ─────────────────────────────────────────────────────────────────

/**
 * Render a boxed message.
 * @param {string} title - Box title
 * @param {string[]} lines - Lines of content
 * @param {number} [width=60] - Box width
 */
function box(title, lines, width = 60) {
  const top = `  ┌${'─'.repeat(width - 2)}┐`;
  const bottom = `  └${'─'.repeat(width - 2)}┘`;
  const titleLine = `  │ ${colors.bold(title)}${' '.repeat(Math.max(0, width - 4 - stripAnsi(title).length))} │`;

  const output = [top, titleLine, `  │${' '.repeat(width - 2)}│`];

  for (const line of lines) {
    const stripped = stripAnsi(line);
    const padding = Math.max(0, width - 4 - stripped.length);
    output.push(`  │ ${line}${' '.repeat(padding)} │`);
  }

  output.push(bottom);
  return output.join('\n');
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// ── Table ───────────────────────────────────────────────────────────────

/**
 * Format data as an aligned table.
 * @param {string[]} headers - Column headers
 * @param {string[][]} rows - Data rows
 * @returns {string} Formatted table
 */
function table(headers, rows) {
  const widths = headers.map((h, i) => {
    const colValues = [h, ...rows.map((r) => stripAnsi(r[i] || ''))];
    return Math.max(...colValues.map((v) => v.length));
  });

  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  const separator = widths.map((w) => '─'.repeat(w)).join('──');

  const dataLines = rows.map((row) =>
    row.map((cell, i) => {
      const stripped = stripAnsi(cell || '');
      const padding = Math.max(0, widths[i] - stripped.length);
      return (cell || '') + ' '.repeat(padding);
    }).join('  '),
  );

  return ['  ' + headerLine, '  ' + separator, ...dataLines.map((l) => '  ' + l)].join('\n');
}

// ── Numbered menu ───────────────────────────────────────────────────────

/**
 * Display a numbered menu for selection.
 * @param {string} title - Menu title
 * @param {Array<{label: string, description?: string}>} items - Menu items
 */
function numberedMenu(title, items) {
  console.log();
  console.log(`  ${colors.bold(title)}`);
  console.log();
  for (let i = 0; i < items.length; i++) {
    const num = colors.cyan(`${i + 1}.`);
    const label = items[i].label;
    const desc = items[i].description ? colors.dim(` — ${items[i].description}`) : '';
    console.log(`  ${num} ${label}${desc}`);
  }
  console.log();
}

module.exports = {
  progressBar,
  createSpinner,
  box,
  table,
  numberedMenu,
  stripAnsi,
  SPINNER_FRAMES,
};
