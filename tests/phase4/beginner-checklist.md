# CopilotForge Phase 4 — Beginner QA Checklist

> This checklist is written from the perspective of someone who has **never used
> CopilotForge, memory systems, or AI coding frameworks**. Phase 4 adds memory
> across sessions — preferences, history, convention learning, and adaptive
> wizard flows. Every memory feature must be approachable for a complete beginner.

---

## "Welcome Back" Experience

Trigger the Planner with existing memory files. Read the opening message.

- [ ] **The greeting feels human and warm.** "Welcome back!" or similar — not
      "Resuming session from memory store" or "Loading FORGE-CONTEXT."

- [ ] **I understand what the summary tells me.** It says what project I'm
      working on, what stack I'm using, and roughly what was built before —
      in plain English.

- [ ] **The session count makes sense.** Something like "This is your 3rd time
      running CopilotForge" — not "sessions: 3" or "history.md entry count: 3."

- [ ] **I know what my options are.** The summary clearly says I can confirm
      and proceed, change something, or start fresh. I don't have to guess.

- [ ] **Nothing is alarming or confusing.** No warnings about "memory reader
      failures," "convention extraction," or "FORGE-CONTEXT blocks" — just
      friendly project context.

---

## Context Summary Clarity

Read the full context summary shown during the adaptive wizard.

- [ ] **Project description is recognizable.** It matches what I originally
      said when I first ran CopilotForge.

- [ ] **Stack is listed clearly.** "TypeScript, Express, Prisma" — not
      "detected_frameworks: [\"TypeScript\", \"Express\", \"Prisma\"]".

- [ ] **Conventions are understandable.** If conventions are shown, they're
      stated in plain English: "You use 2-space indentation" — not
      "indentation_style: spaces, indent_size: 2, confidence: confirmed."

- [ ] **Decision history is a highlight, not a data dump.** Shows the 2-3
      most interesting decisions, not all 50.

- [ ] **I can tell this is my project.** Nothing in the summary feels generic
      or templated — it reflects my actual answers.

---

## Memory Preferences File

Open orge-memory/preferences.md (generated from the template).

- [ ] **There's a header explaining what this file is.** Something like
      "Your project preferences — CopilotForge uses these to remember your
      choices across sessions."

- [ ] **Each field has a comment.** Not just 	esting: yes but an explanation
      like 	esting: yes  # Whether to generate testing agents and skills.

- [ ] **I could edit this file myself.** The format is obvious enough that
      I could change 	esting: yes to 	esting: no and understand what
      would happen.

- [ ] **No scary internal terminology.** No references to "memory-writer,"
      "FORGE-CONTEXT," or "specialist agents."

- [ ] **The file looks intentional, not auto-generated garbage.** Clean
      formatting, logical ordering, consistent style.

---

## Session History File

Open orge-memory/history.md (generated from the template).

- [ ] **I understand what this file tracks.** A header explains: "A log of
      each time CopilotForge ran in this project."

- [ ] **Each session entry is readable.** Date, what happened, what was
      created — in plain English, not JSON or structured data.

- [ ] **Session numbering makes sense.** Session 1, Session 2, etc. — not
      array indices or UUIDs.

- [ ] **I can tell when something changed.** If my stack changed between
      sessions, the entry notes it clearly.

- [ ] **The file is append-only and that's clear.** A note like "New sessions
      are added at the bottom — don't delete old entries."

---

## "Start Fresh" Experience

Find and use the "start fresh" option.

- [ ] **I can find it without reading docs.** It's mentioned in the context
      summary or as a clear option during the adaptive wizard.

- [ ] **The consequences are explained before I commit.** "This will clear
      all stored preferences and session history, and run the full wizard
      from scratch."

- [ ] **There's a confirmation step.** I'm not one accidental keystroke away
      from losing all my memory.

- [ ] **After starting fresh, the wizard feels like the first time.** Full
      5-question flow, no leftover context, clean slate.

