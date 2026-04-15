# Project Context

- **Owner:** Brad Liebs
- **Project:** CopilotForge — a beginner-friendly framework that takes plain-English project descriptions and scaffolds Copilot skills, agents, memory, and cookbook recipes into any repo. No CLI required. Works in VS Code Copilot, Claude Code, or copy-paste. Competes with Squad by inverting the learning curve: describe your goal, get a structured repo.
- **Stack:** Markdown (SKILL.md, agent definitions), TypeScript/Node.js (cookbook recipes), Git (everything commits)
- **Phases:** 1) Planner skill (zero-install entry point), 2) Wizard agent (5-question intake), 3) Cookbook layer (SDK recipe templates), 4) Memory & iteration (decisions.md compounds across sessions)
- **Key output structure:** .copilot/agents/, .github/skills/, forge-memory/, cookbook/, FORGE.md
- **Created:** 2026-04-15

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **2026-04-15 — Phase 1 validation plan created.** Five test artifacts: README, bash validator, PS1 validator, 24 test scenarios, and a beginner QA checklist. Scripts validate output structure, FORGE.md content, SKILL.md frontmatter, cookbook syntax, and cross-reference consistency.
- **2026-04-15 — Re-run behavior is undefined.** EC-05 (scaffold over existing project) can't be fully tested until the team decides merge vs. overwrite vs. refuse. Flagged in decisions inbox.
- **2026-04-15 — No automated wizard test harness yet.** Scenarios are manual because the wizard is conversational. A non-interactive Planner mode or conversation simulator would unlock CI coverage.
- **2026-04-15 — Beginner-friendly is a testable claim.** The beginner checklist treats UX clarity as a pass/fail gate, not a nice-to-have. Recommend testing with an actual beginner, not a team member.

- **2026-04-15: Team delivered Phase 1.** Morpheus, Trinity, Neo all coordinated on contract, skill, and templates. 24 scenarios and validators confirm Phase 1 scope met.

- **2026-04-15 — Phase 2 test suite created.** Six deliverables: test-scenarios.md (40 scenarios across 5 categories), validate-delegation.ps1, validate-delegation.sh, rerun-scenarios.md (full re-run behavior matrix), beginner-checklist.md (Phase 2 specific), and updated tests/README.md.
- **2026-04-15 — Jargon leaks are real.** Phase 2 validator immediately caught specialist agent names (skill-writer, agent-writer, etc.) leaking into user-facing templates: FORGE.md template and all 4 specialist agent definition templates. 24 jargon leak failures. Neo needs to scrub these before Phase 2 ships — internal names belong in docs/delegation-protocol.md only, not in files users see.
- **2026-04-15 — Phase 1 has 6 pre-existing failures.** Missing forge-memory/ directory and files, missing FORGE.md, missing reviewer.md and tester.md agents. These are from the framework repo (not a scaffolded project), so expected — but confirms Phase 1 validators need a scaffolded output to run against, not the framework source itself.
- **2026-04-15 — Template placeholders trip cross-reference checks.** Skill references like `.github/skills/{name}` in templates are valid template syntax but fail the "skill exists" check. Fixed validators to skip `{...}` patterns and report as warnings instead.
- **2026-04-15 — Re-run behavior needs team decision.** Defined 7 re-run principles in rerun-scenarios.md. Key undecided: should deleted generated files be re-created? Tank recommends yes-with-warning. Also: memory=no on re-run should NEVER delete existing forge-memory/. Filed in decisions inbox.
- **2026-04-15 — Jargon leak fix VALIDATED.** Neo and Trinity's fix confirmed clean: zero jargon leaks in user-facing templates (FORGE.md, planner.md, reviewer.md, tester.md). Specialist templates correctly moved to templates/internal/agents/ (4 files). planner.md has clean two-layer structure with Internal Delegation Protocol subsection hidden from users. Both Phase 2 validator and independent manual scan agree: CLEAN.
- **2026-04-15 — Validator scripts need UTF-8 BOM for PS 5.1.** Both validate-scaffold.ps1 and validate-delegation.ps1 used Unicode chars (✓, ✗, ⚠, ═) without UTF-8 BOM. Windows PowerShell 5.1 defaults to ANSI encoding, causing cascading parse failures. Fix: added BOM to both files. Any new .ps1 files with Unicode must include BOM.


