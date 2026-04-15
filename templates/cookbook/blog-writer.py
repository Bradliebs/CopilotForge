"""
blog-writer.py — CopilotForge Cookbook Recipe

Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/document-code/write-discussions-or-blog-posts

WHAT THIS DOES:
    Generates blog posts and discussion drafts from your PRs, issues, and code
    changes using a multi-step prompt pipeline (brainstorm → outline → draft → refine).

WHEN TO USE THIS:
    When you need to write a blog post about recent work, create a discussion
    post for your team, or generate release notes from PR activity.

HOW TO RUN:
    1. pip install {{SDK_PACKAGE}}
    2. Set your API key:
         bash/zsh:     export {{API_KEY_VAR}}="your-key-here"
         PowerShell:   $env:{{API_KEY_VAR}}="your-key-here"
         Windows cmd:  set {{API_KEY_VAR}}=your-key-here
    3. python cookbook/blog-writer.py

PREREQUISITES:
    - Python 3.10+
    - A valid {{API_KEY_VAR}}

EXPECTED OUTPUT:
    [BlogWriter] Starting content pipeline...
    [Stage 1] Brainstorming topics from 3 PRs...
    [Ideas] 5 topic suggestions generated
    [Stage 2] Outlining: "How We Improved Auth Performance by 3x"
    [Outline] 6 sections with key points
    [Stage 3] Drafting full post...
    [Draft] 1,200 words generated
    [Stage 4] Refining for developer audience...
    [Final] Blog post saved to blog-draft.md

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join()
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)

SOURCE:
    Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/document-code/write-discussions-or-blog-posts
"""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal, Optional


# --- Types ---


Audience = Literal["developer", "general", "internal"]
Tone = Literal["technical", "casual", "formal"]
Stage = Literal["brainstorm", "outline", "draft", "refine"]


@dataclass
class BlogConfig:
    """Configuration for the blog writing pipeline."""

    pr_numbers: list[int]
    issue_numbers: list[int]
    repo_name: str
    audience: Audience = "developer"
    tone: Tone = "technical"
    output_path: str = "blog-draft.md"


@dataclass
class BlogPromptTemplate:
    """A single prompt template used by the pipeline."""

    stage: Stage
    audience: Audience
    tone: Tone
    template: str


@dataclass
class BlogIdea:
    """A blog topic suggestion from the brainstorm stage."""

    index: int
    title: str
    angle: str


@dataclass
class OutlineSection:
    """A section in the blog outline."""

    heading: str
    key_points: list[str] = field(default_factory=list)


@dataclass
class DraftResult:
    """Result of the draft stage."""

    title: str
    markdown: str
    word_count: int


# --- Mock SDK (replace with real import) ---
# TODO: Replace with: from {{SDK_MODULE}} import CopilotClient


class CopilotSession:
    """Represents an interactive Copilot session."""

    def __init__(self, session_id: str) -> None:
        self.id = session_id

    def send(self, message: str) -> str:
        # TODO: Real SDK generates content from the prompt.
        return f'[Copilot] Generated content for: "{message[:80]}..."'

    def destroy(self) -> None:
        pass


