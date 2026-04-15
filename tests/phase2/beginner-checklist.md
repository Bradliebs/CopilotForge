# CopilotForge Phase 2 — Beginner QA Checklist

> This checklist is written from the perspective of someone who has **never used
> GitHub Copilot, CopilotForge, or any AI coding assistant**. Phase 2 adds wizard
> delegation and specialist agents behind the scenes — none of that complexity
> should leak into the beginner's experience.

---

## Delegation Should Be Invisible

The biggest Phase 2 risk for beginners: they see internal machinery. Test that
the abstraction holds.

- [ ] **I don't know what a "specialist agent" is — and I shouldn't.** Running
      the wizard, I see one smooth flow. Nothing suggests that multiple agents
      are working behind the scenes.

- [ ] **I never see the words "delegat", "orchestrat", or "dispatch".** In the
      wizard output, in FORGE.md, in generated agent files — nowhere that I'd
      look as a beginner.

- [ ] **I never see "skill-writer", "agent-writer", "memory-writer", or
      "cookbook-writer".** These are internal names. If I see them, I'll wonder
      if I need to use them.

- [ ] **Progress messages make sense to me.** Messages like "Setting up your
      project agents..." or "Creating skill definitions..." are clear. Messages
      like "Delegating to skill-writer..." are not.

- [ ] **If something goes wrong, the error is about what I should do, not about
      which internal agent failed.** "Couldn't create skill files — try running
      again" is fine. "skill-writer returned error code 1" is not.

---

## FORGE.md Quick Actions Work

Phase 2 adds or updates Quick Actions in FORGE.md. Each one should be
copy-pasteable into a Copilot chat and actually work.

- [ ] **"Create a new agent" Quick Action works.** I copy the prompt, paste it
      into Copilot, and get a new agent file created in the right place.

- [ ] **"Create a new skill" Quick Action works.** Same — paste, run, result
      appears in `.github/skills/`.

- [ ] **"Write a cookbook recipe" Quick Action works.** I get a new recipe in
      `cookbook/` that makes sense for my project.

- [ ] **"Record a decision" Quick Action works.** The decision appears in
      `forge-memory/decisions.md` with a timestamp and reason.

- [ ] **"Re-run the planner" Quick Action works.** Re-running doesn't destroy
      my existing files. The wizard picks up where I left off or asks fresh
      questions.

- [ ] **Quick Actions don't assume I know what arguments to provide.** The
      placeholder text (like `[role]` or `[language]`) is obvious enough that
      I know what to replace it with.

---

## Every Generated File Is Understandable

Open each type of generated file and answer: "Could a beginner understand this?"

### Agent Files (`.copilot/agents/*.md`)

- [ ] **I know what this agent does.** The first few lines explain the agent's
      role in plain language — not "orchestrator" or "coordinator," but
      something like "plans your project structure."

- [ ] **I know I can edit this file.** There's a note saying these are my files
      to customize, not system files.

- [ ] **I understand the sections.** Role, Responsibilities, Boundaries —
      each section has a brief explanation of what it means.

- [ ] **No unexplained jargon.** If a technical term appears (like "YAML" or
      "frontmatter"), it's explained on first use or linked to an explanation.

### Skill Files (`.github/skills/*/SKILL.md`)

- [ ] **I can see the skill's name and what it does.** The frontmatter (if I
      know to look there) or the first heading tells me clearly.

- [ ] **I understand when this skill activates.** The trigger is explained in
      language I can follow.

- [ ] **The reference doc adds value.** If there's a `reference.md`, it helps
      me understand more without being overwhelming.

### Memory Files (`forge-memory/`)

- [ ] **I understand why memory exists.** The explanation says something like
      "remembers decisions across sessions so you don't repeat yourself."

- [ ] **decisions.md explains itself.** I can read it and understand what a
      "decision entry" looks like and why I'd add one.

- [ ] **patterns.md explains itself.** I know what a "pattern" is in this
      context without needing external docs.

