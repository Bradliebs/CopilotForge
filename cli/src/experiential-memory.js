'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, exists } = require('./utils');

/**
 * CopilotForge Experiential Memory Layer
 *
 * Bridges the gap between factual memory (forge-memory/decisions.md) and
 * the working context window. Accumulates strategies, patterns, and
 * anti-patterns learned across sessions into a structured playbook.
 *
 * Three memory tiers (from Claude Code paper Section 12.2):
 *   - Factual: CLAUDE.md / forge-memory (static instructions)
 *   - Working: conversation context window (ephemeral)
 *   - Experiential: forge-memory/playbook.md (accumulated strategies) ← THIS
 *
 * Entry types:
 *   [STRATEGY]     — approach that worked well
 *   [PATTERN]      — recurring code/architecture pattern discovered
 *   [ANTIPATTERN]  — approach that failed or caused problems
 *   [INSIGHT]      — observation about the codebase or workflow
 */

// ── Entry types ─────────────────────────────────────────────────────────

const ENTRY_TYPES = ['STRATEGY', 'PATTERN', 'ANTIPATTERN', 'INSIGHT'];

// ── Playbook path ───────────────────────────────────────────────────────

function getPlaybookPath(cwd = process.cwd()) {
  return path.join(cwd, 'forge-memory', 'playbook.md');
}

// ── Read playbook ───────────────────────────────────────────────────────

/**
 * Parse the playbook into structured entries.
 * @param {string} cwd
 * @returns {{ entries: Array<{ type: string, title: string, content: string, date: string, score: number }> }}
 */
function readPlaybook(cwd = process.cwd()) {
  const playbookPath = getPlaybookPath(cwd);

  if (!exists(playbookPath)) {
    return { entries: [] };
  }

  try {
    const content = fs.readFileSync(playbookPath, 'utf8');
    return parsePlaybook(content);
  } catch {
    return { entries: [] };
  }
}

