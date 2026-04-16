# CopilotForge Squad Decisions

## Latest Decisions

### Phase 13 Task 6: Trinity — Path Skills (9 files created)
**Author:** Trinity (Prompt Engineer)
**Date:** 2026-04-16
**Task:** Phase 13 — Task 6: Build 9 path-specific skill files
**Status:** Completed

**Files Created:**
- .github/skills/studio-agent/SKILL.md (Path A)
- .github/skills/studio-connector/SKILL.md (Path B)
- .github/skills/declarative-agent/SKILL.md (Path C)
- .github/skills/canvas-agent/SKILL.md (Path D)
- .github/skills/power-automate/SKILL.md (Path E)
- .github/skills/pcf-component/SKILL.md (Path F — 84 lines with PCF lifecycle, TypeScript interfaces, pac CLI reference)
- .github/skills/powerbi-report/SKILL.md (Path G)
- .github/skills/sharepoint-agent/SKILL.md (Path H)
- .github/skills/power-pages/SKILL.md (Path I)

**Key Decisions:**
1. Agents Available section uses templates/agents/ roster only
2. Path F gets extra sections: PCF Control Lifecycle, TypeScript Interfaces, pac CLI Quick Reference
3. No specialist jargon leaks (skill-writer, agent-writer, etc.)
4. EXTENSION_REQUIRED: true for Path B and Path F only
5. MS Learn URLs sourced from power-platform-guide routing matrix
6. Path-contextual forge remember examples
7. Distinct trigger phrases per path (5–6 unique)
8. Self-contained, no cross-path references

---

### Phase 13 Task 7: Trinity — Agent Templates (6 files created)
**Author:** Trinity (Prompt Engineer)
**Date:** 2026-04-16
**Task:** Phase 13 — Task 7: Build 6 Power Platform agent template files
**Status:** Completed

**Files Created:**
- templates/agents/studio-agent.md (Paths A, B, H, I consolidated)
- templates/agents/declarative-agent.md (Path C)
- templates/agents/canvas-agent.md (Path D)
- templates/agents/automate-agent.md (Path E)
- templates/agents/pcf-agent.md (Path F)
- templates/agents/powerbi-agent.md (Path G)

**Key Decisions:**
1. studio-agent.md carries all four path variants (A, B, H, I) with path-specific preamble
2. New format structure: Role, Scope, What I Will Do, What I Won't Do, Trigger Phrase, Example Opening, Skills
3. Skills listed by name, not by file name
4. No cross-references between files
5. Zero jargon leaks (specialist names, CopilotForge mechanics invisible)

---

### Phase 13 Task 8: Neo — Cookbook (16 files created)
**Author:** Neo (Developer)
**Date:** 2026-04-16
**Task:** Phase 13 — Task 8: Build 16 cookbook files (15 markdown + 1 TypeScript)
**Status:** Completed

**Files Created:**
- cookbook/topics-guide.md (Paths A/B/H)
- cookbook/connector-setup.md (Path B)
- cookbook/api-auth-guide.md (Path B)
- cookbook/manifest-guide.md (Path C)
- cookbook/action-setup.md (Path C)
- cookbook/powerfx-patterns.md (Path D)
- cookbook/data-connections.md (Paths D/E)
- cookbook/sharepoint-connector.md (Path H)
- cookbook/dataverse-connector.md (Paths D/I)
- cookbook/pcf-manifest.md (Path F)
- cookbook/flow-patterns.md (Path E)
- cookbook/trigger-setup.md (Path E)
- cookbook/studio-flow-integration.md (Paths A/B)
- cookbook/report-setup.md (Path G)
- cookbook/data-model.md (Path G)
- cookbook/pcf-component.ts (Path F — production-grade lifecycle implementation)

**Key Decisions:**
1. All markdown files use CopilotForge Recipe format with required sections
2. MS Learn URLs sourced from SKILL.md canonical anchors
3. pcf-component.ts implements all lifecycle methods (init, updateView, getOutputs, destroy)
4. Self-contained files, no cross-file imports
5. Zero jargon leaks, user-facing content only

---

### D13-T4: Trinity — Planner Wizard Path Detection (2026-04-17)
**Author:** Trinity
**Status:** Implemented
**Related:** D13-A, D13-C

**Summary:** Extended .github/skills/planner/SKILL.md with Power Platform path detection. 119 lines added (744→863).
**Changes:**
1. Silent Path Detection After Q1 (Step 1a)
2. PP 3-Question Diagnostic
3. Ambiguous Q1 Clarifier
4. Path J Unchanged (D13-A rule)
5. FORGE-CONTEXT Write (Step 3a)
6. Returning User Path (Step 0)

---

### D13-M: Morpheus — PREREQUISITES_CONFIRMED Ownership (2026-07-09)
**Author:** Morpheus (Lead)
**Status:** Final
**Requested by:** Brad Liebs

**Ruling:** Option 1 — Compass flags. Planner confirms. Compass is a gate that reads, detects, and warns. The Planner wizard is where users interact and confirm.

