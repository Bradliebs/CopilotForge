/**
 * memory-reader.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Reads and parses CopilotForge memory files (decisions.md, patterns.md,
 *   preferences.md, history.md) into structured TypeScript objects. Provides
 *   query helpers for filtering decisions and patterns.
 *
 * WHEN TO USE THIS:
 *   When your agent or tool needs to read project memory — past decisions,
 *   active conventions, user preferences — to make context-aware choices.
 *
 * HOW TO RUN:
 *   1. npx ts-node cookbook/memory-reader.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A forge-memory/ directory with at least one .md file
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

// --- Imports ---
// All imports are included — no "install this separately" surprises.
import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";

// --- Types ---

/** A single decision entry parsed from decisions.md. */
interface Decision {
  date: string;
  title: string;
  context: string;
  decision: string;
  reason: string;
  impact: string;
  tags: ("stack" | "preference")[];
}

/** A project-specific pattern parsed from patterns.md. */
interface Pattern {
  name: string;
  whenToUse: string;
  pattern: string;
  confidence: "observed" | "confirmed" | "established";
}

/** Parsed conventions from the standard sections of patterns.md. */
interface Conventions {
  stackConventions: string[];
  fileStructure: Record<string, string>;
  namingConventions: Record<string, string>;
  projectPatterns: Pattern[];
}

/** User preferences parsed from preferences.md. */
interface UserPreferences {
  verbosity: "beginner" | "intermediate" | "advanced";
  stackPreference: string;
  testing: string;
  memoryEntriesToLoad: number;
  generationStyle: "minimal" | "standard" | "verbose";
  custom: Record<string, string>;
}

/** Session stats parsed from history.md. */
interface SessionHistory {
  sessionCount: number;
  lastSessionDate: string;
  totalFilesCreated: number;
  totalFilesUpdated: number;
}

/** The full memory summary produced by the reader. */
interface MemorySummary {
  isFirstRun: boolean;
  decisions: Decision[];
  decisionsCount: number;
  conventions: Conventions;
  patternsCount: number;
  preferences: UserPreferences;
  history: SessionHistory;
  warnings: string[];
}

// --- Constants ---

const DEFAULT_MEMORY_DIR = "forge-memory";
const DEFAULT_MAX_ENTRIES = 10;
const MAX_FILE_SIZE = 100 * 1024; // 100KB

const DEFAULT_PREFERENCES: UserPreferences = {
  verbosity: "intermediate",
  stackPreference: "not set",
  testing: "not set",
  memoryEntriesToLoad: DEFAULT_MAX_ENTRIES,
  generationStyle: "standard",
  custom: {},
};

const EMPTY_CONVENTIONS: Conventions = {
  stackConventions: [],
  fileStructure: {},
  namingConventions: {},
  projectPatterns: [],
};

const EMPTY_HISTORY: SessionHistory = {
  sessionCount: 0,
  lastSessionDate: "never",
  totalFilesCreated: 0,
  totalFilesUpdated: 0,
};

// --- File Reading Helpers ---

async function dirExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function safeReadFile(path: string, warnings: string[]): Promise<string | null> {
  try {
    const content = await readFile(path, "utf-8");
    if (content.length > MAX_FILE_SIZE) {
      warnings.push(`${path}: file exceeds ${MAX_FILE_SIZE / 1024}KB — truncated`);
      return content.slice(0, MAX_FILE_SIZE);
    }
    return content;
  } catch {
    return null;
  }
}

// --- Parsers ---

/** Tags indicating the decision relates to stack choices. */
const STACK_KEYWORDS = [
  "stack", "framework", "language", "typescript", "python", "javascript",
  "go", "c#", "react", "express", "fastapi", "prisma", "django",
];

/** Tags indicating the decision records a user preference. */
const PREF_KEYWORDS = [
  "user override", "user chose", "changed preference", "preference",
  "verbosity", "opted for",
];

function tagDecision(entry: Decision): ("stack" | "preference")[] {
  const tags: ("stack" | "preference")[] = [];
  const text = `${entry.context} ${entry.decision} ${entry.reason} ${entry.impact}`.toLowerCase();
  if (STACK_KEYWORDS.some((kw) => text.includes(kw))) tags.push("stack");
  if (PREF_KEYWORDS.some((kw) => text.includes(kw))) tags.push("preference");
  return tags;
}

