---
title: CopilotForge Plugin API
description: Documentation for creating third-party Build Path plugins for CopilotForge
---

# Plugin API

CopilotForge supports third-party Build Paths through npm plugins. Plugins add new paths (K–Z) without forking the core repository. Core paths A–J are reserved and cannot be overridden.

## Quick Start

1. Create an npm package with `"copilotforge-plugin": true` in `package.json`
2. Export a plugin object from the package's main entry point
3. Install it in any CopilotForge project: `npm install your-plugin`
4. CopilotForge auto-discovers it on the next run

## Package Requirements

Your `package.json` must include:

```json
{
  "name": "copilotforge-plugin-my-path",
  "version": "1.0.0",
  "copilotforge-plugin": true,
  "main": "index.js"
}
```

The `"copilotforge-plugin": true` flag is required for discovery. Without it, CopilotForge ignores the package.

## Export Interface

Your main entry point must export an object matching this contract:

```typescript
interface CopilotForgePlugin {
  /** Human-readable name */
  name: string;

  /** One-sentence description */
  description: string;

  /** Single letter K-Z — your plugin's build path */
  buildPath: string;

  /** Trigger words for path detection (matched against Q1 answers) */
  signals: string[];

  /** Diagnostic questions asked when this path is detected */
  questions: Array<{
    id: string;
    prompt: string;
    choices?: string[];
  }>;

  /** Templates for generated files */
  templates: {
    /** FORGE.md content for this path */
    forge?: string;
  };
}
```

## Example Plugin

```javascript
// index.js
module.exports = {
  name: 'IoT Dashboard',
  description: 'Azure IoT Hub dashboard with real-time telemetry',
  buildPath: 'K',
  signals: ['iot', 'telemetry', 'azure iot', 'device monitoring'],
  questions: [
    {
      id: 'k1',
      prompt: 'What IoT protocol does your device use?',
      choices: ['MQTT', 'AMQP', 'HTTP'],
    },
    {
      id: 'k2',
      prompt: 'Do you need real-time streaming or batch analytics?',
      choices: ['Real-time', 'Batch', 'Both'],
    },
  ],
  templates: {
    forge: `# FORGE.md — IoT Dashboard

<!-- copilotforge: path=K -->

## Project Summary
- **Build Path:** K — IoT Dashboard
- **Stack:** Azure IoT Hub, Node.js, React
`,
  },
};
```

## Validation Rules

CopilotForge enforces these constraints:

| Rule | What Happens |
|------|-------------|
| `buildPath` must be K–Z | Paths A–J are reserved. Plugin is rejected with error. |
| `buildPath` conflicts with another plugin | First loaded plugin wins. Conflict is logged as a warning. |
| `signals` must be non-empty | Plugin is rejected — no way to detect it in Q1 answers. |
| `questions` must be an array | Can be empty (no diagnostic questions), but must exist. |
| Missing `name` or `buildPath` | Plugin is rejected with validation error. |

## How Discovery Works

1. CopilotForge scans `node_modules/` for packages with `"copilotforge-plugin": true`
2. Each plugin is loaded and validated
3. Valid plugins are registered for path detection
4. Plugin signals are merged into the forge-compass signal table
5. When a user's Q1 answer matches plugin signals, the plugin's path activates

## Integration Points

Registered plugins appear in:

- **Path detection** — plugin signals are checked alongside core PP and DEV signals
- **Doctor output** — `copilotforge doctor` reports installed plugins with name, version, and path letter
- **FORGE.md generation** — when a plugin path is active, the plugin's template is used

## Scoped Packages

Scoped packages (`@org/copilotforge-plugin-name`) are supported. Discovery scans both top-level and scoped directories in `node_modules/`.

## Testing Your Plugin

Use CopilotForge's built-in validation:

```bash
# Install your plugin locally
npm install ../path-to-your-plugin

# Check it appears in doctor output
npx copilotforge doctor

# Test path detection with a matching Q1 answer
npx copilotforge wizard
# Answer Q1 with words matching your signals
```

You can also validate programmatically:

```javascript
const { validatePlugin } = require('copilotforge/src/plugin-loader');

const myPlugin = require('./index');
const result = validatePlugin(myPlugin, {});

console.log(result.valid ? 'Plugin is valid' : `Error: ${result.error}`);
```

## Limitations

- Plugins cannot modify core paths A–J
- Plugins cannot add new CLI commands
- Plugin templates are limited to FORGE.md generation (skill/agent generation planned for future)
- Discovery requires the plugin to be installed in `node_modules/`
