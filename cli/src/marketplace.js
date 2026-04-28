'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, fail, exists, banner } = require('./utils');

/**
 * CopilotForge Agent Marketplace
 *
 * Discover, search, and install community agents and skills from:
 *   - GitHub-hosted registry (copilotforge-marketplace)
 *   - npm packages with `copilotforge-plugin` or `copilotforge-skill` flags
 *   - Local file-based packages
 *
 * Usage:
 *   copilotforge marketplace                  Browse featured items
 *   copilotforge marketplace search <query>   Search by keyword
 *   copilotforge marketplace install <name>   Install a skill/agent
 *   copilotforge marketplace info <name>      Show details
 *   copilotforge marketplace list             List installed marketplace items
 */

const REGISTRY_URL = 'https://raw.githubusercontent.com/Bradliebs/copilotforge-marketplace/main/registry.json';

// ── Built-in registry (offline fallback) ────────────────────────────────

const BUILTIN_REGISTRY = {
  version: '1.0.0',
  updated: '2026-04-28',
  items: [
    {
      name: 'oracle-prime',
      type: 'skill',
      description: 'Adaptive precision reasoning framework with Bayesian analysis',
      author: 'copilotforge',
      version: '1.0.0',
      tags: ['reasoning', 'analysis', 'decision-making'],
      install: 'builtin',
      downloads: 0,
    },
    {
      name: 'plan-executor',
      type: 'skill',
      description: 'Autonomous plan execution with task validation and commit workflow',
      author: 'copilotforge',
      version: '1.0.0',
      tags: ['automation', 'planning', 'execution'],
      install: 'builtin',
      downloads: 0,
    },
    {
      name: 'forge-compass',
      type: 'skill',
      description: 'Pre-scaffold gate for build-path detection and prerequisite checks',
      author: 'copilotforge',
      version: '1.0.0',
      tags: ['scaffolding', 'detection', 'validation'],
      install: 'builtin',
      downloads: 0,
    },
    {
      name: 'power-platform-guide',
      type: 'skill',
      description: 'Routing oracle for all 10 Power Platform build paths',
      author: 'copilotforge',
      version: '1.0.0',
      tags: ['power-platform', 'routing', 'build-paths'],
      install: 'builtin',
      downloads: 0,
    },
    {
      name: 'api-client',
      type: 'recipe',
      description: 'HTTP client with retry, auth, and error handling patterns',
      author: 'copilotforge',
      version: '1.0.0',
      tags: ['api', 'http', 'networking'],
      install: 'builtin',
      downloads: 0,
    },
    {
      name: 'mcp-server',
      type: 'recipe',
      description: 'Model Context Protocol server for AI tool integration',
      author: 'copilotforge',
      version: '1.0.0',
      tags: ['mcp', 'ai', 'integration'],
      install: 'builtin',
      downloads: 0,
    },
  ],
};

// ── Cache ───────────────────────────────────────────────────────────────

function getCachePath() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.copilotforge', 'marketplace-cache.json');
}

function readCache() {
  const cachePath = getCachePath();
  if (!fs.existsSync(cachePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    // Cache valid for 1 hour
    if (data._cached && Date.now() - data._cached < 3600000) return data;
    return null;
  } catch { return null; }
}

function writeCache(data) {
  const cachePath = getCachePath();
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ ...data, _cached: Date.now() }, null, 2), 'utf8');
}

// ── Registry fetch ──────────────────────────────────────────────────────

async function fetchRegistry() {
  try {
    const response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.version && Array.isArray(data.items)) {
      writeCache(data);
      return { items: data.items, source: 'remote' };
    }
    throw new Error('Invalid registry format');
  } catch {
    const cached = readCache();
    if (cached && Array.isArray(cached.items)) {
      return { items: cached.items, source: 'cache' };
    }
    return { items: BUILTIN_REGISTRY.items, source: 'builtin' };
  }
}

// ── Search ──────────────────────────────────────────────────────────────

function searchItems(items, query) {
  const lower = query.toLowerCase();
  return items.filter((item) => {
    return item.name.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(lower));
  });
}

// ── Install ─────────────────────────────────────────────────────────────

function getInstalledPath(cwd) {
  return path.join(cwd, '.copilotforge', 'marketplace.json');
}

function getInstalled(cwd) {
  const p = getInstalledPath(cwd);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')).installed || []; } catch { return []; }
}

function saveInstalled(cwd, installed) {
  const p = getInstalledPath(cwd);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({ installed, updated: new Date().toISOString() }, null, 2), 'utf8');
}

function installItem(item, cwd) {
  const installed = getInstalled(cwd);
  const existing = installed.find((i) => i.name === item.name);
  if (existing) {
    return { status: 'already-installed', item: existing };
  }

  const record = {
    name: item.name,
    type: item.type,
    version: item.version,
    author: item.author,
    installedAt: new Date().toISOString(),
  };

  // For builtin items, they're already part of CopilotForge
  if (item.install === 'builtin') {
    installed.push(record);
    saveInstalled(cwd, installed);
    return { status: 'registered', item: record };
  }

  // For npm packages, install via npm
  if (item.install === 'npm' && item.package) {
    installed.push(record);
    saveInstalled(cwd, installed);
    return { status: 'installed', item: record, npmPackage: item.package };
  }

  // For GitHub-hosted items
  if (item.install === 'github' && item.repo) {
    installed.push(record);
    saveInstalled(cwd, installed);
    return { status: 'installed', item: record, repo: item.repo };
  }

  installed.push(record);
  saveInstalled(cwd, installed);
  return { status: 'registered', item: record };
}

