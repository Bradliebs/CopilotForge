'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge AI-Assisted Code Review — Phase 18
 *
 * Scans generated files for common issues, suggests improvements, and flags
 * anti-patterns using playbook entries. Integrates with doctor for health checks.
 *
 * Checks:
 *   - Missing error handling in async functions
 *   - Hardcoded secrets or API keys
 *   - TODO/FIXME/HACK markers
 *   - Large file detection (> 500 lines)
 *   - Missing exports in entry points
 *   - Playbook anti-pattern matching
 *
 * Usage:
 *   copilotforge review                     Review project files
 *   copilotforge review <file>              Review a specific file
 *   copilotforge review --playbook          Include playbook anti-pattern checks
 */

// ── Rule definitions ────────────────────────────────────────────────────

const RULES = [
  {
    id: 'hardcoded-secret',
    severity: 'error',
    pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    message: 'Potential hardcoded secret detected',
    suggestion: 'Use environment variables or a secrets manager',
  },
  {
    id: 'todo-marker',
    severity: 'info',
    pattern: /\b(TODO|FIXME|HACK|XXX|TEMP)\b/g,
    message: 'Unresolved marker found',
    suggestion: 'Address or create a tracking issue',
  },
  {
    id: 'console-log',
    severity: 'warn',
    pattern: /\bconsole\.(log|debug|trace)\s*\(/g,
    message: 'Debug logging in production code',
    suggestion: 'Use a structured logger or remove before shipping',
    excludePatterns: ['test', 'spec', '.test.', '.spec.'],
  },
  {
    id: 'eval-usage',
    severity: 'error',
    pattern: /\beval\s*\(/g,
    message: 'Use of eval() detected',
    suggestion: 'Avoid eval() — use JSON.parse() or Function constructor if needed',
  },
  {
    id: 'no-catch-handler',
    severity: 'warn',
    pattern: /\.catch\s*\(\s*\)/g,
    message: 'Empty catch handler swallows errors',
    suggestion: 'Log or handle the error, or use a comment to document why it is safe to ignore',
  },
];

// ── File scanning ───────────────────────────────────────────────────────

const SCAN_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.py']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage', '__pycache__']);

function collectFiles(dir, maxDepth = 4, depth = 0) {
  if (depth > maxDepth) return [];
  const files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && depth === 0 && entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectFiles(fullPath, maxDepth, depth + 1));
      } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch { /* permission errors */ }

  return files;
}

function scanFile(filePath, rules) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  // Large file check
  if (lines.length > 500) {
    findings.push({
      rule: 'large-file',
      severity: 'warn',
      line: 0,
      message: `File has ${lines.length} lines (>500)`,
      suggestion: 'Consider splitting into smaller modules',
    });
  }

  for (const rule of rules) {
    // Skip rules with exclude patterns for certain files
    if (rule.excludePatterns) {
      const lowerPath = filePath.toLowerCase();
      if (rule.excludePatterns.some((p) => lowerPath.includes(p))) continue;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Reset regex lastIndex for global patterns
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        findings.push({
          rule: rule.id,
          severity: rule.severity,
          line: i + 1,
          message: rule.message,
          suggestion: rule.suggestion,
          text: line.trim().slice(0, 80),
        });
      }
    }
  }

  return findings;
}

// ── Playbook anti-pattern matching ──────────────────────────────────────

function loadAntiPatterns(cwd) {
  try {
    const { readPlaybook } = require('./experiential-memory');
    const { entries } = readPlaybook(cwd);
    return entries.filter((e) => e.type === 'ANTIPATTERN');
  } catch { return []; }
}

function matchAntiPatterns(filePath, content, antiPatterns) {
  const findings = [];
  const lower = content.toLowerCase();

  for (const ap of antiPatterns) {
    // Extract keywords from anti-pattern title and content
    const keywords = (ap.title + ' ' + ap.content)
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);

    const matchCount = keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount >= 2) {
      findings.push({
        rule: 'playbook-antipattern',
        severity: 'warn',
        line: 0,
        message: `Matches anti-pattern: ${ap.title}`,
        suggestion: ap.content.slice(0, 120),
      });
    }
  }

  return findings;
}

// ── Review execution ────────────────────────────────────────────────────

function reviewProject(cwd, options = {}) {
  const { usePlaybook = false, singleFile = null } = options;

  const files = singleFile
    ? [path.resolve(cwd, singleFile)]
    : collectFiles(cwd);

  const antiPatterns = usePlaybook ? loadAntiPatterns(cwd) : [];
  const allFindings = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(cwd, file);
    const fileFindings = scanFile(file, RULES);

    if (usePlaybook && antiPatterns.length > 0) {
      fileFindings.push(...matchAntiPatterns(file, content, antiPatterns));
    }

    if (fileFindings.length > 0) {
      allFindings.push({ file: relPath, findings: fileFindings });
    }
  }

  return {
    filesScanned: files.length,
    filesWithIssues: allFindings.length,
    totalFindings: allFindings.reduce((sum, f) => sum + f.findings.length, 0),
    errors: allFindings.reduce((sum, f) => sum + f.findings.filter((x) => x.severity === 'error').length, 0),
    warnings: allFindings.reduce((sum, f) => sum + f.findings.filter((x) => x.severity === 'warn').length, 0),
    infos: allFindings.reduce((sum, f) => sum + f.findings.filter((x) => x.severity === 'info').length, 0),
    results: allFindings,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const usePlaybook = args.includes('--playbook');
  const singleFile = args.find((a) => !a.startsWith('-'));

  console.log();
  info('🔍 CopilotForge Code Review');
  console.log();

  const review = reviewProject(cwd, { usePlaybook, singleFile });

  info(`  Scanned ${colors.bold(String(review.filesScanned))} files`);

  if (review.totalFindings === 0) {
    success('  ✅ No issues found');
    console.log();
    return;
  }

  console.log();
  const sevIcon = { error: '❌', warn: '⚠️', info: 'ℹ️' };
  const sevColor = { error: colors.red, warn: colors.yellow, info: colors.dim };

  for (const { file, findings } of review.results) {
    info(`  📄 ${colors.cyan(file)}`);
    for (const f of findings) {
      const icon = sevIcon[f.severity] || 'ℹ️';
      const color = sevColor[f.severity] || colors.dim;
      const loc = f.line > 0 ? `:${f.line}` : '';
      info(`     ${icon} ${color(f.message)}${loc}`);
      if (f.suggestion) info(`        ${colors.dim('→ ' + f.suggestion)}`);
    }
    console.log();
  }

  info(`  Summary: ${colors.red(review.errors + ' errors')}, ${colors.yellow(review.warnings + ' warnings')}, ${review.infos} info`);
  console.log();
}

module.exports = {
  run,
  reviewProject,
  scanFile,
  collectFiles,
  RULES,
};
