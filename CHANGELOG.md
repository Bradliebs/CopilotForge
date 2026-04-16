# Changelog

All notable changes to CopilotForge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-04-17

### Added
- **Memory conflict detection** — wizard compares remembered stack against manifest files, surfaces conflicts
- **`forge remember:` feedback loop** — AI writes decisions back to memory during sessions
- **Persistent experience level** — beginner/intermediate/advanced affects ongoing AI behavior, not just generation
- **Conversational cookbook** — ask for recipes mid-session ("forge recipe: error-handling")
- **Agent escalation logic** — agents have clear handoff language to route requests to the right specialist
- **Version stamping** — generated files include `<!-- copilotforge: vX.X.X -->` stamp
- **Doctor expansion** — checks Node version, git config, write permissions, version stamps
- **Non-TTY logging** — `ask()` and `menu()` log what defaults they use in piped/CI mode
- **The Ralph Loop** — consistent branding for the autonomous plan executor across all docs
- Error path tests, --yes e2e test, version stamp test

### Fixed
- `.catch()` wrappers on all CLI router commands (doctor, status, uninstall)
- `copyFile()` and `writeFile()` now throw beginner-friendly permission errors
- `gitCommit()` logs warnings for failed `git add` instead of silently swallowing
- Interactive mode: init/upgrade from menu auto-pass `--yes` (no nested prompts)
- Removed unnecessary `waitForEnter()` after doctor and upgrade in interactive mode
- Unsafe git diff fallback now logs a warning instead of silently continuing

## [1.4.0] - 2026-04-16

### Added
- `--yes` / `-y` flag for `init` and `upgrade` — skips all confirmation prompts
- Autonomous mode: auto-overwrite existing files, auto-commit to git
- `/yolo` detection in init-mode SKILL.md — AI assistants skip Phase 1 confirmation
- Flags section in CLI help text
- 4 new tests for `--yes` flag (46 total)
- Autonomous Mode section in GETTING-STARTED.md and README.md

### Fixed
- Git commit error messages now show stderr and helpful tips
- `upgrade --yes` / `upgrade -y` work as aliases for `--force`

## [0.5.0] - 2025-04-15

### Added
- Phase 5: Beginner polish pass (this release)
- Standalone FAQ with 15+ entries
- Example scaffolded projects
- Ralph Loop cookbook recipe (TypeScript and Python versions)
- Hello-world minimal recipe (TypeScript and Python versions)
- LICENSE, CONTRIBUTING.md, CHANGELOG.md, CODE_OF_CONDUCT.md
- Cross-platform documentation (PLATFORM NOTES in all recipes)
- Recipe troubleshooting guide
- GitHub issue and PR templates
- Expanded stack detection (Rust, PHP, Java, Ruby, Elixir)
- MCP explanation in HOW-IT-WORKS.md
- Monorepo guidance in GETTING-STARTED.md

## [0.4.0]

### Added
- Phase 4: Memory & iteration system
- Read-write learning loop
- Adaptive wizard for returning users
- Convention extraction and confidence levels
- preferences.md and history.md memory templates
- Memory reader/summarizer/convention-extractor specs

## [0.3.0]

### Added
- Phase 3: Cookbook layer
- 12 recipe pairs (TypeScript + Python) across 7 categories
- Stack detection (package.json, requirements.txt, go.mod, .csproj)
- FORGE.md live cookbook configuration
- Recipe template system

## [0.2.0]

### Added
- Phase 2: Wizard agent with specialist delegation
- 5-question guided wizard
- Transparent delegation protocol
- Specialist agent templates (internal)

### Fixed
- Jargon leak in user-facing templates

## [0.1.0]

### Added
- Phase 1: Planner skill
- SKILL.md with trigger phrases and wizard flow
- Initial template system
- Beginner-friendly validation suite

[1.4.0]: https://github.com/Bradliebs/CopilotForge/releases/tag/v1.4.0
[0.5.0]: https://github.com/Bradliebs/CopilotForge/releases/tag/v0.5.0
[0.4.0]: https://github.com/copilotforge/copilotforge/releases/tag/v0.4.0
[0.3.0]: https://github.com/copilotforge/copilotforge/releases/tag/v0.3.0
[0.2.0]: https://github.com/copilotforge/copilotforge/releases/tag/v0.2.0
[0.1.0]: https://github.com/copilotforge/copilotforge/releases/tag/v0.1.0
