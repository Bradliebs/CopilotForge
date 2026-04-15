"""
memory-reader.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Reads and parses CopilotForge memory files (decisions.md, patterns.md,
    preferences.md, history.md) into structured Python objects. Provides
    query helpers for filtering decisions and patterns.

WHEN TO USE THIS:
    When your agent or tool needs to read project memory — past decisions,
    active conventions, user preferences — to make context-aware choices.

HOW TO RUN:
    1. python cookbook/memory-reader.py

PREREQUISITES:
    - Python 3.10+
    - A forge-memory/ directory with at least one .md file
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


# --- Types ---


@dataclass
class Decision:
    """A single decision entry parsed from decisions.md."""

    date: str
    title: str
    context: str = "unknown"
    decision: str = "unknown"
    reason: str = "unknown"
    impact: str = "unknown"
    tags: list[str] = field(default_factory=list)


@dataclass
class Pattern:
    """A project-specific pattern parsed from patterns.md."""

    name: str
    when_to_use: str = "unspecified"
    pattern: str = "unspecified"
    confidence: str = "observed"  # "observed" | "confirmed" | "established"


@dataclass
class Conventions:
    """Parsed conventions from the standard sections of patterns.md."""

    stack_conventions: list[str] = field(default_factory=list)
    file_structure: dict[str, str] = field(default_factory=dict)
    naming_conventions: dict[str, str] = field(default_factory=dict)
    project_patterns: list[Pattern] = field(default_factory=list)


@dataclass
class UserPreferences:
    """User preferences parsed from preferences.md."""

    verbosity: str = "intermediate"  # "beginner" | "intermediate" | "advanced"
    stack_preference: str = "not set"
    testing: str = "not set"
    memory_entries_to_load: int = 10
    generation_style: str = "standard"  # "minimal" | "standard" | "verbose"
    custom: dict[str, str] = field(default_factory=dict)


@dataclass
class SessionHistory:
    """Session stats parsed from history.md."""

    session_count: int = 0
    last_session_date: str = "never"
    total_files_created: int = 0
    total_files_updated: int = 0


@dataclass
class MemorySummary:
    """The full memory summary produced by the reader."""

    is_first_run: bool = True
    decisions: list[Decision] = field(default_factory=list)
    decisions_count: int = 0
    conventions: Conventions = field(default_factory=Conventions)
    patterns_count: int = 0
    preferences: UserPreferences = field(default_factory=UserPreferences)
    history: SessionHistory = field(default_factory=SessionHistory)
    warnings: list[str] = field(default_factory=list)


# --- Exceptions ---


class MemoryReadError(Exception):
    """Raised when a memory file cannot be read or parsed."""

    def __init__(self, file_path: str, reason: str) -> None:
        self.file_path = file_path
        self.reason = reason
        super().__init__(f"Failed to read {file_path}: {reason}")


# --- Constants ---

# TODO: Replace {{memory_dir}} with your project's forge-memory path.
DEFAULT_MEMORY_DIR = "{{memory_dir}}"
DEFAULT_MAX_ENTRIES = 10
MAX_FILE_SIZE = 100 * 1024  # 100KB

STACK_KEYWORDS = [
    "stack", "framework", "language", "typescript", "python", "javascript",
    "go", "c#", "react", "express", "fastapi", "prisma", "django",
]

PREF_KEYWORDS = [
    "user override", "user chose", "changed preference", "preference",
    "verbosity", "opted for",
]


# --- File Reading Helpers ---


def _safe_read_file(path: Path, warnings: list[str]) -> str | None:
    """Read a file safely, returning None if it doesn't exist or can't be read."""
    try:
        if not path.exists():
            return None
        content = path.read_text(encoding="utf-8")
        if len(content) > MAX_FILE_SIZE:
            warnings.append(f"{path.name}: file exceeds {MAX_FILE_SIZE // 1024}KB — truncated")
            return content[:MAX_FILE_SIZE]
        return content
    except (OSError, UnicodeDecodeError) as exc:
        warnings.append(f"{path.name}: read error — {exc}")
        return None


# --- Parsers ---


def _tag_decision(entry: Decision) -> list[str]:
    """Assign tags to a decision based on its content."""
    tags: list[str] = []
    text = f"{entry.context} {entry.decision} {entry.reason} {entry.impact}".lower()
    if any(kw in text for kw in STACK_KEYWORDS):
        tags.append("stack")
    if any(kw in text for kw in PREF_KEYWORDS):
        tags.append("preference")
    return tags


def _extract_field(block: str, label: str) -> str | None:
    """Extract a bold-label field value (e.g., **Context:** ...) from a markdown block."""
    pattern = re.compile(rf"\*\*{re.escape(label)}:\*\*\s*(.+?)(?:\n|$)", re.IGNORECASE)
    match = pattern.search(block)
    return match.group(1).strip() if match else None


def _extract_section(content: str, heading: str) -> str | None:
    """Extract a ## section from markdown."""
    pattern = re.compile(rf"## {re.escape(heading)}[\s\S]*?(?=\n## |$)", re.IGNORECASE)
    match = pattern.search(content)
    return match.group(0) if match else None


