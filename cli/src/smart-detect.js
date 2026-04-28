'use strict';

const fs = require('fs');
const path = require('path');
const { exists } = require('./utils');

/**
 * CopilotForge Smart Template Selection — Phase 18
 *
 * Auto-detects the best build path from project files without running
 * the wizard. Analyzes package.json, file structure, README, and other
 * project artifacts to determine the build path (A-J).
 *
 * Priority order:
 *   1. Explicit FORGE.md path stamp (already chosen)
 *   2. package.json signals (dependencies, scripts, keywords)
 *   3. File structure patterns (directory names, file extensions)
 *   4. README content signals
 *   5. Fallback to J (generic)
 */

// ── Signal definitions per path ─────────────────────────────────────────

const PATH_SIGNALS = {
  A: {
    name: 'Copilot Studio Agent',
    files: ['.env.studio', 'topics/', 'copilot-studio/'],
    pkgKeywords: ['copilot-studio', 'copilot studio'],
    readmeSignals: ['copilot studio', 'no-code agent', 'studio agent'],
    weight: 0,
  },
  B: {
    name: 'Studio + Custom Connector',
    files: ['apiDefinition.swagger.json', 'apiProperties.json', 'connector/'],
    pkgKeywords: ['connector', 'paconn'],
    readmeSignals: ['custom connector', 'studio connector', 'paconn'],
    weight: 0,
  },
  C: {
    name: 'Declarative Agent',
    files: ['declarativeAgent.json', '.copilot/declarativeAgents/', 'agent-manifest.json'],
    pkgKeywords: ['declarative-agent', 'copilot-agent'],
    readmeSignals: ['declarative agent', 'agent manifest'],
    weight: 0,
  },
  D: {
    name: 'Canvas App + Copilot',
    files: ['src/App.fx.yaml', 'CanvasManifest.json', '.msapp'],
    pkgKeywords: ['canvas-app', 'power-apps'],
    readmeSignals: ['canvas app', 'power apps', 'powerfx', 'power fx'],
    weight: 0,
  },
  E: {
    name: 'Power Automate',
    files: ['workflow.json', 'flow.json', '.flow/'],
    pkgKeywords: ['power-automate', 'flow'],
    readmeSignals: ['power automate', 'cloud flow', 'automated flow'],
    weight: 0,
  },
  F: {
    name: 'PCF Component',
    files: ['ControlManifest.Input.xml', 'pcfconfig.json'],
    pkgDeps: ['pcf-scripts', 'pcf-start'],
    pkgKeywords: ['pcf', 'powerapps-component-framework'],
    readmeSignals: ['pcf component', 'component framework', 'power component'],
    weight: 0,
  },
  G: {
    name: 'Power BI',
    files: ['.pbix', '.pbit', 'model.bim', 'semantic-model/'],
    pkgKeywords: ['power-bi', 'powerbi'],
    readmeSignals: ['power bi', 'powerbi', 'dax', 'semantic model'],
    weight: 0,
  },
  H: {
    name: 'SharePoint + Teams',
    files: ['config/serve.json', '.yo-rc.json', 'sharepoint/'],
    pkgDeps: ['@microsoft/sp-core-library', '@microsoft/sp-webpart-base', '@microsoft/teams-js'],
    pkgKeywords: ['spfx', 'sharepoint', 'teams-app'],
    readmeSignals: ['sharepoint', 'spfx', 'teams app', 'teams tab'],
    weight: 0,
  },
  I: {
    name: 'Power Pages',
    files: ['website-manifest.yml', 'web-pages/', 'portal/'],
    pkgKeywords: ['power-pages', 'portal'],
    readmeSignals: ['power pages', 'portal', 'power page'],
    weight: 0,
  },
  J: {
    name: 'Custom / General',
    files: [],
    pkgDeps: ['express', 'fastify', 'next', 'react', 'vue', 'angular', 'svelte', 'hono'],
    pkgKeywords: [],
    readmeSignals: [],
    weight: 0,
  },
};

// ── Analyzers ───────────────────────────────────────────────────────────

function analyzePackageJson(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!exists(pkgPath)) return {};

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return {
      name: pkg.name || '',
      description: (pkg.description || '').toLowerCase(),
      keywords: (pkg.keywords || []).map((k) => k.toLowerCase()),
      deps: Object.keys(pkg.dependencies || {}),
      devDeps: Object.keys(pkg.devDependencies || {}),
      scripts: Object.keys(pkg.scripts || {}),
    };
  } catch { return {}; }
}