- [ ] **The fresh start is logged.** The new decisions.md notes that I chose
      to start fresh (so I don't wonder later why my old decisions are gone).

---

## Memory Reader Recipes

Open cookbook/memory-reader.ts and cookbook/memory-reader.py.

- [ ] **The header comment explains what this recipe does.** "Reads and
      parses CopilotForge memory files" in plain terms.

- [ ] **I understand WHEN to use it.** The "WHEN TO USE THIS" section gives
      concrete examples, not abstract descriptions.

- [ ] **Prerequisites are clear.** What to install, what files need to exist,
      what to set up first.

- [ ] **TODO markers tell me exactly what to fill in.** Not just // TODO
      but // TODO: Replace with your forge-memory/ directory path.

- [ ] **Error handling is visible and helpful.** If a memory file is missing,
      the error message tells me what to do about it.

- [ ] **TypeScript and Python recipes feel equally polished.** Python isn't
      a lazy port — it uses Python idioms (pathlib, dataclasses, etc.).

---

## FORGE.md Memory Status Section

Open FORGE.md and find the Memory Status section.

- [ ] **I can find it quickly.** The section heading is clear: "Memory Status"
      or similar, with an emoji that matches the style of other sections.

- [ ] **The table makes sense.** Decision count, pattern count, session count
      — each with a label and a value I understand.

- [ ] **Recent decisions are summarized.** I can see the last 2-3 decisions
      without opening decisions.md.

- [ ] **Conventions are listed.** I can see what coding patterns CopilotForge
      has learned about my project.

- [ ] **The tip about editing memory is helpful.** Something like "You can
      edit memory files directly — they're just markdown."

- [ ] **The section doesn't look out of place.** It fits with the existing
      FORGE.md style (emojis, tables, tips).

---

## Memory Templates

Open 	emplates/forge-memory/preferences.md and 	emplates/forge-memory/history.md.

- [ ] **Templates have {{placeholder}} syntax.** Values to be filled in
      during scaffolding are clearly marked.

- [ ] **Placeholder names are descriptive.** {{project_name}} not {{p1}}.
      {{stack}} not {{q2_answer}}.

- [ ] **Comments in templates explain the placeholders.** Not just
      {{skill_level}} but a note saying what values are valid.

- [ ] **Templates match their concrete counterparts.** The structure of the
      template matches what gets generated in orge-memory/.

---

## Utility Specs

Glance at the utility spec files (you don't need to understand the algorithms).

- [ ] **	emplates/utils/memory-reader.md** has an "Error Handling" section
      that describes what happens when files are missing or malformed.

- [ ] **	emplates/utils/memory-summarizer.md** explains when summarization
      happens (50+ entries) and that an archive is created.

- [ ] **	emplates/utils/convention-extractor.md** mentions confidence levels
      (observed, confirmed) in plain terms.

- [ ] **All three specs could be understood by a non-developer.** They explain
      *what* happens, not just *how* the code works.

---

## Overall Phase 4 Beginner Experience

Looking at everything together:

- [ ] **Memory feels like a helpful feature, not a burden.** I'm glad it
      remembers my choices — it doesn't feel like surveillance or bloat.

- [ ] **I never felt lost or confused.** Every new concept (memory, patterns,
      preferences, history) was introduced before it was used.

- [ ] **The adaptive wizard saves me time.** Returning to CopilotForge is
      faster and smoother than the first time — that's the point.

- [ ] **I could explain memory to a friend.** "CopilotForge remembers your
      project settings so you don't have to re-enter them every time."

- [ ] **Nothing feels auto-generated or low-effort.** Comments are thoughtful,
      file names are clear, error messages are specific.

---

## Checklist Metadata

| Field | Value |
|-------|-------|
| **Tester** | *(your name)* |
| **Date** | *(date of test)* |
| **Platform** | *(Windows / macOS / Linux)* |
| **Memory files present?** | ⬚ Yes / ⬚ No (run validator first) |
| **Phase 3 still working?** | ⬚ Yes / ⬚ No (run Phase 3 validator first) |
| **Overall verdict** | ⬚ Pass / ⬚ Fail — *(notes)* |
