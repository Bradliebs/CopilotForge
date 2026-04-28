'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { colors, info, warn } = require('./utils');

/**
 * CopilotForge Copilot Extension — GitHub Copilot Agent
 *
 * Exposes CopilotForge tools as a GitHub Copilot Chat agent (@copilotforge).
 * Receives POST requests from GitHub Copilot, responds with SSE streams.
 *
 * Usage: copilotforge extension [--port PORT]
 * Default port: 3456
 *
 * Setup:
 *   1. Create a GitHub App with Copilot Agent type
 *   2. Set the endpoint URL to this server's public URL
 *   3. Install the app on your account/org
 */

const DEFAULT_PORT = 3456;

// ── SSE helpers ─────────────────────────────────────────────────────────

function sseAck(res) {
  res.write('event: copilot_confirmation\ndata: {"type":"action","title":"Processing your request...","message":"CopilotForge is working on it."}\n\n');
}

function sseText(res, text) {
  const data = JSON.stringify({ choices: [{ delta: { content: text } }] });
  res.write(`data: ${data}\n\n`);
}

function sseDone(res) {
  res.write('data: [DONE]\n\n');
  res.end();
}

function sseError(res, message) {
  const data = JSON.stringify({
    choices: [{ delta: { content: `\n\n**Error:** ${message}` } }],
  });
  res.write(`data: ${data}\n\n`);
  sseDone(res);
}

// ── Signature verification ──────────────────────────────────────────────

let cachedPublicKeys = null;
let cacheExpiry = 0;

function fetchPublicKeys() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://api.github.com/meta/public_keys/copilot_api', {
      headers: { 'User-Agent': 'CopilotForge-Extension/1.0' },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.public_keys || []);
        } catch {
          reject(new Error('Failed to parse public keys response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout fetching public keys')); });
  });
}

async function verifySignature(payload, signature, keyId) {
  if (!signature || !keyId) return false;

  try {
    // Cache public keys for 1 hour
    if (!cachedPublicKeys || Date.now() > cacheExpiry) {
      cachedPublicKeys = await fetchPublicKeys();
      cacheExpiry = Date.now() + 3600000;
    }

    const key = cachedPublicKeys.find((k) => k.key_identifier === keyId);
    if (!key) return false;

    const verify = crypto.createVerify('SHA256');
    verify.update(payload);
    return verify.verify(key.key, signature, 'base64');
  } catch {
    return false;
  }
}

// ── LLM passthrough ─────────────────────────────────────────────────────

/**
 * Forward conversation to GitHub Copilot's LLM for conversational responses.
 * Uses the X-GitHub-Token from the incoming request to authenticate.
 * Falls back to static help text if the token is missing or the API fails.
 */
function llmPassthrough(messages, token, res) {
  if (!token) {
    sseText(res, getHelpText());
    sseDone(res);
    return;
  }

  const systemMessage = {
    role: 'system',
    content: 'You are the CopilotForge assistant (@copilotforge). You help developers set up and manage AI-powered coding assistants. You know about CopilotForge commands: init, doctor, status, rollback, trust, playbook, plan, wizard, compact, extension, mcp. Be concise and helpful. When users ask about setting up AI tools, suggest relevant CopilotForge commands.',
  };

  const payload = JSON.stringify({
    model: 'gpt-4o',
    messages: [systemMessage, ...messages],
    stream: true,
  });

  const options = {
    hostname: 'api.githubcopilot.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'User-Agent': 'CopilotForge-Extension/1.0',
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    if (apiRes.statusCode !== 200) {
      // Fallback to static help on API failure
      sseText(res, getHelpText());
      sseDone(res);
      return;
    }

    // Pipe the SSE stream from the API directly to the client
    apiRes.on('data', (chunk) => {
      res.write(chunk);
    });

    apiRes.on('end', () => {
      res.end();
    });
  });

  apiReq.on('error', () => {
    sseText(res, getHelpText());
    sseDone(res);
  });

  apiReq.setTimeout(30000, () => {
    apiReq.destroy();
    sseText(res, getHelpText());
    sseDone(res);
  });

  apiReq.write(payload);
  apiReq.end();
}

// ── Tool execution ──────────────────────────────────────────────────────

