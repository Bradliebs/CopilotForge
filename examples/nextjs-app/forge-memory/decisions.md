# Forge Decisions

Decisions made during project setup and ongoing development. Append new decisions — never delete old ones.

## Setup Decisions

### 2026-04-16: Initial scaffolding
**What:** CopilotForge generated the initial project structure.  
**Why:** User requested scaffolding for: "A task management platform with real-time collaboration, Kanban boards, and team analytics"  
**Stack:** TypeScript, Next.js 14, Prisma, PostgreSQL, React, Jest  
**Options enabled:** Memory: yes, Testing: yes, Verbosity: intermediate

### 2026-04-16: Chose Prisma over raw SQL
**What:** Selected Prisma as the ORM instead of raw SQL or other ORMs.  
**Why:** Type-safe queries are critical for a TypeScript project. Prisma provides excellent TypeScript integration and automatic migrations. The schema-first approach makes database changes explicit and reviewable.  
**Impact:** All database access goes through Prisma client. Raw SQL is only used for complex queries that Prisma can''t express.

### 2026-04-16: Next.js App Router over Pages Router
**What:** Configured skills and conventions for Next.js 14 App Router.  
**Why:** App Router is the recommended approach for new Next.js projects. Server components improve performance by reducing client JavaScript. Layouts and loading states are cleaner than the Pages Router equivalent.  
**Impact:** All routes live in `/app`, server components by default, `''use client''` opt-in for interactivity.

## Development Decisions

*(Future decisions will be added here as the project evolves)*
