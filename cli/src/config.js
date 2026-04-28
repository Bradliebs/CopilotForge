'use strict';

const fs = require('fs');
const path = require('path');
const { exists } = require('./utils');

/**
 * CopilotForge Config — Phase 19
 *
 * Per-project and global config via:
 *   .copilotforgerc           (JSON)
 *   .copilotforgerc.json      (JSON)
 *   copilotforge.config.js    (CommonJS module)
 *   ~/.copilotforge/config.json  (global defaults)
 *
 * Config schema:
 *   path:        string   — build path letter (A-J)
 *   verbosity:   string   — 'quiet' | 'normal' | 'verbose'
 *   extras:      string[] — extras to auto-select
 *   autoCommit:  boolean  — auto-commit after init
 *   dryRun:      boolean  — default to dry-run mode
 *   telemetry:   boolean  — enable/disable telemetry
 *   plugins:     string[] — npm packages to load as plugins
 */

const CONFIG_FILES = [
  '.copilotforgerc',
  '.copilotforgerc.json',
  'copilotforge.config.js',
];

const DEFAULTS = {
  path: null,
  verbosity: 'normal',
  extras: [],
  autoCommit: false,
  dryRun: false,
  telemetry: false,
  plugins: [],
};

/**
 * Load config from the project directory, merging with global defaults.
 * Priority: project config > global config > defaults.
 */
function loadConfig(cwd = process.cwd()) {
  const globalConfig = loadGlobalConfig();
  const projectConfig = loadProjectConfig(cwd);

  return { ...DEFAULTS, ...globalConfig, ...projectConfig };
}

/**
 * Load global config from ~/.copilotforge/config.json.
 */
function loadGlobalConfig() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const globalPath = path.join(home, '.copilotforge', 'config.json');

  if (!exists(globalPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(globalPath, 'utf8'));
  } catch { return {}; }
}

/**
 * Load project-level config from the first matching config file.
 */
function loadProjectConfig(cwd) {
  for (const filename of CONFIG_FILES) {
    const configPath = path.join(cwd, filename);
    if (!exists(configPath)) continue;

    try {
      if (filename.endsWith('.js')) {
        return require(configPath);
      }
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch { continue; }
  }

  return {};
}

/**
 * Save config to a project-level .copilotforgerc.json file.
 */
function saveProjectConfig(config, cwd = process.cwd()) {
  const configPath = path.join(cwd, '.copilotforgerc.json');
  const toSave = {};

  // Only save non-default values
  for (const [key, value] of Object.entries(config)) {
    if (JSON.stringify(value) !== JSON.stringify(DEFAULTS[key])) {
      toSave[key] = value;
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2) + '\n', 'utf8');
  return configPath;
}

/**
 * Save config to the global ~/.copilotforge/config.json file.
 */
function saveGlobalConfig(config) {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const dir = path.join(home, '.copilotforge');
  const configPath = path.join(dir, 'config.json');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  return configPath;
}

/**
 * Find which config file is active for a project.
 */
function findConfigFile(cwd = process.cwd()) {
  for (const filename of CONFIG_FILES) {
    const configPath = path.join(cwd, filename);
    if (exists(configPath)) return { file: filename, path: configPath, scope: 'project' };
  }

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const globalPath = path.join(home, '.copilotforge', 'config.json');
  if (exists(globalPath)) return { file: 'config.json', path: globalPath, scope: 'global' };

  return null;
}

module.exports = {
  loadConfig,
  loadGlobalConfig,
  loadProjectConfig,
  saveProjectConfig,
  saveGlobalConfig,
  findConfigFile,
  CONFIG_FILES,
  DEFAULTS,
};
