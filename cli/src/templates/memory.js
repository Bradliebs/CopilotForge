'use strict';

const DECISIONS_MD = `# Decisions

Architecture and design decisions for this project.

| Date | Decision | Rationale |
|------|----------|-----------|
| ${new Date().toISOString().slice(0, 10)} | CopilotForge initialized | Scaffolded project with CopilotForge to get AI-assisted development up and running. |
`;

const PATTERNS_MD = `# Patterns

Coding conventions and patterns used in this project.

## Naming

(Describe your naming conventions here)

## File Structure

(Describe your file organization here)

## Code Style

(Describe your code style preferences here)
`;

const PREFERENCES_MD = `# Preferences

User preferences for CopilotForge behavior.

| Preference | Value |
|------------|-------|
| BUILD_PATH | J |
| Verbosity | normal |
| Auto-commit | false |
| Test framework | (auto-detect) |
`;

module.exports = { DECISIONS_MD, PATTERNS_MD, PREFERENCES_MD };