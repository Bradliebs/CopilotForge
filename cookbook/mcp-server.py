"""
mcp-server.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Sets up a Model Context Protocol (MCP) server in Python using the official
    ``mcp`` package. Registers three example tools (file search, data lookup,
    status check) with type-hinted inputs, structured error responses, and
    proper server lifecycle management.

WHEN TO USE THIS:
    When you want to expose local tools to an AI assistant via MCP — e.g.,
    letting Copilot search your codebase, query a database, or check the
    health of a service.

HOW TO RUN:
    1. pip install "mcp[cli]"
    2. python cookbook/mcp-server.py
    (The server starts on stdio by default — connect an MCP client to it.)

PREREQUISITES:
    - Python 3.10+
    - mcp >= 1.0.0

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import asyncio
import json
import os
import random
import time
from pathlib import Path

from mcp.server.fastmcp import FastMCP

# --- Server Setup ---

mcp = FastMCP("copilotforge-tools")


# --- Tool 1: File Search ---


@mcp.tool()
async def file_search(directory: str, pattern: str, max_results: int = 20) -> str:
    """Search for files in a directory by name pattern.

    Args:
        directory: Absolute or relative path to the directory to search.
        pattern: Substring to match against file names (case-insensitive).
        max_results: Maximum number of results to return (1-100, default 20).
    """
    if max_results < 1 or max_results > 100:
        return "Error: max_results must be between 1 and 100"

    resolved = Path(directory).resolve()

    if not resolved.is_dir():
        return f"Error: '{directory}' is not a directory or does not exist"

    lower_pattern = pattern.lower()
    matches: list[dict[str, str | int]] = []

    try:
        for entry in resolved.iterdir():
            if len(matches) >= max_results:
                break
            if not entry.is_file():
                continue
            if lower_pattern not in entry.name.lower():
                continue

            try:
                size = entry.stat().st_size
                matches.append(
                    {"name": entry.name, "path": str(entry), "size_bytes": size}
                )
            except OSError:
                # Skip files we cannot stat (permissions, etc.).
                pass
    except PermissionError:
        return f"Error: Permission denied reading '{directory}'"

    if not matches:
        return f"No files matching '{pattern}' found in {directory}"

    lines = [
        f"{m['name']} ({_format_bytes(m['size_bytes'])}) — {m['path']}"  # type: ignore[arg-type]
        for m in matches
    ]
    return f"Found {len(matches)} file(s):\n" + "\n".join(lines)


# --- Tool 2: Data Lookup ---


@mcp.tool()
async def data_lookup(collection: str, key: str) -> str:
    """Look up a record by key from the application data store.

    Args:
        collection: Which data collection to query ('users', 'projects', or 'settings').
        key: The record key / ID to look up.
    """
    # TODO: Replace with actual database or API call.
    store: dict[str, dict[str, dict[str, object]]] = {
        "users": {
            "u-123": {"id": "u-123", "name": "Alice", "role": "admin"},
            "u-456": {"id": "u-456", "name": "Bob", "role": "developer"},
        },
        "projects": {
            "p-001": {"id": "p-001", "name": "CopilotForge", "status": "active"},
        },
        "settings": {
            "theme": {"value": "dark", "updated_at": "2025-01-15"},
        },
    }

    valid_collections = list(store.keys())
    if collection not in store:
        return f"Error: Collection '{collection}' not found. Valid: {valid_collections}"

    record = store[collection].get(key)
    if record is None:
        return f"Error: No record with key '{key}' in '{collection}'"

    return json.dumps(record, indent=2)


# --- Tool 3: Status Check ---


@mcp.tool()
async def status_check(services: list[str]) -> str:
    """Check the health status of application services.

    Args:
        services: List of service names to check (e.g. ['api', 'database', 'cache']).
    """
    if not services:
        return "Error: At least one service name is required"
    if len(services) > 10:
        return "Error: Maximum 10 services per check"

    results: list[dict[str, str | int]] = []

    for service in services:
        start = time.monotonic()
        try:
            # TODO: Replace with actual health check (HTTP ping, DB query, etc.).
            healthy = await _check_service_health(service)
            latency_ms = int((time.monotonic() - start) * 1000)
            results.append(
                {
                    "service": service,
                    "status": "healthy" if healthy else "degraded",
                    "latency_ms": latency_ms,
                }
            )
        except Exception:
            latency_ms = int((time.monotonic() - start) * 1000)
            results.append(
                {"service": service, "status": "unreachable", "latency_ms": latency_ms}
            )

    lines = [
        f"{'✅' if r['status'] == 'healthy' else '❌'} {r['service']}: {r['status']} ({r['latency_ms']}ms)"
        for r in results
    ]
    return "\n".join(lines)


# --- Helpers ---


def _format_bytes(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    return f"{size / (1024 * 1024):.1f} MB"


async def _check_service_health(service: str) -> bool:
    """Placeholder health check — replace with real checks."""
    # TODO: Replace with real health checks.
    await asyncio.sleep(random.random() * 0.05)
    return random.random() > 0.1


# --- Server Startup ---


if __name__ == "__main__":
    mcp.run()
