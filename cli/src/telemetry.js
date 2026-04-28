'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Telemetry Dashboard
 *
 * Opt-in usage analytics for project leads. All data stays local
 * (stored in ~/.copilotforge/telemetry/). Nothing is transmitted.
 *
 * Tracks:
 *   - Wizard path selections (which build paths are popular)
 *   - Recipe/cookbook usage frequency
 *   - Trust trajectory trends over time
 *   - Session frequency and duration patterns
 *   - Feature adoption (which CLI commands are used)
 *
 * Usage:
 *   copilotforge telemetry              Show dashboard summary
 *   copilotforge telemetry enable       Enable telemetry collection
 *   copilotforge telemetry disable      Disable telemetry collection
 *   copilotforge telemetry reset        Clear all collected data
 *   copilotforge telemetry export       Export data as JSON
 */

// ── Storage ─────────────────────────────────────────────────────────────

function getTelemetryDir() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.copilotforge', 'telemetry');
}

function getConfigPath() {
  return path.join(getTelemetryDir(), 'config.json');
}

function getEventsPath() {
  return path.join(getTelemetryDir(), 'events.json');
}

function isEnabled() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return false;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')).enabled === true;
  } catch { return false; }
}

function setEnabled(enabled) {
  const dir = getTelemetryDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify({
    enabled,
    updatedAt: new Date().toISOString(),
  }, null, 2), 'utf8');
}

// ── Event recording ─────────────────────────────────────────────────────

