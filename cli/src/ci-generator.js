'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, warn, success, exists } = require('./utils');

/**
 * CopilotForge GitHub Actions Generator — Phase 18
 *
 * Generates CI/CD workflows tailored to the detected build path and
 * project structure. Analyzes package.json and project files to create
 * appropriate GitHub Actions workflow files.
 *
 * Usage:
 *   copilotforge ci                   Generate CI workflow
 *   copilotforge ci --dry-run         Preview without writing
 */

// ── Workflow templates ──────────────────────────────────────────────────

function generateNodeCI(pkg) {
  const testCmd = pkg.scripts?.test || 'echo "No tests"';
  const lintCmd = pkg.scripts?.lint ? `\n      - name: Lint\n        run: npm run lint\n` : '';
  const buildCmd = pkg.scripts?.build ? `\n      - name: Build\n        run: npm run build\n` : '';
  const hasTypeScript = pkg.deps?.includes('typescript') || pkg.devDeps?.includes('typescript');
  const nodeVersions = hasTypeScript ? '[18, 20, 22]' : '[18, 20]';

  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

permissions:
  contents: read

jobs:
  test:
    name: Test (Node \${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ${nodeVersions}
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci
${lintCmd}${buildCmd}
      - name: Run tests
        run: ${testCmd}
`;
}

function generatePythonCI(pkg) {
  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

permissions:
  contents: read

jobs:
  test:
    name: Test (Python \${{ matrix.python-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run tests
        run: python -m pytest
`;
}

function generateGenericCI() {
  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

permissions:
  contents: read

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate project structure
        run: |
          echo "Project files:"
          ls -la
          echo "Build validation passed"
`;
}

// ── Project detection ───────────────────────────────────────────────────

function detectProjectType(cwd) {
  const pkg = { deps: [], devDeps: [], scripts: {}, name: '' };
  const pkgPath = path.join(cwd, 'package.json');

  if (exists(pkgPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.name = parsed.name || '';
      pkg.deps = Object.keys(parsed.dependencies || {});
      pkg.devDeps = Object.keys(parsed.devDependencies || {});
      pkg.scripts = parsed.scripts || {};
    } catch { /* ignore */ }
    return { type: 'node', pkg };
  }

  if (exists(path.join(cwd, 'requirements.txt')) || exists(path.join(cwd, 'pyproject.toml'))) {
    return { type: 'python', pkg };
  }

  return { type: 'generic', pkg };
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const dryRun = args.includes('--dry-run');

  const { type, pkg } = detectProjectType(cwd);

  let workflow;
  switch (type) {
    case 'node':
      workflow = generateNodeCI(pkg);
      break;
    case 'python':
      workflow = generatePythonCI(pkg);
      break;
    default:
      workflow = generateGenericCI();
  }

  console.log();
  info(`⚙️ Generating CI workflow for ${colors.cyan(type)} project`);
  console.log();

  if (dryRun) {
    info(colors.dim('Would write: .github/workflows/ci.yml'));
    console.log();
    console.log(workflow);
    return;
  }

  const destDir = path.join(cwd, '.github', 'workflows');
  const destPath = path.join(destDir, 'ci.yml');

  if (exists(destPath)) {
    warn('  .github/workflows/ci.yml already exists');
    info(colors.dim('  Use --dry-run to preview, or delete the existing file first'));
    console.log();
    return;
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destPath, workflow, 'utf8');
  success('  ✅ Created .github/workflows/ci.yml');
  console.log();
}

module.exports = {
  run,
  detectProjectType,
  generateNodeCI,
  generatePythonCI,
  generateGenericCI,
};
