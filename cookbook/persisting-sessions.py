"""
persisting-sessions.py — CopilotForge Cookbook Recipe

Adapted from: https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk/nodejs/persisting-sessions.md

WHAT THIS DOES:
    Shows how to persist Copilot sessions across restarts using custom IDs.
    Create, resume, list, delete sessions and retrieve conversation history.

WHEN TO USE THIS:
    When you need conversations that survive process restarts — chatbots with
    memory, long-running workflows, or multi-step user interactions.

HOW TO RUN:
    1. pip install copilot-sdk
    2. Set your API key:
         bash/zsh:     export COPILOT_API_KEY="your-key-here"
         PowerShell:   $env:COPILOT_API_KEY="your-key-here"
         Windows cmd:  set COPILOT_API_KEY=your-key-here
    3. python cookbook/persisting-sessions.py

PREREQUISITES:
    - Python 3.10+
    - A valid Copilot API key

EXPECTED OUTPUT:
    [Client] Starting...
    [Session] Created: user-123-conversation
    [Assistant] [Echo] You said: "Help me build a REST API in Python." ...
    [Session] Resumed: user-123-conversation (2 messages in history)
    [Assistant] [Echo] You said: "What was I working on?" ...
    [Sessions] 1 active session(s):
      - user-123-conversation (4 messages)
    [History] 4 message(s) in user-123-conversation
    [Session] Deleted: user-123-conversation
    [Client] Stopped.

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join()
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


# --- Types ---


@dataclass
class SessionMessage:
    """A single message in a conversation."""

    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


# --- Mock SDK (replace with real import) ---
# TODO: Replace with: from copilot_sdk import CopilotClient


class CopilotSession:
    """Represents an active Copilot session with message history."""

    def __init__(self, session_id: str, history: list[SessionMessage]) -> None:
        self.id = session_id
        self._history = history

    def send(self, message: str) -> str:
        """Send a message and get a response."""
        self._history.append(SessionMessage(role="user", content=message))
        reply = f'[Echo] You said: "{message}" (session: {self.id})'
        self._history.append(SessionMessage(role="assistant", content=reply))
        return reply

    def get_messages(self) -> list[SessionMessage]:
        """Return a copy of all messages in this session."""
        return list(self._history)

    def destroy(self) -> None:
        """Close the session (does not delete persisted data)."""
        print(f"[Session] Closed: {self.id}")


class CopilotClient:
    """Copilot client with session persistence support."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._store: dict[str, list[SessionMessage]] = {}

    def start(self) -> None:
        print("[Client] Starting...")

    def create_session(self, session_id: str) -> CopilotSession:
        """Create a new session with a custom ID."""
        if session_id in self._store:
            raise RuntimeError(f'Session "{session_id}" already exists. Resume it instead.')
        history: list[SessionMessage] = []
        self._store[session_id] = history
        print(f"[Session] Created: {session_id}")
        return CopilotSession(session_id, history)

    def resume_session(self, session_id: str) -> Optional[CopilotSession]:
        """Resume an existing session by ID. Returns None if not found."""
        history = self._store.get(session_id)
        if history is None:
            return None
        print(f"[Session] Resumed: {session_id} ({len(history)} messages in history)")
        return CopilotSession(session_id, history)

    def list_sessions(self) -> list[dict[str, object]]:
        """List all persisted sessions with their message counts."""
        return [
            {"id": sid, "message_count": len(msgs)}
            for sid, msgs in self._store.items()
        ]

    def delete_session(self, session_id: str) -> bool:
        """Delete a session permanently. Returns True if it existed."""
        if session_id in self._store:
            del self._store[session_id]
            print(f"[Session] Deleted: {session_id}")
            return True
        return False

    def stop(self) -> None:
        print("[Client] Stopped.")


# --- Best practice: meaningful session IDs ---


def build_session_id(user_id: str, context: str) -> str:
    """Create a human-readable, deterministic session ID."""
    return f"{user_id}-{context}"


# --- Main ---


def main() -> None:
    api_key = os.environ.get("COPILOT_API_KEY")
    if not api_key:
        raise RuntimeError("Missing COPILOT_API_KEY environment variable.")

    client = CopilotClient(api_key=api_key)
    client.start()

    try:
        # 1. Create a session with a meaningful custom ID.
        session_id = build_session_id("user-123", "conversation")
        session = client.create_session(session_id)

        response1 = session.send("Help me build a REST API in Python.")
        print("[Assistant]", response1)
        session.destroy()

        # 2. Resume the session later (e.g., after a restart).
        resumed = client.resume_session(session_id)
        if not resumed:
            raise RuntimeError(f'Session "{session_id}" not found — cannot resume.')

        response2 = resumed.send("What was I working on?")
        print("[Assistant]", response2)
        resumed.destroy()

        # 3. List all available sessions.
        sessions = client.list_sessions()
        print(f"[Sessions] {len(sessions)} active session(s):")
        for s in sessions:
            print(f"  - {s['id']} ({s['message_count']} messages)")

        # 4. Get conversation history.
        history_session = client.resume_session(session_id)
        if history_session:
            messages = history_session.get_messages()
            print(f"[History] {len(messages)} message(s) in {session_id}")
            history_session.destroy()

        # 5. Clean up: delete the session permanently.
        client.delete_session(session_id)

    except Exception as e:
        print(f"[Error] {e}")

    finally:
        client.stop()


if __name__ == "__main__":
    main()