/**
 * Parse decisions.md into a structured array of Decision objects.
 * Entries start with `### YYYY-MM-DD` headings.
 */
function parseDecisions(content: string, maxEntries: number): Decision[] {
  const entries: Decision[] = [];
  // Split on ### headings that start with a date pattern
  const entryPattern = /^### (\d{4}-\d{2}-\d{2})\s*[—:]\s*(.+)$/gm;
  const matches: { date: string; title: string; startIndex: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(content)) !== null) {
    matches.push({ date: match[1], title: match[2].trim(), startIndex: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].startIndex;
    const end = i + 1 < matches.length ? matches[i + 1].startIndex : content.length;
    const block = content.slice(start, end);

    const entry: Decision = {
      date: matches[i].date,
      title: matches[i].title,
      context: extractField(block, "Context") || extractField(block, "What") || "unknown",
      decision: extractField(block, "Decision") || extractField(block, "Why") || "unknown",
      reason: extractField(block, "Reason") || extractField(block, "Stack") || "unknown",
      impact: extractField(block, "Impact") || extractField(block, "Options enabled") || "unknown",
      tags: [],
    };
    entry.tags = tagDecision(entry);
    entries.push(entry);
  }

  // Return most recent N entries (entries are in document order, most recent first)
  return entries.slice(0, maxEntries);
}

/** Extract a bold-label field value from a markdown block. */
function extractField(block: string, label: string): string | null {
  const pattern = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?:\\n|$)`, "i");
  const match = block.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Parse patterns.md into structured conventions and project patterns.
 */
function parsePatterns(content: string): Conventions {
  const conventions: Conventions = {
    stackConventions: [],
    fileStructure: {},
    namingConventions: {},
    projectPatterns: [],
  };

  // Parse ## Stack Conventions
  const stackSection = extractSection(content, "Stack Conventions");
  if (stackSection) {
    conventions.stackConventions = extractBulletItems(stackSection);
  }

  // Parse ## File Structure
  const fileSection = extractSection(content, "File Structure");
  if (fileSection) {
    for (const item of extractBulletItems(fileSection)) {
      const colonIndex = item.indexOf(":");
      if (colonIndex > -1) {
        const key = item.slice(0, colonIndex).trim().toLowerCase();
        conventions.fileStructure[key] = item.slice(colonIndex + 1).trim();
      }
    }
  }

  // Parse ## Naming Conventions
  const namingSection = extractSection(content, "Naming Conventions");
  if (namingSection) {
    for (const item of extractBulletItems(namingSection)) {
      const colonIndex = item.indexOf(":");
      if (colonIndex > -1) {
        const key = item.slice(0, colonIndex).trim().toLowerCase();
        conventions.namingConventions[key] = item.slice(colonIndex + 1).trim();
      }
    }
  }

  // Parse ## Project-Specific Patterns
  const patternsSection = extractSection(content, "Project-Specific Patterns");
  if (patternsSection) {
    conventions.projectPatterns = parseProjectPatterns(patternsSection);
  }

  return conventions;
}

/** Extract a ## section from markdown (content between this heading and the next ## or end). */
function extractSection(content: string, heading: string): string | null {
  const pattern = new RegExp(`## ${heading}[\\s\\S]*?(?=\\n## |$)`, "i");
  const match = content.match(pattern);
  return match ? match[0] : null;
}

/** Extract bullet items (lines starting with - ) from a markdown section. */
function extractBulletItems(section: string): string[] {
  const items: string[] = [];
  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      items.push(trimmed.slice(2).trim());
    }
  }
  return items;
}

/** Parse ### sub-sections under Project-Specific Patterns into Pattern objects. */
function parseProjectPatterns(section: string): Pattern[] {
  const patterns: Pattern[] = [];
  const headingPattern = /^### (.+?)(?:\s*\((\w+)\))?$/gm;
  const matches: { name: string; confidence: string; startIndex: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(section)) !== null) {
    matches.push({
      name: match[1].trim(),
      confidence: match[2]?.toLowerCase() || "observed",
      startIndex: match.index,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].startIndex;
    const end = i + 1 < matches.length ? matches[i + 1].startIndex : section.length;
    const block = section.slice(start, end);

    patterns.push({
      name: matches[i].name,
      whenToUse: extractField(block, "When to use") || "unspecified",
      pattern: extractField(block, "Pattern") || "unspecified",
      confidence: normalizeConfidence(matches[i].confidence),
    });
  }

  return patterns;
}

