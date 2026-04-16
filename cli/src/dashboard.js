'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { colors, info } = require('./utils');

// Where electron-builder installs on each platform by default
function findCommandCenter() {
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const candidates = [
      path.join(local, 'Programs', 'CopilotForge Command Center', 'CopilotForge Command Center.exe'),
      path.join(local, 'Programs', 'copilotforge-command-center', 'CopilotForge Command Center.exe'),
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'CopilotForge Command Center', 'CopilotForge Command Center.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  if (process.platform === 'darwin') {
    const candidates = [
      '/Applications/CopilotForge Command Center.app/Contents/MacOS/CopilotForge Command Center',
      path.join(os.homedir(), 'Applications', 'CopilotForge Command Center.app/Contents/MacOS/CopilotForge Command Center'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  if (process.platform === 'linux') {
    const candidates = [
      path.join(os.homedir(), 'Applications', 'copilotforge-command-center.AppImage'),
      '/opt/CopilotForge Command Center/copilotforge-command-center',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

/**
 * Try to open the Command Center pointed at the given project path.
 * Returns true if the app was found and launched, false if not installed.
 */
function tryOpen(projectPath) {
  const exePath = findCommandCenter();
  if (!exePath) return false;

  const child = spawn(exePath, ['--forge-project', projectPath], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return true;
}

function printInstallInstructions() {
  console.log();
  info('📊 CopilotForge Command Center is not installed on this machine.');
  console.log();
  info('  The dashboard shows your plan, Ralph status, and commits — live, as they happen.');
  console.log();
  info(`  ${colors.bold('Download (free):')} ${colors.cyan('https://github.com/Bradliebs/copilotforge-command-center/releases')}`);
  console.log();
  info(`  Once installed, reopen it anytime:`);
  info(`  ${colors.cyan('npx copilotforge dashboard')}`);
  console.log();
}

async function run() {
  const cwd = process.cwd();
  const opened = tryOpen(cwd);
  if (opened) {
    info('✓ CopilotForge Command Center is opening...');
    console.log();
    info(colors.dim('  If nothing opens, check your taskbar or system tray.'));
    info(colors.dim(`  To reopen later: ${colors.cyan('npx copilotforge dashboard')}`));
  } else {
    printInstallInstructions();
  }
}

module.exports = { run, tryOpen, printInstallInstructions };
