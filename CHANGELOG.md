# Changelog

All notable changes to CopilotForge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - Phase 13: Path Awareness

### Added
- 10 build paths (A–J): 9 Power Platform paths + existing developer flow (Path J)
- forge-compass skill: silent path classifier with contradiction detection
- power-platform-guide skill: master routing oracle with decision matrix
- 9 path-specific skill files (studio-agent, studio-connector, declarative-agent, canvas-agent, power-automate, pcf-component, powerbi-report, sharepoint-agent, power-pages)
- 6 Power Platform agent templates
- 16 cookbook recipes (15 markdown + 1 TypeScript PCF skeleton)
- 9 per-path FORGE.md templates via getPlatformForge(path)
- BUILD_PATH dispatch in all 4 specialist agents
- forge-remember phrase support across all 13 skill files
- Path-change conflict detection with 3-choice resolution flow
- doctor.js path-aware prerequisite checks (Node≥16/pac for F, paconn for B/I, PBI note for G)
- templates.js modular split into cli/src/templates/ (8 files)

### Changed
- Planner wizard extended with path detection, PP diagnostic questions, FORGE-CONTEXT write step
- FORGE-CONTEXT schema extended with 5 new optional fields (BUILD_PATH, PATH_NAME, PREREQUISITES_CONFIRMED, EXTENSION_REQUIRED, MS_LEARN_ANCHOR)

### Improved
- **`--dry-run` flag on `init` and `uninstall`** — prints `[DRY RUN] Would create/delete: <file>` per file, exits 0 without writing anything
- **`devcontainer.json` for Codespaces** — Node 20 base image, Copilot + ESLint + Prettier extensions, deployed by `init`, enables one-click GitHub Codespaces setup
- **`doctor --json` flag** — machine-readable structured JSON output with checks array, summary, healthy flag, and exit code 1 on failures — enables CI automation
- **`fetch()` replaces `https` module in `dashboard.js`** — uses native `fetch` (Node 18+) for downloading Command Center; removes manual redirect handling
- **Pre-flight environment checks in `doctor`** — checks Node ≥18, git user.name, git user.email, VS Code CLI presence, GitHub Copilot extension presence
- **`--beginner` flag on `init`** — creates `BEGINNER_NOTES.md` per skill directory and `WHAT_THIS_MEANS.md` at repo root with plain-English explanations; adds friendly completion banner

### Fixed
- 9 jargon leaks in templates/agents/ and templates/utils/
- **Command Center v1.0.1** — graceful error handling for missing files, project health panel, source repo detection warning (auto-downloaded via `npx copilotforge dashboard`)

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