function normalizeConfidence(raw: string): "observed" | "confirmed" | "established" {
  if (raw === "confirmed") return "confirmed";
  if (raw === "established") return "established";
  return "observed";
}

/**
 * Parse preferences.md into key-value pairs.
 * Supports bold-label (`**key:** value`), bullet (`- key: value`), and YAML (`key: value`) formats.
 */
function parsePreferences(content: string): UserPreferences {
  const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, custom: {} };
  const kvPattern = /(?:\*\*(.+?)\*\*:\s*|^-\s*(.+?):\s*|^(.+?):\s*)(.+)$/gm;

  let match: RegExpExecArray | null;
  while ((match = kvPattern.exec(content)) !== null) {
    const key = (match[1] || match[2] || match[3]).trim().toLowerCase().replace(/\s+/g, "_");
    const value = match[4].trim();

    switch (key) {
      case "verbosity":
        if (["beginner", "intermediate", "advanced"].includes(value)) {
          prefs.verbosity = value as UserPreferences["verbosity"];
        }
        break;
      case "stack_preference":
        prefs.stackPreference = value;
        break;
      case "testing":
        prefs.testing = value;
        break;
      case "memory_entries_to_load":
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) prefs.memoryEntriesToLoad = num;
        break;
      case "generation_style":
        if (["minimal", "standard", "verbose"].includes(value)) {
          prefs.generationStyle = value as UserPreferences["generationStyle"];
        }
        break;
      default:
        prefs.custom[key] = value;
    }
  }

  return prefs;
}

/**
 * Parse history.md into session stats.
 * Each session entry starts with `### Session {N}` or `### YYYY-MM-DD`.
 */
function parseHistory(content: string): SessionHistory {
  const history: SessionHistory = { ...EMPTY_HISTORY };

  const sessionPattern = /^### (?:Session \d+|(\d{4}-\d{2}-\d{2}))/gm;
  const dates: string[] = [];
  let count = 0;

  let match: RegExpExecArray | null;
  while ((match = sessionPattern.exec(content)) !== null) {
    count++;
    if (match[1]) dates.push(match[1]);
  }

  history.sessionCount = count;
  if (dates.length > 0) {
    dates.sort().reverse();
    history.lastSessionDate = dates[0];
  }

  // Extract aggregate stats from content
  const createdMatches = content.match(/files?\s*created[:\s]*(\d+)/gi) || [];
  for (const m of createdMatches) {
    const num = m.match(/(\d+)/);
    if (num) history.totalFilesCreated += parseInt(num[1], 10);
  }

  const updatedMatches = content.match(/files?\s*updated[:\s]*(\d+)/gi) || [];
  for (const m of updatedMatches) {
    const num = m.match(/(\d+)/);
    if (num) history.totalFilesUpdated += parseInt(num[1], 10);
  }

  return history;
}

// --- Main Reader ---

/**
 * Read all forge-memory files and produce a structured MemorySummary.
 *
 * Usage:
 *   const memory = await readForgeMemory("./forge-memory");
 *   if (!memory.isFirstRun) {
 *     console.log(memory.decisions);
 *     console.log(memory.conventions);
 *   }
 */
