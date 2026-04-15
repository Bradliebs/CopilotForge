#!/usr/bin/env node

'use strict';

/**
 * sync-files.js — Build script for CopilotForge CLI
 *
 * Copies the latest SKILL.md and reference.md from the project root
 * into cli/files/ so the npm package ships current versions.
 *
 * Run manually:   node scripts/sync-files.js
 * Run via npm:    npm run sync
 * Auto-runs:     on `npm publish` (prepublishOnly hook)
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const filesDir = path.join(__dirname, '..', 'files', '.github', 'skills', 'planner');

const filesToSync = [
  {
    src: path.join(projectRoot, '.github', 'skills', 'planner', 'SKILL.md'),
    dest: path.join(filesDir, 'SKILL.md'),
  },
  {
    src: path.join(projectRoot, '.github', 'skills', 'planner', 'reference.md'),
    dest: path.join(filesDir, 'reference.md'),
  },
];

console.log('Syncing skill files into cli/files/ ...');
console.log();

let synced = 0;

for (const { src, dest } of filesToSync) {
  if (!fs.existsSync(src)) {
    console.log(`  SKIP  ${path.relative(projectRoot, src)} (not found)`);
    continue;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);

  const size = fs.statSync(dest).size;
  console.log(`  SYNC  ${path.relative(projectRoot, src)} -> ${path.relative(projectRoot, dest)} (${size} bytes)`);
  synced++;
}

console.log();
console.log(`Done. ${synced} file(s) synced.`);
