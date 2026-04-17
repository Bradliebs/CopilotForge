'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const { isInitialized, getPendingTasks, getDoneFailed, resolveTaskLoopScript } = require('../src/run');

function cleanupDir(dir) {
  for (let i = 0; i < 5; i++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (e) {
      if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
      const wait = (ms) => { const end = Date.now() + ms; while (Date.now() < end) {} };
      wait(200 * (i + 1));
    }
  }
}

function makePlan(tasks) {
  return tasks
    .map(({ marker, id, title }) => `- [${marker}] ${id} — ${title}`)
    .join('\n') + '\n';
}

describe('run - isInitialized', () => {
  it('returns false when neither plan nor skills exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      assert.strictEqual(isInitialized(tmp), false);
    } finally {
      cleanupDir(tmp);
    }
  });

  it('returns false when plan exists but skills dir missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.writeFileSync(path.join(tmp, 'IMPLEMENTATION_PLAN.md'), '- [ ] task-a — Do something\n');
      assert.strictEqual(isInitialized(tmp), false);
    } finally {
      cleanupDir(tmp);
    }
  });

  it('returns false when skills dir exists but plan missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.mkdirSync(path.join(tmp, '.github', 'skills'), { recursive: true });
      assert.strictEqual(isInitialized(tmp), false);
    } finally {
      cleanupDir(tmp);
    }
  });

  it('returns true when both plan and skills dir exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.mkdirSync(path.join(tmp, '.github', 'skills'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'IMPLEMENTATION_PLAN.md'), '- [ ] task-a — Do something\n');
      assert.strictEqual(isInitialized(tmp), true);
    } finally {
      cleanupDir(tmp);
    }
  });
});

describe('run - getPendingTasks', () => {
  it('returns empty array when plan does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      assert.deepStrictEqual(getPendingTasks(tmp), []);
    } finally {
      cleanupDir(tmp);
    }
  });

  it('returns only pending [ ] tasks', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.writeFileSync(
        path.join(tmp, 'IMPLEMENTATION_PLAN.md'),
        makePlan([
          { marker: 'x', id: 'done-task', title: 'Already done' },
          { marker: ' ', id: 'pending-task', title: 'Needs doing' },
          { marker: '!', id: 'failed-task', title: 'Previously failed' },
        ])
      );
      const result = getPendingTasks(tmp);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'pending-task');
      assert.strictEqual(result[0].title, 'Needs doing');
    } finally {
      cleanupDir(tmp);
    }
  });

  it('returns multiple pending tasks in order', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.writeFileSync(
        path.join(tmp, 'IMPLEMENTATION_PLAN.md'),
        makePlan([
          { marker: ' ', id: 'alpha', title: 'First task' },
          { marker: ' ', id: 'beta', title: 'Second task' },
          { marker: 'x', id: 'gamma', title: 'Already done' },
        ])
      );
      const result = getPendingTasks(tmp);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, 'alpha');
      assert.strictEqual(result[1].id, 'beta');
    } finally {
      cleanupDir(tmp);
    }
  });

  it('handles em-dash separator', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.writeFileSync(
        path.join(tmp, 'IMPLEMENTATION_PLAN.md'),
        '- [ ] my-task — Task with em-dash\n'
      );
      const result = getPendingTasks(tmp);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'my-task');
    } finally {
      cleanupDir(tmp);
    }
  });
});

describe('run - getDoneFailed', () => {
  it('returns zeros for missing plan', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      assert.deepStrictEqual(getDoneFailed(tmp), { done: 0, failed: 0, total: 0 });
    } finally {
      cleanupDir(tmp);
    }
  });

  it('counts done, failed, and total correctly', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.writeFileSync(
        path.join(tmp, 'IMPLEMENTATION_PLAN.md'),
        makePlan([
          { marker: 'x', id: 'a', title: 'Done' },
          { marker: 'x', id: 'b', title: 'Done too' },
          { marker: '!', id: 'c', title: 'Failed' },
          { marker: ' ', id: 'd', title: 'Pending' },
        ])
      );
      const result = getDoneFailed(tmp);
      assert.strictEqual(result.done, 2);
      assert.strictEqual(result.failed, 1);
      assert.strictEqual(result.total, 4);
    } finally {
      cleanupDir(tmp);
    }
  });
});

describe('run - resolveTaskLoopScript', () => {
  it('returns null when script does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      assert.strictEqual(resolveTaskLoopScript(tmp), null);
    } finally {
      cleanupDir(tmp);
    }
  });

  it('returns local cookbook/task-loop.ts path when it exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    try {
      fs.mkdirSync(path.join(tmp, 'cookbook'), { recursive: true });
      const scriptPath = path.join(tmp, 'cookbook', 'task-loop.ts');
      fs.writeFileSync(scriptPath, '// placeholder');
      assert.strictEqual(resolveTaskLoopScript(tmp), scriptPath);
    } finally {
      cleanupDir(tmp);
    }
  });
});

describe('run - CLI --dry-run flag', () => {
  it('exits 0 and prints dry-run message when project is initialized with pending tasks', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');
    try {
      // Set up a minimal initialized project
      fs.mkdirSync(path.join(tmp, '.github', 'skills'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, 'IMPLEMENTATION_PLAN.md'),
        '- [ ] my-task — Do the thing\n'
      );
      // Create a dummy cookbook/task-loop.ts so resolveTaskLoopScript finds it
      fs.mkdirSync(path.join(tmp, 'cookbook'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'cookbook', 'task-loop.ts'), '// placeholder');

      const output = execSync(`node "${binPath}" run --dry-run`, {
        cwd: tmp,
        encoding: 'utf8',
        env: { ...process.env, NO_COLOR: '1' },
      });
      assert.ok(output.includes('dry-run'), 'output should mention dry-run');
    } finally {
      cleanupDir(tmp);
    }
  });

  it('exits 1 and prints init message when project is not initialized', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-run-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');
    try {
      let threw = false;
      try {
        execSync(`node "${binPath}" run --dry-run`, {
          cwd: tmp,
          encoding: 'utf8',
          env: { ...process.env, NO_COLOR: '1' },
        });
      } catch (err) {
        threw = true;
        assert.ok(
          err.stdout.includes('copilotforge init') || err.stderr.includes('copilotforge init'),
          'output should mention copilotforge init'
        );
      }
      assert.ok(threw, 'should have exited non-zero for uninitialized project');
    } finally {
      cleanupDir(tmp);
    }
  });
});