### Cookbook Recipes (`cookbook/`)

- [ ] **I can read a recipe and understand its purpose.** There's a header
      comment or intro block explaining what this recipe does.

- [ ] **I know what language it's in.** The file extension matches my stack,
      and the code style is appropriate for beginners (if skill level=beginner).

- [ ] **I see how to use it.** The recipe includes usage context — not just
      code, but when and why I'd use it.

- [ ] **I'm not overwhelmed.** Each recipe is short enough to read in under
      2 minutes.

---

## Re-Run Experience

Phase 2 introduces re-run behavior. Beginners will inevitably run the wizard
twice (maybe by accident). Test that it's not scary.

- [ ] **Running again doesn't break anything.** I can re-run the wizard and
      my project still works. Nothing I wrote was deleted.

- [ ] **The re-run tells me what it did.** I see a message like "Found
      existing project — updating..." not just silence.

- [ ] **My custom edits survived.** If I edited FORGE.md or an agent file
      before re-running, my edits are still there.

- [ ] **I understand what's new vs. what was already there.** The output or
      FORGE.md makes it clear what changed (if anything).

- [ ] **If I changed my stack, I see new files.** New cookbook recipes or
      skill files appear for the new stack. The old ones are still there.

---

## Validation Output Is Beginner-Friendly

Run `validate-delegation.ps1` (or `.sh`) and check the output.

- [ ] **I understand what each check is testing.** PASS/FAIL messages
      describe the check in plain language.

- [ ] **FAIL messages tell me what to do.** Not just "check failed" but
      "Missing file: .copilot/agents/planner.md — run the wizard to
      generate it."

- [ ] **The summary is clear.** At the end, I can tell in 5 seconds
      whether everything is OK.

- [ ] **No scary technical output.** No stack traces, no raw error codes,
      no regex patterns displayed.

- [ ] **Warnings are explained.** If something is a WARN (not FAIL), I
      understand why it's a warning and whether I need to act.

---

## Jargon Audit

Search all user-facing files for terms that shouldn't appear:

- [ ] **"orchestrator"** — not in FORGE.md, not in agent files, not in
      wizard output. (OK in `docs/delegation-protocol.md` only.)

- [ ] **"delegation" / "delegate"** — same rule. Internal concept only.

- [ ] **"specialist"** — same rule.

- [ ] **"pipeline"** — same rule.

- [ ] **"dispatch"** — same rule.

- [ ] **"skill-writer" / "agent-writer" / "memory-writer" / "cookbook-writer"**
      — these should NEVER appear in user-facing content. Period.

- [ ] **"YAML" without explanation** — if YAML is mentioned, it should explain
      what YAML is or link to a beginner resource.

- [ ] **"frontmatter" without explanation** — same rule.

---

## Overall Phase 2 Experience

Looking at everything together:

- [ ] **Phase 2 feels like Phase 1, but better.** The experience is smoother,
      not more complicated. The wizard is the same (or simpler), and the
      output is richer.

- [ ] **I can explain what happened.** After running the wizard, I can tell
      a friend: "I described my project, it created a bunch of files for me,
      and now I have AI agents that help me code."

- [ ] **I didn't need to Google anything.** Every concept I encountered was
      explained in the generated files or FORGE.md.

- [ ] **Nothing feels half-finished.** All generated files are complete,
      all references point to real files, all sections have content.

- [ ] **I trust it.** The output looks professional and intentional. Nothing
      feels like a placeholder or accident.

---

## Checklist Metadata

| Field | Value |
|-------|-------|
| **Tester** | *(your name)* |
| **Date** | *(date of test)* |
| **Scaffold input** | *(what you told the Planner)* |
| **Platform** | *(Windows / macOS / Linux)* |
| **Copilot client** | *(VS Code / Claude Code / copy-paste)* |
| **Phase 1 still working?** | ⬚ Yes / ⬚ No — *(run Phase 1 validator first)* |
| **Overall verdict** | ⬚ Pass / ⬚ Fail — *(notes)* |
