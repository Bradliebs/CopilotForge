'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Upgrade Migration — Phase 19
 *
 * Auto-detects older CopilotForge installations and migrates to v2.x format.
 * Handles structural changes across major versions.
 *
 * Migrations:
 *   v1.x → v2.x:
 *     - Version stamp updates in FORGE.md
 *     - Trust file location (forge-memory/trust.json → .copilotforge/trust.json was never moved, just coexists)
 *     - Playbook format validation
 *     - Missing Phase 17+ features detection
 *
 * Usage:
 *   copilotforge migrate                Check for needed migrations
 *   copilotforge migrate --apply        Apply all migrations
 *   copilotforge migrate --dry-run      Preview without changes
 */

// ── Version detection ───────────────────────────────────────────────────

function detectInstalledVersion(cwd) {
  // Check FORGE.md version stamp
  const forgePath = path.join(cwd, 'FORGE.md');
  if (exists(forgePath)) {
    try {
      const content = fs.readFileSync(forgePath, 'utf8');
      const match = content.match(/<!-- copilotforge: v(\d+\.\d+\.\d+) -->/);
      if (match) return match[1];
    } catch { /* ignore */ }
  }

  // Check for planner SKILL.md as fallback (any version)
  const skillPath = path.join(cwd, '.github', 'skills', 'planner', 'SKILL.md');
  if (exists(skillPath)) return '1.0.0'; // Legacy — no stamp

  return null;
}

function parseVersion(ver) {
  const parts = ver.split('.').map(Number);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

// ── Migration checks ───────────────────────────────────────────────────

function checkMigrations(cwd) {
  const migrations = [];
  const installed = detectInstalledVersion(cwd);

  if (!installed) {
    return { installed: null, migrations, needsMigration: false };
  }

  const ver = parseVersion(installed);
  const currentPkg = require('../package.json');
  const current = parseVersion(currentPkg.version);

  // v1.x → v2.x migrations
  if (ver.major < 2) {
    // Version stamp update
    const forgePath = path.join(cwd, 'FORGE.md');
    if (exists(forgePath)) {
      migrations.push({
        id: 'version-stamp',
        description: `Update FORGE.md version stamp from v${installed} to v${currentPkg.version}`,
        severity: 'info',
        apply: () => {
          let content = fs.readFileSync(forgePath, 'utf8');
          content = content.replace(
            /<!-- copilotforge: v[\d.]+ -->/,
            `<!-- copilotforge: v${currentPkg.version} -->`,
          );
          fs.writeFileSync(forgePath, content, 'utf8');
        },
      });
    }

    // Missing playbook (added in v1.8.0)
    const playbookPath = path.join(cwd, 'forge-memory', 'playbook.md');
    if (!exists(playbookPath) && exists(path.join(cwd, 'forge-memory'))) {
      migrations.push({
        id: 'add-playbook',
        description: 'Create forge-memory/playbook.md (experiential memory)',
        severity: 'recommended',
        apply: () => {
          const content = '# Playbook\n\nAccumulated strategies, patterns, and insights learned across sessions.\nEntries are scored by usefulness — higher scores surface first.\n';
          fs.writeFileSync(playbookPath, content, 'utf8');
        },
      });
    }

    // Missing trust.json (added in v1.8.0)
    const trustPath = path.join(cwd, 'forge-memory', 'trust.json');
    if (!exists(trustPath) && exists(path.join(cwd, 'forge-memory'))) {
      migrations.push({
        id: 'add-trust',
        description: 'Initialize trust trajectory tracking',
        severity: 'recommended',
        apply: () => {
          const trust = {
            version: 1,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            sessionCount: 0,
            signals: { overrides: 0, rollbacks: 0, fileEdits: 0, tasksCompleted: 0, tasksFailed: 0, extrasSelected: 0, confirmations: 0 },
            level: 'cautious',
            score: 0,
          };
          fs.writeFileSync(trustPath, JSON.stringify(trust, null, 2) + '\n', 'utf8');
        },
      });
    }

    // Missing Oracle Prime (added in v1.6.0)
    const oraclePath = path.join(cwd, '.github', 'skills', 'oracle-prime', 'SKILL.md');
    if (!exists(oraclePath)) {
      migrations.push({
        id: 'add-oracle-prime',
        description: 'Add Oracle Prime reasoning framework skill',
        severity: 'optional',
        apply: () => {
          info('  Run `npx copilotforge init --oracle-prime` to install Oracle Prime');
        },
      });
    }
  }

  // Any version: check for stale version stamps
  if (ver.major === current.major && (ver.minor < current.minor || ver.patch < current.patch)) {
    const forgePath = path.join(cwd, 'FORGE.md');
    if (exists(forgePath)) {
      const content = fs.readFileSync(forgePath, 'utf8');
      if (content.includes(`v${installed}`) && installed !== currentPkg.version) {
        migrations.push({
          id: 'update-stamp',
          description: `Update version stamp: v${installed} → v${currentPkg.version}`,
          severity: 'info',
          apply: () => {
            let c = fs.readFileSync(forgePath, 'utf8');
            c = c.replace(
              new RegExp(`v${installed.replace(/\./g, '\\.')}`, 'g'),
              `v${currentPkg.version}`,
            );
            fs.writeFileSync(forgePath, c, 'utf8');
          },
        });
      }
    }
  }

  return {
    installed,
    current: currentPkg.version,
    migrations,
    needsMigration: migrations.length > 0,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const apply = args.includes('--apply');
  const dryRun = args.includes('--dry-run');

  console.log();
  info('🔄 CopilotForge Migration Check');
  console.log();

  const result = checkMigrations(cwd);

  if (!result.installed) {
    info('  No CopilotForge installation detected.');
    info(colors.dim('  Run `npx copilotforge init` to set up.'));
    console.log();
    return;
  }

  info(`  Installed: v${result.installed}`);
  info(`  Current:   v${result.current}`);
  console.log();

  if (!result.needsMigration) {
    success('  ✅ No migrations needed — you are up to date');
    console.log();
    return;
  }

  const sevIcon = { info: 'ℹ️', recommended: '⚡', optional: '○' };
  info(`  ${result.migrations.length} migration(s) available:`);
  console.log();

  for (const m of result.migrations) {
    const icon = sevIcon[m.severity] || 'ℹ️';
    info(`  ${icon} ${colors.cyan(m.id)}: ${m.description}`);
  }

  console.log();

  if (apply && !dryRun) {
    let applied = 0;
    for (const m of result.migrations) {
      try {
        m.apply();
        success(`  ✅ Applied: ${m.id}`);
        applied++;
      } catch (err) {
        warn(`  Failed: ${m.id} — ${err.message}`);
      }
    }
    console.log();
    info(`  ${applied}/${result.migrations.length} migrations applied`);
  } else if (dryRun) {
    info(colors.dim('  Dry run — no changes made'));
  } else {
    info(colors.dim('  Run with --apply to execute migrations'));
  }

  console.log();
}

module.exports = {
  run,
  detectInstalledVersion,
  checkMigrations,
  parseVersion,
};
