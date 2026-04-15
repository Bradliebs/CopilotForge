/**
 * session-example.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates basic session management with the GitHub Copilot SDK.
 *   Creates a session, sends a message, handles the response, and cleans up.
 *
 * WHEN TO USE THIS:
 *   When your Copilot agent needs to maintain a conversation across multiple
 *   turns — e.g., a wizard that asks questions one at a time.
 *
 * HOW TO RUN:
 *   1. npm install @anthropic-ai/sdk   (or your preferred Copilot SDK)
 *   2. Set your API key: export COPILOT_API_KEY="your-key-here"
 *   3. npx ts-node session-example.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid Copilot API key
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

// --- Imports ---
// All imports are included — no "install this separately" surprises.
import { randomUUID } from "node:crypto";

// --- Types ---

/** Represents a single message in a session. */
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

/** Tracks the state of an active session. */
interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
  metadata: Record<string, string>;
}

/** Configuration for creating a new session. */
interface SessionConfig {
  systemPrompt?: string;
  timeoutMs?: number;
  metadata?: Record<string, string>;
}

// --- Session Manager ---

/**
 * Manages conversation sessions. Handles creation, message sending,
 * history tracking, and cleanup.
 *
 * Usage:
 *   const manager = new SessionManager();
 *   const session = manager.createSession({ systemPrompt: "You are a helpful assistant." });
 *   const response = await manager.sendMessage(session.id, "Hello!");
 *   manager.endSession(session.id);
 */
class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private defaultTimeoutMs: number = 30 * 60 * 1000; // 30 minutes

  /**
   * Creates a new session with an optional system prompt.
   * Returns the session object with a unique ID.
   */
  createSession(config: SessionConfig = {}): Session {
    const session: Session = {
      id: randomUUID(),
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: config.metadata ?? {},
    };

    // If a system prompt is provided, add it as the first message.
    if (config.systemPrompt) {
      session.messages.push({
        role: "system",
        content: config.systemPrompt,
        timestamp: new Date(),
      });
    }

    this.sessions.set(session.id, session);
    console.log(`[Session ${session.id}] Created`);
    return session;
  }

  /**
   * Sends a user message and gets a response.
   * Stores both the user message and the assistant response in session history.
   *
   * Throws if the session doesn't exist or has expired.
   */
  async sendMessage(sessionId: string, userMessage: string): Promise<string> {
    const session = this.getSessionOrThrow(sessionId);

    // Check if the session has timed out.
    const elapsed = Date.now() - session.lastActivity.getTime();
    if (elapsed > this.defaultTimeoutMs) {
      this.endSession(sessionId);
      throw new SessionError(
        `Session ${sessionId} expired after ${Math.round(elapsed / 60000)} minutes of inactivity.`
      );
    }

    // Record the user's message.
    session.messages.push({
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    // Send to the model and get a response.
    // Replace this with your actual Copilot SDK call.
    const response = await this.callModel(session.messages);

    // Record the assistant's response.
    session.messages.push({
      role: "assistant",
      content: response,
      timestamp: new Date(),
    });

    session.lastActivity = new Date();
    console.log(`[Session ${sessionId}] Turn ${Math.floor(session.messages.length / 2)} complete`);

    return response;
  }

  /**
   * Ends a session and cleans up resources.
   * Safe to call multiple times — silently ignores missing sessions.
   */
  endSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      const turnCount = session.messages.filter((m) => m.role === "user").length;
      console.log(`[Session ${sessionId}] Ended after ${turnCount} turns`);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Returns the full message history for a session.
   * Useful for debugging or logging.
   */
  getHistory(sessionId: string): Message[] {
    return this.getSessionOrThrow(sessionId).messages.slice();
  }

  /** Cleans up all sessions that have exceeded the timeout. */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > this.defaultTimeoutMs) {
        this.endSession(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cleanup] Removed ${cleaned} expired session(s)`);
    }

    return cleaned;
  }

  // --- Private helpers ---

  private getSessionOrThrow(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionError(`Session ${sessionId} not found. It may have expired or been ended.`);
    }
    return session;
  }

  /**
   * Calls the language model with the conversation history.
   * Replace this with your actual SDK integration.
   */
  private async callModel(messages: Message[]): Promise<string> {
    // TODO: Replace with actual Copilot SDK call. Example:
    //
    //   const client = new CopilotClient({ apiKey: process.env.COPILOT_API_KEY });
    //   const result = await client.chat({
    //     messages: messages.map(m => ({ role: m.role, content: m.content })),
    //     model: "gpt-4",
    //   });
    //   return result.choices[0].message.content;

    // Placeholder: echo back for demonstration.
    return `[Echo] Received: "${messages[messages.length - 1].content}"`;
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
  const manager = new SessionManager();

  // Create a session with a system prompt.
  const session = manager.createSession({
    systemPrompt: "You are a project planning assistant. Help the user define their goals.",
    metadata: { source: "copilotforge-wizard" },
  });

  try {
    // Simulate a multi-turn conversation.
    const response1 = await manager.sendMessage(session.id, "I want to build a REST API");
    console.log("Assistant:", response1);

    const response2 = await manager.sendMessage(session.id, "Using Node.js and Express");
    console.log("Assistant:", response2);

    // Check the conversation history.
    const history = manager.getHistory(session.id);
    console.log(`\nSession has ${history.length} messages.`);
  } catch (error) {
    if (error instanceof SessionError) {
      // Handle session-specific errors (expired, not found).
      console.error("Session error:", error.message);
    } else {
      // Unexpected errors — log and re-throw.
      console.error("Unexpected error:", error);
      throw error;
    }
  } finally {
    // Always clean up the session.
    manager.endSession(session.id);
  }
}

// Run the example.
main().catch(console.error);
