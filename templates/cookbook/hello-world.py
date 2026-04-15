"""
hello-world.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    The simplest possible Copilot SDK recipe. Creates a client, opens a
    session, sends one message, prints the response, and cleans up.

WHEN TO USE THIS:
    When you're brand new to the Copilot SDK and want to see the minimal
    end-to-end flow — connect, talk, disconnect.

HOW TO RUN:
    1. pip install {{SDK_PACKAGE}}
    2. Set your API key: export {{API_KEY_VAR}}="your-key-here"
    3. python cookbook/hello-world.py

PREREQUISITES:
    - Python 3.10+
    - A valid {{API_KEY_VAR}}

EXPECTED OUTPUT:
    [Client] Starting...
    [Session] Created: sess_1234567890
    [Assistant] Hello! I can help with coding, debugging, ...
    [Session] Destroyed.
    [Client] Stopped.

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import os
import time


# --- Mock SDK (replace with real import) ---
# TODO: Replace with: from {{SDK_MODULE}} import CopilotClient


class CopilotSession:
    """Represents an active Copilot session."""

    def __init__(self, session_id: str) -> None:
        self.id = session_id
        print(f"[Session] Created: {self.id}")

    def send(self, message: str) -> str:
        """Send a message and get a response."""
        return f'Hello! I can help with coding, debugging, and answering questions. You said: "{message}"'

    def destroy(self) -> None:
        """Clean up the session."""
        print("[Session] Destroyed.")


class CopilotClient:
    """Minimal Copilot client."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def start(self) -> None:
        print("[Client] Starting...")

    def create_session(self) -> CopilotSession:
        return CopilotSession(f"sess_{int(time.time())}")

    def stop(self) -> None:
        print("[Client] Stopped.")


# --- Main ---


def main() -> None:
    api_key = os.environ.get("{{API_KEY_VAR}}")
    if not api_key:
        raise RuntimeError("Missing {{API_KEY_VAR}} environment variable.")

    client = CopilotClient(api_key=api_key)
    client.start()

    session = client.create_session()

    try:
        response = session.send("{{GREETING_MESSAGE}}")
        print("[Assistant]", response)
    except Exception as e:
        print(f"[Error] {e}")
    finally:
        session.destroy()
        client.stop()


if __name__ == "__main__":
    main()
