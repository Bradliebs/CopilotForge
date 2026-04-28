'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Plan Generator
// ─────────────────────────────────────────────────────────────────────────────

describe('plan-generator - feature extraction', () => {
  const { extractFeatures, detectStack, generatePlan, STACK_TASKS } = require('../src/plan-generator');

  it('exports all required functions', () => {
    assert.ok(typeof extractFeatures === 'function');
    assert.ok(typeof detectStack === 'function');
    assert.ok(typeof generatePlan === 'function');
    assert.ok(typeof STACK_TASKS === 'object');
  });

  it('extracts auth features from description', () => {
    const features = extractFeatures('A task management app with user authentication and JWT');
    const ids = features.map((f) => f.id);
    assert.ok(ids.includes('add-auth'), 'should detect auth feature');
  });

  it('extracts API features', () => {
    const features = extractFeatures('Build a REST API for inventory management');
    const ids = features.map((f) => f.id);
    assert.ok(ids.includes('add-api'), 'should detect API feature');
  });

  it('extracts real-time features', () => {
    const features = extractFeatures('A chat app with real-time WebSocket messaging');
    const ids = features.map((f) => f.id);
    assert.ok(ids.includes('add-realtime'), 'should detect real-time feature');
  });

  it('extracts dashboard features', () => {
    const features = extractFeatures('Analytics dashboard with metrics visualization');
    const ids = features.map((f) => f.id);
    assert.ok(ids.includes('add-dashboard'), 'should detect dashboard feature');
  });

  it('extracts payment features', () => {
    const features = extractFeatures('E-commerce with Stripe checkout and subscriptions');
    const ids = features.map((f) => f.id);
    assert.ok(ids.includes('add-payments'), 'should detect payment feature');
  });

  it('returns generic feature for vague description', () => {
    const features = extractFeatures('A simple tool');
    assert.ok(features.length >= 1, 'should return at least one feature');
    assert.ok(features.some((f) => f.id === 'add-core-feature'), 'should have generic feature');
  });

  it('handles empty description', () => {
    const features = extractFeatures('');
    assert.ok(features.length >= 1);
  });
});

describe('plan-generator - stack detection', () => {
  const { detectStack } = require('../src/plan-generator');

  it('detects TypeScript', () => {
    assert.ok(detectStack('TypeScript, Express').includes('typescript'));
  });

  it('detects Express', () => {
    assert.ok(detectStack('Node.js with Express').includes('express'));
  });

  it('detects Next.js', () => {
    assert.ok(detectStack('Next.js 14 with App Router').includes('nextjs'));
  });

  it('detects Python + FastAPI', () => {
    const stack = detectStack('Python FastAPI');
    assert.ok(stack.includes('python'));
    assert.ok(stack.includes('fastapi'));
  });

  it('detects PostgreSQL', () => {
    assert.ok(detectStack('Express, PostgreSQL, Prisma').includes('postgresql'));
  });

  it('returns empty for unknown stack', () => {
    assert.strictEqual(detectStack('Haskell with servant').length, 0);
  });
});

