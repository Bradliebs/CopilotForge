'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI colors — zero dependencies
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const SEPARATOR = '\u2501'.repeat(48);

function banner() {
  console.log();
  console.log(`  ${colors.bold(colors.red('\uD83D\uDD25 CopilotForge'))}`);
  console.log();
}

function success(msg) {
  console.log(`  ${colors.green('\u2705')} ${msg}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow('\u26A0\uFE0F ')} ${msg}`);
}

function fail(msg) {
  console.log(`  ${colors.red('\u274C')} ${msg}`);
}

function info(msg) {
  console.log(`  ${msg}`);
}

function separator() {
  console.log();
  console.log(`  ${colors.dim(SEPARATOR)}`);
  console.log();
}

/**
 * Prompt the user for yes/no input. Returns true for 'y'/'yes'.
 * Non-interactive environments default to `defaultAnswer`.
 */
function ask(question, defaultAnswer = false) {
  return new Promise((resolve) => {
    // Non-interactive: use default
    if (!process.stdin.isTTY) {
      resolve(defaultAnswer);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const hint = defaultAnswer ? '(Y/n)' : '(y/N)';
    rl.question(`  ${question} ${hint} `, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (a === '') {
        resolve(defaultAnswer);
      } else {
        resolve(a === 'y' || a === 'yes');
      }
    });
  });
}

/**
 * Resolve the package's `files/` directory, where bundled assets live.
 */
function filesDir() {
  return path.join(__dirname, '..', 'files');
}

/**
 * Copy a file from the package's files/ directory to a target path,
 * creating parent directories as needed.
 */
function copyFile(relativeSrc, destPath) {
  const src = path.join(filesDir(), relativeSrc);
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, destPath);
}

/**
 * Write content to a file, creating parent directories as needed.
 */
function writeFile(destPath, content) {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
}

/**
 * Check if git is available and we're inside a repo.
 */
function hasGit() {
  try {
    const { execSync } = require('child_process');
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Stage and commit files with git.
 */
function gitCommit(files, message) {
  const { execSync } = require('child_process');
  const opts = { stdio: 'pipe', cwd: process.cwd() };
  for (const f of files) {
    execSync(`git add "${f}"`, opts);
  }
  execSync(`git commit -m "${message}"`, opts);
}

/**
 * Check if a path exists.
 */
function exists(p) {
  return fs.existsSync(p);
}

/**
 * Remove a file if it exists. Returns true if removed.
 */
function removeFile(p) {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    return true;
  }
  return false;
}

/**
 * Remove a directory if it's empty. Walks up cleaning empty parents
 * until it hits the project root (cwd).
 */
function removeEmptyDirs(dirPath) {
  const cwd = process.cwd();
  let current = path.resolve(dirPath);

  while (current !== cwd && current !== path.dirname(current)) {
    try {
      const entries = fs.readdirSync(current);
      if (entries.length === 0) {
        fs.rmdirSync(current);
        current = path.dirname(current);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

module.exports = {
  colors,
  banner,
  success,
  warn,
  fail,
  info,
  separator,
  ask,
  filesDir,
  copyFile,
  writeFile,
  hasGit,
  gitCommit,
  exists,
  removeFile,
  removeEmptyDirs,
};
