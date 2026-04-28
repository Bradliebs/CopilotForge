'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exists, colors, info, success, warn } = require('./utils');

/**
 * CopilotForge Playbook Auto-Discovery — Phase 18
 *
 * Scans the codebase and git history to automatically discover patterns
 * and generate playbook entries. Looks for:
 *   - Recurring file patterns (same structure across modules)
 *   - Common imports/dependencies
 *   - Git commit message patterns
 *   - Error handling patterns
 *   - Test patterns
 *
 * Usage:
 *   copilotforge discover                    Scan and suggest entries
 *   copilotforge discover --apply            Auto-add discovered entries
 *   copilotforge discover --dry-run          Preview without writing
 */

// ── Pattern scanners ────────────────────────────────────────────────────

/**
 * Scan package.json for technology stack patterns.
 */
function discoverStackPatterns(cwd) {
  const patterns = [];
  const pkgPath = path.join(cwd, 'package.json');
  if (!exists(pkgPath)) return patterns;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    // Detect test framework
    const testFrameworks = {
      jest: 'Jest', mocha: 'Mocha', vitest: 'Vitest',
      ava: 'Ava', tap: 'Tap', '@playwright/test': 'Playwright',
    };
    for (const [dep, name] of Object.entries(testFrameworks)) {
      if (allDeps[dep]) {
        patterns.push({
          type: 'PATTERN',
          title: `Test framework: ${name}`,
          content: `This project uses ${name} for testing. Run tests with: ${pkg.scripts?.test || `npx ${dep}`}`,
        });
        break;
      }
    }

    // Detect framework
    const frameworks = {
      next: 'Next.js', nuxt: 'Nuxt', 'react': 'React', vue: 'Vue',
      angular: 'Angular', svelte: 'Svelte', express: 'Express',
      fastify: 'Fastify', hono: 'Hono', '@nestjs/core': 'NestJS',
    };
    for (const [dep, name] of Object.entries(frameworks)) {
      if (allDeps[dep]) {
        patterns.push({
          type: 'PATTERN',
          title: `Framework: ${name}`,
          content: `Primary framework: ${name}. Follow ${name} conventions for file structure and patterns.`,
        });
        break;
      }
    }

    // Detect TypeScript
    if (allDeps.typescript) {
      patterns.push({
        type: 'PATTERN',
        title: 'TypeScript project',
        content: 'This project uses TypeScript. Ensure all new files use .ts/.tsx extensions and follow the tsconfig settings.',
      });
    }

    // Detect linter
    const linters = { eslint: 'ESLint', biome: 'Biome', '@biomejs/biome': 'Biome', prettier: 'Prettier' };
    for (const [dep, name] of Object.entries(linters)) {
      if (allDeps[dep]) {
        patterns.push({
          type: 'PATTERN',
          title: `Linter: ${name}`,
          content: `Code formatting enforced by ${name}. Run before committing.`,
        });
        break;
      }
    }
  } catch { /* ignore */ }

  return patterns;
}

/**
 * Scan git history for commit message patterns.
 */
function discoverGitPatterns(cwd) {
  const patterns = [];

  try {
    const log = execSync('git log --oneline -50 --format="%s"', {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    }).trim();

    if (!log) return patterns;

    const commits = log.split('\n');

    // Detect conventional commits
    const conventional = commits.filter((c) => /^(feat|fix|chore|docs|refactor|test|style|perf|build|ci|ops)\b/.test(c));
    if (conventional.length > commits.length * 0.5) {
      patterns.push({
        type: 'PATTERN',
        title: 'Conventional commits',
        content: `This project follows conventional commit format. Use: feat:, fix:, chore:, docs:, refactor:, test:, etc.`,
      });
    }

    // Detect ticket references
    const ticketRefs = commits.filter((c) => /[A-Z]+-\d+/.test(c));
    if (ticketRefs.length > commits.length * 0.3) {
      const match = ticketRefs[0].match(/([A-Z]+)-\d+/);
      const prefix = match ? match[1] : 'TICKET';
      patterns.push({
        type: 'PATTERN',
        title: 'Ticket references in commits',
        content: `Commits reference tickets with ${prefix}-NNN pattern. Include ticket IDs in commit messages.`,
      });
    }
  } catch { /* no git or error */ }

  return patterns;
}

/**
 * Scan file structure for directory patterns.
 */
function discoverStructurePatterns(cwd) {
  const patterns = [];

  try {
    const entries = fs.readdirSync(cwd, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name);

    // Detect monorepo
    if (dirs.includes('packages') || dirs.includes('apps')) {
      patterns.push({
        type: 'PATTERN',
        title: 'Monorepo structure',
        content: `Monorepo detected (${dirs.includes('packages') ? 'packages/' : 'apps/'}). Each package should have its own package.json and tests.`,
      });
    }

    // Detect src/test separation
    if (dirs.includes('src') && (dirs.includes('test') || dirs.includes('tests') || dirs.includes('__tests__'))) {
      const testDir = dirs.find((d) => ['test', 'tests', '__tests__'].includes(d));
      patterns.push({
        type: 'PATTERN',
        title: `Source/test separation: src/ + ${testDir}/`,
        content: `Source code in src/, tests in ${testDir}/. Mirror the src/ structure in ${testDir}/.`,
      });
    }

    // Detect docs directory
    if (dirs.includes('docs')) {
      patterns.push({
        type: 'INSIGHT',
        title: 'Documentation directory exists',
        content: 'Project has a docs/ directory. Update docs when making significant changes.',
      });
    }
  } catch { /* ignore */ }

  return patterns;
}

// ── Main discovery ──────────────────────────────────────────────────────

function discoverAll(cwd = process.cwd()) {
  const discovered = [
    ...discoverStackPatterns(cwd),
    ...discoverGitPatterns(cwd),
    ...discoverStructurePatterns(cwd),
  ];

  return discovered;
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const apply = args.includes('--apply');
  const dryRun = args.includes('--dry-run');

  console.log();
  info('🔍 CopilotForge Playbook Auto-Discovery');
  console.log();

  const discovered = discoverAll(cwd);

  if (discovered.length === 0) {
    info('  No new patterns discovered. Your project may need more history.');
    console.log();
    return;
  }

  info(`  Found ${colors.bold(String(discovered.length))} patterns:`);
  console.log();

  for (const entry of discovered) {
    const icon = entry.type === 'PATTERN' ? '📐' : entry.type === 'STRATEGY' ? '🎯' : entry.type === 'INSIGHT' ? '💡' : '📝';
    info(`  ${icon} [${entry.type}] ${colors.cyan(entry.title)}`);
    info(`     ${colors.dim(entry.content)}`);
    console.log();
  }

  if (apply && !dryRun) {
    try {
      const { addPlaybookEntry } = require('./experiential-memory');
      let added = 0;
      for (const entry of discovered) {
        try {
          addPlaybookEntry(entry.type, entry.title, entry.content, cwd);
          added++;
        } catch { /* skip duplicates or errors */ }
      }
      success(`  ✅ Added ${added} entries to playbook`);
    } catch (err) {
      warn(`  Failed to write entries: ${err.message}`);
    }
  } else if (apply && dryRun) {
    info(colors.dim('  Dry run — no entries written'));
  } else {
    info(colors.dim('  Run with --apply to add these to your playbook'));
  }

  console.log();
}

module.exports = {
  run,
  discoverAll,
  discoverStackPatterns,
  discoverGitPatterns,
  discoverStructurePatterns,
};
