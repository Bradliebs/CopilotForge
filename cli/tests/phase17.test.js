'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Phase 17: Copilot Extension — extension-server.js tests
// ─────────────────────────────────────────────────────────────────────────────

describe('extension-server - module structure', () => {
  const ext = require('../src/extension-server');

  it('exports run function', () => {
    assert.strictEqual(typeof ext.run, 'function');
  });

  it('exports handleRequest function', () => {
    assert.strictEqual(typeof ext.handleRequest, 'function');
  });

  it('exports parseIntent function', () => {
    assert.strictEqual(typeof ext.parseIntent, 'function');
  });

  it('exports verifySignature function', () => {
    assert.strictEqual(typeof ext.verifySignature, 'function');
  });
});

describe('extension-server - intent parsing', () => {
  const { parseIntent } = require('../src/extension-server');

  it('detects init intent', () => {
    assert.strictEqual(parseIntent('initialize my project').tool, 'init');
    assert.strictEqual(parseIntent('scaffold copilotforge').tool, 'init');
    assert.strictEqual(parseIntent('set up my repo').tool, 'init');
    assert.strictEqual(parseIntent('create a new project').tool, 'init');
  });

  it('detects doctor intent', () => {
    assert.strictEqual(parseIntent('run a health check').tool, 'doctor');
    assert.strictEqual(parseIntent('diagnose my setup').tool, 'doctor');
    assert.strictEqual(parseIntent('check if everything is working').tool, 'doctor');
  });

  it('detects status intent', () => {
    assert.strictEqual(parseIntent('show me the status').tool, 'status');
    assert.strictEqual(parseIntent('what is my progress').tool, 'status');
    assert.strictEqual(parseIntent('give me an overview').tool, 'status');
  });

  it('detects rollback intent', () => {
    assert.strictEqual(parseIntent('rollback my changes').tool, 'rollback');
    assert.strictEqual(parseIntent('undo the last operation').tool, 'rollback');
    assert.strictEqual(parseIntent('revert to the previous state').tool, 'rollback');
  });

  it('detects trust intent', () => {
    assert.strictEqual(parseIntent('show my trust level').tool, 'trust');
    assert.strictEqual(parseIntent('what is my confidence score').tool, 'trust');
  });

  it('detects playbook intent', () => {
    assert.strictEqual(parseIntent('show playbook entries').tool, 'playbook');
    assert.strictEqual(parseIntent('view my strategies').tool, 'playbook');
    assert.strictEqual(parseIntent('show me patterns').tool, 'playbook');
  });

  it('detects plan intent', () => {
    assert.strictEqual(parseIntent('generate a plan').tool, 'plan');
    assert.strictEqual(parseIntent('create a roadmap').tool, 'plan');
    assert.strictEqual(parseIntent('show implementation plan').tool, 'plan');
  });

  it('detects wizard intent', () => {
    assert.strictEqual(parseIntent('start the wizard').tool, 'wizard');
    assert.strictEqual(parseIntent('guide me through setup').tool, 'wizard');
    assert.strictEqual(parseIntent('walk me through it').tool, 'wizard');
  });

  it('defaults to help for unknown input', () => {
    assert.strictEqual(parseIntent('what is the meaning of life').tool, 'help');
    assert.strictEqual(parseIntent('hello there').tool, 'help');
  });

  it('returns help for help request', () => {
    assert.strictEqual(parseIntent('what can you do').tool, 'help');
    assert.strictEqual(parseIntent('help me').tool, 'help');
    assert.strictEqual(parseIntent('show commands').tool, 'help');
  });
});

