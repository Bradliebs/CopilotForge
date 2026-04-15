"""
template-creator.py — CopilotForge Cookbook Recipe

Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/communicate-effectively/creating-templates

WHAT THIS DOES:
    Generates reusable project templates (README, issue templates, PR templates,
    contributing guides, and more) using structured Copilot prompts. Ensures
    consistency across all your projects.

WHEN TO USE THIS:
    When starting a new project and need standard templates, when you want to
    ensure all repos follow the same documentation format, or when you need to
    quickly scaffold project boilerplate.

HOW TO RUN:
    1. pip install {{SDK_PACKAGE}}
    2. Set your API key:
         bash/zsh:     export {{API_KEY_VAR}}="your-key-here"
         PowerShell:   $env:{{API_KEY_VAR}}="your-key-here"
         Windows cmd:  set {{API_KEY_VAR}}=your-key-here
    3. python cookbook/template-creator.py

PREREQUISITES:
    - Python 3.10+
    - A valid {{API_KEY_VAR}}

EXPECTED OUTPUT:
    [TemplateCreator] Starting template generation...
    [Config] Project: {{project-name}} | Stack: {{project-stack}}
    [Generate] Creating README template...
    [Generate] Creating CONTRIBUTING template...
    [Generate] Creating issue templates (bug, feature, question)...
    [Generate] Creating PR template...
    [Saved] 6 templates written to ./templates/
    [Done] Template suite ready — customize and commit!

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join()
    - macOS/Linux: Forward slashes work natively
    - Output files use LF line endings by default

SOURCE:
    Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/communicate-effectively/creating-templates
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional


# --- Template types ---


class TemplateType(Enum):
    """Supported template types for generation."""

    README = "readme"
    CONTRIBUTING = "contributing"
    ISSUE_BUG = "issue-bug"
    ISSUE_FEATURE = "issue-feature"
    ISSUE_QUESTION = "issue-question"
    PULL_REQUEST = "pull-request"
    CHANGELOG = "changelog"
    CODE_OF_CONDUCT = "code-of-conduct"
    DOCS_API = "docs-api"
    DOCS_GETTING_STARTED = "docs-getting-started"


@dataclass
class TemplateConfig:
    """Configuration for template generation."""

    project_name: str
    stack: str
    description: str
    template_types: list[TemplateType]
    output_dir: str = "./templates"
    custom_sections: list[str] = field(default_factory=list)


@dataclass
class GeneratedTemplate:
    """A single generated template ready to save."""

    type: TemplateType
    filename: str
    content: str


# --- Types (simulating {{SDK_PACKAGE}}) ---
# TODO: Replace with: from {{SDK_MODULE}} import CopilotClient


class CopilotSession:
    """Represents an active Copilot session for template generation."""

    def __init__(self, session_id: str) -> None:
        self.id = session_id

    def send(self, message: str) -> str:
        """Send a prompt and get a response."""
        # TODO: Replace mock with real Copilot SDK call
        return f"[Mock response for: {message[:60]}...]"

    def destroy(self) -> None:
        """Close the session."""
        pass


class CopilotClient:
    """Copilot client for template generation."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def start(self) -> None:
        print("[TemplateCreator] Starting template generation...")

    def create_session(self, session_id: str) -> CopilotSession:
        return CopilotSession(session_id)

    def stop(self) -> None:
        print("[Done] Template suite ready — customize and commit!")


# --- Prompt builder ---

TEMPLATE_FILENAMES: dict[TemplateType, str] = {
    TemplateType.README: "README.md",
    TemplateType.CONTRIBUTING: "CONTRIBUTING.md",
    TemplateType.ISSUE_BUG: ".github/ISSUE_TEMPLATE/bug_report.md",
    TemplateType.ISSUE_FEATURE: ".github/ISSUE_TEMPLATE/feature_request.md",
    TemplateType.ISSUE_QUESTION: ".github/ISSUE_TEMPLATE/question.md",
    TemplateType.PULL_REQUEST: ".github/PULL_REQUEST_TEMPLATE.md",
    TemplateType.CHANGELOG: "CHANGELOG.md",
    TemplateType.CODE_OF_CONDUCT: "CODE_OF_CONDUCT.md",
    TemplateType.DOCS_API: "docs/API.md",
    TemplateType.DOCS_GETTING_STARTED: "docs/GETTING-STARTED.md",
}