describe('plan-generator - plan generation', () => {
  const { generatePlan } = require('../src/plan-generator');

  it('generates a plan with setup tasks', () => {
    const plan = generatePlan({ project: 'A blog', stack: 'TypeScript' });
    assert.ok(plan.includes('init-project'), 'should have init-project task');
    assert.ok(plan.includes('setup-git'), 'should have setup-git task');
  });

  it('generates stack-specific tasks for TypeScript + Express', () => {
    const plan = generatePlan({ project: 'REST API', stack: 'TypeScript, Express, PostgreSQL' });
    assert.ok(plan.includes('setup-typescript'), 'should have TS setup');
    assert.ok(plan.includes('setup-express'), 'should have Express setup');
    assert.ok(plan.includes('setup-database'), 'should have DB setup');
  });

  it('generates feature tasks from description', () => {
    const plan = generatePlan({ project: 'Chat app with real-time messaging and auth', stack: 'Node.js' });
    assert.ok(plan.includes('add-auth'), 'should have auth task');
    assert.ok(plan.includes('add-realtime'), 'should have realtime task');
  });

  it('always includes quality tasks', () => {
    const plan = generatePlan({ project: 'Simple tool', stack: '' });
    assert.ok(plan.includes('add-tests'), 'should have testing task');
    assert.ok(plan.includes('add-error-handling'), 'should have error handling task');
  });

  it('generates valid task format', () => {
    const plan = generatePlan({ project: 'Test', stack: 'TypeScript' });
    const taskLines = plan.split('\n').filter((l) => l.startsWith('- [ ]'));
    assert.ok(taskLines.length >= 5, `should have at least 5 tasks, got ${taskLines.length}`);
    for (const line of taskLines) {
      assert.ok(/^- \[ \] \S+ — .+/.test(line), `task format should match: ${line}`);
    }
  });

  it('deduplicates tasks', () => {
    const plan = generatePlan({ project: 'API with REST endpoints and API documentation', stack: 'Express' });
    const ids = plan.split('\n')
      .filter((l) => l.startsWith('- [ ]'))
      .map((l) => l.match(/^- \[ \] (\S+)/)?.[1])
      .filter(Boolean);
    const unique = new Set(ids);
    assert.strictEqual(ids.length, unique.size, 'should have no duplicate task IDs');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Global Playbook
// ─────────────────────────────────────────────────────────────────────────────

describe('experiential-memory - global playbook', () => {
  const {
    readPlaybook, addPlaybookEntry, getGlobalPlaybookPath,
    promoteToGlobal, reinforceEntry,
  } = require('../src/experiential-memory');

  function createTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'global-pb-'));
    fs.mkdirSync(path.join(dir, 'forge-memory'), { recursive: true });
    return dir;
  }

  function cleanup(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  it('getGlobalPlaybookPath returns path in home directory', () => {
    const globalPath = getGlobalPlaybookPath();
    assert.ok(globalPath.includes('.copilotforge'), 'should be under .copilotforge');
    assert.ok(globalPath.endsWith('playbook.md'), 'should end with playbook.md');
  });

  it('readPlaybook merges project and global entries', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Project strategy', 'Content', dir);

    const { entries } = readPlaybook(dir);
    assert.ok(entries.length >= 1, 'should have at least the project entry');
    assert.ok(entries.some((e) => e.title === 'Project strategy'));
    cleanup(dir);
  });

  it('readPlaybook deduplicates by title across project and global', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Shared strategy', 'Project version', dir);

    const { entries } = readPlaybook(dir);
    const sharedEntries = entries.filter((e) => e.title === 'Shared strategy');
    assert.strictEqual(sharedEntries.length, 1, 'should not duplicate entries');
    cleanup(dir);
  });

  it('promoteToGlobal skips entries with low score', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Low score entry', 'Content', dir);
    // Score is 1 by default, threshold is 3
    const result = promoteToGlobal({ cwd: dir });
    assert.strictEqual(result.promoted, 0, 'should not promote low-score entries');
    cleanup(dir);
  });

  it('promoteToGlobal promotes high-score entries', () => {
    const dir = createTempDir();
    const uniqueTitle = `High score promote ${Date.now()}`;
    addPlaybookEntry('STRATEGY', uniqueTitle, 'Important content', dir);
    reinforceEntry(uniqueTitle, dir);
    reinforceEntry(uniqueTitle, dir);
    reinforceEntry(uniqueTitle, dir); // score = 4

    const result = promoteToGlobal({ cwd: dir, minScore: 3 });
    assert.ok(result.promoted >= 1, 'should promote high-score entry');

    // Verify it's in the global playbook
    const globalPath = getGlobalPlaybookPath();
    if (fs.existsSync(globalPath)) {
      const content = fs.readFileSync(globalPath, 'utf8');
      assert.ok(content.includes(uniqueTitle), 'global should contain promoted entry');
    }

    cleanup(dir);
  });

  it('readPlaybook entries include source field', () => {
    const dir = createTempDir();
    addPlaybookEntry('INSIGHT', 'Source test', 'Content', dir);
    const { entries } = readPlaybook(dir);
    const entry = entries.find((e) => e.title === 'Source test');
    assert.ok(entry, 'should find entry');
    assert.strictEqual(entry.source, 'project', 'project entries should have source: project');
    cleanup(dir);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Compact CLI and Playbook CLI routing
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 16 - CLI module verification', () => {
  it('plan-generator.js exists', () => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'cli', 'src', 'plan-generator.js')));
  });

  it('compact-cli.js exists and exports run()', () => {
    const compactCli = require('../src/compact-cli');
    assert.ok(typeof compactCli.run === 'function');
  });

  it('copilotforge.js routes compact command', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'bin', 'copilotforge.js'), 'utf8');
    assert.ok(content.includes("case 'compact'"), 'should route compact command');
  });

  it('wizard.js calls plan generator after init', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes('writePlan'), 'wizard should call writePlan');
  });

  it('wizard.js uses trust-adaptive confirmation', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes('skipConfirmation'), 'wizard should check skipConfirmation');
  });

  it('wizard.js uses trust-adaptive extras suggestion', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes('suggestExtras'), 'wizard should check suggestExtras');
  });

  it('experiential-memory exports promoteToGlobal', () => {
    const em = require('../src/experiential-memory');
    assert.ok(typeof em.promoteToGlobal === 'function');
    assert.ok(typeof em.getGlobalPlaybookPath === 'function');
  });

  it('playbook-cli supports --promote flag', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'playbook-cli.js'), 'utf8');
    assert.ok(content.includes('--promote'), 'playbook CLI should support --promote');
  });
});
