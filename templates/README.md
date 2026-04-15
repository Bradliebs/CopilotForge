# CopilotForge Templates

> Internal generation templates used by the wizard. These files use `{{placeholder}}` syntax and are filled in during scaffolding.

---

## What Are Templates?

Templates are the blueprints CopilotForge uses to generate files for your project. Each template contains:

- **Static content** — structure and explanations that appear in every generated file
- **Placeholders** — dynamic values like `{{project-name}}`, `{{stack}}`, `{{date}}` that the wizard fills in based on your answers

**You don't edit templates directly** — the wizard fills them in automatically when you run the setup. The filled-in files go into your project, not back into this `templates/` folder.

---

## Template Structure

```
templates/
├── FORGE.md                    # Control panel template
├── agents/                     # Agent definition templates
│   ├── planner.md
│   ├── reviewer.md
│   └── tester.md
├── cookbook/                   # Recipe templates
│   ├── error-handling.ts.tpl
│   ├── api-client.ts.tpl
│   └── ...
└── forge-memory/              # Memory file templates
    ├── decisions.md
    ├── patterns.md
    ├── preferences.md
    └── history.md
```

---

## Placeholder Reference

Every `{{placeholder}}` used in templates, where it comes from, and an example value:

| Placeholder | Source | Example Value |
|-------------|--------|---------------|
| `{{project-name}}` | Q1 (derived from description) | "TaskFlow" |
| `{{project-description}}` | Q1 (wizard answer) | "A task management app where teams can create, assign, and track tasks" |
| `{{project-description-long}}` | Q1 (wizard answer + expansion) | "TaskFlow helps teams organize, prioritize, and track work..." |
| `{{stack}}` | Q2 (wizard answer + detection) | "TypeScript, Next.js, Prisma, PostgreSQL" |
| `{{date}}` | Auto-generated | "2026-04-16" |
| `{{memory}}` | Q3 (wizard answer) | "yes" or "no" |
| `{{testing}}` | Q4 (wizard answer) | "yes" or "no" |
| `{{verbosity}}` | Q5 (wizard answer) | "beginner", "intermediate", or "advanced" |
| `{{agent-name}}` | Generated during scaffolding | "reviewer", "tester" |
| `{{agent-role}}` | Generated during scaffolding | "Code Quality", "QA" |
| `{{agent-file}}` | Generated during scaffolding | "reviewer.md" |
| `{{skill-name}}` | Generated during scaffolding | "code-review", "testing" |
| `{{skill-description}}` | Generated during scaffolding | "Review checklist for TypeScript/Next.js stack" |
| `{{trigger}}` | Defined in skill frontmatter | "review this", "check my code" |
| `{{api_base_url}}` | Placeholder for user to fill | "https://api.example.com" |
| `{{auth_secret}}` | Placeholder for user to fill | "your-secret-key-here" |
| `{{db_connection_string}}` | Placeholder for user to fill | "postgresql://localhost/mydb" |
| `{{last_run_date}}` | Auto-generated from history | "2026-04-16" |
| `{{session_count}}` | Counted from history.md | "1" |
| `{{decisions_count}}` | Counted from decisions.md | "3" |
| `{{patterns_count}}` | Counted from patterns.md | "7" |
| `{{preferences_status}}` | Status from preferences.md | "Set" or "Default" |

### Conditional Placeholders

Some placeholders only appear when certain conditions are met:

| Placeholder | When Used |
|-------------|-----------|
| `{{recent_decisions}}` | When memory files exist |
| `{{conventions}}` | When patterns.md has entries |
| `{{tester-agent}}` | When Q4 (testing) = "yes" |
| `{{testing-skill}}` | When Q4 (testing) = "yes" |

---

## How Wizards Use Templates

1. **Collect answers** — Run Questions 1-5
2. **Detect stack** — Scan config files (`package.json`, etc.)
3. **Load templates** — Read template files from `templates/`
4. **Replace placeholders** — Substitute `{{placeholder}}` with actual values
5. **Write output** — Save filled-in files to the target repo

**Example:**

Template: `templates/FORGE.md`
```markdown
| **Name** | {{project-name}} |
| **Stack** | {{stack}} |
```

After wizard runs with answers:
- Q1: "A task management app"
- Q2: "TypeScript, Next.js"

Output: `FORGE.md`
```markdown
| **Name** | TaskFlow |
| **Stack** | TypeScript, Next.js |
```

---

## Customizing Templates (Advanced)

If you're customizing CopilotForge itself (not just using it), this is where generation templates live.

### To add a new template placeholder:

1. Add the placeholder to the table above
2. Update the wizard's replacement logic in `.github/skills/planner/SKILL.md`
3. Add example values to `reference.md`
4. Test with a full wizard run

### To modify an existing template:

1. Edit the file in `templates/`
2. Test by running the wizard and checking the generated output
3. Verify placeholders are correctly replaced

### Template Naming Conventions

- **FORGE.md** — Control panel (no `.tpl` extension, it's markdown)
- **agents/*.md** — Agent definitions (no `.tpl`, they're scaffolded as-is with placeholders)
- **cookbook/*.tpl** — Recipe templates (`.tpl` extension to distinguish from actual recipes in `cookbook/`)
- **forge-memory/*.md** — Memory templates (no `.tpl`, they're markdown)

---

## Common Questions

### "Why are there placeholders in the generated files?"

If you see `{{placeholder}}` values in your generated `FORGE.md` or other files, something went wrong during scaffolding. The wizard should replace all placeholders. Try running the wizard again or check the validation summary for errors.

### "Can I edit templates after running the wizard?"

Templates don't affect your generated files after the wizard runs. Editing templates only changes future scaffolding runs, not existing projects.

To change your project's setup, edit the generated files directly (in your project root, `.copilot/agents/`, etc.), not the templates.

### "What's the difference between `templates/` and `cookbook/`?"

- **`templates/`** — Blueprints with placeholders, used during scaffolding
- **`cookbook/`** — Real, runnable code files that you can copy directly

Templates become files. The cookbook is already files.

---

**← Back to [Main README](../README.md)** | **→ Explore [Examples](../examples/README.md)**