class CopilotClient:
    """Minimal Copilot client."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def start(self) -> None:
        print("[Client] Starting...")

    def create_session(self) -> CopilotSession:
        return CopilotSession(f"blog_{int(time.time())}")

    def stop(self) -> None:
        print("[Client] Stopped.")


# --- Prompt Templates ---
# These templates are adapted from the GitHub Copilot Chat Cookbook patterns.
# Customize them to fit your project's voice and context.

PROMPT_TEMPLATES: dict[Stage, list[BlogPromptTemplate]] = {
    "brainstorm": [
        BlogPromptTemplate(
            stage="brainstorm",
            audience="developer",
            tone="technical",
            template=(
                "I've worked on PRs {pr_numbers} in the {repo_name} repository. "
                "Suggest 5 blog topics highlighting unique technical challenges or solutions. "
                "For each, provide a title and a one-sentence angle describing what makes it interesting."
            ),
        ),
        BlogPromptTemplate(
            stage="brainstorm",
            audience="general",
            tone="casual",
            template=(
                "We released new features in PRs {pr_numbers} for {repo_name}. "
                "Propose 5 blog angles a non-technical reader would enjoy: "
                "major user-facing changes, lessons learned, and community benefit."
            ),
        ),
        BlogPromptTemplate(
            stage="brainstorm",
            audience="internal",
            tone="formal",
            template=(
                "Our team closed PRs {pr_numbers} and issues {issue_numbers} in {repo_name}. "
                "Suggest 5 internal discussion topics covering: architectural decisions, "
                "process improvements, and knowledge worth sharing with the wider org."
            ),
        ),
    ],
    "outline": [
        BlogPromptTemplate(
            stage="outline",
            audience="developer",
            tone="technical",
            template=(
                'Propose a detailed outline for a blog post titled "{title}" based on '
                "PRs {pr_numbers} and issues {issue_numbers} in {repo_name}. "
                "Include sections for: introduction, problem statement, technical approach, "
                "code highlights, results, and next steps. Each section should have 2-3 key points."
            ),
        ),
        BlogPromptTemplate(
            stage="outline",
            audience="general",
            tone="casual",
            template=(
                'Create an outline for a blog post titled "{title}" about our work in {repo_name}. '
                "Include sections for: hook/introduction, what changed and why it matters, "
                "user-facing improvements, behind-the-scenes highlights, and what's coming next."
            ),
        ),
        BlogPromptTemplate(
            stage="outline",
            audience="internal",
            tone="formal",
            template=(
                'Draft an outline for an internal discussion post titled "{title}" covering '
                "PRs {pr_numbers} and issues {issue_numbers}. Include: executive summary, "
                "scope of changes, design decisions, trade-offs, metrics/impact, and open questions."
            ),
        ),
    ],
    "draft": [
        BlogPromptTemplate(
            stage="draft",
            audience="developer",
            tone="technical",
            template=(
                'Write a blog post titled "{title}" for a developer audience. '
                "Use this outline:\n{outline}\n\n"
                "Context: This is based on work in {repo_name}, PRs {pr_numbers}. "
                "Include code snippets where relevant. Highlight user benefits and suggest next steps. "
                "Target around 1,000-1,500 words. Use markdown formatting."
            ),
        ),
        BlogPromptTemplate(
            stage="draft",
            audience="general",
            tone="casual",
            template=(
                'Write a friendly, approachable blog post titled "{title}". '
                "Use this outline:\n{outline}\n\n"
                "This is about recent work in {repo_name}. Explain what changed and why it's exciting "
                "without assuming deep technical knowledge. Keep it around 800-1,200 words. Use markdown."
            ),
        ),
        BlogPromptTemplate(
            stage="draft",
            audience="internal",
            tone="formal",
            template=(
                'Write an internal discussion post titled "{title}". '
                "Use this outline:\n{outline}\n\n"
                "This covers PRs {pr_numbers} and issues {issue_numbers} in {repo_name}. "
                "Be thorough on design decisions and trade-offs. Include links to relevant PRs/issues. "
                "Target 1,000-1,500 words. Use markdown formatting."
            ),
        ),
    ],
    "refine": [
        BlogPromptTemplate(
            stage="refine",
            audience="developer",
            tone="technical",
            template=(
                "Refine this blog post draft for a developer audience. Improve the technical accuracy, "
                "add better code examples where needed, and ensure the conclusion has clear next steps "
                "and a call to action.\n\nDraft:\n{draft}"
            ),
        ),
        BlogPromptTemplate(
            stage="refine",
            audience="general",
            tone="casual",
            template=(
                "Rewrite this blog post to be more engaging and approachable. "
                "Simplify jargon, add a compelling introduction hook, and make the conclusion "
                'feel more inviting. Add a "what\'s next" section.\n\nDraft:\n{draft}'
            ),
        ),
        BlogPromptTemplate(
            stage="refine",
            audience="internal",
            tone="formal",
            template=(
                "Refine this internal discussion post. Strengthen the executive summary, "
                "add a section on upcoming milestones and open issues, and include "
                "community engagement opportunities. Make it suitable for a company-wide audience."
                "\n\nDraft:\n{draft}"
            ),
        ),
    ],
}


# --- Prompt Builder ---


def build_prompt(
    stage: Stage,
    config: BlogConfig,
    extra: Optional[dict[str, str]] = None,
) -> str:
    """Build a prompt by selecting the best template and filling placeholders."""
    templates = PROMPT_TEMPLATES[stage]
    extra = extra or {}

    match = next(
        (t for t in templates if t.audience == config.audience and t.tone == config.tone),
        templates[0],
    )

    prompt = match.template
    prompt = prompt.replace("{pr_numbers}", ", ".join(f"#{n}" for n in config.pr_numbers))
    prompt = prompt.replace("{issue_numbers}", ", ".join(f"#{n}" for n in config.issue_numbers))
    prompt = prompt.replace("{repo_name}", config.repo_name)

    for key, value in extra.items():
        prompt = prompt.replace(f"{{{key}}}", value)

    return prompt


# --- Stage 1: Brainstorm ---


def generate_blog_ideas(session: CopilotSession, config: BlogConfig) -> list[BlogIdea]:
    """Brainstorm blog topics from PR/issue context."""
    print(f"[Stage 1] Brainstorming topics from {len(config.pr_numbers)} PRs...")

    prompt = build_prompt("brainstorm", config)
    response = session.send(prompt)

    # TODO: Parse real Copilot response into structured ideas.
    ideas = [
        BlogIdea(
            index=1,
            title="How We Improved Auth Performance by 3x",
            angle="Deep dive into the caching strategy that cut login times dramatically.",
        ),
        BlogIdea(
            index=2,
            title="Lessons from Migrating to the New API Gateway",
            angle="What went wrong, what went right, and what we'd do differently.",
        ),
        BlogIdea(
            index=3,
            title="Building a Developer-Friendly Error Handling System",
            angle="How structured error codes improved our debugging workflow.",
        ),
        BlogIdea(
            index=4,
            title=f"Release Highlights: What's New in {config.repo_name}",
            angle="A roundup of the most impactful changes from recent PRs.",
        ),
        BlogIdea(
            index=5,
            title="From Issue to Production: Our PR Review Pipeline",
            angle="How we streamlined code review to ship features faster.",
        ),
    ]

    print(f"[Ideas] {len(ideas)} topic suggestions generated")
    return ideas


# --- Stage 2: Outline ---


def outline_blog_post(
    session: CopilotSession,
    config: BlogConfig,
    title: str,
) -> list[OutlineSection]:
    """Create a detailed outline for the chosen topic."""
    print(f'[Stage 2] Outlining: "{title}"')

    prompt = build_prompt("outline", config, {"title": title})
    response = session.send(prompt)

    # TODO: Parse real Copilot response into structured sections.
    sections = [
        OutlineSection(
            heading="Introduction",
            key_points=[
                "Hook: the problem we set out to solve",
                "Brief context on the project and its users",
            ],
        ),
        OutlineSection(
            heading="The Problem",
            key_points=[
                "What was slow or broken",
                "Impact on users and developer experience",
            ],
        ),
        OutlineSection(
            heading="Our Approach",
            key_points=[
                "High-level technical strategy",
                "Key design decisions and trade-offs",
                "Code highlights or architecture diagrams",
            ],
        ),
        OutlineSection(
            heading="Results",
            key_points=[
                "Before/after metrics",
                "User feedback and team reactions",
            ],
        ),
        OutlineSection(
            heading="Lessons Learned",
            key_points=[
                "What surprised us",
                "What we'd do differently next time",
            ],
        ),
        OutlineSection(
            heading="What's Next",
            key_points=[
                "Upcoming milestones and open issues",
                "Community engagement opportunities",
            ],
        ),
    ]

    print(f"[Outline] {len(sections)} sections with key points")
    return sections


# --- Stage 3: Draft ---


def format_outline_for_prompt(sections: list[OutlineSection]) -> str:
    """Format an outline into text suitable for a prompt."""
    parts: list[str] = []
    for s in sections:
        points = "\n".join(f"- {p}" for p in s.key_points)
        parts.append(f"## {s.heading}\n{points}")
    return "\n\n".join(parts)


def draft_blog_post(
    session: CopilotSession,
    config: BlogConfig,
    title: str,
    sections: list[OutlineSection],
) -> DraftResult:
    """Generate a full draft from the outline."""
    print("[Stage 3] Drafting full post...")

    outline_text = format_outline_for_prompt(sections)
    prompt = build_prompt("draft", config, {"title": title, "outline": outline_text})
    response = session.send(prompt)

    # TODO: Use real Copilot response as the draft body.
    pr_refs = ", ".join(f"#{n}" for n in config.pr_numbers)
    lines = [
        f"# {title}",
        "",
        f"*Published from {config.repo_name} — PRs {pr_refs}*",
        "",
    ]
    for s in sections:
        points = "\n".join(f"- {p}" for p in s.key_points)
        lines.append(f"## {s.heading}\n\n{points}\n")
        lines.append("<!-- TODO: Expand this section with full prose from Copilot response -->\n")

    lines.extend([
        "---",
        "",
        "*Generated by the blog-writer recipe. Edit and polish before publishing.*",
    ])

    markdown = "\n".join(lines)
    word_count = len(markdown.split())
    print(f"[Draft] {word_count:,} words generated")

    return DraftResult(title=title, markdown=markdown, word_count=word_count)


# --- Stage 4: Refine ---


def refine_draft(
    session: CopilotSession,
    config: BlogConfig,
    draft: DraftResult,
) -> DraftResult:
    """Improve the draft's tone, accuracy, and engagement."""
    print(f"[Stage 4] Refining for {config.audience} audience...")

    prompt = build_prompt("refine", config, {"draft": draft.markdown})
    response = session.send(prompt)

    # TODO: Use real Copilot response as the refined version.
    refined = draft.markdown + f"\n\n<!-- Refined for {config.audience} audience, {config.tone} tone -->\n"
    word_count = len(refined.split())

    return DraftResult(title=draft.title, markdown=refined, word_count=word_count)


