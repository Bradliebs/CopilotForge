'use strict';

// getPlatformForge — returns path-specific FORGE.md template (Phase 13 Task 9)
// Paths A-I will be added in Task 9. Path J falls back to getForge().
function getPlatformForge(forgePath) {
  const { FORGE_MD } = require('./forge');
  // TODO Task 9: add cases for paths A-I
  return FORGE_MD; // default: Path J behavior
}

module.exports = { getPlatformForge };
