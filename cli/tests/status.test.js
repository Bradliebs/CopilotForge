'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  getPlanData,
  getMemoryData,
  getSkillsData,
  getAgentsData,
  getCookbookData,
  getGitData,
  getGreeting,
} = require('../src/status');

describe('status - getPlanData', () => {
  it('should return defaults when no plan exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const data = getPlanData(tmpDir);

    assert.strictEqual(data.done, 0);
    assert.strictEqual(data.failed, 0);
    assert.strictEqual(data.pending, 0);
    assert.strictEqual(data.total, 0);
    assert.strictEqual(data.nextTask, null);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should count tasks correctly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const planPath = path.join(tmpDir, 'IMPLEMENTATION_PLAN.md');

    const content = `# Implementation Plan

- [x] task1 — First task
- [ ] task2 — Second task
- [!] task3 — Failed task
- [x] task4 — Another done
- [ ] task5 — Another pending
`;

    fs.writeFileSync(planPath, content);
    const data = getPlanData(tmpDir);

    assert.strictEqual(data.done, 2);
    assert.strictEqual(data.failed, 1);
    assert.strictEqual(data.pending, 2);
    assert.strictEqual(data.total, 5);
    assert.ok(data.nextTask);
    assert.strictEqual(data.nextTask.id, 'task2');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should capture first pending task as next', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const planPath = path.join(tmpDir, 'IMPLEMENTATION_PLAN.md');

    const content = `# Plan
- [x] done1 — Completed
- [ ] next1 — This is next
- [ ] next2 — This comes after
`;

    fs.writeFileSync(planPath, content);
    const data = getPlanData(tmpDir);

    assert.strictEqual(data.nextTask.id, 'next1');
    assert.strictEqual(data.nextTask.title, 'This is next');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('status - getMemoryData', () => {
  it('should return zeros when no memory dir exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const data = getMemoryData(tmpDir);

    assert.strictEqual(data.decisions, 0);
    assert.strictEqual(data.patterns, 0);
    assert.strictEqual(data.preferences, 0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should count headings in memory files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const memDir = path.join(tmpDir, 'forge-memory');
    fs.mkdirSync(memDir, { recursive: true });

    const decisionsContent = `# Decisions
## Decision 1
Content here
## Decision 2
More content
### Sub-heading (not counted)
## Decision 3
`;

    const patternsContent = `# Patterns
## Pattern 1
Content
`;

    const preferencesContent = `# Preferences
## Pref 1
## Pref 2
`;

    fs.writeFileSync(path.join(memDir, 'decisions.md'), decisionsContent);
    fs.writeFileSync(path.join(memDir, 'patterns.md'), patternsContent);
    fs.writeFileSync(path.join(memDir, 'preferences.md'), preferencesContent);

    const data = getMemoryData(tmpDir);

    assert.strictEqual(data.decisions, 3);
    assert.strictEqual(data.patterns, 1);
    assert.strictEqual(data.preferences, 2);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('status - getSkillsData', () => {
  it('should return empty array when no skills dir exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const data = getSkillsData(tmpDir);

    assert.deepStrictEqual(data.names, []);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should find skill directories with SKILL.md', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const skillsDir = path.join(tmpDir, '.github', 'skills');

    // Create planner skill
    fs.mkdirSync(path.join(skillsDir, 'planner'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'planner', 'SKILL.md'), '# Skill');

    // Create executor skill
    fs.mkdirSync(path.join(skillsDir, 'plan-executor'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'plan-executor', 'SKILL.md'), '# Skill');

    // Create directory without SKILL.md (should not count)
    fs.mkdirSync(path.join(skillsDir, 'incomplete'), { recursive: true });

    const data = getSkillsData(tmpDir);

    assert.strictEqual(data.names.length, 2);
    assert.ok(data.names.includes('planner'));
    assert.ok(data.names.includes('plan-executor'));
    assert.ok(!data.names.includes('incomplete'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('status - getAgentsData', () => {
  it('should return empty array when no agents dir exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const data = getAgentsData(tmpDir);

    assert.deepStrictEqual(data.names, []);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should find agent .md files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const agentsDir = path.join(tmpDir, '.copilot', 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });

    fs.writeFileSync(path.join(agentsDir, 'planner.md'), '# Agent');
    fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Agent');
    fs.writeFileSync(path.join(agentsDir, 'not-an-agent.txt'), 'Text');

    const data = getAgentsData(tmpDir);

    assert.strictEqual(data.names.length, 2);
    assert.ok(data.names.includes('planner'));
    assert.ok(data.names.includes('reviewer'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('status - getCookbookData', () => {
  it('should return 0 when no cookbook dir exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const data = getCookbookData(tmpDir);

    assert.strictEqual(data.count, 0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should count files in cookbook', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const cookbookDir = path.join(tmpDir, 'cookbook');
    fs.mkdirSync(cookbookDir, { recursive: true });

    fs.writeFileSync(path.join(cookbookDir, 'recipe1.ts'), 'code');
    fs.writeFileSync(path.join(cookbookDir, 'recipe2.py'), 'code');
    fs.writeFileSync(path.join(cookbookDir, 'recipe3.md'), 'docs');

    // Create a subdirectory (should not count)
    fs.mkdirSync(path.join(cookbookDir, 'subdir'), { recursive: true });

    const data = getCookbookData(tmpDir);

    assert.strictEqual(data.count, 3);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('status - getGitData', () => {
  it('should return data in a git repo', () => {
    // Run in the actual repo root
    const repoRoot = path.resolve(__dirname, '..', '..');
    const data = getGitData(repoRoot);

    // In a real git repo, branch should not be 'unknown'
    assert.notStrictEqual(data.branch, 'unknown');
    assert.strictEqual(typeof data.commitsToday, 'number');
    assert.strictEqual(typeof data.lastCommit, 'string');
  });

  it('should handle non-git directory gracefully', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const data = getGitData(tmpDir);

    assert.strictEqual(data.branch, 'unknown');
    assert.strictEqual(data.commitsToday, 0);
    assert.strictEqual(data.lastCommit, '');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('status - getGreeting', () => {
  it('should return a non-empty string', () => {
    const greeting = getGreeting();
    assert.strictEqual(typeof greeting, 'string');
    assert.ok(greeting.length > 0);
  });

  it('should include time-of-day greeting', () => {
    const greeting = getGreeting();
    const hasGreeting = 
      greeting.includes('Good morning') ||
      greeting.includes('Good afternoon') ||
      greeting.includes('Good evening') ||
      greeting.includes('Hello');
    assert.ok(hasGreeting);
  });
});
