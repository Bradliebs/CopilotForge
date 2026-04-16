## D14-01 — 2026-04-16 — PRD Immediate Wins Approved
Brad approved Morpheus's roadmap. Six immediate wins running in parallel with Phase 13.
Rationale: Immediate wins are disjoint from Phase 13 (touch different files). No merge conflict risk.
Owner: Neo
# Squad Decisions

## Active Decisions

### Architecture: Phase 2 Wizard Orchestrator with Transparent Delegation
**Source:** Morpheus, Trinity, Neo
**Date:** 2026-04-15
**Status:** Implemented

The Planner agent orchestrates four internal specialists via transparent delegation:
- **skill-writer** — generates SKILL.md files
- **agent-writer** — generates agent definition files (never touches planner.md)
- **memory-writer** — generates forge-memory files (append-only on re-runs)
- **cookbook-writer** — generates cookbook recipes

Users see only the Planner. Specialists are invisible internal agents with strict input/output contracts.

**Key Design Principles:**
1. Transparent delegation — users don't see internal plumbing
2. Sequential instruction loading — works in any LLM context
3. FORGE-CONTEXT block for data passing between specialists
4. skill-writer runs before agent-writer (ordering dependency)
5. memory-writer parallel-eligible with cookbook-writer
6. Planner generates FORGE.md itself (not delegated)
7. Skip-on-exist for generated files
8. Append-only for decisions.md
9. Regenerate FORGE.md with user confirmation
10. Specialist agents are CopilotForge internals (not user-visible)
11. Target repo output unchanged from Phase 1
12. Section-level FORGE.md merge deferred to Phase 3
13. Each specialist has a self-check protocol
14. cookbook/README.md always regenerated

**Deferred to Future Phases:**
- FORGE.md as live config surface (Phase 3)
- Section-level merge for FORGE.md re-runs (Phase 3)
- Custom specialist agents (Phase 3)
- Parallel agent spawning runtime (Phase 3)
- Memory iteration across sessions (Phase 4)
- User-defined skill types in wizard (Phase 4)
- Plugin system for cookbook recipes (Phase 4)
- CI/CD integration (Phase 4)
- Multi-repo scaffolding (Phase 4)

**Files Created/Updated:**
- .copilot/agents/planner.md — Wizard orchestrator
- .copilot/agents/skill-writer.md — SKILL.md generator specialist
- .copilot/agents/agent-writer.md — Agent definition generator specialist
- .copilot/agents/memory-writer.md — Memory file generator specialist
- .copilot/agents/cookbook-writer.md — Cookbook recipe generator specialist
- templates/agents/planner.md — Updated to redirect to canonical agent
- docs/delegation-protocol.md — Full protocol spec
- templates/utils/rerun-detection.md — Re-run detection spec
- .github/skills/planner/SKILL.md — Updated with delegation instructions
- reference.md — Updated with FORGE-CONTEXT spec and re-run rules

---

### Re-Run Strategy: Skip-On-Exist with Append-Only Memory
**Source:** Neo, Tank
**Date:** 2026-04-15
**Status:** Pending Consensus on 3 Sub-Scenarios

**Core Decision:**
- Never overwrite user-edited files. Generated files use skip-if-exists pattern.
- FORGE.md gets section-level merge (deferred to Phase 3; currently confirm-and-replace)
- decisions.md gets append-only protocol
- patterns.md gets additive merge
- Partial scaffolding is acceptable if one specialist fails

**Open Sub-Decisions (Tank — 2b):**

1. **Should deleted generated files be re-created?**
   - Scenario: User deletes .copilot/agents/reviewer.md, then re-runs
   - Recommendation: Yes, re-create with warning
   - Rationale: Users who deliberately deleted it can delete again; accidental deletions recover

2. **What happens when memory=no on re-run but forge-memory/ exists?**
   - Scenario: First run with memory=yes creates forge-memory/. Second run with memory=no.
   - Recommendation: PRESERVE directory and warn. Never delete user data.
   - Rationale: User may have added custom entries. Deletion is unrecoverable.

3. **What does "merge" mean for FORGE.md?**
   - Scenario: User added custom sections. Re-run needs to update generated tables.
   - Questions: Use markers/comments to identify generated vs. user content?
   - Recommendation: Use HTML comments as merge markers (e.g., <!-- forge:generated -->)

**Impact:**
- All specialist agent templates use {{placeholder}} syntax from Phase 1
- Delegation protocol documented at docs/delegation-protocol.md
- Re-run detection spec at templates/utils/rerun-detection.md

---

### Known Issue: Jargon Leak in User-Facing Templates
**Source:** Tank (Critical Finding)
**Date:** 2026-04-16
**Status:** In Discussion

