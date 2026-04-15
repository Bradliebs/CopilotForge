"""
managing-local-files.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Uses Copilot to intelligently organize files in a directory based on metadata
    (extension, date, size, or custom AI-driven grouping). Supports dry-run mode
    to preview changes before applying them.

WHEN TO USE THIS:
    - Organizing messy Downloads folders by file type or date
    - Sorting project files into logical subdirectories
    - Batch file operations guided by AI analysis
    - Building file management tools with intelligent classification

HOW TO RUN:
    1. pip install copilot-sdk   (or your preferred Copilot SDK)
    2. Set GITHUB_TOKEN: export GITHUB_TOKEN="{{github_token}}"
    3. python managing-local-files.py

PREREQUISITES:
    - Python 3.10+
    - GitHub Copilot SDK access
    - Valid GitHub token with Copilot access

EXPECTED OUTPUT:
    [FileManager] Started
    [FileManager] Analyzing {{file_count}} files in {{target_folder}}
    [Copilot] Suggested grouping strategy: {{strategy}}
    [DRY RUN] {{example_file_1}} → {{example_target_1}}
      Reason: {{example_reason_1}}
    [DRY RUN] {{example_file_2}} → {{example_target_2}}
      Reason: {{example_reason_2}}
    [FileManager] Preview complete ({{operation_count}} operations)
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal, Optional


# --- Types ---

GroupingStrategy = Literal["extension", "date", "size", "ai-driven"]


@dataclass
class FileInfo:
    """Represents a file to be organized."""

    name: str
    path: str
    size: int
    extension: str
    modified_date: datetime


@dataclass
class FileOperation:
    """A proposed file move operation."""

    source_path: str
    target_path: str
    reason: str  # Why this grouping was chosen


# --- Errors ---


class FileOrganizerError(Exception):
    """Raised when a file organizer operation fails."""

    pass


# --- File Manager ---


class FileOrganizer:
    """
    Manages file organization with Copilot assistance.
    Analyzes files in a directory and suggests intelligent groupings.

    Usage:
        organizer = FileOrganizer()
        await organizer.start()
        await organizer.organize(target_folder="{{target_folder}}", dry_run=True)
        await organizer.stop()
    """

    def __init__(self) -> None:
        self._is_started: bool = False

    async def start(self) -> None:
        """
        Initializes the Copilot SDK client.
        Must be called before organizing files.
        """
        if self._is_started:
            print("[FileManager] Already started")
            return

        # TODO: Replace with actual CopilotClient initialization:
        #
        #   from copilot_sdk import CopilotClient, approve_all
        #   self._client = CopilotClient()
        #   await self._client.start()
        #
        #   self._session = await self._client.create_session(
        #       on_permission_request=approve_all,
        #       model="{{model_name}}",
        #   )

        self._is_started = True
        print("[FileManager] Started")

    async def organize(
        self,
        target_folder: str,
        strategy: GroupingStrategy = "extension",
        dry_run: bool = False,
        exclude_patterns: Optional[list[str]] = None,
    ) -> None:
        """
        Organizes files in the target folder according to the specified strategy.
        If dry_run is True, shows a preview without making changes.
        """
        if not self._is_started:
            raise FileOrganizerError("Manager not started. Call start() first.")

        exclude_patterns = exclude_patterns or []

        # Validate that the target folder exists.
        await self._validate_folder(target_folder)

        # Scan the folder for files.
        files = await self._scan_folder(target_folder, exclude_patterns)
        print(f"[FileManager] Analyzing {len(files)} files in {target_folder}")

        if not files:
            print("[FileManager] No files to organize")
            return

        # Generate file operations based on the strategy.
        operations = await self._generate_operations(files, strategy, target_folder)

        # Preview or apply the changes.
        if dry_run:
            self._preview_operations(operations)
            print(f"[FileManager] Preview complete ({len(operations)} operations)")
        else:
            await self._apply_operations(operations)
            print(f"[FileManager] Organized {len(files)} files")

    async def stop(self) -> None:
        """
        Shuts down the Copilot SDK client.
        Should be called when done organizing files.
        """
        if not self._is_started:
            print("[FileManager] Not started")
            return

        # TODO: Replace with actual cleanup:
        #
        #   await self._session.destroy()
        #   await self._client.stop()

        self._is_started = False
        print("[FileManager] Stopped")

    # --- Private helpers ---

    async def _validate_folder(self, folder_path: str) -> None:
        folder = Path(folder_path)
        if not folder.exists():
            raise FileOrganizerError(f"Folder not found: {folder_path}")
        if not folder.is_dir():
            raise FileOrganizerError(f"{folder_path} is not a directory")

    async def _scan_folder(self, folder_path: str, exclude_patterns: list[str]) -> list[FileInfo]:
        folder = Path(folder_path)
        files: list[FileInfo] = []

        for entry in folder.iterdir():
            # Skip directories and excluded patterns.
            if entry.is_dir():
                continue
            if self._matches_exclude_pattern(entry.name, exclude_patterns):
                continue

            stats = entry.stat()

            files.append(
                FileInfo(
                    name=entry.name,
                    path=str(entry),
                    size=stats.st_size,
                    extension=entry.suffix.lower(),
                    modified_date=datetime.fromtimestamp(stats.st_mtime),
                )
            )

        return files

    def _matches_exclude_pattern(self, filename: str, patterns: list[str]) -> bool:
        for pattern in patterns:
            # Simple glob matching: "*.tmp" or ".*" (hidden files)
            if pattern.startswith("*."):
                if filename.endswith(pattern[1:]):
                    return True
            elif pattern == ".*":
                if filename.startswith("."):
                    return True
            elif filename == pattern:
                return True
        return False

    async def _generate_operations(
        self,
        files: list[FileInfo],
        strategy: GroupingStrategy,
        target_folder: str,
    ) -> list[FileOperation]:
        if strategy == "extension":
            return self._group_by_extension(files, target_folder)
        elif strategy == "date":
            return self._group_by_date(files, target_folder)
        elif strategy == "size":
            return self._group_by_size(files, target_folder)
        elif strategy == "ai-driven":
            return await self._group_by_ai(files, target_folder)
        else:
            raise FileOrganizerError(f"Unknown strategy: {strategy}")

    def _group_by_extension(self, files: list[FileInfo], target_folder: str) -> list[FileOperation]:
        operations: list[FileOperation] = []
        extension_map = {
            ".jpg": "{{images_folder}}",
            ".jpeg": "{{images_folder}}",
            ".png": "{{images_folder}}",
            ".gif": "{{images_folder}}",
            ".pdf": "{{documents_folder}}",
            ".docx": "{{documents_folder}}",
            ".txt": "{{documents_folder}}",
            ".zip": "{{archives_folder}}",
            ".tar": "{{archives_folder}}",
            ".gz": "{{archives_folder}}",
        }

        for file in files:
            subfolder = extension_map.get(file.extension, "{{other_folder}}")
            target_path = os.path.join(target_folder, subfolder, file.name)

            operations.append(
                FileOperation(
                    source_path=file.path,
                    target_path=target_path,
                    reason=f"Grouped by extension: {file.extension}",
                )
            )

        return operations

    def _group_by_date(self, files: list[FileInfo], target_folder: str) -> list[FileOperation]:
        operations: list[FileOperation] = []

        for file in files:
            year = file.modified_date.year
            month = str(file.modified_date.month).zfill(2)
            subfolder = f"{year}-{month}"
            target_path = os.path.join(target_folder, subfolder, file.name)

            operations.append(
                FileOperation(
                    source_path=file.path,
                    target_path=target_path,
                    reason=f"Grouped by date: {subfolder}",
                )
            )

        return operations

    def _group_by_size(self, files: list[FileInfo], target_folder: str) -> list[FileOperation]:
        operations: list[FileOperation] = []

        for file in files:
            if file.size < {{small_file_threshold}}:
                subfolder = "{{small_folder}}"  # < 1 MB
            elif file.size < {{medium_file_threshold}}:
                subfolder = "{{medium_folder}}"  # 1-10 MB
            else:
                subfolder = "{{large_folder}}"  # > 10 MB

            target_path = os.path.join(target_folder, subfolder, file.name)

            operations.append(
                FileOperation(
                    source_path=file.path,
                    target_path=target_path,
                    reason=f"Grouped by size: {subfolder}",
                )
            )

        return operations

    async def _group_by_ai(self, files: list[FileInfo], target_folder: str) -> list[FileOperation]:
        # TODO: Replace with actual Copilot SDK call:
        #
        #   file_list = "\n".join([f"{f.name} ({f.size} bytes)" for f in files])
        #   prompt = f"Analyze these files and suggest logical subdirectories:\n{file_list}"
        #   response = await self._session.send_and_wait(prompt=prompt)
        #   # Parse response and create operations...

        # Placeholder: fallback to extension-based grouping.
        print("[Copilot] Using AI-driven grouping (simulated)")
        return self._group_by_extension(files, target_folder)

    def _preview_operations(self, operations: list[FileOperation]) -> None:
        print("\n[DRY RUN] Proposed changes:")
        for op in operations:
            relative_path = os.path.relpath(op.target_path, os.path.dirname(op.source_path))
            print(f"  {os.path.basename(op.source_path)} → {relative_path}")
            print(f"    Reason: {op.reason}")

    async def _apply_operations(self, operations: list[FileOperation]) -> None:
        for op in operations:
            try:
                # Ensure the target directory exists.
                target_dir = os.path.dirname(op.target_path)
                os.makedirs(target_dir, exist_ok=True)

                # Move the file.
                os.rename(op.source_path, op.target_path)
                print(f"[Moved] {os.path.basename(op.source_path)} → {op.target_path}")
            except Exception as e:
                print(f"[Error] Failed to move {op.source_path}: {e}")
                # Continue with other operations even if one fails.


# --- Example usage ---


async def main() -> None:
    organizer = FileOrganizer()

    try:
        await organizer.start()

        # Example: Preview organization by extension (dry run)
        target_folder = "{{target_folder}}"

        print("\n=== Example: Organize by {{strategy}} ({{dry_run_mode}}) ===")
        await organizer.organize(
            target_folder=target_folder,
            strategy="{{strategy}}",
            dry_run={{is_dry_run}},
            exclude_patterns={{exclude_patterns}},  # Skip hidden files and temp files
        )

    except FileOrganizerError as e:
        # Handle file organizer errors (folder not found, invalid strategy).
        print(f"File organizer error: {e}")

    except Exception as e:
        # Unexpected errors — log and re-raise.
        print(f"Unexpected error: {e}")
        raise

    finally:
        await organizer.stop()


if __name__ == "__main__":
    asyncio.run(main())
