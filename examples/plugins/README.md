# Example CopilotForge Plugins

These are example plugins that extend CopilotForge with custom Build Paths (K-Z).

## Available Examples

| Plugin | Path | Description |
|--------|------|-------------|
| `react-app` | K | React/Next.js applications with TypeScript |
| `python-api` | L | Python API projects (FastAPI/Flask/Django) |

## How to Use

1. Copy a plugin folder into your project's `node_modules/`:
   ```bash
   cp -r examples/plugins/react-app node_modules/copilotforge-plugin-react-app
   ```

2. CopilotForge auto-discovers it on next run:
   ```bash
   copilotforge detect    # Will pick up the plugin's signals
   copilotforge wizard    # Plugin questions appear in the wizard
   ```

## Creating Your Own Plugin

```bash
copilotforge plugin create my-stack --path M
```

This generates a complete plugin scaffold with `package.json`, `index.js`, and `README.md`.

### Plugin Contract

```javascript
module.exports = {
  name: 'my-stack',           // Plugin name
  description: 'My stack',    // Short description
  buildPath: 'M',             // Single letter K-Z
  signals: ['my-stack'],      // Detection keywords
  questions: [{                // Wizard questions
    id: 'q1',
    prompt: 'What type?',
    choices: ['A', 'B'],
  }],
  templates: {                 // Generated files
    forge: '# FORGE.md\n...',
  },
};
```

### Validation

```bash
cd copilotforge-plugin-my-stack
copilotforge plugin validate
```
