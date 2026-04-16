'use strict';

// Backward-compatible shim — all exports now live in cli/src/templates/
// Any file that does require('./templates') continues to work unchanged.
module.exports = require('./templates/index');
