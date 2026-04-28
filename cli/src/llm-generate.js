'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge LLM Code Generation — Phase 20
 *
 * Uses the GitHub Copilot API (or extension-server passthrough) to generate
 * code from natural language with playbook-informed prompts.
 *
 * Features:
 *   - Context-aware system prompts from playbook entries
 *   - Project stack detection for framework-specific output
 *   - Template-based prompt construction
 *   - Streaming and non-streaming modes
 *
 * Usage:
 *   copilotforge generate-code "Create a REST endpoint for users"
 *   copilotforge generate-code "Add error handling" --context src/app.js
 *   copilotforge generate-code --interactive
 */

// ── Prompt construction ─────────────────────────────────────────────────

function buildSystemPrompt(cwd) {
  const parts = [
    'You are CopilotForge, an AI code generator.',
    'Generate clean, production-ready code following project conventions.',
  ];

  // Add playbook context
  try {
    const { getTopEntries } = require('./experiential-memory');
    const entries = getTopEntries(5, cwd);
    if (entries.length > 0) {
      parts.push('\nProject playbook (follow these patterns):');
      for (const e of entries) {
        if (e.type === 'ANTIPATTERN') {
          parts.push(`AVOID: ${e.title} — ${e.content.slice(0, 100)}`);
        } else {
          parts.push(`${e.type}: ${e.title} — ${e.content.slice(0, 100)}`);
        }
      }
    }
  } catch { /* playbook optional */ }

  // Add stack detection
  try {
    const { detectBuildPath } = require('./smart-detect');
    const detection = detectBuildPath(cwd);
    if (detection.confidence !== 'low') {
      parts.push(`\nProject type: ${detection.name} (path ${detection.path})`);
    }
  } catch { /* detect optional */ }

  // Add project dependencies context
  const pkgPath = path.join(cwd, 'package.json');
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {}).slice(0, 10);
      const devDeps = Object.keys(pkg.devDependencies || {}).slice(0, 5);
      if (deps.length > 0) parts.push(`\nDependencies: ${deps.join(', ')}`);
      if (devDeps.length > 0) parts.push(`DevDependencies: ${devDeps.join(', ')}`);
      if (pkg.devDependencies?.typescript || exists(path.join(cwd, 'tsconfig.json'))) {
        parts.push('Language: TypeScript (use .ts files, add types)');
      }
    } catch { /* ignore */ }
  }

  return parts.join('\n');
}

function buildUserPrompt(description, contextFile) {
  let prompt = description;

  if (contextFile && exists(contextFile)) {
    try {
      const content = fs.readFileSync(contextFile, 'utf8');
      const ext = path.extname(contextFile);
      prompt += `\n\nExisting file context (${path.basename(contextFile)}):\n\`\`\`${ext.slice(1)}\n${content.slice(0, 2000)}\n\`\`\``;
    } catch { /* ignore */ }
  }

  return prompt;
}

// ── Code extraction ─────────────────────────────────────────────────────

function extractCode(response) {
  // Extract code blocks from LLM response
  const codeBlocks = [];
  const pattern = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = pattern.exec(response)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return codeBlocks;
}

function suggestFilename(description, language) {
  const lower = description.toLowerCase();

  // Map description keywords to filenames
  if (/test|spec/.test(lower)) return `generated.test.${language === 'typescript' ? 'ts' : 'js'}`;
  if (/route|endpoint|api/.test(lower)) return `route.${language === 'typescript' ? 'ts' : 'js'}`;
  if (/component|widget/.test(lower)) return `Component.${language === 'typescript' ? 'tsx' : 'jsx'}`;
  if (/config|settings/.test(lower)) return `config.${language === 'typescript' ? 'ts' : 'js'}`;
  if (/middleware/.test(lower)) return `middleware.${language === 'typescript' ? 'ts' : 'js'}`;
  if (/model|schema/.test(lower)) return `model.${language === 'typescript' ? 'ts' : 'js'}`;
  if (/util|helper/.test(lower)) return `utils.${language === 'typescript' ? 'ts' : 'js'}`;

  return `generated.${language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'js'}`;
}

// ── Local generation (template-based fallback) ──────────────────────────