function parseIntent(message) {
  const lower = message.toLowerCase();

  if (/\b(init|scaffold|setup|create|start)\b/.test(lower)) {
    return { tool: 'init', args: {} };
  }
  if (/\b(doctor|health|check|diagnose)\b/.test(lower)) {
    return { tool: 'doctor', args: {} };
  }
  if (/\b(status|progress|overview)\b/.test(lower)) {
    return { tool: 'status', args: {} };
  }
  if (/\b(rollback|undo|revert|restore)\b/.test(lower)) {
    return { tool: 'rollback', args: {} };
  }
  if (/\b(trust|confidence|autonomy)\b/.test(lower)) {
    return { tool: 'trust', args: {} };
  }
  if (/\b(playbook|strategies|patterns|memory)\b/.test(lower)) {
    return { tool: 'playbook', args: {} };
  }
  if (/\b(plan|roadmap|implementation)\b/.test(lower)) {
    return { tool: 'plan', args: {} };
  }
  if (/\b(wizard|guide|walk.?through)\b/.test(lower)) {
    return { tool: 'wizard', args: {} };
  }
  if (/\b(help|commands|what can you do)\b/.test(lower)) {
    return { tool: 'help', args: {} };
  }

  return { tool: 'chat', args: {} };
}

function getHelpText() {
  return `## CopilotForge Agent

I can help you set up and manage AI-powered coding assistants in your project.

**Available commands:**
- **init** — Scaffold CopilotForge in your project
- **doctor** — Run a health check on your setup
- **status** — Show project progress and configuration
- **rollback** — Undo the last CopilotForge operation
- **trust** — Show your trust trajectory
- **playbook** — View experiential memory entries
- **plan** — Generate an implementation plan
- **wizard** — Start the interactive setup wizard

Just describe what you need and I'll figure out the right tool to use.`;
}

function executeTool(intent, cwd) {
  try {
    switch (intent.tool) {
      case 'init': {
        return '## CopilotForge Init\n\nTo initialize CopilotForge in your project, run:\n\n```bash\nnpx copilotforge init\n```\n\nOr for the full setup with memory, agents, and recipes:\n\n```bash\nnpx copilotforge init --full\n```\n\n> **Tip:** Use `--minimal` for just the planner skill, or `--oracle-prime` for the reasoning framework only.';
      }
      case 'doctor': {
        const doctor = require('./doctor');
        const origArgv = process.argv;
        process.argv = ['node', 'copilotforge', 'doctor', '--json'];
        const origCwd = process.cwd();
        try { process.chdir(cwd); } catch { /* keep current */ }
        let result;
        try {
          result = doctor.run();
        } finally {
          process.argv = origArgv;
          try { process.chdir(origCwd); } catch { /* ignore */ }
        }
        if (typeof result === 'string') {
          try {
            const parsed = JSON.parse(result);
            const icon = parsed.healthy ? '✅' : '❌';
            let output = `## ${icon} Health Check\n\n`;
            output += `**Status:** ${parsed.healthy ? 'Healthy' : 'Issues found'}\n`;
            output += `**Checks:** ${parsed.summary.passed} passed, ${parsed.summary.warned} warnings, ${parsed.summary.failed} failed\n\n`;
            if (parsed.checks) {
              for (const check of parsed.checks) {
                const sym = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
                output += `${sym} ${check.message}\n`;
              }
            }
            return output;
          } catch { return result; }
        }
        return '## Health Check\n\nRun `npx copilotforge doctor` in your project directory for a full health check.';
      }
      case 'status': {
        return '## Project Status\n\nRun `npx copilotforge status` in your project directory to see:\n\n- Build path detection\n- Skill and agent inventory\n- Memory system status\n- Trust level\n- Plan progress';
      }
      case 'rollback': {
        return '## Rollback\n\nTo undo the last CopilotForge operation:\n\n```bash\nnpx copilotforge rollback\n```\n\nThis restores files from the most recent snapshot. Use `--list` to see available snapshots.';
      }
      case 'trust': {
        try {
          const trust = require('./trust');
          const level = trust.getTrustLevel(cwd);
          const signals = trust.getSignals(cwd);
          let output = `## Trust Trajectory\n\n**Current level:** ${level}\n\n**Signals:**\n`;
          for (const [key, val] of Object.entries(signals)) {
            output += `- ${key}: ${val}\n`;
          }
          return output;
        } catch {
          return '## Trust\n\nRun `npx copilotforge trust` to see your trust trajectory.';
        }
      }
      case 'playbook': {
        try {
          const em = require('./experiential-memory');
          const top = em.getTopEntries(5, cwd);
          if (top.length === 0) {
            return '## Playbook\n\nNo playbook entries yet. Entries accumulate as you work with CopilotForge.\n\nRun `npx copilotforge playbook` to manage your experiential memory.';
          }
          let output = '## Top Playbook Entries\n\n';
          for (const entry of top) {
            output += `### [${entry.type}] ${entry.title} (score: ${entry.score})\n${entry.content}\n\n`;
          }
          return output;
        } catch {
          return '## Playbook\n\nRun `npx copilotforge playbook` to view your experiential memory.';
        }
      }
      case 'plan': {
        return '## Plan Generation\n\nGenerate an implementation plan from a project description:\n\n```bash\nnpx copilotforge plan "Build a REST API with auth"\n```\n\nAdd `--stack node,express` to specify your tech stack, or `--dry-run` to preview without writing.';
      }
      case 'wizard': {
        return '## Setup Wizard\n\nStart the interactive wizard to configure CopilotForge:\n\n```bash\nnpx copilotforge wizard\n```\n\nThe wizard asks 6 questions to detect your project type and generate the right scaffolding.';
      }
      case 'help':
      default:
        return getHelpText();
    }
  } catch (err) {
    return `## Error\n\nFailed to execute ${intent.tool}: ${err.message}\n\nTry running \`npx copilotforge ${intent.tool}\` directly.`;
  }
}

