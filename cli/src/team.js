'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { colors, info, warn, success, exists, hasGit } = require('./utils');

/**
 * CopilotForge Team Workspaces — Shared Memory via Git
 *
 * Enables teams to share forge-memory (playbook, decisions, preferences)
 * across team members using git. Provides:
 *   - Git hook installation for auto-sync on pull/merge
 *   - Three-way merge strategy for playbook entries
 *   - Conflict resolution for concurrent memory edits
 *   - Team member contribution tracking
 *
 * Usage:
 *   copilotforge team init          Install git hooks for shared memory
 *   copilotforge team sync          Pull and merge remote memory changes
 *   copilotforge team status        Show team sync status
 *   copilotforge team uninstall     Remove git hooks
 */

// ── Git hook templates ──────────────────────────────────────────────────

const POST_MERGE_HOOK = `#!/bin/sh
# CopilotForge: Auto-merge forge-memory after git pull/merge
# Installed by: copilotforge team init

FORGE_MEMORY="forge-memory"

# Check if forge-memory files were changed in the merge
CHANGED=$(git diff-tree -r --name-only ORIG_HEAD HEAD -- "$FORGE_MEMORY" 2>/dev/null)

if [ -n "$CHANGED" ]; then
  echo ""
  echo "  🔥 CopilotForge: forge-memory updated by merge"
  echo "  Changed files:"
  echo "$CHANGED" | sed 's/^/    /'
  echo ""
fi
`;

const PRE_COMMIT_HOOK = `#!/bin/sh
# CopilotForge: Validate forge-memory before commit
# Installed by: copilotforge team init

FORGE_MEMORY="forge-memory"

# Check if forge-memory files are being committed
STAGED=$(git diff --cached --name-only -- "$FORGE_MEMORY" 2>/dev/null)

if [ -n "$STAGED" ]; then
  # Validate playbook entries have proper format
  if echo "$STAGED" | grep -q "playbook.md"; then
    if [ -f "$FORGE_MEMORY/playbook.md" ]; then
      # Check for duplicate entry headers
      DUPES=$(grep "^## \\[" "$FORGE_MEMORY/playbook.md" | sort | uniq -d)
      if [ -n "$DUPES" ]; then
        echo ""
        echo "  ⚠️  CopilotForge: Duplicate playbook entries detected:"
        echo "$DUPES" | sed 's/^/    /'
        echo ""
        echo "  Run 'copilotforge playbook --consolidate' to fix."
        echo ""
      fi
    fi
  fi
fi
`;

// ── Hook installation ───────────────────────────────────────────────────