Tank discovered that user-facing templates (SKILL.md, agents/*.md) expose internal jargon inconsistently:

**Examples Found:**
- "forge remember" (internal CLI) vs "Save decision" (UI)
- "skill" vs "ability" vs "tool" (inconsistent terminology)
- "iteration" (developer concept) exposed in agent output
- Filenames like "IMPLEMENTATION_PLAN.md" shown to non-technical users
- Error messages reference technical paths instead of user-friendly context

**Recommendation:** Audit all user-facing text in templates/ directory. Create jargon-mapping.md for consistent terminology across tools and UI.

**Deferred Action:** Phase 3 jargon audit and mapping.

---

### CopilotForge Command Center — Build Complete
**Source:** Neo (Developer)
**Date:** 2026-04-16
**Status:** Complete, Testing Phase

Built complete Electron desktop application for monitoring CopilotForge workflows at copilotforge-command-center.

**Application Features:**
1. **Ralph Loop Monitor** — Real-time iteration counter, pause/resume, current task display
2. **Implementation Plan Tracker** — Visual task list with progress bar
3. **Squad Dashboard** — Team member activity and current tasks
4. **Git Integration** — Last 10 commits with phase-13 highlighting
5. **Forge Memory Browser** — Decision log viewer and logger
6. **Scratch Notes** — Collapsible notepad with localStorage

**Tech Stack:**
- Electron 40 + React 19 + TypeScript + Vite + Tailwind 4
- File watching with fs.watch() and debouncing
- IPC for live updates
- better-sqlite3 (inherited, not yet used)

**Key Files Created:**
- electron/readers.cjs — File parsing
- electron/watcher.cjs — File monitoring
- 6 widget components (RalphWidget, PlanWidget, SquadWidget, GitWidget, MemoryWidget, ScratchWidget)
- useForgeData hook
- TypeScript interfaces

**Status:** Build successful, TypeScript clean, ready for live testing with Oracle_Prime project.

---

### Widget Button UX Pattern
**Source:** Neo (Developer)
**Date:** 2026-04-16
**Status:** Implemented (5 Commits)

Implemented "copy-to-clipboard prompt" pattern for all Command Center widgets to help non-developer users interact with Copilot effectively.

**Pattern Description:**
Each widget now includes strategically placed buttons that:
1. Copy well-formed Copilot prompts to clipboard
2. Use conversational language (e.g., "What is Ralph working on right now?")
3. Include context hints (e.g., "Check IMPLEMENTATION_PLAN.md")
4. Match the user's mental model (asking questions vs running commands)

**Example Buttons:**
- "💬 What is it doing?" → copies: "What is Ralph working on right now? Check the latest git commit and IMPLEMENTATION_PLAN.md for context."
- "💬 Ask Copilot about changes" → copies: "Look at the recent git commits and explain what changed in plain English."

**Benefits:**
- Lowers barrier to entry for non-technical users
- Teaches best practices through example prompts
- Reduces cognitive load (don't need to remember syntax)
- Maintains consistency across all widgets
- Enables self-service troubleshooting

**Implementation:**
- RalphWidget: Most comprehensive — different prompts for running/idle states
- All widgets: Consistent button styling (gray utility buttons with emoji prefixes)
- Empty states: Educational explanations + actionable next steps
- File operations: Direct "open file" buttons using electronAPI.forge.openFile()

**Team Relevance:** This pattern should be used in future dashboard/UI work for CopilotForge tooling. Consider it the standard for making complex automation accessible to non-developers.

---

### Command Center UX Baseline Assessment
**Source:** Tank (Tester)
**Date:** 2026-04-16
**Status:** Complete

Performed comprehensive beginner UX review of Command Center widgets (before and after Neo's button pass) using Brad persona (non-developer, non-technical background).

**Critical Issues Found (Pre-Patch):**
1. **Ralph Widget** — No start button visible; "resume loop" is developer jargon
2. **Ralph Widget** — Error message "No ralph-status.json detected" exposes internal filenames
3. **Ralph Widget** — No explanation of what Ralph does or what "loop" means
4. **Ralph Widget** — "current iteration" is jargon; beginners don't understand workflow phases
5. **Plan Widget** — "No IMPLEMENTATION_PLAN.md found" exposes developer filename
6. **Plan Widget** — Widget is read-only; no CTA to create a plan
7. **Plan Widget** — Symbols (●, ○, ✕) lack legend or tooltips
8. **Plan Widget** — "PHASE PLAN" is vague
9. **Memory Widget** — "log a decision" is unclear in purpose
10. **Memory Widget** — "forge remember" placeholder is cryptic CLI jargon
11. **Memory Widget** — Empty state is passive, not prompting action
12. **Squad Widget** — "Matrix cast" is inside joke, confusing for beginners
13. **Squad Widget** — No way to interact; unclear if UI is clickable
14. **Git Widget** — "Not a Git repository" assumes technical knowledge
15. **Git Widget** — Commit hashes shown without context
16. **General** — App lacks first-run guidance after opening project folder
17. **General** — No tooltips or help text
18. **General** — No "Getting Started" onboarding overlay

**P0 Blocking Issues (Must Fix for Beginner Accessibility):**
1. Ralph Widget: Add clear "Start Planning" button when no plan exists
2. Ralph Widget: Show phase context ("Planning" vs "Building")
3. Ralph Widget: Replace "iteration" with "Step"
4. Ralph Widget: Empty state with explanation of Ralph's purpose

**P1 High Confusion Risk:**
5. Plan Widget: Empty state with "Create Plan" button or instruction
6. Memory Widget: Rename "log a decision" to "Save Note" or "Add Decision"
7. All Widgets: Replace developer filenames with user-facing terms

**P2 Moderate Improvement:**
8. Squad Widget: Replace "Matrix cast" with "Team Members"
9. Plan Widget: Add legend or tooltips for symbols
10. App.tsx: Add first-run guidance overlay

**Testing Validation Framework (Brad Persona):**
A complete beginner opens the app with no prior knowledge. Success criteria:
- Can start a build? ✓ (when button labels are clear)
- Understands what's happening? ✓ (when jargon is translated)
- Can recover from an error? ✓ (when messages are plain English)

**Verdict on Ralph Widget:** The most critical widget is currently inaccessible to beginners due to:
- Lack of clear entry point ("resume loop" not obvious as "start")
- No phase context (doesn't distinguish planning vs building)
- Jargon barriers (iteration, loop, ralph-status.json)
- Missing explanation of Ralph's purpose

Neo's button pass addresses most of these. Tank recommends verification testing before deployment.

---

### CopilotForge Command Center — Technical Architecture
**Source:** Morpheus
**Date:** 2026-04-15
**Status:** Approved for Implementation

Defines complete technical architecture for copilotforge-command-center, an Electron-based dashboard for monitoring CopilotForge autonomous workflows.

**Key Architecture Components:**
- Forked from command-center-lite (brittanyellich) with WorkIQ/ElevenLabs integrations removed
- CopilotForge-specific live monitoring for Ralph loop, plans, squad, git, memory, and notes
- Real-time file watchers on key project files
- Electron IPC for main/renderer communication
- Minimal external dependencies

**Integration Points:**
- ralph-status.json: Ralph orchestration state
- IMPLEMENTATION_PLAN.md: Active phase and task tracking
- .squad/ directory: Team and memory state
- .git/ directory: Commit history
- Scratch notes: localStorage-persisted

**Approved for:** Cross-platform Electron build targeting Windows/macOS/Linux. Part of Phase 6 deliverables.

---

### README.md Factual Corrections
**Source:** Brad Liebs (via Trinity)
**Date:** 2026-04-16
**Status:** Complete

Fixed four factually inaccurate claims in README.md that contradicted the actual primary use case (npx copilotforge init):

**Claims Fixed:**
1. ❌ "No CLI required" → ✅ "Primary use: npx copilotforge init"
2. ❌ "No command line" → ✅ "Requires terminal for init"
3. ❌ "Zero dependencies" → ✅ "Requires Node.js and npm"
4. ❌ (Implied) "No setup needed" → ✅ "Installation required"

**Rationale:** README marketing claims contradicted the actual user experience. New users were confused when they needed to open a terminal. Accuracy restored.

**Impact:** Reduced onboarding friction and expectation mismatch.

---

## Deferred Decisions

### Multi-Platform CLI Completion (Phase 4)
- **Issue:** CLI currently works on macOS/Linux. Windows support incomplete.
- **Proposed Solution:** Cross-platform PowerShell + Bash wrapper with platform detection
- **Deferred Reason:** Phase 3 focusing on UI/UX hardening

### Jargon Audit & Mapping (Phase 3)
- **Issue:** Inconsistent terminology across tools, templates, UI
- **Proposed Solution:** Create jargon-mapping.md with approved terms; audit all user-facing text
- **Deferred Reason:** Discovered during Command Center development; requires cross-team alignment

### Section-Level FORGE.md Merge (Phase 3)
- **Issue:** Current re-run strategy overwrites entire FORGE.md; should preserve user sections
- **Proposed Solution:** Use HTML comment markers to identify generated vs. user-added content
- **Deferred Reason:** Requires careful testing to prevent data loss

### Custom Specialist Agents (Phase 3)
- **Issue:** Wizard currently limited to Morpheus's predefined specialists
- **Proposed Solution:** Allow users to define custom specialists with their own agents
- **Deferred Reason:** Requires new templating system and validation protocol

### Plugin System for Cookbook (Phase 4)
- **Issue:** Cookbook recipes are generated, not extensible
- **Proposed Solution:** NPM-style plugin registry for third-party recipes
- **Deferred Reason:** Requires discovery, versioning, and security vetting infrastructure