def build_prompt(template_type: TemplateType, config: TemplateConfig) -> str:
    """Build a structured prompt for the given template type."""
    custom = ""
    if config.custom_sections:
        custom = f" Also include: {', '.join(config.custom_sections)}."

    prompts: dict[TemplateType, str] = {
        TemplateType.README: (
            f'Create a professional README.md for "{{{{project-name}}}}", '
            f"a {{{{project-description}}}} built with {{{{project-stack}}}}. "
            f"Include sections for: Overview, Features, Getting Started, Installation, "
            f"Usage, Configuration, API Reference, Contributing, License."
            f"{custom} Use clear markdown formatting with badges, code blocks, "
            f"and a table of contents."
        ),
        TemplateType.CONTRIBUTING: (
            f'Create a CONTRIBUTING.md for "{{{{project-name}}}}" ({{{{project-stack}}}}). '
            f"Include sections for: How to Contribute, Development Setup, "
            f"Coding Standards, Commit Message Format, Pull Request Process, "
            f"Code Review Guidelines, Reporting Issues. "
            f"Keep it beginner-friendly with step-by-step instructions."
        ),
        TemplateType.ISSUE_BUG: (
            f'Create a GitHub issue template for bug reports in "{{{{project-name}}}}" '
            f"({{{{project-stack}}}}). Use YAML front matter with name, description, title prefix, "
            f"and labels. Include fields for: Bug Description, Steps to Reproduce, "
            f"Expected Behavior, Actual Behavior, Environment (OS, {{{{project-stack}}}} version), "
            f"Screenshots, Additional Context."
        ),
        TemplateType.ISSUE_FEATURE: (
            f'Create a GitHub issue template for feature requests in "{{{{project-name}}}}". '
            f"Use YAML front matter. Include fields for: Feature Description, Use Case, "
            f"Proposed Solution, Alternatives Considered, Additional Context."
        ),
        TemplateType.ISSUE_QUESTION: (
            f'Create a GitHub issue template for questions about "{{{{project-name}}}}". '
            f"Use YAML front matter. Include fields for: Question, Context, "
            f"What I've Tried, Related Documentation."
        ),
        TemplateType.PULL_REQUEST: (
            f'Create a GitHub pull request template for "{{{{project-name}}}}" ({{{{project-stack}}}}). '
            f"Include sections for: Description, Type of Change (bugfix/feature/breaking/docs), "
            f"Testing Done, Checklist (tests pass, docs updated, lint clean), Related Issues."
        ),
        TemplateType.CHANGELOG: (
            f'Create a CHANGELOG.md template for "{{{{project-name}}}}" following '
            f"Keep a Changelog format. Include sections for: Unreleased, with subsections "
            f"for Added, Changed, Deprecated, Removed, Fixed, Security. "
            f"Add an example 1.0.0 entry."
        ),
        TemplateType.CODE_OF_CONDUCT: (
            f'Create a CODE_OF_CONDUCT.md for "{{{{project-name}}}}" based on the '
            f"Contributor Covenant. Include sections for: Our Pledge, Our Standards, "
            f"Enforcement Responsibilities, Scope, Enforcement, Attribution."
        ),
        TemplateType.DOCS_API: (
            f'Create an API documentation template for "{{{{project-name}}}}" ({{{{project-stack}}}}). '
            f"Include sections for: Authentication, Base URL, Endpoints (with method, path, "
            f"parameters, request body, response, examples), Error Codes, Rate Limiting."
        ),
        TemplateType.DOCS_GETTING_STARTED: (
            f'Create a Getting Started guide for "{{{{project-name}}}}" ({{{{project-stack}}}}). '
            f"Include sections for: Prerequisites, Installation, Quick Start (5-minute tutorial), "
            f"Project Structure, Next Steps. Use numbered steps and code blocks."
        ),
    }

    return prompts.get(template_type, f"Create a {template_type.value} template.")


# --- Mock template content (simulates what Copilot would generate) ---


