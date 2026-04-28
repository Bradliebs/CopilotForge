'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Wizard module validation
// ─────────────────────────────────────────────────────────────────────────────

describe('wizard - module structure', () => {
  it('wizard.js exists and exports run()', () => {
    const wizard = require('../src/wizard');
    assert.ok(typeof wizard.run === 'function', 'wizard should export run()');
  });

  it('wizard exports EXTRAS list', () => {
    const { EXTRAS } = require('../src/wizard');
    assert.ok(Array.isArray(EXTRAS), 'EXTRAS should be an array');
    assert.ok(EXTRAS.length >= 10, 'EXTRAS should have at least 10 items');
    assert.ok(EXTRAS.some((e) => e.key === 'oracle-prime'), 'EXTRAS should include oracle-prime');
  });

  it('wizard exports PP_SIGNALS', () => {
    const { PP_SIGNALS } = require('../src/wizard');
    assert.ok(Array.isArray(PP_SIGNALS), 'PP_SIGNALS should be an array');
    assert.ok(PP_SIGNALS.includes('copilot studio'), 'PP_SIGNALS should include copilot studio');
  });

  it('wizard detectPPSignals detects power platform keywords', () => {
    const { detectPPSignals } = require('../src/wizard');
    const signals = detectPPSignals('I want to build a copilot studio agent with a canvas app');
    assert.ok(signals.includes('copilot studio'), 'should detect copilot studio');
    assert.ok(signals.includes('canvas app'), 'should detect canvas app');
  });

  it('wizard detectPPSignals returns empty for dev projects', () => {
    const { detectPPSignals } = require('../src/wizard');
    const signals = detectPPSignals('I want to build a REST API with Express and PostgreSQL');
    assert.strictEqual(signals.length, 0, 'should detect no PP signals for dev project');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Rollback module validation
// ─────────────────────────────────────────────────────────────────────────────

describe('rollback - core functions', () => {
  const { captureSnapshot, listSnapshots, restoreSnapshot, pruneSnapshots, getSnapshotsDir } = require('../src/rollback');

  it('rollback.js exports all required functions', () => {
    assert.ok(typeof captureSnapshot === 'function');
    assert.ok(typeof listSnapshots === 'function');
    assert.ok(typeof restoreSnapshot === 'function');
    assert.ok(typeof pruneSnapshots === 'function');
    assert.ok(typeof getSnapshotsDir === 'function');
  });

  it('captureSnapshot creates a snapshot with manifest', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
    const testFile = path.join(tmpDir, 'test.md');
    fs.writeFileSync(testFile, '# Test', 'utf8');

    const snapshotDir = captureSnapshot(['test.md'], tmpDir);
    assert.ok(fs.existsSync(snapshotDir), 'snapshot dir should exist');
    assert.ok(fs.existsSync(path.join(snapshotDir, 'manifest.json')), 'manifest.json should exist');

    const manifest = JSON.parse(fs.readFileSync(path.join(snapshotDir, 'manifest.json'), 'utf8'));
    assert.strictEqual(manifest.files.length, 1, 'manifest should have 1 file');
    assert.strictEqual(manifest.files[0].path, 'test.md');
    assert.strictEqual(manifest.files[0].existed, true);
    assert.strictEqual(manifest.files[0].content, '# Test');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(path.dirname(snapshotDir), { recursive: true, force: true });
  });

  it('captureSnapshot skips forge-memory files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
    const memFile = path.join(tmpDir, 'forge-memory', 'decisions.md');
    fs.mkdirSync(path.dirname(memFile), { recursive: true });
    fs.writeFileSync(memFile, '# Decisions', 'utf8');

    const snapshotDir = captureSnapshot(['forge-memory/decisions.md', 'test.txt'], tmpDir);
    const manifest = JSON.parse(fs.readFileSync(path.join(snapshotDir, 'manifest.json'), 'utf8'));
    const memEntry = manifest.files.find((f) => f.path.includes('forge-memory'));
    assert.strictEqual(memEntry, undefined, 'forge-memory files should not be in snapshot');

    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(path.dirname(snapshotDir), { recursive: true, force: true });
  });

  it('restoreSnapshot restores file content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
    const testFile = path.join(tmpDir, 'restore-test.md');
    fs.writeFileSync(testFile, 'original content', 'utf8');

    // Capture
    const snapshotDir = captureSnapshot(['restore-test.md'], tmpDir);
    const snapshotId = path.basename(snapshotDir);

    // Modify
    fs.writeFileSync(testFile, 'modified content', 'utf8');
    assert.strictEqual(fs.readFileSync(testFile, 'utf8'), 'modified content');

    // Restore
    const results = restoreSnapshot(snapshotId, tmpDir);
    assert.strictEqual(fs.readFileSync(testFile, 'utf8'), 'original content');
    assert.strictEqual(results.restored, 1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(path.dirname(snapshotDir), { recursive: true, force: true });
  });

  it('listSnapshots returns array', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
    const snapshots = listSnapshots(tmpDir);
    assert.ok(Array.isArray(snapshots), 'should return an array');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('pruneSnapshots keeps max count', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prune-test-'));
    // Create 7 fake snapshot dirs
    for (let i = 0; i < 7; i++) {
      const dir = path.join(tmpDir, `snap-${i}`);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'manifest.json'), '{}', 'utf8');
    }

    pruneSnapshots(tmpDir, 3);
    const remaining = fs.readdirSync(tmpDir).length;
    assert.ok(remaining <= 3, `should keep at most 3, got ${remaining}`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Examples module validation
// ─────────────────────────────────────────────────────────────────────────────

describe('examples - module structure', () => {
  it('examples.js exists and exports run()', () => {
    const examples = require('../src/examples');
    assert.ok(typeof examples.run === 'function', 'examples should export run()');
  });

  it('examples exports BUILTIN_EXAMPLES', () => {
    const { BUILTIN_EXAMPLES } = require('../src/examples');
    assert.ok(Array.isArray(BUILTIN_EXAMPLES), 'BUILTIN_EXAMPLES should be an array');
    assert.ok(BUILTIN_EXAMPLES.length >= 5, 'should have at least 5 built-in examples');
  });

  it('BUILTIN_EXAMPLES have required fields', () => {
    const { BUILTIN_EXAMPLES } = require('../src/examples');
    for (const ex of BUILTIN_EXAMPLES) {
      assert.ok(ex.name, `example should have name: ${JSON.stringify(ex)}`);
      assert.ok(ex.description, `${ex.name} should have description`);
      assert.ok(ex.path, `${ex.name} should have path`);
      assert.ok(Array.isArray(ex.tags), `${ex.name} should have tags array`);
    }
  });

  it('fetchRegistry returns examples array with source', async () => {
    const { fetchRegistry } = require('../src/examples');
    const result = await fetchRegistry();
    assert.ok(Array.isArray(result.examples), 'should return examples array');
    assert.ok(['remote', 'cache', 'builtin'].includes(result.source), 'source should be remote, cache, or builtin');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Plugin loader module validation
// ─────────────────────────────────────────────────────────────────────────────

describe('plugin-loader - core functions', () => {
  const { validatePlugin, discoverPlugins, detectPluginPath, CORE_PATHS } = require('../src/plugin-loader');

  it('plugin-loader.js exports all required functions', () => {
    assert.ok(typeof validatePlugin === 'function');
    assert.ok(typeof discoverPlugins === 'function');
    assert.ok(typeof detectPluginPath === 'function');
  });

  it('CORE_PATHS contains A-J', () => {
    for (const letter of 'ABCDEFGHIJ'.split('')) {
      assert.ok(CORE_PATHS.has(letter), `CORE_PATHS should contain ${letter}`);
    }
  });

  it('CORE_PATHS does not contain K-Z', () => {
    assert.ok(!CORE_PATHS.has('K'), 'CORE_PATHS should not contain K');
    assert.ok(!CORE_PATHS.has('Z'), 'CORE_PATHS should not contain Z');
  });

  it('validates a correct plugin', () => {
    const plugin = {
      name: 'Test',
      buildPath: 'K',
      signals: ['test'],
      questions: [],
    };
    const result = validatePlugin(plugin, {});
    assert.ok(result.valid, 'valid plugin should pass validation');
  });

  it('rejects plugin with core path A', () => {
    const plugin = {
      name: 'Bad',
      buildPath: 'A',
      signals: ['test'],
      questions: [],
    };
    const result = validatePlugin(plugin, {});
    assert.strictEqual(result.valid, false, 'plugin with core path A should be rejected');
    assert.ok(result.error.includes('conflicts'), 'error should mention conflict');
  });

  it('rejects plugin without signals', () => {
    const plugin = {
      name: 'No Signals',
      buildPath: 'K',
      signals: [],
      questions: [],
    };
    const result = validatePlugin(plugin, {});
    assert.strictEqual(result.valid, false, 'plugin without signals should be rejected');
  });

  it('detectPluginPath finds matching plugin', () => {
    const plugins = [{
      name: 'Test Path',
      buildPath: 'K',
      signals: ['test-plugin-signal', 'test-path'],
      questions: [],
    }];
    const result = detectPluginPath('I want to use the test-plugin-signal feature', plugins);
    assert.ok(result, 'should find matching plugin');
    assert.strictEqual(result.path, 'K');
    assert.strictEqual(result.name, 'Test Path');
  });

  it('detectPluginPath returns null for no match', () => {
    const plugins = [{
      name: 'Test Path',
      buildPath: 'K',
      signals: ['test-plugin-signal'],
      questions: [],
    }];
    const result = detectPluginPath('I want to build a REST API', plugins);
    assert.strictEqual(result, null, 'should return null for no match');
  });

  it('test-plugin fixture loads correctly', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'test-plugin');
    const plugin = require(fixturePath);
    assert.strictEqual(plugin.name, 'Test Path');
    assert.strictEqual(plugin.buildPath, 'K');
    assert.ok(plugin.signals.includes('test-plugin-signal'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Router integration validation
// ─────────────────────────────────────────────────────────────────────────────

describe('copilotforge.js - Phase 14 routing', () => {
  const binPath = path.join(repoRoot, 'cli', 'bin', 'copilotforge.js');
  const content = fs.readFileSync(binPath, 'utf8');

  it('routes wizard command', () => {
    assert.ok(content.includes("case 'wizard'"), 'should route wizard command');
  });

  it('routes rollback command', () => {
    assert.ok(content.includes("case 'rollback'"), 'should route rollback command');
  });

  it('routes examples command', () => {
    assert.ok(content.includes("case 'examples'"), 'should route examples command');
  });

  it('empty command routes to interactive menu', () => {
    assert.ok(content.includes('interactive.run()'), 'empty command should call interactive.run()');
  });

  it('help text documents wizard, rollback, and examples', () => {
    assert.ok(content.includes('npx copilotforge wizard'), 'help should list wizard');
    assert.ok(content.includes('npx copilotforge rollback'), 'help should list rollback');
    assert.ok(content.includes('npx copilotforge examples'), 'help should list examples');
  });

  it('routes mcp command', () => {
    assert.ok(content.includes("case 'mcp'"), 'should route mcp command');
  });

  it('help text documents mcp', () => {
    assert.ok(content.includes('npx copilotforge mcp'), 'help should list mcp command');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5b. MCP server module validation
// ─────────────────────────────────────────────────────────────────────────────

describe('mcp-server - module structure', () => {
  it('mcp-server.js exists and exports run()', () => {
    const mcpServer = require('../src/mcp-server');
    assert.ok(typeof mcpServer.run === 'function', 'should export run()');
  });

  it('mcp-server exports TOOLS array', () => {
    const { TOOLS } = require('../src/mcp-server');
    assert.ok(Array.isArray(TOOLS), 'TOOLS should be an array');
    assert.ok(TOOLS.length >= 4, 'should have at least 4 tools');
  });

  it('TOOLS includes init, doctor, status, rollback', () => {
    const { TOOLS } = require('../src/mcp-server');
    const names = TOOLS.map((t) => t.name);
    assert.ok(names.includes('copilotforge_init'), 'should include copilotforge_init');
    assert.ok(names.includes('copilotforge_doctor'), 'should include copilotforge_doctor');
    assert.ok(names.includes('copilotforge_status'), 'should include copilotforge_status');
    assert.ok(names.includes('copilotforge_rollback'), 'should include copilotforge_rollback');
  });

  it('each tool has inputSchema with required properties', () => {
    const { TOOLS } = require('../src/mcp-server');
    for (const tool of TOOLS) {
      assert.ok(tool.name, `tool should have name`);
      assert.ok(tool.description, `${tool.name} should have description`);
      assert.ok(tool.inputSchema, `${tool.name} should have inputSchema`);
      assert.ok(tool.inputSchema.properties?.cwd, `${tool.name} should require cwd param`);
    }
  });

  it('handleMessage responds to initialize', () => {
    const { handleMessage } = require('../src/mcp-server');
    const response = handleMessage({ method: 'initialize', id: 1, params: {} });
    const parsed = JSON.parse(response);
    assert.strictEqual(parsed.id, 1);
    assert.ok(parsed.result.protocolVersion, 'should return protocolVersion');
    assert.ok(parsed.result.serverInfo.name === 'copilotforge', 'server name should be copilotforge');
  });

  it('handleMessage responds to tools/list', () => {
    const { handleMessage } = require('../src/mcp-server');
    const response = handleMessage({ method: 'tools/list', id: 2, params: {} });
    const parsed = JSON.parse(response);
    assert.ok(Array.isArray(parsed.result.tools), 'should return tools array');
    assert.ok(parsed.result.tools.length >= 4, 'should have at least 4 tools');
  });

  it('handleMessage returns error for unknown tool', () => {
    const { handleMessage } = require('../src/mcp-server');
    const response = handleMessage({ method: 'tools/call', id: 3, params: { name: 'nonexistent' } });
    const parsed = JSON.parse(response);
    assert.ok(parsed.error, 'should return error for unknown tool');
    assert.strictEqual(parsed.error.code, -32601);
  });

  it('handleMessage responds to ping', () => {
    const { handleMessage } = require('../src/mcp-server');
    const response = handleMessage({ method: 'ping', id: 4, params: {} });
    const parsed = JSON.parse(response);
    assert.strictEqual(parsed.id, 4);
    assert.ok(parsed.result !== undefined, 'should return result for ping');
  });

  it('SERVER_INFO has correct version', () => {
    const { SERVER_INFO } = require('../src/mcp-server');
    assert.strictEqual(SERVER_INFO.version, '1.9.0', 'server version should be 1.9.0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Init/upgrade snapshot integration
// ─────────────────────────────────────────────────────────────────────────────

describe('init/upgrade - rollback integration', () => {
  it('init.js calls captureSnapshot before writes', () => {
    const initPath = path.join(repoRoot, 'cli', 'src', 'init.js');
    const content = fs.readFileSync(initPath, 'utf8');
    assert.ok(content.includes('captureSnapshot'), 'init.js should call captureSnapshot');
  });

  it('upgrade.js calls captureSnapshot before writes', () => {
    const upgradePath = path.join(repoRoot, 'cli', 'src', 'upgrade.js');
    const content = fs.readFileSync(upgradePath, 'utf8');
    assert.ok(content.includes('captureSnapshot'), 'upgrade.js should call captureSnapshot');
  });
});
