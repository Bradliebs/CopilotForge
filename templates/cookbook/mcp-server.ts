/**
 * mcp-server.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Sets up a Model Context Protocol (MCP) server in TypeScript using the
 *   official SDK. Registers example tools with Zod input validation,
 *   structured error responses, and proper server lifecycle management.
 *
 * WHEN TO USE THIS:
 *   When you want to expose local tools to an AI assistant via MCP — e.g.,
 *   letting Copilot search your codebase, query a database, or check the
 *   health of a service.
 *
 * HOW TO RUN:
 *   1. npm install @modelcontextprotocol/sdk zod
 *   2. npx ts-node cookbook/mcp-server.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - @modelcontextprotocol/sdk ^1.0.0
 *   - zod ^3.22.0
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// --- Tool Error Helper ---

function toolError(message: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

function toolResult(text: string): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text" as const, text }],
  };
}

// --- Server Setup ---

const server = new McpServer({
  name: "{{project_name}}-tools",
  version: "1.0.0",
});

// --- Tool 1: File Search ---

server.tool(
  "file_search",
  "Search for files in a directory by name pattern. Returns matching file paths and sizes.",
  {
    directory: z.string().describe("Absolute or relative path to the directory to search"),
    pattern: z.string().describe("Substring to match against file names (case-insensitive)"),
    maxResults: z.number().int().min(1).max(100).default(20).describe("Maximum results to return"),
  },
  async ({ directory, pattern, maxResults }) => {
    const resolvedDir = resolve(directory);

    try {
      const dirStat = await stat(resolvedDir);
      if (!dirStat.isDirectory()) {
        return toolError(`'${directory}' is not a directory`);
      }
    } catch {
      return toolError(`Directory '${directory}' does not exist or is not accessible`);
    }

    const entries = await readdir(resolvedDir, { withFileTypes: true });
    const lowerPattern = pattern.toLowerCase();

    const matches: Array<{ name: string; path: string; sizeBytes: number }> = [];

    for (const entry of entries) {
      if (matches.length >= maxResults) break;
      if (!entry.isFile()) continue;
      if (!entry.name.toLowerCase().includes(lowerPattern)) continue;

      const fullPath = join(resolvedDir, entry.name);
      try {
        const fileStat = await stat(fullPath);
        matches.push({ name: entry.name, path: fullPath, sizeBytes: fileStat.size });
      } catch {
        // Skip files we cannot stat.
      }
    }

    if (matches.length === 0) {
      return toolResult(`No files matching '${pattern}' found in ${directory}`);
    }

    const lines = matches.map(
      (m) => `${m.name} (${formatBytes(m.sizeBytes)}) — ${m.path}`
    );
    return toolResult(`Found ${matches.length} file(s):\n${lines.join("\n")}`);
  }
);

// --- Tool 2: Data Lookup ---

server.tool(
  "data_lookup",
  "Look up a record by key from the {{project_name}} data store.",
  {
    collection: z.enum([{{data_collections}}]).describe("Which data collection to query"),
    key: z.string().min(1).describe("The record key / ID to look up"),
  },
  async ({ collection, key }) => {
    // TODO: Replace with actual database or API call for {{project_name}}.
    // Connect to {{db_connection_string}} to query real data.
    const store: Record<string, Record<string, Record<string, unknown>>> = {
      // TODO: Populate with your actual collections.
    };

    const collectionData = store[collection];
    if (!collectionData) {
      return toolError(`Collection '${collection}' not found`);
    }

    const record = collectionData[key];
    if (!record) {
      return toolError(`No record with key '${key}' in '${collection}'`);
    }

    return toolResult(JSON.stringify(record, null, 2));
  }
);

// --- Tool 3: Status Check ---

server.tool(
  "status_check",
  "Check the health status of {{project_name}} services.",
  {
    services: z
      .array(z.string().min(1))
      .min(1)
      .max(10)
      .describe("List of service names to check"),
  },
  async ({ services }) => {
    const results: Array<{ service: string; status: string; latencyMs: number }> = [];

    for (const service of services) {
      const startMs = Date.now();
      try {
        // TODO: Replace with actual health checks for {{project_name}} services.
        // Example: ping {{api_base_url}}/health
        const healthy = await checkServiceHealth(service);
        const latencyMs = Date.now() - startMs;
        results.push({
          service,
          status: healthy ? "healthy" : "degraded",
          latencyMs,
        });
      } catch {
        const latencyMs = Date.now() - startMs;
        results.push({ service, status: "unreachable", latencyMs });
      }
    }

    const lines = results.map(
      (r) => `${r.status === "healthy" ? "✅" : "❌"} ${r.service}: ${r.status} (${r.latencyMs}ms)`
    );
    return toolResult(lines.join("\n"));
  }
);

// --- Helpers ---

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function checkServiceHealth(service: string): Promise<boolean> {
  // TODO: Replace with real health checks for {{project_name}}.
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
  return Math.random() > 0.1;
}

// --- Server Startup ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] {{project_name}}-tools server running on stdio");
}

main().catch((error) => {
  console.error("[MCP] Fatal error starting server:", error);
  process.exit(1);
});
