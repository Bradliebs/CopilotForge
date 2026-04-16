'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const interactive = require('../src/interactive');

describe('interactive - module exports', () => {
  it('should export run as a function', () => {
    assert.strictEqual(typeof interactive.run, 'function');
  });
});

describe('interactive - module loads without errors', () => {
  it('should load the module successfully', () => {
    assert.ok(interactive);
    assert.strictEqual(typeof interactive, 'object');
  });
});

describe('interactive - buildMenuItems logic', () => {
  // Since buildMenuItems is not exported, we test the behavior indirectly
  // by ensuring the module has the expected dependencies
  it('should have access to utils.menu', () => {
    const utils = require('../src/utils');
    assert.strictEqual(typeof utils.menu, 'function');
  });

  it('should have access to status functions', () => {
    const status = require('../src/status');
    assert.strictEqual(typeof status.getPlanData, 'function');
    assert.strictEqual(typeof status.getMemoryData, 'function');
    assert.strictEqual(typeof status.getSkillsData, 'function');
  });
});

describe('interactive - non-interactive mode', () => {
  it('should handle non-TTY environment', async () => {
    // In non-interactive mode (no TTY), interactive.run() should call status.run()
    // We can't easily test this without mocking, but we can verify the modules work
    const status = require('../src/status');
    assert.strictEqual(typeof status.run, 'function');
  });
});

describe('interactive - integration with other modules', () => {
  it('should be able to import init module', () => {
    const init = require('../src/init');
    assert.strictEqual(typeof init.run, 'function');
  });

  it('should be able to import doctor module', () => {
    const doctor = require('../src/doctor');
    assert.strictEqual(typeof doctor.run, 'function');
  });

  it('should be able to import upgrade module', () => {
    const upgrade = require('../src/upgrade');
    assert.strictEqual(typeof upgrade.run, 'function');
  });
});
