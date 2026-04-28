'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { banner, colors, separator, info, success, warn, fail, ask, exists } = require('./utils');

const MAX_SNAPSHOTS = 5;

// ── Snapshot directory ──────────────────────────────────────────────────

function getSnapshotsDir(cwd) {
  const hash = crypto.createHash('sha256').update(cwd).digest('hex').slice(0, 8);
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.copilotforge', 'snapshots', hash);
}

// ── Capture snapshot ────────────────────────────────────────────────────

function captureSnapshot(filePaths, cwd = process.cwd()) {
  const snapshotsDir = getSnapshotsDir(cwd);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotDir = path.join(snapshotsDir, timestamp);

  fs.mkdirSync(snapshotDir, { recursive: true });

  const manifest = {
    timestamp: new Date().toISOString(),
    cwd,
    files: [],
  };

  for (const rel of filePaths) {
    // Never snapshot forge-memory files
    if (rel.startsWith('forge-memory') || rel.includes('forge-memory')) continue;

    const abs = path.join(cwd, rel);
    const entry = { path: rel, existed: false, content: null };

    if (fs.existsSync(abs)) {
      entry.existed = true;
      entry.content = fs.readFileSync(abs, 'utf8');
    }

    manifest.files.push(entry);
  }

  fs.writeFileSync(path.join(snapshotDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // Prune old snapshots
  pruneSnapshots(snapshotsDir, MAX_SNAPSHOTS);

  return snapshotDir;
}

// ── List snapshots ──────────────────────────────────────────────────────

function listSnapshots(cwd = process.cwd()) {
  const snapshotsDir = getSnapshotsDir(cwd);
  if (!fs.existsSync(snapshotsDir)) return [];

  const entries = fs.readdirSync(snapshotsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const manifestPath = path.join(snapshotsDir, e.name, 'manifest.json');
      if (!fs.existsSync(manifestPath)) return null;

      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return {
          id: e.name,
          timestamp: manifest.timestamp,
          fileCount: manifest.files.length,
          dir: path.join(snapshotsDir, e.name),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return entries;
}

// ── Restore snapshot ────────────────────────────────────────────────────

function restoreSnapshot(snapshotId, cwd = process.cwd(), dryRun = false) {
  const snapshotsDir = getSnapshotsDir(cwd);
  const snapshotDir = path.join(snapshotsDir, snapshotId);
  const manifestPath = path.join(snapshotDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const results = { restored: 0, deleted: 0, skipped: 0 };

  for (const entry of manifest.files) {
    const abs = path.join(cwd, entry.path);

    if (entry.existed && entry.content !== null) {
      // Restore file content
      if (dryRun) {
        info(`[dry-run] Would restore: ${entry.path}`);
      } else {
        const dir = path.dirname(abs);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(abs, entry.content, 'utf8');
      }
      results.restored++;
    } else if (!entry.existed) {
      // File didn't exist before — delete if it exists now
      if (fs.existsSync(abs)) {
        if (dryRun) {
          info(`[dry-run] Would delete (didn't exist before): ${entry.path}`);
        } else {
          fs.unlinkSync(abs);
        }
        results.deleted++;
      } else {
        results.skipped++;
      }
    }
  }

  return results;
}

// ── Prune old snapshots ─────────────────────────────────────────────────

function pruneSnapshots(snapshotsDir, max = MAX_SNAPSHOTS) {
  if (!fs.existsSync(snapshotsDir)) return;

  const entries = fs.readdirSync(snapshotsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name));

  if (entries.length <= max) return;

  const toRemove = entries.slice(max);
  for (const entry of toRemove) {
    const dir = path.join(snapshotsDir, entry.name);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── CLI command ─────────────────────────────────────────────────────────

async function run(args = []) {
  const dryRun = args.includes('--dry-run');
  const listOnly = args.includes('--list');
  const latest = args.includes('--latest');
  const cwd = process.cwd();

  banner();
  console.log(`  ${colors.bold('⏪ CopilotForge Rollback')}`);
  console.log();

  const snapshots = listSnapshots(cwd);

  if (snapshots.length === 0) {
    info('No snapshots found for this project.');
    info(colors.dim('Snapshots are created automatically when you run init or upgrade.'));
    console.log();
    return;
  }

  // --list: show snapshots and exit
  if (listOnly) {
    info(`${colors.bold('Available snapshots:')} (${snapshots.length})`);
    console.log();
    for (const s of snapshots) {
      info(`  ${colors.cyan(s.id)}  ${colors.dim(`${s.fileCount} files  ${s.timestamp}`)}`);
    }
    console.log();
    return;
  }

  // --latest: restore most recent
  if (latest) {
    const snap = snapshots[0];
    info(`Restoring latest snapshot: ${colors.cyan(snap.id)}`);
    console.log();
    const results = restoreSnapshot(snap.id, cwd, dryRun);
    if (dryRun) {
      info(colors.dim('[dry-run] No files were changed.'));
    } else {
      success(`Restored ${results.restored} file(s), removed ${results.deleted} file(s), skipped ${results.skipped}`);
      // Record rollback signal for trust tracking
      try {
        const { recordSignal } = require('./trust');
        recordSignal('rollbacks', 1, cwd);
      } catch { /* trust is optional */ }
    }
    console.log();
    return;
  }

  // Interactive: list and prompt
  info(`${colors.bold('Available snapshots:')}`);
  console.log();
  for (let i = 0; i < snapshots.length; i++) {
    const s = snapshots[i];
    info(`  ${colors.cyan(`[${i + 1}]`)} ${s.id}  ${colors.dim(`${s.fileCount} files`)}`);
  }
  console.log();

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const answer = await new Promise((resolve) => {
    rl.question(`  Select snapshot (1-${snapshots.length}): `, resolve);
  });
  rl.close();

  const num = parseInt(answer.trim(), 10);
  if (!Number.isInteger(num) || num < 1 || num > snapshots.length) {
    warn('Invalid selection. Aborted.');
    console.log();
    return;
  }

  const selected = snapshots[num - 1];
  const results = restoreSnapshot(selected.id, cwd, dryRun);

  console.log();
  if (dryRun) {
    info(colors.dim('[dry-run] No files were changed.'));
  } else {
    success(`Restored ${results.restored} file(s), removed ${results.deleted} file(s), skipped ${results.skipped}`);
    // Record rollback signal for trust tracking
    try {
      const { recordSignal } = require('./trust');
      recordSignal('rollbacks', 1, cwd);
    } catch { /* trust is optional */ }
  }
  console.log();
}

module.exports = { run, captureSnapshot, listSnapshots, restoreSnapshot, pruneSnapshots, getSnapshotsDir };
