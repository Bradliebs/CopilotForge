/**
 * knowledge-wiki.ts — CopilotForge Cookbook Recipe
 *
 * Inspired by: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
 *
 * WHAT THIS DOES:
 *   Sets up and manages a personal knowledge wiki — a structured, interlinked
 *   collection of markdown files that an AI maintains for you. Instead of
 *   re-deriving answers every time (like RAG), the wiki compiles knowledge
 *   once and keeps it current. Drop in sources, ask questions, and the wiki
 *   grows richer with every interaction.
 *
 * WHEN TO USE THIS:
 *   When you want a persistent, compounding knowledge base for research,
 *   learning, business intelligence, competitive analysis, book notes, or
 *   any domain where you accumulate information over time.
 *
 * HOW TO RUN:
 *   1. No npm install needed — uses only Node.js built-ins
 *   2. Initialize: node cookbook/knowledge-wiki.ts init
 *   3. Add a source: node cookbook/knowledge-wiki.ts ingest path/to/article.md
 *   4. Search: node cookbook/knowledge-wiki.ts search "quantum computing"
 *   5. Health check: node cookbook/knowledge-wiki.ts lint
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - Optional: Git (for version history of your wiki)
 *   - Optional: Obsidian (for browsing the wiki with graph view)
 *
 * EXPECTED OUTPUT:
 *   [Wiki] Initializing knowledge base...
 *   [Wiki] Created knowledge-base/raw/
 *   [Wiki] Created knowledge-base/wiki/entities/
 *   [Wiki] Created knowledge-base/wiki/concepts/
 *   [Wiki] Created knowledge-base/wiki/sources/
 *   [Wiki] Created knowledge-base/wiki/synthesis/
 *   [Wiki] Generated SCHEMA.md (wiki conventions for your AI)
 *   [Wiki] Generated wiki/index.md
 *   [Wiki] Generated wiki/log.md
 *   [Wiki] ✅ Knowledge base ready! Drop sources into raw/ and run 'ingest'.
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or rely on path.join()
 *   - macOS/Linux: Forward slashes work natively
 *   - Obsidian: Set vault root to knowledge-base/ for full graph view
 *   - Works with any AI: Copilot, Claude, ChatGPT — share SCHEMA.md with your AI
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}[Wiki]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[Wiki]${colors.reset} ✅ ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[Wiki]${colors.reset} ⚠️  ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[Wiki]${colors.reset} ❌ ${msg}`),
  dim: (msg: string) => console.log(`${colors.dim}${msg}${colors.reset}`),
  heading: (msg: string) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`),
};

const BASE_DIR = 'knowledge-base';

// Generate comprehensive SCHEMA.md
function generateSchema(): string {
  return `# Knowledge Wiki Schema

> This file tells your AI assistant how to maintain this wiki.
> Share it with your AI at the start of each session.

## Overview

This is a **persistent, compounding knowledge base** — not a cache, not a search index, but a living document that grows richer over time. You drop in sources (articles, papers, notes, transcripts), and the AI extracts, organizes, and interlinks the knowledge. Future queries pull from this structured wiki instead of re-deriving answers from scratch.

## Directory Structure

\`\`\`
knowledge-base/
  raw/                    # Immutable source documents
    assets/               # Images, PDFs, attachments
  wiki/                   # AI-maintained markdown pages (never edit manually)
    entities/             # People, organizations, places
    concepts/             # Ideas, technologies, methods
    sources/              # One summary page per ingested source
    synthesis/            # Cross-cutting analysis and comparisons
    index.md              # Master catalog of all pages
    log.md                # Chronological record of operations
  SCHEMA.md               # This file — wiki conventions and instructions
  .gitignore              # Ignore large binary files in raw/assets
\`\`\`

### Directories Explained

- **raw/**: Drop source documents here. The AI reads them but NEVER modifies them. Treat as immutable inputs.
- **wiki/entities/**: Pages about specific entities — people (e.g., \`[[Alan Turing]]\`), organizations (\`[[OpenAI]]\`), places (\`[[MIT]]\`).
- **wiki/concepts/**: Pages about ideas, technologies, methods — \`[[Transformer Architecture]]\`, \`[[Retrieval-Augmented Generation]]\`, \`[[Spaced Repetition]]\`.
- **wiki/sources/**: Summary pages for each ingested source. One file per source document with key takeaways, entities mentioned, concepts covered.
- **wiki/synthesis/**: Cross-cutting pages — comparisons (\`[[RAG vs Fine-tuning]]\`), timelines, thematic analyses, Q&A compilations.
- **wiki/index.md**: The master catalog. Lists every page with a one-line summary, tags, and links. Start here when answering questions.
- **wiki/log.md**: Append-only chronological log. Every ingest, query, or maintenance operation gets an entry.

## Page Format

Every wiki page uses **YAML frontmatter** and **wikilinks**:

\`\`\`markdown
---
title: Transformer Architecture
tags: [machine-learning, deep-learning, nlp]
sources: [attention-is-all-you-need-2017, bert-paper-2018]
created: 2024-01-15
updated: 2024-01-20
aliases: [Transformers, Attention Mechanism]
---

# Transformer Architecture

The Transformer is a neural network architecture introduced in [[Attention Is All You Need]] (2017) by [[Google Brain]]. It relies entirely on self-attention mechanisms, eliminating recurrence and convolutions.

## Key Innovations

- **Self-Attention**: Each token attends to all other tokens in parallel
- **Positional Encoding**: Since there's no recurrence, position info is injected via sinusoidal encodings
- **Multi-Head Attention**: Multiple attention layers operating in parallel

## Connections

- Used in [[BERT]], [[GPT]], [[T5]]
- Contrast with [[RNN]], [[LSTM]], [[CNN]]
- Related: [[Attention Mechanism]], [[Sequence-to-Sequence Models]]

## Sources

- [[Attention Is All You Need (2017)]]
- [[BERT Paper (2018)]]
\`\`\`

### Frontmatter Fields

- **title**: Human-readable page name
- **tags**: List of keywords for search and categorization
- **sources**: List of source page slugs (not paths, just the filename without .md)
- **created**: ISO date when page was first created
- **updated**: ISO date of last modification
- **aliases**: Alternative names for this concept (for search and linking)

### Wikilink Conventions

- Use \`[[Page Name]]\` for all cross-references
- Page names are case-insensitive for matching but prefer title case
- If a concept doesn't have a page yet, still link it — becomes a suggestion for creation
- Avoid deep nesting — prefer flat structure with rich linking

## Workflows

### 1. Ingest a New Source

**Goal**: Extract knowledge from a source document and integrate it into the wiki.

**Steps**:

1. **Read the source completely** — Don't skim. Understand the full context.

2. **Create a source summary page** in \`wiki/sources/\`:
   - Slug: kebab-case filename (e.g., \`attention-is-all-you-need-2017.md\`)
   - Frontmatter: title, date_ingested, source_path, tags
   - Content:
     - ## Summary (2-3 paragraphs)
     - ## Key Takeaways (bullet list)
     - ## Entities Mentioned (people, orgs, places with wikilinks)
     - ## Concepts Covered (ideas, technologies with wikilinks)
     - ## Questions Raised (gaps, follow-ups)

3. **For each entity mentioned**:
   - If entity page exists: add a reference to this source, update relevant sections
   - If not: create \`wiki/entities/{name}.md\` with bio/description, sources, related concepts

4. **For each concept covered**:
   - If concept page exists: integrate new information, add source reference
   - If not: create \`wiki/concepts/{name}.md\` with definition, connections, sources

5. **Update \`wiki/index.md\`**:
   - Add entries for all new pages (source, entities, concepts)
   - Format: \`- [[Page Name]] — one-line summary (tags: #tag1, #tag2)\`

6. **Append to \`wiki/log.md\`**:
   - Format: \`## [2024-01-15 14:23] Ingested | attention-is-all-you-need-2017.md\`
   - List: created 1 source page, updated 3 concept pages, created 2 entity pages

7. **Report**: Print summary of what was created and updated

**Example Output**:
\`\`\`
[Ingest] Read: attention-is-all-you-need-2017.pdf (8 pages)
[Ingest] Created: wiki/sources/attention-is-all-you-need-2017.md
[Ingest] Created: wiki/concepts/transformer-architecture.md
[Ingest] Updated: wiki/concepts/attention-mechanism.md
[Ingest] Created: wiki/entities/google-brain.md
[Ingest] Updated: wiki/index.md (3 new entries)
[Ingest] Logged operation in wiki/log.md
✅ Ingested successfully. 1 source, 1 new concept, 1 updated concept, 1 new entity.
\`\`\`

### 2. Answer a Question (Query)

**Goal**: Synthesize an answer from existing wiki pages.

**Steps**:

1. **Read \`wiki/index.md\`** — Scan for relevant pages by matching query keywords to titles, tags, summaries

2. **Read the relevant pages** — Load full content of top 5-10 matches

3. **Synthesize an answer**:
   - Write a clear, cited response
   - Use wikilinks to reference source pages
   - Include direct quotes where appropriate
   - Note any contradictions or uncertainties

4. **If the answer is valuable** (non-trivial, likely to be asked again):
   - File it in \`wiki/synthesis/{query-slug}.md\`
   - Add to index
   - Log the operation

**Example**:
\`\`\`
Query: "What are the key differences between transformers and RNNs?"

Answer:
[[Transformer Architecture]] and [[RNN]] differ in three main ways:

1. **Parallelization**: Transformers process all tokens simultaneously via [[Self-Attention]], 
   while RNNs process sequentially. This makes transformers much faster to train (see [[Attention Is All You Need]]).

2. **Long-range dependencies**: Transformers have direct connections between all token pairs 
   (O(1) path length), while RNNs must propagate info through many steps (O(n) path length). 
   This gives transformers better long-range memory (see [[LSTM]] for RNN improvements).

3. **Architecture**: Transformers use [[Positional Encoding]] to inject sequence order, 
   while RNNs encode order implicitly through recurrence.

Sources: [[Attention Is All You Need (2017)]], [[Understanding RNNs (2015)]]

[Filed in: wiki/synthesis/transformers-vs-rnns.md]
\`\`\`

### 3. Lint / Health Check

**Goal**: Find issues in the wiki and suggest improvements.

**Checks**:

1. **Broken links**: Scan all pages for \`[[Page Name]]\` where the target doesn't exist
   - Report: "[[Quantum Entanglement]] referenced in 3 pages but has no page"

2. **Orphan pages**: Pages with zero inbound links from other pages
   - Report: "wiki/concepts/bayes-theorem.md is an orphan (no inbound links)"

3. **Isolated pages**: Pages with zero outbound links to other pages
   - Report: "wiki/entities/alan-turing.md has no outbound links (consider connecting to related concepts)"

4. **Stale pages**: Pages not updated in 30+ days that reference recent sources
   - Report: "wiki/concepts/gpt-architecture.md last updated 45 days ago but new sources mention it"

5. **Contradictions** (advanced): Pages that make conflicting claims
   - Scan for "however", "actually", "contrary to" near wikilinks
   - Report: "Potential contradiction between [[RAG]] and [[Fine-tuning]] pages"

6. **Missing connections**: Frequently co-mentioned concepts that aren't linked
   - Report: "[[Neural Networks]] and [[Backpropagation]] mentioned together in 5 pages but not cross-linked"

7. **Suggested new pages**: Topics mentioned 3+ times but not yet created
   - Report: "Consider creating [[Embeddings]] — mentioned in 7 pages"

**Output Format**:
\`\`\`
=== Wiki Health Check ===

📊 Stats:
  - Total pages: 127
  - Total links: 543
  - Average links per page: 4.3

⚠️  Issues Found:

Broken Links (3):
  - [[Quantum Entanglement]] referenced in 3 pages → wiki/concepts/quantum-mechanics.md, ...
  - [[Zero-Shot Learning]] referenced in 2 pages → wiki/synthesis/few-shot-vs-zero-shot.md, ...

Orphan Pages (5):
  - wiki/concepts/bayes-theorem.md (no inbound links)
  - wiki/entities/yann-lecun.md (no inbound links)

Stale Pages (2):
  - wiki/concepts/gpt-architecture.md (last updated 45 days ago)

💡 Suggestions:

Create These Pages (mentioned 3+ times):
  - [[Embeddings]] (7 mentions)
  - [[Fine-tuning]] (5 mentions)

Consider Cross-linking:
  - [[Neural Networks]] ↔ [[Backpropagation]] (co-mentioned in 5 pages)

✅ Overall health: Good (94% of pages have inbound links)
\`\`\`

## Conventions & Best Practices

### Writing Style

- **Concise but complete**: 2-3 paragraphs per section, not walls of text
- **Link liberally**: Every mention of an entity or concept should be a wikilink
- **Source everything**: Every factual claim should reference a source page
- **Avoid duplication**: If two pages cover similar ground, merge or create a comparison page in synthesis/

### Page Organization

- **One concept per page**: If a page covers multiple distinct ideas, split it
- **Hierarchy through links**: Don't use nested folders; use wikilinks for relationships
- **Frontmatter discipline**: Always fill in tags, sources, dates

### Maintenance

- **Update, don't append**: When ingesting new info about an existing concept, integrate it into existing sections rather than appending new sections
- **Refactor when needed**: If a page grows too large (>500 lines), split it into sub-concepts
- **Prune dead ends**: If a page hasn't been referenced in 90 days and has no inbound links, consider merging or deleting

### Log Format

Every log entry follows this format:

\`\`\`markdown
## [YYYY-MM-DD HH:MM] Action | Description

- Created: X new pages
- Updated: Y existing pages
- Details: brief summary
\`\`\`

**Action verbs**: Ingested, Queried, Linted, Refactored, Merged, Deleted

## Integration with AI

This wiki is designed to be maintained by an AI assistant (you). To use it effectively:

1. **Share SCHEMA.md at the start of each session** — This primes the AI with conventions
2. **Use chat mode for queries** — "Update the wiki with this new paper" or "What does the wiki say about transformers?"
3. **Review AI changes** — The AI should report what it created/updated; spot-check for accuracy
4. **Git commit regularly** — Every few ingest operations, commit the wiki to preserve history
5. **Browse in Obsidian** — Set Obsidian vault to \`knowledge-base/\` for a graph view and rich editor

## Example Session

\`\`\`
You: I just read this paper on retrieval-augmented generation. Can you add it to the wiki?
[Attach: rag-paper-2023.pdf]

AI: Reading the paper... Done.

Created:
- wiki/sources/rag-paper-2023.md (summary with 5 key takeaways)
- wiki/concepts/retrieval-augmented-generation.md (new concept page)

Updated:
- wiki/concepts/language-models.md (added RAG as an extension technique)
- wiki/entities/meta-ai.md (added this paper to their research)
- wiki/index.md (3 new entries)
- wiki/log.md (logged ingest operation)

The paper introduces RAG as a way to give language models access to external knowledge without 
retraining. I've linked it to [[Language Models]], [[Information Retrieval]], and [[Few-Shot Learning]].

---

You: What's the difference between RAG and fine-tuning?

AI: Let me check the wiki...

According to [[Retrieval-Augmented Generation]] and [[Fine-tuning]]:

**RAG** retrieves relevant documents at inference time and conditions the model on them. 
Benefits: no retraining needed, knowledge stays current, works with smaller models.

**Fine-tuning** trains the model on domain-specific data to bake knowledge into the weights. 
Benefits: faster at inference (no retrieval), works offline, better for style/format adaptation.

Tradeoffs:
- RAG: requires a retrieval system, slower per query, but flexible and updateable
- Fine-tuning: requires training data and compute, but faster and more compact

Sources: [[RAG Paper (2023)]], [[Fine-tuning Best Practices (2022)]]

[Filed this answer in: wiki/synthesis/rag-vs-fine-tuning.md]
\`\`\`

---

## Questions?

This schema is a living document. If you find a better convention or workflow, update this file and propagate changes to existing pages.

**The goal**: A knowledge base that compounds over time, gets smarter with every source you add, and lets you query accumulated wisdom instead of starting from scratch.
`;
}

// Generate initial index.md
function generateIndex(): string {
  const now = new Date().toISOString().split('T')[0];
  return `---
title: Wiki Index
created: ${now}
updated: ${now}
---

# Wiki Index

> Master catalog of all pages in this knowledge base. Start here when searching for information.

## Sources

*Ingested source documents will be listed here.*

## Entities

*People, organizations, and places will be listed here.*

## Concepts

*Ideas, technologies, and methods will be listed here.*

## Synthesis

*Cross-cutting analysis and comparisons will be listed here.*

---

**Total Pages**: 0 | **Last Updated**: ${now}
`;
}

// Generate initial log.md
function generateLog(): string {
  const now = new Date().toISOString();
  return `---
title: Wiki Operation Log
---

# Wiki Operation Log

> Chronological record of all wiki operations. Append-only.

## [${now}] Initialized | Knowledge base created

- Created directory structure
- Generated SCHEMA.md
- Generated index.md
- Status: Ready for first ingest
`;
}

// Generate .gitignore
function generateGitignore(): string {
  return `# Large binary files
raw/assets/*.pdf
raw/assets/*.mp4
raw/assets/*.zip
raw/assets/*.tar.gz

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Temp files
*.tmp
*.temp
`;
}

// Ensure directory exists
function ensureDir(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    log.error(`Failed to create directory ${dirPath}: ${error}`);
    throw error;
  }
}

// Write file with error handling
function writeFile(filePath: string, content: string): void {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    log.error(`Failed to write file ${filePath}: ${error}`);
    throw error;
  }
}

// Read file with error handling
function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log.error(`Failed to read file ${filePath}: ${error}`);
    throw error;
  }
}

// Initialize wiki structure
function cmdInit(): void {
  log.heading('Initializing Knowledge Base');

  const dirs = [
    path.join(BASE_DIR, 'raw'),
    path.join(BASE_DIR, 'raw', 'assets'),
    path.join(BASE_DIR, 'wiki'),
    path.join(BASE_DIR, 'wiki', 'entities'),
    path.join(BASE_DIR, 'wiki', 'concepts'),
    path.join(BASE_DIR, 'wiki', 'sources'),
    path.join(BASE_DIR, 'wiki', 'synthesis'),
  ];

  for (const dir of dirs) {
    ensureDir(dir);
    log.info(`Created ${dir}/`);
  }

  writeFile(path.join(BASE_DIR, 'SCHEMA.md'), generateSchema());
  log.info('Generated SCHEMA.md (wiki conventions for your AI)');

  writeFile(path.join(BASE_DIR, 'wiki', 'index.md'), generateIndex());
  log.info('Generated wiki/index.md');

  writeFile(path.join(BASE_DIR, 'wiki', 'log.md'), generateLog());
  log.info('Generated wiki/log.md');

  writeFile(path.join(BASE_DIR, '.gitignore'), generateGitignore());
  log.info('Generated .gitignore');

  log.success('Knowledge base ready! Drop sources into raw/ and run \'ingest\'.');
  log.dim('\nNext steps:');
  log.dim(`  1. Add a source document to ${BASE_DIR}/raw/`);
  log.dim(`  2. Run: node cookbook/knowledge-wiki.ts ingest ${BASE_DIR}/raw/your-document.md`);
  log.dim(`  3. Optional: Initialize git repo: cd ${BASE_DIR} && git init`);
  log.dim(`  4. Optional: Open in Obsidian for graph view`);
}

// Convert filename to slug
function toSlug(filename: string): string {
  return path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Ingest a source document
function cmdIngest(sourceFile: string): void {
  log.heading('Ingesting Source Document');

  if (!fs.existsSync(sourceFile)) {
    log.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const wikiDir = path.join(BASE_DIR, 'wiki');
  if (!fs.existsSync(wikiDir)) {
    log.error(`Wiki not initialized. Run 'init' first.`);
    process.exit(1);
  }

  const slug = toSlug(sourceFile);
  const rawDest = path.join(BASE_DIR, 'raw', path.basename(sourceFile));
  const sourcePage = path.join(BASE_DIR, 'wiki', 'sources', `${slug}.md`);

  // Copy source to raw/
  try {
    fs.copyFileSync(sourceFile, rawDest);
    log.info(`Copied source to ${rawDest}`);
  } catch (error) {
    log.error(`Failed to copy source: ${error}`);
    process.exit(1);
  }

  // Read source content
  const content = readFile(sourceFile);
  const now = new Date().toISOString().split('T')[0];

  // Generate source summary page with TODO markers
  const summaryContent = `---
title: ${path.basename(sourceFile)}
date_ingested: ${now}
source_path: ${path.relative(BASE_DIR, rawDest)}
tags: []
---

# ${path.basename(sourceFile)}

## Summary

TODO: Connect this to your LLM of choice (Copilot SDK, OpenAI, Anthropic, etc.) to auto-extract a 2-3 paragraph summary.

For now, this is a placeholder. The source has been copied to \`${path.relative(BASE_DIR, rawDest)}\`.

**Character count**: ${content.length}
**Line count**: ${content.split('\n').length}

## Key Takeaways

TODO: Extract bullet points of key insights from the source.

- [Key point 1]
- [Key point 2]
- [Key point 3]

## Entities Mentioned

TODO: Identify people, organizations, places mentioned in the source.

- [[Entity 1]] — description
- [[Entity 2]] — description

## Concepts Covered

TODO: Identify main ideas, technologies, methods discussed.

- [[Concept 1]] — description
- [[Concept 2]] — description

## Questions Raised

TODO: Note any gaps, follow-up questions, or areas needing deeper exploration.

- Question 1?
- Question 2?

---

**Next Steps**: Connect an LLM to automatically populate these sections. See SCHEMA.md for the full ingest workflow.
`;

  writeFile(sourcePage, summaryContent);
  log.info(`Created ${sourcePage}`);

  // Update index (simple append for now)
  const indexPath = path.join(BASE_DIR, 'wiki', 'index.md');
  const indexContent = readFile(indexPath);
  const updatedIndex = indexContent.replace(
    '## Sources\n\n*Ingested source documents will be listed here.*',
    `## Sources\n\n- [[${slug}]] — ${path.basename(sourceFile)} (ingested ${now})`
  ).replace(
    /\*\*Total Pages\*\*: \d+/,
    (match) => {
      const current = parseInt(match.split(': ')[1]);
      return `**Total Pages**: ${current + 1}`;
    }
  );
  writeFile(indexPath, updatedIndex);
  log.info('Updated wiki/index.md');

  // Append to log
  const logPath = path.join(BASE_DIR, 'wiki', 'log.md');
  const logContent = readFile(logPath);
  const logEntry = `\n## [${new Date().toISOString()}] Ingested | ${path.basename(sourceFile)}

- Created: wiki/sources/${slug}.md
- Status: Summary page created with TODO markers
- Note: Connect an LLM to automatically extract entities and concepts
`;
  writeFile(logPath, logContent + logEntry);
  log.info('Logged operation in wiki/log.md');

  log.success('Ingested successfully!');
  log.dim('\nWhat was created:');
  log.dim(`  - Source summary: wiki/sources/${slug}.md`);
  log.dim(`  - Raw copy: ${path.relative(BASE_DIR, rawDest)}`);
  log.dim('\nNext steps:');
  log.dim('  - Review the generated summary page');
  log.dim('  - Connect an LLM to automatically extract entities and concepts');
  log.dim('  - See SCHEMA.md for the complete ingest workflow');
}

// Extract wikilinks from markdown content
function extractWikilinks(content: string): string[] {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    links.push(match[1].toLowerCase().trim());
  }
  return links;
}

// Search wiki pages
function cmdSearch(query: string): void {
  log.heading(`Searching Wiki for "${query}"`);

  const wikiDir = path.join(BASE_DIR, 'wiki');
  if (!fs.existsSync(wikiDir)) {
    log.error('Wiki not initialized. Run \'init\' first.');
    process.exit(1);
  }

  const queryLower = query.toLowerCase();
  const results: Array<{ file: string; score: number; matches: string[] }> = [];

  // Recursively search all .md files
  function searchDir(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          searchDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = readFile(fullPath);
          const lines = content.split('\n');
          let score = 0;
          const matches: string[] = [];

          // Check filename
          if (entry.name.toLowerCase().includes(queryLower)) {
            score += 10;
            matches.push(`Filename: ${entry.name}`);
          }

          // Check frontmatter tags
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            if (frontmatter.toLowerCase().includes(queryLower)) {
              score += 5;
              matches.push('Match in frontmatter');
            }
          }

          // Check headings and content
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase().includes(queryLower)) {
              if (line.startsWith('#')) {
                score += 3;
                matches.push(`Heading (line ${i + 1}): ${line.trim()}`);
              } else {
                score += 1;
                matches.push(`Content (line ${i + 1}): ${line.trim().substring(0, 80)}${line.length > 80 ? '...' : ''}`);
              }
            }
          }

          if (score > 0) {
            results.push({ file: path.relative(BASE_DIR, fullPath), score, matches });
          }
        }
      }
    } catch (error) {
      log.warn(`Error reading directory ${dir}: ${error}`);
    }
  }

  searchDir(wikiDir);

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    log.warn('No results found.');
    log.dim('\nTips:');
    log.dim('  - Try different keywords');
    log.dim('  - Check if the wiki has been populated with content');
    log.dim('  - Search is case-insensitive');
    return;
  }

  log.success(`Found ${results.length} result(s):\n`);

  for (let i = 0; i < Math.min(results.length, 10); i++) {
    const result = results[i];
    console.log(`${colors.bright}${i + 1}. ${result.file}${colors.reset} ${colors.dim}(score: ${result.score})${colors.reset}`);
    for (const match of result.matches.slice(0, 3)) {
      console.log(`   ${colors.dim}→${colors.reset} ${match}`);
    }
    console.log('');
  }

  if (results.length > 10) {
    log.dim(`... and ${results.length - 10} more results.`);
  }
}

// Lint the wiki
function cmdLint(): void {
  log.heading('Wiki Health Check');

  const wikiDir = path.join(BASE_DIR, 'wiki');
  if (!fs.existsSync(wikiDir)) {
    log.error('Wiki not initialized. Run \'init\' first.');
    process.exit(1);
  }

  // Collect all pages and their links
  const pages: string[] = [];
  const linkMap = new Map<string, string[]>(); // page -> outbound links
  const inboundMap = new Map<string, string[]>(); // page -> inbound links
  const allWikilinks = new Set<string>();

  function collectPages(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectPages(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relativePath = path.relative(wikiDir, fullPath);
          pages.push(relativePath);

          const content = readFile(fullPath);
          const links = extractWikilinks(content);
          linkMap.set(relativePath, links);

          for (const link of links) {
            allWikilinks.add(link);
            if (!inboundMap.has(link)) {
              inboundMap.set(link, []);
            }
            inboundMap.get(link)!.push(relativePath);
          }
        }
      }
    } catch (error) {
      log.warn(`Error reading directory ${dir}: ${error}`);
    }
  }

  collectPages(wikiDir);

  log.info(`📊 Stats:`);
  console.log(`  - Total pages: ${pages.length}`);
  const totalLinks = Array.from(linkMap.values()).reduce((sum, links) => sum + links.length, 0);
  console.log(`  - Total links: ${totalLinks}`);
  const avgLinks = pages.length > 0 ? (totalLinks / pages.length).toFixed(1) : '0';
  console.log(`  - Average links per page: ${avgLinks}\n`);

  // Find broken links
  const brokenLinks = new Map<string, string[]>(); // link -> pages referencing it
  for (const link of allWikilinks) {
    const exists = pages.some(page => {
      const pageName = path.basename(page, '.md').toLowerCase().replace(/-/g, ' ');
      return pageName === link.replace(/-/g, ' ');
    });
    if (!exists) {
      brokenLinks.set(link, inboundMap.get(link) || []);
    }
  }

  if (brokenLinks.size > 0) {
    log.warn(`Broken Links (${brokenLinks.size}):`);
    let count = 0;
    for (const [link, refs] of brokenLinks) {
      if (count >= 5) {
        log.dim(`  ... and ${brokenLinks.size - 5} more`);
        break;
      }
      console.log(`  - [[${link}]] referenced in ${refs.length} page(s)`);
      for (const ref of refs.slice(0, 2)) {
        console.log(`    ${colors.dim}→ ${ref}${colors.reset}`);
      }
      count++;
    }
    console.log('');
  }

  // Find orphan pages (no inbound links)
  const orphans: string[] = [];
  for (const page of pages) {
    const pageName = path.basename(page, '.md').toLowerCase().replace(/-/g, ' ');
    if (!inboundMap.has(pageName) && page !== 'index.md' && page !== 'log.md') {
      orphans.push(page);
    }
  }

  if (orphans.length > 0) {
    log.warn(`Orphan Pages (${orphans.length}):`);
    for (const orphan of orphans.slice(0, 5)) {
      console.log(`  - ${orphan} (no inbound links)`);
    }
    if (orphans.length > 5) {
      log.dim(`  ... and ${orphans.length - 5} more`);
    }
    console.log('');
  }

  // Find isolated pages (no outbound links)
  const isolated: string[] = [];
  for (const page of pages) {
    const links = linkMap.get(page) || [];
    if (links.length === 0 && page !== 'index.md' && page !== 'log.md') {
      isolated.push(page);
    }
  }

  if (isolated.length > 0) {
    log.warn(`Isolated Pages (${isolated.length}):`);
    for (const iso of isolated.slice(0, 5)) {
      console.log(`  - ${iso} (no outbound links)`);
    }
    if (isolated.length > 5) {
      log.dim(`  ... and ${isolated.length - 5} more`);
    }
    console.log('');
  }

  // Suggestions
  if (brokenLinks.size > 0) {
    log.info('💡 Suggestions:');
    console.log('  Create pages for frequently-mentioned topics:');
    const sorted = Array.from(brokenLinks.entries()).sort((a, b) => b[1].length - a[1].length);
    for (const [link, refs] of sorted.slice(0, 5)) {
      console.log(`    - [[${link}]] (${refs.length} mentions)`);
    }
    console.log('');
  }

  // Overall health
  const healthScore = pages.length > 0 ? ((pages.length - orphans.length) / pages.length * 100).toFixed(0) : '0';
  if (parseInt(healthScore) >= 90) {
    log.success(`Overall health: Excellent (${healthScore}% of pages have inbound links)`);
  } else if (parseInt(healthScore) >= 70) {
    log.info(`Overall health: Good (${healthScore}% of pages have inbound links)`);
  } else {
    log.warn(`Overall health: Needs improvement (${healthScore}% of pages have inbound links)`);
  }
}

// Show wiki status
function cmdStatus(): void {
  log.heading('Wiki Status');

  const wikiDir = path.join(BASE_DIR, 'wiki');
  if (!fs.existsSync(wikiDir)) {
    log.error('Wiki not initialized. Run \'init\' first.');
    process.exit(1);
  }

  // Count pages by type
  const counts = {
    sources: 0,
    entities: 0,
    concepts: 0,
    synthesis: 0,
    total: 0,
  };

  function countPages(dir: string, type: keyof typeof counts): void {
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir);
      counts[type] = entries.filter(e => e.endsWith('.md')).length;
      counts.total += counts[type];
    } catch (error) {
      log.warn(`Error reading ${dir}: ${error}`);
    }
  }

  countPages(path.join(wikiDir, 'sources'), 'sources');
  countPages(path.join(wikiDir, 'entities'), 'entities');
  countPages(path.join(wikiDir, 'concepts'), 'concepts');
  countPages(path.join(wikiDir, 'synthesis'), 'synthesis');

  console.log(`${colors.bright}📚 Pages${colors.reset}`);
  console.log(`  Total: ${colors.green}${counts.total}${colors.reset}`);
  console.log(`  Sources: ${counts.sources}`);
  console.log(`  Entities: ${counts.entities}`);
  console.log(`  Concepts: ${counts.concepts}`);
  console.log(`  Synthesis: ${counts.synthesis}\n`);

  // Read last log entry
  const logPath = path.join(wikiDir, 'log.md');
  if (fs.existsSync(logPath)) {
    const logContent = readFile(logPath);
    const entries = logContent.split('\n## [').slice(1);
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      const match = lastEntry.match(/^([^\]]+)\] ([^|]+)\|/);
      if (match) {
        console.log(`${colors.bright}📅 Last Activity${colors.reset}`);
        console.log(`  Date: ${match[1]}`);
        console.log(`  Action: ${match[2].trim()}\n`);
      }
    }
  }

  // Count total links
  let totalLinks = 0;
  function countLinks(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          countLinks(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = readFile(fullPath);
          const links = extractWikilinks(content);
          totalLinks += links.length;
        }
      }
    } catch (error) {
      // Silent fail for status
    }
  }
  countLinks(wikiDir);

  console.log(`${colors.bright}🔗 Connections${colors.reset}`);
  console.log(`  Total wikilinks: ${totalLinks}\n`);

  console.log(`${colors.dim}Run 'lint' for detailed health check${colors.reset}`);
}

// Main CLI router
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${colors.bright}${colors.cyan}Knowledge Wiki${colors.reset} — Personal Knowledge Base Manager\n`);
    console.log('Usage:');
    console.log('  node cookbook/knowledge-wiki.ts init              # Set up wiki structure');
    console.log('  node cookbook/knowledge-wiki.ts ingest <file>     # Process a source document');
    console.log('  node cookbook/knowledge-wiki.ts search <query>    # Search wiki pages');
    console.log('  node cookbook/knowledge-wiki.ts lint              # Health-check the wiki');
    console.log('  node cookbook/knowledge-wiki.ts status            # Show wiki stats\n');
    console.log('Examples:');
    console.log('  node cookbook/knowledge-wiki.ts init');
    console.log('  node cookbook/knowledge-wiki.ts ingest papers/attention-is-all-you-need.pdf');
    console.log('  node cookbook/knowledge-wiki.ts search "transformer architecture"\n');
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'init':
      cmdInit();
      break;
    case 'ingest':
      if (args.length < 2) {
        log.error('Usage: ingest <file>');
        process.exit(1);
      }
      cmdIngest(args[1]);
      break;
    case 'search':
      if (args.length < 2) {
        log.error('Usage: search <query>');
        process.exit(1);
      }
      cmdSearch(args.slice(1).join(' '));
      break;
    case 'lint':
      cmdLint();
      break;
    case 'status':
      cmdStatus();
      break;
    default:
      log.error(`Unknown command: ${command}`);
      log.dim('Run without arguments to see usage.');
      process.exit(1);
  }
}

main();