function parsePlaybook(content) {
  const entries = [];
  const sections = content.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const headerLine = lines[0] || '';

    // Parse header: [TYPE] Title
    const headerMatch = headerLine.match(/^\[(\w+)\]\s+(.+?)(?:\s+\(score:\s*(\d+)\))?$/);
    if (!headerMatch) continue;

    const type = headerMatch[1];
    const title = headerMatch[2];
    const score = parseInt(headerMatch[3] || '1', 10);

    // Parse date from content
    const dateMatch = section.match(/Date:\s*(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Everything after the header is content
    const body = lines.slice(1).join('\n').trim();

    entries.push({ type, title, content: body, date, score });
  }

  return { entries };
}

// ── Write entry ─────────────────────────────────────────────────────────

/**
 * Add a new entry to the playbook.
 * @param {string} type - One of ENTRY_TYPES
 * @param {string} title - Brief label
 * @param {string} content - Detailed description
 * @param {string} [cwd]
 */
function addPlaybookEntry(type, title, content, cwd = process.cwd()) {
  if (!ENTRY_TYPES.includes(type)) {
    throw new Error(`Invalid entry type: ${type}. Valid: ${ENTRY_TYPES.join(', ')}`);
  }

  const playbookPath = getPlaybookPath(cwd);
  const date = new Date().toISOString().slice(0, 10);

  const entry = `\n## [${type}] ${title}\n\nDate: ${date}\n\n${content}\n`;

  // Create forge-memory dir if needed
  const dir = path.dirname(playbookPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create or append
  if (!exists(playbookPath)) {
    const header = `# Playbook\n\nAccumulated strategies, patterns, and insights learned across sessions.\nEntries are scored by usefulness — higher scores surface first.\n`;
    fs.writeFileSync(playbookPath, header + entry, 'utf8');
  } else {
    fs.appendFileSync(playbookPath, entry, 'utf8');
  }

  return { type, title, date };
}

// ── Score management ────────────────────────────────────────────────────

/**
 * Increment the score of an entry (reinforcement).
 * @param {string} title - Entry title to reinforce
 * @param {string} [cwd]
 * @returns {boolean} true if entry was found and reinforced
 */
function reinforceEntry(title, cwd = process.cwd()) {
  const playbookPath = getPlaybookPath(cwd);
  if (!exists(playbookPath)) return false;

  let content = fs.readFileSync(playbookPath, 'utf8');
  const pattern = new RegExp(`(## \\[\\w+\\] ${escapeRegex(title)})(?:\\s+\\(score:\\s*(\\d+)\\))?`);
  const match = content.match(pattern);

  if (!match) return false;

  const currentScore = parseInt(match[2] || '1', 10);
  const newScore = currentScore + 1;
  const replacement = `${match[1]} (score: ${newScore})`;
  content = content.replace(match[0], replacement);

  fs.writeFileSync(playbookPath, content, 'utf8');
  return true;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Retrieval ───────────────────────────────────────────────────────────

/**
 * Get the top-N most relevant entries for context injection.
 * Sorted by score descending, then by date descending.
 * @param {number} [n=5]
 * @param {string} [cwd]
 * @returns {Array}
 */
function getTopEntries(n = 5, cwd = process.cwd()) {
  const { entries } = readPlaybook(cwd);

  return entries
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.date.localeCompare(a.date);
    })
    .slice(0, n);
}

/**
 * Search entries by keyword.
 * @param {string} query
 * @param {string} [cwd]
 * @returns {Array}
 */
function searchPlaybook(query, cwd = process.cwd()) {
  const { entries } = readPlaybook(cwd);
  const lower = query.toLowerCase();

  return entries.filter(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.type.toLowerCase().includes(lower)
  );
}

// ── Consolidation (dreaming) ────────────────────────────────────────────

/**
 * Consolidate playbook: remove low-score entries, summarize clusters.
 * Called periodically or when playbook exceeds size threshold.
 * @param {object} [options]
 * @param {number} [options.maxEntries=50]
 * @param {number} [options.minScore=0] - Entries below this are pruned
 * @param {string} [options.cwd]
 * @returns {{ pruned: number, kept: number }}
 */
function consolidatePlaybook(options = {}) {
  const { maxEntries = 50, minScore = 0, cwd = process.cwd() } = options;
  const { entries } = readPlaybook(cwd);

  if (entries.length <= maxEntries) {
    return { pruned: 0, kept: entries.length };
  }

  // Keep high-score entries, prune low-score ones
  const sorted = entries.sort((a, b) => b.score - a.score);
  const kept = sorted.filter((e) => e.score > minScore).slice(0, maxEntries);
  const pruned = entries.length - kept.length;

  // Rewrite playbook
  const playbookPath = getPlaybookPath(cwd);
  const header = `# Playbook\n\nAccumulated strategies, patterns, and insights learned across sessions.\nEntries are scored by usefulness — higher scores surface first.\nLast consolidated: ${new Date().toISOString().slice(0, 10)}\n`;

  const body = kept
    .map((e) => {
      const scoreStr = e.score > 1 ? ` (score: ${e.score})` : '';
      return `\n## [${e.type}] ${e.title}${scoreStr}\n\nDate: ${e.date}\n\n${e.content}\n`;
    })
    .join('');

  fs.writeFileSync(playbookPath, header + body, 'utf8');

  return { pruned, kept: kept.length };
}

// ── Oracle Prime Evolution integration ──────────────────────────────────

/**
 * Process an Oracle Prime Evolution Block and add to playbook.
 * @param {{ drift: string, gap: string, patch: string }} evolution
 * @param {string} [cwd]
 */
function processEvolutionBlock(evolution, cwd = process.cwd()) {
  if (!evolution || !evolution.patch) return;

  // Check for [REINFORCED: P#] — reinforce existing entry
  const reinforcedMatch = evolution.patch.match(/\[REINFORCED:\s*P(\d+)\]/);
  if (reinforcedMatch) {
    reinforceEntry(`Standing Patch P${reinforcedMatch[1]}`, cwd);
    return;
  }

  // Determine entry type from patch content
  let type = 'STRATEGY';
  if (evolution.gap && /missing|weak|no.*heuristic/i.test(evolution.gap)) {
    type = 'INSIGHT';
  }
  if (evolution.patch && /avoid|don't|never|wrong/i.test(evolution.patch)) {
    type = 'ANTIPATTERN';
  }
  if (evolution.patch && /pattern|convention|always/i.test(evolution.patch)) {
    type = 'PATTERN';
  }

  const title = evolution.patch.slice(0, 80).replace(/[[\]]/g, '');
  const content = [
    evolution.drift ? `**Drift:** ${evolution.drift}` : '',
    evolution.gap ? `**Gap:** ${evolution.gap}` : '',
    `**Patch:** ${evolution.patch}`,
  ]
    .filter(Boolean)
    .join('\n');

  addPlaybookEntry(type, title, content, cwd);
}

module.exports = {
  ENTRY_TYPES,
  getPlaybookPath,
  readPlaybook,
  parsePlaybook,
  addPlaybookEntry,
  reinforceEntry,
  getTopEntries,
  searchPlaybook,
  consolidatePlaybook,
  processEvolutionBlock,
};
