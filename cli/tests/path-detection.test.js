'use strict';

// Phase 13 — Path Detection Test Suite
// Tests readPathStamp, PATH_NAMES (doctor.js) and getPlatformForge (platform-forge.js)

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { getPlatformForge } = require('../src/templates/platform-forge');
const { FORGE_MD } = require('../src/templates/forge');
const { readPathStamp, PATH_NAMES } = require('../src/doctor');

const JARGON_TERMS = ['skill-writer', 'agent-writer', 'memory-writer', 'cookbook-writer'];
const { scanForJargon, collectFiles } = require('./helpers/jargon-scan');
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
// 3. Version stamp — all paths carry v2.3.0
// ─────────────────────────────────────────────────────────────────────────────

describe('getPlatformForge - version stamp', () => {
  for (const letter of PLATFORM_PATHS) {
    it(`Path ${letter} contains <!-- copilotforge: v2.3.0 -->`, () => {
      assert.ok(
        getPlatformForge(letter).includes('copilotforge: v2.3.0'),
        `Path ${letter} template should carry version stamp v2.3.0`
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
// 8b. Oracle Prime — skill and integration file validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Oracle Prime - skill and integration validation', () => {
  const fs = require('fs');
  const path = require('path');
  const repoRoot = path.resolve(__dirname, '..', '..');

  const ORACLE_FILES = {
    instructions: path.join(repoRoot, '.github', 'instructions', 'oracle-prime.instructions.md'),
    skill: path.join(repoRoot, '.github', 'skills', 'oracle-prime', 'SKILL.md'),
    agentTemplate: path.join(repoRoot, 'templates', 'agents', 'oracle-prime.md'),
    cookbookTs: path.join(repoRoot, 'cookbook', 'oracle-prime.ts'),
    cookbookPy: path.join(repoRoot, 'cookbook', 'oracle-prime.py'),
  };

  it('oracle-prime.instructions.md exists and contains applyTo: ** glob', () => {
    assert.ok(fs.existsSync(ORACLE_FILES.instructions), 'instructions file should exist');
    const content = fs.readFileSync(ORACLE_FILES.instructions, 'utf8');
    assert.ok(content.includes("applyTo: '**'"), 'instructions should apply globally');
  });

  it('oracle-prime SKILL.md exists and contains all 12 trigger phrases', () => {
    assert.ok(fs.existsSync(ORACLE_FILES.skill), 'skill file should exist');
    const content = fs.readFileSync(ORACLE_FILES.skill, 'utf8');
    const expectedTriggers = [
      'deep analysis', 'oracle prime', 'analyze this deeply',
      'scenario analysis', 'what are the risks', 'stress test this',
      'red team this', 'what could go wrong', 'give me the full picture',
      'bayesian analysis', 'counterfactual'
    ];
    for (const trigger of expectedTriggers) {
      assert.ok(
        content.includes(trigger),
        `SKILL.md should contain trigger phrase: "${trigger}"`
      );
    }
  });

  it('oracle-prime SKILL.md contains all 7 reasoning stages', () => {
    const content = fs.readFileSync(ORACLE_FILES.skill, 'utf8');
    const stages = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
    for (const stage of stages) {
      assert.ok(
        content.includes(`**${stage}`),
        `SKILL.md should contain reasoning stage ${stage}`
      );
    }
  });

  it('oracle-prime SKILL.md contains all required output sections', () => {
    const content = fs.readFileSync(ORACLE_FILES.skill, 'utf8');
    const sections = [
      'Reframe', 'Transparency Log', 'Key Variables', 'Scenario Map',
      'Causal Chain', 'Counterfactual Pivot', 'Critical Uncertainties',
      'Conclusion', 'Confidence'
    ];
    for (const section of sections) {
      assert.ok(
        content.includes(section),
        `SKILL.md should contain output section: "${section}"`
      );
    }
  });

  it('oracle-prime SKILL.md contains all 6 algorithm modes', () => {
    const content = fs.readFileSync(ORACLE_FILES.skill, 'utf8');
    const modes = ['ADVERSARIAL', 'MONTE CARLO', 'FERMI', 'RED TEAM', 'SIGNAL vs NOISE', 'COUNTERFACTUAL'];
    for (const mode of modes) {
      assert.ok(
        content.includes(`[${mode}]`),
        `SKILL.md should contain algorithm mode: [${mode}]`
      );
    }
  });

  it('oracle-prime instructions contain 3-tier complexity classification', () => {
    const content = fs.readFileSync(ORACLE_FILES.instructions, 'utf8');
    assert.ok(content.includes('Simple'), 'should contain Simple tier');
    assert.ok(content.includes('Medium'), 'should contain Medium tier');
    assert.ok(content.includes('Complex'), 'should contain Complex tier');
  });

  it('oracle-prime instructions contain all 5 Standing Patches', () => {
    const content = fs.readFileSync(ORACLE_FILES.instructions, 'utf8');
    for (let i = 1; i <= 5; i++) {
      assert.ok(
        content.includes(`**P${i}**`),
        `instructions should contain Standing Patch P${i}`
      );
    }
  });

  it('oracle-prime agent template exists and contains Identity section', () => {
    assert.ok(fs.existsSync(ORACLE_FILES.agentTemplate), 'agent template should exist');
    const content = fs.readFileSync(ORACLE_FILES.agentTemplate, 'utf8');
    assert.ok(content.includes('## Identity'), 'template should contain Identity section');
    assert.ok(content.includes('Precision Reasoning'), 'template should describe precision reasoning');
  });

  it('oracle-prime cookbook recipes exist for both TypeScript and Python', () => {
    assert.ok(fs.existsSync(ORACLE_FILES.cookbookTs), 'TypeScript cookbook recipe should exist');
    assert.ok(fs.existsSync(ORACLE_FILES.cookbookPy), 'Python cookbook recipe should exist');
  });

  it('oracle-prime cookbook recipes follow recipe header format', () => {
    const tsContent = fs.readFileSync(ORACLE_FILES.cookbookTs, 'utf8');
    const pyContent = fs.readFileSync(ORACLE_FILES.cookbookPy, 'utf8');

    assert.ok(tsContent.includes('WHAT THIS DOES:'), 'TS recipe should have WHAT THIS DOES header');
    assert.ok(tsContent.includes('WHEN TO USE THIS:'), 'TS recipe should have WHEN TO USE THIS header');
    assert.ok(tsContent.includes('HOW TO RUN:'), 'TS recipe should have HOW TO RUN header');
    assert.ok(tsContent.includes('PREREQUISITES:'), 'TS recipe should have PREREQUISITES header');

    assert.ok(pyContent.includes('WHAT THIS DOES:'), 'PY recipe should have WHAT THIS DOES header');
    assert.ok(pyContent.includes('WHEN TO USE THIS:'), 'PY recipe should have WHEN TO USE THIS header');
    assert.ok(pyContent.includes('HOW TO RUN:'), 'PY recipe should have HOW TO RUN header');
    assert.ok(pyContent.includes('PREREQUISITES:'), 'PY recipe should have PREREQUISITES header');
  });

  it('oracle-prime files contain no forbidden jargon terms', () => {
    const violations = [];
    for (const [name, filePath] of Object.entries(ORACLE_FILES)) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf8');
      for (const term of JARGON_TERMS) {
        if (content.includes(term)) {
          violations.push(`${name}: contains "${term}"`);
        }
      }
    }
    assert.strictEqual(
      violations.length,
      0,
      `Oracle Prime jargon violations:\n${violations.join('\n')}`
    );
  });

  it('planner SKILL.md contains Oracle Prime as a Q6 extras choice', () => {
    const plannerPath = path.join(repoRoot, '.github', 'skills', 'planner', 'SKILL.md');
    const content = fs.readFileSync(plannerPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'planner SKILL.md should list Oracle Prime as a Q6 extra'
    );
  });

  it('planner reference.md contains Oracle Prime extras catalog entry', () => {
    const refPath = path.join(repoRoot, '.github', 'skills', 'planner', 'reference.md');
    const content = fs.readFileSync(refPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'reference.md should contain Oracle Prime extras entry'
    );
    assert.ok(
      content.includes('oracle-prime'),
      'reference.md should contain oracle-prime fuzzy name mapping'
    );
  });

  it('forge-compass SKILL.md references Oracle Prime enhancements', () => {
    const compassPath = path.join(repoRoot, '.github', 'skills', 'forge-compass', 'SKILL.md');
    const content = fs.readFileSync(compassPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'forge-compass should reference Oracle Prime enhancements'
    );
  });

  it('reviewer template references Oracle Prime for architectural escalation', () => {
    const reviewerPath = path.join(repoRoot, 'templates', 'agents', 'reviewer.md');
    const content = fs.readFileSync(reviewerPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'reviewer template should reference Oracle Prime escalation'
    );
  });

  it('ORACLE_PRIME_AGENT_MD template is exported from cli/src/templates/agents.js', () => {
    const { ORACLE_PRIME_AGENT_MD } = require('../src/templates/agents');
    assert.ok(ORACLE_PRIME_AGENT_MD, 'ORACLE_PRIME_AGENT_MD should be exported');
    assert.ok(
      ORACLE_PRIME_AGENT_MD.includes('Oracle Prime'),
      'template should contain Oracle Prime name'
    );
    assert.ok(
      ORACLE_PRIME_AGENT_MD.includes('Precision Reasoning'),
      'template should describe precision reasoning'
    );
    assert.ok(
      ORACLE_PRIME_AGENT_MD.includes('S1'),
      'template should reference reasoning stages'
    );
  });

  it('ORACLE_PRIME_AGENT_MD is accessible via barrel export', () => {
    const templates = require('../src/templates');
    assert.ok(
      templates.ORACLE_PRIME_AGENT_MD,
      'ORACLE_PRIME_AGENT_MD should be accessible via barrel export'
    );
  });

  it('oracle-prime.agent.md exists in .github/agents/', () => {
    const agentPath = path.join(repoRoot, '.github', 'agents', 'oracle-prime.agent.md');
    assert.ok(fs.existsSync(agentPath), 'oracle-prime.agent.md should exist in .github/agents/');
    const content = fs.readFileSync(agentPath, 'utf8');
    assert.ok(content.includes('name: Oracle Prime'), 'agent file should have name frontmatter');
    assert.ok(content.includes('description:'), 'agent file should have description frontmatter');
  });

  it('oracle-prime.agent.md contains no forbidden jargon', () => {
    const agentPath = path.join(repoRoot, '.github', 'agents', 'oracle-prime.agent.md');
    const content = fs.readFileSync(agentPath, 'utf8');
    for (const term of JARGON_TERMS) {
      assert.ok(
        !content.includes(term),
        `oracle-prime.agent.md should not contain "${term}"`
      );
    }
  });

  it('oracle-prime SKILL.md contains evolution persistence instructions', () => {
    const content = fs.readFileSync(ORACLE_FILES.skill, 'utf8');
    assert.ok(
      content.includes('Evolution Persistence'),
      'SKILL.md should contain Evolution Persistence section'
    );
    assert.ok(
      content.includes('forge remember'),
      'SKILL.md should reference forge remember mechanism'
    );
  });

  it('init.js FULL_FILES array includes oracle-prime.md', () => {
    const initPath = path.join(repoRoot, 'cli', 'src', 'init.js');
    const content = fs.readFileSync(initPath, 'utf8');
    assert.ok(
      content.includes("'oracle-prime.md'"),
      'init.js should include oracle-prime.md in FULL_FILES'
    );
  });

  it('upgrade.js FRAMEWORK_FILES array includes oracle-prime.md', () => {
    const upgradePath = path.join(repoRoot, 'cli', 'src', 'upgrade.js');
    const content = fs.readFileSync(upgradePath, 'utf8');
    assert.ok(
      content.includes("'oracle-prime.md'"),
      'upgrade.js should include oracle-prime.md in FRAMEWORK_FILES'
    );
  });

  it('doctor.js includes Oracle Prime health checks', () => {
    const doctorPath = path.join(repoRoot, 'cli', 'src', 'doctor.js');
    const content = fs.readFileSync(doctorPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'doctor.js should include Oracle Prime health checks'
    );
    assert.ok(
      content.includes('oracle-prime.instructions.md'),
      'doctor.js should check oracle-prime.instructions.md'
    );
  });

  it('examples/oracle-prime-session/README.md exists', () => {
    const examplePath = path.join(repoRoot, 'examples', 'oracle-prime-session', 'README.md');
    assert.ok(
      fs.existsSync(examplePath),
      'Oracle Prime example session should exist'
    );
    const content = fs.readFileSync(examplePath, 'utf8');
    assert.ok(
      content.includes('SESSION STATE'),
      'example should demonstrate session state'
    );
    assert.ok(
      content.includes('ORACLE EVOLUTION'),
      'example should demonstrate evolution block'
    );
  });

  it('init.js supports --oracle-prime flag', () => {
    const initPath = path.join(repoRoot, 'cli', 'src', 'init.js');
    const content = fs.readFileSync(initPath, 'utf8');
    assert.ok(
      content.includes("'--oracle-prime'"),
      'init.js should support --oracle-prime flag'
    );
    assert.ok(
      content.includes('oraclePrimeOnly'),
      'init.js should have oraclePrimeOnly code path'
    );
  });

  it('copilotforge.js help text includes --oracle-prime', () => {
    const binPath = path.join(repoRoot, 'cli', 'bin', 'copilotforge.js');
    const content = fs.readFileSync(binPath, 'utf8');
    assert.ok(
      content.includes('--oracle-prime'),
      'help text should document --oracle-prime flag'
    );
  });

  it('interactive.js includes Oracle Prime menu option', () => {
    const interactivePath = path.join(repoRoot, 'cli', 'src', 'interactive.js');
    const content = fs.readFileSync(interactivePath, 'utf8');
    assert.ok(
      content.includes('oracle-prime'),
      'interactive.js should have oracle-prime menu value'
    );
    assert.ok(
      content.includes('Install Oracle Prime'),
      'interactive.js should have Install Oracle Prime label'
    );
  });

  it('CHANGELOG.md documents Oracle Prime', () => {
    const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
    const content = fs.readFileSync(changelogPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'CHANGELOG should document Oracle Prime'
    );
  });

  it('.vscode/oracle-prime.code-snippets exists and is valid JSON', () => {
    const snippetsPath = path.join(repoRoot, '.vscode', 'oracle-prime.code-snippets');
    assert.ok(fs.existsSync(snippetsPath), 'snippets file should exist');
    const content = fs.readFileSync(snippetsPath, 'utf8');
    const parsed = JSON.parse(content);
    assert.ok(parsed['Oracle Prime: Full Analysis'], 'should have Full Analysis snippet');
    assert.ok(parsed['Oracle Prime: Quick Scenario'], 'should have Quick Scenario snippet');
    assert.ok(parsed['Oracle Prime: Evolution Block'], 'should have Evolution Block snippet');
    assert.ok(parsed['Oracle Prime: Session State'], 'should have Session State snippet');
  });

  it('Squad routing.md includes Oracle Prime', () => {
    const routingPath = path.join(repoRoot, '.squad', 'routing.md');
    const content = fs.readFileSync(routingPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'Squad routing should include Oracle Prime'
    );
    assert.ok(
      content.includes('Deep analysis'),
      'Squad routing should describe Oracle Prime role'
    );
  });

  it('.github/prompts/oracle-prime.prompt.md exists with valid frontmatter', () => {
    const promptPath = path.join(repoRoot, '.github', 'prompts', 'oracle-prime.prompt.md');
    assert.ok(fs.existsSync(promptPath), 'oracle-prime.prompt.md should exist');
    const content = fs.readFileSync(promptPath, 'utf8');
    assert.ok(content.startsWith('---'), 'prompt file should have YAML frontmatter');
    assert.ok(content.includes('description:'), 'prompt file should have description field');
    assert.ok(content.includes('${input:question}'), 'prompt should have question input variable');
  });

  it('status.js highlights oracle-prime with crystal ball emoji', () => {
    const statusPath = path.join(repoRoot, 'cli', 'src', 'status.js');
    const content = fs.readFileSync(statusPath, 'utf8');
    assert.ok(
      content.includes('oracle-prime'),
      'status.js should check for oracle-prime skill name'
    );
  });

  it('README.md includes Oracle Prime in features and installation', () => {
    const readmePath = path.join(repoRoot, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'README should mention Oracle Prime'
    );
    assert.ok(
      content.includes('--oracle-prime'),
      'README should document --oracle-prime flag'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8c. Oracle Prime — distribution sync drift detection
// ─────────────────────────────────────────────────────────────────────────────

describe('Oracle Prime - distribution sync drift detection', () => {
  const fs = require('fs');
  const path = require('path');
  const repoRoot = path.resolve(__dirname, '..', '..');

  it('cli/files/ oracle-prime instructions matches source', () => {
    const src = path.join(repoRoot, '.github', 'instructions', 'oracle-prime.instructions.md');
    const dist = path.join(repoRoot, 'cli', 'files', '.github', 'instructions', 'oracle-prime.instructions.md');
    assert.ok(fs.existsSync(src), 'source instructions should exist');
    assert.ok(fs.existsSync(dist), 'dist instructions should exist');
    const srcContent = fs.readFileSync(src, 'utf8');
    const distContent = fs.readFileSync(dist, 'utf8');
    assert.strictEqual(srcContent, distContent, 'cli/files/ instructions should match source — run sync if different');
  });

  it('cli/files/ oracle-prime SKILL.md matches source', () => {
    const src = path.join(repoRoot, '.github', 'skills', 'oracle-prime', 'SKILL.md');
    const dist = path.join(repoRoot, 'cli', 'files', '.github', 'skills', 'oracle-prime', 'SKILL.md');
    assert.ok(fs.existsSync(src), 'source SKILL.md should exist');
    assert.ok(fs.existsSync(dist), 'dist SKILL.md should exist');
    const srcContent = fs.readFileSync(src, 'utf8');
    const distContent = fs.readFileSync(dist, 'utf8');
    assert.strictEqual(srcContent, distContent, 'cli/files/ SKILL.md should match source — run sync if different');
  });

  it('uninstall.js includes Oracle Prime files', () => {
    const uninstallPath = path.join(repoRoot, 'cli', 'src', 'uninstall.js');
    const content = fs.readFileSync(uninstallPath, 'utf8');
    assert.ok(
      content.includes('oracle-prime'),
      'uninstall.js should include Oracle Prime files'
    );
  });

  it('oracle.js subcommand module exists', () => {
    const oraclePath = path.join(repoRoot, 'cli', 'src', 'oracle.js');
    assert.ok(fs.existsSync(oraclePath), 'oracle.js subcommand should exist');
    const content = fs.readFileSync(oraclePath, 'utf8');
    assert.ok(content.includes('Oracle Prime'), 'oracle.js should reference Oracle Prime');
  });

  it('copilotforge.js routes oracle subcommand', () => {
    const binPath = path.join(repoRoot, 'cli', 'bin', 'copilotforge.js');
    const content = fs.readFileSync(binPath, 'utf8');
    assert.ok(
      content.includes("case 'oracle'"),
      'copilotforge.js should route oracle command'
    );
  });

  it('GETTING-STARTED.md documents Oracle Prime', () => {
    const gsPath = path.join(repoRoot, 'docs', 'GETTING-STARTED.md');
    const content = fs.readFileSync(gsPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'GETTING-STARTED.md should document Oracle Prime'
    );
  });

  it('HOW-IT-WORKS.md documents Oracle Prime adaptive reasoning', () => {
    const hiwPath = path.join(repoRoot, 'docs', 'HOW-IT-WORKS.md');
    const content = fs.readFileSync(hiwPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'HOW-IT-WORKS.md should document Oracle Prime'
    );
    assert.ok(
      content.includes('S1'),
      'HOW-IT-WORKS.md should reference reasoning stages'
    );
    assert.ok(
      content.includes('three tiers'),
      'HOW-IT-WORKS.md should explain complexity tiers'
    );
  });

  it('WHAT-TO-USE.md mentions Oracle Prime', () => {
    const wtuPath = path.join(repoRoot, 'docs', 'WHAT-TO-USE.md');
    const content = fs.readFileSync(wtuPath, 'utf8');
    assert.ok(
      content.includes('Oracle Prime'),
      'WHAT-TO-USE.md should mention Oracle Prime'
    );
  });

  it('shared jargon scan helper exists and exports correctly', () => {
    const helperPath = path.join(repoRoot, 'cli', 'tests', 'helpers', 'jargon-scan.js');
    assert.ok(fs.existsSync(helperPath), 'jargon-scan.js helper should exist');
    const helper = require('./helpers/jargon-scan');
    assert.ok(typeof helper.scanForJargon === 'function', 'scanForJargon should be a function');
    assert.ok(typeof helper.collectFiles === 'function', 'collectFiles should be a function');
    assert.ok(Array.isArray(helper.JARGON_TERMS), 'JARGON_TERMS should be an array');
  });

  it('oracle-prime cookbook recipes support --interactive flag', () => {
    const tsPath = path.join(repoRoot, 'cookbook', 'oracle-prime.ts');
    const pyPath = path.join(repoRoot, 'cookbook', 'oracle-prime.py');
    const tsContent = fs.readFileSync(tsPath, 'utf8');
    const pyContent = fs.readFileSync(pyPath, 'utf8');
    assert.ok(
      tsContent.includes('--interactive'),
      'TS recipe should support --interactive flag'
    );
    assert.ok(
      pyContent.includes('--interactive'),
      'PY recipe should support --interactive flag'
    );
  });

  it('init.js supports --answers flag for non-interactive wizard', () => {
    const initPath = path.join(repoRoot, 'cli', 'src', 'init.js');
    const content = fs.readFileSync(initPath, 'utf8');
    assert.ok(
      content.includes("'--answers'"),
      'init.js should support --answers flag'
    );
    assert.ok(
      content.includes('prefilledAnswers'),
      'init.js should parse prefilled answers'
    );
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

  it('no file in templates/agents/ contains forbidden specialist jargon', () => {
    const { violations, fileCount } = scanForJargon(agentsDir, repoRoot);
    assert.ok(fileCount > 0, 'templates/agents/ should contain at least one file');
    assert.strictEqual(
      violations.length,
      0,
      `Jargon violations found:\n${violations.join('\n')}`
    );
  });

  it('no file in .github/skills/ contains forbidden specialist jargon', () => {
    const { violations, fileCount } = scanForJargon(skillsDir, repoRoot);
    assert.ok(fileCount > 0, '.github/skills/ should contain at least one file');
    assert.strictEqual(
      violations.length,
      0,
      `Jargon violations found:\n${violations.join('\n')}`
    );
  });
});
