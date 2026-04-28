'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn } = require('./utils');

/**
 * CopilotForge Hook Lifecycle System
 *
 * Zero-context extensibility layer inspired by Claude Code's 27-event hook pipeline.
 * Hooks intercept lifecycle events without consuming context window budget.
 *
 * Hook types:
 *   - callback: in-process function (for SDK/internal use)
 *   - command: shell command executed via child_process
 *
 * Hook events (15 events across 5 categories):
 *
 *   Scaffolding:    PreScaffold, PostScaffold
 *   Task execution: PreTaskExecute, PostTaskExecute, TaskFailed
 *   Analysis:       PreAnalysis, PostAnalysis
 *   Memory:         PreMemoryWrite, PostMemoryWrite
 *   Session:        SessionStart, SessionEnd, PreCompact, PostCompact
 *   Permission:     PermissionRequest, PermissionDenied
 *   Wizard:         WizardComplete
 */

// ── Event registry ──────────────────────────────────────────────────────

const HOOK_EVENTS = [
  'PreScaffold', 'PostScaffold',
  'PreTaskExecute', 'PostTaskExecute', 'TaskFailed',
  'PreAnalysis', 'PostAnalysis',
  'PreMemoryWrite', 'PostMemoryWrite',
  'SessionStart', 'SessionEnd',
  'PreCompact', 'PostCompact',
  'PermissionRequest', 'PermissionDenied',
  'WizardComplete',
];

// ── Hook store ──────────────────────────────────────────────────────────

const _hooks = new Map();

function _ensureEvent(event) {
  if (!_hooks.has(event)) {
    _hooks.set(event, []);
  }
}

// ── Registration ────────────────────────────────────────────────────────

/**
 * Register a callback hook for an event.
 * @param {string} event - One of HOOK_EVENTS
 * @param {Function} callback - async (context) => result
 * @param {object} [options]
 * @param {string} [options.name] - Human-readable hook name
 * @param {number} [options.priority] - Lower runs first (default: 100)
 * @returns {{ unregister: Function }}
 */
function registerHook(event, callback, options = {}) {
  if (!HOOK_EVENTS.includes(event)) {
    throw new Error(`Unknown hook event: ${event}. Valid events: ${HOOK_EVENTS.join(', ')}`);
  }

  _ensureEvent(event);

  const hook = {
    type: 'callback',
    event,
    callback,
    name: options.name || `hook-${_hooks.get(event).length}`,
    priority: options.priority ?? 100,
  };

  _hooks.get(event).push(hook);
  // Sort by priority (lower first)
  _hooks.get(event).sort((a, b) => a.priority - b.priority);

  return {
    unregister: () => {
      const arr = _hooks.get(event);
      const idx = arr.indexOf(hook);
      if (idx !== -1) arr.splice(idx, 1);
    },
  };
}

/**
 * Register a shell command hook for an event.
 * @param {string} event - One of HOOK_EVENTS
 * @param {string} command - Shell command to execute
 * @param {object} [options]
 * @param {string} [options.name]
 * @param {number} [options.priority]
 * @param {number} [options.timeout] - ms (default: 10000)
 * @returns {{ unregister: Function }}
 */
function registerCommandHook(event, command, options = {}) {
  if (!HOOK_EVENTS.includes(event)) {
    throw new Error(`Unknown hook event: ${event}. Valid events: ${HOOK_EVENTS.join(', ')}`);
  }

  _ensureEvent(event);

  const hook = {
    type: 'command',
    event,
    command,
    name: options.name || `cmd-hook-${_hooks.get(event).length}`,
    priority: options.priority ?? 100,
    timeout: options.timeout ?? 10000,
  };

  _hooks.get(event).push(hook);
  _hooks.get(event).sort((a, b) => a.priority - b.priority);

  return {
    unregister: () => {
      const arr = _hooks.get(event);
      const idx = arr.indexOf(hook);
      if (idx !== -1) arr.splice(idx, 1);
    },
  };
}

// ── Execution ───────────────────────────────────────────────────────────

/**
 * Fire all hooks registered for an event.
 * @param {string} event - Hook event name
 * @param {object} context - Event-specific context data
 * @returns {Promise<{ results: Array, blocked: boolean, modifiedContext: object }>}
 */
async function fireHooks(event, context = {}) {
  _ensureEvent(event);

  const hooks = _hooks.get(event);
  if (hooks.length === 0) {
    return { results: [], blocked: false, modifiedContext: context };
  }

  const results = [];
  let blocked = false;
  let modifiedContext = { ...context };

  for (const hook of hooks) {
    try {
      let result;

      if (hook.type === 'callback') {
        result = await hook.callback(modifiedContext);
      } else if (hook.type === 'command') {
        result = await _executeCommandHook(hook, modifiedContext);
      }

      if (result) {
        results.push({ hook: hook.name, result });

        // Hook can block the operation
        if (result.blocked === true) {
          blocked = true;
          break;
        }

        // Hook can modify context for downstream hooks
        if (result.modifiedContext) {
          modifiedContext = { ...modifiedContext, ...result.modifiedContext };
        }
      }
    } catch (err) {
      // Hooks fail gracefully — never crash the host operation
      warn(`Hook ${hook.name} failed: ${err.message}`);
      results.push({ hook: hook.name, error: err.message });
    }
  }

  return { results, blocked, modifiedContext };
}

async function _executeCommandHook(hook, context) {
  const { execSync } = require('child_process');

  try {
    const env = {
      ...process.env,
      COPILOTFORGE_HOOK_EVENT: hook.event,
      COPILOTFORGE_HOOK_CONTEXT: JSON.stringify(context),
    };

    const output = execSync(hook.command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: hook.timeout,
      env,
      cwd: context.cwd || process.cwd(),
    });

    // Try to parse JSON output from the command
    try {
      return JSON.parse(output.trim());
    } catch {
      return { output: output.trim() };
    }
  } catch (err) {
    throw new Error(`Command hook failed: ${err.message}`);
  }
}

// ── Loading hooks from settings ─────────────────────────────────────────

/**
 * Load hooks from .copilotforge/hooks.json or .vscode/settings.json
 * @param {string} cwd - Project directory
 */
function loadProjectHooks(cwd = process.cwd()) {
  const hooksPath = path.join(cwd, '.copilotforge', 'hooks.json');

  if (!fs.existsSync(hooksPath)) return;

  try {
    const config = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

    if (!config.hooks || !Array.isArray(config.hooks)) return;

    for (const hookDef of config.hooks) {
      if (!hookDef.event || !hookDef.command) continue;

      registerCommandHook(hookDef.event, hookDef.command, {
        name: hookDef.name || hookDef.command,
        priority: hookDef.priority,
        timeout: hookDef.timeout,
      });
    }
  } catch (err) {
    warn(`Could not load hooks from ${hooksPath}: ${err.message}`);
  }
}

// ── Query ───────────────────────────────────────────────────────────────

/**
 * Get all registered hooks, optionally filtered by event.
 * @param {string} [event] - Filter by event name
 * @returns {Array}
 */
function getRegisteredHooks(event) {
  if (event) {
    _ensureEvent(event);
    return [..._hooks.get(event)];
  }
  const all = [];
  for (const [, hooks] of _hooks) {
    all.push(...hooks);
  }
  return all;
}

/**
 * Clear all hooks (for testing).
 */
function clearAllHooks() {
  _hooks.clear();
}

module.exports = {
  HOOK_EVENTS,
  registerHook,
  registerCommandHook,
  fireHooks,
  loadProjectHooks,
  getRegisteredHooks,
  clearAllHooks,
};
