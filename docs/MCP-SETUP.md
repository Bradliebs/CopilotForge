---
title: MCP Server Setup
description: How to connect CopilotForge to Claude Desktop, VS Code, Cursor, and other MCP-compatible AI clients
---

# MCP Server Setup

CopilotForge includes an MCP (Model Context Protocol) server that exposes scaffolding tools to any MCP-compatible AI client. This lets Claude Desktop, VS Code Copilot, Cursor, and Zed use CopilotForge directly.

## Quick Start

```bash
npx copilotforge mcp
```

This starts the MCP server on stdio. On first run, it generates a config file at `~/.copilotforge/mcp-config.json`.

## Available Tools

| Tool | What It Does |
|------|-------------|
| `copilotforge_init` | Initialize CopilotForge in a project (full, minimal, or oracle-prime) |
| `copilotforge_doctor` | Run health check and return structured JSON results |
| `copilotforge_status` | Get project status — plan progress, skills, agents, memory |
| `copilotforge_rollback` | List or restore snapshots from previous init/upgrade |

## Claude Desktop

Add this to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copilotforge": {
      "command": "npx",
      "args": ["copilotforge", "mcp"]
    }
  }
}
```

After saving, restart Claude Desktop. CopilotForge tools appear in the tool picker (hammer icon).

### Verify It Works

In Claude Desktop, ask:

> "Run the CopilotForge health check on my project at /path/to/my/project"

Claude will call `copilotforge_doctor` and show the results.

## VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "copilotforge": {
      "type": "stdio",
      "command": "npx",
      "args": ["copilotforge", "mcp"]
    }
  }
}
```

The MCP server appears in Copilot Chat's tool list after reloading VS Code.

## Cursor

Add to your Cursor MCP settings (Settings → MCP Servers):

```json
{
  "mcpServers": {
    "copilotforge": {
      "command": "npx",
      "args": ["copilotforge", "mcp"]
    }
  }
}
```

## Zed

Add to your Zed settings (`~/.config/zed/settings.json`):

```json
{
  "language_models": {
    "mcp": {
      "servers": {
        "copilotforge": {
          "command": "npx",
          "args": ["copilotforge", "mcp"]
        }
      }
    }
  }
}
```

## Tool Parameters

### copilotforge_init

| Parameter | Type | Description |
|-----------|------|-------------|
| `cwd` | string (required) | Working directory path |
| `full` | boolean | Full setup (default) |
| `minimal` | boolean | Planner skill only |
| `oraclePrime` | boolean | Oracle Prime only |
| `dryRun` | boolean | Preview without writing |

### copilotforge_doctor

| Parameter | Type | Description |
|-----------|------|-------------|
| `cwd` | string (required) | Working directory path |

Returns structured JSON with checks array, summary, and healthy flag.

### copilotforge_status

| Parameter | Type | Description |
|-----------|------|-------------|
| `cwd` | string (required) | Working directory path |

Returns plan progress, memory stats, skills list, agents list, cookbook count.

### copilotforge_rollback

| Parameter | Type | Description |
|-----------|------|-------------|
| `cwd` | string (required) | Working directory path |
| `list` | boolean | List available snapshots |
| `latest` | boolean | Restore the most recent snapshot |
| `dryRun` | boolean | Preview without restoring |

## Protocol Details

- **Transport:** stdio (stdin/stdout)
- **Protocol:** JSON-RPC 2.0 (MCP standard)
- **Logging:** stderr only (stdout reserved for protocol)
- **Dependencies:** Zero — uses raw JSON-RPC, no `@modelcontextprotocol/sdk` required

## Troubleshooting

### "Tool not found" in Claude Desktop

1. Check that `npx copilotforge mcp` runs without errors in a terminal
2. Verify your `claude_desktop_config.json` is valid JSON
3. Restart Claude Desktop after config changes

### "Permission denied" errors

The MCP server runs commands in the `cwd` you specify. Ensure the AI client has access to that directory.

### Server crashes silently

Check stderr output — the MCP server logs all errors to stderr. Run manually to see output:

```bash
npx copilotforge mcp 2>mcp-debug.log
```