// ── Request handler ─────────────────────────────────────────────────────

async function handleRequest(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-GitHub-Token, Github-Public-Key-Signature, Github-Public-Key-Identifier',
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', agent: 'copilotforge', version: require('../package.json').version }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Read body
  let body = '';
  for await (const chunk of req) { body += chunk; }

  // Verify signature in production (skip if COPILOTFORGE_SKIP_VERIFY is set for local dev)
  if (!process.env.COPILOTFORGE_SKIP_VERIFY) {
    const signature = req.headers['github-public-key-signature'];
    const keyId = req.headers['github-public-key-identifier'];
    if (signature || keyId) {
      const valid = await verifySignature(body, signature, keyId);
      if (!valid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }
    }
  }

  // Parse request
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  // Start SSE response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  sseAck(res);

  // Extract the latest user message
  const messages = payload.messages || [];
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const userText = lastUserMessage?.content || '';

  if (!userText.trim()) {
    sseText(res, getHelpText());
    sseDone(res);
    return;
  }

  // Parse intent and execute
  const intent = parseIntent(userText);
  const cwd = process.cwd();
  const token = req.headers['x-github-token'] || '';

  // Route to LLM passthrough for conversational messages
  if (intent.tool === 'chat') {
    llmPassthrough(messages, token, res);
    return;
  }

  const result = executeTool(intent, cwd);

  sseText(res, result);
  sseDone(res);
}

// ── Server ──────────────────────────────────────────────────────────────

function run(args = []) {
  const portIdx = args.indexOf('--port');
  const port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) || DEFAULT_PORT : DEFAULT_PORT;

  const server = http.createServer(handleRequest);

  server.listen(port, '127.0.0.1', () => {
    console.log();
    info(`🔌 CopilotForge Copilot Extension running at ${colors.cyan(`http://127.0.0.1:${port}`)}`);
    console.log();
    info('  Agent endpoint: POST /');
    info('  Health check:   GET /');
    console.log();
    info(colors.dim('  Set COPILOTFORGE_SKIP_VERIFY=1 for local development'));
    info(colors.dim('  Press Ctrl+C to stop'));
    console.log();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      warn(`Port ${port} is already in use. Try --port ${port + 1}`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });

  process.on('SIGINT', () => { server.close(); process.exit(0); });
}

module.exports = { run, handleRequest, parseIntent, verifySignature, llmPassthrough };