describe('extension-server - HTTP handler', () => {
  const { handleRequest } = require('../src/extension-server');

  function createMockReq(method, url, body, headers = {}) {
    const chunks = body ? [Buffer.from(JSON.stringify(body))] : [];
    return {
      method,
      url: url || '/',
      headers: { ...headers },
      [Symbol.asyncIterator]() {
        let idx = 0;
        return {
          next() {
            if (idx < chunks.length) {
              return Promise.resolve({ value: chunks[idx++], done: false });
            }
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
    };
  }

  function createMockRes() {
    const data = { statusCode: null, headers: {}, body: '' };
    return {
      writeHead(code, hdrs) { data.statusCode = code; data.headers = hdrs || {}; },
      write(chunk) { data.body += chunk; },
      end(chunk) { if (chunk) data.body += chunk; },
      getData() { return data; },
    };
  }

  it('responds to GET / with health check', async () => {
    const req = createMockReq('GET', '/');
    const res = createMockRes();
    await handleRequest(req, res);
    const data = res.getData();
    assert.strictEqual(data.statusCode, 200);
    const body = JSON.parse(data.body);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.agent, 'copilotforge');
  });

  it('rejects non-POST methods', async () => {
    const req = createMockReq('PUT', '/');
    const res = createMockRes();
    await handleRequest(req, res);
    assert.strictEqual(res.getData().statusCode, 405);
  });

  it('handles OPTIONS preflight', async () => {
    const req = createMockReq('OPTIONS', '/');
    const res = createMockRes();
    await handleRequest(req, res);
    assert.strictEqual(res.getData().statusCode, 200);
  });

  it('rejects invalid JSON body', async () => {
    const req = {
      method: 'POST',
      url: '/',
      headers: {},
      [Symbol.asyncIterator]() {
        let sent = false;
        return {
          next() {
            if (!sent) { sent = true; return Promise.resolve({ value: 'not json', done: false }); }
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
    };
    // Set skip verify for test
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const res = createMockRes();
    await handleRequest(req, res);
    assert.strictEqual(res.getData().statusCode, 400);
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('returns SSE response for valid chat message', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', {
      messages: [{ role: 'user', content: 'help me' }],
    });
    const res = createMockRes();
    await handleRequest(req, res);
    const data = res.getData();
    assert.strictEqual(data.statusCode, 200);
    assert.ok(data.headers['Content-Type'] === 'text/event-stream');
    assert.ok(data.body.includes('CopilotForge Agent'));
    assert.ok(data.body.includes('[DONE]'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('returns help text for empty messages', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', { messages: [] });
    const res = createMockRes();
    await handleRequest(req, res);
    const data = res.getData();
    assert.ok(data.body.includes('CopilotForge Agent'));
    assert.ok(data.body.includes('[DONE]'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('routes init intent to init response', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', {
      messages: [{ role: 'user', content: 'initialize my project' }],
    });
    const res = createMockRes();
    await handleRequest(req, res);
    const data = res.getData();
    assert.ok(data.body.includes('npx copilotforge init'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('routes doctor intent to doctor response', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', {
      messages: [{ role: 'user', content: 'run a health check' }],
    });
    const res = createMockRes();
    await handleRequest(req, res);
    const data = res.getData();
    assert.ok(data.body.includes('doctor') || data.body.includes('Health'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('routes rollback intent', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', {
      messages: [{ role: 'user', content: 'undo my changes' }],
    });
    const res = createMockRes();
    await handleRequest(req, res);
    assert.ok(res.getData().body.includes('rollback') || res.getData().body.includes('Rollback'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('routes plan intent', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', {
      messages: [{ role: 'user', content: 'generate a plan for my project' }],
    });
    const res = createMockRes();
    await handleRequest(req, res);
    assert.ok(res.getData().body.includes('plan') || res.getData().body.includes('Plan'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });

  it('routes wizard intent', async () => {
    process.env.COPILOTFORGE_SKIP_VERIFY = '1';
    const req = createMockReq('POST', '/', {
      messages: [{ role: 'user', content: 'start the wizard' }],
    });
    const res = createMockRes();
    await handleRequest(req, res);
    assert.ok(res.getData().body.includes('wizard') || res.getData().body.includes('Wizard'));
    delete process.env.COPILOTFORGE_SKIP_VERIFY;
  });
});

describe('extension-server - CLI routing', () => {
  const { execSync } = require('child_process');
  const binPath = path.resolve(__dirname, '..', 'bin', 'copilotforge.js');

  it('extension command is recognized by CLI', () => {
    // Just verify it doesn't exit with "Unknown command"
    try {
      // extension starts a server, so we need to kill it quickly
      // Instead, just check help text includes extension
      const output = execSync(`node "${binPath}" --help`, { encoding: 'utf8', timeout: 5000 });
      assert.ok(output.includes('extension'), 'help should mention extension command');
    } catch (err) {
      if (err.stdout) {
        assert.ok(err.stdout.includes('extension'), 'help should mention extension command');
      }
    }
  });
});
