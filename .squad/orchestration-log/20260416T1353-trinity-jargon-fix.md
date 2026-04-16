# Orchestration: Trinity (trinity-jargon-fix)
**Wave:** 1 (Phase 13 Task 1)  
**Agent:** Trinity (Reviewer)  
**Date:** 2026-04-16T1353  
**Task:** fix-jargon-leak (template review & SYSTEM-BREAKDOWN.md audit)  
**Status:** COMPLETE  

## Execution Summary
Reviewed user-facing templates and documentation for specialist name leaks. Removed inappropriate internal implementation details from SYSTEM-BREAKDOWN.md while preserving legitimately-labeled internal sections.

### Files Reviewed
- templates/agents/planner.md: 0 violations (HTML comment already removed by Neo)
- templates/agents/reviewer.md: 0 violations ✅
- templates/agents/tester.md: 0 violations ✅
- .github/skills/planner/SKILL.md: 0 violations ✅
- .github/skills/plan-executor/SKILL.md: 0 violations ✅

### Fixes Applied
- **docs/SYSTEM-BREAKDOWN.md**: 3 locations neutralized
  - Line 353 (Verbosity Levels): Removed specialist reference, neutralized prose
  - Lines 453–456 (Data Flow diagram): Replaced specialist names with generic scaffolding terms
  - Line 484 (Design Principles): Removed specialist selection language

### Preserved by Design
- Lines 244–247: Internal Specialists table (explicitly labeled "CopilotForge internals, invisible to end users")
- Lines 264–267: Connection diagram (under Internal Specialists section, acceptable context)
- Line 186–190: Planner execution flow (labeled "Delegate to specialists:")

### Design Clarification
**HTML comments with implementation details MUST NOT appear in user-facing templates**, even when partially remediated. Templates are direct ancestors of user-generated files.

### Output
- Detailed report: .squad/decisions/inbox/trinity-jargon-fix.md (merged to decisions.md)
- All changes committed to feature branch

### Next Phase
Wave 2: Trinity assigned extend-forge-context (extend Forge CONTEXT schema with Path Detection fields)
