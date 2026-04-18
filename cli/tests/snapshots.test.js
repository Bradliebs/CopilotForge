'use strict';

/**
 * Snapshot Tests for CopilotForge Build Path Templates
 * 
 * Tests all 10 Build Paths (A-J) to catch accidental regressions:
 * - Template structure validation
 * - Forbidden jargon detection
 * - Snapshot baseline comparison
 * - Cross-path uniqueness verification
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const pkg = require('../package.json');
const path = require('node:path');

// Import templates
const { getPlatformForge } = require('../src/templates/platform-forge');
const { FORGE_MD } = require('../src/templates/forge');

const SNAPSHOT_DIR = path.join(__dirname, '__snapshots__');
const VERSION = `v${pkg.version}`;

// Build Paths mapping
const BUILD_PATHS = {
  A: 'Copilot Studio Agent',
  B: 'Studio + Custom Connector',
  C: 'Declarative Agent',
  D: 'Canvas App + Copilot Agent',
  E: 'Power Automate',
  F: 'PCF Code Component',
  G: 'Power BI',
  H: 'SharePoint + Teams',
  I: 'Power Pages',
  J: 'Developer Project'
};

// Forbidden jargon that should NOT appear in any template
const FORBIDDEN_JARGON = [
  'skill-writer',
  'agent-writer',
  'memory-writer',
  'cookbook-writer'
];

// Required sections that MUST appear in every template
const REQUIRED_SECTIONS = [
  '## Team Roster',
  '## Skills Index',
  '## Cookbook',
  '## Memory',
  '## Settings'
];

/**
 * Get template for a given path
 */
function getTemplate(pathLetter) {
  if (pathLetter === 'J') {
    return FORGE_MD;
  }
  return getPlatformForge(pathLetter);
}

/**
 * Generate or compare snapshot
 */
function checkSnapshot(pathLetter, content) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `forge-path-${pathLetter}.md`);
  const updateMode = process.env.UPDATE_SNAPSHOTS === '1';

  if (updateMode || !fs.existsSync(snapshotPath)) {
    // Generate/update snapshot
    fs.writeFileSync(snapshotPath, content, 'utf8');
    return { action: updateMode ? 'updated' : 'created', diff: null };
  }

  // Compare against snapshot
  const snapshot = fs.readFileSync(snapshotPath, 'utf8');
  if (content === snapshot) {
    return { action: 'matched', diff: null };
  }

  // Generate diff
  const contentLines = content.split('\n');
  const snapshotLines = snapshot.split('\n');
  const maxLines = Math.max(contentLines.length, snapshotLines.length);
  const diff = [];

  for (let i = 0; i < maxLines; i++) {
    const currentLine = contentLines[i] || '';
    const expectedLine = snapshotLines[i] || '';
    if (currentLine !== expectedLine) {
      diff.push(`Line ${i + 1}:`);
      diff.push(`  Expected: ${expectedLine}`);
      diff.push(`  Got:      ${currentLine}`);
    }
  }

  return { action: 'mismatch', diff: diff.join('\n') };
}

/**
 * Test Suite: Template Structure Tests
 */
test('Template Structure Tests', async (t) => {
  for (const [pathLetter, pathName] of Object.entries(BUILD_PATHS)) {
    await t.test(`Path ${pathLetter} (${pathName}): structure validation`, () => {
      const template = getTemplate(pathLetter);

      // Assert non-empty
      assert.ok(template && template.length > 0, 
        `Path ${pathLetter} template should not be empty`);

      // Assert version stamp
      assert.ok(template.includes(`copilotforge: ${VERSION}`),
        `Path ${pathLetter} should contain version stamp ${VERSION}`);

      // Assert path identifier (except J which is generic)
      if (pathLetter !== 'J') {
        assert.ok(template.includes(`path=${pathLetter}`) || template.includes(pathName),
          `Path ${pathLetter} should reference its build path identifier or name`);
      }

      // Assert NO forbidden jargon
      for (const jargon of FORBIDDEN_JARGON) {
        assert.ok(!template.includes(jargon),
          `Path ${pathLetter} should NOT contain forbidden jargon: ${jargon}`);
      }

      // Assert required sections (except J which has different structure)
      if (pathLetter !== 'J') {
        for (const section of REQUIRED_SECTIONS) {
          assert.ok(template.includes(section),
            `Path ${pathLetter} should contain required section: ${section}`);
        }
      } else {
        // Path J has its own required sections
        const pathJSections = ['## Team Roster', '## Skills Index', '## Cookbook'];
        for (const section of pathJSections) {
          assert.ok(template.includes(section),
            `Path J should contain required section: ${section}`);
        }
      }

      // Assert has Team Roster (all paths)
      assert.ok(template.includes('## Team Roster'),
        `Path ${pathLetter} should have Team Roster section`);

      // Assert has Planner agent (all paths)
      assert.ok(template.includes('Planner'),
        `Path ${pathLetter} should reference Planner agent`);
    });
  }
});

/**
 * Test Suite: Snapshot Baseline Tests
 */
