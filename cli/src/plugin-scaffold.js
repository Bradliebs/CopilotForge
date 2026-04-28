'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, success, warn, exists } = require('./utils');

/**
 * CopilotForge Plugin Scaffold — Phase 19
 *
 * Bootstraps a new plugin package with the correct CopilotForge plugin contract.
 *
 * Usage:
 *   copilotforge plugin create <name>     Create a new plugin scaffold
 *   copilotforge plugin list              List installed plugins
 *   copilotforge plugin validate          Validate plugin in current dir
 */

function generatePluginPackageJson(name, pathLetter) {
  return JSON.stringify({
    name: `copilotforge-plugin-${name}`,
    version: '0.1.0',
    description: `CopilotForge plugin for ${name}`,
    main: 'index.js',
    'copilotforge-plugin': true,
    keywords: ['copilotforge', 'copilotforge-plugin', name],
    license: 'MIT',
    engines: { node: '>=18.0.0' },
  }, null, 2) + '\n';
}

function generatePluginIndex(name, pathLetter) {
  const upper = pathLetter.toUpperCase();
  return `'use strict';

/**
 * CopilotForge Plugin: ${name}
 *
 * Build Path: ${upper}
 *
 * This plugin extends CopilotForge with a custom build path.
 * Edit the signals, questions, and templates to match your use case.
 */

module.exports = {
  name: '${name}',
  description: 'Custom build path for ${name} projects',
  buildPath: '${upper}',

  // Signal keywords that trigger this path during detection
  signals: ['${name}', '${name}-app'],

  // Diagnostic questions asked during wizard
  questions: [
    {
      id: '${name}-q1',
      prompt: 'What type of ${name} project is this?',
      choices: ['starter', 'advanced', 'enterprise'],
    },
  ],

  // Template content for generated files
  templates: {
    forge: \`# FORGE.md — [Your Project Name]

<!-- copilotforge: path=${upper} -->

## Project Summary
- **Build Path:** ${upper} — ${name}
- **Description:** [your project description]

## Settings
- Build Path: ${upper}
- Path Name: ${name}
\`,
  },
};
`;
}

function generatePluginReadme(name) {
  return `# copilotforge-plugin-${name}

A CopilotForge plugin that adds Build Path support for ${name} projects.

## Installation

\`\`\`bash
npm install copilotforge-plugin-${name}
\`\`\`

CopilotForge auto-discovers plugins from \`node_modules/\` that have \`"copilotforge-plugin": true\` in their package.json.

## Plugin Contract

| Property | Type | Description |
|----------|------|-------------|
| \`name\` | string | Plugin name |
| \`description\` | string | Short description |
| \`buildPath\` | string | Single letter K-Z |
| \`signals\` | string[] | Detection keywords |
| \`questions\` | array | Wizard questions |
| \`templates\` | object | File templates |

## Development

\`\`\`bash
# Validate the plugin
npx copilotforge plugin validate

# Test detection
npx copilotforge detect
\`\`\`
`;
}

function createPlugin(name, options = {}) {
  const pathLetter = options.path || 'K';
  const dir = path.join(process.cwd(), `copilotforge-plugin-${name}`);

  if (exists(dir)) {
    return { success: false, error: `Directory already exists: copilotforge-plugin-${name}` };
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), generatePluginPackageJson(name, pathLetter));
  fs.writeFileSync(path.join(dir, 'index.js'), generatePluginIndex(name, pathLetter));
  fs.writeFileSync(path.join(dir, 'README.md'), generatePluginReadme(name));

  return {
    success: true,
    dir,
    files: ['package.json', 'index.js', 'README.md'],
  };
}

function validatePlugin(cwd = process.cwd()) {
  const pkgPath = path.join(cwd, 'package.json');
  const issues = [];

  if (!exists(pkgPath)) {
    return { valid: false, issues: ['No package.json found'] };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    if (!pkg['copilotforge-plugin']) {
      issues.push('Missing "copilotforge-plugin": true in package.json');
    }

    const plugin = require(cwd);

    if (!plugin.name) issues.push('Missing plugin.name');
    if (!plugin.buildPath) issues.push('Missing plugin.buildPath');
    if (!plugin.buildPath || plugin.buildPath.length !== 1) issues.push('buildPath must be a single letter');
    if (plugin.buildPath && plugin.buildPath >= 'A' && plugin.buildPath <= 'J') {
      issues.push(`buildPath "${plugin.buildPath}" conflicts with core paths A-J. Use K-Z.`);
    }
    if (!Array.isArray(plugin.signals) || plugin.signals.length === 0) {
      issues.push('signals must be a non-empty array');
    }
    if (!Array.isArray(plugin.questions)) {
      issues.push('questions must be an array');
    }

    return { valid: issues.length === 0, issues, plugin };
  } catch (err) {
    return { valid: false, issues: [`Failed to load plugin: ${err.message}`] };
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const sub = args[0] || '';

  switch (sub) {
    case 'create': {
      const name = args[1];
      if (!name) {
        warn('Usage: copilotforge plugin create <name>');
        process.exit(1);
      }

      const pathArg = args.indexOf('--path');
      const pathLetter = pathArg >= 0 ? (args[pathArg + 1] || 'K').toUpperCase() : 'K';

      console.log();
      info(`🔌 Creating plugin: ${colors.cyan(`copilotforge-plugin-${name}`)}`);
      console.log();

      const result = createPlugin(name, { path: pathLetter });
      if (!result.success) {
        warn(`  ${result.error}`);
        console.log();
        process.exit(1);
      }

      for (const file of result.files) {
        success(`  Created ${file}`);
      }
      console.log();
      info(`  Plugin directory: ${colors.dim(result.dir)}`);
      info(colors.dim('  Next: cd into the directory, edit index.js, and npm link'));
      console.log();
      break;
    }

    case 'validate': {
      console.log();
      info('🔍 Validating plugin...');
      console.log();

      const result = validatePlugin();
      if (result.valid) {
        success(`  ✅ Plugin "${result.plugin.name}" is valid`);
        info(`  Build path: ${result.plugin.buildPath}`);
        info(`  Signals: ${result.plugin.signals.join(', ')}`);
      } else {
        warn('  Plugin validation failed:');
        for (const issue of result.issues) {
          warn(`    • ${issue}`);
        }
      }
      console.log();
      break;
    }

    case 'list': {
      console.log();
      info('🔌 Installed Plugins');
      console.log();

      try {
        const { discoverPlugins } = require('./plugin-loader');
        const plugins = discoverPlugins();
        if (plugins.length === 0) {
          info('  No plugins installed.');
          info(colors.dim('  Run `copilotforge plugin create <name>` to create one.'));
        } else {
          for (const p of plugins) {
            info(`  ${colors.cyan(p.name.padEnd(24))} Path ${p.buildPath}  ${colors.dim(p.description || '')}`);
          }
        }
      } catch {
        info('  No plugins found.');
      }
      console.log();
      break;
    }

    default:
      console.log();
      info('🔌 CopilotForge Plugin Manager');
      console.log();
      info('  Usage:');
      info('    copilotforge plugin create <name>     Create a new plugin scaffold');
      info('    copilotforge plugin create <name> --path K   Specify build path letter');
      info('    copilotforge plugin list              List installed plugins');
      info('    copilotforge plugin validate          Validate plugin in current dir');
      console.log();
  }
}

module.exports = {
  run,
  createPlugin,
  validatePlugin,
  generatePluginPackageJson,
  generatePluginIndex,
};