function uninstallItem(name, cwd) {
  const installed = getInstalled(cwd);
  const idx = installed.findIndex((i) => i.name === name);
  if (idx === -1) return { status: 'not-found' };

  const removed = installed.splice(idx, 1)[0];
  saveInstalled(cwd, installed);
  return { status: 'removed', item: removed };
}

// ── Display ─────────────────────────────────────────────────────────────

function printItemList(items, source, title = 'Marketplace') {
  console.log();
  info(`🏪 CopilotForge ${title} ${colors.dim(`(${source})`)}`);
  console.log();

  const typeIcon = { skill: '🎯', recipe: '📦', agent: '🤖', plugin: '🔌' };

  for (const item of items) {
    const icon = typeIcon[item.type] || '📄';
    const tags = item.tags ? colors.dim(`[${item.tags.join(', ')}]`) : '';
    console.log(`  ${icon} ${colors.cyan(item.name.padEnd(24))} ${item.description}`);
    if (tags) console.log(`     ${' '.repeat(24)} ${tags}`);
  }

  console.log();
  info(colors.dim('  copilotforge marketplace install <name>  — Install an item'));
  info(colors.dim('  copilotforge marketplace search <query>  — Search by keyword'));
  console.log();
}

function printItemInfo(item) {
  console.log();
  info(`📋 ${colors.bold(item.name)}`);
  console.log();
  info(`  Type:        ${item.type}`);
  info(`  Description: ${item.description}`);
  info(`  Author:      ${item.author || 'unknown'}`);
  info(`  Version:     ${item.version || 'unknown'}`);
  if (item.tags) info(`  Tags:        ${item.tags.join(', ')}`);
  if (item.install) info(`  Install:     ${item.install}`);
  console.log();
}

// ── CLI ─────────────────────────────────────────────────────────────────

async function run(args = []) {
  const sub = args[0] || '';
  const cwd = process.cwd();

  switch (sub) {
    case '':
    case 'browse': {
      const { items, source } = await fetchRegistry();
      printItemList(items, source);
      break;
    }

    case 'search': {
      const query = args.slice(1).join(' ');
      if (!query) {
        warn('Usage: copilotforge marketplace search <query>');
        process.exit(1);
      }
      const { items, source } = await fetchRegistry();
      const results = searchItems(items, query);
      if (results.length === 0) {
        info(`No items matching "${query}"`);
      } else {
        printItemList(results, source, `Search: "${query}"`);
      }
      break;
    }

    case 'install': {
      const name = args[1];
      if (!name) {
        warn('Usage: copilotforge marketplace install <name>');
        process.exit(1);
      }
      const { items } = await fetchRegistry();
      const item = items.find((i) => i.name === name);
      if (!item) {
        fail(`Item "${name}" not found in marketplace`);
        const similar = searchItems(items, name);
        if (similar.length > 0) {
          info(`Did you mean: ${similar.map((s) => colors.cyan(s.name)).join(', ')}?`);
        }
        process.exit(1);
      }
      const result = installItem(item, cwd);
      if (result.status === 'already-installed') {
        info(`${item.name} is already installed`);
      } else {
        success(`✅ ${item.name} ${result.status}`);
        if (result.npmPackage) {
          info(colors.dim(`  Run: npm install ${result.npmPackage}`));
        }
      }
      break;
    }

    case 'uninstall': {
      const name = args[1];
      if (!name) {
        warn('Usage: copilotforge marketplace uninstall <name>');
        process.exit(1);
      }
      const result = uninstallItem(name, cwd);
      if (result.status === 'not-found') {
        warn(`${name} is not installed`);
      } else {
        success(`✅ ${name} removed`);
      }
      break;
    }

    case 'info': {
      const name = args[1];
      if (!name) {
        warn('Usage: copilotforge marketplace info <name>');
        process.exit(1);
      }
      const { items } = await fetchRegistry();
      const item = items.find((i) => i.name === name);
      if (!item) {
        fail(`Item "${name}" not found`);
        process.exit(1);
      }
      printItemInfo(item);
      break;
    }

    case 'list': {
      const installed = getInstalled(cwd);
      if (installed.length === 0) {
        info('No marketplace items installed. Run `copilotforge marketplace` to browse.');
      } else {
        console.log();
        info(`📦 Installed Items (${installed.length})`);
        console.log();
        for (const item of installed) {
          info(`  ${colors.cyan(item.name.padEnd(24))} ${item.type} v${item.version}  ${colors.dim(item.installedAt || '')}`);
        }
        console.log();
      }
      break;
    }

    default:
      console.log();
      info('🏪 CopilotForge Marketplace');
      console.log();
      info('  Usage:');
      info('    copilotforge marketplace                  Browse featured items');
      info('    copilotforge marketplace search <query>   Search by keyword');
      info('    copilotforge marketplace install <name>   Install a skill/agent');
      info('    copilotforge marketplace uninstall <name> Remove an installed item');
      info('    copilotforge marketplace info <name>      Show item details');
      info('    copilotforge marketplace list             List installed items');
      console.log();
  }
}

module.exports = {
  run,
  fetchRegistry,
  searchItems,
  installItem,
  uninstallItem,
  getInstalled,
  BUILTIN_REGISTRY,
};
