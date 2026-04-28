'use strict';

const path = require('path');
const { banner, fail, info, separator, removeFile, removeEmptyDirs, colors } = require('./utils');

// Only files that CopilotForge installed — never user-generated content
const INSTALLED_FILES = [
  path.join('.github', 'skills', 'planner', 'SKILL.md'),
  path.join('.github', 'skills', 'planner', 'reference.md'),
  path.join('.github', 'skills', 'oracle-prime', 'SKILL.md'),
  path.join('.github', 'instructions', 'oracle-prime.instructions.md'),
];

function run() {
  const cwd = process.cwd();
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dryRun');

  // --dry-run: print what would be deleted and exit without deleting
  if (dryRun) {
    for (const rel of INSTALLED_FILES) {
      console.log(`[DRY RUN] Would delete: ${rel}`);
    }
    console.log('[DRY RUN] No files were deleted.');
    return;
  }

  banner();
  console.log(`  ${colors.bold('\uD83E\uDDF9 Removing CopilotForge files...')}`);
  console.log();

  let removed = 0;

  for (const rel of INSTALLED_FILES) {
    const abs = path.join(cwd, rel);
    if (removeFile(abs)) {
      fail(`Removed ${rel}`);
      removed++;
    }
  }

  if (removed === 0) {
    info('No CopilotForge files found to remove.');
  }

  // Clean up empty directories left behind
  removeEmptyDirs(path.join(cwd, '.github', 'skills', 'planner'));
  removeEmptyDirs(path.join(cwd, '.github', 'skills', 'oracle-prime'));
  removeEmptyDirs(path.join(cwd, '.github', 'instructions'));
  removeEmptyDirs(path.join(cwd, '.github', 'skills'));

  console.log();
  info(`Kept: .copilot/, forge-memory/, cookbook/ (user-generated content)`);

  separator();

  if (removed > 0) {
    info('CopilotForge has been removed. Your generated files are still here.');
  }

  console.log();
}

module.exports = { run };
