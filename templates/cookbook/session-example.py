"""
session-example.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates basic session management for a Copilot-style agent in Python.
    Creates a session, sends messages, handles responses, and cleans up.

WHEN TO USE THIS:
    When your Copilot agent needs to maintain a conversation across multiple
    turns — e.g., a wizard that asks questions one at a time.

HOW TO RUN:
    1. pip install openai   (or your preferred LLM SDK)
    2. Set your API key: export COPILOT_API_KEY="your-key-here"
    3. python session-example.py

PREREQUISITES:
    - Python 3.10+
    - A valid Copilot API key
"""

from __future__ import annotations

import uuid
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional


# --- Types ---


@dataclass
class Message:
    """A single message in a session."""

    role: str  # "user", "assistant", or "system"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Session:
    """Tracks the state of an active session."""

    id: str
    messages: list[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    metadata: dict[str, str] = field(default_factory=dict)


# --- Errors ---


class SessionError(Exception):
    """Raised when a session operation fails (expired, not found, etc.)."""

    pass


# --- Session Manager ---


class SessionManager:
    """
    Manages conversation sessions. Handles creation, message sending,
    history tracking, and cleanup.

    Usage:
        manager = SessionManager()
        session = manager.create_session(system_prompt="You are a helpful assistant.")
        response = await manager.send_message(session.id, "Hello!")
        manager.end_session(session.id)
    """

    def __init__(self, timeout_minutes: int = 30) -> None:
        self._sessions: dict[str, Session] = {}
        self._timeout = timedelta(minutes=timeout_minutes)

    def create_session(
        self,
        system_prompt: Optional[str] = None,
        metadata: Optional[dict[str, str]] = None,
    ) -> Session:
        """
        Creates a new session with an optional system prompt.
        Returns the session object with a unique ID.
        """
        session = Session(
            id=str(uuid.uuid4()),
            metadata=metadata or {},
        )

        # If a system prompt is provided, add it as the first message.
        if system_prompt:
            session.messages.append(
                Message(role="system", content=system_prompt)
            )

        self._sessions[session.id] = session
        print(f"[Session {session.id}] Created")
        return session

    def send_message(self, session_id: str, user_message: str) -> str:
        """
        Sends a user message and gets a response.
        Stores both the user message and the assistant response in session history.

        Raises SessionError if the session doesn't exist or has expired.
        """
        session = self._get_session_or_raise(session_id)

        # Check if the session has timed out.
        elapsed = datetime.now() - session.last_activity
        if elapsed > self._timeout:
            self.end_session(session_id)
            minutes = int(elapsed.total_seconds() / 60)
            raise SessionError(
                f"Session {session_id} expired after {minutes} minutes of inactivity."
            )

        # Record the user's message.
        session.messages.append(
            Message(role="user", content=user_message)
        )

        # Send to the model and get a response.
        # Replace this with your actual SDK call.
        response = self._call_model(session.messages)

        # Record the assistant's response.
        session.messages.append(
            Message(role="assistant", content=response)
        )

        session.last_activity = datetime.now()
        turn_count = sum(1 for m in session.messages if m.role == "user")
        print(f"[Session {session_id}] Turn {turn_count} complete")

        return response

    def end_session(self, session_id: str) -> None:
        """
        Ends a session and cleans up resources.
        Safe to call multiple times — silently ignores missing sessions.
        """
        if session_id in self._sessions:
            session = self._sessions[session_id]
            turn_count = sum(1 for m in session.messages if m.role == "user")
            print(f"[Session {session_id}] Ended after {turn_count} turns")
            del self._sessions[session_id]

    def get_history(self, session_id: str) -> list[Message]:
        """
        Returns the full message history for a session.
        Useful for debugging or logging.
        """
        return list(self._get_session_or_raise(session_id).messages)

    def cleanup_expired_sessions(self) -> int:
        """Cleans up all sessions that have exceeded the timeout."""
        now = datetime.now()
        expired_ids = [
            sid
            for sid, session in self._sessions.items()
            if now - session.last_activity > self._timeout
        ]

        for sid in expired_ids:
            self.end_session(sid)

        if expired_ids:
            print(f"[Cleanup] Removed {len(expired_ids)} expired session(s)")

        return len(expired_ids)

    # --- Private helpers ---

    def _get_session_or_raise(self, session_id: str) -> Session:
        session = self._sessions.get(session_id)
        if session is None:
            raise SessionError(
                f"Session {session_id} not found. It may have expired or been ended."
            )
        return session

    def _call_model(self, messages: list[Message]) -> str:
        """
        Calls the language model with the conversation history.
        Replace this with your actual SDK integration.
        """
        # TODO: Replace with actual Copilot SDK call. Example:
        #
        #   from openai import OpenAI
        #   client = OpenAI(api_key=os.environ["COPILOT_API_KEY"])
        #   result = client.chat.completions.create(
        #       model="gpt-4",
        #       messages=[{"role": m.role, "content": m.content} for m in messages],
        #   )
        #   return result.choices[0].message.content

        # Placeholder: echo back for demonstration.
        return f'[Echo] Received: "{messages[-1].content}"'


# --- Example usage ---


def main() -> None:
    manager = SessionManager()

    # Create a session with a system prompt.
    session = manager.create_session(
        system_prompt="You are a project planning assistant. Help the user define their goals.",
        metadata={"source": "copilotforge-wizard"},
    )

    try:
        # Simulate a multi-turn conversation.
        response1 = manager.send_message(session.id, "I want to build a REST API")
        print("Assistant:", response1)

        response2 = manager.send_message(session.id, "Using Flask and Python")
        print("Assistant:", response2)

        # Check the conversation history.
        history = manager.get_history(session.id)
        print(f"\nSession has {len(history)} messages.")

    except SessionError as e:
        # Handle session-specific errors (expired, not found).
        print(f"Session error: {e}")

    except Exception as e:
        # Unexpected errors — log and re-raise.
        print(f"Unexpected error: {e}")
        raise

    finally:
        # Always clean up the session.
        manager.end_session(session.id)


if __name__ == "__main__":
    main()