def _extract_bullet_items(section: str) -> list[str]:
    """Extract bullet items (lines starting with - ) from a markdown section."""
    items: list[str] = []
    for line in section.split("\n"):
        trimmed = line.strip()
        if trimmed.startswith("- "):
            items.append(trimmed[2:].strip())
    return items


def _normalize_confidence(raw: str) -> str:
    """Normalize a confidence string to one of the three valid levels."""
    raw_lower = raw.lower().strip()
    if raw_lower == "confirmed":
        return "confirmed"
    if raw_lower == "established":
        return "established"
    return "observed"


def parse_decisions(content: str, max_entries: int = DEFAULT_MAX_ENTRIES) -> list[Decision]:
    """Parse decisions.md into a list of Decision objects."""
    entries: list[Decision] = []
    entry_pattern = re.compile(r"^### (\d{4}-\d{2}-\d{2})\s*[—:]\s*(.+)$", re.MULTILINE)
    matches = list(entry_pattern.finditer(content))

    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        block = content[start:end]

        entry = Decision(
            date=match.group(1),
            title=match.group(2).strip(),
            context=_extract_field(block, "Context") or _extract_field(block, "What") or "unknown",
            decision=_extract_field(block, "Decision") or _extract_field(block, "Why") or "unknown",
            reason=_extract_field(block, "Reason") or _extract_field(block, "Stack") or "unknown",
            impact=_extract_field(block, "Impact") or _extract_field(block, "Options enabled") or "unknown",
        )
        entry.tags = _tag_decision(entry)
        entries.append(entry)

    return entries[:max_entries]


def _parse_project_patterns(section: str) -> list[Pattern]:
    """Parse ### sub-sections under Project-Specific Patterns into Pattern objects."""
    patterns: list[Pattern] = []
    heading_pattern = re.compile(r"^### (.+?)(?:\s*\((\w+)\))?$", re.MULTILINE)
    matches = list(heading_pattern.finditer(section))

    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(section)
        block = section[start:end]

        patterns.append(
            Pattern(
                name=match.group(1).strip(),
                when_to_use=_extract_field(block, "When to use") or "unspecified",
                pattern=_extract_field(block, "Pattern") or "unspecified",
                confidence=_normalize_confidence(match.group(2) or "observed"),
            )
        )

    return patterns


def parse_patterns(content: str) -> Conventions:
    """Parse patterns.md into structured conventions and project patterns."""
    conventions = Conventions()

    stack_section = _extract_section(content, "Stack Conventions")
    if stack_section:
        conventions.stack_conventions = _extract_bullet_items(stack_section)

    file_section = _extract_section(content, "File Structure")
    if file_section:
        for item in _extract_bullet_items(file_section):
            colon_idx = item.find(":")
            if colon_idx > -1:
                key = item[:colon_idx].strip().lower()
                conventions.file_structure[key] = item[colon_idx + 1 :].strip()

    naming_section = _extract_section(content, "Naming Conventions")
    if naming_section:
        for item in _extract_bullet_items(naming_section):
            colon_idx = item.find(":")
            if colon_idx > -1:
                key = item[:colon_idx].strip().lower()
                conventions.naming_conventions[key] = item[colon_idx + 1 :].strip()

    patterns_section = _extract_section(content, "Project-Specific Patterns")
    if patterns_section:
        conventions.project_patterns = _parse_project_patterns(patterns_section)

    return conventions


def parse_preferences(content: str) -> UserPreferences:
    """Parse preferences.md into key-value UserPreferences."""
    prefs = UserPreferences()
    kv_pattern = re.compile(
        r"(?:\*\*(.+?)\*\*:\s*|^-\s*(.+?):\s*|^(.+?):\s*)(.+)$",
        re.MULTILINE,
    )

    for match in kv_pattern.finditer(content):
        key = (match.group(1) or match.group(2) or match.group(3)).strip().lower().replace(" ", "_")
        value = match.group(4).strip()

        if key == "verbosity" and value in ("beginner", "intermediate", "advanced"):
            prefs.verbosity = value
        elif key == "stack_preference":
            prefs.stack_preference = value
        elif key == "testing":
            prefs.testing = value
        elif key == "memory_entries_to_load":
            try:
                num = int(value)
                if num > 0:
                    prefs.memory_entries_to_load = num
            except ValueError:
                pass
        elif key == "generation_style" and value in ("minimal", "standard", "verbose"):
            prefs.generation_style = value
        else:
            prefs.custom[key] = value

    return prefs


