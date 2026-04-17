---
name: "copilotforge-planner"
description: "Simple wizard that scaffolds Copilot skills and code recipes from three quick questions"
domain: "scaffolding"
confidence: "high"
triggers:
  - "set up my project"
  - "scaffold skills"
  - "copilot forge"
  - "forge"
  - "plan my project"
  - "set up copilotforge"
  - "bootstrap this repo"
  - "scaffold my repo"
  - "create project structure"
  - "help me set up copilot"
---

<!-- 👋 Human? This file contains instructions for AI assistants, not for you.
     Your starting point is START-HERE.md -->

# CopilotForge Planner

> Drop this file into any repo at `.github/skills/planner/SKILL.md`. When triggered, it asks three quick questions and creates AI skills tailored to your project. No prior experience needed.

## What This Creates

```
.github/
  skills/
    code-review/
      SKILL.md     ← your AI learns to review your code
    test-helper/
      SKILL.md     ← your AI learns to write tests for your stack
cookbook/
  starter.{ext}    ← a working code example for your stack
```

---

## Instructions

When triggered, follow these steps in order. Ask one question at a time and wait for the answer before asking the next.

### Step 1 — Greet the User

Say:

> **Welcome to CopilotForge!** I'll ask you three quick questions, then create a set of AI skills tailored to your project. Takes about one minute. Let's go.

---

### Step 2 — Three Questions

**Question 1:**
> What are you building? One sentence is enough.
>
> *(Examples: "A REST API for a todo app" · "A React website for a restaurant" · "A Python script that processes CSV files")*

**Question 2:**
> What language and framework are you using?
>
> *(Examples: "TypeScript with Express" · "Python with FastAPI" · "JavaScript with React" · "Plain Python — no framework")*

**Question 3:**
> What's your experience level?
> **1.** Beginner — I'm still learning
> **2.** Intermediate — I know the basics
> **3.** Advanced — I write code daily

---

### Step 3 — Confirm Before Building

Show a summary and wait for a "yes" before creating anything:

> Here's what I'll create:
>
> **Project:** {Q1 answer}
> **Stack:** {Q2 answer}
> **Level:** {Q3 answer}
>
> **Files:**
> - `.github/skills/code-review/SKILL.md` — teaches me to review {stack} code
> - `.github/skills/test-helper/SKILL.md` — teaches me to write tests in {stack}
> - `cookbook/starter.{ext}` — a working code example to copy from
>
> Ready? *(yes / change something)*

If they want to change something, re-ask only the relevant question, then show the summary again.

---

### Step 4 — Generate the Files

**Only after the user confirms.**

#### `.github/skills/code-review/SKILL.md`

Create a skill file with this structure:

```
---
name: "code-review"
triggers:
  - "review this code"
  - "check my code"
  - "code review"
---

# Code Review Skill

When triggered, review the code the user shares and check for:

[list of 5–8 things relevant to their stack — naming, error handling,
security basics, common framework pitfalls, test coverage]

For each issue found:
- Quote the specific line
- Explain what's wrong
- Show the fix

[If beginner level: also explain WHY each issue matters in one sentence.]
```

Keep it under 60 lines. Use concrete, stack-specific language — not generic advice.

#### `.github/skills/test-helper/SKILL.md`

Create a skill file with this structure:

```
---
name: "test-helper"
triggers:
  - "write tests for this"
  - "add tests"
  - "test this function"
  - "help me test"
---

# Test Helper Skill

When triggered, write tests for the code the user shares.

Testing framework: [the standard one for their stack — Jest, pytest, Go test, etc.]

Pattern to follow:
1. Arrange — set up inputs and any needed mocks
2. Act — call the function
3. Assert — check the result

[If beginner level: add a comment on each arrange/act/assert line explaining what it does.]

Write tests for:
- The happy path (normal inputs)
- One edge case (empty, null, zero, or boundary)
- One error case (what happens when something goes wrong)
```

Keep it under 60 lines.

#### `cookbook/starter.{ext}`

Create a short, runnable code file (30–50 lines) that:
- Shows the simplest useful pattern for their stack (an API route, a component, a utility function, etc.)
- Has a comment on every non-obvious line
- Actually runs without errors — no placeholder imports or TODO stubs
- Uses the extension that matches their language (`.ts`, `.py`, `.js`, `.go`, etc.)

---

### Step 5 — Finish

After creating all files, say:

> **Done!** Here's what to try next:
>
> - Say **"review this code"** and paste any file — I'll check it for you
> - Say **"write tests for this"** and paste a function — I'll write tests for it
> - Open `cookbook/starter.{ext}` for a working example to build from
>
> Need anything else? *(add another skill, create a plan, or just ask)*