def mock_template_content(template_type: TemplateType, config: TemplateConfig) -> str:
    """Generate mock template content for demonstration purposes."""
    content_map: dict[TemplateType, str] = {
        TemplateType.README: "\n".join([
            "# {{project-name}}",
            "",
            "> {{project-description}}",
            "",
            "## Table of Contents",
            "- [Features](#features)",
            "- [Getting Started](#getting-started)",
            "- [Installation](#installation)",
            "- [Usage](#usage)",
            "- [Contributing](#contributing)",
            "- [License](#license)",
            "",
            "## Features",
            "",
            "- Built with {{project-stack}}",
            "- <!-- Add your features here -->",
            "",
            "## Getting Started",
            "",
            "### Prerequisites",
            "",
            "- {{project-stack}} installed",
            "",
            "### Installation",
            "",
            "```bash",
            "# Clone the repository",
            "git clone https://github.com/your-org/{{project-name}}.git",
            "cd {{project-name}}",
            "",
            "# Install dependencies",
            "npm install",
            "```",
            "",
            "## Usage",
            "",
            "```bash",
            "npm start",
            "```",
            "",
            "## Contributing",
            "",
            "See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.",
            "",
            "## License",
            "",
            "MIT",
        ]),
        TemplateType.CONTRIBUTING: "\n".join([
            "# Contributing to {{project-name}}",
            "",
            "Thank you for your interest in contributing!",
            "",
            "## How to Contribute",
            "",
            "1. Fork the repository",
            "2. Create a feature branch (`git checkout -b feature/my-feature`)",
            "3. Commit your changes (`git commit -m 'Add my feature'`)",
            "4. Push to the branch (`git push origin feature/my-feature`)",
            "5. Open a Pull Request",
            "",
            "## Development Setup",
            "",
            "```bash",
            "git clone https://github.com/your-org/{{project-name}}.git",
            "cd {{project-name}}",
            "npm install",
            "npm test",
            "```",
            "",
            "## Coding Standards",
            "",
            "- Follow the existing code style",
            "- Write tests for new features",
            "- Keep commits atomic and well-described",
            "",
            "## Pull Request Process",
            "",
            "1. Update documentation if needed",
            "2. Add tests for new functionality",
            "3. Ensure all tests pass",
            "4. Request review from maintainers",
        ]),
        TemplateType.ISSUE_BUG: "\n".join([
            "---",
            "name: Bug Report",
            "about: Report a bug to help us improve",
            'title: "[BUG] "',
            "labels: bug",
            "---",
            "",
            "## Bug Description",
            "A clear description of the bug.",
            "",
            "## Steps to Reproduce",
            "1. Go to '...'",
            "2. Click on '...'",
            "3. See error",
            "",
            "## Expected Behavior",
            "What you expected to happen.",
            "",
            "## Actual Behavior",
            "What actually happened.",
            "",
            "## Environment",
            "- OS: [e.g., Windows 11, macOS 14]",
            "- {{project-stack}} version: [e.g., 20.x]",
            "",
            "## Screenshots",
            "If applicable, add screenshots.",
        ]),
        TemplateType.ISSUE_FEATURE: "\n".join([
            "---",
            "name: Feature Request",
            "about: Suggest a new feature",
            'title: "[FEATURE] "',
            "labels: enhancement",
            "---",
            "",
            "## Feature Description",
            "A clear description of the feature.",
            "",
            "## Use Case",
            "Why this feature would be useful.",
            "",
            "## Proposed Solution",
            "How you think this could work.",
            "",
            "## Alternatives Considered",
            "Other approaches you've thought about.",
        ]),
        TemplateType.ISSUE_QUESTION: "\n".join([
            "---",
            "name: Question",
            "about: Ask a question about the project",
            'title: "[QUESTION] "',
            "labels: question",
            "---",
            "",
            "## Question",
            "Your question here.",
            "",
            "## Context",
            "What are you trying to accomplish?",
            "",
            "## What I've Tried",
            "Steps you've already taken.",
            "",
            "## Related Documentation",
            "Links to docs you've already read.",
        ]),
        TemplateType.PULL_REQUEST: "\n".join([
            "## Description",
            "Describe your changes here.",
            "",
            "## Type of Change",
            "- [ ] Bug fix",
            "- [ ] New feature",
            "- [ ] Breaking change",
            "- [ ] Documentation update",
            "",
            "## Testing Done",
            "Describe how you tested these changes.",
            "",
            "## Checklist",
            "- [ ] Tests pass locally",
            "- [ ] Documentation updated",
            "- [ ] Lint checks pass",
            "- [ ] No breaking changes (or documented)",
            "",
            "## Related Issues",
            "Closes #",
        ]),
        TemplateType.CHANGELOG: "\n".join([
            "# Changelog — {{project-name}}",
            "",
            "All notable changes will be documented in this file.",
            "",
            "Format follows [Keep a Changelog](https://keepachangelog.com/).",
            "",
            "## [Unreleased]",
            "",
            "### Added",
            "- ",
            "",
            "### Changed",
            "- ",
            "",
            "### Fixed",
            "- ",
            "",
            "## [1.0.0] - YYYY-MM-DD",
            "",
            "### Added",
            "- Initial release",
        ]),
        TemplateType.CODE_OF_CONDUCT: "\n".join([
            "# Code of Conduct — {{project-name}}",
            "",
            "## Our Pledge",
            "We pledge to make participation a harassment-free experience for everyone.",
            "",
            "## Our Standards",
            "- Be respectful and inclusive",
            "- Accept constructive criticism gracefully",
            "- Focus on what is best for the community",
            "",
            "## Enforcement",
            "Project maintainers are responsible for clarifying acceptable behavior.",
            "",
            "## Attribution",
            "Adapted from the [Contributor Covenant](https://www.contributor-covenant.org/).",
        ]),
        TemplateType.DOCS_API: "\n".join([
            "# API Documentation — {{project-name}}",
            "",
            "## Authentication",
            "All requests require a Bearer token in the Authorization header.",
            "",
            "## Base URL",
            "```",
            "https://api.example.com/v1",
            "```",
            "",
            "## Endpoints",
            "",
            "### GET /resource",
            "Retrieve a list of resources.",
            "",
            "**Response:**",
            "```json",
            '{ "data": [], "total": 0 }',
            "```",
            "",
            "## Error Codes",
            "| Code | Description |",
            "|------|-------------|",
            "| 400  | Bad Request |",
            "| 401  | Unauthorized |",
            "| 404  | Not Found |",
            "| 500  | Internal Server Error |",
        ]),
        TemplateType.DOCS_GETTING_STARTED: "\n".join([
            "# Getting Started with {{project-name}}",
            "",
            "## Prerequisites",
            "- {{project-stack}} installed",
            "- Git",
            "",
            "## Quick Start",
            "",
            "```bash",
            "git clone https://github.com/your-org/{{project-name}}.git",
            "cd {{project-name}}",
            "npm install",
            "npm start",
            "```",
            "",
            "## Project Structure",
            "```",
            "├── src/          # Source code",
            "├── tests/        # Test files",
            "├── docs/         # Documentation",
            "└── package.json  # Dependencies",
            "```",
            "",
            "## Next Steps",
            "- Read the [API docs](./API.md)",
            "- Check out [Contributing](../CONTRIBUTING.md)",
        ]),
    }

    return content_map.get(template_type, f"# {template_type.value} template for {{{{project-name}}}}")


