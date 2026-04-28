'use strict';

const { fireHooks } = require('./hooks');

/**
 * CopilotForge Compaction Pipeline
 *
 * Five-layer graduated context compression inspired by Claude Code's
 * compaction architecture (paper Section 4.3, Section 7.3).
 *
 * Each layer applies the least disruptive compression first,
 * escalating only when cheaper strategies prove insufficient.
 *
 * Layers (in execution order):
 *   1. Budget reduction — cap individual result sizes
 *   2. Snip — drop older history segments
 *   3. Microcompact — fine-grained compression of tool results
 *   4. Context collapse — virtual projection over history
 *   5. Auto-compact — full summarization (most expensive)
 *
 * Context budget units: characters (not tokens, for zero-dependency operation)
 */

// ── Configuration ───────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  maxContextChars: 200000,      // ~50K tokens at 4 chars/token
  budgetPerResult: 10000,       // Max chars per individual result
  snipThreshold: 0.7,           // Trigger snip at 70% capacity
  microcompactThreshold: 0.8,   // Trigger microcompact at 80%
  collapseThreshold: 0.9,       // Trigger collapse at 90%
  autocompactThreshold: 0.95,   // Trigger auto-compact at 95%
};

// ── Layer 1: Budget Reduction ───────────────────────────────────────────

/**
 * Cap individual message/result sizes.
 * Cheapest operation — always runs.
 * @param {Array<{ role: string, content: string, id?: string }>} messages
 * @param {number} maxChars - Per-message budget
 * @returns {{ messages: Array, charsSaved: number }}
 */
function budgetReduction(messages, maxChars = DEFAULT_CONFIG.budgetPerResult) {
  let charsSaved = 0;

  const processed = messages.map((msg) => {
    if (!msg.content || msg.content.length <= maxChars) return msg;

    const original = msg.content.length;
    const truncated = msg.content.slice(0, maxChars);
    const suffix = `\n\n[... truncated: ${original - maxChars} chars removed. Full content available in session transcript.]`;
    charsSaved += original - (maxChars + suffix.length);

    return { ...msg, content: truncated + suffix };
  });

  return { messages: processed, charsSaved };
}

// ── Layer 2: Snip ───────────────────────────────────────────────────────

/**
 * Drop older history segments, keeping recent messages.
 * Lightweight trim — preserves the most recent N messages.
 * @param {Array} messages
 * @param {number} keepRecent - Number of recent messages to keep
 * @returns {{ messages: Array, snipped: number, boundaryMessage: object|null }}
 */
function snip(messages, keepRecent = 20) {
  if (messages.length <= keepRecent) {
    return { messages, snipped: 0, boundaryMessage: null };
  }

  const snipped = messages.length - keepRecent;
  const kept = messages.slice(-keepRecent);

  const boundaryMessage = {
    role: 'system',
    content: `[Context snipped: ${snipped} older messages removed to manage context size. Recent conversation preserved.]`,
    _compaction: 'snip',
    _snippedCount: snipped,
  };

  return {
    messages: [boundaryMessage, ...kept],
    snipped,
    boundaryMessage,
  };
}

// ── Layer 3: Microcompact ───────────────────────────────────────────────

/**
 * Fine-grained compression of tool results and verbose outputs.
 * Replaces large structured outputs with compressed summaries.
 * @param {Array} messages
 * @returns {{ messages: Array, compacted: number }}
 */
function microcompact(messages) {
  let compacted = 0;

  const processed = messages.map((msg) => {
    if (!msg.content || msg.role === 'system') return msg;

    // Compress large code blocks (keep first and last lines)
    if (msg.content.length > 5000 && msg.content.includes('```')) {
      const compressed = compressCodeBlocks(msg.content);
      if (compressed.length < msg.content.length) {
        compacted++;
        return { ...msg, content: compressed };
      }
    }

    // Compress repetitive list items
    if (msg.content.length > 3000) {
      const compressed = compressRepetitiveLists(msg.content);
      if (compressed.length < msg.content.length * 0.8) {
        compacted++;
        return { ...msg, content: compressed };
      }
    }

    return msg;
  });

  return { messages: processed, compacted };
}

function compressCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, (block) => {
    const lines = block.split('\n');
    if (lines.length <= 10) return block;

    const header = lines.slice(0, 3).join('\n');
    const footer = lines.slice(-3).join('\n');
    return `${header}\n  // ... ${lines.length - 6} lines omitted ...\n${footer}`;
  });
}

function compressRepetitiveLists(content) {
  const lines = content.split('\n');
  const listItems = lines.filter((l) => /^\s*[-*]\s/.test(l));

  if (listItems.length > 20) {
    const kept = listItems.slice(0, 5);
    const tail = listItems.slice(-3);
    const omitted = listItems.length - 8;

    const nonListParts = lines.filter((l) => !/^\s*[-*]\s/.test(l));
    return [...nonListParts, ...kept, `  ... ${omitted} more items ...`, ...tail].join('\n');
  }

  return content;
}

// ── Layer 4: Context Collapse ───────────────────────────────────────────

/**
 * Virtual projection over conversation history.
 * Replaces completed task blocks with one-line summaries.
 * Read-time operation — does not mutate stored history.
 * @param {Array} messages
 * @returns {{ messages: Array, collapsed: number }}
 */