function generateLocally(description, cwd) {
  const lower = description.toLowerCase();
  const isTS = exists(path.join(cwd, 'tsconfig.json'));
  const ext = isTS ? 'ts' : 'js';

  // Pattern-based generation
  if (/express.*route|rest.*endpoint|api.*endpoint/.test(lower)) {
    return {
      filename: `route.${ext}`,
      code: isTS
        ? `import { Router, Request, Response } from 'express';\n\nconst router = Router();\n\n// Generated from: "${description}"\nrouter.get('/', async (req: Request, res: Response) => {\n  try {\n    // TODO: Implement\n    res.json({ message: 'OK' });\n  } catch (err) {\n    res.status(500).json({ error: 'Internal server error' });\n  }\n});\n\nexport default router;\n`
        : `'use strict';\n\nconst { Router } = require('express');\nconst router = Router();\n\n// Generated from: "${description}"\nrouter.get('/', async (req, res) => {\n  try {\n    // TODO: Implement\n    res.json({ message: 'OK' });\n  } catch (err) {\n    res.status(500).json({ error: 'Internal server error' });\n  }\n});\n\nmodule.exports = router;\n`,
      method: 'template',
    };
  }

  if (/test|spec/.test(lower)) {
    return {
      filename: `generated.test.${ext}`,
      code: isTS
        ? `import { describe, it, expect } from '@jest/globals';\n\n// Generated from: "${description}"\ndescribe('Generated tests', () => {\n  it('should pass', () => {\n    expect(true).toBe(true);\n  });\n\n  // TODO: Add specific tests\n});\n`
        : `'use strict';\n\nconst { describe, it } = require('node:test');\nconst assert = require('node:assert');\n\n// Generated from: "${description}"\ndescribe('Generated tests', () => {\n  it('should pass', () => {\n    assert.ok(true);\n  });\n\n  // TODO: Add specific tests\n});\n`,
      method: 'template',
    };
  }

  // Generic module
  return {
    filename: `generated.${ext}`,
    code: isTS
      ? `// Generated from: "${description}"\n\nexport function main(): void {\n  // TODO: Implement\n  console.log('Generated module');\n}\n`
      : `'use strict';\n\n// Generated from: "${description}"\n\nfunction main() {\n  // TODO: Implement\n  console.log('Generated module');\n}\n\nmodule.exports = { main };\n`,
    method: 'template',
  };
}

// ── LLM API call ────────────────────────────────────────────────────────

function callLLM(systemPrompt, userPrompt, token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('No API token available'));
      return;
    }

    const payload = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'api.githubcopilot.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'CopilotForge/2.3.0',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('API timeout')); });
    req.write(payload);
    req.end();
  });
}

// ── CLI ─────────────────────────────────────────────────────────────────

async function run(args = []) {
  const cwd = process.cwd();
  const dryRun = args.includes('--dry-run');
  const contextIdx = args.indexOf('--context');
  const contextFile = contextIdx >= 0 ? path.resolve(cwd, args[contextIdx + 1]) : null;
  const outputIdx = args.indexOf('--output');
  const outputFile = outputIdx >= 0 ? args[outputIdx + 1] : null;
  const description = args.filter((a) => !a.startsWith('-') && a !== args[contextIdx + 1] && a !== args[outputIdx + 1]).join(' ');

  if (!description) {
    console.log();
    info('🤖 CopilotForge Code Generator');
    console.log();
    info('  Usage:');
    info('    copilotforge generate-code "Create a REST endpoint for users"');
    info('    copilotforge generate-code "Add auth middleware" --context src/app.js');
    info('    copilotforge generate-code "Write tests" --output tests/new.test.js');
    info('    copilotforge generate-code "Build config loader" --dry-run');
    console.log();
    return;
  }

  console.log();
  info(`🤖 Generating: ${colors.cyan(description)}`);
  console.log();

  // Try LLM first, fall back to template
  const token = process.env.GITHUB_TOKEN || process.env.COPILOT_TOKEN;
  let result;

  if (token && !dryRun) {
    try {
      const systemPrompt = buildSystemPrompt(cwd);
      const userPrompt = buildUserPrompt(description, contextFile);
      info(colors.dim('  Calling LLM API...'));
      const response = await callLLM(systemPrompt, userPrompt, token);
      const blocks = extractCode(response);

      if (blocks.length > 0) {
        result = {
          filename: outputFile || suggestFilename(description, blocks[0].language),
          code: blocks[0].code,
          method: 'llm',
          fullResponse: response,
        };
      }
    } catch (err) {
      info(colors.dim(`  LLM unavailable (${err.message}), using template fallback`));
    }
  }

  if (!result) {
    result = generateLocally(description, cwd);
    if (outputFile) result.filename = outputFile;
  }

  info(`  Method: ${result.method === 'llm' ? colors.green('LLM') : colors.yellow('template')}`);
  info(`  File: ${colors.cyan(result.filename)}`);
  console.log();

  if (dryRun) {
    console.log(result.code);
    console.log();
    info(colors.dim('  Dry run — no file written'));
    console.log();
    return;
  }

  // Write the generated file
  const destPath = path.resolve(cwd, result.filename);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, result.code, 'utf8');
  success(`  ✅ Written to ${result.filename}`);
  console.log();
}

module.exports = {
  run,
  buildSystemPrompt,
  buildUserPrompt,
  extractCode,
  suggestFilename,
  generateLocally,
};
