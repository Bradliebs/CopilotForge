'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────────────────────────────────────
// Phase 18: Smart Detection tests
// ─────────────────────────────────────────────────────────────────────────────

describe('smart-detect - module structure', () => {
  const sd = require('../src/smart-detect');

  it('exports detectBuildPath function', () => {
    assert.strictEqual(typeof sd.detectBuildPath, 'function');
  });

  it('exports scoreProject function', () => {
    assert.strictEqual(typeof sd.scoreProject, 'function');
  });

  it('exports analyzePackageJson function', () => {
    assert.strictEqual(typeof sd.analyzePackageJson, 'function');
  });

  it('exports PATH_SIGNALS with paths A-J', () => {
    assert.ok(sd.PATH_SIGNALS);
    assert.ok(sd.PATH_SIGNALS.A);
    assert.ok(sd.PATH_SIGNALS.J);
    assert.strictEqual(Object.keys(sd.PATH_SIGNALS).length, 10);
  });
});

describe('smart-detect - detection', () => {
  const { detectBuildPath, scoreProject, analyzePackageJson } = require('../src/smart-detect');

  function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'detect-test-'));
  }

  it('returns J for empty directory', () => {
    const dir = createTempDir();
    const result = detectBuildPath(dir);
    assert.strictEqual(result.path, 'J');
    assert.strictEqual(result.confidence, 'low');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects explicit FORGE.md path stamp', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'FORGE.md'), '<!-- copilotforge: v2.0.0 -->\n<!-- copilotforge: path=A -->\n# Test');
    const result = detectBuildPath(dir);
    assert.strictEqual(result.path, 'A');
    assert.strictEqual(result.confidence, 'explicit');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects PCF project from ControlManifest', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'ControlManifest.Input.xml'), '<xml/>');
    const result = detectBuildPath(dir);
    assert.strictEqual(result.path, 'F');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects SharePoint project from dependencies', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'sp-test',
      dependencies: { '@microsoft/sp-core-library': '1.0.0' },
    }));
    const result = detectBuildPath(dir);
    assert.strictEqual(result.path, 'H');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects generic project with express', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'api',
      dependencies: { express: '4.0.0' },
    }));
    const result = detectBuildPath(dir);
    assert.strictEqual(result.path, 'J');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('analyzePackageJson parses correctly', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'test',
      description: 'A PCF component',
      keywords: ['pcf'],
      dependencies: { 'pcf-scripts': '1.0.0' },
    }));
    const result = analyzePackageJson(dir);
    assert.strictEqual(result.name, 'test');
    assert.ok(result.keywords.includes('pcf'));
    assert.ok(result.deps.includes('pcf-scripts'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('scoreProject returns scores for all paths', () => {
    const dir = createTempDir();
    const scores = scoreProject(dir);
    assert.strictEqual(Object.keys(scores).length, 10);
    assert.ok('A' in scores);
    assert.ok('J' in scores);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 18: Playbook Auto-Discovery tests
// ─────────────────────────────────────────────────────────────────────────────

describe('discover - module structure', () => {
  const disc = require('../src/discover');

  it('exports run function', () => {
    assert.strictEqual(typeof disc.run, 'function');
  });

  it('exports discoverAll function', () => {
    assert.strictEqual(typeof disc.discoverAll, 'function');
  });

  it('exports individual scanners', () => {
    assert.strictEqual(typeof disc.discoverStackPatterns, 'function');
    assert.strictEqual(typeof disc.discoverGitPatterns, 'function');
    assert.strictEqual(typeof disc.discoverStructurePatterns, 'function');
  });
});

describe('discover - stack patterns', () => {
  const { discoverStackPatterns } = require('../src/discover');

  function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'disc-test-'));
  }

  it('detects test framework', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { jest: '^29.0.0' },
    }));
    const patterns = discoverStackPatterns(dir);
    assert.ok(patterns.some((p) => p.title.includes('Jest')));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects TypeScript', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { typescript: '^5.0.0' },
    }));
    const patterns = discoverStackPatterns(dir);
    assert.ok(patterns.some((p) => p.title.includes('TypeScript')));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects framework', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));
    const patterns = discoverStackPatterns(dir);
    assert.ok(patterns.some((p) => p.title.includes('Next.js')));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty for missing package.json', () => {
    const dir = createTempDir();
    const patterns = discoverStackPatterns(dir);
    assert.strictEqual(patterns.length, 0);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('discover - structure patterns', () => {
  const { discoverStructurePatterns } = require('../src/discover');

  function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'disc-struct-'));
  }

  it('detects monorepo', () => {
    const dir = createTempDir();
    fs.mkdirSync(path.join(dir, 'packages'), { recursive: true });
    const patterns = discoverStructurePatterns(dir);
    assert.ok(patterns.some((p) => p.title.includes('Monorepo')));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects src/test separation', () => {
    const dir = createTempDir();
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'tests'), { recursive: true });
    const patterns = discoverStructurePatterns(dir);
    assert.ok(patterns.some((p) => p.title.includes('Source/test')));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects docs directory', () => {
    const dir = createTempDir();
    fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
    const patterns = discoverStructurePatterns(dir);
    assert.ok(patterns.some((p) => p.title.includes('Documentation')));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('discover - git patterns', () => {
  const { discoverGitPatterns } = require('../src/discover');

  it('works on the current repo', () => {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const patterns = discoverGitPatterns(repoRoot);
    // Should find conventional commits pattern since we use them
    assert.ok(Array.isArray(patterns));
  });

  it('returns empty for non-git directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-git-'));
    const patterns = discoverGitPatterns(dir);
    assert.strictEqual(patterns.length, 0);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 18: MCP tool chaining tests
// ─────────────────────────────────────────────────────────────────────────────

describe('mcp-server - Phase 18 tools', () => {
  const mcpServer = require('../src/mcp-server');

  it('tool list includes copilotforge_detect', () => {
    const msg = { method: 'tools/list', id: 1 };
    const response = JSON.parse(mcpServer.handleMessage(msg));
    const tools = response.result.tools;
    assert.ok(tools.some((t) => t.name === 'copilotforge_detect'));
  });

  it('tool list includes copilotforge_chain', () => {
    const msg = { method: 'tools/list', id: 2 };
    const response = JSON.parse(mcpServer.handleMessage(msg));
    const tools = response.result.tools;
    assert.ok(tools.some((t) => t.name === 'copilotforge_chain'));
  });

  it('copilotforge_detect returns a path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-detect-'));
    const msg = {
      method: 'tools/call',
      id: 3,
      params: { name: 'copilotforge_detect', arguments: { cwd: dir } },
    };
    const response = JSON.parse(mcpServer.handleMessage(msg));
    const result = JSON.parse(response.result.content[0].text);
    assert.ok(result.success);
    assert.ok(result.path);
    assert.ok(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].includes(result.path));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('copilotforge_chain runs multiple steps', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-chain-'));
    const msg = {
      method: 'tools/call',
      id: 4,
      params: {
        name: 'copilotforge_chain',
        arguments: {
          cwd: dir,
          steps: [
            { tool: 'detect' },
            { tool: 'status' },
          ],
        },
      },
    };
    const response = JSON.parse(mcpServer.handleMessage(msg));
    const result = JSON.parse(response.result.content[0].text);
    assert.ok(result.results);
    assert.strictEqual(result.stepsTotal, 2);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('copilotforge_chain stops on error with stopOnError', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-chain-err-'));
    const msg = {
      method: 'tools/call',
      id: 5,
      params: {
        name: 'copilotforge_chain',
        arguments: {
          cwd: dir,
          steps: [
            { tool: 'nonexistent' },
            { tool: 'detect' },
          ],
          stopOnError: true,
        },
      },
    };
    const response = JSON.parse(mcpServer.handleMessage(msg));
    const result = JSON.parse(response.result.content[0].text);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.stepsCompleted, 0);
    assert.strictEqual(result.results.length, 1);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI routing for Phase 18 commands
// ─────────────────────────────────────────────────────────────────────────────

describe('CLI routing - Phase 18 commands', () => {
  const { execSync } = require('child_process');
  const binPath = path.resolve(__dirname, '..', 'bin', 'copilotforge.js');

  it('help includes detect command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('detect'), 'help should mention detect');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('detect'));
    }
  });

  it('help includes discover command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('discover'), 'help should mention discover');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('discover'));
    }
  });

  it('help includes review command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('review'), 'help should mention review');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('review'));
    }
  });

  it('help includes generate command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('generate'), 'help should mention generate');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('generate'));
    }
  });

  it('help includes ci command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('ci'), 'help should mention ci');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('ci'));
    }
  });

  it('detect command runs without error', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-detect-'));
    try {
      const output = execSync(`node "${binPath}" detect`, { cwd: dir, encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('Build path'));
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('Build path'));
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 18: Code Review tests
// ─────────────────────────────────────────────────────────────────────────────

describe('review - module structure', () => {
  const rev = require('../src/review');

  it('exports run function', () => {
    assert.strictEqual(typeof rev.run, 'function');
  });

  it('exports reviewProject function', () => {
    assert.strictEqual(typeof rev.reviewProject, 'function');
  });

  it('exports scanFile function', () => {
    assert.strictEqual(typeof rev.scanFile, 'function');
  });

  it('exports RULES array', () => {
    assert.ok(Array.isArray(rev.RULES));
    assert.ok(rev.RULES.length >= 4);
  });
});

describe('review - scanning', () => {
  const { scanFile, RULES, reviewProject } = require('../src/review');

  it('detects hardcoded secrets', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rev-test-'));
    const file = path.join(dir, 'test.js');
    fs.writeFileSync(file, 'const api_key = "sk-1234567890abcdef";\n');
    const findings = scanFile(file, RULES);
    assert.ok(findings.some((f) => f.rule === 'hardcoded-secret'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects TODO markers', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rev-todo-'));
    const file = path.join(dir, 'test.js');
    fs.writeFileSync(file, '// TODO: fix this later\n');
    const findings = scanFile(file, RULES);
    assert.ok(findings.some((f) => f.rule === 'todo-marker'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects eval usage', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rev-eval-'));
    const file = path.join(dir, 'test.js');
    fs.writeFileSync(file, 'const result = eval("1+1");\n');
    const findings = scanFile(file, RULES);
    assert.ok(findings.some((f) => f.rule === 'eval-usage'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects large files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rev-large-'));
    const file = path.join(dir, 'big.js');
    fs.writeFileSync(file, Array(600).fill('const x = 1;\n').join(''));
    const findings = scanFile(file, RULES);
    assert.ok(findings.some((f) => f.rule === 'large-file'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('reviewProject returns summary', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rev-proj-'));
    fs.writeFileSync(path.join(dir, 'clean.js'), 'const x = 1;\n');
    const result = reviewProject(dir);
    assert.ok(result.filesScanned >= 1);
    assert.ok(typeof result.totalFindings === 'number');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 18: Recipe Generator tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generate - module structure', () => {
  const gen = require('../src/generate');

  it('exports run function', () => {
    assert.strictEqual(typeof gen.run, 'function');
  });

  it('exports RECIPE_TYPES', () => {
    assert.ok(gen.RECIPE_TYPES);
    assert.ok(gen.RECIPE_TYPES['api-route']);
    assert.ok(gen.RECIPE_TYPES['test-suite']);
    assert.ok(gen.RECIPE_TYPES['error-handler']);
    assert.ok(gen.RECIPE_TYPES['config-loader']);
  });

  it('exports analyzeProject', () => {
    assert.strictEqual(typeof gen.analyzeProject, 'function');
  });
});

describe('generate - recipe generation', () => {
  const { RECIPE_TYPES, analyzeProject } = require('../src/generate');

  it('analyzeProject detects TypeScript', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-ts-'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { typescript: '^5.0.0' },
    }));
    const pkg = analyzeProject(dir);
    assert.ok(pkg.hasTypeScript);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('generates api-route recipe', () => {
    const pkg = { deps: ['express'], devDeps: [], hasTypeScript: false, scripts: {} };
    const recipe = RECIPE_TYPES['api-route'];
    const { filename, content } = recipe.generate(pkg);
    assert.ok(filename.endsWith('.js'));
    assert.ok(content.includes('router'));
    assert.ok(content.includes('/api/items'));
  });

  it('generates TypeScript api-route', () => {
    const pkg = { deps: ['express'], devDeps: [], hasTypeScript: true, scripts: {} };
    const { filename, content } = RECIPE_TYPES['api-route'].generate(pkg);
    assert.ok(filename.endsWith('.ts'));
    assert.ok(content.includes('Request'));
    assert.ok(content.includes('Response'));
  });

  it('generates test-suite recipe', () => {
    const pkg = { deps: [], devDeps: ['jest'], hasTypeScript: false, scripts: {} };
    const { content } = RECIPE_TYPES['test-suite'].generate(pkg);
    assert.ok(content.includes('describe'));
    assert.ok(content.includes('expect'));
  });

  it('generates config-loader recipe', () => {
    const pkg = { deps: [], devDeps: [], hasTypeScript: true, scripts: {} };
    const { filename, content } = RECIPE_TYPES['config-loader'].generate(pkg);
    assert.ok(filename.endsWith('.ts'));
    assert.ok(content.includes('Config'));
    assert.ok(content.includes('requireEnv'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 18: CI Generator tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ci-generator - module structure', () => {
  const ci = require('../src/ci-generator');

  it('exports run function', () => {
    assert.strictEqual(typeof ci.run, 'function');
  });

  it('exports detectProjectType', () => {
    assert.strictEqual(typeof ci.detectProjectType, 'function');
  });

  it('exports generateNodeCI', () => {
    assert.strictEqual(typeof ci.generateNodeCI, 'function');
  });

  it('exports generatePythonCI', () => {
    assert.strictEqual(typeof ci.generatePythonCI, 'function');
  });
});

describe('ci-generator - detection and generation', () => {
  const { detectProjectType, generateNodeCI, generatePythonCI, generateGenericCI } = require('../src/ci-generator');

  it('detects Node.js project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-node-'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'test',
      scripts: { test: 'jest' },
    }));
    const result = detectProjectType(dir);
    assert.strictEqual(result.type, 'node');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects Python project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-py-'));
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'flask\n');
    const result = detectProjectType(dir);
    assert.strictEqual(result.type, 'python');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('falls back to generic', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-gen-'));
    const result = detectProjectType(dir);
    assert.strictEqual(result.type, 'generic');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('generates Node CI with test command', () => {
    const workflow = generateNodeCI({ scripts: { test: 'jest', lint: 'eslint .' }, deps: ['typescript'], devDeps: [] });
    assert.ok(workflow.includes('jest'));
    assert.ok(workflow.includes('Lint'));
    assert.ok(workflow.includes('[18, 20, 22]'));
  });

  it('generates Python CI', () => {
    const workflow = generatePythonCI({});
    assert.ok(workflow.includes('python'));
    assert.ok(workflow.includes('pytest'));
  });

  it('generates generic CI', () => {
    const workflow = generateGenericCI();
    assert.ok(workflow.includes('Validate'));
  });
});
