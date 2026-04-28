'use strict';

const fs = require('fs');
const path = require('path');
const { exists, writeFile, colors, info, success } = require('./utils');

/**
 * CopilotForge Plan Generator
 *
 * Auto-generates IMPLEMENTATION_PLAN.md tasks from wizard Q1 (project
 * description) and Q2 (stack). Uses heuristic task decomposition —
 * no LLM call required.
 *
 * Task categories:
 *   - Setup: project initialization, dependencies, config
 *   - Core: primary features from project description
 *   - Quality: testing, linting, error handling
 *   - Infrastructure: deployment, CI/CD, docs
 */

// ── Stack-specific task templates ───────────────────────────────────────

const STACK_TASKS = {
  // TypeScript / JavaScript
  typescript: [
    { id: 'setup-typescript', title: 'Set up TypeScript configuration (tsconfig.json, strict mode)' },
    { id: 'setup-linting', title: 'Configure ESLint and Prettier for TypeScript' },
  ],
  express: [
    { id: 'setup-express', title: 'Initialize Express server with middleware stack' },
    { id: 'add-routes', title: 'Define API route structure and handlers' },
    { id: 'add-error-handler', title: 'Add centralized error handling middleware' },
  ],
  nextjs: [
    { id: 'setup-nextjs', title: 'Initialize Next.js app with App Router' },
    { id: 'add-layouts', title: 'Create root and nested layouts' },
    { id: 'add-api-routes', title: 'Add API routes with input validation' },
  ],
  react: [
    { id: 'setup-react', title: 'Set up React component structure' },
    { id: 'add-routing', title: 'Configure React Router with route guards' },
  ],
  prisma: [
    { id: 'setup-prisma', title: 'Configure Prisma schema and database connection' },
    { id: 'add-models', title: 'Define data models in Prisma schema' },
    { id: 'add-migrations', title: 'Create initial database migration' },
  ],
  // Python
  python: [
    { id: 'setup-python', title: 'Set up Python project structure (pyproject.toml or requirements.txt)' },
    { id: 'setup-venv', title: 'Configure virtual environment and dependencies' },
  ],
  fastapi: [
    { id: 'setup-fastapi', title: 'Initialize FastAPI application with router structure' },
    { id: 'add-endpoints', title: 'Define API endpoints with Pydantic models' },
    { id: 'add-middleware', title: 'Add CORS, auth, and error handling middleware' },
  ],
  django: [
    { id: 'setup-django', title: 'Initialize Django project and app structure' },
    { id: 'add-models', title: 'Define Django models and run migrations' },
  ],
  // Database
  postgresql: [
    { id: 'setup-database', title: 'Configure PostgreSQL connection and pooling' },
  ],
  mongodb: [
    { id: 'setup-database', title: 'Configure MongoDB connection with Mongoose' },
  ],
};

// ── Universal task templates ────────────────────────────────────────────

const SETUP_TASKS = [
  { id: 'init-project', title: 'Initialize project structure and package manager' },
  { id: 'setup-git', title: 'Configure .gitignore and initial commit' },
];

const QUALITY_TASKS = [
  { id: 'add-tests', title: 'Add unit test framework and first test suite' },
  { id: 'add-error-handling', title: 'Implement error handling patterns across the codebase' },
  { id: 'add-input-validation', title: 'Add input validation at API/function boundaries' },
];

const INFRA_TASKS = [
  { id: 'add-env-config', title: 'Set up environment variable management (.env, config module)' },
  { id: 'add-readme', title: 'Write README with setup instructions and API documentation' },
];

// ── Feature extraction from description ─────────────────────────────────

/**
 * Extract feature tasks from a natural-language project description.
 * @param {string} description - Q1 answer
 * @returns {Array<{ id: string, title: string }>}
 */
function extractFeatures(description) {
  const features = [];
  const lower = description.toLowerCase();

  // Auth / authentication
  if (/\bauth\b|\blogin\b|\bsign.?up\b|\bpassword\b|\bjwt\b|\boauth\b/i.test(lower)) {
    features.push({ id: 'add-auth', title: 'Implement user authentication (register, login, JWT/session)' });
  }

  // CRUD / database operations
  if (/\bcrud\b|\bcreate.*read.*update\b|\bdata.*management\b/i.test(lower)) {
    features.push({ id: 'add-crud', title: 'Implement CRUD operations for core data models' });
  }

  // API
  if (/\bapi\b|\brest\b|\brendpoint\b|\bgraphql\b/i.test(lower)) {
    features.push({ id: 'add-api', title: 'Build core API endpoints with request/response schemas' });
  }

  // Real-time
  if (/\breal.?time\b|\bwebsocket\b|\bnotification\b|\bchat\b|\blive\b/i.test(lower)) {
    features.push({ id: 'add-realtime', title: 'Add real-time communication (WebSocket or SSE)' });
  }

  // Dashboard / admin
  if (/\bdashboard\b|\badmin\b|\banalytics\b|\bmetrics\b/i.test(lower)) {
    features.push({ id: 'add-dashboard', title: 'Build dashboard/admin interface with data visualization' });
  }

  // Search
  if (/\bsearch\b|\bfilter\b|\bquery\b/i.test(lower)) {
    features.push({ id: 'add-search', title: 'Implement search and filtering functionality' });
  }

  // File upload
  if (/\bupload\b|\bfile\b|\bimage\b|\bmedia\b/i.test(lower)) {
    features.push({ id: 'add-uploads', title: 'Add file upload handling and storage' });
  }

  // Payment
  if (/\bpay\b|\bstripe\b|\bbilling\b|\bsubscription\b|\bcheckout\b/i.test(lower)) {
    features.push({ id: 'add-payments', title: 'Integrate payment processing (Stripe or equivalent)' });
  }

  // Email
  if (/\bemail\b|\bnotif\b|\bsend.*message\b/i.test(lower)) {
    features.push({ id: 'add-notifications', title: 'Add email/notification system' });
  }

  // If no features detected, add generic core task
  if (features.length === 0) {
    features.push({ id: 'add-core-feature', title: `Implement core functionality: ${description.slice(0, 80)}` });
  }

  return features;
}

