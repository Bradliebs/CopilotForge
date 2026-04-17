'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { colors, info } = require('./utils');

const PORT = 3731;

function readForge(projectPath) {
  const forgePath = path.join(projectPath, 'FORGE.md');
  if (!fs.existsSync(forgePath)) return null;
  const text = fs.readFileSync(forgePath, 'utf-8');
  const nameMatch = text.match(/\|\s*Project\s*\|\s*(.+?)\s*\|/i);
  const stackMatch = text.match(/\|\s*Stack\s*\|\s*(.+?)\s*\|/i);
  return {
    name: nameMatch ? nameMatch[1] : path.basename(projectPath),
    stack: stackMatch ? stackMatch[1] : '',
  };
}

function readPlan(projectPath) {
  const planPath = path.join(projectPath, 'IMPLEMENTATION_PLAN.md');
  if (!fs.existsSync(planPath)) return [];
  const lines = fs.readFileSync(planPath, 'utf-8').split('\n');
  const tasks = [];
  for (const line of lines) {
    const m = line.match(/^- \[(.)]\s+(\S+)\s*[-\u2014]+\s*(.+)$/);
    if (!m) continue;
    const status = m[1] === 'x' ? 'done' : m[1] === '!' ? 'failed' : 'pending';
    tasks.push({ id: m[2], title: m[3].trim(), status });
  }
  return tasks;
}

