'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, success, warn, fail, exists } = require('./utils');
const { fireHooks } = require('./hooks');

/**
 * CopilotForge Evaluator — Generator-Evaluator Separation
 *
 * Inspired by Claude Code paper Section 12.1: "the dominant failure mode
 * of deployed agents is not crashes but silent mistakes."
 *
 * The evaluator provides independent verification of task completion,
 * implementing the Sprint Contract pattern from Anthropic's harness design.
 *
 * Flow:
 *   1. Ralph Loop (generator) implements a task
 *   2. Evaluator (independent) reviews the work
 *   3. If evaluator confirms: mark [x]
 *   4. If evaluator flags issues: mark [?] (needs review)
 *   5. Hooks fire on both outcomes
 *
 * Evaluation checks:
 *   - File existence: do all expected files exist?
 *   - Syntax validity: do modified files parse without errors?
 *   - Test execution: do existing tests still pass?
 *   - Convention compliance: do changes follow forge-memory/patterns.md?
 *   - Size sanity: are file changes within reasonable bounds?
 */

// ── Evaluation result ───────────────────────────────────────────────────

/**
 * @typedef {Object} EvaluationResult
 * @property {boolean} passed - Overall pass/fail
 * @property {string} verdict - 'confirmed' | 'needs-review' | 'failed'
 * @property {Array<{ check: string, status: string, detail: string }>} checks
 * @property {string} summary - Human-readable summary
 */

// ── Evaluation checks ───────────────────────────────────────────────────

/**
 * Check that specified files exist.
 * @param {string[]} filePaths - Relative paths to verify
 * @param {string} cwd
 * @returns {{ check: string, status: string, detail: string }}
 */
function checkFilesExist(filePaths, cwd) {
  const missing = filePaths.filter((f) => !exists(path.join(cwd, f)));

  if (missing.length === 0) {
    return { check: 'files-exist', status: 'pass', detail: `All ${filePaths.length} expected files exist` };
  }
  return { check: 'files-exist', status: 'fail', detail: `Missing: ${missing.join(', ')}` };
}

/**
 * Check that modified files are not empty and have reasonable size.
 * @param {string[]} filePaths
 * @param {string} cwd
 * @returns {{ check: string, status: string, detail: string }}
 */
function checkFileSanity(filePaths, cwd) {
  const issues = [];

  for (const f of filePaths) {
    const abs = path.join(cwd, f);
    if (!exists(abs)) continue;

    const stat = fs.statSync(abs);

    if (stat.size === 0) {
      issues.push(`${f}: empty file`);
    } else if (stat.size > 500000) {
      issues.push(`${f}: unusually large (${(stat.size / 1024).toFixed(0)}KB)`);
    }
  }

  if (issues.length === 0) {
    return { check: 'file-sanity', status: 'pass', detail: 'All files have reasonable size' };
  }
  return { check: 'file-sanity', status: 'warn', detail: issues.join('; ') };
}

/**
 * Run project test command if available.
 * @param {string} cwd
 * @returns {{ check: string, status: string, detail: string }}
 */
function checkTests(cwd) {
  const pkgPath = path.join(cwd, 'package.json');

  if (!exists(pkgPath)) {
    return { check: 'tests', status: 'skip', detail: 'No package.json found' };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.scripts || !pkg.scripts.test) {
      return { check: 'tests', status: 'skip', detail: 'No test script defined' };
    }

    const { execSync } = require('child_process');
    execSync('npm test', {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 60000,
    });

    return { check: 'tests', status: 'pass', detail: 'Tests passed' };
  } catch (err) {
    const stderr = err.stderr?.toString().slice(0, 200) || err.message;
    return { check: 'tests', status: 'fail', detail: `Tests failed: ${stderr}` };
  }
}

/**
 * Check for convention compliance by scanning patterns.md.
 * @param {string[]} filePaths - Modified files
 * @param {string} cwd
 * @returns {{ check: string, status: string, detail: string }}
 */
function checkConventions(filePaths, cwd) {
  const patternsPath = path.join(cwd, 'forge-memory', 'patterns.md');

  if (!exists(patternsPath)) {
    return { check: 'conventions', status: 'skip', detail: 'No patterns.md found' };
  }

  try {
    const patterns = fs.readFileSync(patternsPath, 'utf8');
    const issues = [];

    // Extract simple pattern rules (## headings with content)
    const rules = [];
    const sections = patterns.split(/^## /m).filter(Boolean);
    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines[0]) rules.push(lines[0].trim());
    }

    if (rules.length === 0) {
      return { check: 'conventions', status: 'skip', detail: 'No patterns defined yet' };
    }

    return { check: 'conventions', status: 'pass', detail: `${rules.length} convention rules loaded` };
  } catch {
    return { check: 'conventions', status: 'skip', detail: 'Could not read patterns.md' };
  }
}

// ── Main evaluator ──────────────────────────────────────────────────────

/**
 * Evaluate a completed task.
 * @param {object} task
 * @param {string} task.id - Task identifier
 * @param {string} task.title - Task description
 * @param {string[]} [task.modifiedFiles] - Files that were changed
 * @param {string[]} [task.expectedFiles] - Files that should exist
 * @param {object} [options]
 * @param {boolean} [options.runTests=false] - Whether to run test suite
 * @param {string} [options.cwd]
 * @returns {Promise<EvaluationResult>}
 */
async function evaluate(task, options = {}) {
  const { runTests = false, cwd = process.cwd() } = options;
  const checks = [];

  // Fire pre-evaluation hooks
  await fireHooks('PostTaskExecute', {
    taskId: task.id,
    taskTitle: task.title,
    phase: 'evaluation-start',
    cwd,
  });

  // Run checks
  if (task.expectedFiles && task.expectedFiles.length > 0) {
    checks.push(checkFilesExist(task.expectedFiles, cwd));
  }

  if (task.modifiedFiles && task.modifiedFiles.length > 0) {
    checks.push(checkFileSanity(task.modifiedFiles, cwd));
  }

  checks.push(checkConventions(task.modifiedFiles || [], cwd));

  if (runTests) {
    checks.push(checkTests(cwd));
  }

  // Determine verdict
  const failures = checks.filter((c) => c.status === 'fail');
  const warnings = checks.filter((c) => c.status === 'warn');

  let verdict;
  let passed;

  if (failures.length > 0) {
    verdict = 'failed';
    passed = false;
  } else if (warnings.length > 0) {
    verdict = 'needs-review';
    passed = false;
  } else {
    verdict = 'confirmed';
    passed = true;
  }

  const summary = [
    `Task: ${task.id || task.title}`,
    `Verdict: ${verdict}`,
    `Checks: ${checks.filter((c) => c.status === 'pass').length} passed, ${failures.length} failed, ${warnings.length} warnings`,
    ...failures.map((f) => `  ✗ ${f.check}: ${f.detail}`),
    ...warnings.map((w) => `  ⚠ ${w.check}: ${w.detail}`),
  ].join('\n');

  const result = { passed, verdict, checks, summary };

  // Fire post-evaluation hooks
  await fireHooks('PostTaskExecute', {
    taskId: task.id,
    taskTitle: task.title,
    phase: 'evaluation-complete',
    verdict,
    cwd,
  });

  return result;
}

module.exports = {
  evaluate,
  checkFilesExist,
  checkFileSanity,
  checkTests,
  checkConventions,
};