# --- Single template generation ---


def generate_template(
    session: CopilotSession,
    config: TemplateConfig,
    template_type: TemplateType,
) -> GeneratedTemplate:
    """Generate a single template using a structured Copilot prompt."""
    prompt = build_prompt(template_type, config)
    filename = TEMPLATE_FILENAMES[template_type]

    print(f"[Generate] Creating {template_type.value} template...")

    # Send prompt to Copilot — in production this returns real generated content
    session.send(prompt)

    # Use mock content for demonstration (replace with session response in production)
    content = mock_template_content(template_type, config)

    return GeneratedTemplate(type=template_type, filename=filename, content=content)


# --- Template customization ---


def customize_template(
    session: CopilotSession,
    template: GeneratedTemplate,
    instruction: str,
) -> GeneratedTemplate:
    """Refine an existing template with a customization instruction."""
    print(f'[Customize] Refining {template.type.value}: "{instruction}"')

    prompt = (
        f"Refine this {template.type.value} template based on the following instruction:\n"
        f'"{instruction}"\n\n'
        f"Current template:\n```markdown\n{template.content}\n```\n\n"
        f"Return the updated template in full."
    )

    session.send(prompt)

    return GeneratedTemplate(
        type=template.type,
        filename=template.filename,
        content=template.content + f"\n\n<!-- Customized: {instruction} -->",
    )