def parse_history(content: str) -> SessionHistory:
    """Parse history.md into session stats."""
    history = SessionHistory()

    session_pattern = re.compile(r"^### (?:Session \d+|(\d{4}-\d{2}-\d{2}))", re.MULTILINE)
    dates: list[str] = []
    count = 0

    for match in session_pattern.finditer(content):
        count += 1
        if match.group(1):
            dates.append(match.group(1))

    history.session_count = count
    if dates:
        dates.sort(reverse=True)
        history.last_session_date = dates[0]

    for m in re.finditer(r"files?\s*created[:\s]*(\d+)", content, re.IGNORECASE):
        history.total_files_created += int(m.group(1))

    for m in re.finditer(r"files?\s*updated[:\s]*(\d+)", content, re.IGNORECASE):
        history.total_files_updated += int(m.group(1))

    return history


# --- Main Reader ---


def read_forge_memory(memory_dir: str = DEFAULT_MEMORY_DIR) -> MemorySummary:
    """
    Read all forge-memory files and produce a structured MemorySummary.

    Usage::

        # TODO: Replace {{memory_dir}} with your project's forge-memory path.
        memory = read_forge_memory("{{memory_dir}}")
        if not memory.is_first_run:
            for d in memory.decisions:
                print(d.date, d.title)
    """
    warnings: list[str] = []
    memory_path = Path(memory_dir)

    if not memory_path.is_dir():
        return MemorySummary(
            is_first_run=True,
            warnings=["forge-memory/ directory not found — first run"],
        )

    if not any(memory_path.iterdir()):
        return MemorySummary(
            is_first_run=True,
            warnings=["forge-memory/ directory is empty — first run"],
        )

    prefs_content = _safe_read_file(memory_path / "preferences.md", warnings)
    preferences = parse_preferences(prefs_content) if prefs_content else UserPreferences()
    if not prefs_content:
        warnings.append("preferences.md: not found — using defaults")

    decisions_content = _safe_read_file(memory_path / "decisions.md", warnings)
    decisions: list[Decision] = []
    decisions_count = 0
    if decisions_content:
        all_decisions = parse_decisions(decisions_content, max_entries=999_999)
        decisions_count = len(all_decisions)
        decisions = all_decisions[: preferences.memory_entries_to_load]
    else:
        warnings.append("decisions.md: not found")

    patterns_content = _safe_read_file(memory_path / "patterns.md", warnings)
    conventions = parse_patterns(patterns_content) if patterns_content else Conventions()
    if not patterns_content:
        warnings.append("patterns.md: not found")

    patterns_count = (
        len(conventions.stack_conventions)
        + len(conventions.file_structure)
        + len(conventions.naming_conventions)
        + len(conventions.project_patterns)
    )

    history_content = _safe_read_file(memory_path / "history.md", warnings)
    history = parse_history(history_content) if history_content else SessionHistory()
    if not history_content:
        warnings.append("history.md: not found")

    return MemorySummary(
        is_first_run=False,
        decisions=decisions,
        decisions_count=decisions_count,
        conventions=conventions,
        patterns_count=patterns_count,
        preferences=preferences,
        history=history,
        warnings=warnings,
    )


# --- Query Helpers ---


def get_stack_decisions(summary: MemorySummary) -> list[Decision]:
    """Return only decisions tagged as stack-related."""
    return [d for d in summary.decisions if "stack" in d.tags]


def get_preference_decisions(summary: MemorySummary) -> list[Decision]:
    """Return only decisions tagged as user-preference changes."""
    return [d for d in summary.decisions if "preference" in d.tags]


def get_patterns_above_confidence(
    summary: MemorySummary,
    min_confidence: str = "confirmed",
) -> list[Pattern]:
    """Return patterns at or above the given confidence level."""
    levels = {"observed": 0, "confirmed": 1, "established": 2}
    min_level = levels.get(min_confidence, 0)
    return [
        p
        for p in summary.conventions.project_patterns
        if levels.get(p.confidence, 0) >= min_level
    ]


def get_recent_decisions(summary: MemorySummary, n: int = 5) -> list[Decision]:
    """Return the N most recent decisions."""
    return summary.decisions[:n]


