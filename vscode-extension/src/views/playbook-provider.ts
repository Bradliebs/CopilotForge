import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class PlaybookProvider implements vscode.TreeDataProvider<PlaybookItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PlaybookItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: PlaybookItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<PlaybookItem[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return Promise.resolve([]);

    const playbookPath = path.join(workspaceFolder.uri.fsPath, 'forge-memory', 'playbook.md');
    if (!fs.existsSync(playbookPath)) {
      return Promise.resolve([new PlaybookItem('No playbook entries', '', vscode.TreeItemCollapsibleState.None)]);
    }

    try {
      const content = fs.readFileSync(playbookPath, 'utf8');
      const entries = parsePlaybookEntries(content);

      if (entries.length === 0) {
        return Promise.resolve([new PlaybookItem('No entries yet', 'Use CopilotForge to accumulate strategies', vscode.TreeItemCollapsibleState.None)]);
      }

      return Promise.resolve(
        entries.map((e) => {
          const item = new PlaybookItem(
            `[${e.type}] ${e.title}`,
            e.content,
            vscode.TreeItemCollapsibleState.None,
          );
          item.description = e.score > 1 ? `score: ${e.score}` : '';
          return item;
        }),
      );
    } catch {
      return Promise.resolve([new PlaybookItem('Error reading playbook', '', vscode.TreeItemCollapsibleState.None)]);
    }
  }
}

interface PlaybookEntry {
  type: string;
  title: string;
  content: string;
  score: number;
}

function parsePlaybookEntries(content: string): PlaybookEntry[] {
  const entries: PlaybookEntry[] = [];
  const sections = content.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const headerLine = lines[0] || '';
    const headerMatch = headerLine.match(/^\[(\w+)\]\s+(.+?)(?:\s+\(score:\s*(\d+)\))?$/);
    if (!headerMatch) continue;

    entries.push({
      type: headerMatch[1],
      title: headerMatch[2],
      score: parseInt(headerMatch[3] || '1', 10),
      content: lines.slice(1).join('\n').trim(),
    });
  }

  return entries.sort((a, b) => b.score - a.score);
}

class PlaybookItem extends vscode.TreeItem {
  constructor(label: string, tooltip: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
  }
}
