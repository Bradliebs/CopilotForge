'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * CopilotForge MCP Server — Model Context Protocol over stdio
 *
 * Implements the MCP JSON-RPC 2.0 protocol without external dependencies.
 * Exposes CopilotForge tools: init, doctor, status, rollback.
 *
 * Usage: copilotforge mcp
 * Protocol: JSON-RPC 2.0 over stdin/stdout
 * Logging: stderr only (stdout is reserved for protocol messages)
 */

const SERVER_INFO = {
  name: 'copilotforge',
  version: '1.9.0',
};

const TOOLS = [
  {
    name: 'copilotforge_init',
    description: 'Initialize CopilotForge in a project directory',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Working directory path' },
        full: { type: 'boolean', description: 'Full setup (default)', default: true },
        minimal: { type: 'boolean', description: 'Minimal setup — planner skill only' },
        oraclePrime: { type: 'boolean', description: 'Oracle Prime only' },
        dryRun: { type: 'boolean', description: 'Preview without writing files' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'copilotforge_doctor',
    description: 'Run health check on a CopilotForge project',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Working directory path' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'copilotforge_status',
    description: 'Get project status — plan progress, skills, agents, memory',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Working directory path' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'copilotforge_rollback',
    description: 'List or restore snapshots from a previous init/upgrade',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Working directory path' },
        list: { type: 'boolean', description: 'List available snapshots' },
        latest: { type: 'boolean', description: 'Restore the most recent snapshot' },
        dryRun: { type: 'boolean', description: 'Preview without restoring' },
      },
      required: ['cwd'],
    },
  },
];

// ── JSON-RPC helpers ────────────────────────────────────────────────────

function jsonRpcResponse(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function jsonRpcError(id, code, message) {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

function log(msg) {
  process.stderr.write(`[copilotforge-mcp] ${msg}\n`);
}

// ── Tool handlers ───────────────────────────────────────────────────────

function handleInit(params) {
  const cwd = params.cwd || process.cwd();
  const args = ['--yes'];

  if (params.minimal) args.push('--minimal');
  if (params.oraclePrime) args.push('--oracle-prime');
  if (params.dryRun) args.push('--dry-run');

  try {
    const { execSync } = require('child_process');
    const binPath = path.join(__dirname, '..', 'bin', 'copilotforge.js');
    const output = execSync(`node "${binPath}" init ${args.join(' ')}`, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 30000,
    });
    return { success: true, output: output.trim() };
  } catch (err) {
    return { success: false, error: err.message, output: err.stdout?.toString() || '' };
  }
}

function handleDoctor(params) {
  const cwd = params.cwd || process.cwd();

  try {
    const { execSync } = require('child_process');
    const binPath = path.join(__dirname, '..', 'bin', 'copilotforge.js');
    const output = execSync(`node "${binPath}" doctor --json`, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 30000,
    });
    return JSON.parse(output);
  } catch (err) {
    const stdout = err.stdout?.toString() || '';
    try {
      return JSON.parse(stdout);
    } catch {
      return { success: false, error: err.message };
    }
  }
}

function handleStatus(params) {
  const cwd = params.cwd || process.cwd();

  try {
    const { getPlanData, getMemoryData, getSkillsData, getAgentsData, getCookbookData } = require('./status');
    return {
      success: true,
      plan: getPlanData(cwd),
      memory: getMemoryData(cwd),
      skills: getSkillsData(cwd),
      agents: getAgentsData(cwd),
      cookbook: getCookbookData(cwd),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function handleRollback(params) {
  const cwd = params.cwd || process.cwd();

  try {
    const { listSnapshots, restoreSnapshot } = require('./rollback');

    if (params.list) {
      const snapshots = listSnapshots(cwd);
      return { success: true, snapshots };
    }

    if (params.latest) {
      const snapshots = listSnapshots(cwd);
      if (snapshots.length === 0) {
        return { success: false, error: 'No snapshots found for this project' };
      }
      const results = restoreSnapshot(snapshots[0].id, cwd, params.dryRun || false);
      return { success: true, snapshotId: snapshots[0].id, dryRun: !!params.dryRun, ...results };
    }

    // Default: list
    const snapshots = listSnapshots(cwd);
    return { success: true, snapshots };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── MCP protocol handler ────────────────────────────────────────────────

function handleMessage(msg) {
  const { method, id, params } = msg;

  switch (method) {
    case 'initialize':
      return jsonRpcResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case 'notifications/initialized':
      // Client acknowledgment — no response needed
      return null;

    case 'tools/list':
      return jsonRpcResponse(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      let result;
      switch (toolName) {
        case 'copilotforge_init':
          result = handleInit(toolArgs);
          break;
        case 'copilotforge_doctor':
          result = handleDoctor(toolArgs);
          break;
        case 'copilotforge_status':
          result = handleStatus(toolArgs);
          break;
        case 'copilotforge_rollback':
          result = handleRollback(toolArgs);
          break;
        default:
          return jsonRpcError(id, -32601, `Unknown tool: ${toolName}`);
      }

      return jsonRpcResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    }

    case 'ping':
      return jsonRpcResponse(id, {});

    default:
      if (id !== undefined) {
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
      }
      return null; // Notifications don't get responses
  }
}

// ── MCP config generation ───────────────────────────────────────────────

function generateMcpConfig() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const configDir = path.join(home, '.copilotforge');
  const configPath = path.join(configDir, 'mcp-config.json');

  const config = {
    mcpServers: {
      copilotforge: {
        command: 'npx',
        args: ['copilotforge', 'mcp'],
      },
    },
  };

  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    log(`Generated MCP config at ${configPath}`);
    log('');
    log('To use with Claude Desktop, add this to claude_desktop_config.json:');
    log(JSON.stringify(config, null, 2));
    log('');
    log('To use with VS Code, add to .vscode/mcp.json:');
    log(JSON.stringify({
      servers: {
        copilotforge: {
          type: 'stdio',
          command: 'npx',
          args: ['copilotforge', 'mcp'],
        },
      },
    }, null, 2));
  }
}

// ── Server entry point ──────────────────────────────────────────────────

function run() {
  generateMcpConfig();
  log('MCP server starting on stdio...');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let buffer = '';

  rl.on('line', (line) => {
    buffer += line;

    try {
      const msg = JSON.parse(buffer);
      buffer = '';

      const response = handleMessage(msg);
      if (response) {
        process.stdout.write(response + '\n');
      }
    } catch {
      // Incomplete JSON — accumulate
    }
  });

  rl.on('close', () => {
    log('MCP server shutting down.');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    log('MCP server interrupted.');
    process.exit(0);
  });
}

module.exports = { run, handleMessage, TOOLS, SERVER_INFO };