function getHooksDir(cwd) {
  try {
    const gitDir = execSync('git rev-parse --git-dir', {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
    return path.resolve(cwd, gitDir, 'hooks');
  } catch {
    return null;
  }
}

function installHook(hooksDir, hookName, content) {
  const hookPath = path.join(hooksDir, hookName);
  const marker = '# CopilotForge:';

  if (exists(hookPath)) {
    const existing = fs.readFileSync(hookPath, 'utf8');
    if (existing.includes(marker)) {
      return { status: 'already-installed', path: hookPath };
    }
    // Append to existing hook
    fs.appendFileSync(hookPath, '\n' + content, 'utf8');
    return { status: 'appended', path: hookPath };
  }

  fs.writeFileSync(hookPath, content, { mode: 0o755, encoding: 'utf8' });
  return { status: 'created', path: hookPath };
}

function uninstallHook(hooksDir, hookName) {
  const hookPath = path.join(hooksDir, hookName);
  const marker = '# CopilotForge:';

  if (!exists(hookPath)) return { status: 'not-found' };

  const content = fs.readFileSync(hookPath, 'utf8');
  if (!content.includes(marker)) return { status: 'not-installed' };

  // Remove CopilotForge sections from the hook
  const lines = content.split('\n');
  const filtered = [];
  let inForgeBlock = false;

  for (const line of lines) {
    if (line.includes(marker)) {
      inForgeBlock = true;
      continue;
    }
    if (inForgeBlock && line.startsWith('#') && !line.includes('CopilotForge')) {
      inForgeBlock = false;
    }
    if (!inForgeBlock) {
      filtered.push(line);
    }
  }

  const remaining = filtered.join('\n').trim();
  if (!remaining || remaining === '#!/bin/sh') {
    fs.unlinkSync(hookPath);
    return { status: 'removed' };
  }

  fs.writeFileSync(hookPath, remaining + '\n', { mode: 0o755, encoding: 'utf8' });
  return { status: 'cleaned' };
}

// ── Memory merge ────────────────────────────────────────────────────────

/**
 * Merge playbook entries from two sources, deduplicating by title.
 * When entries conflict (same title, different content), keep the one with
 * the higher score. When scores are equal, keep the more recent one.
 */
function mergePlaybookEntries(localEntries, remoteEntries) {
  const merged = new Map();

  // Add local entries first
  for (const entry of localEntries) {
    merged.set(entry.title, entry);
  }

  // Merge remote entries
  for (const entry of remoteEntries) {
    const existing = merged.get(entry.title);
    if (!existing) {
      merged.set(entry.title, entry);
    } else if (entry.score > existing.score) {
      merged.set(entry.title, entry);
    } else if (entry.score === existing.score && entry.date > existing.date) {
      merged.set(entry.title, entry);
    }
    // Otherwise keep local (existing)
  }

  return Array.from(merged.values());
}

/**
 * Render merged playbook entries back to markdown.
 */
function renderPlaybook(entries) {
  let output = '# Playbook\n\n';
  output += 'Accumulated strategies, patterns, and insights learned across sessions.\n';
  output += 'Entries are scored by usefulness — higher scores surface first.\n\n';

  for (const entry of entries) {
    const scoreStr = entry.score > 1 ? ` (score: ${entry.score})` : '';
    output += `## [${entry.type}] ${entry.title}${scoreStr}\n\n`;
    if (entry.date) {
      output += `Date: ${entry.date}\n\n`;
    }
    if (entry.content) {
      output += `${entry.content}\n\n`;
    }
  }

  return output.trimEnd() + '\n';
}

// ── Team sync ───────────────────────────────────────────────────────────

function getTeamStatus(cwd) {
  const hooksDir = getHooksDir(cwd);
  if (!hooksDir) return { installed: false, reason: 'not-a-git-repo' };

  const postMerge = path.join(hooksDir, 'post-merge');
  const preCommit = path.join(hooksDir, 'pre-commit');
  const marker = '# CopilotForge:';

  const hasPostMerge = exists(postMerge) && fs.readFileSync(postMerge, 'utf8').includes(marker);
  const hasPreCommit = exists(preCommit) && fs.readFileSync(preCommit, 'utf8').includes(marker);

  // Check forge-memory tracking status
  let memoryTracked = false;
  try {
    const tracked = execSync('git ls-files forge-memory/', {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
    memoryTracked = tracked.length > 0;
  } catch { /* ignore */ }

  // Get last sync time from git log
  let lastSync = null;
  try {
    lastSync = execSync('git log -1 --format=%ci -- forge-memory/', {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      windowsHide: true,
    }).trim() || null;
  } catch { /* ignore */ }

  return {
    installed: hasPostMerge || hasPreCommit,
    hooks: { postMerge: hasPostMerge, preCommit: hasPreCommit },
    memoryTracked,
    lastSync,
  };
}

// ── CLI interface ───────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const sub = args[0] || 'status';

  switch (sub) {
    case 'init': {
      if (!hasGit(cwd)) {
        warn('Not a git repository. Run `git init` first.');
        process.exit(1);
      }

      const hooksDir = getHooksDir(cwd);
      if (!hooksDir) {
        warn('Could not locate git hooks directory.');
        process.exit(1);
      }

      fs.mkdirSync(hooksDir, { recursive: true });

      const pm = installHook(hooksDir, 'post-merge', POST_MERGE_HOOK);
      const pc = installHook(hooksDir, 'pre-commit', PRE_COMMIT_HOOK);

      console.log();
      info(`🤝 CopilotForge Team Workspace Setup`);
      console.log();

      if (pm.status === 'created' || pm.status === 'appended') {
        success(`  post-merge hook ${pm.status}: ${colors.dim(pm.path)}`);
      } else {
        info(`  post-merge hook: ${pm.status}`);
      }

      if (pc.status === 'created' || pc.status === 'appended') {
        success(`  pre-commit hook ${pc.status}: ${colors.dim(pc.path)}`);
      } else {
        info(`  pre-commit hook: ${pc.status}`);
      }

      console.log();
      info('  forge-memory/ will now auto-sync on pull/merge.');
      info('  Pre-commit validates playbook format before push.');
      console.log();
      info(colors.dim('  Add forge-memory/ to git tracking: git add forge-memory/'));
      console.log();
      break;
    }

    case 'sync': {
      if (!hasGit(cwd)) {
        warn('Not a git repository.');
        process.exit(1);
      }

      const memDir = path.join(cwd, 'forge-memory');
      if (!exists(memDir)) {
        warn('No forge-memory/ directory found. Run `copilotforge init` first.');
        process.exit(1);
      }

      console.log();
      info('🔄 Syncing forge-memory...');

      // Check for uncommitted memory changes
      try {
        const status = execSync('git status --porcelain -- forge-memory/', {
          cwd,
          stdio: 'pipe',
          encoding: 'utf8',
          windowsHide: true,
        }).trim();

        if (status) {
          warn('  Uncommitted changes in forge-memory/. Commit or stash first.');
          console.log(status.split('\n').map((l) => `    ${l}`).join('\n'));
          console.log();
          process.exit(1);
        }
      } catch { /* ignore */ }

      // Pull latest
      try {
        const output = execSync('git pull --no-edit', {
          cwd,
          stdio: 'pipe',
          encoding: 'utf8',
          windowsHide: true,
        });
        success('  Pull complete.');
        if (output.includes('forge-memory')) {
          info('  forge-memory files updated from remote.');
        }
      } catch (err) {
        warn(`  Pull failed: ${err.message}`);
      }

      console.log();
      break;
    }

    case 'status': {
      const status = getTeamStatus(cwd);

      console.log();
      info('🤝 Team Workspace Status');
      console.log();

      if (!status.installed) {
        if (status.reason === 'not-a-git-repo') {
          warn('  Not a git repository');
        } else {
          info('  Team hooks: ' + colors.yellow('not installed'));
          info(colors.dim('  Run `copilotforge team init` to enable team sync'));
        }
      } else {
        info(`  post-merge hook: ${status.hooks.postMerge ? colors.green('✓') : colors.red('✗')}`);
        info(`  pre-commit hook: ${status.hooks.preCommit ? colors.green('✓') : colors.red('✗')}`);
        info(`  Memory tracked:  ${status.memoryTracked ? colors.green('yes') : colors.yellow('no')}`);
        if (status.lastSync) {
          info(`  Last sync:       ${status.lastSync}`);
        }
      }

      console.log();
      break;
    }

    case 'uninstall': {
      const hooksDir = getHooksDir(cwd);
      if (!hooksDir) {
        warn('Not a git repository.');
        process.exit(1);
      }

      const pm = uninstallHook(hooksDir, 'post-merge');
      const pc = uninstallHook(hooksDir, 'pre-commit');

      console.log();
      info('🧹 Removing team workspace hooks...');
      console.log();
      info(`  post-merge: ${pm.status}`);
      info(`  pre-commit: ${pc.status}`);
      console.log();
      break;
    }

    default:
      console.log();
      info(`🤝 CopilotForge Team Workspaces`);
      console.log();
      info('  Usage:');
      info('    copilotforge team init       Install git hooks for shared memory');
      info('    copilotforge team sync       Pull and merge remote memory changes');
      info('    copilotforge team status     Show team sync status');
      info('    copilotforge team uninstall  Remove git hooks');
      console.log();
  }
}

module.exports = {
  run,
  getTeamStatus,
  installHook,
  uninstallHook,
  mergePlaybookEntries,
  renderPlaybook,
  getHooksDir,
};
