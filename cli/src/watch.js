'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = '.forge-watch-state.json';
const SENTINEL_FILE = '.copilotforge-stop';

function timestamp() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function log(msg, logFile) {
  const line = `[Watch] ${timestamp()} ${msg}`;
  console.log(line);
  if (logFile) {
    try { fs.appendFileSync(logFile, line + '\n', 'utf-8'); } catch { /* ignore */ }
  }
}

// Parse IMPLEMENTATION_PLAN.md — handles both `—` (em-dash) and `-` (hyphen)
function parsePlan(planPath) {
  if (!fs.existsSync(planPath)) return null;
  const content = fs.readFileSync(planPath, 'utf-8');
  const tasks = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^- \[(.)\] (\S+)\s*(?:—|-)\s*(.+)$/);
    if (!m) continue;
    const [, marker, id, title] = m;
    const status = marker === 'x' ? 'done' : marker === '!' ? 'failed' : 'pending';
    tasks.push({ id, title: title.trim(), status });
  }
  return tasks;
}

function readState(projectPath) {
  const p = path.join(projectPath, STATE_FILE);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeState(projectPath, state) {
  fs.writeFileSync(path.join(projectPath, STATE_FILE), JSON.stringify(state, null, 2), 'utf-8');
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function healthCheck(projectPath) {
  const state = readState(projectPath);
  if (!state) {
    console.log('[Watch] ⚫ Watch is not running (no state file found).');
    console.log('[Watch] Start with: npx copilotforge watch');
    return;
  }
  const running = pidAlive(state.pid);
  console.log('[Watch] ─────────────────────────────────────');
  console.log(`[Watch] Status:       ${running ? '🟢 Running' : '⚫ Stopped'}`);
  console.log(`[Watch] PID:          ${state.pid}`);
  console.log(`[Watch] Started at:   ${state.startedAt}`);
  console.log(`[Watch] Last poll:    ${state.lastPollAt || 'N/A'}`);
  console.log(`[Watch] Current task: ${state.currentTask || 'none'}`);
  console.log(`[Watch] Last task:    ${state.lastTaskId || 'none'} (${state.lastTaskStatus || 'N/A'})`);
  console.log(`[Watch] Done/Failed:  ${state.totalDone} done, ${state.totalFailed} failed`);
  console.log(`[Watch] Interval:     ${state.interval}s`);
  console.log('[Watch] ─────────────────────────────────────');
  if (!running) {
    console.log('[Watch] Tip: start with: npx copilotforge watch');
  } else {
    console.log('[Watch] Tip: stop with: touch .copilotforge-stop  or  Ctrl+C in watch terminal');
  }
}

function run(args) {
  const projectPath = process.cwd();

  if (args.includes('--health')) {
    healthCheck(projectPath);
    return;
  }

  // Parse flags
  let interval = 10;
  const intIdx = args.indexOf('--interval');
  if (intIdx >= 0 && args[intIdx + 1]) {
    const parsed = parseInt(args[intIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) interval = parsed;
  }

  let logFile = null;
  const lfIdx = args.indexOf('--log-file');
  if (lfIdx >= 0 && args[lfIdx + 1]) {
    logFile = path.resolve(projectPath, args[lfIdx + 1]);
  }

  // Double-start guard
  const existingState = readState(projectPath);
  if (existingState && pidAlive(existingState.pid)) {
    console.error(`[Watch] Already running (PID ${existingState.pid}). Use --health to check status or npx copilotforge watch --stop to halt.`);
    process.exit(1);
  }

  const planPath = path.join(projectPath, 'IMPLEMENTATION_PLAN.md');
  if (!fs.existsSync(planPath)) {
    console.error('[Watch] IMPLEMENTATION_PLAN.md not found in ' + projectPath);
    console.error('[Watch] Run: npx copilotforge init to create one.');
    process.exit(1);
  }

  const state = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    lastPollAt: null,
    currentTask: null,
    lastTaskId: null,
    lastTaskStatus: null,
    totalDone: 0,
    totalFailed: 0,
    consecutiveFailures: 0,
    interval,
  };
  writeState(projectPath, state);

  log(`Started (PID ${process.pid}, interval ${interval}s)`, logFile);
  log(`Polling: ${planPath}`, logFile);

  let consecutiveFailures = 0;

  function tick() {
    // Sentinel check — consume file for clean exit
    const sentinelPath = path.join(projectPath, SENTINEL_FILE);
    if (fs.existsSync(sentinelPath)) {
      try { fs.unlinkSync(sentinelPath); } catch { /* ignore */ }
      log('🛑 Sentinel file detected — shutting down cleanly.', logFile);
      state.currentTask = null;
      writeState(projectPath, state);
      process.exit(0);
    }

    state.lastPollAt = new Date().toISOString();

    const tasks = parsePlan(planPath);
    if (!tasks) {
      log('⚠️ Could not read IMPLEMENTATION_PLAN.md — retrying next cycle.', logFile);
      writeState(projectPath, state);
      setTimeout(tick, interval * 1000);
      return;
    }

    const next = tasks.find(t => t.status === 'pending');

    if (!next) {
      log('✅ Board clear — all tasks done. Idling (polling for new tasks)...', logFile);
      state.currentTask = null;
      writeState(projectPath, state);
      setTimeout(tick, interval * 1000);
      return;
    }

    log(`▶ Running task: ${next.id} — ${next.title}`, logFile);
    state.currentTask = next.id;
    writeState(projectPath, state);

    let exitCode = 0;
    try {
      execSync(`npx tsx cookbook/task-loop.ts --single-task ${next.id}`, {
        cwd: projectPath,
        stdio: 'inherit',
      });
    } catch (err) {
      exitCode = (err.status != null) ? err.status : 1;
    }

    state.currentTask = null;
    state.lastTaskId = next.id;

    if (exitCode === 0) {
      consecutiveFailures = 0;
      state.totalDone++;
      state.lastTaskStatus = 'done';
      state.consecutiveFailures = 0;
      log(`✅ Task ${next.id} completed successfully.`, logFile);
    } else {
      consecutiveFailures++;
      state.totalFailed++;
      state.lastTaskStatus = 'failed';
      state.consecutiveFailures = consecutiveFailures;
      log(`❌ Task ${next.id} failed (exit ${exitCode}). Consecutive failures: ${consecutiveFailures}`, logFile);

      // 4-tier escalation
      if (consecutiveFailures <= 2) {
        log(`⚠️ Warning: ${consecutiveFailures} consecutive failure(s).`, logFile);
      } else if (consecutiveFailures === 3) {
        log('⚠️ 3 consecutive failures — pausing 30s extra before next attempt.', logFile);
        writeState(projectPath, state);
        setTimeout(tick, (interval + 30) * 1000);
        return;
      } else {
        log('🚨 CRITICAL: 4+ consecutive failures — writing sentinel to halt watch.', logFile);
        try { fs.writeFileSync(sentinelPath, 'auto-halt: too many consecutive failures\n', 'utf-8'); } catch { /* ignore */ }
        writeState(projectPath, state);
        // Next tick will detect sentinel and exit cleanly
        setTimeout(tick, 500);
        return;
      }
    }

    writeState(projectPath, state);
    setTimeout(tick, interval * 1000);
  }

  // Start the loop
  setTimeout(tick, 0);
}

module.exports = { run };
