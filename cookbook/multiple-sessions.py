"""
multiple-sessions.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates how to manage multiple independent Copilot conversations
    simultaneously. Each session has its own context, model, and permissions.
    Useful for multi-user applications or multi-task workflows.

WHEN TO USE THIS:
    - Building a multi-user chat app where each user needs their own session
    - Running parallel tasks with different AI models (e.g., A/B testing)
    - Isolating conversations by context (e.g., Python help vs. Rust help)

HOW TO RUN:
    1. pip install copilot-sdk   (or your preferred Copilot SDK)
    2. Set GITHUB_TOKEN: export GITHUB_TOKEN="your-token-here"
    3. python multiple-sessions.py

PREREQUISITES:
    - Python 3.10+
    - GitHub Copilot SDK access
    - Valid GitHub token with Copilot access

EXPECTED OUTPUT:
    [Manager] Started
    [Session python-helper] Created with model gpt-5
    [Session rust-helper] Created with model gpt-5
    [Session javascript-helper] Created with model claude-sonnet-4.5
    Python: Virtual environment created with: python -m venv .venv
    Rust: Cargo.toml initialized with: cargo init
    JavaScript: package.json created with: npm init -y
    [Manager] 3 active sessions:
      - python-helper: 1 messages, last active 14:32:01
      - rust-helper: 1 messages, last active 14:32:01
      - javascript-helper: 1 messages, last active 14:32:01
    [Cleanup] All sessions destroyed
    [Manager] Stopped after cleaning up 0 session(s)
"""

from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional


# --- Types ---


@dataclass
class CopilotSession:
    """Represents a single Copilot session."""

    id: str
    model: str
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)
    message_count: int = 0


# --- Errors ---


class SessionError(Exception):
    """Raised when a session operation fails (not found, already exists, etc.)."""

    pass


# --- Multi-Session Manager ---