function readRalphStatus(projectPath) {
  const p = path.join(projectPath, 'ralph-status.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function readDoctor(projectPath) {
  return [
    { label: 'FORGE.md',               ok: fs.existsSync(path.join(projectPath, 'FORGE.md')) },
    { label: 'IMPLEMENTATION_PLAN.md', ok: fs.existsSync(path.join(projectPath, 'IMPLEMENTATION_PLAN.md')) },
    { label: 'ralph-loop.ts',          ok: fs.existsSync(path.join(projectPath, 'cookbook', 'ralph-loop.ts')) },
    { label: 'task-loop.ts',           ok: fs.existsSync(path.join(projectPath, 'cookbook', 'task-loop.ts')) },
    { label: 'forge-memory/',          ok: fs.existsSync(path.join(projectPath, 'forge-memory')) },
    { label: 'PROMPT_build.md',        ok: fs.existsSync(path.join(projectPath, 'PROMPT_build.md')) },
  ];
}

function getLastCommits(projectPath) {
  try {
    return execSync('git log --oneline -5', { cwd: projectPath, stdio: 'pipe' })
      .toString().trim().split('\n').filter(Boolean);
  } catch { return []; }
}

function buildStatus(projectPath) {
  const tasks   = readPlan(projectPath);
  const forge   = readForge(projectPath);
  const ralph   = readRalphStatus(projectPath);
  const doctor  = readDoctor(projectPath);
  const commits = getLastCommits(projectPath);
  const done    = tasks.filter(t => t.status === 'done').length;
  const failed  = tasks.filter(t => t.status === 'failed').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  return { projectPath, forge, tasks, done, failed, pending, total: tasks.length, ralph, doctor, commits };
}

function spawnLoop(projectPath) {
  const hasRalph = fs.existsSync(path.join(projectPath, 'cookbook', 'ralph-loop.ts'));
  const hasTask  = fs.existsSync(path.join(projectPath, 'cookbook', 'task-loop.ts'));
  if (!hasRalph && !hasTask) return { ok: false, error: 'No loop script found. Run: npx copilotforge init --full' };
  const scriptFile = hasRalph ? 'ralph-loop.ts' : 'task-loop.ts';
  const args = hasRalph ? ['tsx', 'cookbook/' + scriptFile, 'build', '50'] : ['tsx', 'cookbook/' + scriptFile];
  const child = spawn('npx', args, { cwd: projectPath, detached: true, stdio: 'ignore', shell: true });
  child.unref();
  return { ok: true, script: scriptFile, pid: child.pid };
}

function pauseLoop(projectPath) {
  fs.writeFileSync(path.join(projectPath, 'RALPH_PAUSE'), 'Paused at ' + new Date().toISOString() + '\n');
}

function buildHtml(projectPath) {
  const escaped = JSON.stringify(projectPath);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CopilotForge Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#c9d1d9;font-family:system-ui,sans-serif;font-size:14px;min-height:100vh}
header{background:#161b22;border-bottom:1px solid #30363d;padding:14px 24px;display:flex;align-items:center;gap:12px}
.logo{font-size:20px;font-weight:700;color:#58a6ff}
.project-name{font-size:14px;color:#8b949e}
.badge{padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600}
.badge-green{background:#1a4a2e;color:#3fb950}
.badge-red{background:#4a1a1a;color:#f85149}
main{display:grid;grid-template-columns:1fr 340px;gap:20px;padding:20px;max-width:1200px;margin:0 auto}
section{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e;margin-bottom:14px;font-weight:600}
.progress-bar{height:6px;background:#21262d;border-radius:3px;margin-bottom:16px;overflow:hidden}
.progress-fill{height:100%;background:#238636;border-radius:3px;transition:width .4s}
.task-list{display:flex;flex-direction:column;gap:4px;max-height:400px;overflow-y:auto}
.task{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;font-size:13px}
.task:hover{background:#21262d}
.task-icon{width:16px;text-align:center;flex-shrink:0}
.task-id{color:#8b949e;font-family:monospace;font-size:11px;width:110px;flex-shrink:0}
.task-done{color:#3fb950}
.task-failed{color:#f85149}
.task-pending{color:#c9d1d9}
.stat-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #21262d}
.stat-row:last-child{border-bottom:none}
.stat-label{color:#8b949e;font-size:13px}
.stat-value{font-weight:600;font-size:13px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-green{background:#238636;color:#fff}
.btn-yellow{background:#9e6a03;color:#fff}
.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.check-item{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px}
.check-ok{color:#3fb950}
.check-fail{color:#f85149}
.commit-list{display:flex;flex-direction:column;gap:4px}
.commit{font-family:monospace;font-size:12px;color:#8b949e;padding:3px 0}
.commit span{color:#58a6ff}
.ralph-running{color:#3fb950}
.ralph-idle{color:#8b949e}
.note{font-size:11px;color:#484f58;margin-top:8px}
.how-to{font-size:13px;color:#8b949e;line-height:1.7;margin-bottom:16px;padding:12px;background:#0d1117;border-radius:6px;border:1px solid #21262d}
.how-to strong{color:#c9d1d9}
.how-to code{color:#58a6ff;font-family:monospace;font-size:12px}
</style>
</head>
<body>
<header>
  <span class="logo">&#x26A1; CopilotForge</span>
  <span class="project-name" id="projectName">Loading...</span>
  <span class="badge badge-green" id="forgeBadge">Initialized</span>
</header>
<main>
  <section>
    <h2>&#x1F4CB; Implementation Plan</h2>
    <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
    <div id="planSummary" style="color:#8b949e;font-size:13px;margin-bottom:12px"></div>
    <div class="task-list" id="taskList"><em style="color:#484f58">Loading...</em></div>
  </section>

  <div style="display:flex;flex-direction:column;gap:20px">
    <section>
      <h2>&#x1F504; How to Use</h2>
      <div class="how-to">
        <strong>1.</strong> Open your project in <strong>VS Code</strong><br>
        <strong>2.</strong> In VS Code Copilot Chat, say <code>run the plan</code><br>
        <strong>3.</strong> <em>Or</em> click <strong>Start Build</strong> below for full auto-mode<br>
        <strong>4.</strong> This dashboard auto-refreshes every 4 seconds
      </div>
      <h2>&#x1F504; Ralph Status</h2>
      <div class="stat-row"><span class="stat-label">State</span><span class="stat-value ralph-idle" id="ralphState">Idle</span></div>
      <div class="stat-row"><span class="stat-label">Iteration</span><span class="stat-value" id="ralphIter">&#x2014;</span></div>
      <div class="stat-row"><span class="stat-label">Current task</span><span class="stat-value" id="ralphTask" style="max-width:160px;text-align:right;font-size:12px">&#x2014;</span></div>
      <div class="controls">
        <button class="btn btn-green" id="btnStart" onclick="startBuild()">&#x25B6; Start Build</button>
        <button class="btn btn-yellow" id="btnPause" onclick="pauseBuild()">&#x23F8; Pause</button>
      </div>
      <p class="note">Auto-refreshes every 4s &nbsp;&middot;&nbsp; Press Ctrl+C in terminal to stop dashboard</p>
    </section>

    <section>
      <h2>&#x1FA7A; Project Health</h2>
      <div id="doctorList"><em style="color:#484f58">Loading...</em></div>
    </section>

    <section>
      <h2>&#x1F4E6; Recent Commits</h2>
      <div class="commit-list" id="commitList"><em style="color:#484f58">None yet</em></div>
    </section>
  </div>
</main>

<script>
async function load() {
  try {
    const r = await fetch('/api/status');
    if (!r.ok) return;
    render(await r.json());
  } catch(e) {}
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function render(d) {
  // Header
  document.getElementById('projectName').textContent =
    d.forge ? d.forge.name + (d.forge.stack ? ' \u00B7 ' + d.forge.stack : '') : d.projectPath;
  if (!d.forge) {
    const b = document.getElementById('forgeBadge');
    b.textContent = 'Not initialized';
    b.className = 'badge badge-red';
  }

  // Plan
  const pct = d.total > 0 ? Math.round(d.done / d.total * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('planSummary').textContent = d.total
    ? d.done + ' done \u00B7 ' + d.pending + ' pending \u00B7 ' + d.failed + ' failed (' + pct + '%)'
    : 'No IMPLEMENTATION_PLAN.md \u2014 run: npx copilotforge init --full';

  const tl = document.getElementById('taskList');
  if (!d.tasks.length) {
    tl.innerHTML = '<em style="color:#484f58">No tasks yet</em>';
  } else {
    tl.innerHTML = d.tasks.map(t => {
      const icon = t.status === 'done' ? '\u2705' : t.status === 'failed' ? '\u274C' : '\u2B1C';
      return '<div class="task task-' + t.status + '"><span class="task-icon">' + icon + '</span>' +
        '<span class="task-id">' + esc(t.id) + '</span><span>' + esc(t.title) + '</span></div>';
    }).join('');
  }

  // Ralph
  const rph = d.ralph;
  if (rph && rph.running) {
    document.getElementById('ralphState').textContent = '\uD83D\uDFE2 Running';
    document.getElementById('ralphState').className = 'stat-value ralph-running';
    document.getElementById('ralphIter').textContent = rph.iteration + ' / ' + rph.maxIterations;
    document.getElementById('ralphTask').textContent = rph.currentTask || '\u2014';
  } else if (rph) {
    document.getElementById('ralphState').textContent = '\u26AA ' + (rph.currentTask || 'Stopped');
    document.getElementById('ralphState').className = 'stat-value ralph-idle';
    document.getElementById('ralphIter').textContent = rph.iteration ? 'Last: ' + rph.iteration : '\u2014';
    document.getElementById('ralphTask').textContent = '\u2014';
  }

  // Doctor
  document.getElementById('doctorList').innerHTML = (d.doctor || []).map(c =>
    '<div class="check-item"><span class="' + (c.ok ? 'check-ok' : 'check-fail') + '">' +
    (c.ok ? '\u2713' : '\u2717') + '</span><span>' + esc(c.label) + '</span></div>'
  ).join('');

  // Commits
  const cl = document.getElementById('commitList');
  cl.innerHTML = d.commits && d.commits.length
    ? d.commits.map(c => { const [sha,...rest]=c.split(' '); return '<div class="commit"><span>' + esc(sha) + '</span> ' + esc(rest.join(' ')) + '</div>'; }).join('')
    : '<em style="color:#484f58">No commits yet</em>';
}

async function startBuild() {
  document.getElementById('btnStart').disabled = true;
  try {
    const r = await fetch('/api/start', { method: 'POST' });
    const d = await r.json();
    if (!d.ok) alert('Could not start: ' + d.error);
    else alert('Build started! Check your terminal for output.');
  } catch(e) { alert('Error: ' + e.message); }
  setTimeout(() => { document.getElementById('btnStart').disabled = false; load(); }, 2000);
}

async function pauseBuild() {
  await fetch('/api/pause', { method: 'POST' });
  setTimeout(load, 1000);
}

load();
setInterval(load, 4000);
</script>
</body>
</html>`;
}

function createServer(projectPath) {
  return http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    if (url === '/api/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(buildStatus(projectPath)));
      return;
    }

    if (url === '/api/start' && req.method === 'POST') {
      const result = spawnLoop(projectPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    if (url === '/api/pause' && req.method === 'POST') {
      pauseLoop(projectPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(buildHtml(projectPath));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
}

function openBrowser(url) {
  const cmd =
    process.platform === 'win32'  ? 'start "" "' + url + '"' :
    process.platform === 'darwin' ? 'open "' + url + '"' :
                                    'xdg-open "' + url + '"';
  try { execSync(cmd, { stdio: 'ignore' }); } catch { /* ignore */ }
}

async function run() {
  const projectPath = process.cwd();
  const url = 'http://localhost:' + PORT;

  const server = createServer(projectPath);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      info('📊 Dashboard already running \u2192 ' + colors.cyan(url));
      openBrowser(url);
    } else {
      console.error('Dashboard error:', err.message);
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log();
    info('📊 CopilotForge Dashboard running at ' + colors.cyan(url));
    console.log();
    info('  Project: ' + colors.bold(projectPath));
    console.log();
    info(colors.dim('  Opening browser... press Ctrl+C to stop.'));
    console.log();
    openBrowser(url);
  });

  process.on('SIGINT', () => { server.close(); process.exit(0); });
}

// Backward-compat stubs
function tryOpen() { return false; }
function printInstallInstructions() {}

module.exports = { run, tryOpen, printInstallInstructions };
