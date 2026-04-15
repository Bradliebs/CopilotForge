# CopilotForge — Now

## Current Focus

**CopilotForge Phase 2** — Wizard agent orchestrator with specialist delegation system

**Status:** Implemented and delivered. Ready for team review.

**Key Outcome:** Phase 2 transforms the Planner from monolithic SKILL.md into a wizard orchestrator that transparently delegates file generation to 4 specialist agents (skill-writer, agent-writer, memory-writer, cookbook-writer).

## Known Issues

### CRITICAL: Jargon Leak in User-Facing Templates

Tank's Phase 2 validator found 24 failures. Specialist agent names (skill-writer, gent-writer, memory-writer, cookbook-writer) and the term specialist appear in user-facing files:

- 	emplates/FORGE.md (user's project control panel)
- 	emplates/agents/planner.md (user-visible agent)
- All 4 	emplates/agents/{specialist}.md files

**Impact:** Beginners see internal delegation terminology with no way to understand it.

**Required Fix (Phase 2.1):** Scrub specialist names from user-facing content. Internal names should only appear in docs/delegation-protocol.md and internal configuration.

**Owners:** Neo (agent templates), Trinity (FORGE.md template)

**Target:** Fix before Phase 2 team commit

## Next Phase Gates

- [ ] Jargon leak remediation complete
- [ ] Team consensus on 3 re-run sub-decisions (Tank: 2a, 2b, 2c)
- [ ] Approved for team merge and Phase 3 planning

## Team Members

- **Morpheus** — Lead Architect
- **Trinity** — Prompt Engineer
- **Neo** — Developer
- **Tank** — Tester
- **Scribe** — Documentation specialist

---

*Last Updated: 2026-04-15T11:30:00Z*
