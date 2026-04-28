'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Multi-Repo Support
 *
 * Share playbook entries and trust state across multiple repositories
 * in a workspace. Uses a shared directory (configurable) or the global
 * ~/.copilotforge/ directory as the bridge.
 *
 * Usage:
 *   copilotforge multi-repo status          Show linked repos
 *   copilotforge multi-repo link            Link current repo to shared state
 *   copilotforge multi-repo unlink          Unlink current repo
 *   copilotforge multi-repo sync            Sync playbook across linked repos
 */

// ── Shared state ────────────────────────────────────────────────────────

function getSharedDir() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.copilotforge');
}

function getLinkedReposPath() {
  return path.join(getSharedDir(), 'linked-repos.json');
}

function getLinkedRepos() {
  const p = getLinkedReposPath();
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')).repos || []; } catch { return []; }
}

function saveLinkedRepos(repos) {
  const p = getLinkedReposPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({ repos, updated: new Date().toISOString() }, null, 2), 'utf8');
}

// ── Link/Unlink ─────────────────────────────────────────────────────────

function linkRepo(cwd) {
  const repos = getLinkedRepos();
  const normalized = path.resolve(cwd);

  if (repos.find((r) => r.path === normalized)) {
    return { status: 'already-linked', path: normalized };
  }

  // Detect project name from package.json or directory name
  let name = path.basename(normalized);
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) name = pkg.name;
    } catch { /* use dir name */ }
  }

  repos.push({
    name,
    path: normalized,
    linkedAt: new Date().toISOString(),
  });

  saveLinkedRepos(repos);
  return { status: 'linked', name, path: normalized };
}

function unlinkRepo(cwd) {
  const repos = getLinkedRepos();
  const normalized = path.resolve(cwd);
  const idx = repos.findIndex((r) => r.path === normalized);

  if (idx === -1) return { status: 'not-linked' };

  const removed = repos.splice(idx, 1)[0];
  saveLinkedRepos(repos);
  return { status: 'unlinked', name: removed.name };
}

// ── Sync ────────────────────────────────────────────────────────────────

/**
 * Collect playbook entries from all linked repos.
 * Returns deduplicated entries with source attribution.
 */
function collectPlaybookEntries(repos) {
  const allEntries = [];

  for (const repo of repos) {
    const playbookPath = path.join(repo.path, 'forge-memory', 'playbook.md');
    if (!fs.existsSync(playbookPath)) continue;

    try {
      const content = fs.readFileSync(playbookPath, 'utf8');
      const entries = parsePlaybookEntries(content);
      for (const entry of entries) {
        allEntries.push({ ...entry, sourceRepo: repo.name, sourcePath: repo.path });
      }
    } catch { /* skip unreadable */ }
  }

  return allEntries;
}

function parsePlaybookEntries(content) {
  const entries = [];
  const sections = content.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const headerLine = lines[0] || '';
    const headerMatch = headerLine.match(/^\[(\w+)\]\s+(.+?)(?:\s+\(score:\s*(\d+)\))?$/);
    if (!headerMatch) continue;

    const dateMatch = section.match(/Date:\s*(\d{4}-\d{2}-\d{2})/);

    entries.push({
      type: headerMatch[1],
      title: headerMatch[2],
      score: parseInt(headerMatch[3] || '1', 10),
      date: dateMatch ? dateMatch[1] : '',
      content: lines.slice(1).join('\n').trim(),
    });
  }

  return entries;
}

/**
 * Deduplicate entries by title, keeping the highest-scored version.
 */
function deduplicateEntries(entries) {
  const byTitle = new Map();

  for (const entry of entries) {
    const existing = byTitle.get(entry.title);
    if (!existing || entry.score > existing.score) {
      byTitle.set(entry.title, entry);
    }
  }

  return Array.from(byTitle.values())
    .sort((a, b) => b.score - a.score);
}

/**
 * Aggregate trust signals from all linked repos.
 */
