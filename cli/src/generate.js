'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Recipe Generator — Phase 18
 *
 * Generates custom cookbook recipes from project context (stack, patterns,
 * conventions). Analyzes the project and produces ready-to-use code templates.
 *
 * Usage:
 *   copilotforge generate <type>          Generate a recipe by type
 *   copilotforge generate --list          List available recipe types
 *   copilotforge generate --dry-run       Preview without writing
 */

// ── Recipe templates ────────────────────────────────────────────────────

const RECIPE_TYPES = {
  'api-route': {
    name: 'API Route Handler',
    description: 'HTTP route with validation, error handling, and response formatting',
    detect: (pkg) => pkg.deps?.includes('express') || pkg.deps?.includes('fastify') || pkg.deps?.includes('hono'),
    generate: (pkg) => {
      const framework = pkg.deps?.includes('fastify') ? 'fastify' :
        pkg.deps?.includes('hono') ? 'hono' : 'express';
      const ts = pkg.hasTypeScript;
      const ext = ts ? '.ts' : '.js';

      if (framework === 'express') {
        return {
          filename: `route-handler${ext}`,
          content: ts
            ? `import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/api/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Replace with your data source
    const items = [{ id: 1, name: 'Example' }];
    res.json({ data: items, count: items.length });
  } catch (err) {
    next(err);
  }
});

router.post('/api/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    // TODO: Save to database
    const item = { id: Date.now(), name };
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
`
            : `'use strict';

const { Router } = require('express');
const router = Router();

router.get('/api/items', async (req, res, next) => {
  try {
    const items = [{ id: 1, name: 'Example' }];
    res.json({ data: items, count: items.length });
  } catch (err) {
    next(err);
  }
});

router.post('/api/items', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const item = { id: Date.now(), name };
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
`,
        };
      }
      // Default fallback
      return { filename: `route-handler${ext}`, content: `// TODO: Generate ${framework} route handler\n` };
    },
  },

  'test-suite': {
    name: 'Test Suite',
    description: 'Test file matching your project test framework',
    detect: () => true,
    generate: (pkg) => {
      const ts = pkg.hasTypeScript;
      const ext = ts ? '.ts' : '.js';

      if (pkg.deps?.includes('jest') || pkg.devDeps?.includes('jest')) {
        return {
          filename: `example.test${ext}`,
          content: `${ts ? "import { describe, it, expect } from '@jest/globals';\n\n" : ''}describe('Example', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello');
    expect(result).toBe('hello');
  });
});
`,
        };
      }

      // Node.js built-in test runner
      return {
        filename: `example.test${ext}`,
        content: `${ts ? '' : "'use strict';\n\n"}const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Example', () => {
  it('should pass a basic test', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello');
    assert.strictEqual(result, 'hello');
  });
});
`,
      };
    },
  },

  'error-handler': {
    name: 'Error Handler',
    description: 'Structured error handling middleware with logging',
    detect: (pkg) => pkg.deps?.includes('express') || pkg.deps?.includes('fastify'),
    generate: (pkg) => {
      const ts = pkg.hasTypeScript;
      const ext = ts ? '.ts' : '.js';

      return {
        filename: `error-handler${ext}`,
        content: ts
          ? `import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  console.error(\`[\${new Date().toISOString()}] \${req.method} \${req.path} — \${statusCode}: \${err.message}\`);

  res.status(statusCode).json({
    error: message,
    code: err.code || 'UNKNOWN_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
`
          : `'use strict';

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  console.error(\`[\${new Date().toISOString()}] \${req.method} \${req.path} — \${statusCode}: \${err.message}\`);

  res.status(statusCode).json({
    error: message,
    code: err.code || 'UNKNOWN_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
`,
      };
    },
  },

  'config-loader': {
    name: 'Config Loader',
    description: 'Environment-aware configuration with validation',
    detect: () => true,
    generate: (pkg) => {
      const ts = pkg.hasTypeScript;
      const ext = ts ? '.ts' : '.js';

      return {
        filename: `config${ext}`,
        content: ts
          ? `interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  databaseUrl: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(\`Missing required env var: \${key}\`);
  return value;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: requireEnv('DATABASE_URL'),
};
`
          : `'use strict';

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(\`Missing required env var: \${key}\`);
  return value;
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: requireEnv('DATABASE_URL'),
};

module.exports = { config };
`,
      };
    },
  },
};

// ── Project analysis ────────────────────────────────────────────────────

function analyzeProject(cwd) {
  const result = { deps: [], devDeps: [], hasTypeScript: false, scripts: {} };

  const pkgPath = path.join(cwd, 'package.json');
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      result.deps = Object.keys(pkg.dependencies || {});
      result.devDeps = Object.keys(pkg.devDependencies || {});
      result.scripts = pkg.scripts || {};
    } catch { /* ignore */ }
  }

  result.hasTypeScript = result.deps.includes('typescript') ||
    result.devDeps.includes('typescript') ||
    exists(path.join(cwd, 'tsconfig.json'));

  return result;
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const dryRun = args.includes('--dry-run');
  const listTypes = args.includes('--list');
  const recipeType = args.find((a) => !a.startsWith('-'));

  if (listTypes || !recipeType) {
    const pkg = analyzeProject(cwd);
    console.log();
    info('📦 Available Recipe Types');
    console.log();
    for (const [key, recipe] of Object.entries(RECIPE_TYPES)) {
      const available = recipe.detect(pkg);
      const marker = available ? colors.green('✓') : colors.dim('○');
      info(`  ${marker} ${colors.cyan(key.padEnd(20))} ${recipe.description}`);
    }
    console.log();
    info(colors.dim('  ✓ = detected in your project'));
    info(colors.dim('  Run: copilotforge generate <type>'));
    console.log();
    return;
  }

  const recipe = RECIPE_TYPES[recipeType];
  if (!recipe) {
    warn(`Unknown recipe type: ${recipeType}`);
    info(`Available: ${Object.keys(RECIPE_TYPES).join(', ')}`);
    process.exit(1);
  }

  const pkg = analyzeProject(cwd);
  const { filename, content } = recipe.generate(pkg);
  const destPath = path.join(cwd, 'cookbook', filename);

  console.log();
  info(`📦 Generating: ${colors.cyan(recipe.name)}`);
  console.log();

  if (dryRun) {
    info(colors.dim(`Would write: cookbook/${filename}`));
    console.log();
    console.log(content);
    return;
  }

  fs.mkdirSync(path.join(cwd, 'cookbook'), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  success(`  ✅ Created cookbook/${filename}`);
  console.log();
}

module.exports = {
  run,
  RECIPE_TYPES,
  analyzeProject,
};
