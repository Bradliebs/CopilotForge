'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Copilot Workspace Integration — Phase 20
 *
 * Bridges CopilotForge with GitHub Copilot Workspace for task-to-PR automation.
 * Generates workspace-compatible task descriptions from IMPLEMENTATION_PLAN.md
 * and converts workspace outputs back into plan progress updates.
 *
 * Usage:
 *   copilotforge workspace export         Export tasks for Copilot Workspace
 *   copilotforge workspace import <file>  Import workspace results
 *   copilotforge workspace status         Show workspace integration status
 */

// ── Task extraction ─────────────────────────────────────────────────────

function extractTasks(cwd) {
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (!exists(planPath)) return [];

  const content = fs.readFileSync(planPath, 'utf8');
  const tasks = [];

  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^- \[( |x|!)\] (.+?)(?:\s*—\s*(.+))?$/);
    if (!match) continue;

    const status = match[1] === 'x' ? 'done' : match[1] === '!' ? 'failed' : 'pending';
    const titleParts = match[2].split(' — ');
    const id = titleParts[0].trim();
    const description = titleParts.length > 1 ? titleParts.slice(1).join(' — ').trim() : match[3] || '';

    tasks.push({ id, status, description: description.slice(0, 200) });
  }

  return tasks;
}

/**
 * Export pending tasks in Copilot Workspace-compatible format.
 */
function exportForWorkspace(cwd) {
  const tasks = extractTasks(cwd);
  const pending = tasks.filter((t) => t.status === 'pending');

  // Build workspace task descriptions
  const workspaceTasks = pending.map((task) => ({
    title: task.id,
    description: task.description,
    acceptance_criteria: [
      `Implement the ${task.id} feature as described`,
      'All existing tests must continue to pass',
      'Add tests for the new functionality',
    ],
  }));

  // Add project context
  let projectContext = '';
  const forgePath = path.join(cwd, 'FORGE.md');
  if (exists(forgePath)) {
    const forgeContent = fs.readFileSync(forgePath, 'utf8');
    const summaryMatch = forgeContent.match(/## Project Summary\n([\s\S]*?)(?=\n##|$)/);
    if (summaryMatch) projectContext = summaryMatch[1].trim();
  }

  return {
    project: projectContext || path.basename(cwd),
    totalTasks: tasks.length,
    pendingTasks: pending.length,
    completedTasks: tasks.filter((t) => t.status === 'done').length,
    tasks: workspaceTasks,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import workspace results and update IMPLEMENTATION_PLAN.md.
 */
function importResults(resultFile, cwd) {
  if (!exists(resultFile)) {
    return { success: false, error: `File not found: ${resultFile}` };
  }

  let results;
  try {
    results = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  } catch {
    return { success: false, error: 'Invalid JSON in results file' };
  }

  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (!exists(planPath)) {
    return { success: false, error: 'No IMPLEMENTATION_PLAN.md found' };
  }

  let content = fs.readFileSync(planPath, 'utf8');
  let updated = 0;

  for (const result of results.tasks || []) {
    if (result.status === 'completed') {
      const pattern = new RegExp(`- \\[ \\] ${result.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      if (pattern.test(content)) {
        content = content.replace(pattern, `- [x] ${result.title}`);
        updated++;
      }
    }
  }

  if (updated > 0) {
    fs.writeFileSync(planPath, content, 'utf8');
  }

  return { success: true, updated, total: (results.tasks || []).length };
}

/**
 * Get workspace integration status.
 */
function getWorkspaceStatus(cwd) {
  const tasks = extractTasks(cwd);
  const pending = tasks.filter((t) => t.status === 'pending');
  const done = tasks.filter((t) => t.status === 'done');
  const failed = tasks.filter((t) => t.status === 'failed');

  return {
    totalTasks: tasks.length,
    pending: pending.length,
    completed: done.length,
    failed: failed.length,
    progress: tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0,
    nextTask: pending[0] || null,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const sub = args[0] || 'status';

  switch (sub) {
    case 'export': {
      const data = exportForWorkspace(cwd);
      const outputPath = path.join(cwd, '.copilotforge', 'workspace-tasks.json');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

      console.log();
      info('📋 Exported for Copilot Workspace');
      console.log();
      info(`  Pending tasks: ${colors.bold(String(data.pendingTasks))}`);
      info(`  Output: ${colors.dim(outputPath)}`);
      console.log();
      break;
    }

    case 'import': {
      const resultFile = args[1];
      if (!resultFile) {
        warn('Usage: copilotforge workspace import <results.json>');
        process.exit(1);
      }

      const result = importResults(path.resolve(cwd, resultFile), cwd);
      console.log();
      if (result.success) {
        success(`  ✅ Updated ${result.updated}/${result.total} tasks in IMPLEMENTATION_PLAN.md`);
      } else {
        warn(`  ${result.error}`);
      }
      console.log();
      break;
    }

    case 'status': {
      const status = getWorkspaceStatus(cwd);
      console.log();
      info('📋 Workspace Integration Status');
      console.log();

      if (status.totalTasks === 0) {
        info('  No IMPLEMENTATION_PLAN.md found or no tasks detected.');
        info(colors.dim('  Run `copilotforge plan "your project"` to generate one.'));
      } else {
        const { progressBar } = require('./ui');
        info(`  ${progressBar(status.completed, status.totalTasks)}`);
        info(`  Completed: ${status.completed}  Pending: ${status.pending}  Failed: ${status.failed}`);
        if (status.nextTask) {
          console.log();
          info(`  Next task: ${colors.cyan(status.nextTask.id)}`);
          if (status.nextTask.description) info(`    ${colors.dim(status.nextTask.description.slice(0, 80))}`);
        }
      }
      console.log();
      break;
    }

    default:
      console.log();
      info('📋 CopilotForge Workspace Integration');
      console.log();
      info('  Usage:');
      info('    copilotforge workspace export       Export pending tasks');
      info('    copilotforge workspace import <file> Import completed tasks');
      info('    copilotforge workspace status        Show task progress');
      console.log();
  }
}

module.exports = {
  run,
  extractTasks,
  exportForWorkspace,
  importResults,
  getWorkspaceStatus,
};