## 2026-04-15 --- Phase 2.1: Jargon Validation
Duration: 212s | Tool Calls: 20 | Status: PASS

Validated Phase 2.1 jargon fix. Ran Phase 2 validator and manual scan. Fixed UTF-8 BOM in validator scripts. Result: Zero jargon leaks, no regressions.


- **2026-04-15 — Phase 4 test suite created.** Four deliverables: test-scenarios.md (58 scenarios across 8 categories), validate-memory.ps1 (UTF-8 BOM, 10 check categories), validate-memory.sh (bash equivalent), and beginner-checklist.md (Phase 4 memory UX checklist). Updated tests/README.md with Phase 4 section and file index.
- **2026-04-15 — Phase 4 baseline run: 38 PASS, 7 FAIL.** All 10 new files exist. SKILL.md, planner.md, memory-writer.md, FORGE.md all pass structural checks. Recipe quality (headers, imports, error handling, TODO) all pass for both .ts and .py. Template placeholders pass. README completeness passes. 7 jargon leaks detected: 2 in utility spec templates (specialist), 5 in docs/phase4-architecture.md (all 4 agent names + specialist). Filed in decisions inbox for Neo/Trinity to remediate.

## 2026-04-15 --- Phase 4: Test Suite Creation
Duration: ~5min | Tool Calls: 25+ | Status: COMPLETE (7 jargon fails pending remediation)

Created Phase 4 test suite covering memory read-back, adaptive wizard, convention learning, cross-session compounding, memory safety, FORGE.md surface, jargon leaks, and beginner experience. Validator confirms Phase 4 implementation is structurally sound — only jargon scrubbing remains.

- **2026-04-15 — Doc validation suite created.** Three deliverables: doc-quality-checklist.md (30-item manual review checklist), validate-docs.ps1 (UTF-8 BOM, 6 check categories), validate-docs.sh (bash equivalent). Checks file existence, README structure, jargon leaks (strips code blocks first), relative link integrity, minimum content thresholds, and beginner friendliness signals. Baseline run: 10 FAIL / 6 WARN — all expected because Trinity hasn't committed docs yet. Updated tests/README.md with doc validation section and file index.

## 2026-04-15 --- Final QA Validation Pass
Duration: ~8min | Tool Calls: 18 | Status: 24 PASS / 4 FAIL / 3 WARN

Ran comprehensive final QA validation covering 9 check categories: internal links (487 scanned, 7 broken), cross-references (all main docs verified), recipe format (40 recipes, 100% pass), CHEATSHEET completeness (warning: different organization than README), CLI template sync (byte-for-byte match), Q6 consistency (5 docs checked, all consistent), jargon leaks (zero in user-facing docs), CLI package.json (valid), and license file (present). 

**Key findings:** 3 broken links in .github/TEMPLATE_INSTRUCTIONS.md (missing `../` prefix to docs/), 1 GitHub-specific URL in README that validator flags but GitHub renders correctly. All recipe headers present, zero jargon leaks, CLI templates in sync, Q6 documented consistently across 5 locations. CHEATSHEET uses goal-based organization (intentional redesign) instead of matching README categories 1:1 — flagged as warning, not failure.

**Learnings:**
- **Link validation needs GitHub-aware logic.** `../../issues` is valid GitHub shorthand but looks broken to file-based validators. Consider allowlist for known GitHub patterns.
- **Category alignment warnings are noisy.** CHEATSHEET deliberately reorganizes content by skill level (better UX) rather than mirroring README's categorical structure. This is correct design, not a defect. Future validators should check recipe presence, not section header matching.
- **TS-only recipes are intentional.** delegation-example and skill-creation-example are TS-only because they show meta-patterns (generating SKILL.md files programmatically). Python equivalents add no pedagogical value. Documented as intentional in findings.
- **Test file example links trip validators.** Checklist items like `[filename](./path)` in beginner-checklist.md are teaching examples, not real links. Validator needs test file exclusion pattern.

**Recommendation:** SHIP after fixing 3 TEMPLATE_INSTRUCTIONS.md links. 89% pass rate (24/27). All blocking issues resolved except one 5-minute fix. Filed detailed findings in .squad/decisions/inbox/tank-qa-findings.md.
