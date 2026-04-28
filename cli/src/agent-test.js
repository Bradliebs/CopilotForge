'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Agent Testing Framework — Phase 20
 *
 * Unit and integration tests for agent behaviors with mock conversation
 * contexts and assertion helpers. Tests agent files (.agent.md) for:
 *   - Required sections (Role, Instructions, Tools)
 *   - Trigger phrase coverage
 *   - Instruction clarity and length
 *   - Cross-agent conflicts
 *
 * Usage:
 *   copilotforge test-agents                   Test all agents
 *   copilotforge test-agents <agent.md>        Test a specific agent
 *   copilotforge test-agents --strict          Fail on warnings
 */

// ── Agent parser ────────────────────────────────────────────────────────

function parseAgentFile(content) {
  const sections = {};
  let currentSection = null;
  let currentContent = [];

  for (const line of content.split('\n')) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = headerMatch[1].trim().toLowerCase();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  // Extract title from H1
  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

  return { title, sections, raw: content };
}

// ── Test rules ──────────────────────────────────────────────────────────

const AGENT_RULES = [
  {
    id: 'has-title',
    severity: 'error',
    test: (agent) => !!agent.title && agent.title !== 'Unknown',
    message: 'Agent must have an H1 title',
  },
  {
    id: 'has-role',
    severity: 'error',
    test: (agent) => !!agent.sections.role || !!agent.sections.description,
    message: 'Agent should have a Role or Description section',
  },
  {
    id: 'has-instructions',
    severity: 'error',
    test: (agent) => !!agent.sections.instructions || !!agent.sections.behavior || !!agent.sections.rules,
    message: 'Agent should have Instructions, Behavior, or Rules section',
  },
  {
    id: 'has-triggers',
    severity: 'warn',
    test: (agent) => !!agent.sections.triggers || !!agent.sections['trigger phrases'] || agent.raw.toLowerCase().includes('trigger'),
    message: 'Agent should define trigger phrases for activation',
  },
  {
    id: 'reasonable-length',
    severity: 'warn',
    test: (agent) => agent.raw.length >= 100 && agent.raw.length <= 50000,
    message: (agent) => agent.raw.length < 100
      ? `Agent file is too short (${agent.raw.length} chars) — add more detail`
      : `Agent file is very long (${agent.raw.length} chars) — consider splitting`,
  },
  {
    id: 'no-placeholder',
    severity: 'warn',
    test: (agent) => !agent.raw.includes('[TODO]') && !agent.raw.includes('[PLACEHOLDER]') && !agent.raw.includes('[YOUR '),
    message: 'Agent contains placeholder text — fill in all sections',
  },
  {
    id: 'has-tools',
    severity: 'info',
    test: (agent) => !!agent.sections.tools || !!agent.sections.capabilities || agent.raw.toLowerCase().includes('tool'),
    message: 'Consider defining available tools or capabilities',
  },
];

// ── Test runner ─────────────────────────────────────────────────────────

function testAgent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const agent = parseAgentFile(content);
  const findings = [];

  for (const rule of AGENT_RULES) {
    const passed = rule.test(agent);
    if (!passed) {
      const msg = typeof rule.message === 'function' ? rule.message(agent) : rule.message;
      findings.push({ rule: rule.id, severity: rule.severity, message: msg });
    }
  }

  return {
    file: filePath,
    agent: agent.title,
    sections: Object.keys(agent.sections),
    length: content.length,
    findings,
    passed: findings.filter((f) => f.severity === 'error').length === 0,
  };
}

function testAllAgents(cwd, strict = false) {
  const agentDirs = [
    path.join(cwd, '.copilot', 'agents'),
    path.join(cwd, '.github', 'agents'),
  ];

  const results = [];

  for (const dir of agentDirs) {
    if (!exists(dir)) continue;
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        results.push(testAgent(path.join(dir, file)));
      }
    } catch { /* ignore */ }
  }

  const allPassed = strict
    ? results.every((r) => r.findings.length === 0)
    : results.every((r) => r.passed);

  return { results, allPassed, agentCount: results.length };
}

// ── Cross-agent conflict detection ──────────────────────────────────────

function detectConflicts(cwd) {
  const agentDirs = [
    path.join(cwd, '.copilot', 'agents'),
    path.join(cwd, '.github', 'agents'),
  ];

  const agents = [];
  for (const dir of agentDirs) {
    if (!exists(dir)) continue;
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const parsed = parseAgentFile(content);
        agents.push({ file, ...parsed });
      }
    } catch { /* ignore */ }
  }

  const conflicts = [];

  // Check for duplicate trigger phrases
  const triggerMap = new Map();
  for (const agent of agents) {
    const triggers = (agent.sections.triggers || agent.sections['trigger phrases'] || '').toLowerCase();
    const words = triggers.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
    for (const word of words) {
      if (triggerMap.has(word)) {
        conflicts.push({
          type: 'duplicate-trigger',
          trigger: word,
          agents: [triggerMap.get(word), agent.title],
        });
      } else {
        triggerMap.set(word, agent.title);
      }
    }
  }

  return conflicts;
}

// ── Mock context for testing ────────────────────────────────────────────

function createMockContext(overrides = {}) {
  return {
    message: '',
    role: 'user',
    history: [],
    workspace: { files: [], cwd: process.cwd() },
    agent: null,
    ...overrides,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const strict = args.includes('--strict');
  const singleFile = args.find((a) => !a.startsWith('-') && a.endsWith('.md'));

  console.log();
  info('🧪 CopilotForge Agent Test Runner');
  console.log();

  if (singleFile) {
    const filePath = path.resolve(cwd, singleFile);
    if (!exists(filePath)) {
      warn(`  File not found: ${singleFile}`);
      process.exit(1);
    }
    const result = testAgent(filePath);
    printResult(result);
    return;
  }

  const { results, allPassed, agentCount } = testAllAgents(cwd, strict);

  if (agentCount === 0) {
    info('  No agent files found in .copilot/agents/ or .github/agents/');
    console.log();
    return;
  }

  for (const result of results) {
    printResult(result);
  }

  // Cross-agent conflicts
  const conflicts = detectConflicts(cwd);
  if (conflicts.length > 0) {
    console.log();
    warn('  ⚠️ Cross-agent conflicts:');
    for (const c of conflicts) {
      warn(`    Duplicate trigger "${c.trigger}": ${c.agents.join(' vs ')}`);
    }
  }

  console.log();
  const icon = allPassed ? '✅' : '❌';
  info(`  ${icon} ${agentCount} agent(s) tested — ${allPassed ? 'all passed' : 'issues found'}`);
  console.log();
}

function printResult(result) {
  const icon = result.passed ? '✅' : '❌';
  info(`  ${icon} ${colors.cyan(result.agent)} (${path.basename(result.file)})`);

  if (result.findings.length > 0) {
    for (const f of result.findings) {
      const sevIcon = f.severity === 'error' ? '❌' : f.severity === 'warn' ? '⚠️' : 'ℹ️';
      info(`     ${sevIcon} ${f.message}`);
    }
  }
}

module.exports = {
  run,
  testAgent,
  testAllAgents,
  parseAgentFile,
  detectConflicts,
  createMockContext,
  AGENT_RULES,
};
