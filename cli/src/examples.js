'use strict';

const fs = require('fs');
const path = require('path');
const { banner, colors, separator, info, success, warn, fail } = require('./utils');

const REGISTRY_URL = 'https://raw.githubusercontent.com/Bradliebs/copilotforge-examples/main/registry.json';

// ── Built-in registry (offline fallback) ────────────────────────────────

const BUILTIN_EXAMPLES = [
  { name: 'hello-agent', description: 'Minimal Copilot Studio agent — beginner friendly', path: 'A', tags: ['beginner', 'copilot-studio'] },
  { name: 'canvas-todo', description: 'Canvas App with Copilot AI control — to-do list', path: 'D', tags: ['beginner', 'canvas-app', 'power-fx'] },
  { name: 'pcf-rating', description: 'PCF star rating component — TypeScript + pac CLI', path: 'F', tags: ['intermediate', 'pcf', 'typescript'] },
  { name: 'trading-system', description: 'Algo trading platform — PostgreSQL + Telegram alerts', path: 'J', tags: ['advanced', 'typescript', 'postgresql'] },
  { name: 'powerbi-sales', description: 'Power BI sales dashboard — DAX + semantic model', path: 'G', tags: ['intermediate', 'power-bi', 'dax'] },
];

// ── Cache management ────────────────────────────────────────────────────

function getCachePath() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.copilotforge', 'examples-cache.json');
}

function readCache() {
  const cachePath = getCachePath();
  if (!fs.existsSync(cachePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(data) {
  const cachePath = getCachePath();
  const dir = path.dirname(cachePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf8');
}

// ── Fetch registry ──────────────────────────────────────────────────────

async function fetchRegistry() {
  try {
    const response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.version && Array.isArray(data.examples)) {
      writeCache(data);
      return { examples: data.examples, source: 'remote' };
    }
    throw new Error('Invalid registry format');
  } catch {
    // Fall back to cache, then built-in
    const cached = readCache();
    if (cached && Array.isArray(cached.examples)) {
      return { examples: cached.examples, source: 'cache' };
    }
    return { examples: BUILTIN_EXAMPLES, source: 'builtin' };
  }
}

// ── Display helpers ─────────────────────────────────────────────────────

function printExampleList(examples, source) {
  info(`${colors.bold('Available Examples:')} ${colors.dim(`(${source})`)}`);
  console.log();

  for (const ex of examples) {
    const tags = ex.tags ? colors.dim(`[${ex.tags.join(', ')}]`) : '';
    console.log(`  ${colors.cyan(ex.name.padEnd(20))} ${ex.description}`);
    if (tags) console.log(`  ${' '.repeat(20)} Path ${ex.path} ${tags}`);
  }

  console.log();
  info(colors.dim('Run: npx copilotforge examples <name> to clone an example'));
}

function findExample(examples, name) {
  const lower = name.toLowerCase();
  const exact = examples.find((e) => e.name.toLowerCase() === lower);
  if (exact) return exact;

  // Fuzzy match
  const partial = examples.filter((e) => e.name.toLowerCase().includes(lower));
  return partial.length === 1 ? partial[0] : null;
}

function suggestSimilar(examples, name) {
  const lower = name.toLowerCase();
  const matches = examples
    .filter((e) => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase().slice(0, 4)))
    .map((e) => e.name);
  return matches;
}

// ── CLI command ─────────────────────────────────────────────────────────

async function run(args = []) {
  banner();
  console.log(`  ${colors.bold('📦 CopilotForge Examples')}`);
  console.log();

  const subcommand = args[0];
  const name = args[0] === 'preview' ? args[1] : args[0];

  const { examples, source } = await fetchRegistry();

  if (source === 'cache') {
    warn('Using cached examples (offline)');
    console.log();
  } else if (source === 'builtin') {
    warn('Using built-in examples (offline, no cache available)');
    console.log();
  }

  // No args: list all examples
  if (!subcommand) {
    printExampleList(examples, source);
    return;
  }

  // preview <name>: show description
  if (subcommand === 'preview' && name) {
    const example = findExample(examples, name);
    if (!example) {
      fail(`Example not found: ${name}`);
      const similar = suggestSimilar(examples, name);
      if (similar.length > 0) {
        info(`Did you mean: ${similar.join(', ')}?`);
      }
      console.log();
      return;
    }

    separator();
    console.log(`  ${colors.bold(example.name)} — Path ${example.path}`);
    console.log(`  ${example.description}`);
    if (example.tags) {
      console.log(`  ${colors.dim(`Tags: ${example.tags.join(', ')}`)}`);
    }
    separator();
    return;
  }

  // <name>: clone example
  if (name) {
    const example = findExample(examples, name);
    if (!example) {
      fail(`Example not found: ${name}`);
      const similar = suggestSimilar(examples, name);
      if (similar.length > 0) {
        info(`Did you mean: ${similar.join(', ')}?`);
      }
      console.log();
      return;
    }

    const targetDir = path.join(process.cwd(), example.name);
    if (fs.existsSync(targetDir)) {
      warn(`Directory already exists: ${example.name}/`);
      info('Rename or remove it, then try again.');
      console.log();
      return;
    }

    info(`Cloning ${colors.cyan(example.name)} (Path ${example.path})...`);

    try {
      const { execSync } = require('child_process');
      execSync(
        `git clone --depth 1 https://github.com/Bradliebs/copilotforge-examples.git "${targetDir}" 2>&1`,
        { stdio: 'pipe' }
      );
      success(`Cloned to ${example.name}/`);
    } catch {
      warn('Could not clone from GitHub. Creating scaffolded example locally...');

      // Create a minimal scaffold instead
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'README.md'),
        `# ${example.name}\n\n${example.description}\n\nPath: ${example.path}\nTags: ${(example.tags || []).join(', ')}\n\nRun \`npx copilotforge init\` to set up this project.\n`,
        'utf8'
      );
      success(`Created ${example.name}/ with README.md`);
    }

    console.log();
    info(`Next: cd ${example.name} && npx copilotforge init`);
    console.log();
  }
}

module.exports = { run, fetchRegistry, BUILTIN_EXAMPLES };
