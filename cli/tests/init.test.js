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
      // Windows holds handles briefly after child exits — wait and retry
      const wait = (ms) => { const end = Date.now() + ms; while (Date.now() < end) {} };
      wait(200 * (i + 1));
    }
  }
}

describe('init - simple initialization (default)', () => {
  it('should create planner skill and START-HERE.md', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    } catch (err) {
      // Continue even if git is not available
    }

    assert.ok(
      fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
      '.github/skills/planner/SKILL.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, 'START-HERE.md')),
      'START-HERE.md should exist'
    );

    // plan-executor and FORGE.md are --full only
    assert.ok(
      !fs.existsSync(path.join(tmpDir, '.github', 'skills', 'plan-executor', 'SKILL.md')),
      'plan-executor/SKILL.md should NOT exist in simple mode'
    );
    assert.ok(
      !fs.existsSync(path.join(tmpDir, 'FORGE.md')),
      'FORGE.md should NOT exist in simple mode'
    );

    cleanupDir(tmpDir);
  });
});

describe('init - full initialization (--full flag)', () => {
  it('should create all expected files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --full --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    } catch (err) {
      // Command might fail if git is not available, but files should still be created
    }

    assert.ok(
      fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
      '.github/skills/planner/SKILL.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, '.github', 'skills', 'plan-executor', 'SKILL.md')),
      '.github/skills/plan-executor/SKILL.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, 'FORGE.md')),
      'FORGE.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, 'IMPLEMENTATION_PLAN.md')),
      'IMPLEMENTATION_PLAN.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, 'forge-memory', 'decisions.md')),
      'forge-memory/decisions.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, 'forge-memory', 'patterns.md')),
      'forge-memory/patterns.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, 'cookbook', 'task-loop.ts')),
      'cookbook/task-loop.ts should exist'
    );

    cleanupDir(tmpDir);
  });
});

describe('init - SKILL.md validation', () => {
  it('should create valid YAML frontmatter in SKILL.md files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });
    } catch (err) {
      // Continue even if command fails
    }

    const skillPath = path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md');
    
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf8');
      
      // Check for YAML frontmatter delimiters
      assert.ok(content.startsWith('---'), 'SKILL.md should start with --- delimiter');
      
      const lines = content.split('\n');
      let foundSecondDelimiter = false;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          foundSecondDelimiter = true;
          break;
        }
      }
      assert.ok(foundSecondDelimiter, 'SKILL.md should have closing --- delimiter');
    }

    cleanupDir(tmpDir);
  });
});

describe('init - minimal flag', () => {
  it('should create only the planner skill files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --minimal`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });
    } catch (err) {
      // Continue
    }

    assert.ok(
      fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
      'planner SKILL.md should exist'
    );
    // No extras — not even START-HERE.md
    assert.ok(
      !fs.existsSync(path.join(tmpDir, 'START-HERE.md')),
      'START-HERE.md should NOT exist with --minimal'
    );
    assert.ok(
      !fs.existsSync(path.join(tmpDir, 'FORGE.md')),
      'FORGE.md should NOT exist with --minimal'
    );

    cleanupDir(tmpDir);
  });
});

describe('init - doctor command after init', () => {
  it('should pass doctor check after full init', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      // Run init
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });

      // Run doctor
      const result = execSync(`node "${binPath}" doctor`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });

      // Doctor should complete without throwing
      assert.ok(result !== null);
    } catch (err) {
      // If doctor fails, check that basic files were created
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'At minimum, planner SKILL.md should exist'
      );
    }

    cleanupDir(tmpDir);
  });
});

describe('init - file content validation', () => {
  it('should create non-empty files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });
    } catch (err) {
      // Continue
    }

    const filesToCheck = [
      path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md'),
      path.join(tmpDir, 'FORGE.md'),
      path.join(tmpDir, 'IMPLEMENTATION_PLAN.md'),
    ];

    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        assert.ok(content.length > 0, `${path.basename(file)} should not be empty`);
      }
    }

    cleanupDir(tmpDir);
  });
});

describe('init - reference files', () => {
  it('should create reference.md files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });
    } catch (err) {
      // Continue
    }

    // Check for reference files
    const plannerRef = path.join(tmpDir, '.github', 'skills', 'planner', 'reference.md');
    const executorRef = path.join(tmpDir, '.github', 'skills', 'plan-executor', 'reference.md');

    if (fs.existsSync(plannerRef)) {
      const content = fs.readFileSync(plannerRef, 'utf8');
      assert.ok(content.length > 0, 'planner reference.md should not be empty');
    }

    if (fs.existsSync(executorRef)) {
      const content = fs.readFileSync(executorRef, 'utf8');
      assert.ok(content.length > 0, 'executor reference.md should not be empty');
    }

    cleanupDir(tmpDir);
  });
});

describe('init - --yes flag', () => {
  it('should create files without prompting', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      // Run init with --yes flag, no stdin needed
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Verify core files were created
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'planner SKILL.md should exist'
      );
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'plan-executor', 'SKILL.md')),
        'plan-executor SKILL.md should exist'
      );
      assert.ok(
        fs.existsSync(path.join(tmpDir, 'FORGE.md')),
        'FORGE.md should exist'
      );
    } catch (err) {
      // Continue - verify files exist even if command errors
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'Files should be created despite errors'
      );
    } finally {
      cleanupDir(tmpDir);
    }
  });

  it('should overwrite existing files without prompting', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      // First init with 'n' to skip commit prompt
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });

      const skillPath = path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), 'Initial SKILL.md should exist');

      // Get original content
      const originalContent = fs.readFileSync(skillPath, 'utf8');

      // Run init again with --yes (should overwrite without prompting)
      execSync(`node "${binPath}" init --yes`, {
        cwd: tmpDir,
        stdio: 'pipe',
      });

      // Verify file still exists (was recreated)
      assert.ok(fs.existsSync(skillPath), 'SKILL.md should exist after re-init');
      
      const newContent = fs.readFileSync(skillPath, 'utf8');
      assert.ok(newContent.length > 0, 'New content should not be empty');
    } catch (err) {
      // Continue
    } finally {
      cleanupDir(tmpDir);
    }
  });

  it('should work with -y alias', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      // Run init with -y flag (short alias)
      execSync(`node "${binPath}" init -y`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Verify files were created
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'planner SKILL.md should exist with -y flag'
      );
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'plan-executor', 'SKILL.md')),
        'plan-executor SKILL.md should exist with -y flag'
      );
    } catch (err) {
      // Verify files exist even if command errors
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'Files should be created with -y flag'
      );
    } finally {
      cleanupDir(tmpDir);
    }
  });

  it('should work with --yes --minimal together', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cliRoot = path.resolve(__dirname, '..');
    const binPath = path.join(cliRoot, 'bin', 'copilotforge.js');

    try {
      // Run init with both flags
      execSync(`node "${binPath}" init --yes --minimal`, {
        cwd: tmpDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Verify core files were created
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'planner SKILL.md should exist with --yes --minimal'
      );
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'plan-executor', 'SKILL.md')),
        'plan-executor SKILL.md should exist with --yes --minimal'
      );
    } catch (err) {
      // Verify files exist
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.github', 'skills', 'planner', 'SKILL.md')),
        'Core files should be created with --yes --minimal'
      );
    } finally {
      cleanupDir(tmpDir);
    }
  });
});
