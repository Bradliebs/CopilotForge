'use strict';

const fs = require('fs');
const path = require('path');
const { info, warn, success, fail, colors } = require('./utils');

// Core paths A-J are reserved — plugins use K-Z
const CORE_PATHS = new Set('ABCDEFGHIJ'.split(''));

/**
 * Plugin contract (TypeScript-style documentation):
 *
 * interface CopilotForgePlugin {
 *   name: string;
 *   description: string;
 *   buildPath: string;           // single letter K-Z
 *   signals: string[];           // trigger words for path detection
 *   questions: Array<{
 *     id: string;
 *     prompt: string;
 *     choices?: string[];
 *   }>;
 *   templates: {
 *     forge?: string;            // FORGE.md template content
 *   };
 * }
 */

// ── Plugin discovery ────────────────────────────────────────────────────

function discoverPlugins(cwd = process.cwd()) {
  const nodeModulesDir = path.join(cwd, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) return [];

  const plugins = [];

  try {
    const entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Handle scoped packages (@org/pkg)
      if (entry.name.startsWith('@')) {
        const scopeDir = path.join(nodeModulesDir, entry.name);
        const scopedEntries = fs.readdirSync(scopeDir, { withFileTypes: true });
        for (const scopedEntry of scopedEntries) {
          if (!scopedEntry.isDirectory()) continue;
          const plugin = tryLoadPlugin(path.join(scopeDir, scopedEntry.name));
          if (plugin) plugins.push(plugin);
        }
      } else {
        const plugin = tryLoadPlugin(path.join(nodeModulesDir, entry.name));
        if (plugin) plugins.push(plugin);
      }
    }
  } catch {
    // node_modules scan failed — return empty
  }

  return plugins;
}

function tryLoadPlugin(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return null;

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (!pkgJson['copilotforge-plugin']) return null;

    // Load the plugin module
    const plugin = require(pkgDir);
    const validation = validatePlugin(plugin, pkgJson);

    if (validation.valid) {
      return {
        ...plugin,
        _version: pkgJson.version || '0.0.0',
        _package: pkgJson.name,
        _path: pkgDir,
      };
    } else {
      warn(`Plugin ${pkgJson.name}: ${validation.error}`);
      return null;
    }
  } catch (err) {
    return null;
  }
}

// ── Plugin validation ───────────────────────────────────────────────────

function validatePlugin(plugin, pkgJson) {
  if (!plugin || typeof plugin !== 'object') {
    return { valid: false, error: 'Plugin must export an object' };
  }

  if (!plugin.name || typeof plugin.name !== 'string') {
    return { valid: false, error: 'Plugin must have a name (string)' };
  }

  if (!plugin.buildPath || typeof plugin.buildPath !== 'string' || plugin.buildPath.length !== 1) {
    return { valid: false, error: 'Plugin must have a buildPath (single letter)' };
  }

  const letter = plugin.buildPath.toUpperCase();
  if (CORE_PATHS.has(letter)) {
    return { valid: false, error: `buildPath "${letter}" conflicts with core path. Plugins must use K-Z.` };
  }

  if (letter < 'K' || letter > 'Z') {
    return { valid: false, error: `buildPath "${letter}" is out of range. Plugins must use K-Z.` };
  }

  if (!Array.isArray(plugin.signals) || plugin.signals.length === 0) {
    return { valid: false, error: 'Plugin must have signals (non-empty array of strings)' };
  }

  if (!Array.isArray(plugin.questions)) {
    return { valid: false, error: 'Plugin must have questions (array)' };
  }

  return { valid: true };
}

// ── Plugin registration ─────────────────────────────────────────────────

function getRegisteredPlugins(cwd = process.cwd()) {
  const plugins = discoverPlugins(cwd);

  // Deduplicate by buildPath — first wins
  const byPath = new Map();
  const conflicts = [];

  for (const plugin of plugins) {
    const letter = plugin.buildPath.toUpperCase();
    if (byPath.has(letter)) {
      conflicts.push({ letter, existing: byPath.get(letter).name, conflicting: plugin.name });
    } else {
      byPath.set(letter, plugin);
    }
  }

  return {
    plugins: Array.from(byPath.values()),
    conflicts,
  };
}

// ── Path detection integration ──────────────────────────────────────────

function detectPluginPath(description, plugins) {
  const lower = description.toLowerCase();

  for (const plugin of plugins) {
    const matchCount = plugin.signals.filter((s) => lower.includes(s.toLowerCase())).length;
    if (matchCount > 0) {
      return {
        path: plugin.buildPath.toUpperCase(),
        name: plugin.name,
        confidence: matchCount >= 2 ? 'High' : 'Medium',
        plugin,
      };
    }
  }

  return null;
}

// ── Doctor integration ──────────────────────────────────────────────────

function reportPlugins(plugins, recordCheck) {
  if (plugins.length === 0) return;

  for (const plugin of plugins) {
    recordCheck(
      `Plugin: ${plugin.name}`,
      'pass',
      `Plugin ${plugin.name} v${plugin._version} — Path ${plugin.buildPath.toUpperCase()}`,
      ''
    );
  }
}

module.exports = {
  discoverPlugins,
  validatePlugin,
  getRegisteredPlugins,
  detectPluginPath,
  reportPlugins,
  CORE_PATHS,
};