function recordEvent(type, data = {}) {
  if (!isEnabled()) return;

  const eventsPath = getEventsPath();
  const dir = path.dirname(eventsPath);
  fs.mkdirSync(dir, { recursive: true });

  let events = [];
  if (fs.existsSync(eventsPath)) {
    try { events = JSON.parse(fs.readFileSync(eventsPath, 'utf8')); } catch { events = []; }
  }

  events.push({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  // Keep last 10,000 events max
  if (events.length > 10000) {
    events = events.slice(-10000);
  }

  fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');
}

// ── Analysis ────────────────────────────────────────────────────────────

function getEvents() {
  const eventsPath = getEventsPath();
  if (!fs.existsSync(eventsPath)) return [];
  try { return JSON.parse(fs.readFileSync(eventsPath, 'utf8')); } catch { return []; }
}

function analyzeEvents(events) {
  const analysis = {
    totalEvents: events.length,
    dateRange: { first: null, last: null },
    commandUsage: {},
    pathSelections: {},
    trustLevels: {},
    dailyActivity: {},
  };

  if (events.length === 0) return analysis;

  analysis.dateRange.first = events[0].timestamp;
  analysis.dateRange.last = events[events.length - 1].timestamp;

  for (const event of events) {
    // Command usage
    if (event.type === 'command') {
      const cmd = event.data.command || 'unknown';
      analysis.commandUsage[cmd] = (analysis.commandUsage[cmd] || 0) + 1;
    }

    // Path selections
    if (event.type === 'path-selected') {
      const p = event.data.path || 'unknown';
      analysis.pathSelections[p] = (analysis.pathSelections[p] || 0) + 1;
    }

    // Trust level changes
    if (event.type === 'trust-change') {
      const level = event.data.level || 'unknown';
      analysis.trustLevels[level] = (analysis.trustLevels[level] || 0) + 1;
    }

    // Daily activity
    const day = event.timestamp.slice(0, 10);
    analysis.dailyActivity[day] = (analysis.dailyActivity[day] || 0) + 1;
  }

  return analysis;
}

// ── Display ─────────────────────────────────────────────────────────────

function printDashboard(analysis) {
  console.log();
  info(`📊 CopilotForge Telemetry Dashboard`);
  console.log();

  if (analysis.totalEvents === 0) {
    info('  No events recorded yet. Use CopilotForge commands to generate data.');
    console.log();
    return;
  }

  info(`  Total events: ${colors.bold(String(analysis.totalEvents))}`);
  info(`  Date range:   ${analysis.dateRange.first?.slice(0, 10) || '?'} → ${analysis.dateRange.last?.slice(0, 10) || '?'}`);
  console.log();

  // Command usage
  const cmds = Object.entries(analysis.commandUsage).sort((a, b) => b[1] - a[1]);
  if (cmds.length > 0) {
    info('  📋 Command Usage:');
    for (const [cmd, count] of cmds.slice(0, 10)) {
      const bar = '█'.repeat(Math.min(Math.ceil(count / Math.max(...cmds.map((c) => c[1])) * 20), 20));
      info(`    ${colors.cyan(cmd.padEnd(20))} ${colors.dim(bar)} ${count}`);
    }
    console.log();
  }

  // Path selections
  const paths = Object.entries(analysis.pathSelections).sort((a, b) => b[1] - a[1]);
  if (paths.length > 0) {
    info('  🛤️  Build Path Popularity:');
    for (const [p, count] of paths) {
      info(`    Path ${colors.cyan(p.padEnd(4))} ${count} selections`);
    }
    console.log();
  }

  // Trust levels
  const trust = Object.entries(analysis.trustLevels);
  if (trust.length > 0) {
    info('  🤝 Trust Level Distribution:');
    for (const [level, count] of trust) {
      info(`    ${colors.cyan(level.padEnd(16))} ${count} transitions`);
    }
    console.log();
  }

  // Recent activity
  const days = Object.entries(analysis.dailyActivity).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
  if (days.length > 0) {
    info('  📅 Recent Activity (last 7 days):');
    for (const [day, count] of days) {
      const bar = '▓'.repeat(Math.min(count, 30));
      info(`    ${colors.dim(day)} ${bar} ${count}`);
    }
    console.log();
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const sub = args[0] || '';

  switch (sub) {
    case '':
    case 'show': {
      if (!isEnabled()) {
        console.log();
        info('📊 Telemetry is currently ' + colors.yellow('disabled'));
        info(colors.dim('  Run `copilotforge telemetry enable` to start collecting local usage data.'));
        info(colors.dim('  All data stays local — nothing is transmitted.'));
        console.log();
        return;
      }
      const events = getEvents();
      const analysis = analyzeEvents(events);
      printDashboard(analysis);
      break;
    }

    case 'enable': {
      setEnabled(true);
      console.log();
      success('  ✅ Telemetry enabled');
      info(colors.dim('  Data is stored locally at ~/.copilotforge/telemetry/'));
      info(colors.dim('  Nothing is transmitted — all analytics are local only.'));
      console.log();
      break;
    }

    case 'disable': {
      setEnabled(false);
      console.log();
      success('  ✅ Telemetry disabled');
      info(colors.dim('  Existing data preserved. Run `telemetry reset` to clear.'));
      console.log();
      break;
    }

    case 'reset': {
      const eventsPath = getEventsPath();
      if (fs.existsSync(eventsPath)) {
        fs.unlinkSync(eventsPath);
      }
      console.log();
      success('  ✅ Telemetry data cleared');
      console.log();
      break;
    }

    case 'export': {
      const events = getEvents();
      console.log(JSON.stringify({
        exported: new Date().toISOString(),
        eventCount: events.length,
        events,
      }, null, 2));
      break;
    }

    default:
      console.log();
      info('📊 CopilotForge Telemetry');
      console.log();
      info('  All data is local only — nothing is transmitted.');
      console.log();
      info('  Usage:');
      info('    copilotforge telemetry              Show dashboard');
      info('    copilotforge telemetry enable       Start collecting data');
      info('    copilotforge telemetry disable      Stop collecting data');
      info('    copilotforge telemetry reset        Clear all data');
      info('    copilotforge telemetry export       Export as JSON');
      console.log();
  }
}

module.exports = {
  run,
  recordEvent,
  isEnabled,
  setEnabled,
  getEvents,
  analyzeEvents,
  BUILTIN_EVENT_TYPES: ['command', 'path-selected', 'trust-change', 'session-start', 'session-end'],
};
