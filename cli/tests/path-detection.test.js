'use strict';

// Phase 13 — Path Detection Test Suite
// Tests readPathStamp, PATH_NAMES (doctor.js) and getPlatformForge (platform-forge.js)

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { getPlatformForge } = require('../src/templates/platform-forge');
const { FORGE_MD } = require('../src/templates/forge');
const pkg = require('../package.json');
const CURRENT_VERSION = `v${pkg.version}`;
const { readPathStamp, PATH_NAMES } = require('../src/doctor');

const JARGON_TERMS = ['skill-writer', 'agent-writer', 'memory-writer', 'cookbook-writer'];
const PLATFORM_PATHS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const ALL_PATHS = [...PLATFORM_PATHS, 'J'];

// ─────────────────────────────────────────────────────────────────────────────
// 1. readPathStamp — path stamp reading
// ─────────────────────────────────────────────────────────────────────────────

describe('readPathStamp - path stamp reading', () => {
  it('returns "A" for valid stamp <!-- copilotforge: path=A -->', () => {
    assert.strictEqual(readPathStamp('<!-- copilotforge: path=A -->'), 'A');
  });

  it('returns correct letter for each valid path A through J', () => {
    for (const letter of ALL_PATHS) {
      const content = `# FORGE.md\n<!-- copilotforge: path=${letter} -->\n`;
      assert.strictEqual(
        readPathStamp(content),
        letter,
        `Expected "${letter}" for stamp path=${letter}`
      );
    }
  });

  it('returns null for content with no stamp', () => {
    assert.strictEqual(readPathStamp('# FORGE.md\n\nNo stamp here at all.'), null);
  });

  it('returns null for malformed stamp <!-- copilotforge: path=Z --> (Z not a valid path)', () => {
    assert.strictEqual(readPathStamp('<!-- copilotforge: path=Z -->'), null);
  });

  it('returns null for empty string', () => {
    assert.strictEqual(readPathStamp(''), null);
  });

  it('returns null for null input', () => {
    assert.strictEqual(readPathStamp(null), null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. getPlatformForge — path routing content
// ─────────────────────────────────────────────────────────────────────────────

describe('getPlatformForge - path routing', () => {
  it('Path A returns content containing "Copilot Studio"', () => {
    assert.ok(
      getPlatformForge('A').includes('Copilot Studio'),
      'Path A template should mention Copilot Studio'
    );
  });

  it('Path B returns content containing "Custom Connector" or "Studio Connector"', () => {
    const result = getPlatformForge('B');
    assert.ok(
      result.includes('Custom Connector') || result.includes('Studio Connector'),
      'Path B template should mention Custom Connector or Studio Connector'
    );
  });

  it('Path C returns content containing "Declarative Agent"', () => {
    assert.ok(
      getPlatformForge('C').includes('Declarative Agent'),
      'Path C template should mention Declarative Agent'
    );
  });

  it('Path D returns content containing "Canvas"', () => {
    assert.ok(
      getPlatformForge('D').includes('Canvas'),
      'Path D template should mention Canvas'
    );
  });

  it('Path E returns content containing "Power Automate"', () => {
    assert.ok(
      getPlatformForge('E').includes('Power Automate'),
      'Path E template should mention Power Automate'
    );
  });

  it('Path F returns content containing "PCF" or "Component Framework"', () => {
    const result = getPlatformForge('F');
    assert.ok(
      result.includes('PCF') || result.includes('Component Framework'),
      'Path F template should mention PCF or Component Framework'
    );
  });

  it('Path G returns content containing "Power BI"', () => {
    assert.ok(
      getPlatformForge('G').includes('Power BI'),
      'Path G template should mention Power BI'
    );
  });

  it('Path H returns content containing "SharePoint"', () => {
    assert.ok(
      getPlatformForge('H').includes('SharePoint'),
      'Path H template should mention SharePoint'
    );
  });

  it('Path I returns content containing "Power Pages"', () => {
    assert.ok(
      getPlatformForge('I').includes('Power Pages'),
      'Path I template should mention Power Pages'
    );
  });

  it('Path J returns the same content as FORGE_MD (backward compat)', () => {
    assert.strictEqual(getPlatformForge('J'), FORGE_MD);
  });

  it('null path falls back to FORGE_MD (Path J behavior)', () => {
    assert.strictEqual(getPlatformForge(null), FORGE_MD);
  });

  it('undefined path falls back to FORGE_MD (Path J behavior)', () => {
    assert.strictEqual(getPlatformForge(undefined), FORGE_MD);
  });

  it('empty string path falls back to FORGE_MD (Path J behavior)', () => {
    assert.strictEqual(getPlatformForge(''), FORGE_MD);
  });

  it('lowercase path letters are normalized — "a" routes to Path A', () => {
    assert.ok(
      getPlatformForge('a').includes('Copilot Studio'),
      'Lowercase "a" should normalize to Path A'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Version stamp — all paths carry the current package version
// ─────────────────────────────────────────────────────────────────────────────

describe('getPlatformForge - version stamp', () => {
  for (const letter of PLATFORM_PATHS) {
    it(`Path ${letter} contains <!-- copilotforge: ${CURRENT_VERSION} -->`, () => {
      assert.ok(
        getPlatformForge(letter).includes(`copilotforge: ${CURRENT_VERSION}`),
        `Path ${letter} template should carry version stamp ${CURRENT_VERSION}`
      );
    });
  }

  it('Path J (FORGE_MD) contains a copilotforge version stamp', () => {
    assert.ok(
      FORGE_MD.includes('copilotforge: v'),
      'FORGE_MD should contain a copilotforge version stamp'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Path stamp embedded in template output (A–I)
// ─────────────────────────────────────────────────────────────────────────────

describe('getPlatformForge - path stamp embedded in output', () => {
  for (const letter of PLATFORM_PATHS) {
    it(`Path ${letter} output contains <!-- copilotforge: path=${letter} -->`, () => {
      assert.ok(
        getPlatformForge(letter).includes(`copilotforge: path=${letter}`),
        `Path ${letter} output should carry its own path stamp`
      );
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Path J regression — backward compatibility
// ─────────────────────────────────────────────────────────────────────────────

describe('getPlatformForge - Path J regression (backward compatibility)', () => {
  it('getPlatformForge("J") output is identical to FORGE_MD', () => {
    assert.strictEqual(getPlatformForge('J'), FORGE_MD);
  });

  it('getPlatformForge(undefined) does not throw', () => {
    assert.doesNotThrow(() => getPlatformForge(undefined));
  });

  it('getPlatformForge(null) does not throw', () => {
    assert.doesNotThrow(() => getPlatformForge(null));
  });

  it('getPlatformForge("") does not throw', () => {
    assert.doesNotThrow(() => getPlatformForge(''));
  });

  it('all paths A–J return a non-empty string', () => {
    for (const letter of ALL_PATHS) {
      const result = getPlatformForge(letter);
      assert.strictEqual(typeof result, 'string', `Path ${letter} should return a string`);
      assert.ok(result.length > 0, `Path ${letter} should return a non-empty string`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Jargon leak regression — no specialist internal terms
// ─────────────────────────────────────────────────────────────────────────────

describe('getPlatformForge - jargon leak regression', () => {
  for (const letter of ALL_PATHS) {
    it(`Path ${letter} output must not contain specialist jargon terms`, () => {
      const result = getPlatformForge(letter);
      for (const term of JARGON_TERMS) {
        assert.ok(
          !result.includes(term),
          `Path ${letter} output must not contain jargon term "${term}"`
        );
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. PATH_NAMES map — doctor.js routing table
// ─────────────────────────────────────────────────────────────────────────────

describe('PATH_NAMES - path name map', () => {
  it('PATH_NAMES["A"] === "Copilot Studio Agent"', () => {
    assert.strictEqual(PATH_NAMES['A'], 'Copilot Studio Agent');
  });

  it('PATH_NAMES covers all letters A through I with non-empty strings', () => {
    for (const letter of PLATFORM_PATHS) {
      assert.ok(
        PATH_NAMES[letter] !== undefined,
        `PATH_NAMES should have an entry for path "${letter}"`
      );
      assert.strictEqual(typeof PATH_NAMES[letter], 'string');
      assert.ok(PATH_NAMES[letter].length > 0, `PATH_NAMES["${letter}"] should not be empty`);
    }
  });

  it('PATH_NAMES["J"] is undefined (J is the generic fallback, not a named path)', () => {
    assert.strictEqual(PATH_NAMES['J'], undefined);
  });

  it('PATH_NAMES["B"] contains "Connector" (Studio + Custom Connector path)', () => {
    assert.ok(PATH_NAMES['B'].includes('Connector'), `PATH_NAMES["B"] = "${PATH_NAMES['B']}" should include "Connector"`);
  });

  it('PATH_NAMES["C"] === "Declarative Agent"', () => {
    assert.strictEqual(PATH_NAMES['C'], 'Declarative Agent');
  });

  it('PATH_NAMES["D"] contains "Canvas"', () => {
    assert.ok(PATH_NAMES['D'].includes('Canvas'), `PATH_NAMES["D"] = "${PATH_NAMES['D']}" should include "Canvas"`);
  });

  it('PATH_NAMES["E"] === "Power Automate"', () => {
    assert.strictEqual(PATH_NAMES['E'], 'Power Automate');
  });

  it('PATH_NAMES["F"] contains "PCF"', () => {
    assert.ok(PATH_NAMES['F'].includes('PCF'), `PATH_NAMES["F"] = "${PATH_NAMES['F']}" should include "PCF"`);
  });

  it('PATH_NAMES["G"] contains "Power BI"', () => {
    assert.ok(PATH_NAMES['G'].includes('Power BI'), `PATH_NAMES["G"] = "${PATH_NAMES['G']}" should include "Power BI"`);
  });

  it('PATH_NAMES["H"] contains "SharePoint"', () => {
    assert.ok(PATH_NAMES['H'].includes('SharePoint'), `PATH_NAMES["H"] = "${PATH_NAMES['H']}" should include "SharePoint"`);
  });

  it('PATH_NAMES["I"] contains "Power Pages"', () => {
    assert.ok(PATH_NAMES['I'].includes('Power Pages'), `PATH_NAMES["I"] = "${PATH_NAMES['I']}" should include "Power Pages"`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. forge-compass — integration note
// ─────────────────────────────────────────────────────────────────────────────

describe('forge-compass - contradiction/compass detection', () => {
  it('forge-compass is a markdown skill — covered by integration tests, not unit tests', () => {
    // forge-compass lives at .github/skills/forge-compass/SKILL.md (pure markdown).
    // Its path-detection signal phrases are exercised by the planner wizard integration flow,
    // not by unit tests. This placeholder marks the test group as acknowledged and intentionally skipped.
    assert.ok(true, 'forge-compass is markdown-only — unit test not applicable');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. File-system jargon scan — templates/agents/ and .github/skills/
// ─────────────────────────────────────────────────────────────────────────────

describe('file-system jargon scan - templates/agents/ and .github/skills/', () => {
  const fs = require('fs');
  const path = require('path');

  // Resolve paths relative to the cli/ directory (this file lives in cli/tests/)
  const repoRoot = path.resolve(__dirname, '..', '..');
  const agentsDir = path.join(repoRoot, 'templates', 'agents');
  const skillsDir = path.join(repoRoot, '.github', 'skills');

  function collectMarkdownFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.ts'))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('no file in templates/agents/ contains forbidden specialist jargon', () => {
    const files = collectMarkdownFiles(agentsDir);
    assert.ok(files.length > 0, 'templates/agents/ should contain at least one file');
    const violations = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const term of JARGON_TERMS) {
        if (content.includes(term)) {
          violations.push(`${path.relative(repoRoot, filePath)}: contains "${term}"`);
        }
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Jargon violations found:\n${violations.join('\n')}`
    );
  });

  it('no file in .github/skills/ contains forbidden specialist jargon', () => {
    const files = collectMarkdownFiles(skillsDir);
    assert.ok(files.length > 0, '.github/skills/ should contain at least one file');
    const violations = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const term of JARGON_TERMS) {
        if (content.includes(term)) {
          violations.push(`${path.relative(repoRoot, filePath)}: contains "${term}"`);
        }
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Jargon violations found:\n${violations.join('\n')}`
    );
  });
});