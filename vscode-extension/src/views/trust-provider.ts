import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TrustProvider implements vscode.TreeDataProvider<TrustItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TrustItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TrustItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<TrustItem[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return Promise.resolve([]);

    const trustPath = path.join(workspaceFolder.uri.fsPath, '.copilotforge', 'trust.json');
    if (!fs.existsSync(trustPath)) {
      return Promise.resolve([new TrustItem('No trust data', 'Run copilotforge to build trust', vscode.TreeItemCollapsibleState.None)]);
    }

    try {
      const trust = JSON.parse(fs.readFileSync(trustPath, 'utf8'));
      const items: TrustItem[] = [
        new TrustItem(`Level: ${trust.level || 'cautious'}`, '', vscode.TreeItemCollapsibleState.None),
        new TrustItem(`Score: ${trust.score || 0}`, '', vscode.TreeItemCollapsibleState.None),
      ];

      if (trust.signals) {
        for (const [key, val] of Object.entries(trust.signals)) {
          items.push(new TrustItem(`${key}: ${val}`, '', vscode.TreeItemCollapsibleState.None));
        }
      }

      return Promise.resolve(items);
    } catch {
      return Promise.resolve([new TrustItem('Error reading trust data', '', vscode.TreeItemCollapsibleState.None)]);
    }
  }
}

class TrustItem extends vscode.TreeItem {
  constructor(label: string, tooltip: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
  }
}
