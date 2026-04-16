'use strict';

// Barrel re-export — backward-compatible entry point for cli/src/templates/
// All existing require('./templates') callers continue to work unchanged.

const forge = require('./forge');
const agents = require('./agents');
const memory = require('./memory');
const cookbook = require('./cookbook');
const init = require('./init');
const platformGuides = require('./platform-guides');
const platformForge = require('./platform-forge');

module.exports = {
  ...forge,
  ...agents,
  ...memory,
  ...cookbook,
  ...init,
  ...platformGuides,
  ...platformForge,
};
