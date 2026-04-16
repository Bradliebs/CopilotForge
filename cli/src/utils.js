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
      console.log(`  ${colors.dim(`[non-interactive] ${question} → ${defaultAnswer ? 'yes' : 'no'}`)}`);
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
 * Numbered menu prompt. Takes an array of { label, value, show? } items.
 * Returns the `value` of the selected item.
 */
async function menu(items) {
  const visible = items.filter((item) => item.show !== false);

  // Non-interactive: return first visible item
  if (!process.stdin.isTTY) {
    console.log(`  ${colors.dim(`[non-interactive] Auto-selecting: ${visible[0].label}`)}`);
    return visible[0].value;
  }

  console.log();
  for (let i = 0; i < visible.length; i++) {
    console.log(`  ${colors.cyan(`[${i + 1}]`)} ${colors.bold(visible[i].label)}`);
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = () => {
      rl.question('> ', (answer) => {
        const num = Number(answer.trim());
        if (Number.isInteger(num) && num >= 1 && num <= visible.length) {
          rl.close();
          resolve(visible[num - 1].value);
        } else {
          console.log(`  Pick a number 1-${visible.length}`);
          prompt();
        }
      });
    };

    prompt();
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
  if (!fs.existsSync(src)) {
    throw new Error(`Source file not found: ${relativeSrc}\n  This might mean CopilotForge was not installed correctly.\n  Try: npm install -g copilotforge`);
  }
  try {
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, destPath);
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      throw new Error(`Permission denied writing to: ${destPath}\n  Check folder permissions or try running with elevated access.`);
    }
    throw new Error(`Could not create file: ${destPath}\n  ${err.message}`);
  }
}

/**
 * Write content to a file, creating parent directories as needed.
 */
function writeFile(destPath, content) {
  try {
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(destPath, content, 'utf8');
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      throw new Error(`Permission denied writing to: ${destPath}\n  Check folder permissions or try running with elevated access.`);
    }
    throw new Error(`Could not write file: ${destPath}\n  ${err.message}`);
  }
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
  const fs = require('fs');
  const pathMod = require('path');
  const opts = { stdio: 'pipe', cwd: process.cwd() };

  // Stage all files
  for (const f of files) {
    try {
      execSync(`git add "${f}"`, opts);
    } catch (err) {
      warn(`Could not stage ${f}: ${err.message}`);
    }
  }

  // Check if anything is staged
  try {
    const status = execSync('git diff --cached --name-only', opts).toString().trim();
    if (!status) {
      throw new Error('No files were staged — nothing to commit');
    }
  } catch (e) {
    if (e.message.includes('No files')) throw e;
    // Only recover from git diff itself failing (not other errors)
    console.warn(`  ${colors.yellow('⚠️')} Could not check staged files — proceeding with commit`);
  }

  // Use a temp file for the commit message to avoid shell escaping issues
  const tmpFile = pathMod.join(process.cwd(), '.git', 'COPILOTFORGE_COMMIT_MSG');
  try {
    fs.writeFileSync(tmpFile, message, 'utf8');
    execSync(`git commit --file="${tmpFile}"`, opts);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* cleanup best-effort */ }
  }
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
  menu,
  filesDir,
  copyFile,
  writeFile,
  hasGit,
  gitCommit,
  exists,
  removeFile,
  removeEmptyDirs,
};
