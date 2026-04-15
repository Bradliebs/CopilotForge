# Contributing to CopilotForge

Thanks for considering contributing! CopilotForge is designed to make AI coding tools accessible to beginners, and your contributions help us reach that goal.

## How to Contribute

### Adding a Cookbook Recipe

Cookbook recipes are the hands-on examples that help people learn. Each recipe should have both TypeScript and Python versions.

**Structure:**
1. Create both `cookbook/recipe-name.ts` and `cookbook/recipe-name.py`
2. Follow the standard header format:
   ```
   WHAT THIS DOES: [1-2 sentence description]
   WHEN TO USE THIS: [Clear use case]
   HOW TO RUN: [Exact command to execute]
   PREREQUISITES: [Required tools/packages]
   EXPECTED OUTPUT: [What success looks like]
   PLATFORM NOTES: [OS-specific considerations]
   ```
3. Add your recipe to `cookbook/README.md` in the appropriate category
4. Create template versions in `templates/cookbook/` with `{{project-name}}` and `{{stack}}` placeholders

**Code Style:**
- We value clarity over cleverness. Write for beginners.
- Include error handling with helpful messages
- Add comments only when something needs clarification
- Test your recipe on a fresh environment

### Improving a Skill

Skills are trigger phrases that activate AI assistants. They live in `.github/skills/`.

**To improve a skill:**
1. Edit the `SKILL.md` file in the appropriate skill directory
2. Focus on clear trigger phrases that match how beginners think
3. Use the `.github/skills/planner/` skill as your reference example
4. Test your trigger phrases with an AI assistant
5. Avoid jargon — write for someone new to AI coding tools

**Key sections:**
- **Trigger Phrases:** Natural language commands that activate the skill
- **What It Does:** Clear, benefit-focused description
- **How It Works:** Step-by-step flow the assistant follows

### Adding an Agent Definition

Agent definitions live in `.copilot/agents/` and configure how AI assistants behave.

**To add an agent:**
1. Create a `.md` file in `.copilot/agents/`
2. Follow the structure of existing agent files:
   - Role and purpose
   - Expertise areas
   - Instructions for the AI assistant
3. Keep language beginner-friendly
4. Test your agent with a real AI assistant

### Reporting Bugs or Requesting Features

**Found a bug?** Open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Your environment (OS, AI assistant, Node/Python version)

**Have an idea?** Open a feature request with:
- Description of the feature
- Use case — who benefits and how
- Proposed solution (if you have one)

## Testing Requirements

Before submitting a pull request:

1. Run relevant validators in the `tests/` directory
2. Test your changes in a clean environment
3. Verify no jargon leaks into beginner-facing content
4. Update documentation if your changes affect how people use CopilotForge

For documentation changes, manual review is usually sufficient.

## Code of Conduct

We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and welcoming to contributors of all skill levels.

## Questions?

Open an issue — we're here to help!