// ── Stack detection ─────────────────────────────────────────────────────

/**
 * Detect stack components from Q2 answer.
 * @param {string} stack - Q2 answer
 * @returns {string[]} - Matched stack keys
 */
function detectStack(stack) {
  const lower = stack.toLowerCase();
  const detected = [];

  const patterns = {
    typescript: /\btypescript\b|\bts\b/,
    express: /\bexpress\b/,
    nextjs: /\bnext\.?js\b|\bnext\b/,
    react: /\breact\b/,
    prisma: /\bprisma\b/,
    python: /\bpython\b|\bpy\b/,
    fastapi: /\bfastapi\b|\bfast.?api\b/,
    django: /\bdjango\b/,
    postgresql: /\bpostgres\b|\bpostgresql\b|\bpg\b/,
    mongodb: /\bmongo\b|\bmongodb\b/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(lower)) detected.push(key);
  }

  return detected;
}

// ── Plan generation ─────────────────────────────────────────────────────

/**
 * Generate an implementation plan from wizard answers.
 * @param {object} answers - { project: string, stack: string }
 * @returns {string} - IMPLEMENTATION_PLAN.md content
 */
function generatePlan(answers) {
  const tasks = [];
  const seen = new Set();

  function addTask(task) {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      tasks.push(task);
    }
  }

  // Setup tasks
  for (const t of SETUP_TASKS) addTask(t);

  // Stack-specific tasks
  const stackKeys = detectStack(answers.stack || '');
  for (const key of stackKeys) {
    if (STACK_TASKS[key]) {
      for (const t of STACK_TASKS[key]) addTask(t);
    }
  }

  // Feature tasks from description
  const features = extractFeatures(answers.project || '');
  for (const t of features) addTask(t);

  // Quality tasks
  for (const t of QUALITY_TASKS) addTask(t);

  // Playbook-driven tasks — inject tasks from high-scored playbook strategies
  try {
    const { getTopEntries } = require('./experiential-memory');
    const topEntries = getTopEntries(5, answers.cwd || process.cwd());
    for (const entry of topEntries) {
      if (entry.type === 'STRATEGY' && entry.score >= 2) {
        // Convert high-scored strategies into plan tasks
        const taskId = `playbook-${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
        addTask({ id: taskId, title: `[From playbook] ${entry.title}` });
      }
    }
  } catch { /* playbook is optional */ }

  // Infrastructure tasks
  for (const t of INFRA_TASKS) addTask(t);

  // Build the plan document
  const lines = [
    '# Implementation Plan',
    '#',
    `# Generated by CopilotForge from: "${(answers.project || '').slice(0, 100)}"`,
    `# Stack: ${answers.stack || 'auto-detect'}`,
    `# Generated: ${new Date().toISOString().slice(0, 10)}`,
    '#',
    '# HOW IT WORKS:',
    '#   1. The Ralph Loop reads this file',
    '#   2. Picks the next [ ] task',
    '#   3. Implements it, validates, commits',
    '#   4. Marks [x] done or [!] failed',
    '#   5. Repeats until all tasks are done',
    '#',
    '# TASK FORMAT:',
    '#   - [ ] task-id — Task description (pending)',
    '#   - [x] task-id — Task description (done)',
    '#   - [!] task-id — Task description (failed)',
    '',
    ...tasks.map((t) => `- [ ] ${t.id} — ${t.title}`),
  ];

  return lines.join('\n') + '\n';
}

/**
 * Write a generated plan to IMPLEMENTATION_PLAN.md.
 * @param {object} answers - Wizard answers
 * @param {string} cwd - Project directory
 * @returns {{ taskCount: number, written: boolean }}
 */
function writePlan(answers, cwd = process.cwd()) {
  const planPath = path.join(cwd, 'IMPLEMENTATION_PLAN.md');

  // Don't overwrite existing plan
  if (exists(planPath)) {
    return { taskCount: 0, written: false };
  }

  const content = generatePlan(answers);
  const taskCount = (content.match(/^- \[ \]/gm) || []).length;

  writeFile(planPath, content);
  return { taskCount, written: true };
}

module.exports = {
  generatePlan,
  writePlan,
  extractFeatures,
  detectStack,
  STACK_TASKS,
};