async function readForgeMemory(memoryDir: string = DEFAULT_MEMORY_DIR): Promise<MemorySummary> {
  const warnings: string[] = [];

  // Step 1: Check directory
  if (!(await dirExists(memoryDir))) {
    return {
      isFirstRun: true,
      decisions: [],
      decisionsCount: 0,
      conventions: EMPTY_CONVENTIONS,
      patternsCount: 0,
      preferences: { ...DEFAULT_PREFERENCES },
      history: { ...EMPTY_HISTORY },
      warnings: ["forge-memory/ directory not found — first run"],
    };
  }

  // Check if directory is empty
  try {
    const files = await readdir(memoryDir);
    if (files.length === 0) {
      return {
        isFirstRun: true,
        decisions: [],
        decisionsCount: 0,
        conventions: EMPTY_CONVENTIONS,
        patternsCount: 0,
        preferences: { ...DEFAULT_PREFERENCES },
        history: { ...EMPTY_HISTORY },
        warnings: ["forge-memory/ directory is empty — first run"],
      };
    }
  } catch {
    warnings.push("Could not read forge-memory/ directory listing");
  }

  // Step 2: Read preferences first (it controls max entries)
  const prefsContent = await safeReadFile(join(memoryDir, "preferences.md"), warnings);
  const preferences = prefsContent ? parsePreferences(prefsContent) : { ...DEFAULT_PREFERENCES };
  if (!prefsContent) warnings.push("preferences.md: not found — using defaults");

  // Step 3: Read decisions
  const decisionsContent = await safeReadFile(join(memoryDir, "decisions.md"), warnings);
  let decisions: Decision[] = [];
  let decisionsCount = 0;
  if (decisionsContent) {
    const allDecisions = parseDecisions(decisionsContent, Number.MAX_SAFE_INTEGER);
    decisionsCount = allDecisions.length;
    decisions = allDecisions.slice(0, preferences.memoryEntriesToLoad);
  } else {
    warnings.push("decisions.md: not found");
  }

  // Step 4: Read patterns
  const patternsContent = await safeReadFile(join(memoryDir, "patterns.md"), warnings);
  let conventions: Conventions = EMPTY_CONVENTIONS;
  if (patternsContent) {
    conventions = parsePatterns(patternsContent);
  } else {
    warnings.push("patterns.md: not found");
  }
  const patternsCount =
    conventions.stackConventions.length +
    Object.keys(conventions.fileStructure).length +
    Object.keys(conventions.namingConventions).length +
    conventions.projectPatterns.length;

  // Step 5: Read history
  const historyContent = await safeReadFile(join(memoryDir, "history.md"), warnings);
  const history = historyContent ? parseHistory(historyContent) : { ...EMPTY_HISTORY };
  if (!historyContent) warnings.push("history.md: not found");

  return {
    isFirstRun: false,
    decisions,
    decisionsCount,
    conventions,
    patternsCount,
    preferences,
    history,
    warnings,
  };
}

// --- Query Helpers ---

/** Return only decisions tagged as stack-related. */
function getStackDecisions(summary: MemorySummary): Decision[] {
  return summary.decisions.filter((d) => d.tags.includes("stack"));
}

/** Return only decisions tagged as user-preference changes. */
function getPreferenceDecisions(summary: MemorySummary): Decision[] {
  return summary.decisions.filter((d) => d.tags.includes("preference"));
}

/** Return patterns at or above the given confidence level. */
function getPatternsAboveConfidence(
  summary: MemorySummary,
  minConfidence: "observed" | "confirmed" | "established"
): Pattern[] {
  const levels = { observed: 0, confirmed: 1, established: 2 };
  const minLevel = levels[minConfidence];
  return summary.conventions.projectPatterns.filter(
    (p) => levels[p.confidence] >= minLevel
  );
}

/** Return the N most recent decisions. */
function getRecentDecisions(summary: MemorySummary, n: number): Decision[] {
  return summary.decisions.slice(0, n);
}

/** Return all conventions as a flat list of strings. */
function getActiveConventions(summary: MemorySummary): string[] {
  const items: string[] = [];
  items.push(...summary.conventions.stackConventions.map((c) => `[stack] ${c}`));
  for (const [key, val] of Object.entries(summary.conventions.fileStructure)) {
    items.push(`[structure] ${key}: ${val}`);
  }
  for (const [key, val] of Object.entries(summary.conventions.namingConventions)) {
    items.push(`[naming] ${key}: ${val}`);
  }
  for (const p of summary.conventions.projectPatterns) {
    items.push(`[pattern:${p.confidence}] ${p.name}: ${p.pattern}`);
  }
  return items;
}

/** Return true if forge-memory/ has at least one parseable file. */
function hasMemory(summary: MemorySummary): boolean {
  return !summary.isFirstRun;
}

// --- Context Summary Formatter ---

/**
 * Format the memory summary as a FORGE-MEMORY context block
 * that the Planner can inject into its working context.
 */