function analyzeFileStructure(cwd) {
  const found = new Set();

  try {
    const topLevel = fs.readdirSync(cwd, { withFileTypes: true });
    for (const entry of topLevel) {
      const name = entry.isDirectory() ? entry.name + '/' : entry.name;
      found.add(name.toLowerCase());
    }
  } catch { /* ignore */ }

  // Check specific subdirectories
  const checkDirs = ['src', '.github', '.copilot', 'cookbook'];
  for (const dir of checkDirs) {
    const dirPath = path.join(cwd, dir);
    if (exists(dirPath)) {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const name = entry.isDirectory() ? `${dir}/${entry.name}/` : `${dir}/${entry.name}`;
          found.add(name.toLowerCase());
        }
      } catch { /* ignore */ }
    }
  }

  return found;
}

function analyzeReadme(cwd) {
  for (const name of ['README.md', 'readme.md', 'Readme.md']) {
    const readmePath = path.join(cwd, name);
    if (exists(readmePath)) {
      try {
        return fs.readFileSync(readmePath, 'utf8').toLowerCase();
      } catch { /* ignore */ }
    }
  }
  return '';
}

// ── Scoring ─────────────────────────────────────────────────────────────

function scoreProject(cwd) {
  const pkg = analyzePackageJson(cwd);
  const files = analyzeFileStructure(cwd);
  const readme = analyzeReadme(cwd);
  const allDeps = [...(pkg.deps || []), ...(pkg.devDeps || [])];

  const scores = {};

  for (const [letter, signals] of Object.entries(PATH_SIGNALS)) {
    let score = 0;

    // File matches (3 points each)
    for (const pattern of signals.files || []) {
      const lower = pattern.toLowerCase();
      if (files.has(lower)) score += 3;
      // Also check if any file starts with the pattern
      for (const f of files) {
        if (f.includes(lower)) { score += 1; break; }
      }
    }

    // Package dependency matches (2 points each)
    for (const dep of signals.pkgDeps || []) {
      if (allDeps.includes(dep)) score += 2;
    }

    // Package keyword matches (2 points each)
    for (const kw of signals.pkgKeywords || []) {
      if ((pkg.keywords || []).includes(kw)) score += 2;
      if ((pkg.description || '').includes(kw)) score += 1;
    }

    // README signal matches (1 point each)
    for (const signal of signals.readmeSignals || []) {
      if (readme.includes(signal)) score += 1;
    }

    scores[letter] = score;
  }

  return scores;
}

/**
 * Detect the best build path for a project.
 * Returns { path, name, confidence, scores, reason }.
 */
function detectBuildPath(cwd = process.cwd()) {
  // 1. Check for existing FORGE.md path stamp
  const forgePath = path.join(cwd, 'FORGE.md');
  if (exists(forgePath)) {
    try {
      const content = fs.readFileSync(forgePath, 'utf8');
      const match = content.match(/<!-- copilotforge: path=([A-J]) -->/);
      if (match) {
        const letter = match[1];
        return {
          path: letter,
          name: PATH_SIGNALS[letter]?.name || 'Unknown',
          confidence: 'explicit',
          scores: {},
          reason: 'Existing FORGE.md path stamp',
        };
      }
    } catch { /* continue to detection */ }
  }

  // 2. Score based on project analysis
  const scores = scoreProject(cwd);

  // Find highest score (excluding J unless all others are 0)
  const nonJ = Object.entries(scores)
    .filter(([k]) => k !== 'J')
    .sort((a, b) => b[1] - a[1]);

  const best = nonJ[0];
  const second = nonJ[1];

  // No signals at all → J
  if (!best || best[1] === 0) {
    return {
      path: 'J',
      name: PATH_SIGNALS.J.name,
      confidence: 'low',
      scores,
      reason: 'No build path signals detected — using generic path',
    };
  }

  // Clear winner (>= 2x second place)
  const confidence = (!second || best[1] >= second[1] * 2) ? 'high' : 'medium';

  return {
    path: best[0],
    name: PATH_SIGNALS[best[0]].name,
    confidence,
    scores,
    reason: `Detected from project analysis (score: ${best[1]})`,
  };
}

module.exports = {
  detectBuildPath,
  scoreProject,
  analyzePackageJson,
  analyzeFileStructure,
  analyzeReadme,
  PATH_SIGNALS,
};
