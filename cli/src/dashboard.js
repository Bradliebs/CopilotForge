'use strict';

const { spawn, execSync } = require('child_process');
const https = require('https');
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

// Check for already-extracted portable version
function findExtracted() {
  const installDir = path.join(os.homedir(), '.copilotforge', 'command-center');
  
  if (process.platform === 'win32') {
    const candidates = [
      path.join(installDir, 'win-unpacked', 'CopilotForge Command Center.exe'),
      path.join(installDir, 'CopilotForge Command Center.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  if (process.platform === 'darwin') {
    const candidates = [
      path.join(installDir, 'mac', 'CopilotForge Command Center.app/Contents/MacOS/CopilotForge Command Center'),
      path.join(installDir, 'CopilotForge Command Center.app/Contents/MacOS/CopilotForge Command Center'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  if (process.platform === 'linux') {
    const candidates = [
      path.join(installDir, 'linux-unpacked', 'copilotforge-command-center'),
      path.join(installDir, 'copilotforge-command-center'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

// Helper to launch the app
function launchApp(exePath, projectPath) {
  const child = spawn(exePath, ['--forge-project', projectPath], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

/**
 * Try to open the Command Center pointed at the given project path.
 * Returns true if the app was found and launched, false if not installed.
 */
function tryOpen(projectPath) {
  const exePath = findCommandCenter() || findExtracted();
  if (!exePath) return false;
  launchApp(exePath, projectPath);
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

// Download from URL using https module
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'copilotforge-cli' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Download and launch the Command Center
async function downloadAndLaunch(projectPath) {
  console.log();
  info('📊 Downloading CopilotForge Command Center...');
  
  // Get latest release info
  const releaseData = await httpsGet('https://api.github.com/repos/Bradliebs/copilotforge-command-center/releases/latest');
  const release = JSON.parse(releaseData.toString());
  
  // Find the right asset for this platform
  let assetName;
  if (process.platform === 'win32') {
    assetName = release.assets.find(a => a.name.includes('win') && a.name.includes('portable') && a.name.endsWith('.zip'));
  } else if (process.platform === 'darwin') {
    assetName = release.assets.find(a => a.name.includes('mac') && a.name.endsWith('.zip'));
  } else if (process.platform === 'linux') {
    assetName = release.assets.find(a => a.name.includes('linux') && a.name.endsWith('.zip'));
  }
  
  if (!assetName) {
    throw new Error('No suitable release found for your platform');
  }
  
  info(`  ⬇  Downloading from GitHub releases (~140 MB)...`);
  const zipData = await httpsGet(assetName.browser_download_url);
  
  // Save to temp file
  const installDir = path.join(os.homedir(), '.copilotforge', 'command-center');
  const tempZip = path.join(installDir, 'download.zip');
  
  // Create directory
  fs.mkdirSync(installDir, { recursive: true });
  fs.writeFileSync(tempZip, zipData);
  
  info('  📦 Extracting...');
  
  // Extract using platform-native tools
  try {
    if (process.platform === 'win32') {
      execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${installDir}' -Force"`, { stdio: 'ignore' });
    } else {
      execSync(`unzip -o "${tempZip}" -d "${installDir}"`, { stdio: 'ignore' });
    }
  } catch (err) {
    fs.unlinkSync(tempZip);
    throw new Error('Failed to extract zip file');
  }
  
  // Clean up temp file
  fs.unlinkSync(tempZip);
  
  info('  ✅ Done! Launching dashboard...');
  console.log();
  
  // Find and launch the extracted app
  const exePath = findExtracted();
  if (!exePath) {
    throw new Error('Extraction succeeded but could not find executable');
  }
  
  launchApp(exePath, projectPath);
  
  info(colors.dim('  If nothing opens, check your taskbar or system tray.'));
  info(colors.dim(`  To reopen later: ${colors.cyan('npx copilotforge dashboard')}`));
}

async function run() {
  const cwd = process.cwd();
  
  // 1. Try installed app
  const installed = findCommandCenter();
  if (installed) {
    launchApp(installed, cwd);
    info('✓ CopilotForge Command Center is opening...');
    console.log();
    info(colors.dim('  If nothing opens, check your taskbar or system tray.'));
    info(colors.dim(`  To reopen later: ${colors.cyan('npx copilotforge dashboard')}`));
    return;
  }
  
  // 2. Try already-extracted portable version
  const extracted = findExtracted();
  if (extracted) {
    launchApp(extracted, cwd);
    info('✓ CopilotForge Command Center is opening...');
    console.log();
    info(colors.dim('  If nothing opens, check your taskbar or system tray.'));
    info(colors.dim(`  To reopen later: ${colors.cyan('npx copilotforge dashboard')}`));
    return;
  }
  
  // 3. Auto-download and launch
  try {
    await downloadAndLaunch(cwd);
  } catch (err) {
    info('');
    info('❌ Could not auto-download the dashboard. Please download manually:');
    info(`   ${colors.cyan('https://github.com/Bradliebs/copilotforge-command-center/releases')}`);
    info('');
    info('   After downloading: extract the zip, then run npx copilotforge dashboard again.');
    info('');
  }
}

module.exports = { run, tryOpen, printInstallInstructions };
