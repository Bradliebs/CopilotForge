/**
 * persisting-sessions.ts — CopilotForge Cookbook Recipe
 *
 * Adapted from: https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk/nodejs/persisting-sessions.md
 *
 * WHAT THIS DOES:
 *   Shows how to persist Copilot sessions across restarts using custom IDs.
 *   Create, resume, list, delete sessions and retrieve conversation history.
 *
 * WHEN TO USE THIS:
 *   When you need conversations that survive process restarts — chatbots with
 *   memory, long-running workflows, or multi-step user interactions.
 *
 * HOW TO RUN:
 *   1. npm install {{SDK_PACKAGE}}
 *   2. Set your API key:
 *        bash/zsh:     export {{API_KEY_VAR}}="your-key-here"
 *        PowerShell:   $env:{{API_KEY_VAR}}="your-key-here"
 *        Windows cmd:  set {{API_KEY_VAR}}=your-key-here
 *   3. npx ts-node cookbook/persisting-sessions.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid {{API_KEY_VAR}}
 *
 * EXPECTED OUTPUT:
 *   [Client] Starting...
 *   [Session] Created: {{user-id}}-conversation
 *   [Assistant] I'll help you build a REST API. Let's start with...
 *   [Session] Resumed: {{user-id}}-conversation (2 messages in history)
 *   [Assistant] Continuing where we left off — you wanted a REST API...
 *   [Sessions] 1 active session(s):
 *     - {{user-id}}-conversation (2 messages)
 *   [History] 2 message(s) in {{user-id}}-conversation
 *   [Session] Deleted: {{user-id}}-conversation
 *   [Client] Stopped.
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join()
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

// --- Types (simulating {{SDK_PACKAGE}}) ---

interface CopilotClientConfig {
  apiKey: string;
}

interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CopilotSession {
  id: string;
  send(message: string): Promise<string>;
  getMessages(): SessionMessage[];
  destroy(): void;
}

interface CreateSessionOptions {
  sessionId: string;
}

interface CopilotClient {
  start(): void;
  createSession(options: CreateSessionOptions): CopilotSession;
  resumeSession(sessionId: string): CopilotSession | null;
  listSessions(): Array<{ id: string; messageCount: number }>;
  deleteSession(sessionId: string): boolean;
  stop(): void;
}

// --- Mock SDK (replace with real import) ---
// TODO: Replace with: import { CopilotClient } from "{{SDK_PACKAGE}}";

function createCopilotClient(config: CopilotClientConfig): CopilotClient {
  const store = new Map<string, SessionMessage[]>();

  function makeSession(sessionId: string, history: SessionMessage[]): CopilotSession {
    return {
      id: sessionId,
      async send(message: string): Promise<string> {
        history.push({ role: "user", content: message, timestamp: new Date() });
        const reply = `[Echo] You said: "${message}" (session: ${sessionId})`;
        history.push({ role: "assistant", content: reply, timestamp: new Date() });
        return reply;
      },
      getMessages(): SessionMessage[] {
        return [...history];
      },
      destroy() {
        console.log(`[Session] Closed: ${sessionId}`);
      },
    };
  }

  return {
    start() {
      console.log("[Client] Starting...");
    },

    createSession(options: CreateSessionOptions): CopilotSession {
      const { sessionId } = options;
      if (store.has(sessionId)) {
        throw new Error(`Session "${sessionId}" already exists. Resume it instead.`);
      }
      const history: SessionMessage[] = [];
      store.set(sessionId, history);
      console.log(`[Session] Created: ${sessionId}`);
      return makeSession(sessionId, history);
    },

    resumeSession(sessionId: string): CopilotSession | null {
      const history = store.get(sessionId);
      if (!history) {
        return null;
      }
      console.log(`[Session] Resumed: ${sessionId} (${history.length} messages in history)`);
      return makeSession(sessionId, history);
    },

    listSessions(): Array<{ id: string; messageCount: number }> {
      return Array.from(store.entries()).map(([id, msgs]) => ({
        id,
        messageCount: msgs.length,
      }));
    },

    deleteSession(sessionId: string): boolean {
      const existed = store.delete(sessionId);
      if (existed) {
        console.log(`[Session] Deleted: ${sessionId}`);
      }
      return existed;
    },

    stop() {
      console.log("[Client] Stopped.");
    },
  };
}

// --- Best practice: meaningful session IDs ---

function buildSessionId(userId: string, context: string): string {
  // TODO: {{session-id-strategy}} — customize the ID format for your app
  return `${userId}-${context}`;
}

// --- Main ---

async function main(): Promise<void> {
  const apiKey = process.env.{{API_KEY_VAR}};
  if (!apiKey) {
    throw new Error("Missing {{API_KEY_VAR}} environment variable.");
  }

  const client = createCopilotClient({ apiKey });
  client.start();

  try {
    // 1. Create a session with a meaningful custom ID.
    const sessionId = buildSessionId("{{user-id}}", "conversation");
    const session = client.createSession({ sessionId });

    const response1 = await session.send("{{initial-prompt}}");
    console.log("[Assistant]", response1);
    session.destroy();

    // 2. Resume the session later (e.g., after a restart).
    const resumed = client.resumeSession(sessionId);
    if (!resumed) {
      throw new Error(`Session "${sessionId}" not found — cannot resume.`);
    }

    const response2 = await resumed.send("{{followup-prompt}}");
    console.log("[Assistant]", response2);
    resumed.destroy();

    // 3. List all available sessions.
    const sessions = client.listSessions();
    console.log(`[Sessions] ${sessions.length} active session(s):`);
    for (const s of sessions) {
      console.log(`  - ${s.id} (${s.messageCount} messages)`);
    }

    // 4. Get conversation history.
    const history = client.resumeSession(sessionId);
    if (history) {
      const messages = history.getMessages();
      console.log(`[History] ${messages.length} message(s) in ${sessionId}`);
      history.destroy();
    }

    // 5. Clean up: delete the session permanently.
    // TODO: {{cleanup-strategy}} — decide when to purge old sessions
    client.deleteSession(sessionId);
  } catch (error) {
    console.error("[Error]", error instanceof Error ? error.message : error);
  } finally {
    client.stop();
  }
}

// Run the example.
main().catch(console.error);
