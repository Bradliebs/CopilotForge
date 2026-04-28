'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: Agent Composition
// ─────────────────────────────────────────────────────────────────────────────

describe('compose - module structure', () => {
  const comp = require('../src/compose');

  it('exports run', () => { assert.strictEqual(typeof comp.run, 'function'); });
  it('exports runPipeline', () => { assert.strictEqual(typeof comp.runPipeline, 'function'); });
  it('exports executeStep', () => { assert.strictEqual(typeof comp.executeStep, 'function'); });
  it('exports BUILTIN_PIPELINES', () => { assert.ok(comp.BUILTIN_PIPELINES); });

  it('has health-check pipeline', () => {
    assert.ok(comp.BUILTIN_PIPELINES['health-check']);
    assert.ok(comp.BUILTIN_PIPELINES['health-check'].steps.length >= 2);
  });

  it('has onboarding pipeline', () => {
    assert.ok(comp.BUILTIN_PIPELINES['onboarding']);
  });
});

describe('compose - step execution', () => {
  const { executeStep } = require('../src/compose');

  it('executes detect step', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-det-'));
    const result = executeStep({ agent: 'detect' }, { cwd: dir });
    assert.ok(result.success);
    assert.ok(result.output.path);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('executes config step', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-cfg-'));
    const result = executeStep({ agent: 'config' }, { cwd: dir });
    assert.ok(result.success);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns error for unknown agent', () => {
    const result = executeStep({ agent: 'nonexistent' }, { cwd: os.tmpdir() });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Unknown agent'));
  });

  it('skips step when condition is false', () => {
    const result = executeStep({ agent: 'detect', condition: 'false' }, { cwd: os.tmpdir() });
    assert.ok(result.skipped);
  });

  it('executes step when condition is true', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-cond-'));
    const result = executeStep({ agent: 'detect', condition: 'true' }, { cwd: dir });
    assert.ok(result.success);
    assert.ok(!result.skipped);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('compose - pipeline execution', () => {
  const { runPipeline } = require('../src/compose');

  it('runs a simple pipeline', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-pipe-'));
    const result = runPipeline({
      steps: [
        { agent: 'detect', outputKey: 'buildPath' },
        { agent: 'config', outputKey: 'config' },
      ],
    }, { cwd: dir });
    assert.ok(result.success);
    assert.strictEqual(result.steps.length, 2);
    assert.ok(result.context.buildPath);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('stops on error with stopOnError', () => {
    const result = runPipeline({
      steps: [
        { agent: 'nonexistent' },
        { agent: 'detect' },
      ],
      stopOnError: true,
    }, { cwd: os.tmpdir() });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.steps.length, 1);
  });

  it('continues past errors when stopOnError is false', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-cont-'));
    const result = runPipeline({
      steps: [
        { agent: 'nonexistent' },
        { agent: 'detect' },
      ],
      stopOnError: false,
    }, { cwd: dir });
    assert.strictEqual(result.steps.length, 2);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('creates pipeline file', () => {
    const { createPipelineFile } = require('../src/compose');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-create-'));
    const filePath = createPipelineFile('health-check', dir);
    assert.ok(fs.existsSync(filePath));
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.ok(content.steps);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: Agent Testing Framework
// ─────────────────────────────────────────────────────────────────────────────

describe('agent-test - module structure', () => {
  const at = require('../src/agent-test');

  it('exports run', () => { assert.strictEqual(typeof at.run, 'function'); });
  it('exports testAgent', () => { assert.strictEqual(typeof at.testAgent, 'function'); });
  it('exports parseAgentFile', () => { assert.strictEqual(typeof at.parseAgentFile, 'function'); });
  it('exports detectConflicts', () => { assert.strictEqual(typeof at.detectConflicts, 'function'); });
  it('exports createMockContext', () => { assert.strictEqual(typeof at.createMockContext, 'function'); });
  it('exports AGENT_RULES', () => { assert.ok(Array.isArray(at.AGENT_RULES)); });
});

describe('agent-test - parsing', () => {
  const { parseAgentFile } = require('../src/agent-test');

  it('parses agent with sections', () => {
    const content = '# Test Agent\n\n## Role\nA test agent.\n\n## Instructions\nDo things.\n\n## Tools\nTool A.';
    const result = parseAgentFile(content);
    assert.strictEqual(result.title, 'Test Agent');
    assert.ok(result.sections.role);
    assert.ok(result.sections.instructions);
    assert.ok(result.sections.tools);
  });

  it('handles agent without sections', () => {
    const result = parseAgentFile('Just text.');
    assert.strictEqual(result.title, 'Unknown');
    assert.strictEqual(Object.keys(result.sections).length, 0);
  });
});

describe('agent-test - testing', () => {
  const { testAgent } = require('../src/agent-test');

  it('passes a well-formed agent', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-good-'));
    const file = path.join(dir, 'test.md');
    fs.writeFileSync(file, '# Good Agent\n\n## Role\nA good agent.\n\n## Instructions\nDo good things.\n\n## Triggers\nhelp me\n\n## Tools\nNone.\n\n' + 'x'.repeat(100));
    const result = testAgent(file);
    assert.ok(result.passed);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('fails an agent without title', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-notitle-'));
    const file = path.join(dir, 'test.md');
    fs.writeFileSync(file, 'No title here.\n## Role\nTest.');
    const result = testAgent(file);
    assert.ok(result.findings.some((f) => f.rule === 'has-title'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('warns about short agent files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-short-'));
    const file = path.join(dir, 'test.md');
    fs.writeFileSync(file, '# Short\n\n## Role\nX.');
    const result = testAgent(file);
    assert.ok(result.findings.some((f) => f.rule === 'reasonable-length'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('creates mock context', () => {
    const { createMockContext } = require('../src/agent-test');
    const ctx = createMockContext({ message: 'hello' });
    assert.strictEqual(ctx.message, 'hello');
    assert.strictEqual(ctx.role, 'user');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: Memory Graph
// ─────────────────────────────────────────────────────────────────────────────

describe('memory-graph - module structure', () => {
  const mg = require('../src/memory-graph');

  it('exports run', () => { assert.strictEqual(typeof mg.run, 'function'); });
  it('exports buildGraph', () => { assert.strictEqual(typeof mg.buildGraph, 'function'); });
  it('exports queryGraph', () => { assert.strictEqual(typeof mg.queryGraph, 'function'); });
  it('exports toJSON', () => { assert.strictEqual(typeof mg.toJSON, 'function'); });
  it('exports toMermaid', () => { assert.strictEqual(typeof mg.toMermaid, 'function'); });
  it('exports createGraph', () => { assert.strictEqual(typeof mg.createGraph, 'function'); });
});

describe('memory-graph - graph operations', () => {
  const { createGraph, addNode, addEdge, queryGraph, toJSON, toMermaid } = require('../src/memory-graph');

  it('creates empty graph', () => {
    const graph = createGraph();
    assert.strictEqual(graph.nodes.size, 0);
    assert.strictEqual(graph.edges.length, 0);
  });

  it('adds nodes and edges', () => {
    const graph = createGraph();
    addNode(graph, 'a', 'decision', { title: 'Use TypeScript' });
    addNode(graph, 'b', 'pattern', { title: 'Strict mode' });
    addEdge(graph, 'a', 'b', 'informs');
    assert.strictEqual(graph.nodes.size, 2);
    assert.strictEqual(graph.edges.length, 1);
  });

  it('queries by keyword', () => {
    const graph = createGraph();
    addNode(graph, 'a', 'decision', { title: 'Use TypeScript', content: 'strict types' });
    addNode(graph, 'b', 'pattern', { title: 'Use Python', content: 'dynamic' });
    const results = queryGraph(graph, 'typescript');
    assert.strictEqual(results.nodes.length, 1);
    assert.strictEqual(results.nodes[0].id, 'a');
  });

  it('exports to JSON', () => {
    const graph = createGraph();
    addNode(graph, 'x', 'skill', { title: 'Planner' });
    const json = toJSON(graph);
    assert.strictEqual(json.stats.nodeCount, 1);
    assert.ok(Array.isArray(json.nodes));
  });

  it('exports to Mermaid', () => {
    const graph = createGraph();
    addNode(graph, 'a', 'decision', { title: 'A' });
    addNode(graph, 'b', 'pattern', { title: 'B' });
    addEdge(graph, 'a', 'b', 'relates-to');
    const mermaid = toMermaid(graph);
    assert.ok(mermaid.includes('graph TD'));
    assert.ok(mermaid.includes('N0'));
    assert.ok(mermaid.includes('N1'));
  });
});

describe('memory-graph - build from project', () => {
  const { buildGraph } = require('../src/memory-graph');

  it('builds graph from project with forge-memory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-build-'));
    fs.mkdirSync(path.join(dir, 'forge-memory'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'forge-memory', 'decisions.md'), '# Decisions\n\n## Use TypeScript\nFor type safety.');
    fs.writeFileSync(path.join(dir, 'forge-memory', 'patterns.md'), '# Patterns\n\n## Error handling\nAlways catch.');
    const graph = buildGraph(dir);
    assert.ok(graph.nodes.size >= 2);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('handles empty project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-empty-'));
    const graph = buildGraph(dir);
    assert.strictEqual(graph.nodes.size, 0);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: i18n
// ─────────────────────────────────────────────────────────────────────────────

describe('i18n - module structure', () => {
  const i18n = require('../src/i18n');

  it('exports t', () => { assert.strictEqual(typeof i18n.t, 'function'); });
  it('exports detectLanguage', () => { assert.strictEqual(typeof i18n.detectLanguage, 'function'); });
  it('exports getAvailableLanguages', () => { assert.strictEqual(typeof i18n.getAvailableLanguages, 'function'); });
  it('exports TRANSLATIONS', () => { assert.ok(i18n.TRANSLATIONS); });
});

describe('i18n - translation', () => {
  const { t, getAvailableLanguages, TRANSLATIONS } = require('../src/i18n');

  it('returns English by default', () => {
    assert.strictEqual(t('common.yes', {}, 'en'), 'yes');
    assert.strictEqual(t('common.no', {}, 'en'), 'no');
  });

  it('returns Spanish translations', () => {
    assert.strictEqual(t('common.yes', {}, 'es'), 'sí');
    assert.strictEqual(t('common.cancel', {}, 'es'), 'Cancelado.');
  });

  it('returns German translations', () => {
    assert.strictEqual(t('common.yes', {}, 'de'), 'ja');
  });

  it('returns Japanese translations', () => {
    assert.strictEqual(t('common.yes', {}, 'ja'), 'はい');
  });

  it('interpolates parameters', () => {
    assert.strictEqual(t('init.created', { file: 'test.md' }, 'en'), 'Created test.md');
    assert.strictEqual(t('init.complete', { count: 5 }, 'en'), '5 file(s) created.');
  });

  it('falls back to English for missing keys', () => {
    assert.strictEqual(t('init.complete', { count: 3 }, 'ja'), '3 個のファイルを作成しました');
  });

  it('returns key when no translation exists', () => {
    assert.strictEqual(t('nonexistent.key', {}, 'en'), 'nonexistent.key');
  });

  it('lists available languages', () => {
    const langs = getAvailableLanguages();
    assert.ok(langs.length >= 5);
    assert.ok(langs.some((l) => l.code === 'en'));
    assert.ok(langs.some((l) => l.code === 'es'));
    assert.ok(langs.some((l) => l.code === 'ja'));
  });

  it('has translations for all supported languages', () => {
    for (const code of ['en', 'es', 'de', 'pt', 'ja']) {
      assert.ok(TRANSLATIONS[code], `Missing translations for ${code}`);
      assert.ok(Object.keys(TRANSLATIONS[code]).length >= 5, `${code} has too few keys`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI routing for Phase 20 commands
// ─────────────────────────────────────────────────────────────────────────────

describe('CLI routing - Phase 20 commands', () => {
  const { execSync } = require('child_process');
  const binPath = path.resolve(__dirname, '..', 'bin', 'copilotforge.js');

  it('help includes compose', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('compose'), 'help should mention compose');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('compose'));
    }
  });

  it('help includes test-agents', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('test-agents'), 'help should mention test-agents');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('test-agents'));
    }
  });

  it('help includes graph', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('graph'), 'help should mention graph');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('graph'));
    }
  });

  it('help includes generate-code', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('generate-code'), 'help should mention generate-code');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('generate-code'));
    }
  });

  it('help includes workspace', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('workspace'), 'help should mention workspace');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('workspace'));
    }
  });

  it('help includes federation', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('federation'), 'help should mention federation');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('federation'));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: LLM Code Generation
// ─────────────────────────────────────────────────────────────────────────────

describe('llm-generate - module structure', () => {
  const lg = require('../src/llm-generate');

  it('exports run', () => { assert.strictEqual(typeof lg.run, 'function'); });
  it('exports buildSystemPrompt', () => { assert.strictEqual(typeof lg.buildSystemPrompt, 'function'); });
  it('exports buildUserPrompt', () => { assert.strictEqual(typeof lg.buildUserPrompt, 'function'); });
  it('exports extractCode', () => { assert.strictEqual(typeof lg.extractCode, 'function'); });
  it('exports suggestFilename', () => { assert.strictEqual(typeof lg.suggestFilename, 'function'); });
  it('exports generateLocally', () => { assert.strictEqual(typeof lg.generateLocally, 'function'); });
});

describe('llm-generate - prompt building', () => {
  const { buildSystemPrompt, buildUserPrompt, extractCode, suggestFilename, generateLocally } = require('../src/llm-generate');

  it('builds system prompt with project context', () => {
    const prompt = buildSystemPrompt(process.cwd());
    assert.ok(prompt.includes('CopilotForge'));
    assert.ok(prompt.length > 50);
  });

  it('builds user prompt from description', () => {
    const prompt = buildUserPrompt('Create a REST endpoint', null);
    assert.ok(prompt.includes('REST endpoint'));
  });

  it('builds user prompt with context file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-ctx-'));
    const file = path.join(dir, 'app.js');
    fs.writeFileSync(file, 'const express = require("express");');
    const prompt = buildUserPrompt('Add middleware', file);
    assert.ok(prompt.includes('express'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('extracts code blocks from response', () => {
    const response = 'Here is the code:\n```js\nconst x = 1;\n```\nDone.';
    const blocks = extractCode(response);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].language, 'js');
    assert.ok(blocks[0].code.includes('const x = 1'));
  });

  it('suggests appropriate filenames', () => {
    assert.ok(suggestFilename('Create test suite', 'javascript').includes('test'));
    assert.ok(suggestFilename('Add API route', 'typescript').includes('route'));
    assert.ok(suggestFilename('Build config', 'javascript').includes('config'));
  });

  it('generates locally for REST endpoint', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lg-local-'));
    const result = generateLocally('Create an express REST endpoint', dir);
    assert.ok(result.filename);
    assert.ok(result.code.includes('router'));
    assert.strictEqual(result.method, 'template');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('generates locally for tests', () => {
    const result = generateLocally('Write test specs', os.tmpdir());
    assert.ok(result.filename.includes('test'));
    assert.ok(result.code.includes('describe'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: Workspace Integration
// ─────────────────────────────────────────────────────────────────────────────

describe('workspace - module structure', () => {
  const ws = require('../src/workspace');

  it('exports run', () => { assert.strictEqual(typeof ws.run, 'function'); });
  it('exports extractTasks', () => { assert.strictEqual(typeof ws.extractTasks, 'function'); });
  it('exports exportForWorkspace', () => { assert.strictEqual(typeof ws.exportForWorkspace, 'function'); });
  it('exports getWorkspaceStatus', () => { assert.strictEqual(typeof ws.getWorkspaceStatus, 'function'); });
});

describe('workspace - task extraction', () => {
  const { extractTasks, exportForWorkspace, getWorkspaceStatus } = require('../src/workspace');

  it('extracts tasks from plan', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-tasks-'));
    fs.writeFileSync(path.join(dir, 'IMPLEMENTATION_PLAN.md'), '# Plan\n\n- [ ] task-1 — First task\n- [x] task-2 — Done task\n- [!] task-3 — Failed\n');
    const tasks = extractTasks(dir);
    assert.strictEqual(tasks.length, 3);
    assert.strictEqual(tasks[0].status, 'pending');
    assert.strictEqual(tasks[1].status, 'done');
    assert.strictEqual(tasks[2].status, 'failed');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('exports pending tasks', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-export-'));
    fs.writeFileSync(path.join(dir, 'IMPLEMENTATION_PLAN.md'), '- [ ] setup — Initialize\n- [ ] build — Build app\n- [x] done — Completed\n');
    const data = exportForWorkspace(dir);
    assert.strictEqual(data.pendingTasks, 2);
    assert.strictEqual(data.completedTasks, 1);
    assert.ok(data.tasks.length >= 2);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns status with progress', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-status-'));
    fs.writeFileSync(path.join(dir, 'IMPLEMENTATION_PLAN.md'), '- [x] a — Done\n- [x] b — Done\n- [ ] c — Pending\n');
    const status = getWorkspaceStatus(dir);
    assert.strictEqual(status.completed, 2);
    assert.strictEqual(status.pending, 1);
    assert.strictEqual(status.progress, 67);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('handles empty project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-empty-'));
    const tasks = extractTasks(dir);
    assert.strictEqual(tasks.length, 0);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 20: Federation
// ─────────────────────────────────────────────────────────────────────────────

describe('federation - module structure', () => {
  const fed = require('../src/federation');

  it('exports run', () => { assert.strictEqual(typeof fed.run, 'function'); });
  it('exports buildManifest', () => { assert.strictEqual(typeof fed.buildManifest, 'function'); });
  it('exports publishManifest', () => { assert.strictEqual(typeof fed.publishManifest, 'function'); });
  it('exports discoverFederated', () => { assert.strictEqual(typeof fed.discoverFederated, 'function'); });
});

describe('federation - manifest building', () => {
  const { buildManifest, publishManifest, discoverFederated } = require('../src/federation');

  it('builds manifest from project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fed-build-'));
    fs.mkdirSync(path.join(dir, '.github', 'skills', 'planner'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.github', 'skills', 'planner', 'SKILL.md'), '# Planner\n\n> Plans projects');
    const manifest = buildManifest(dir);
    assert.ok(manifest.items.length >= 1);
    assert.ok(manifest.items.some((i) => i.type === 'skill'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('publishes manifest file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fed-pub-'));
    fs.mkdirSync(path.join(dir, '.github', 'skills', 'test'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.github', 'skills', 'test', 'SKILL.md'), '# Test');
    const result = publishManifest(dir);
    assert.ok(fs.existsSync(result.path));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('discovers from sources', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fed-disc-'));
    // Create a source with manifest
    const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fed-src-'));
    fs.mkdirSync(path.join(srcDir, '.copilotforge', 'federation'), { recursive: true });
    fs.writeFileSync(path.join(srcDir, '.copilotforge', 'federation', 'manifest.json'), JSON.stringify({
      project: 'test-source', items: [{ type: 'skill', name: 'shared-skill', title: 'Shared' }],
    }));
    const discovered = discoverFederated([srcDir]);
    assert.ok(discovered.length >= 1);
    assert.ok(discovered.some((d) => d.name === 'shared-skill'));
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(srcDir, { recursive: true, force: true });
  });

  it('returns empty for no sources', () => {
    const discovered = discoverFederated([]);
    assert.strictEqual(discovered.length, 0);
  });
});
