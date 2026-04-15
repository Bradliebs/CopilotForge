/**
 * multiple-sessions.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates how to manage multiple independent Copilot conversations
 *   simultaneously. Each session has its own context, model, and permissions.
 *   Useful for multi-user applications or multi-task workflows.
 *
 * WHEN TO USE THIS:
 *   - Building a multi-user chat app where each user needs their own session
 *   - Running parallel tasks with different AI models (e.g., A/B testing)
 *   - Isolating conversations by context (e.g., Python help vs. TypeScript help)
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Set GITHUB_TOKEN: export GITHUB_TOKEN="{{github_token}}"
 *   3. npx ts-node multiple-sessions.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - GitHub Copilot SDK access
 *   - Valid GitHub token with Copilot access
 *
 * EXPECTED OUTPUT:
 *   [Session {{session_name_1}}] Created with model {{model_name}}
 *   [Session {{session_name_2}}] Created with model {{model_name}}
 *   [Session {{session_name_3}}] Created with model {{alternative_model}}
 *   {{language_1}}: {{sample_response_1}}
 *   {{language_2}}: {{sample_response_2}}
 *   {{language_3}}: {{sample_response_3}}
 *   [Cleanup] All 3 sessions destroyed
 */

// --- Imports ---
// All imports are included — no "install this separately" surprises.
import { randomUUID } from "node:crypto";

// --- Types ---

/** Configuration for creating a new session. */
interface SessionConfig {
  id?: string; // Optional custom ID (e.g., "user-123-chat")
  model?: string; // Model to use (e.g., "gpt-5", "claude-sonnet-4.5")
  systemPrompt?: string; // Initial instruction for the session
  metadata?: Record<string, unknown>; // Custom metadata for tracking
}

/** Represents a single Copilot session. */
interface CopilotSession {
  id: string;
  model: string;
  createdAt: Date;
  lastActivity: Date;
  metadata: Record<string, unknown>;
  messageCount: number;
}

// --- Multi-Session Manager ---

/**
 * Manages multiple independent Copilot sessions.
 * Each session has its own conversation history and can use a different model.
 *
 * Usage:
 *   const manager = new MultiSessionManager();
 *   await manager.start();
 *   const sessionId = await manager.createSession({ model: "{{model_name}}" });
 *   const response = await manager.sendMessage(sessionId, "Hello!");
 *   await manager.destroySession(sessionId);
 *   await manager.stop();
 */
class MultiSessionManager {
  private sessions: Map<string, CopilotSession> = new Map();
  private isStarted: boolean = false;

  /**
   * Initializes the Copilot SDK client.
   * Must be called before creating sessions.
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.warn("[Manager] Already started");
      return;
    }

    // TODO: Replace with actual CopilotClient initialization:
    //
    //   import { CopilotClient } from "@github/copilot-sdk";
    //   this.client = new CopilotClient();
    //   await this.client.start();

    this.isStarted = true;
    console.log("[Manager] Started");
  }

  /**
   * Creates a new session with optional custom ID and model.
   * If no ID is provided, generates a random UUID.
   *
   * Returns the session ID (useful if auto-generated).
   */
  async createSession(config: SessionConfig = {}): Promise<string> {
    if (!this.isStarted) {
      throw new SessionError("Manager not started. Call start() first.");
    }

    const sessionId = config.id ?? randomUUID();
    const model = config.model ?? "{{default_model}}";

    // Check if session ID already exists.
    if (this.sessions.has(sessionId)) {
      throw new SessionError(
        `Session ${sessionId} already exists. Use a different ID or destroy the existing session.`
      );
    }

    // TODO: Replace with actual Copilot SDK session creation:
    //
    //   const sdkSession = await this.client.createSession({
    //     sessionId: sessionId,
    //     onPermissionRequest: approveAll,
    //     model: model,
    //   });
    //
    //   if (config.systemPrompt) {
    //     await sdkSession.sendAndWait({ prompt: config.systemPrompt });
    //   }

    const session: CopilotSession = {
      id: sessionId,
      model: model,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: config.metadata ?? {},
      messageCount: 0,
    };

    this.sessions.set(sessionId, session);
    console.log(`[Session ${sessionId}] Created with model ${model}`);

    return sessionId;
  }

