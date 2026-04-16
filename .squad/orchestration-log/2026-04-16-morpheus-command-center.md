# Morpheus: Command Center Architecture Analysis
**Date:** 2026-04-16  
**Agent:** Morpheus (Lead)  
**Mode:** Sync  
**Task:** Architecture analysis for CopilotForge Command Center Electron app

## Objective
Analyze and design the architecture for the CopilotForge Command Center, a desktop Electron application that integrates with the CopilotForge project scaffolding system.

## Deliverable
- **Output:** 29KB architecture decision document
- **Location:** `.squad/decisions/inbox/morpheus-command-center-arch.md`
- **Status:** Complete

## Architecture Analysis Completed

### 1. TypeScript Interfaces
- Comprehensive type definitions for all components
- IPC communication type safety
- State management interfaces
- Widget configuration types

### 2. IPC Channel Design
Primary communication channels between main and renderer processes:
- `forge:selectDirectory` - Directory selection dialog
- `forge:getData` - Fetch data for widgets
- `forge:pauseRalph` - Pause ralph-loop execution
- `forge:resumeRalph` - Resume ralph-loop execution
- `forge:appendMemory` - Append to project memory
- `forge:onUpdate` - Real-time updates from watchers

### 3. Widget Specifications
Six-widget component tree with detailed specifications:

**Widget 1: Ralph Status Widget**
- Displays ralph-loop execution status
- Real-time execution metrics
- Pause/Resume controls

**Widget 2: Plan Widget**
- Shows IMPLEMENTATION_PLAN.md
- Task tracking and status visualization
- Direct file updates

**Widget 3: Squad Widget**
- Team member status and assignments
- Agent capability display
- Historical context

**Widget 4: Git Widget**
- Recent commits and branches
- Staged changes overview
- Quick commit interface

**Widget 5: Memory Widget**
- Forge memory entries
- Quick append functionality
- Memory search

**Widget 6: Notes Widget**
- SQLite-backed persistent notes
- Session-specific annotations
- Quick-access reference

### 4. Component Tree
```
Command Center (Electron App)
├── MainWindow (1200x800, 60% width split)
│   ├── Widget Container (Left)
│   │   ├── Ralph Widget
│   │   ├── Plan Widget
│   │   └── Squad Widget
│   └── Widget Container (Right)
│       ├── Git Widget
│       ├── Memory Widget
│       └── Notes Widget
├── File Watcher (fs.watch + 500ms debounce)
├── IPC Manager (Main Process)
└── State Manager (Renderer Process)
```

### 5. File System Architecture
- **App Location:** `C:\AI Projects\copilotforge-command-center`
- **Ralph Status File:** `ralph-status.json` (gitignored)
- **Notes Database:** `notes.db` (SQLite)
- **Configuration:** `.env` (gitignored)

### 6. UI/UX Design System
- **Background:** #0f0f0f (deep black terminal aesthetic)
- **Card Background:** #1a1a1a (subtle elevation)
- **Primary Accent:** #22c55e (bright green)
- **Border Radius:** Max 6px (modern minimal style)
- **Typography:** Monospace for code, sans-serif for UI

## Key Decision Points

1. **Separate Application:** Command Center is NOT embedded in Oracle_Prime. It runs as a standalone Electron app at `copilotforge-command-center`.

2. **File Watching Strategy:** Uses Node.js `fs.watch()` with 500ms debounce to detect file changes across the project.

3. **State Management:** SQLite is repurposed for Notes widget only. Ralph state is persisted in `ralph-status.json`.

4. **IPC Pattern:** Async request-response pattern with type-safe channels defined in preload script.

5. **Ralph Integration:** Ralph status read from `ralph-status.json` written by `ralph-loop.ts`.

## Next Steps
1. Neo to implement full Electron application
2. Integration testing with live CopilotForge workflow
3. Performance optimization for file watching
4. Documentation of API endpoints
