'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge Agent Composition — Phase 20
 *
 * Chain agents for multi-step workflows with input/output routing
 * and conditional branching. Pipelines are defined as JSON or
 * programmatically via the compose() API.
 *
 * Pipeline format:
 *   { steps: [{ agent, action, input?, condition?, onSuccess?, onFailure? }] }
 *
 * Usage:
 *   copilotforge compose <pipeline.json>     Run a pipeline
 *   copilotforge compose --list              List available pipelines
 *   copilotforge compose --dry-run           Preview without executing
 *   copilotforge compose --create <name>     Create a pipeline template
 */

// ── Pipeline execution ──────────────────────────────────────────────────

/**
 * Execute a single pipeline step.
 * @param {object} step - Pipeline step definition
 * @param {object} context - Accumulated context from prior steps
 * @returns {{ success: boolean, output: any, duration: number }}
 */
function executeStep(step, context) {
  const start = Date.now();

  // Check condition
  if (step.condition) {
    try {
      const condFn = new Function('context', `return ${step.condition}`);
      if (!condFn(context)) {
        return { success: true, output: null, skipped: true, duration: 0 };
      }
    } catch {
      return { success: false, output: null, error: `Invalid condition: ${step.condition}`, duration: 0 };
    }
  }

  try {
    let output;

    switch (step.agent) {
      case 'detect': {
        const { detectBuildPath } = require('./smart-detect');
        output = detectBuildPath(context.cwd || process.cwd());
        break;
      }
      case 'discover': {
        const { discoverAll } = require('./discover');
        output = discoverAll(context.cwd || process.cwd());
        break;
      }
      case 'review': {
        const { reviewProject } = require('./review');
        output = reviewProject(context.cwd || process.cwd(), { usePlaybook: step.usePlaybook });
        break;
      }
      case 'doctor': {
        const { execSync } = require('child_process');
        const binPath = path.join(__dirname, '..', 'bin', 'copilotforge.js');
        const cwd = context.cwd || process.cwd();
        try {
          const raw = execSync(`node "${binPath}" doctor --json`, {
            cwd, stdio: 'pipe', encoding: 'utf8', timeout: 15000, windowsHide: true,
          });
          output = JSON.parse(raw);
        } catch (err) {
          try { output = JSON.parse(err.stdout); } catch { output = { healthy: false }; }
        }
        break;
      }
      case 'generate': {
        const { RECIPE_TYPES, analyzeProject } = require('./generate');
        const pkg = analyzeProject(context.cwd || process.cwd());
        const recipeType = step.recipeType || 'test-suite';
        const recipe = RECIPE_TYPES[recipeType];
        output = recipe ? recipe.generate(pkg) : { error: `Unknown recipe: ${recipeType}` };
        break;
      }
      case 'config': {
        const { loadConfig } = require('./config');
        output = loadConfig(context.cwd || process.cwd());
        break;
      }
      case 'trust': {
        try {
          const trust = require('./trust');
          output = {
            level: trust.getTrustLevel(context.cwd),
            signals: trust.getSignals(context.cwd),
          };
        } catch { output = { level: 'unknown' }; }
        break;
      }
      case 'transform': {
        // Apply a transformation function to context
        if (step.transform) {
          try {
            const transformFn = new Function('context', 'input', step.transform);
            output = transformFn(context, context.lastOutput);
          } catch (err) {
            return { success: false, output: null, error: `Transform error: ${err.message}`, duration: Date.now() - start };
          }
        }
        break;
      }
      default:
        return { success: false, output: null, error: `Unknown agent: ${step.agent}`, duration: Date.now() - start };
    }

    return { success: true, output, duration: Date.now() - start };
  } catch (err) {
    return { success: false, output: null, error: err.message, duration: Date.now() - start };
  }
}

/**
 * Run a complete pipeline.
 * @param {object} pipeline - Pipeline definition
 * @param {object} [initialContext] - Initial context
 * @returns {{ success: boolean, steps: object[], context: object, totalDuration: number }}
 */
function runPipeline(pipeline, initialContext = {}) {
  const context = { ...initialContext, cwd: initialContext.cwd || process.cwd() };
  const results = [];
  let allSuccess = true;

  for (const step of pipeline.steps) {
    const result = executeStep(step, context);
    results.push({ ...step, ...result });

    if (result.success && !result.skipped) {
      context.lastOutput = result.output;
      if (step.outputKey) {
        context[step.outputKey] = result.output;
      }

      // Follow onSuccess branch
      if (step.onSuccess && Array.isArray(step.onSuccess)) {
        for (const subStep of step.onSuccess) {
          const subResult = executeStep(subStep, context);
          results.push({ ...subStep, ...subResult, branch: 'onSuccess' });
          if (subResult.success && !subResult.skipped) {
            context.lastOutput = subResult.output;
            if (subStep.outputKey) context[subStep.outputKey] = subResult.output;
          }
        }
      }
    } else if (!result.success) {
      allSuccess = false;

      // Follow onFailure branch
      if (step.onFailure && Array.isArray(step.onFailure)) {
        for (const subStep of step.onFailure) {
          const subResult = executeStep(subStep, context);
          results.push({ ...subStep, ...subResult, branch: 'onFailure' });
        }
      }

      if (pipeline.stopOnError !== false) break;
    }
  }

  return {
    success: allSuccess,
    steps: results,
    context,
    totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
  };
}