test('Snapshot Baseline Tests', async (t) => {
  const updateMode = process.env.UPDATE_SNAPSHOTS === '1';
  
  if (updateMode) {
    console.log('\n⚠️  UPDATE_SNAPSHOTS=1: Regenerating snapshot baselines...\n');
  }

  for (const [pathLetter, pathName] of Object.entries(BUILD_PATHS)) {
    await t.test(`Path ${pathLetter} (${pathName}): snapshot comparison`, () => {
      const template = getTemplate(pathLetter);
      const result = checkSnapshot(pathLetter, template);

      if (result.action === 'created') {
        console.log(`✓ Created baseline snapshot: forge-path-${pathLetter}.md`);
        assert.ok(true);
      } else if (result.action === 'updated') {
        console.log(`✓ Updated baseline snapshot: forge-path-${pathLetter}.md`);
        assert.ok(true);
      } else if (result.action === 'matched') {
        assert.ok(true);
      } else if (result.action === 'mismatch') {
        assert.fail(
          `Path ${pathLetter} template has changed!\n\n` +
          `Snapshot mismatch in forge-path-${pathLetter}.md:\n${result.diff}\n\n` +
          `If this change is intentional, run:\n` +
          `UPDATE_SNAPSHOTS=1 node --test cli/tests/snapshots.test.js`
        );
      }
    });
  }
});

/**
 * Test Suite: Cross-Path Uniqueness
 */
test('Cross-Path Uniqueness Tests', async (t) => {
  await t.test('No two paths produce identical output', () => {
    const templates = {};
    
    // Collect all templates
    for (const pathLetter of Object.keys(BUILD_PATHS)) {
      templates[pathLetter] = getTemplate(pathLetter);
    }

    // Compare each pair
    const paths = Object.keys(BUILD_PATHS);
    for (let i = 0; i < paths.length; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        const pathA = paths[i];
        const pathB = paths[j];
        assert.notStrictEqual(
          templates[pathA],
          templates[pathB],
          `Path ${pathA} and Path ${pathB} should produce different templates`
        );
      }
    }
  });

  await t.test('Each path has unique identifying content', () => {
    const templates = {};
    
    // Collect all templates
    for (const [pathLetter, pathName] of Object.entries(BUILD_PATHS)) {
      templates[pathLetter] = getTemplate(pathLetter);
    }

    // Each path should have at least one unique line
    for (const [pathLetter, pathName] of Object.entries(BUILD_PATHS)) {
      const template = templates[pathLetter];
      const lines = template.split('\n');
      
      // Find lines unique to this path
      const uniqueLines = lines.filter(line => {
        const otherPaths = Object.keys(BUILD_PATHS).filter(p => p !== pathLetter);
        return otherPaths.every(otherPath => !templates[otherPath].includes(line));
      });

      assert.ok(uniqueLines.length > 0,
        `Path ${pathLetter} should have at least one unique line of content`);
    }
  });
});

/**
 * Test Suite: Path J Regression Tests
 */
test('Path J Regression Tests', async (t) => {
  await t.test('Path J maintains legacy structure', () => {
    const template = getTemplate('J');

    // Path J is the generic FORGE_MD template
    assert.strictEqual(template, FORGE_MD,
      'Path J should return the generic FORGE_MD template');

    // Legacy sections
    const legacySections = [
      '## Project Summary',
      '## Team Roster',
      '## Skills Index',
      '## Cookbook'
    ];

    for (const section of legacySections) {
      assert.ok(template.includes(section),
        `Path J should maintain legacy section: ${section}`);
    }

    // Should have Planner agent
    assert.ok(template.includes('Planner'),
      'Path J should reference Planner agent');

    // Should have version stamp
    assert.ok(template.includes('copilotforge: v'),
      'Path J should contain version stamp');
  });

  await t.test('Path J has wizard prompt', () => {
    const template = getTemplate('J');
    
    // Should prompt user to run wizard
    assert.ok(
      template.includes('Run the wizard') || 
      template.includes('set up my project'),
      'Path J should prompt user to run the wizard'
    );
  });
});

/**
 * Test Suite: Version Stamp Consistency
 */
test('Version Stamp Consistency', async (t) => {
  await t.test('All paths use same version', () => {
    const versions = new Set();

    for (const pathLetter of Object.keys(BUILD_PATHS)) {
      const template = getTemplate(pathLetter);
      const match = template.match(/copilotforge: v([\d.]+)/);
      
      assert.ok(match, `Path ${pathLetter} should have version stamp`);
      versions.add(match[1]);
    }

    assert.strictEqual(versions.size, 1,
      'All paths should use the same version number');
    assert.ok(versions.has(pkg.version),
      `All paths should use version ${pkg.version}`);
  });
});

/**
 * Test Suite: Documentation Links
 */
test('Documentation Links', async (t) => {
  await t.test('Platform-specific paths include MS Learn links', () => {
    // Paths A-I should have MS Learn links (Path J is generic)
    for (const pathLetter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']) {
      const template = getTemplate(pathLetter);
      assert.ok(
        template.includes('https://learn.microsoft.com'),
        `Path ${pathLetter} should include MS Learn documentation link`
      );
    }
  });
});

console.log(`\n✓ Snapshot tests for all ${Object.keys(BUILD_PATHS).length} Build Paths (A-J)\n`);
