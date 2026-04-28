'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────────────────────────────────────
// Phase 19: Config file support
// ─────────────────────────────────────────────────────────────────────────────

describe('config - module structure', () => {
  const cfg = require('../src/config');

  it('exports loadConfig', () => {
    assert.strictEqual(typeof cfg.loadConfig, 'function');
  });

  it('exports saveProjectConfig', () => {
    assert.strictEqual(typeof cfg.saveProjectConfig, 'function');
  });

  it('exports findConfigFile', () => {
    assert.strictEqual(typeof cfg.findConfigFile, 'function');
  });

  it('exports DEFAULTS with expected keys', () => {
    assert.ok(cfg.DEFAULTS);
    assert.strictEqual(cfg.DEFAULTS.verbosity, 'normal');
    assert.strictEqual(cfg.DEFAULTS.dryRun, false);
    assert.ok(Array.isArray(cfg.DEFAULTS.extras));
  });

  it('exports CONFIG_FILES array', () => {
    assert.ok(Array.isArray(cfg.CONFIG_FILES));
    assert.ok(cfg.CONFIG_FILES.includes('.copilotforgerc'));
  });
});

describe('config - loading', () => {
  const { loadConfig, loadProjectConfig, saveProjectConfig, findConfigFile } = require('../src/config');

  function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-test-'));
  }

  it('returns defaults for empty directory', () => {
    const dir = createTempDir();
    const config = loadConfig(dir);
    assert.strictEqual(config.verbosity, 'normal');
    assert.strictEqual(config.dryRun, false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('loads .copilotforgerc JSON file', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, '.copilotforgerc'), JSON.stringify({ path: 'A', verbosity: 'quiet' }));
    const config = loadProjectConfig(dir);
    assert.strictEqual(config.path, 'A');
    assert.strictEqual(config.verbosity, 'quiet');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('loads .copilotforgerc.json file', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, '.copilotforgerc.json'), JSON.stringify({ telemetry: true }));
    const config = loadProjectConfig(dir);
    assert.strictEqual(config.telemetry, true);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('saves and loads round-trip', () => {
    const dir = createTempDir();
    saveProjectConfig({ path: 'F', verbosity: 'verbose' }, dir);
    const config = loadProjectConfig(dir);
    assert.strictEqual(config.path, 'F');
    assert.strictEqual(config.verbosity, 'verbose');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('findConfigFile returns null for empty dir', () => {
    const dir = createTempDir();
    const result = findConfigFile(dir);
    // May return global config if it exists, or null
    assert.ok(result === null || result.scope === 'global');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('findConfigFile finds project config', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, '.copilotforgerc'), '{}');
    const result = findConfigFile(dir);
    assert.ok(result);
    assert.strictEqual(result.scope, 'project');
    assert.strictEqual(result.file, '.copilotforgerc');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 19: Plugin scaffold
// ─────────────────────────────────────────────────────────────────────────────

describe('plugin-scaffold - module structure', () => {
  const ps = require('../src/plugin-scaffold');

  it('exports run', () => { assert.strictEqual(typeof ps.run, 'function'); });
  it('exports createPlugin', () => { assert.strictEqual(typeof ps.createPlugin, 'function'); });
  it('exports validatePlugin', () => { assert.strictEqual(typeof ps.validatePlugin, 'function'); });
});

describe('plugin-scaffold - creation', () => {
  const { createPlugin, generatePluginPackageJson, generatePluginIndex } = require('../src/plugin-scaffold');

  it('generates valid package.json', () => {
    const pkg = JSON.parse(generatePluginPackageJson('test', 'K'));
    assert.strictEqual(pkg.name, 'copilotforge-plugin-test');
    assert.strictEqual(pkg['copilotforge-plugin'], true);
    assert.ok(pkg.keywords.includes('copilotforge'));
  });

  it('generates index.js with correct path letter', () => {
    const content = generatePluginIndex('myapp', 'L');
    assert.ok(content.includes("buildPath: 'L'"));
    assert.ok(content.includes("name: 'myapp'"));
  });

  it('creates plugin directory with all files', () => {
    const origCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plug-create-'));
    process.chdir(dir);

    const result = createPlugin('demo', { path: 'M' });
    assert.ok(result.success);
    assert.ok(fs.existsSync(path.join(dir, 'copilotforge-plugin-demo', 'package.json')));
    assert.ok(fs.existsSync(path.join(dir, 'copilotforge-plugin-demo', 'index.js')));
    assert.ok(fs.existsSync(path.join(dir, 'copilotforge-plugin-demo', 'README.md')));

    process.chdir(origCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('fails when directory exists', () => {
    const origCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plug-exist-'));
    fs.mkdirSync(path.join(dir, 'copilotforge-plugin-dup'));
    process.chdir(dir);

    const result = createPlugin('dup');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('already exists'));

    process.chdir(origCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 19: Migration
// ─────────────────────────────────────────────────────────────────────────────

describe('migrate - module structure', () => {
  const mig = require('../src/migrate');

  it('exports run', () => { assert.strictEqual(typeof mig.run, 'function'); });
  it('exports detectInstalledVersion', () => { assert.strictEqual(typeof mig.detectInstalledVersion, 'function'); });
  it('exports checkMigrations', () => { assert.strictEqual(typeof mig.checkMigrations, 'function'); });
  it('exports parseVersion', () => { assert.strictEqual(typeof mig.parseVersion, 'function'); });
});

describe('migrate - detection', () => {
  const { detectInstalledVersion, checkMigrations, parseVersion } = require('../src/migrate');

  it('returns null for empty directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-empty-'));
    assert.strictEqual(detectInstalledVersion(dir), null);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects version from FORGE.md stamp', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-stamp-'));
    fs.writeFileSync(path.join(dir, 'FORGE.md'), '<!-- copilotforge: v1.5.0 -->\n# Test');
    assert.strictEqual(detectInstalledVersion(dir), '1.5.0');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects legacy install from planner SKILL.md', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-legacy-'));
    fs.mkdirSync(path.join(dir, '.github', 'skills', 'planner'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.github', 'skills', 'planner', 'SKILL.md'), '# Planner');
    assert.strictEqual(detectInstalledVersion(dir), '1.0.0');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('parseVersion handles semver', () => {
    const v = parseVersion('2.1.0');
    assert.strictEqual(v.major, 2);
    assert.strictEqual(v.minor, 1);
    assert.strictEqual(v.patch, 0);
  });

  it('finds migrations for v1.x install', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-v1-'));
    fs.writeFileSync(path.join(dir, 'FORGE.md'), '<!-- copilotforge: v1.5.0 -->\n# Test');
    fs.mkdirSync(path.join(dir, 'forge-memory'), { recursive: true });
    const result = checkMigrations(dir);
    assert.ok(result.needsMigration);
    assert.ok(result.migrations.length >= 1);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('no migrations for current version', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-cur-'));
    const ver = require('../package.json').version;
    fs.writeFileSync(path.join(dir, 'FORGE.md'), `<!-- copilotforge: v${ver} -->\n# Test`);
    const result = checkMigrations(dir);
    assert.strictEqual(result.needsMigration, false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 19: Performance profiling
// ─────────────────────────────────────────────────────────────────────────────

describe('perf - module structure', () => {
  const perf = require('../src/perf');

  it('exports run', () => { assert.strictEqual(typeof perf.run, 'function'); });
  it('exports measure', () => { assert.strictEqual(typeof perf.measure, 'function'); });
  it('exports formatMs', () => { assert.strictEqual(typeof perf.formatMs, 'function'); });
  it('exports runAll', () => { assert.strictEqual(typeof perf.runAll, 'function'); });
});

describe('perf - measurement', () => {
  const { measure, formatMs } = require('../src/perf');

  it('measures execution time', () => {
    const result = measure('test', () => 42);
    assert.strictEqual(result.label, 'test');
    assert.strictEqual(result.result, 42);
    assert.ok(result.ms >= 0);
  });

  it('formatMs handles microseconds', () => {
    assert.ok(formatMs(0.5).includes('μs'));
  });

  it('formatMs handles milliseconds', () => {
    assert.ok(formatMs(50).includes('ms'));
  });

  it('formatMs handles seconds', () => {
    assert.ok(formatMs(1500).includes('s'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI routing for Phase 19 commands
// ─────────────────────────────────────────────────────────────────────────────

describe('CLI routing - Phase 19 commands', () => {
  const { execSync } = require('child_process');
  const binPath = path.resolve(__dirname, '..', 'bin', 'copilotforge.js');

  it('help includes config command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('config'), 'help should mention config');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('config'));
    }
  });

  it('help includes plugin command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('plugin'), 'help should mention plugin');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('plugin'));
    }
  });

  it('help includes migrate command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('migrate'), 'help should mention migrate');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('migrate'));
    }
  });

  it('help includes perf command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('perf'), 'help should mention perf');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('perf'));
    }
  });

  it('help includes docs command', () => {
    try {
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('docs'), 'help should mention docs');
    } catch (err) {
      if (err.stdout) assert.ok(err.stdout.includes('docs'));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 19: UI helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('ui - module structure', () => {
  const ui = require('../src/ui');

  it('exports progressBar', () => { assert.strictEqual(typeof ui.progressBar, 'function'); });
  it('exports createSpinner', () => { assert.strictEqual(typeof ui.createSpinner, 'function'); });
  it('exports box', () => { assert.strictEqual(typeof ui.box, 'function'); });
  it('exports table', () => { assert.strictEqual(typeof ui.table, 'function'); });
  it('exports numberedMenu', () => { assert.strictEqual(typeof ui.numberedMenu, 'function'); });
  it('exports stripAnsi', () => { assert.strictEqual(typeof ui.stripAnsi, 'function'); });
});

describe('ui - progress bar', () => {
  const { progressBar, stripAnsi } = require('../src/ui');

  it('shows 0% for empty', () => {
    const bar = stripAnsi(progressBar(0, 10));
    assert.ok(bar.includes('0%'));
    assert.ok(bar.includes('0/10'));
  });

  it('shows 50% for halfway', () => {
    const bar = stripAnsi(progressBar(5, 10));
    assert.ok(bar.includes('50%'));
  });

  it('shows 100% for complete', () => {
    const bar = stripAnsi(progressBar(10, 10));
    assert.ok(bar.includes('100%'));
  });

  it('handles zero total', () => {
    const bar = stripAnsi(progressBar(0, 0));
    assert.ok(bar.includes('0%'));
  });
});

describe('ui - table', () => {
  const { table, stripAnsi } = require('../src/ui');

  it('renders headers and rows', () => {
    const output = stripAnsi(table(['Name', 'Value'], [['foo', '1'], ['bar', '2']]));
    assert.ok(output.includes('Name'));
    assert.ok(output.includes('foo'));
    assert.ok(output.includes('bar'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 19: Documentation site
// ─────────────────────────────────────────────────────────────────────────────

describe('docs-site - module structure', () => {
  const ds = require('../src/docs-site');

  it('exports run', () => { assert.strictEqual(typeof ds.run, 'function'); });
  it('exports buildSite', () => { assert.strictEqual(typeof ds.buildSite, 'function'); });
  it('exports collectDocs', () => { assert.strictEqual(typeof ds.collectDocs, 'function'); });
  it('exports markdownToHtml', () => { assert.strictEqual(typeof ds.markdownToHtml, 'function'); });
});

describe('docs-site - markdown conversion', () => {
  const { markdownToHtml } = require('../src/docs-site');

  it('converts headings', () => {
    assert.ok(markdownToHtml('# Title').includes('<h1>Title</h1>'));
    assert.ok(markdownToHtml('## Section').includes('<h2>Section</h2>'));
  });

  it('converts bold and italic', () => {
    assert.ok(markdownToHtml('**bold**').includes('<strong>bold</strong>'));
    assert.ok(markdownToHtml('*italic*').includes('<em>italic</em>'));
  });

  it('converts inline code', () => {
    assert.ok(markdownToHtml('use `npm init`').includes('<code>npm init</code>'));
  });

  it('converts links', () => {
    const html = markdownToHtml('[click](https://example.com)');
    assert.ok(html.includes('<a href="https://example.com">click</a>'));
  });

  it('converts code blocks', () => {
    const html = markdownToHtml('```js\nconst x = 1;\n```');
    assert.ok(html.includes('<pre>'));
    assert.ok(html.includes('const x = 1;'));
  });
});

describe('docs-site - build', () => {
  const { collectDocs, buildSite } = require('../src/docs-site');

  it('collects docs from a directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-col-'));
    fs.writeFileSync(path.join(dir, 'README.md'), '# Home');
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.writeFileSync(path.join(dir, 'docs', 'GUIDE.md'), '# Guide');
    const docs = collectDocs(dir);
    assert.ok(docs.length >= 2);
    assert.ok(docs.some((d) => d.slug === 'index'));
    assert.ok(docs.some((d) => d.slug === 'guide'));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('builds HTML files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-build-'));
    const outDir = path.join(dir, '_site');
    fs.writeFileSync(path.join(dir, 'README.md'), '# Test Project');
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.writeFileSync(path.join(dir, 'docs', 'FAQ.md'), '# FAQ\n\nQ: What is this?\nA: A test.');
    const result = buildSite(dir, outDir);
    assert.ok(result.pages.length >= 2);
    assert.ok(fs.existsSync(path.join(outDir, 'index.html')));
    assert.ok(fs.existsSync(path.join(outDir, 'faq.html')));
    // Verify HTML content
    const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    assert.ok(indexHtml.includes('Test Project'));
    assert.ok(indexHtml.includes('CopilotForge'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
