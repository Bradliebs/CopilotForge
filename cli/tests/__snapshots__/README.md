# Snapshot Baselines

This directory contains generated snapshot baselines for CopilotForge Build Path templates (A-J).

## Regenerating Snapshots

If you intentionally change a template and need to update the baseline:

```powershell
$env:UPDATE_SNAPSHOTS="1"; node --test cli/tests/snapshots.test.js; Remove-Item Env:UPDATE_SNAPSHOTS
```

Or on Linux/Mac:
```bash
UPDATE_SNAPSHOTS=1 node --test cli/tests/snapshots.test.js
```

## Files

- `forge-path-A.md` - Copilot Studio Agent
- `forge-path-B.md` - Studio + Custom Connector
- `forge-path-C.md` - Declarative Agent
- `forge-path-D.md` - Canvas App + Copilot Agent
- `forge-path-E.md` - Power Automate Flow
- `forge-path-F.md` - PCF Code Component
- `forge-path-G.md` - Power BI Report
- `forge-path-H.md` - SharePoint + Teams
- `forge-path-I.md` - Power Pages
- `forge-path-J.md` - Developer Project (generic)

## Purpose

These snapshots catch accidental regressions:
- Template drift
- Jargon leaks (skill-writer, agent-writer, etc.)
- Missing sections
- Structural changes
