'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Federation — Phase 20
 *
 * Cross-organization sharing of skills, agents, and playbook entries.
 * Uses a decentralized model where each org publishes a manifest and
 * other orgs can discover and import shared items.
 *
 * Usage:
 *   copilotforge federation publish     Publish shareable skills/agents
 *   copilotforge federation discover    Find shared items from other orgs
 *   copilotforge federation import <id> Import a shared item
 *   copilotforge federation status      Show federation status
 */

// ── Manifest ────────────────────────────────────────────────────────────

function buildManifest(cwd) {
  const items = [];

  // Collect skills
  const skillsDir = path.join(cwd, '.github', 'skills');
  if (exists(skillsDir)) {
    try {
      const folders = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      for (const folder of folders) {
        const skillPath = path.join(skillsDir, folder.name, 'SKILL.md');
        if (exists(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf8');
          const titleMatch = content.match(/^#\s+(.+)/m);
          const descMatch = content.match(/^(?:>|##\s*Description)\s*(.+)/m);
          items.push({
            type: 'skill',
            name: folder.name,
            title: titleMatch ? titleMatch[1].trim() : folder.name,
            description: descMatch ? descMatch[1].trim() : '',
            path: path.relative(cwd, skillPath),
          });
        }
      }
    } catch { /* ignore */ }
  }

  // Collect agents
  const agentDirs = [
    path.join(cwd, '.copilot', 'agents'),
    path.join(cwd, '.github', 'agents'),
  ];
  for (const dir of agentDirs) {
    if (!exists(dir)) continue;
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const titleMatch = content.match(/^#\s+(.+)/m);
        items.push({
          type: 'agent',
          name: file.replace('.md', ''),
          title: titleMatch ? titleMatch[1].trim() : file,
          path: path.relative(cwd, path.join(dir, file)),
        });
      }
    } catch { /* ignore */ }
  }

  // Collect high-score playbook entries
  try {
    const { getTopEntries } = require('./experiential-memory');
    const top = getTopEntries(10, cwd).filter((e) => e.score >= 3 && e.source === 'project');
    for (const entry of top) {
      items.push({
        type: 'playbook',
        name: entry.title,
        title: `[${entry.type}] ${entry.title}`,
        description: entry.content.slice(0, 100),
        score: entry.score,
      });
    }
  } catch { /* playbook optional */ }

  // Project metadata
  let projectName = path.basename(cwd);
  const pkgPath = path.join(cwd, 'package.json');
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) projectName = pkg.name;
    } catch { /* ignore */ }
  }

  return {
    version: '1.0.0',
    project: projectName,
    publishedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
  };
}

function publishManifest(cwd) {
  const manifest = buildManifest(cwd);
  const outputDir = path.join(cwd, '.copilotforge', 'federation');
  const outputPath = path.join(outputDir, 'manifest.json');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  return { manifest, path: outputPath };
}

// ── Discovery (local simulation) ────────────────────────────────────────

function discoverFederated(sources) {
  const discovered = [];

  for (const source of sources) {
    const manifestPath = path.join(source, '.copilotforge', 'federation', 'manifest.json');
    if (!exists(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      for (const item of manifest.items) {
        discovered.push({
          ...item,
          sourceProject: manifest.project,
          sourcePath: source,
        });
      }
    } catch { /* skip invalid */ }
  }

  return discovered;
}

function importItem(item, cwd) {
  if (!item.path || !item.sourcePath) {
    return { success: false, error: 'Item does not have a source path' };
  }

  const srcFull = path.join(item.sourcePath, item.path);
  if (!exists(srcFull)) {
    return { success: false, error: `Source file not found: ${item.path}` };
  }

  const destFull = path.join(cwd, item.path);
  const destDir = path.dirname(destFull);

  if (exists(destFull)) {
    return { success: false, error: `Already exists: ${item.path}` };
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcFull, destFull);

  return { success: true, dest: item.path };
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const sub = args[0] || 'status';

  switch (sub) {
    case 'publish': {
      console.log();
      info('📡 Publishing federation manifest...');
      console.log();

      const result = publishManifest(cwd);
      info(`  Project: ${colors.cyan(result.manifest.project)}`);
      info(`  Items:   ${colors.bold(String(result.manifest.itemCount))}`);

      const types = {};
      for (const item of result.manifest.items) {
        types[item.type] = (types[item.type] || 0) + 1;
      }
      for (const [type, count] of Object.entries(types)) {
        info(`    ${type}: ${count}`);
      }

      console.log();
      success(`  ✅ Manifest published: ${colors.dim(result.path)}`);
      console.log();
      break;
    }

    case 'discover': {
      // Discover from linked repos
      let sources = [];
      try {
        const { getLinkedRepos } = require('./multi-repo');
        sources = getLinkedRepos().map((r) => r.path);
      } catch { /* no multi-repo */ }

      console.log();
      info('🔍 Discovering federated items...');
      console.log();

      const discovered = discoverFederated(sources);
      if (discovered.length === 0) {
        info('  No federated items found.');
        info(colors.dim('  Link repos with `copilotforge multi-repo link` first.'));
      } else {
        for (const item of discovered) {
          const icon = item.type === 'skill' ? '🎯' : item.type === 'agent' ? '🤖' : '📝';
          info(`  ${icon} ${colors.cyan(item.name)} (${item.type}) from ${colors.dim(item.sourceProject)}`);
        }
      }
      console.log();
      break;
    }

    case 'import': {
      const itemName = args[1];
      if (!itemName) {
        warn('Usage: copilotforge federation import <name>');
        process.exit(1);
      }

      // Find the item in discovered sources
      let sources = [];
      try {
        const { getLinkedRepos } = require('./multi-repo');
        sources = getLinkedRepos().map((r) => r.path);
      } catch { /* no multi-repo */ }

      const discovered = discoverFederated(sources);
      const item = discovered.find((i) => i.name === itemName);

      if (!item) {
        warn(`  Item "${itemName}" not found in federated sources`);
        process.exit(1);
      }

      const result = importItem(item, cwd);
      console.log();
      if (result.success) {
        success(`  ✅ Imported ${item.type} "${item.name}" → ${result.dest}`);
      } else {
        warn(`  ${result.error}`);
      }
      console.log();
      break;
    }

    case 'status': {
      console.log();
      info('📡 Federation Status');
      console.log();

      const manifestPath = path.join(cwd, '.copilotforge', 'federation', 'manifest.json');
      if (exists(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        info(`  Published: ${colors.green('yes')}`);
        info(`  Items: ${manifest.itemCount}`);
        info(`  Last update: ${manifest.publishedAt}`);
      } else {
        info(`  Published: ${colors.yellow('no')}`);
        info(colors.dim('  Run `copilotforge federation publish` to share your skills and agents.'));
      }
      console.log();
      break;
    }

    default:
      console.log();
      info('📡 CopilotForge Federation');
      console.log();
      info('  Usage:');
      info('    copilotforge federation publish     Publish manifest of shareable items');
      info('    copilotforge federation discover    Find items from linked repos');
      info('    copilotforge federation import <n>  Import a federated item');
      info('    copilotforge federation status      Show federation status');
      console.log();
  }
}

module.exports = {
  run,
  buildManifest,
  publishManifest,
  discoverFederated,
  importItem,
};
