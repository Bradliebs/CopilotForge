'use strict';

const path = require('path');
const fs = require('fs');
const {
  banner, success, warn, info, separator, ask,
  copyFile, writeFile, exists, hasGit, gitCommit, colors, filesDir
} = require('./utils');
const templates = require('./templates');

// Framework-owned files that upgrade CAN overwrite
const FRAMEWORK_FILES = [
  // Core skills (copied from cli/files/)
  { type: 'copy', src: path.join('.github', 'skills', 'planner', 'SKILL.md') },
  { type: 'copy', src: path.join('.github', 'skills', 'planner', 'reference.md') },
  { type: 'copy', src: path.join('.github', 'skills', 'plan-executor', 'SKILL.md') },
  { type: 'copy', src: path.join('.github', 'skills', 'plan-executor', 'reference.md') },
  // Template-based files
  { type: 'template', dest: path.join('.copilot', 'agents', 'planner.md'), content: templates.PLANNER_AGENT_MD },
  { type: 'template', dest: path.join('docs', 'GETTING-STARTED.md'), content: templates.GETTING_STARTED_MD },
];

// Cookbook files that are framework-owned (can upgrade with confirmation)
const COOKBOOK_TEMPLATES = [
  { dest: path.join('cookbook', 'hello-world.ts'), content: templates.HELLO_WORLD_TS },
  { dest: path.join('cookbook', 'hello-world.py'), content: templates.HELLO_WORLD_PY },
  { dest: path.join('cookbook', 'task-loop.ts'), content: templates.TASK_LOOP_TS },
  { dest: path.join('cookbook', 'task-loop.py'), content: templates.TASK_LOOP_PY },
  // platform guides
  { dest: path.join('cookbook', 'copilot-studio-guide.md'), content: templates.COPILOT_STUDIO_GUIDE_MD },
  { dest: path.join('cookbook', 'copilot-studio-agent.yaml'), content: templates.COPILOT_STUDIO_AGENT_YAML },
  { dest: path.join('cookbook', 'code-apps-guide.md'), content: templates.CODE_APPS_GUIDE_MD },
  { dest: path.join('cookbook', 'code-apps-setup.ts'), content: templates.CODE_APPS_SETUP_TS },
  { dest: path.join('cookbook', 'copilot-agents-guide.md'), content: templates.COPILOT_AGENTS_GUIDE_MD },
  { dest: path.join('cookbook', 'copilot-agents-example.agent.md'), content: templates.COPILOT_AGENTS_EXAMPLE_MD },
];

