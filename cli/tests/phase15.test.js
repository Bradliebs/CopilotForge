'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Hook Lifecycle System
// ─────────────────────────────────────────────────────────────────────────────

describe('hooks - registration and execution', () => {
  const { HOOK_EVENTS, registerHook, fireHooks, getRegisteredHooks, clearAllHooks } = require('../src/hooks');

  it('exports all required functions', () => {
    assert.ok(Array.isArray(HOOK_EVENTS), 'HOOK_EVENTS should be an array');
    assert.ok(HOOK_EVENTS.length >= 15, 'should have at least 15 hook events');
    assert.ok(typeof registerHook === 'function');
    assert.ok(typeof fireHooks === 'function');
    assert.ok(typeof clearAllHooks === 'function');
  });

  it('HOOK_EVENTS contains all categories', () => {
    assert.ok(HOOK_EVENTS.includes('PreScaffold'), 'should have PreScaffold');
    assert.ok(HOOK_EVENTS.includes('PostTaskExecute'), 'should have PostTaskExecute');
    assert.ok(HOOK_EVENTS.includes('PreAnalysis'), 'should have PreAnalysis');
    assert.ok(HOOK_EVENTS.includes('PreMemoryWrite'), 'should have PreMemoryWrite');
    assert.ok(HOOK_EVENTS.includes('SessionStart'), 'should have SessionStart');
    assert.ok(HOOK_EVENTS.includes('PermissionRequest'), 'should have PermissionRequest');
    assert.ok(HOOK_EVENTS.includes('WizardComplete'), 'should have WizardComplete');
  });

  it('registerHook returns unregister function', () => {
    clearAllHooks();
    const { unregister } = registerHook('PreScaffold', async () => ({ ok: true }));
    assert.ok(typeof unregister === 'function');
    assert.strictEqual(getRegisteredHooks('PreScaffold').length, 1);
    unregister();
    assert.strictEqual(getRegisteredHooks('PreScaffold').length, 0);
    clearAllHooks();
  });

  it('rejects unknown events', () => {
    assert.throws(
      () => registerHook('NonexistentEvent', async () => {}),
      /Unknown hook event/
    );
  });

  it('fireHooks executes callbacks and collects results', async () => {
    clearAllHooks();
    registerHook('PreScaffold', async (ctx) => ({ received: ctx.test }), { name: 'test-hook' });
    const { results, blocked } = await fireHooks('PreScaffold', { test: 'value' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].result.received, 'value');
    assert.strictEqual(blocked, false);
    clearAllHooks();
  });

  it('hooks can block operations', async () => {
    clearAllHooks();
    registerHook('PreScaffold', async () => ({ blocked: true }));
    const { blocked } = await fireHooks('PreScaffold', {});
    assert.strictEqual(blocked, true);
    clearAllHooks();
  });

  it('hooks execute in priority order', async () => {
    clearAllHooks();
    const order = [];
    registerHook('SessionStart', async () => { order.push('second'); }, { priority: 200 });
    registerHook('SessionStart', async () => { order.push('first'); }, { priority: 50 });
    await fireHooks('SessionStart', {});
    assert.deepStrictEqual(order, ['first', 'second']);
    clearAllHooks();
  });

  it('hook failures are caught gracefully', async () => {
    clearAllHooks();
    registerHook('PreScaffold', async () => { throw new Error('test error'); });
    const { results } = await fireHooks('PreScaffold', {});
    assert.ok(results[0].error, 'error should be captured');
    clearAllHooks();
  });

  it('hooks can modify context for downstream hooks', async () => {
    clearAllHooks();
    registerHook('PreScaffold', async (ctx) => ({
      modifiedContext: { injected: 'value' },
    }), { priority: 1 });
    registerHook('PreScaffold', async (ctx) => ({
      received: ctx.injected,
    }), { priority: 2 });
    const { results } = await fireHooks('PreScaffold', {});
    assert.strictEqual(results[1].result.received, 'value');
    clearAllHooks();
  });

  it('empty event fires with no errors', async () => {
    clearAllHooks();
    const { results, blocked } = await fireHooks('PostScaffold', {});
    assert.strictEqual(results.length, 0);
    assert.strictEqual(blocked, false);
    clearAllHooks();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Experiential Memory Layer
// ─────────────────────────────────────────────────────────────────────────────

describe('experiential-memory - playbook operations', () => {
  const {
    ENTRY_TYPES, addPlaybookEntry, readPlaybook, getTopEntries,
    searchPlaybook, reinforceEntry, consolidatePlaybook,
    processEvolutionBlock, getPlaybookPath,
  } = require('../src/experiential-memory');

  function createTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'playbook-test-'));
    fs.mkdirSync(path.join(dir, 'forge-memory'), { recursive: true });
    return dir;
  }

  function cleanup(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  it('exports all required functions', () => {
    assert.ok(Array.isArray(ENTRY_TYPES));
    assert.ok(ENTRY_TYPES.includes('STRATEGY'));
    assert.ok(ENTRY_TYPES.includes('PATTERN'));
    assert.ok(ENTRY_TYPES.includes('ANTIPATTERN'));
    assert.ok(ENTRY_TYPES.includes('INSIGHT'));
    assert.ok(typeof addPlaybookEntry === 'function');
    assert.ok(typeof readPlaybook === 'function');
  });

  it('addPlaybookEntry creates a new entry', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Test strategy', 'Use caching for repeated lookups', dir);
    const { entries } = readPlaybook(dir);
    const projectEntries = entries.filter((e) => e.source === 'project');
    assert.strictEqual(projectEntries.length, 1);
    assert.strictEqual(projectEntries[0].type, 'STRATEGY');
    assert.strictEqual(projectEntries[0].title, 'Test strategy');
    cleanup(dir);
  });

  it('rejects invalid entry types', () => {
    const dir = createTempDir();
    assert.throws(() => addPlaybookEntry('INVALID', 'test', 'test', dir), /Invalid entry type/);
    cleanup(dir);
  });

  it('getTopEntries returns sorted by score', () => {
    const dir = createTempDir();
    const suffix = Date.now();
    addPlaybookEntry('STRATEGY', `Low score ${suffix}`, 'Content', dir);
    addPlaybookEntry('PATTERN', `High score ${suffix}`, 'Content', dir);
    reinforceEntry(`High score ${suffix}`, dir);
    reinforceEntry(`High score ${suffix}`, dir);
    // Use a large N to ensure project entries aren't pushed out by global entries
    const top = getTopEntries(100, dir);
    const projectTop = top.filter((e) => e.source === 'project');
    assert.ok(projectTop.length >= 2, `should have at least 2 project entries, got ${projectTop.length}: ${projectTop.map(e=>e.title).join(', ')}`);
    const highIdx = projectTop.findIndex((e) => e.title.startsWith('High score'));
    const lowIdx = projectTop.findIndex((e) => e.title.startsWith('Low score'));
    assert.ok(highIdx < lowIdx, 'High score should rank before Low score');
    cleanup(dir);
  });

  it('searchPlaybook finds matching entries', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Caching approach', 'Use Redis for session cache', dir);
    addPlaybookEntry('PATTERN', 'Error handling', 'Always wrap async calls', dir);
    const results = searchPlaybook('caching', dir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, 'Caching approach');
    cleanup(dir);
  });

  it('reinforceEntry increments score', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Reinforced entry', 'Content', dir);
    const result = reinforceEntry('Reinforced entry', dir);
    assert.strictEqual(result, true);
    const { entries } = readPlaybook(dir);
    assert.ok(entries[0].score >= 2);
    cleanup(dir);
  });

  it('consolidatePlaybook prunes low-score entries', () => {
    const dir = createTempDir();
    for (let i = 0; i < 10; i++) {
      addPlaybookEntry('INSIGHT', `Entry ${i}`, `Content ${i}`, dir);
    }
    const result = consolidatePlaybook({ maxEntries: 5, cwd: dir });
    assert.ok(result.kept <= 5);
    cleanup(dir);
  });

  it('processEvolutionBlock adds STRATEGY entry from patch', () => {
    const dir = createTempDir();
    processEvolutionBlock({
      drift: 'Bear Case weighted higher',
      gap: 'No heuristic for team ratio',
      patch: 'When team < 2x service count, flag Bear Case as elevated',
    }, dir);
    const { entries } = readPlaybook(dir);
    assert.ok(entries.length >= 1);
    cleanup(dir);
  });

  it('processEvolutionBlock handles [REINFORCED: P#]', () => {
    const dir = createTempDir();
    addPlaybookEntry('STRATEGY', 'Standing Patch P1', 'Sense-check statistics', dir);
    processEvolutionBlock({
      drift: 'No change',
      gap: 'None',
      patch: '[REINFORCED: P1]',
    }, dir);
    // Should reinforce, not create new entry
    const { entries } = readPlaybook(dir);
    const projectEntries = entries.filter((e) => e.source === 'project');
    assert.strictEqual(projectEntries.length, 1);
    cleanup(dir);
  });

  it('readPlaybook returns empty for missing file', () => {
    const dir = createTempDir();
    const { entries } = readPlaybook(dir);
    // May include global entries but no project entries
    const projectEntries = entries.filter((e) => e.source === 'project');
    assert.strictEqual(projectEntries.length, 0);
    cleanup(dir);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Generator-Evaluator Separation
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluator - task evaluation', () => {
  const { evaluate, checkFilesExist, checkFileSanity } = require('../src/evaluator');

  function createTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evaluator-test-'));
    return dir;
  }

  function cleanup(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  it('exports all required functions', () => {
    assert.ok(typeof evaluate === 'function');
    assert.ok(typeof checkFilesExist === 'function');
    assert.ok(typeof checkFileSanity === 'function');
  });

  it('checkFilesExist passes for existing files', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'test.txt'), 'content');
    const result = checkFilesExist(['test.txt'], dir);
    assert.strictEqual(result.status, 'pass');
    cleanup(dir);
  });

  it('checkFilesExist fails for missing files', () => {
    const dir = createTempDir();
    const result = checkFilesExist(['missing.txt'], dir);
    assert.strictEqual(result.status, 'fail');
    cleanup(dir);
  });

  it('checkFileSanity warns for empty files', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'empty.txt'), '');
    const result = checkFileSanity(['empty.txt'], dir);
    assert.strictEqual(result.status, 'warn');
    cleanup(dir);
  });

  it('evaluate returns confirmed for valid task', async () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'output.js'), 'module.exports = {};');
    const result = await evaluate(
      { id: 'test-1', title: 'Test task', expectedFiles: ['output.js'], modifiedFiles: ['output.js'] },
      { cwd: dir }
    );
    assert.strictEqual(result.verdict, 'confirmed');
    assert.strictEqual(result.passed, true);
    cleanup(dir);
  });

  it('evaluate returns failed for missing expected files', async () => {
    const dir = createTempDir();
    const result = await evaluate(
      { id: 'test-2', title: 'Missing files', expectedFiles: ['missing.js'] },
      { cwd: dir }
    );
    assert.strictEqual(result.verdict, 'failed');
    assert.strictEqual(result.passed, false);
    cleanup(dir);
  });

  it('evaluate summary includes task info', async () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'file.js'), 'ok');
    const result = await evaluate(
      { id: 'task-3', title: 'Summary test', modifiedFiles: ['file.js'] },
      { cwd: dir }
    );
    assert.ok(result.summary.includes('task-3'));
    cleanup(dir);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Compaction Pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('compaction - five-layer pipeline', () => {
  const {
    compact, budgetReduction, snip, microcompact,
    contextCollapse, autoCompact, totalChars, DEFAULT_CONFIG,
  } = require('../src/compaction');

  const makeMsg = (content, role = 'assistant') => ({ role, content });

  it('exports all required functions', () => {
    assert.ok(typeof compact === 'function');
    assert.ok(typeof budgetReduction === 'function');
    assert.ok(typeof snip === 'function');
    assert.ok(typeof microcompact === 'function');
    assert.ok(typeof contextCollapse === 'function');
    assert.ok(typeof autoCompact === 'function');
    assert.ok(typeof totalChars === 'function');
  });

  it('budgetReduction truncates oversized messages', () => {
    const messages = [makeMsg('x'.repeat(20000))];
    const { messages: result, charsSaved } = budgetReduction(messages, 5000);
    assert.ok(result[0].content.length < 20000);
    assert.ok(charsSaved > 0);
  });

  it('budgetReduction passes small messages unchanged', () => {
    const messages = [makeMsg('short content')];
    const { messages: result, charsSaved } = budgetReduction(messages, 5000);
    assert.strictEqual(result[0].content, 'short content');
    assert.strictEqual(charsSaved, 0);
  });

  it('snip removes older messages', () => {
    const messages = Array.from({ length: 30 }, (_, i) => makeMsg(`msg ${i}`));
    const { messages: result, snipped } = snip(messages, 10);
    assert.strictEqual(snipped, 20);
    assert.strictEqual(result.length, 11); // 10 kept + 1 boundary
  });

  it('snip preserves all when under limit', () => {
    const messages = [makeMsg('a'), makeMsg('b')];
    const { messages: result, snipped } = snip(messages, 10);
    assert.strictEqual(snipped, 0);
    assert.strictEqual(result.length, 2);
  });

  it('contextCollapse replaces completed task blocks', () => {
    const messages = [
      makeMsg('Short response'),
      makeMsg('✅ Task completed successfully. ' + 'x'.repeat(3000)),
    ];
    const { messages: result, collapsed } = contextCollapse(messages);
    assert.strictEqual(collapsed, 1);
    assert.ok(result[1].content.includes('[Collapsed task block]'));
  });

  it('autoCompact produces summary', () => {
    const messages = [
      makeMsg('decided to use PostgreSQL for the database'),
      makeMsg('[x] setup-database — completed'),
    ];
    const { messages: result, summary } = autoCompact(messages);
    assert.strictEqual(result.length, 1);
    assert.ok(summary.includes('Auto-compact summary'));
  });

  it('totalChars counts correctly', () => {
    const messages = [makeMsg('hello'), makeMsg('world')];
    assert.strictEqual(totalChars(messages), 10);
  });

  it('compact runs full pipeline without errors', async () => {
    const messages = Array.from({ length: 5 }, (_, i) => makeMsg(`Message ${i}`));
    const { messages: result, stats } = await compact(messages);
    assert.ok(result.length > 0);
    assert.ok(stats.inputMessages === 5);
    assert.ok(stats.layers.length >= 1); // at least budget reduction
  });

  it('DEFAULT_CONFIG has expected fields', () => {
    assert.ok(DEFAULT_CONFIG.maxContextChars > 0);
    assert.ok(DEFAULT_CONFIG.budgetPerResult > 0);
    assert.ok(DEFAULT_CONFIG.snipThreshold > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Trust Trajectory Tracking
// ─────────────────────────────────────────────────────────────────────────────

describe('trust - trajectory tracking', () => {
  const {
    readTrust, writeTrust, recordSignal, recordSession,
    calculateScore, scoreToLevel, getTrustBehavior, defaultTrustState,
  } = require('../src/trust');

  function createTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trust-test-'));
    fs.mkdirSync(path.join(dir, 'forge-memory'), { recursive: true });
    return dir;
  }

  function cleanup(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  it('exports all required functions', () => {
    assert.ok(typeof readTrust === 'function');
    assert.ok(typeof writeTrust === 'function');
    assert.ok(typeof recordSignal === 'function');
    assert.ok(typeof recordSession === 'function');
    assert.ok(typeof calculateScore === 'function');
    assert.ok(typeof scoreToLevel === 'function');
    assert.ok(typeof getTrustBehavior === 'function');
  });

  it('defaultTrustState has correct structure', () => {
    const state = defaultTrustState();
    assert.strictEqual(state.version, 1);
    assert.strictEqual(state.trustScore, 20);
    assert.strictEqual(state.level, 'cautious');
    assert.ok(state.signals);
    assert.ok(Array.isArray(state.history));
  });

  it('readTrust returns default for missing file', () => {
    const dir = createTempDir();
    const state = readTrust(dir);
    assert.strictEqual(state.trustScore, 20);
    cleanup(dir);
  });

  it('recordSession increments session count', () => {
    const dir = createTempDir();
    const state = recordSession(dir);
    assert.strictEqual(state.sessionCount, 1);
    const state2 = recordSession(dir);
    assert.strictEqual(state2.sessionCount, 2);
    cleanup(dir);
  });

  it('recordSignal updates signal and recalculates score', () => {
    const dir = createTempDir();
    recordSession(dir);
    const state = recordSignal('tasksCompleted', 5, dir);
    assert.strictEqual(state.signals.tasksCompleted, 5);
    assert.ok(state.trustScore > 20); // should increase
    cleanup(dir);
  });

  it('rollbacks decrease trust score', () => {
    const dir = createTempDir();
    recordSession(dir);
    recordSignal('confirmations', 3, dir);
    const before = readTrust(dir);
    recordSignal('rollbacks', 2, dir);
    const after = readTrust(dir);
    assert.ok(after.trustScore < before.trustScore, 'rollbacks should decrease trust');
    cleanup(dir);
  });

  it('scoreToLevel maps correctly', () => {
    assert.strictEqual(scoreToLevel(10), 'cautious');
    assert.strictEqual(scoreToLevel(45), 'standard');
    assert.strictEqual(scoreToLevel(65), 'trusted');
    assert.strictEqual(scoreToLevel(85), 'autonomous');
  });

  it('getTrustBehavior returns behavior for cautious level', () => {
    const dir = createTempDir();
    const behavior = getTrustBehavior(dir);
    assert.strictEqual(behavior.level, 'cautious');
    assert.strictEqual(behavior.skipConfirmation, false);
    assert.strictEqual(behavior.verbosity, 'verbose');
    cleanup(dir);
  });

  it('trust history is capped at 10 entries', () => {
    const dir = createTempDir();
    for (let i = 0; i < 15; i++) {
      recordSignal('tasksCompleted', 1, dir);
    }
    const state = readTrust(dir);
    assert.ok(state.history.length <= 10);
    cleanup(dir);
  });

  it('calculateScore clamps to 0-100', () => {
    const state = defaultTrustState();
    state.signals.rollbacks = 100; // massive penalty
    const score = calculateScore(state);
    assert.ok(score >= 0);
    assert.ok(score <= 100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Module existence and source verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 15 modules - source verification', () => {
  it('hooks.js exists in cli/src/', () => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'cli', 'src', 'hooks.js')));
  });

  it('experiential-memory.js exists in cli/src/', () => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'cli', 'src', 'experiential-memory.js')));
  });

  it('evaluator.js exists in cli/src/', () => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'cli', 'src', 'evaluator.js')));
  });

  it('compaction.js exists in cli/src/', () => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'cli', 'src', 'compaction.js')));
  });

  it('trust.js exists in cli/src/', () => {
    assert.ok(fs.existsSync(path.join(repoRoot, 'cli', 'src', 'trust.js')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Wiring verification — hooks, evaluator, trust in host modules
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 15 wiring - integration verification', () => {

  it('init.js calls fireHooks for PreScaffold', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'init.js'), 'utf8');
    assert.ok(content.includes("fireHooks('PreScaffold'"), 'init.js should fire PreScaffold hook');
  });

  it('init.js calls fireHooks for PostScaffold', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'init.js'), 'utf8');
    assert.ok(content.includes("fireHooks('PostScaffold'"), 'init.js should fire PostScaffold hook');
  });

  it('init.js calls loadProjectHooks', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'init.js'), 'utf8');
    assert.ok(content.includes('loadProjectHooks'), 'init.js should load project hooks');
  });

  it('upgrade.js calls fireHooks for PreScaffold', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'upgrade.js'), 'utf8');
    assert.ok(content.includes("fireHooks('PreScaffold'"), 'upgrade.js should fire PreScaffold hook');
  });

  it('run.js calls evaluator after task completion', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'run.js'), 'utf8');
    assert.ok(content.includes("require('./evaluator')"), 'run.js should require evaluator');
    assert.ok(content.includes('evaluate('), 'run.js should call evaluate()');
  });

  it('run.js fires TaskFailed hook on failure', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'run.js'), 'utf8');
    assert.ok(content.includes("fireHooks('TaskFailed'"), 'run.js should fire TaskFailed hook');
  });

  it('wizard.js calls recordSession for trust tracking', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes('recordSession'), 'wizard.js should call recordSession');
  });

  it('wizard.js calls getTrustBehavior', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes('getTrustBehavior'), 'wizard.js should call getTrustBehavior');
  });

  it('wizard.js records confirmations signal', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes("recordSignal('confirmations')"), 'wizard.js should record confirmation signal');
  });

  it('wizard.js fires WizardComplete hook', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'wizard.js'), 'utf8');
    assert.ok(content.includes("fireHooks('WizardComplete'"), 'wizard.js should fire WizardComplete hook');
  });

  it('Oracle Prime SKILL.md includes experiential memory integration', () => {
    const content = fs.readFileSync(path.join(repoRoot, '.github', 'skills', 'oracle-prime', 'SKILL.md'), 'utf8');
    assert.ok(content.includes('Experiential Memory Integration'), 'SKILL.md should have experiential memory section');
    assert.ok(content.includes('playbook.md'), 'SKILL.md should reference playbook.md');
    assert.ok(content.includes('[STRATEGY]'), 'SKILL.md should document STRATEGY entry type');
  });

  it('SYSTEM-BREAKDOWN.md documents Phase 15', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'docs', 'SYSTEM-BREAKDOWN.md'), 'utf8');
    assert.ok(content.includes('Agent Harness Runtime'), 'should document Phase 15');
    assert.ok(content.includes('hooks.js'), 'should list hooks.js');
    assert.ok(content.includes('compaction.js'), 'should list compaction.js');
    assert.ok(content.includes('trust.js'), 'should list trust.js');
  });

  it('CHANGELOG.md documents Phase 15 features', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
    assert.ok(content.includes('Agent Harness Runtime'), 'should document Phase 15 in changelog');
    assert.ok(content.includes('Hook lifecycle'), 'should mention hook lifecycle');
    assert.ok(content.includes('Experiential memory'), 'should mention experiential memory');
    assert.ok(content.includes('Trust trajectory'), 'should mention trust trajectory');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Playbook seeding, rollback trust, and CLI subcommands
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 15 - playbook and trust CLI', () => {

  it('playbook-cli.js exists and exports run()', () => {
    const playbookCli = require('../src/playbook-cli');
    assert.ok(typeof playbookCli.run === 'function', 'playbook-cli should export run()');
  });

  it('trust-cli.js exists and exports run()', () => {
    const trustCli = require('../src/trust-cli');
    assert.ok(typeof trustCli.run === 'function', 'trust-cli should export run()');
  });

  it('copilotforge.js routes playbook command', () => {
    const binContent = fs.readFileSync(path.join(repoRoot, 'cli', 'bin', 'copilotforge.js'), 'utf8');
    assert.ok(binContent.includes("case 'playbook'"), 'should route playbook command');
  });

  it('copilotforge.js routes trust command', () => {
    const binContent = fs.readFileSync(path.join(repoRoot, 'cli', 'bin', 'copilotforge.js'), 'utf8');
    assert.ok(binContent.includes("case 'trust'"), 'should route trust command');
  });

  it('rollback.js records trust signal on restore', () => {
    const rollbackContent = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'rollback.js'), 'utf8');
    assert.ok(rollbackContent.includes("recordSignal('rollbacks'"), 'rollback should record trust signal');
  });

  it('init.js seeds playbook with starter strategies', () => {
    const initContent = fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'init.js'), 'utf8');
    assert.ok(initContent.includes('addPlaybookEntry'), 'init should call addPlaybookEntry');
    assert.ok(initContent.includes('starter strategies'), 'init should mention starter strategies');
  });

  it('help text documents playbook and trust commands', () => {
    const binContent = fs.readFileSync(path.join(repoRoot, 'cli', 'bin', 'copilotforge.js'), 'utf8');
    assert.ok(binContent.includes('npx copilotforge playbook'), 'help should list playbook');
    assert.ok(binContent.includes('npx copilotforge trust'), 'help should list trust');
  });

  it('playbook seeding creates 3 entries in temp dir', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playbook-seed-'));
    fs.mkdirSync(path.join(tmpDir, 'forge-memory'), { recursive: true });

    const { addPlaybookEntry, readPlaybook } = require('../src/experiential-memory');
    addPlaybookEntry('STRATEGY', 'Test seed 1', 'Content 1', tmpDir);
    addPlaybookEntry('PATTERN', 'Test seed 2', 'Content 2', tmpDir);
    addPlaybookEntry('STRATEGY', 'Test seed 3', 'Content 3', tmpDir);

    const { entries } = readPlaybook(tmpDir);
    // readPlaybook now merges project + global entries, so count may include global
    const projectEntries = entries.filter((e) => e.source === 'project');
    assert.strictEqual(projectEntries.length, 3, 'should have 3 project-level seeded entries');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