# --- Batch generation ---


def batch_generate(
    session: CopilotSession,
    config: TemplateConfig,
) -> list[GeneratedTemplate]:
    """Generate all configured templates in one batch."""
    results: list[GeneratedTemplate] = []

    for template_type in config.template_types:
        template = generate_template(session, config, template_type)
        results.append(template)

    return results


# --- Save templates to disk ---


def save_templates(templates: list[GeneratedTemplate], output_dir: str) -> None:
    """Write all generated templates to the output directory."""
    for template in templates:
        file_path = Path(output_dir) / template.filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(template.content, encoding="utf-8")

    print(f"[Saved] {len(templates)} templates written to {output_dir}")


# --- Project detection ---
# TODO: {{project-detection-strategy}} — customize for your project structure


def detect_project_info(project_dir: str) -> dict[str, str]:
    """Auto-detect project info from package.json or pyproject.toml."""
    # Try package.json (Node.js/TypeScript)
    package_json_path = Path(project_dir) / "package.json"
    if package_json_path.exists():
        try:
            pkg = json.loads(package_json_path.read_text(encoding="utf-8"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            frameworks: list[str] = []

            if "express" in deps:
                frameworks.append("Express")
            if "fastify" in deps:
                frameworks.append("Fastify")
            if "react" in deps:
                frameworks.append("React")
            if "next" in deps:
                frameworks.append("Next.js")
            if "vue" in deps:
                frameworks.append("Vue")
            if "typescript" in deps:
                frameworks.append("TypeScript")

            stack = f"Node.js + {' + '.join(frameworks)}" if frameworks else "Node.js"
            return {
                "project_name": pkg.get("name", Path(project_dir).name),
                "description": pkg.get("description", ""),
                "stack": stack,
            }
        except (json.JSONDecodeError, KeyError):
            pass

    # Try pyproject.toml (Python)
    pyproject_path = Path(project_dir) / "pyproject.toml"
    if pyproject_path.exists():
        try:
            import re

            content = pyproject_path.read_text(encoding="utf-8")
            name_match = re.search(r'^name\s*=\s*"(.+)"', content, re.MULTILINE)
            desc_match = re.search(r'^description\s*=\s*"(.+)"', content, re.MULTILINE)

            return {
                "project_name": name_match.group(1) if name_match else Path(project_dir).name,
                "description": desc_match.group(1) if desc_match else "",
                "stack": "Python",
            }
        except Exception:
            pass

    return {
        "project_name": Path(project_dir).name,
        "stack": "Unknown",
    }


# --- Main ---


def main() -> None:
    api_key = os.environ.get("{{API_KEY_VAR}}")
    if not api_key:
        raise RuntimeError("Missing {{API_KEY_VAR}} environment variable.")

    client = CopilotClient(api_key=api_key)
    client.start()

    try:
        # 1. Configure what to generate.
        # TODO: {{config-strategy}} — replace with interactive prompts or CLI args
        detected = detect_project_info(os.getcwd())
        config = TemplateConfig(
            project_name=detected.get("project_name", "{{project-name}}"),
            stack=detected.get("stack", "{{project-stack}}"),
            description=detected.get("description", "{{project-description}}"),
            template_types=[
                TemplateType.README,
                TemplateType.CONTRIBUTING,
                TemplateType.ISSUE_BUG,
                TemplateType.ISSUE_FEATURE,
                TemplateType.ISSUE_QUESTION,
                TemplateType.PULL_REQUEST,
            ],
        )

        print(f"[Config] Project: {config.project_name} | Stack: {config.stack}")

        session = client.create_session("template-gen")

        # 2. Batch-generate the full template suite.
        templates = batch_generate(session, config)

        # 3. Customize a template (example: make contributing guide more beginner-friendly).
        for i, t in enumerate(templates):
            if t.type == TemplateType.CONTRIBUTING:
                templates[i] = customize_template(
                    session,
                    t,
                    "{{customization-instruction}}",
                )
                break

        # 4. Save all templates to disk.
        save_templates(templates, config.output_dir)

        session.destroy()

    except Exception as e:
        print(f"[Error] {e}")

    finally:
        client.stop()


if __name__ == "__main__":
    main()