function formatContextBlock(summary: MemorySummary): string {
  if (summary.isFirstRun) {
    return "--- FORGE-MEMORY ---\nstatus: first run — no memory yet\n--- END FORGE-MEMORY ---";
  }

  const lines: string[] = ["--- FORGE-MEMORY ---"];

  // Project and stack info
  const project = summary.decisions[0]?.title || "unknown";
  const stack = summary.conventions.stackConventions.slice(0, 3).join(", ") || "not detected";
  lines.push(`project: ${project}`);
  lines.push(`stack: ${stack}`);
  lines.push(`skill_level: ${summary.preferences.verbosity}`);
  lines.push(`last_run: ${summary.history.lastSessionDate}`);
  lines.push(`session_count: ${summary.history.sessionCount || "unknown"}`);
  lines.push(`decisions_count: ${summary.decisionsCount}`);
  lines.push(`patterns_count: ${summary.patternsCount}`);
  lines.push("");

  // Recent decisions
  lines.push("recent_decisions:");
  const recent = summary.decisions.slice(0, 5);
  for (const d of recent) {
    lines.push(`  - ${d.date}: ${d.title} — ${d.decision.slice(0, 60)}`);
  }
  if (summary.decisionsCount > 5) {
    lines.push(`  ... and ${summary.decisionsCount - 5} more`);
  }
  lines.push("");

  // Active conventions
  lines.push("active_conventions:");
  const naming = Object.entries(summary.conventions.namingConventions)
    .map(([k, v]) => `${k}: ${v}`).join(", ") || "not set";
  const structure = Object.entries(summary.conventions.fileStructure)
    .map(([k, v]) => `${k}: ${v}`).join(", ") || "not set";
  const stackConv = summary.conventions.stackConventions.slice(0, 3).join("; ") || "not set";
  lines.push(`  - naming: ${naming}`);
  lines.push(`  - structure: ${structure}`);
  lines.push(`  - stack: ${stackConv}`);
  lines.push("");

  // User preferences
  lines.push("user_preferences:");
  lines.push(`  - verbosity: ${summary.preferences.verbosity}`);
  lines.push(`  - testing: ${summary.preferences.testing}`);
  for (const [key, val] of Object.entries(summary.preferences.custom)) {
    lines.push(`  - ${key}: ${val}`);
  }

  lines.push("--- END FORGE-MEMORY ---");
  return lines.join("\n");
}

// --- Example Usage ---

async function main() {
  console.log("=== Memory Reader Recipe ===\n");

  // TODO: Replace with the path to your project's forge-memory/ directory.
  const memoryDir = "./forge-memory";

  console.log(`Reading memory from: ${memoryDir}\n`);
  const summary = await readForgeMemory(memoryDir);

  if (summary.isFirstRun) {
    console.log("📭 No memory found — this is the first run.");
    console.log("   Warnings:", summary.warnings.join("; "));
    return;
  }

  console.log("📬 Memory loaded!\n");

  // Show stats
  console.log(`Decisions: ${summary.decisionsCount}`);
  console.log(`Patterns: ${summary.patternsCount}`);
  console.log(`Sessions: ${summary.history.sessionCount}`);
  console.log(`Last run: ${summary.history.lastSessionDate}`);
  console.log("");

  // Query: stack decisions
  const stackDecisions = getStackDecisions(summary);
  console.log(`Stack decisions (${stackDecisions.length}):`);
  for (const d of stackDecisions) {
    console.log(`  - ${d.date}: ${d.title}`);
  }

  // Query: confirmed+ patterns
  const confirmedPatterns = getPatternsAboveConfidence(summary, "confirmed");
  console.log(`\nConfirmed+ patterns (${confirmedPatterns.length}):`);
  for (const p of confirmedPatterns) {
    console.log(`  - [${p.confidence}] ${p.name}: ${p.pattern}`);
  }

  // Query: all conventions
  const conventions = getActiveConventions(summary);
  console.log(`\nActive conventions (${conventions.length}):`);
  for (const c of conventions) {
    console.log(`  - ${c}`);
  }

  // Full context block
  console.log("\n--- Formatted Context Block ---\n");
  console.log(formatContextBlock(summary));

  // Warnings
  if (summary.warnings.length > 0) {
    console.log("\n⚠️ Warnings:");
    for (const w of summary.warnings) {
      console.log(`  - ${w}`);
    }
  }
}

main().catch(console.error);