async function run(args) {
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const cwd = process.cwd();

  banner();
  console.log(`  ${colors.bold('⬆️  CopilotForge Upgrade')}`);
  if (dryRun) console.log(`  ${colors.dim('(dry run — no files will be changed)')}`);
  console.log();

  // Check if CopilotForge is initialized
  const plannerSkill = path.join(cwd, '.github', 'skills', 'planner', 'SKILL.md');
  if (!exists(plannerSkill)) {
    warn('CopilotForge not found in this project.');
    info(`Run ${colors.cyan('npx copilotforge init')} first.`);
    console.log();
    return;
  }

  let updated = 0;
  let skipped = 0;
  let current = 0;
  const updatedFiles = [];

  // --- Core framework files ---
  info(colors.bold('Core files:'));
  console.log();

  for (const entry of FRAMEWORK_FILES) {
    const rel = entry.type === 'copy' ? entry.src : entry.dest;
    const destPath = path.join(cwd, rel);

    if (!exists(destPath)) {
      // File doesn't exist yet — create it
      if (!dryRun) {
        if (entry.type === 'copy') {
          copyFile(entry.src, destPath);
        } else {
          writeFile(destPath, entry.content);
        }
      }
      success(`${dryRun ? '[dry-run] Would create' : 'Created'} ${rel}`);
      updated++;
      updatedFiles.push(rel);
      continue;
    }

    // Compare content
    const currentContent = fs.readFileSync(destPath, 'utf8');
    let newContent;
    if (entry.type === 'copy') {
      const srcPath = path.join(filesDir(), entry.src);
      newContent = fs.readFileSync(srcPath, 'utf8');
    } else {
      newContent = entry.content;
    }

    if (currentContent === newContent) {
      info(`  ${colors.dim('✓')} ${rel} ${colors.dim('(current)')}`);
      current++;
    } else {
      if (!dryRun) {
        if (entry.type === 'copy') {
          copyFile(entry.src, destPath);
        } else {
          writeFile(destPath, entry.content);
        }
      }
      success(`${dryRun ? '[dry-run] Would update' : 'Updated'} ${rel}`);
      updated++;
      updatedFiles.push(rel);
    }
  }

  // --- Cookbook files (with confirmation) ---
  console.log();
  info(colors.bold('Cookbook recipes:'));
  console.log();

  const cookbookNeedsUpdate = [];
  for (const entry of COOKBOOK_TEMPLATES) {
    const destPath = path.join(cwd, entry.dest);

    if (!exists(destPath)) {
      cookbookNeedsUpdate.push(entry);
      continue;
    }

    const currentContent = fs.readFileSync(destPath, 'utf8');
    if (currentContent === entry.content) {
      info(`  ${colors.dim('✓')} ${entry.dest} ${colors.dim('(current)')}`);
      current++;
    } else {
      cookbookNeedsUpdate.push(entry);
    }
  }

  if (cookbookNeedsUpdate.length === 0) {
    info(`  ${colors.dim('All cookbook recipes are current.')}`);
  } else {
    if (!force && !dryRun) {
      console.log();
      info(`  ${cookbookNeedsUpdate.length} cookbook file(s) can be updated:`);
      for (const entry of cookbookNeedsUpdate) {
        info(`    ${colors.yellow('→')} ${entry.dest}`);
      }
      console.log();
      const proceed = await ask('Update cookbook recipes?', false);
      if (!proceed) {
        for (const entry of cookbookNeedsUpdate) {
          info(`  ${colors.dim('⊘')} ${entry.dest} ${colors.dim('(skipped)')}`);
          skipped++;
        }
      } else {
        for (const entry of cookbookNeedsUpdate) {
          const destPath = path.join(cwd, entry.dest);
          writeFile(destPath, entry.content);
          success(`Updated ${entry.dest}`);
          updated++;
          updatedFiles.push(entry.dest);
        }
      }
    } else {
      for (const entry of cookbookNeedsUpdate) {
        const destPath = path.join(cwd, entry.dest);
        const action = exists(destPath) ? 'update' : 'create';
        if (!dryRun) {
          writeFile(destPath, entry.content);
        }
        success(`${dryRun ? `[dry-run] Would ${action}` : action === 'create' ? 'Created' : 'Updated'} ${entry.dest}`);
        updated++;
        updatedFiles.push(entry.dest);
      }
    }
  }

  // --- Summary ---
  separator();

  if (updated === 0 && skipped === 0) {
    info(`${colors.green('✨ Everything is up to date!')}`);
  } else {
    info(`${colors.bold('Summary:')}`);
    if (updated > 0) info(`  ${colors.green(`${updated} file(s) ${dryRun ? 'would be ' : ''}updated`)}`);
    if (current > 0) info(`  ${colors.dim(`${current} file(s) already current`)}`);
    if (skipped > 0) info(`  ${colors.yellow(`${skipped} file(s) skipped`)}`);
  }

  // Offer to commit
  if (!dryRun && updatedFiles.length > 0 && hasGit()) {
    console.log();
    const commit = await ask('Commit upgraded files?', false);
    if (commit) {
      try {
        gitCommit(updatedFiles, 'chore: upgrade CopilotForge framework files');
        console.log();
        success('Committed to git.');
      } catch (err) {
        console.log();
        warn(`Git commit failed: ${err.message}`);
      }
    }
  }

  separator();
}

module.exports = { run };
