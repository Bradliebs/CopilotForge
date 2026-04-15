# CopilotForge Phase 1 — Beginner QA Checklist

> This checklist is written from the perspective of someone who has **never used
> GitHub Copilot, CopilotForge, or any AI coding assistant**. If you're testing,
> pretend you just learned what a terminal is last week.

---

## Understanding What Happened

After running the Planner skill, open `FORGE.md` and answer these questions
without looking at any other file:

- [ ] **I can tell what this tool did.** Reading the first few paragraphs, I
      understand that something was created for me and roughly what it is.

- [ ] **I can find a list of files that were created.** There's a section that
      tells me what files and folders now exist in my project.

- [ ] **I understand what the files are for.** Each file or folder has a short
      explanation — not just a name, but what it does and why I'd care.

- [ ] **I know what "agents" are (or I'm told).** If the word "agent" appears,
      it's explained in a way I can follow. Not just "see the agent docs."

- [ ] **I know what "skills" are (or I'm told).** Same as above — the term is
      explained, not assumed.

- [ ] **I know what the "cookbook" is for.** If there's a cookbook folder, I
      understand what kind of things go in it without prior knowledge.

- [ ] **I know what "forge-memory" does.** The concept of memory across sessions
      is explained simply — why it exists and what it saves me from doing.

---

## Finding How to Do Things

Still using only what's written in `FORGE.md` and the generated files:

- [ ] **I can find how to add a new agent.** There are instructions (or a link
      to instructions) for creating another agent beyond the defaults.

- [ ] **I can find how to add a new skill.** Same — clear path to creating a
      new skill, not just the ones that were generated.

- [ ] **I can find how to add a cookbook recipe.** I know where recipes go, what
      format they should be in, and roughly what one looks like.

- [ ] **I can find how to update my project description.** If I want to change
      what I said during the wizard, I know where that information lives.

- [ ] **I can find how to re-run the Planner.** If I want to start over or
      update my scaffold, the steps are documented.

---

## The Cookbook Recipes

Open any generated cookbook file:

- [ ] **I can read the file and understand its purpose.** There's a comment at
      the top or a clear structure that tells me what this recipe does.

- [ ] **I see instructions for how to use it.** Not just code — there's context
      about when and why I'd use this recipe.

- [ ] **I can tell what language it's written in.** The file extension matches
      my stack, and if I'm a beginner, there are comments explaining the syntax.

- [ ] **I'm not overwhelmed.** The recipe is short enough to read in under
      2 minutes. If it's long, it's broken into clear sections.

---

## The Agent Files

Open any file in `.copilot/agents/`:

- [ ] **I understand what this agent does.** The file explains the agent's role
      in plain language.

- [ ] **I can tell how it relates to my project.** It's not a generic template —
      it references my project or stack.

- [ ] **I know I can edit it.** It's clear that these files are mine to modify,
      not "system files" I shouldn't touch.

---

## The Skill Files

Open any `SKILL.md` in `.github/skills/`:

- [ ] **I can see the skill's name and purpose.** The frontmatter or first
      section tells me what this skill does.

- [ ] **I understand the trigger.** If the skill is activated by something
      (a command, a question), that trigger is documented.

- [ ] **I can follow the reference doc.** If there's a `reference.md`, it
      adds useful detail without repeating the SKILL.md.

---

## Error Handling

Try breaking things on purpose:

- [ ] **Validation errors are in plain language.** When I run the validation
      script and something fails, the message tells me *what's wrong* and
      *what file to look at* — not just "check failed."

- [ ] **I know what to do when something fails.** The error message suggests a
      next step, like "re-run the Planner" or "check this file."

- [ ] **No scary technical output.** I don't see stack traces, raw exceptions,
      or error codes that mean nothing to me.

- [ ] **The pass/fail summary is clear.** At the end of validation, I can tell
      whether my project is set up correctly in under 5 seconds.

---

## Overall Experience

Looking at everything together:

- [ ] **I feel oriented, not overwhelmed.** The amount of generated content
      feels manageable. I know where to start.

- [ ] **I didn't need to Google anything.** Every term, command, and concept
      I needed was explained in the generated files themselves.

- [ ] **I could explain this to a friend.** After reading FORGE.md and poking
      around the files for 10 minutes, I could tell someone else what
      CopilotForge did and why it's useful.

- [ ] **I trust the output.** Nothing feels broken, half-finished, or
      placeholder-ish. It looks like something a professional set up.

- [ ] **I know this is just Phase 1.** It's clear what exists now versus what's
      coming later, so I don't go looking for features that aren't built yet.

---

## Checklist Metadata

| Field | Value |
|-------|-------|
| **Tester** | *(your name)* |
| **Date** | *(date of test)* |
| **Scaffold input** | *(what you told the Planner)* |
| **Platform** | *(Windows / macOS / Linux)* |
| **Copilot client** | *(VS Code / Claude Code / copy-paste)* |
| **Overall verdict** | ⬚ Pass / ⬚ Fail — *(notes)* |