function aggregateTrust(repos) {
  const aggregate = {
    totalSessions: 0,
    totalTasksCompleted: 0,
    totalTasksFailed: 0,
    totalRollbacks: 0,
    repoCount: repos.length,
    repos: [],
  };

  for (const repo of repos) {
    const trustPath = path.join(repo.path, 'forge-memory', 'trust.json');
    if (!fs.existsSync(trustPath)) continue;

    try {
      const trust = JSON.parse(fs.readFileSync(trustPath, 'utf8'));
      aggregate.totalSessions += trust.sessionCount || 0;
      aggregate.totalTasksCompleted += trust.signals?.tasksCompleted || 0;
      aggregate.totalTasksFailed += trust.signals?.tasksFailed || 0;
      aggregate.totalRollbacks += trust.signals?.rollbacks || 0;
      aggregate.repos.push({ name: repo.name, level: trust.level || 'unknown', score: trust.score || 0 });
    } catch { /* skip */ }
  }

  return aggregate;
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const sub = args[0] || 'status';
  const cwd = process.cwd();

  switch (sub) {
    case 'status': {
      const repos = getLinkedRepos();
      const normalized = path.resolve(cwd);

      console.log();
      info('🔗 Multi-Repo Status');
      console.log();

      if (repos.length === 0) {
        info('  No linked repositories.');
        info(colors.dim('  Run `copilotforge multi-repo link` to link this repo.'));
      } else {
        const current = repos.find((r) => r.path === normalized);
        for (const repo of repos) {
          const marker = repo.path === normalized ? colors.green(' ◀ current') : '';
          const accessible = fs.existsSync(repo.path) ? colors.green('✓') : colors.red('✗');
          info(`  ${accessible} ${colors.cyan(repo.name.padEnd(24))} ${colors.dim(repo.path)}${marker}`);
        }

        // Show aggregate trust
        const trust = aggregateTrust(repos);
        if (trust.repos.length > 0) {
          console.log();
          info('  Trust Summary:');
          for (const r of trust.repos) {
            info(`    ${colors.cyan(r.name.padEnd(24))} ${r.level} (score: ${r.score})`);
          }
          info(`    ${colors.dim(`Total sessions: ${trust.totalSessions}, Tasks: ${trust.totalTasksCompleted} completed / ${trust.totalTasksFailed} failed`)}`);
        }
      }

      console.log();
      break;
    }

    case 'link': {
      const result = linkRepo(cwd);
      console.log();
      if (result.status === 'already-linked') {
        info(`  This repository is already linked.`);
      } else {
        success(`  ✅ Linked "${result.name}" to shared workspace`);
      }
      console.log();
      break;
    }

    case 'unlink': {
      const result = unlinkRepo(cwd);
      console.log();
      if (result.status === 'not-linked') {
        warn('  This repository is not linked.');
      } else {
        success(`  ✅ Unlinked "${result.name}"`);
      }
      console.log();
      break;
    }

    case 'sync': {
      const repos = getLinkedRepos();
      if (repos.length < 2) {
        warn('Need at least 2 linked repos to sync. Link more with `copilotforge multi-repo link`.');
        process.exit(1);
      }

      console.log();
      info('🔄 Syncing playbook across linked repos...');
      console.log();

      const allEntries = collectPlaybookEntries(repos);
      const deduplicated = deduplicateEntries(allEntries);

      info(`  Collected ${allEntries.length} entries from ${repos.length} repos`);
      info(`  Deduplicated to ${deduplicated.length} unique entries`);

      // Write shared playbook
      const sharedPath = path.join(getSharedDir(), 'shared-playbook.md');
      let output = '# Shared Playbook\n\n';
      output += `Aggregated from ${repos.length} repositories.\n`;
      output += `Last sync: ${new Date().toISOString()}\n\n`;

      for (const entry of deduplicated) {
        const scoreStr = entry.score > 1 ? ` (score: ${entry.score})` : '';
        output += `## [${entry.type}] ${entry.title}${scoreStr}\n\n`;
        if (entry.sourceRepo) output += `Source: ${entry.sourceRepo}\n`;
        if (entry.date) output += `Date: ${entry.date}\n`;
        output += `\n${entry.content}\n\n`;
      }

      fs.writeFileSync(sharedPath, output.trimEnd() + '\n', 'utf8');
      success(`  ✅ Shared playbook written to ${colors.dim(sharedPath)}`);
      console.log();
      break;
    }

    default:
      console.log();
      info('🔗 CopilotForge Multi-Repo');
      console.log();
      info('  Usage:');
      info('    copilotforge multi-repo status   Show linked repos and trust summary');
      info('    copilotforge multi-repo link      Link current repo to shared workspace');
      info('    copilotforge multi-repo unlink    Unlink current repo');
      info('    copilotforge multi-repo sync      Sync playbook across linked repos');
      console.log();
  }
}

module.exports = {
  run,
  getLinkedRepos,
  linkRepo,
  unlinkRepo,
  collectPlaybookEntries,
  deduplicateEntries,
  aggregateTrust,
};
