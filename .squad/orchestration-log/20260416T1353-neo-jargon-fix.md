# Orchestration: Neo (neo-jargon-fix)
**Wave:** 1 (Phase 13 Task 1)  
**Agent:** Neo (Developer)  
**Date:** 2026-04-16T1353  
**Task:** fix-jargon-leak (specialist template audit)  
**Status:** COMPLETE  

## Execution Summary
Audited all user-facing files for four forbidden specialist names: skill-writer, gent-writer, memory-writer, cookbook-writer.

### Findings
- **cli/src/**: 0 violations (all clean)
- **templates/agents/planner.md**: 1 HTML comment removed (line 22) 
- **templates/utils/rerun-detection.md**: 8 specialist references neutralized
- **.github/skills/**: 0 violations (confirmed clean)

### Occurrences Fixed: 9
1. planner.md: 1 HTML comment
2. rerun-detection.md: 8 prose lines

### Output
- Detailed report: .squad/decisions/inbox/neo-jargon-fix.md (merged to decisions.md)
- All changes committed to feature branch

### Next Phase
Wave 2: Neo assigned templates-split (design recommendation for cli/src/templates.js architecture)
