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
 *   1. npm install {{SDK_PACKAGE}}
 *   2. Set your API key: export {{API_KEY_VAR}}="your-key-here"
 *   3. npx ts-node cookbook/hello-world.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid {{API_KEY_VAR}}
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

// --- Types (simulating {{SDK_PACKAGE}}) ---

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
// TODO: Replace with: import { CopilotClient } from "{{SDK_PACKAGE}}";

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
  const apiKey = process.env.{{API_KEY_VAR}};
  if (!apiKey) {
    throw new Error("Missing {{API_KEY_VAR}} environment variable.");
  }

  const client = createCopilotClient({ apiKey });
  client.start();

  const session = client.createSession();

  try {
    const response = await session.send("{{GREETING_MESSAGE}}");
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
