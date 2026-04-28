'use strict';

const fs = require('fs');
const path = require('path');

const JARGON_TERMS = ['skill-writer', 'agent-writer', 'memory-writer', 'cookbook-writer'];

/**
 * Recursively collect markdown and TypeScript files from a directory.
 * @param {string} dir - Directory to scan
 * @returns {string[]} Array of absolute file paths
 */
function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Scan files in a directory for forbidden jargon terms.
 * @param {string} dir - Directory to scan
 * @param {string} repoRoot - Repo root for relative path display
 * @param {string[]} [terms] - Override default jargon terms
 * @returns {{ violations: string[], fileCount: number }}
 */
function scanForJargon(dir, repoRoot, terms = JARGON_TERMS) {
  const files = collectFiles(dir);
  const violations = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const term of terms) {
      if (content.includes(term)) {
        violations.push(`${path.relative(repoRoot, filePath)}: contains "${term}"`);
      }
    }
  }
  return { violations, fileCount: files.length };
}

module.exports = { JARGON_TERMS, collectFiles, scanForJargon };