def get_active_conventions(summary: MemorySummary) -> list[str]:
    """Return all conventions as a flat list of labelled strings."""
    items: list[str] = []
    items.extend(f"[stack] {c}" for c in summary.conventions.stack_conventions)
    items.extend(
        f"[structure] {k}: {v}" for k, v in summary.conventions.file_structure.items()
    )
    items.extend(
        f"[naming] {k}: {v}" for k, v in summary.conventions.naming_conventions.items()
    )
    items.extend(
        f"[pattern:{p.confidence}] {p.name}: {p.pattern}"
        for p in summary.conventions.project_patterns
    )
    return items


def has_memory(summary: MemorySummary) -> bool:
    """Return True if forge-memory/ has at least one parseable file."""
    return not summary.is_first_run


# --- Context Summary Formatter ---


def format_context_block(summary: MemorySummary) -> str:
    """
    Format the memory summary as a FORGE-MEMORY context block
    that the Planner can inject into its working context.
    """
    if summary.is_first_run:
        return "--- FORGE-MEMORY ---\nstatus: first run — no memory yet\n--- END FORGE-MEMORY ---"

    lines: list[str] = ["--- FORGE-MEMORY ---"]

    project = summary.decisions[0].title if summary.decisions else "{{project_name}}"
    stack = ", ".join(summary.conventions.stack_conventions[:3]) or "{{stack}}"
    lines.append(f"project: {project}")
    lines.append(f"stack: {stack}")
    lines.append(f"skill_level: {summary.preferences.verbosity}")
    lines.append(f"last_run: {summary.history.last_session_date}")
    lines.append(f"session_count: {summary.history.session_count or 'unknown'}")
    lines.append(f"decisions_count: {summary.decisions_count}")
    lines.append(f"patterns_count: {summary.patterns_count}")
    lines.append("")

    lines.append("recent_decisions:")
    for d in summary.decisions[:5]:
        lines.append(f"  - {d.date}: {d.title} — {d.decision[:60]}")
    if summary.decisions_count > 5:
        lines.append(f"  ... and {summary.decisions_count - 5} more")
    lines.append("")

    lines.append("active_conventions:")
    naming = ", ".join(
        f"{k}: {v}" for k, v in summary.conventions.naming_conventions.items()
    ) or "not set"
    structure = ", ".join(
        f"{k}: {v}" for k, v in summary.conventions.file_structure.items()
    ) or "not set"
    stack_conv = "; ".join(summary.conventions.stack_conventions[:3]) or "not set"
    lines.append(f"  - naming: {naming}")
    lines.append(f"  - structure: {structure}")
    lines.append(f"  - stack: {stack_conv}")
    lines.append("")

    lines.append("user_preferences:")
    lines.append(f"  - verbosity: {summary.preferences.verbosity}")
    lines.append(f"  - testing: {summary.preferences.testing}")
    for key, val in summary.preferences.custom.items():
        lines.append(f"  - {key}: {val}")

    lines.append("--- END FORGE-MEMORY ---")
    return "\n".join(lines)


# --- Example Usage ---


def main() -> None:
    print("=== Memory Reader Recipe ===\n")

    # TODO: Replace {{memory_dir}} with your project's forge-memory path.
    memory_dir = "{{memory_dir}}"

    print(f"Reading memory from: {memory_dir}\n")
    summary = read_forge_memory(memory_dir)

    if summary.is_first_run:
        print("📭 No memory found — this is the first run.")
        print(f"   Warnings: {'; '.join(summary.warnings)}")
        return

    print("📬 Memory loaded!\n")

    print(f"Decisions: {summary.decisions_count}")
    print(f"Patterns: {summary.patterns_count}")
    print(f"Sessions: {summary.history.session_count}")
    print(f"Last run: {summary.history.last_session_date}")
    print()

    stack_decisions = get_stack_decisions(summary)
    print(f"Stack decisions ({len(stack_decisions)}):")
    for d in stack_decisions:
        print(f"  - {d.date}: {d.title}")

    confirmed_patterns = get_patterns_above_confidence(summary, "confirmed")
    print(f"\nConfirmed+ patterns ({len(confirmed_patterns)}):")
    for p in confirmed_patterns:
        print(f"  - [{p.confidence}] {p.name}: {p.pattern}")

    conventions = get_active_conventions(summary)
    print(f"\nActive conventions ({len(conventions)}):")
    for c in conventions:
        print(f"  - {c}")

    print("\n--- Formatted Context Block ---\n")
    print(format_context_block(summary))

    if summary.warnings:
        print("\n⚠️ Warnings:")
        for w in summary.warnings:
            print(f"  - {w}")


if __name__ == "__main__":
    main()
