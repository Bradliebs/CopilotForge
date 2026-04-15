# Documentation Quality Checklist

> Manual review checklist for CopilotForge beginner-friendly documentation.
> Reviewer: Tank (Tester) | Date: 2026-04-15

## How to Use This Checklist

Read each doc from a **complete beginner's perspective** — someone who has never
used Copilot skills, agents, or CopilotForge. Mark each item PASS or FAIL.
If FAIL, note what's wrong so Trinity can fix it.

---

## README.md (First Impression)

The README is the front door. A beginner decides in 60 seconds whether to keep
reading or close the tab.

- [ ] **60-second clarity** — Can you understand what CopilotForge does in under 60 seconds of reading?
- [ ] **Quick Start is quick** — Is the Quick Start actually quick (3 steps or fewer)?
- [ ] **Copy-pasteable examples** — Are all code examples copy-pasteable without modification?
- [ ] **Terms explained on first use** — Is every technical term (skill, agent, memory, cookbook, scaffold) explained when it first appears?
- [ ] **No jargon leaks** — Are there any internal/specialist terms leaking? Check for:
  - "specialist" (internal delegation concept)
  - "delegation" or "delegation protocol"
  - "FORGE-CONTEXT" (internal data-passing block)
  - "frontmatter" (say "trigger phrases" or "configuration" instead)
  - "skill-writer", "agent-writer", "memory-writer", "cookbook-writer"
- [ ] **FAQ answers real questions** — Does the FAQ answer the questions a beginner would actually ask? (e.g., "Do I need to install anything?", "Does this work with my editor?", "What if I already have a .copilot folder?")
- [ ] **File tree is clear** — Is the file tree/structure diagram easy to read and annotated?
- [ ] **FORGE.md explained** — Does it explain what FORGE.md is without assuming prior knowledge?
- [ ] **"Works Everywhere" is accurate** — Are the "Works Everywhere" claims accurate and specific (VS Code, Claude Code, copy-paste)?
- [ ] **Friendly tone** — Is the tone welcoming and encouraging, not intimidating or academic?

---

## GETTING-STARTED.md (Walkthrough)

This is the hands-on guide. A beginner should be able to follow every step
without asking for help.

- [ ] **Realistic example** — Is the worked example realistic and relatable (not a toy example)?
- [ ] **Wizard Q&A shown** — Does it show actual wizard questions and the answers a user would type?
- [ ] **Generated file content shown** — Does it show what the generated files actually contain (not just file names)?
- [ ] **Second-run (memory) demo** — Is the second-run / memory demo clear? Does it show what changes on re-run?
- [ ] **Troubleshooting tips** — Are troubleshooting tips practical and specific? (Not just "check your config")
- [ ] **Self-contained** — Can you follow every step without any prior CopilotForge knowledge?
- [ ] **No assumed context** — Does it avoid phrases like "as you know" or "obviously"?
- [ ] **Clear prerequisites** — Are prerequisites (if any) stated upfront?

---

## HOW-IT-WORKS.md (Internals)

This doc explains the architecture. It's more technical, but should still be
accessible to a motivated beginner.

- [ ] **Skills explained from scratch** — Does it explain what Copilot skills are without assuming you know?
- [ ] **Agents explained from scratch** — Does it explain what Copilot agents are without assuming you know?
- [ ] **Architecture diagram** — Is the architecture diagram referenced, included, and explained (not just dropped in)?
- [ ] **Beginner-accessible** — Is the doc still readable for a beginner, even though it covers internals?
- [ ] **Progressive disclosure** — Does it start simple and add complexity gradually?
- [ ] **Connects to user experience** — Does it explain how the internals relate to what the user sees?

---

## Cross-Document Consistency

All three docs must agree with each other and form a coherent reading path.

- [ ] **Consistent terminology** — Do all three docs use the same terms for the same concepts?
- [ ] **Consistent file paths** — Are file paths (e.g., `.copilot/agents/`, `forge-memory/`) consistent across docs?
- [ ] **Working links** — Do all links between the three docs work? (README → GETTING-STARTED, GETTING-STARTED → HOW-IT-WORKS, etc.)
- [ ] **Clear reading path** — Is there a clear progression: README → GETTING-STARTED → HOW-IT-WORKS?
- [ ] **No contradictions** — Do the docs ever contradict each other on how things work?
- [ ] **Version consistency** — If any doc mentions versions or phases, do they all agree?

---

## Scoring

| Section | Items | Pass | Fail | Score |
|---------|-------|------|------|-------|
| README.md | 10 | | | /10 |
| GETTING-STARTED.md | 8 | | | /8 |
| HOW-IT-WORKS.md | 6 | | | /6 |
| Cross-Document | 6 | | | /6 |
| **Total** | **30** | | | **/30** |

**Ship threshold:** 27/30 (90%). Any FAIL on jargon leaks or broken links is an
automatic block — those must be fixed before merge.

---

## Notes

_Record any observations, edge cases, or improvement suggestions here._