  /**
   * Sends a message to a specific session and waits for the response.
   *
   * Throws if the session doesn't exist.
   */
  async sendMessage(sessionId: string, prompt: string): Promise<string> {
    const session = this.getSessionOrThrow(sessionId);

    // TODO: Replace with actual SDK call:
    //
    //   const sdkSession = this.sdkSessions.get(sessionId);
    //   const response = await sdkSession.sendAndWait({ prompt });
    //   return response.content;

    // Placeholder: echo back for demonstration.
    const response = `[Echo from ${sessionId}] Received: "${prompt}"`;

    session.messageCount++;
    session.lastActivity = new Date();

    return response;
  }

  /**
   * Destroys a specific session and cleans up resources.
   * Safe to call multiple times — silently ignores missing sessions.
   */
  async destroySession(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      console.warn(`[Session ${sessionId}] Not found (may already be destroyed)`);
      return;
    }

    // TODO: Replace with actual SDK cleanup:
    //
    //   const sdkSession = this.sdkSessions.get(sessionId);
    //   await sdkSession.destroy();
    //   this.sdkSessions.delete(sessionId);

    const session = this.sessions.get(sessionId)!;
    console.log(`[Session ${sessionId}] Destroyed after ${session.messageCount} messages`);
    this.sessions.delete(sessionId);
  }

  /**
   * Lists all active sessions with their metadata.
   * Useful for debugging or building a session management UI.
   */
  listSessions(): CopilotSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Destroys all active sessions and shuts down the SDK client.
   * Should be called when your application exits.
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      console.warn("[Manager] Not started");
      return;
    }

    const sessionCount = this.sessions.size;

    // Destroy all sessions.
    for (const sessionId of Array.from(this.sessions.keys())) {
      await this.destroySession(sessionId);
    }

    // TODO: Replace with actual client shutdown:
    //
    //   await this.client.stop();

    this.isStarted = false;
    console.log(`[Manager] Stopped after cleaning up ${sessionCount} session(s)`);
  }

  // --- Private helpers ---

  private getSessionOrThrow(sessionId: string): CopilotSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionError(
        `Session ${sessionId} not found. It may have been destroyed or never created.`
      );
    }
    return session;
  }
}

// --- Error handling ---

/** Custom error class for session-related failures. */
class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionError";
  }
}

// --- Example usage ---

async function main() {
  const manager = new MultiSessionManager();

  try {
    // Initialize the manager.
    await manager.start();

    // Create three sessions for different {{project_context}}.
    // Each has its own context and can use a different model.
    const session1 = await manager.createSession({
      id: "{{session_name_1}}",
      model: "{{model_name}}",
      systemPrompt: "{{system_prompt_1}}",
      metadata: { {{metadata_key_1}}: "{{metadata_value_1}}" },
    });

    const session2 = await manager.createSession({
      id: "{{session_name_2}}",
      model: "{{model_name}}",
      systemPrompt: "{{system_prompt_2}}",
      metadata: { {{metadata_key_2}}: "{{metadata_value_2}}" },
    });

    const session3 = await manager.createSession({
      id: "{{session_name_3}}",
      model: "{{alternative_model}}",
      systemPrompt: "{{system_prompt_3}}",
      metadata: { {{metadata_key_3}}: "{{metadata_value_3}}" },
    });

    // Send messages to each session independently.
    // These run in parallel — no cross-talk between sessions.
    const [response1, response2, response3] = await Promise.all([
      manager.sendMessage(session1, "{{prompt_1}}"),
      manager.sendMessage(session2, "{{prompt_2}}"),
      manager.sendMessage(session3, "{{prompt_3}}"),
    ]);

    console.log("{{context_1}}:", response1);
    console.log("{{context_2}}:", response2);
    console.log("{{context_3}}:", response3);

    // List all active sessions.
    const activeSessions = manager.listSessions();
    console.log(`\n[Manager] ${activeSessions.length} active sessions:`);
    activeSessions.forEach((s) => {
      console.log(
        `  - ${s.id}: ${s.messageCount} messages, last active ${s.lastActivity.toLocaleTimeString()}`
      );
    });

    // Clean up: destroy all sessions.
    await manager.destroySession(session1);
    await manager.destroySession(session2);
    await manager.destroySession(session3);

    console.log("[Cleanup] All sessions destroyed");
  } catch (error) {
    if (error instanceof SessionError) {
      // Handle session-specific errors (not found, already exists).
      console.error("Session error:", error.message);
    } else {
      // Unexpected errors — log and re-throw.
      console.error("Unexpected error:", error);
      throw error;
    }
  } finally {
    // Always shut down the manager when done.
    await manager.stop();
  }
}

// Run the example.
main().catch(console.error);
