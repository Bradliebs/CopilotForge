import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SkillsProvider implements vscode.TreeDataProvider<SkillItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SkillItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<SkillItem[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return Promise.resolve([]);

    const items: SkillItem[] = [];

    // Scan for skills
    const skillsDir = path.join(workspaceFolder.uri.fsPath, '.github', 'skills');
    if (fs.existsSync(skillsDir)) {
      try {
        const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory());

        for (const folder of skillFolders) {
          const skillMd = path.join(skillsDir, folder.name, 'SKILL.md');
          const hasSkill = fs.existsSync(skillMd);
          const item = new SkillItem(
            folder.name,
            hasSkill ? 'Skill file present' : 'Missing SKILL.md',
            vscode.TreeItemCollapsibleState.None,
          );
          item.iconPath = new vscode.ThemeIcon(hasSkill ? 'symbol-method' : 'warning');
          item.contextValue = 'skill';
          if (hasSkill) {
            item.command = {
              command: 'vscode.open',
              title: 'Open SKILL.md',
              arguments: [vscode.Uri.file(skillMd)],
            };
          }
          items.push(item);
        }
      } catch { /* ignore */ }
    }

    // Scan for agents
    const agentDirs = [
      path.join(workspaceFolder.uri.fsPath, '.copilot', 'agents'),
      path.join(workspaceFolder.uri.fsPath, '.github', 'agents'),
    ];

    for (const agentDir of agentDirs) {
      if (fs.existsSync(agentDir)) {
        try {
          const agentFiles = fs.readdirSync(agentDir)
            .filter((f) => f.endsWith('.md'));

          for (const file of agentFiles) {
            const item = new SkillItem(
              file.replace('.md', ''),
              'Agent definition',
              vscode.TreeItemCollapsibleState.None,
            );
            item.iconPath = new vscode.ThemeIcon('robot');
            item.contextValue = 'agent';
            item.command = {
              command: 'vscode.open',
              title: 'Open Agent',
              arguments: [vscode.Uri.file(path.join(agentDir, file))],
            };
            items.push(item);
          }
        } catch { /* ignore */ }
      }
    }

    if (items.length === 0) {
      return Promise.resolve([new SkillItem('No skills or agents found', 'Run copilotforge init to set up', vscode.TreeItemCollapsibleState.None)]);
    }

    return Promise.resolve(items);
  }
}

class SkillItem extends vscode.TreeItem {
  constructor(label: string, tooltip: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
  }
}
