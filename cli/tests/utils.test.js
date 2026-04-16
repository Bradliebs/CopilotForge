'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const utils = require('../src/utils');

describe('utils - colors', () => {
  it('should have all color functions', () => {
    assert.ok(utils.colors.cyan, 'cyan should exist');
    assert.ok(utils.colors.red, 'red should exist');
    assert.ok(utils.colors.green, 'green should exist');
    assert.ok(utils.colors.yellow, 'yellow should exist');
    assert.ok(utils.colors.bold, 'bold should exist');
    assert.ok(utils.colors.dim, 'dim should exist');
  });

  it('should return strings from color functions', () => {
    assert.strictEqual(typeof utils.colors.cyan('test'), 'string');
    assert.strictEqual(typeof utils.colors.red('test'), 'string');
    assert.strictEqual(typeof utils.colors.green('test'), 'string');
    assert.strictEqual(typeof utils.colors.yellow('test'), 'string');
    assert.strictEqual(typeof utils.colors.bold('test'), 'string');
    assert.strictEqual(typeof utils.colors.dim('test'), 'string');
  });

  it('should include the input text', () => {
    const input = 'hello';
    assert.ok(utils.colors.cyan(input).includes(input));
    assert.ok(utils.colors.red(input).includes(input));
    assert.ok(utils.colors.green(input).includes(input));
  });
});

describe('utils - exists', () => {
  it('should return true for existing files', () => {
    // Test with this test file itself
    const thisFile = __filename;
    assert.strictEqual(utils.exists(thisFile), true);
  });

  it('should return false for non-existent paths', () => {
    const fakePath = path.join(__dirname, 'this-file-does-not-exist-12345.xyz');
    assert.strictEqual(utils.exists(fakePath), false);
  });

  it('should work with directories', () => {
    assert.strictEqual(utils.exists(__dirname), true);
  });
});

describe('utils - menu', () => {
  it('should be exported as a function', () => {
    assert.strictEqual(typeof utils.menu, 'function');
  });

  it('should filter items by show property', async () => {
    // In non-interactive mode (no TTY), menu returns first visible item
    const originalIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = false;

    const items = [
      { label: 'Hidden', value: 'hidden', show: false },
      { label: 'Visible', value: 'visible', show: true },
      { label: 'Default Visible', value: 'default' },
    ];

    const result = await utils.menu(items);
    
    // Should return first visible item (skipping show:false)
    assert.strictEqual(result, 'visible');

    process.stdin.isTTY = originalIsTTY;
  });
});

describe('utils - filesDir', () => {
  it('should return a path to the files directory', () => {
    const dir = utils.filesDir();
    assert.strictEqual(typeof dir, 'string');
    assert.ok(dir.includes('files'));
  });
});

describe('utils - writeFile', () => {
  it('should create a file with content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const testFile = path.join(tmpDir, 'subdir', 'test.txt');
    const content = 'test content';

    utils.writeFile(testFile, content);

    assert.ok(fs.existsSync(testFile));
    assert.strictEqual(fs.readFileSync(testFile, 'utf8'), content);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('utils - hasGit', () => {
  it('should return a boolean', () => {
    const result = utils.hasGit();
    assert.strictEqual(typeof result, 'boolean');
  });
});

describe('utils - removeFile', () => {
  it('should remove an existing file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilotforge-test-'));
    const testFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(testFile, 'content');

    const removed = utils.removeFile(testFile);
    assert.strictEqual(removed, true);
    assert.strictEqual(fs.existsSync(testFile), false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return false for non-existent file', () => {
    const fakePath = path.join(__dirname, 'nonexistent-12345.txt');
    const removed = utils.removeFile(fakePath);
    assert.strictEqual(removed, false);
  });
});