class MultiSessionManager:
    """
    Manages multiple independent Copilot sessions.
    Each session has its own conversation history and can use a different model.

    Usage:
        manager = MultiSessionManager()
        await manager.start()
        session_id = await manager.create_session(model="gpt-5")
        response = await manager.send_message(session_id, "Hello!")
        await manager.destroy_session(session_id)
        await manager.stop()
    """

    def __init__(self) -> None:
        self._sessions: dict[str, CopilotSession] = {}
        self._is_started: bool = False

    async def start(self) -> None:
        """
        Initializes the Copilot SDK client.
        Must be called before creating sessions.
        """
        if self._is_started:
            print("[Manager] Already started")
            return

        # TODO: Replace with actual CopilotClient initialization:
        #
        #   from copilot_sdk import CopilotClient
        #   self._client = CopilotClient()
        #   await self._client.start()

        self._is_started = True
        print("[Manager] Started")

    async def create_session(
        self,
        id: Optional[str] = None,
        model: str = "gpt-5",
        system_prompt: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> str:
        """
        Creates a new session with optional custom ID and model.
        If no ID is provided, generates a random UUID.

        Returns the session ID (useful if auto-generated).
        """
        if not self._is_started:
            raise SessionError("Manager not started. Call start() first.")

        session_id = id or str(uuid.uuid4())

        # Check if session ID already exists.
        if session_id in self._sessions:
            raise SessionError(
                f"Session {session_id} already exists. Use a different ID or destroy the existing session."
            )

        # TODO: Replace with actual Copilot SDK session creation:
        #
        #   sdk_session = await self._client.create_session(
        #       session_id=session_id,
        #       on_permission_request=approve_all,
        #       model=model,
        #   )
        #
        #   if system_prompt:
        #       await sdk_session.send_and_wait(prompt=system_prompt)

        session = CopilotSession(
            id=session_id,
            model=model,
            metadata=metadata or {},
        )

        self._sessions[session_id] = session
        print(f"[Session {session_id}] Created with model {model}")

        return session_id

    async def send_message(self, session_id: str, prompt: str) -> str:
        """
        Sends a message to a specific session and waits for the response.

        Raises SessionError if the session doesn't exist.
        """
        session = self._get_session_or_raise(session_id)

        # TODO: Replace with actual SDK call:
        #
        #   sdk_session = self._sdk_sessions[session_id]
        #   response = await sdk_session.send_and_wait(prompt=prompt)
        #   return response.content

        # Placeholder: echo back for demonstration.
        response = f'[Echo from {session_id}] Received: "{prompt}"'

        session.message_count += 1
        session.last_activity = datetime.now()

        return response

    async def destroy_session(self, session_id: str) -> None:
        """
        Destroys a specific session and cleans up resources.
        Safe to call multiple times — silently ignores missing sessions.
        """
        if session_id not in self._sessions:
            print(f"[Session {session_id}] Not found (may already be destroyed)")
            return

        # TODO: Replace with actual SDK cleanup:
        #
        #   sdk_session = self._sdk_sessions[session_id]
        #   await sdk_session.destroy()
        #   del self._sdk_sessions[session_id]

        session = self._sessions[session_id]
        print(f"[Session {session_id}] Destroyed after {session.message_count} messages")
        del self._sessions[session_id]

    def list_sessions(self) -> list[CopilotSession]:
        """
        Lists all active sessions with their metadata.
        Useful for debugging or building a session management UI.
        """
        return list(self._sessions.values())

    async def stop(self) -> None:
        """
        Destroys all active sessions and shuts down the SDK client.
        Should be called when your application exits.
        """
        if not self._is_started:
            print("[Manager] Not started")
            return

        session_count = len(self._sessions)

        # Destroy all sessions.
        for session_id in list(self._sessions.keys()):
            await self.destroy_session(session_id)

        # TODO: Replace with actual client shutdown:
        #
        #   await self._client.stop()

        self._is_started = False
        print(f"[Manager] Stopped after cleaning up {session_count} session(s)")

    # --- Private helpers ---

    def _get_session_or_raise(self, session_id: str) -> CopilotSession:
        session = self._sessions.get(session_id)
        if session is None:
            raise SessionError(
                f"Session {session_id} not found. It may have been destroyed or never created."
            )
        return session


# --- Example usage ---


async def main() -> None:
    manager = MultiSessionManager()

    try:
        # Initialize the manager.
        await manager.start()

        # Create three sessions for different programming languages.
        # Each has its own context and can use a different model.
        python_session = await manager.create_session(
            id="python-helper",
            model="gpt-5",
            system_prompt="You are helping with a Python project.",
            metadata={"language": "python", "user": "developer-1"},
        )

        rust_session = await manager.create_session(
            id="rust-helper",
            model="gpt-5",
            system_prompt="You are helping with a Rust project.",
            metadata={"language": "rust", "user": "developer-1"},
        )

        js_session = await manager.create_session(
            id="javascript-helper",
            model="claude-sonnet-4.5",  # Using a different model for comparison
            system_prompt="You are helping with a JavaScript project.",
            metadata={"language": "javascript", "user": "developer-2"},
        )

        # Send messages to each session independently.
        # These run in parallel — no cross-talk between sessions.
        python_response, rust_response, js_response = await asyncio.gather(
            manager.send_message(python_session, "How do I create a virtual environment?"),
            manager.send_message(rust_session, "How do I initialize a Cargo project?"),
            manager.send_message(js_session, "How do I set up package.json?"),
        )

        print("Python:", python_response)
        print("Rust:", rust_response)
        print("JavaScript:", js_response)

        # List all active sessions.
        active_sessions = manager.list_sessions()
        print(f"\n[Manager] {len(active_sessions)} active sessions:")
        for session in active_sessions:
            print(
                f"  - {session.id}: {session.message_count} messages, "
                f"last active {session.last_activity.strftime('%H:%M:%S')}"
            )

        # Clean up: destroy all sessions.
        await manager.destroy_session(python_session)
        await manager.destroy_session(rust_session)
        await manager.destroy_session(js_session)

        print("[Cleanup] All sessions destroyed")

    except SessionError as e:
        # Handle session-specific errors (not found, already exists).
        print(f"Session error: {e}")

    except Exception as e:
        # Unexpected errors — log and re-raise.
        print(f"Unexpected error: {e}")
        raise

    finally:
        # Always shut down the manager when done.
        await manager.stop()


if __name__ == "__main__":
    asyncio.run(main())
