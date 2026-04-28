import * as vscode from 'vscode';
import { TrustProvider } from './views/trust-provider';
import { PlaybookProvider } from './views/playbook-provider';
import { SkillsProvider } from './views/skills-provider';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
  // Status bar — trust level indicator
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'copilotforge.trust';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Tree view providers
  const trustProvider = new TrustProvider();
  const playbookProvider = new PlaybookProvider();
  const skillsProvider = new SkillsProvider();

  vscode.window.registerTreeDataProvider('copilotforge.trust', trustProvider);
  vscode.window.registerTreeDataProvider('copilotforge.playbook', playbookProvider);
  vscode.window.registerTreeDataProvider('copilotforge.skills', skillsProvider);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('copilotforge.init', () => {
      const terminal = vscode.window.createTerminal('CopilotForge');
      terminal.sendText('npx copilotforge init');
      terminal.show();
    }),
    vscode.commands.registerCommand('copilotforge.doctor', () => {
      const terminal = vscode.window.createTerminal('CopilotForge');
      terminal.sendText('npx copilotforge doctor');
      terminal.show();
    }),
    vscode.commands.registerCommand('copilotforge.status', () => {
      const terminal = vscode.window.createTerminal('CopilotForge');
      terminal.sendText('npx copilotforge status');
      terminal.show();
    }),
    vscode.commands.registerCommand('copilotforge.trust', () => {
      trustProvider.refresh();
      vscode.window.showInformationMessage('Trust trajectory updated');
    }),
    vscode.commands.registerCommand('copilotforge.playbook', () => {
      playbookProvider.refresh();
    }),
    vscode.commands.registerCommand('copilotforge.wizard', () => {
      const terminal = vscode.window.createTerminal('CopilotForge Wizard');
      terminal.sendText('npx copilotforge wizard');
      terminal.show();
    }),
  );

  // Watch for forge-memory changes
  const watcher = vscode.workspace.createFileSystemWatcher('**/forge-memory/**');
  watcher.onDidChange(() => {
    playbookProvider.refresh();
    trustProvider.refresh();
    updateStatusBar();
  });
  watcher.onDidCreate(() => {
    playbookProvider.refresh();
    skillsProvider.refresh();
  });
  context.subscriptions.push(watcher);
}

function updateStatusBar(): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    statusBarItem.hide();
    return;
  }

  // Read trust level from .copilotforge/trust.json if it exists
  const trustPath = vscode.Uri.joinPath(workspaceFolder.uri, '.copilotforge', 'trust.json');
  vscode.workspace.fs.readFile(trustPath).then(
    (data) => {
      try {
        const trust = JSON.parse(Buffer.from(data).toString('utf8'));
        const icons: Record<string, string> = {
          cautious: '$(shield)',
          familiar: '$(eye)',
          trusted: '$(verified)',
          autonomous: '$(rocket)',
        };
        const icon = icons[trust.level] || '$(shield)';
        statusBarItem.text = `${icon} CopilotForge: ${trust.level}`;
        statusBarItem.tooltip = `Trust score: ${trust.score || 0}\nClick to view details`;
        statusBarItem.show();
      } catch {
        statusBarItem.text = '$(shield) CopilotForge';
        statusBarItem.show();
      }
    },
    () => {
      // No trust file — show basic indicator if FORGE.md exists
      const forgePath = vscode.Uri.joinPath(workspaceFolder.uri, 'FORGE.md');
      vscode.workspace.fs.stat(forgePath).then(
        () => {
          statusBarItem.text = '$(shield) CopilotForge';
          statusBarItem.tooltip = 'CopilotForge detected — click to view trust level';
          statusBarItem.show();
        },
        () => { statusBarItem.hide(); },
      );
    },
  );
}

export function deactivate(): void {
  statusBarItem?.dispose();
}