# --- Display Helpers ---


def display_ideas(ideas: list[BlogIdea]) -> None:
    """Print blog topic suggestions in a readable format."""
    print("\n--- Blog Topic Suggestions ---")
    for idea in ideas:
        print(f"  {idea.index}. {idea.title}")
        print(f"     → {idea.angle}")
    print()


def display_outline(sections: list[OutlineSection]) -> None:
    """Print the blog outline in a readable format."""
    print("\n--- Blog Outline ---")
    for section in sections:
        print(f"  ## {section.heading}")
        for point in section.key_points:
            print(f"     - {point}")
    print()


# --- Main Pipeline ---


def main() -> None:
    api_key = os.environ.get("{{API_KEY_VAR}}")
    if not api_key:
        raise RuntimeError("Missing {{API_KEY_VAR}} environment variable.")

    # Default configuration — customize or accept from CLI args.
    # TODO: Add argparse CLI argument parsing for config overrides.
    config = BlogConfig(
        pr_numbers=[142, 145, 148],
        issue_numbers=[87, 92],
        repo_name="{{repo-owner}}/{{repo-name}}",
        audience="developer",
        tone="technical",
        output_path="blog-draft.md",
    )

    print("[BlogWriter] Starting content pipeline...")

    client = CopilotClient(api_key=api_key)
    client.start()
    session = client.create_session()

    try:
        # Stage 1: Brainstorm topics.
        ideas = generate_blog_ideas(session, config)
        display_ideas(ideas)

        pick_str = input("Pick a topic number (1-5): ")
        try:
            pick_index = int(pick_str)
        except ValueError:
            pick_index = 1
        chosen = next((i for i in ideas if i.index == pick_index), ideas[0])
        print(f'\n[Selected] "{chosen.title}"\n')

        # Stage 2: Outline the chosen topic.
        sections = outline_blog_post(session, config, chosen.title)
        display_outline(sections)

        approve = input("Approve this outline? (yes/no): ")
        if approve.lower() not in ("yes", "y"):
            print("[BlogWriter] Outline not approved. Exiting pipeline.")
            return

        # Stage 3: Draft the full post.
        draft = draft_blog_post(session, config, chosen.title, sections)

        # Stage 4: Refine the draft.
        tone_choice = input(f'Refine tone? ({config.tone}/casual/formal, or "skip"): ')
        if tone_choice.lower() == "skip":
            final_draft = draft
        else:
            refine_tone: Tone = (
                tone_choice if tone_choice in ("technical", "casual", "formal") else config.tone
            )
            refine_config = BlogConfig(
                pr_numbers=config.pr_numbers,
                issue_numbers=config.issue_numbers,
                repo_name=config.repo_name,
                audience=config.audience,
                tone=refine_tone,
                output_path=config.output_path,
            )
            final_draft = refine_draft(session, refine_config, draft)

        # Save to file.
        output_path = Path(config.output_path).resolve()
        output_path.write_text(final_draft.markdown, encoding="utf-8")
        print(f"[Final] Blog post saved to {config.output_path}")

    except (EOFError, KeyboardInterrupt):
        print("\n[BlogWriter] Interrupted.")
    except Exception as e:
        print(f"[Error] {e}")
    finally:
        session.destroy()
        client.stop()


if __name__ == "__main__":
    main()
