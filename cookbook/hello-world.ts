/**
 * hello-world.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   The simplest possible Copilot SDK recipe. Creates a client, opens a
 *   session, sends one message, prints the response, and cleans up.
 *
 * WHEN TO USE THIS:
 *   When you're brand new to the Copilot SDK and want to see the minimal
 *   end-to-end flow — connect, talk, disconnect.
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Set your API key: export COPILOT_API_KEY="your-key-here"
 *   3. npx ts-node cookbook/hello-world.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid Copilot API key
 *
 * EXPECTED OUTPUT:
 *   [Client] Starting...
 *   [Session] Created: <session-id>
 *   [Assistant] Hello! I can help with coding, debugging, ...
 *   [Session] Destroyed.
 *   [Client] Stopped.
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

// --- Types (simulating @github/copilot-sdk) ---

interface CopilotClientConfig {
  apiKey: string;
}

interface CopilotSession {
  id: string;
  send(message: string): Promise<string>;
  destroy(): void;
}

interface CopilotClient {
  start(): void;
  createSession(): CopilotSession;
  stop(): void;
}

// --- Mock SDK (replace with real import) ---
// TODO: Replace with: import { CopilotClient } from "@github/copilot-sdk";

function createCopilotClient(config: CopilotClientConfig): CopilotClient {
  const sessionId = `sess_${Date.now()}`;
  return {
    start() {
      console.log("[Client] Starting...");
    },
    createSession(): CopilotSession {
      console.log(`[Session] Created: ${sessionId}`);
      return {
        id: sessionId,
        async send(message: string): Promise<string> {
          return `Hello! I can help with coding, debugging, and answering questions. You said: "${message}"`;
        },
        destroy() {
          console.log("[Session] Destroyed.");
        },
      };
    },
    stop() {
      console.log("[Client] Stopped.");
    },
  };
}

// --- Main ---

async function main(): Promise<void> {
  const apiKey = process.env.COPILOT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing COPILOT_API_KEY environment variable.");
  }

  const client = createCopilotClient({ apiKey });
  client.start();

  const session = client.createSession();

  try {
    const response = await session.send("Hello! What can you help me with?");
    console.log("[Assistant]", response);
  } catch (error) {
    console.error("[Error]", error instanceof Error ? error.message : error);
  } finally {
    session.destroy();
    client.stop();
  }
}

// Run the example.
main().catch(console.error);