function contextCollapse(messages) {
  let collapsed = 0;
  const result = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];

    // Detect task completion blocks (user request → assistant response with ✅/[x])
    if (
      msg.role === 'assistant' &&
      msg.content &&
      (msg.content.includes('✅') || msg.content.includes('[x]')) &&
      msg.content.length > 2000
    ) {
      // Extract the conclusion/summary from the response
      const summaryMatch = msg.content.match(
        /(?:conclusion|summary|result|completed)[:.]?\s*(.{50,200})/i
      );
      const summary = summaryMatch
        ? summaryMatch[1].trim()
        : msg.content.slice(0, 150).trim();

      result.push({
        ...msg,
        content: `[Collapsed task block] ${summary}...`,
        _compaction: 'collapse',
        _originalLength: msg.content.length,
      });
      collapsed++;
    } else {
      result.push(msg);
    }

    i++;
  }

  return { messages: result, collapsed };
}

// ── Layer 5: Auto-compact ───────────────────────────────────────────────

/**
 * Full summarization of conversation history.
 * Most expensive operation — produces a model-generated summary.
 * In zero-dependency mode, uses heuristic extraction instead of LLM call.
 * @param {Array} messages
 * @returns {{ messages: Array, summary: string }}
 */
function autoCompact(messages) {
  // Extract key information from the conversation
  const keyPoints = [];

  for (const msg of messages) {
    if (!msg.content) continue;

    // Extract decisions
    if (msg.content.match(/decided|chose|selected|confirmed/i)) {
      const match = msg.content.match(
        /(?:decided|chose|selected|confirmed)\s+(?:to\s+)?(.{30,150})/i
      );
      if (match) keyPoints.push(`Decision: ${match[1].trim()}`);
    }

    // Extract task completions
    if (msg.content.includes('[x]') || msg.content.includes('✅')) {
      const taskMatch = msg.content.match(/\[x\]\s+(.{10,100})/);
      if (taskMatch) keyPoints.push(`Completed: ${taskMatch[1].trim()}`);
    }

    // Extract errors/failures
    if (msg.content.includes('[!]') || msg.content.includes('❌')) {
      const errorMatch = msg.content.match(/(?:\[!\]|❌)\s+(.{10,100})/);
      if (errorMatch) keyPoints.push(`Failed: ${errorMatch[1].trim()}`);
    }
  }

  const summary = [
    `[Auto-compact summary — ${messages.length} messages compressed]`,
    '',
    ...keyPoints.slice(0, 20).map((p) => `• ${p}`),
    '',
    `[End of compact summary. ${keyPoints.length} key points preserved.]`,
  ].join('\n');

  const compactBoundary = {
    role: 'system',
    content: summary,
    _compaction: 'auto-compact',
    _originalMessageCount: messages.length,
  };

  return { messages: [compactBoundary], summary };
}

// ── Main pipeline ───────────────────────────────────────────────────────

/**
 * Run the full 5-layer compaction pipeline on a message array.
 * Each layer runs only when the previous layers haven't reduced
 * context pressure below the threshold.
 *
 * @param {Array} messages - Conversation messages
 * @param {object} [config] - Override DEFAULT_CONFIG
 * @returns {Promise<{ messages: Array, stats: object }>}
 */
async function compact(messages, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const stats = {
    inputMessages: messages.length,
    inputChars: totalChars(messages),
    layers: [],
  };

  let current = messages;

  // Fire PreCompact hooks
  await fireHooks('PreCompact', {
    messageCount: messages.length,
    totalChars: stats.inputChars,
  });

  // Layer 1: Budget reduction (always runs)
  const l1 = budgetReduction(current, cfg.budgetPerResult);
  current = l1.messages;
  stats.layers.push({ name: 'budget-reduction', charsSaved: l1.charsSaved });

  // Layer 2: Snip (if still over threshold)
  if (totalChars(current) > cfg.maxContextChars * cfg.snipThreshold) {
    const l2 = snip(current);
    current = l2.messages;
    stats.layers.push({ name: 'snip', messagesSnipped: l2.snipped });
  }

  // Layer 3: Microcompact (if still over threshold)
  if (totalChars(current) > cfg.maxContextChars * cfg.microcompactThreshold) {
    const l3 = microcompact(current);
    current = l3.messages;
    stats.layers.push({ name: 'microcompact', compacted: l3.compacted });
  }

  // Layer 4: Context collapse (if still over threshold)
  if (totalChars(current) > cfg.maxContextChars * cfg.collapseThreshold) {
    const l4 = contextCollapse(current);
    current = l4.messages;
    stats.layers.push({ name: 'context-collapse', collapsed: l4.collapsed });
  }

  // Layer 5: Auto-compact (if still over threshold — last resort)
  if (totalChars(current) > cfg.maxContextChars * cfg.autocompactThreshold) {
    const l5 = autoCompact(current);
    current = l5.messages;
    stats.layers.push({ name: 'auto-compact', summary: l5.summary.length });
  }

  stats.outputMessages = current.length;
  stats.outputChars = totalChars(current);

  // Fire PostCompact hooks
  await fireHooks('PostCompact', {
    inputMessages: stats.inputMessages,
    outputMessages: stats.outputMessages,
    stats,
  });

  return { messages: current, stats };
}

function totalChars(messages) {
  return messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
}

module.exports = {
  compact,
  budgetReduction,
  snip,
  microcompact,
  contextCollapse,
  autoCompact,
  totalChars,
  DEFAULT_CONFIG,
};
