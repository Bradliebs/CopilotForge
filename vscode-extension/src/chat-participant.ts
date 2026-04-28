import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * CopilotForge Chat Participant — @copilotforge in VS Code Copilot Chat
 *
 * Registers as a Chat API participant so users can type @copilotforge
 * in Copilot Chat and interact with CopilotForge tools inline.
 */

const PARTICIPANT_ID = 'copilotforge.chat';

interface ChatResult extends vscode.ChatResult {
  metadata?: {
    command?: string;
  };
}

export function registerChatParticipant(context: vscode.ExtensionContext): void {
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<ChatResult> => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const cwd = workspaceFolder?.uri.fsPath || process.cwd();

    // Route slash commands
    if (request.command === 'init') {
      return handleInit(stream, cwd);
    }
    if (request.command === 'doctor') {
      return handleDoctor(stream, cwd);
    }
    if (request.command === 'detect') {
      return handleDetect(stream, cwd);
    }
    if (request.command === 'discover') {
      return handleDiscover(stream, cwd);
    }
    if (request.command === 'status') {
      return handleStatus(stream, cwd);
    }

    // Default: provide contextual help
    stream.markdown('## CopilotForge\n\n');
    stream.markdown('I can help you manage your AI-powered project scaffolding.\n\n');
    stream.markdown('**Available commands:**\n');
    stream.markdown('- `/init` — Initialize CopilotForge\n');
    stream.markdown('- `/doctor` — Health check\n');
    stream.markdown('- `/detect` — Auto-detect build path\n');
    stream.markdown('- `/discover` — Scan for playbook patterns\n');
    stream.markdown('- `/status` — Project status\n\n');
    stream.markdown('Or just describe what you need and I\'ll help!\n');

    return { metadata: { command: 'help' } };
  };

  const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handler);
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icon.svg');
  context.subscriptions.push(participant);
}

// ── Command handlers ────────────────────────────────────────────────────

function runCLI(command: string, cwd: string): string {
  try {
    return execSync(`npx copilotforge ${command}`, {
      cwd,
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
    }).trim();
  } catch (err: unknown) {
    const error = err as { stdout?: string; message?: string };
    return error.stdout || error.message || 'Command failed';
  }
}

function handleInit(stream: vscode.ChatResponseStream, cwd: string): ChatResult {
  stream.markdown('## Initializing CopilotForge\n\n');
  stream.markdown('Running `npx copilotforge init --yes` in your workspace...\n\n');
  const output = runCLI('init --yes', cwd);
  stream.markdown('```\n' + output + '\n```\n');
  return { metadata: { command: 'init' } };
}

function handleDoctor(stream: vscode.ChatResponseStream, cwd: string): ChatResult {
  stream.markdown('## Health Check\n\n');
  const output = runCLI('doctor', cwd);
  stream.markdown('```\n' + output + '\n```\n');
  return { metadata: { command: 'doctor' } };
}

function handleDetect(stream: vscode.ChatResponseStream, cwd: string): ChatResult {
  stream.markdown('## Build Path Detection\n\n');
  const output = runCLI('detect', cwd);
  stream.markdown(output + '\n');
  return { metadata: { command: 'detect' } };
}

function handleDiscover(stream: vscode.ChatResponseStream, cwd: string): ChatResult {
  stream.markdown('## Playbook Auto-Discovery\n\n');
  const output = runCLI('discover', cwd);
  stream.markdown('```\n' + output + '\n```\n');
  stream.markdown('\nRun `/discover --apply` to add entries to your playbook.\n');
  return { metadata: { command: 'discover' } };
}

function handleStatus(stream: vscode.ChatResponseStream, cwd: string): ChatResult {
  stream.markdown('## Project Status\n\n');
  const output = runCLI('status', cwd);
  stream.markdown('```\n' + output + '\n```\n');
  return { metadata: { command: 'status' } };
}