// ── Pipeline templates ──────────────────────────────────────────────────

const BUILTIN_PIPELINES = {
  'health-check': {
    name: 'Health Check Pipeline',
    description: 'Detect → Doctor → Review',
    steps: [
      { agent: 'detect', outputKey: 'buildPath' },
      { agent: 'doctor', outputKey: 'health' },
      { agent: 'review', outputKey: 'codeReview' },
    ],
  },
  'onboarding': {
    name: 'Onboarding Pipeline',
    description: 'Config → Detect → Discover → Trust',
    steps: [
      { agent: 'config', outputKey: 'config' },
      { agent: 'detect', outputKey: 'buildPath' },
      { agent: 'discover', outputKey: 'patterns' },
      { agent: 'trust', outputKey: 'trust' },
    ],
  },
  'quality-gate': {
    name: 'Quality Gate Pipeline',
    description: 'Review → conditional generate',
    steps: [
      { agent: 'review', outputKey: 'review' },
      {
        agent: 'generate',
        recipeType: 'test-suite',
        condition: 'context.review && context.review.errors > 0',
        outputKey: 'generatedTests',
      },
    ],
  },
};

function createPipelineFile(name, cwd) {
  const pipeline = BUILTIN_PIPELINES[name] || {
    name: name,
    description: 'Custom pipeline',
    steps: [
      { agent: 'detect', outputKey: 'buildPath' },
      { agent: 'doctor', outputKey: 'health' },
    ],
  };

  const filePath = path.join(cwd, `${name}.pipeline.json`);
  fs.writeFileSync(filePath, JSON.stringify(pipeline, null, 2) + '\n', 'utf8');
  return filePath;
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const dryRun = args.includes('--dry-run');
  const listPipelines = args.includes('--list');
  const createIdx = args.indexOf('--create');
  const pipelineFile = args.find((a) => !a.startsWith('-') && a.endsWith('.json'));
  const builtinName = args.find((a) => !a.startsWith('-') && !a.endsWith('.json'));

  if (listPipelines) {
    console.log();
    info('🔗 Available Pipelines');
    console.log();
    for (const [key, p] of Object.entries(BUILTIN_PIPELINES)) {
      info(`  ${colors.cyan(key.padEnd(20))} ${p.description}`);
    }
    console.log();
    return;
  }

  if (createIdx >= 0) {
    const name = args[createIdx + 1] || 'custom';
    const filePath = createPipelineFile(name, cwd);
    success(`  ✅ Created ${path.basename(filePath)}`);
    return;
  }

  // Load pipeline
  let pipeline;
  if (pipelineFile) {
    const fullPath = path.resolve(cwd, pipelineFile);
    if (!exists(fullPath)) {
      warn(`Pipeline file not found: ${pipelineFile}`);
      process.exit(1);
    }
    pipeline = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } else if (builtinName && BUILTIN_PIPELINES[builtinName]) {
    pipeline = BUILTIN_PIPELINES[builtinName];
  } else {
    // Default: health-check
    pipeline = BUILTIN_PIPELINES['health-check'];
  }

  console.log();
  info(`🔗 Running: ${colors.bold(pipeline.name || 'Pipeline')}`);
  info(colors.dim(`  ${pipeline.steps.length} steps`));
  console.log();

  if (dryRun) {
    for (const step of pipeline.steps) {
      const cond = step.condition ? colors.dim(` [if: ${step.condition}]`) : '';
      info(`  → ${colors.cyan(step.agent)}${cond}`);
    }
    console.log();
    info(colors.dim('  Dry run — no steps executed'));
    console.log();
    return;
  }

  const result = runPipeline(pipeline, { cwd });

  for (const step of result.steps) {
    const icon = step.skipped ? '⏭️' : step.success ? '✅' : '❌';
    const branch = step.branch ? colors.dim(` [${step.branch}]`) : '';
    const time = step.duration ? colors.dim(` ${step.duration}ms`) : '';
    info(`  ${icon} ${step.agent}${branch}${time}`);
  }

  console.log();
  const status = result.success ? colors.green('PASS') : colors.red('FAIL');
  info(`  Result: ${status}  (${result.totalDuration}ms)`);
  console.log();
}

module.exports = {
  run,
  runPipeline,
  executeStep,
  BUILTIN_PIPELINES,
  createPipelineFile,
};
