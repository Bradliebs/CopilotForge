'use strict';

const { colors, info, success } = require('./utils');

/**
 * CopilotForge Performance Profiling — Phase 19
 *
 * Measures and reports execution time for key CLI operations.
 * Zero dependencies — uses process.hrtime.bigint().
 *
 * Usage:
 *   copilotforge perf                    Run all benchmarks
 *   copilotforge perf detect             Benchmark detect only
 *   copilotforge perf init --dry-run     Benchmark init (dry-run)
 */

function measure(label, fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;
  return { label, ms, result };
}

function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 100) return `${ms.toFixed(1)}ms`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function statusIcon(ms) {
  if (ms < 50) return colors.green('⚡');
  if (ms < 200) return colors.yellow('🔶');
  return colors.red('🐢');
}

// ── Benchmarks ──────────────────────────────────────────────────────────

function benchmarkRequire() {
  return measure('Module require (utils)', () => {
    // Clear cache to get a fresh measurement
    const key = require.resolve('./utils');
    const cached = require.cache[key];
    delete require.cache[key];
    require('./utils');
    // Restore
    if (cached) require.cache[key] = cached;
    return true;
  });
}

function benchmarkDetect() {
  return measure('Build path detection', () => {
    const { detectBuildPath } = require('./smart-detect');
    return detectBuildPath(process.cwd());
  });
}

function benchmarkConfig() {
  return measure('Config loading', () => {
    const { loadConfig } = require('./config');
    return loadConfig(process.cwd());
  });
}

function benchmarkPlaybookRead() {
  return measure('Playbook read', () => {
    try {
      const { readPlaybook } = require('./experiential-memory');
      return readPlaybook(process.cwd());
    } catch { return null; }
  });
}

function benchmarkTrustRead() {
  return measure('Trust state read', () => {
    try {
      const { getTrustLevel, getSignals } = require('./trust');
      return { level: getTrustLevel(), signals: getSignals() };
    } catch { return null; }
  });
}

function benchmarkDiscover() {
  return measure('Auto-discovery scan', () => {
    const { discoverAll } = require('./discover');
    return discoverAll(process.cwd());
  });
}

function benchmarkReview() {
  return measure('Code review scan', () => {
    const { reviewProject } = require('./review');
    return reviewProject(process.cwd());
  });
}

// ── Runner ──────────────────────────────────────────────────────────────

function runAll() {
  return [
    benchmarkRequire(),
    benchmarkConfig(),
    benchmarkDetect(),
    benchmarkPlaybookRead(),
    benchmarkTrustRead(),
    benchmarkDiscover(),
    benchmarkReview(),
  ];
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const sub = args[0];

  console.log();
  info(`⏱️  CopilotForge Performance Profile`);
  console.log();

  let results;

  if (sub === 'detect') {
    results = [benchmarkDetect()];
  } else if (sub === 'config') {
    results = [benchmarkConfig()];
  } else if (sub === 'discover') {
    results = [benchmarkDiscover()];
  } else if (sub === 'review') {
    results = [benchmarkReview()];
  } else {
    results = runAll();
  }

  let totalMs = 0;
  for (const r of results) {
    totalMs += r.ms;
    info(`  ${statusIcon(r.ms)} ${r.label.padEnd(28)} ${formatMs(r.ms).padStart(10)}`);
  }

  console.log();
  info(`  Total: ${formatMs(totalMs)}`);

  if (totalMs < 500) {
    success('  ✅ All operations within target (<500ms)');
  } else {
    info(colors.dim('  Some operations may benefit from caching'));
  }

  console.log();
}

module.exports = {
  run,
  measure,
  runAll,
  formatMs,
};
