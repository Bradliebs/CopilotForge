#!/usr/bin/env node

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CLI_PATH = path.join(__dirname, '..', 'cli', 'bin', 'copilotforge.js');

/**
 * E2E Validation Test Suite for CopilotForge
 * Tests the full pipeline: init (full/minimal), doctor, status
 */

describe('CopilotForge E2E Validation', () => {
  let fullScaffoldDir;
  let minimalScaffoldDir;

  // Helper: Create temp directory
  function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
  }

  // Helper: Run CLI command in directory
  function runCLI(command, cwd, skipGitPrompt = false) {
    const cmd = `node "${CLI_PATH}" ${command}`;
    const options = {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8'
    };

    if (skipGitPrompt) {
      options.input = 'n\n'; // Answer "no" to git commit prompt
    }

    try {
      const output = execSync(cmd, options);
      return { success: true, output: output.toString(), exitCode: 0 };
    } catch (error) {
      return {
        success: false,
        output: error.stdout?.toString() || '',
        error: error.stderr?.toString() || error.message,
        exitCode: error.status || 1
      };
    }
  }

  // Helper: Check if file exists
  function fileExists(dir, filePath) {
    return fs.existsSync(path.join(dir, filePath));
  }

  // Helper: Read file content
  function readFile(dir, filePath) {
    return fs.readFileSync(path.join(dir, filePath), 'utf8');
  }

  // Helper: Cleanup temp directory
  function cleanup(dir) {
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  describe('Init Command - Full Scaffold', () => {
    it('should create temp directory and run init', () => {
      fullScaffoldDir = createTempDir();
      assert.ok(fs.existsSync(fullScaffoldDir), 'Temp directory should exist');

      const result = runCLI('init', fullScaffoldDir, true);
      assert.ok(result.success || result.exitCode === 0, `Init should succeed: ${result.error || result.output}`);
    });

    it('should create all expected skill files', () => {
      const expectedFiles = [
        '.github/skills/planner/SKILL.md',
        '.github/skills/planner/reference.md',
        '.github/skills/plan-executor/SKILL.md',
        '.github/skills/plan-executor/reference.md'
      ];

      for (const file of expectedFiles) {
        assert.ok(fileExists(fullScaffoldDir, file), `${file} should exist`);
      }
    });

    it('should create root documentation files', () => {
      const expectedFiles = [
        'FORGE.md',
        'IMPLEMENTATION_PLAN.md'
      ];

      for (const file of expectedFiles) {
        assert.ok(fileExists(fullScaffoldDir, file), `${file} should exist`);
      }
    });

    it('should create forge-memory files', () => {
      const expectedFiles = [
        'forge-memory/decisions.md',
        'forge-memory/patterns.md',
        'forge-memory/preferences.md'
      ];

      for (const file of expectedFiles) {
        assert.ok(fileExists(fullScaffoldDir, file), `${file} should exist`);
      }
    });

    it('should create planner agent file', () => {
      assert.ok(fileExists(fullScaffoldDir, '.copilot/agents/planner.md'), '.copilot/agents/planner.md should exist');
    });

    it('should create cookbook files', () => {
      const expectedFiles = [
        'cookbook/hello-world.ts',
        'cookbook/hello-world.py',
        'cookbook/task-loop.ts',
        'cookbook/task-loop.py',
        'cookbook/copilot-studio-guide.md',
        'cookbook/copilot-studio-agent.yaml',
        'cookbook/code-apps-guide.md',
        'cookbook/code-apps-setup.ts',
        'cookbook/copilot-agents-guide.md',
        'cookbook/copilot-agents-example.agent.md'
      ];

      for (const file of expectedFiles) {
        assert.ok(fileExists(fullScaffoldDir, file), `${file} should exist`);
      }
    });

    it('should create getting started documentation', () => {
      assert.ok(fileExists(fullScaffoldDir, 'docs/GETTING-STARTED.md'), 'docs/GETTING-STARTED.md should exist');
    });
  });

  describe('SKILL.md Frontmatter Validation', () => {
    it('should validate planner SKILL.md frontmatter', () => {
      const content = readFile(fullScaffoldDir, '.github/skills/planner/SKILL.md');

      // Check frontmatter structure
      assert.ok(content.startsWith('---'), 'SKILL.md should start with ---');

      const lines = content.split('\n');
      let foundSecondDash = false;
      let frontmatterEndIndex = -1;

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          foundSecondDash = true;
          frontmatterEndIndex = i;
          break;
        }
      }

      assert.ok(foundSecondDash, 'SKILL.md should have closing --- for frontmatter');

      const frontmatter = lines.slice(0, frontmatterEndIndex + 1).join('\n');

      // Check required fields
      assert.ok(frontmatter.includes('name:'), 'Frontmatter should contain name:');
      assert.ok(frontmatter.includes('description:'), 'Frontmatter should contain description:');
      assert.ok(frontmatter.includes('triggers:'), 'Frontmatter should contain triggers:');
    });

    it('should validate plan-executor SKILL.md frontmatter', () => {
      const content = readFile(fullScaffoldDir, '.github/skills/plan-executor/SKILL.md');

      // Check frontmatter structure
      assert.ok(content.startsWith('---'), 'plan-executor SKILL.md should start with ---');

      const lines = content.split('\n');
      let foundSecondDash = false;
      let frontmatterEndIndex = -1;

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          foundSecondDash = true;
          frontmatterEndIndex = i;
          break;
        }
      }

      assert.ok(foundSecondDash, 'plan-executor SKILL.md should have closing --- for frontmatter');

      const frontmatter = lines.slice(0, frontmatterEndIndex + 1).join('\n');

      // Check required fields
      assert.ok(frontmatter.includes('name:'), 'Frontmatter should contain name:');
      assert.ok(frontmatter.includes('description:'), 'Frontmatter should contain description:');
      assert.ok(frontmatter.includes('triggers:'), 'Frontmatter should contain triggers:');
    });
  });

  describe('IMPLEMENTATION_PLAN.md Format Validation', () => {
    it('should contain task items in correct format', () => {
      const content = readFile(fullScaffoldDir, 'IMPLEMENTATION_PLAN.md');

      // Check for at least one task line with checkbox
      assert.ok(content.includes('- [ ]'), 'Should contain at least one unchecked task');

      // Validate task format: - [ ] kebab-id — description
      const taskLinePattern = /-\s*\[\s*\]\s+[a-z0-9-]+\s+—\s+.+/;
      const lines = content.split('\n');
      const hasValidTaskLine = lines.some(line => taskLinePattern.test(line));

      assert.ok(hasValidTaskLine, 'Should contain at least one task line in format: - [ ] kebab-id — description');
    });
  });

  describe('Init Command - Minimal Scaffold', () => {
    it('should create temp directory and run init --minimal', () => {
      minimalScaffoldDir = createTempDir();
      assert.ok(fs.existsSync(minimalScaffoldDir), 'Temp directory should exist');

      const result = runCLI('init --minimal', minimalScaffoldDir, true);
      assert.ok(result.success || result.exitCode === 0, `Init --minimal should succeed: ${result.error || result.output}`);
    });

    it('should create only core skill files', () => {
      const expectedFiles = [
        '.github/skills/planner/SKILL.md',
        '.github/skills/planner/reference.md',
        '.github/skills/plan-executor/SKILL.md',
        '.github/skills/plan-executor/reference.md'
      ];

      for (const file of expectedFiles) {
        assert.ok(fileExists(minimalScaffoldDir, file), `${file} should exist in minimal mode`);
      }
    });

    it('should NOT create FORGE.md in minimal mode', () => {
      assert.ok(!fileExists(minimalScaffoldDir, 'FORGE.md'), 'FORGE.md should NOT exist in minimal mode');
    });

    it('should NOT create cookbook directory in minimal mode', () => {
      assert.ok(!fileExists(minimalScaffoldDir, 'cookbook'), 'cookbook directory should NOT exist in minimal mode');
    });

    it('should NOT create forge-memory directory in minimal mode', () => {
      assert.ok(!fileExists(minimalScaffoldDir, 'forge-memory'), 'forge-memory directory should NOT exist in minimal mode');
    });

    it('should NOT create .copilot/agents directory in minimal mode', () => {
      assert.ok(!fileExists(minimalScaffoldDir, '.copilot'), '.copilot directory should NOT exist in minimal mode');
    });
  });

  describe('Doctor Command', () => {
    it('should run doctor in full scaffold directory and report healthy', () => {
      const result = runCLI('doctor', fullScaffoldDir);

      assert.strictEqual(result.exitCode, 0, 'Doctor should exit with code 0 (healthy)');
      assert.ok(result.output || result.success, 'Doctor should produce output');
    });
  });

  describe('Status Command', () => {
    it('should run status in full scaffold directory and produce output', () => {
      const result = runCLI('status', fullScaffoldDir);

      assert.ok(result.output && result.output.trim().length > 0, 'Status should produce non-empty output');
    });
  });

  // Cleanup after all tests
  describe('Cleanup', () => {
    it('should remove all temp directories', () => {
      cleanup(fullScaffoldDir);
      cleanup(minimalScaffoldDir);

      if (fullScaffoldDir) {
        assert.ok(!fs.existsSync(fullScaffoldDir), 'Full scaffold temp directory should be cleaned up');
      }
      if (minimalScaffoldDir) {
        assert.ok(!fs.existsSync(minimalScaffoldDir), 'Minimal scaffold temp directory should be cleaned up');
      }
    });
  });
});
