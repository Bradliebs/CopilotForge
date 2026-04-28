'use strict';

module.exports = {
  name: 'Test Path',
  description: 'Test plugin for CopilotForge plugin loader validation',
  buildPath: 'K',
  signals: ['test-plugin-signal', 'test-path'],
  questions: [
    { id: 'k1', prompt: 'Test question?' },
  ],
  templates: {
    forge: '<!-- copilotforge: path=K -->\n# Test Path FORGE.md\n',
  },
};
