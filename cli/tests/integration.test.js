'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

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

describe('integration - init then doctor pipeline', () => {
  it('should pass doctor --json after init --full --yes', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-integ-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      // Step 1: Run init --full --yes
      execSync(`node "${binPath}" init --full --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Verify core files exist
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'planner SKILL.md should exist after init'
      );
      assert.ok(
        fs.existsSync(path.join(tmpDir, 'FORGE.md')),
        'FORGE.md should exist after init --full'
      );
      assert.ok(
        fs.existsSync(path.join(tmpDir, 'forge-memory', 'decisions.md')),
        'forge-memory/decisions.md should exist after init --full'
      );

      // Step 2: Run doctor --json and validate output
      const doctorOutput = execSync(`node "${binPath}" doctor --json`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });

      const result = JSON.parse(doctorOutput);

      assert.ok(result.healthy !== undefined, 'doctor output should have healthy field');
      assert.ok(Array.isArray(result.checks), 'doctor output should have checks array');
      assert.ok(result.summary, 'doctor output should have summary');
      assert.strictEqual(result.summary.failed, 0, 'doctor should report zero failures after fresh init');

    } catch (err) {
      // If doctor exits with non-zero, the output is still useful
      if (err.stdout) {
        try {
          const result = JSON.parse(err.stdout);
          // Allow warnings but not failures
          assert.strictEqual(result.summary.failed, 0,
            `doctor reported ${result.summary.failed} failure(s): ${JSON.stringify(result.checks.filter(c => c.status === 'fail'))}`);
        } catch {
          // JSON parse failed — rethrow original
          throw err;
        }
      } else {
        throw err;
      }
    }

    cleanupDir(tmpDir);
  });

  it('should create non-empty decisions.md with initial entry', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-integ-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --full --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    } catch {
      // Continue even if git commit fails
    }

    const decisionsPath = path.join(tmpDir, 'forge-memory', 'decisions.md');
    assert.ok(fs.existsSync(decisionsPath), 'decisions.md should exist');

    const content = fs.readFileSync(decisionsPath, 'utf8');
    assert.ok(content.includes('CopilotForge initialized'),
      'decisions.md should contain initial scaffold decision');
    assert.ok(!content.includes('| | | |'),
      'decisions.md should not have empty placeholder rows');

    cleanupDir(tmpDir);
  });

  it('should write usage tracking after init', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-integ-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    } catch {
      // Continue
    }

    const usageFile = path.join(os.homedir(), '.copilotforge', 'usage.json');
    assert.ok(fs.existsSync(usageFile), 'usage.json should exist in ~/.copilotforge/');

    const usage = JSON.parse(fs.readFileSync(usageFile, 'utf8'));
    assert.ok(Array.isArray(usage), 'usage.json should be an array');
    assert.ok(usage.length > 0, 'usage.json should have at least one entry');

    const latest = usage[usage.length - 1];
    assert.ok(latest.timestamp, 'usage entry should have timestamp');
    assert.ok(latest.mode, 'usage entry should have mode');
    assert.ok(latest.path, 'usage entry should have path');

    cleanupDir(tmpDir);
  });
});
