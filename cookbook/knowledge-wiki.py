#!/usr/bin/env python3
"""
knowledge-wiki.py — CopilotForge Cookbook Recipe

Inspired by: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

WHAT THIS DOES:
  Sets up and manages a personal knowledge wiki — a structured, interlinked
  collection of markdown files that an AI maintains for you. Instead of
  re-deriving answers every time (like RAG), the wiki compiles knowledge
  once and keeps it current. Drop in sources, ask questions, and the wiki
  grows richer with every interaction.

WHEN TO USE THIS:
  When you want a persistent, compounding knowledge base for research,
  learning, business intelligence, competitive analysis, book notes, or
  any domain where you accumulate information over time.

HOW TO RUN:
  1. No pip install needed — uses only Python stdlib
  2. Initialize: python cookbook/knowledge-wiki.py init
  3. Add a source: python cookbook/knowledge-wiki.py ingest path/to/article.md
  4. Search: python cookbook/knowledge-wiki.py search "quantum computing"
  5. Health check: python cookbook/knowledge-wiki.py lint

PREREQUISITES:
  - Python 3.8+
  - Optional: Git (for version history of your wiki)
  - Optional: Obsidian (for browsing the wiki with graph view)

EXPECTED OUTPUT:
  [Wiki] Initializing knowledge base...
  [Wiki] Created knowledge-base/raw/
  [Wiki] Created knowledge-base/wiki/entities/
  [Wiki] Created knowledge-base/wiki/concepts/
  [Wiki] Created knowledge-base/wiki/sources/
  [Wiki] Created knowledge-base/wiki/synthesis/
  [Wiki] Generated SCHEMA.md (wiki conventions for your AI)
  [Wiki] Generated wiki/index.md
  [Wiki] Generated wiki/log.md
  [Wiki] ✅ Knowledge base ready! Drop sources into raw/ and run 'ingest'.

PLATFORM NOTES:
  - Windows: Backslashes in paths handled automatically by pathlib
  - macOS/Linux: Forward slashes work natively
  - Obsidian: Set vault root to knowledge-base/ for full graph view
  - Works with any AI: Copilot, Claude, ChatGPT — share SCHEMA.md with your AI
"""

import sys
import argparse
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import shutil

# ANSI color codes for better output
class Colors:
    RESET = '\033[0m'
    BRIGHT = '\033[1m'
    DIM = '\033[2m'
    CYAN = '\033[36m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    RED = '\033[31m'
    MAGENTA = '\033[35m'
    BLUE = '\033[34m'

class Log:
    @staticmethod
    def info(msg: str):
        print(f"{Colors.CYAN}[Wiki]{Colors.RESET} {msg}")
    
    @staticmethod
    def success(msg: str):
        print(f"{Colors.GREEN}[Wiki]{Colors.RESET} ✅ {msg}")
    
    @staticmethod
    def warn(msg: str):
        print(f"{Colors.YELLOW}[Wiki]{Colors.RESET} ⚠️  {msg}")
    
    @staticmethod
    def error(msg: str):
        print(f"{Colors.RED}[Wiki]{Colors.RESET} ❌ {msg}")
    
    @staticmethod
    def dim(msg: str):
        print(f"{Colors.DIM}{msg}{Colors.RESET}")
    
    @staticmethod
    def heading(msg: str):
        print(f"\n{Colors.BRIGHT}{Colors.MAGENTA}{msg}{Colors.RESET}\n")

BASE_DIR = Path('knowledge-base')

def generate_schema() -> str:
    """Generate comprehensive SCHEMA.md content"""
    return """# Knowledge Wiki Schema

> This file tells your AI assistant how to maintain this wiki.
> Share it with your AI at the start of each session.

## Overview

This is a **persistent, compounding knowledge base** — not a cache, not a search index, but a living document that grows richer over time. You drop in sources (articles, papers, notes, transcripts), and the AI extracts, organizes, and interlinks the knowledge. Future queries pull from this structured wiki instead of re-deriving answers from scratch.

## Directory Structure

```
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
```

### Directories Explained

- **raw/**: Drop source documents here. The AI reads them but NEVER modifies them. Treat as immutable inputs.
- **wiki/entities/**: Pages about specific entities — people (e.g., `[[Alan Turing]]`), organizations (`[[OpenAI]]`), places (`[[MIT]]`).
- **wiki/concepts/**: Pages about ideas, technologies, methods — `[[Transformer Architecture]]`, `[[Retrieval-Augmented Generation]]`, `[[Spaced Repetition]]`.
- **wiki/sources/**: Summary pages for each ingested source. One file per source document with key takeaways, entities mentioned, concepts covered.
- **wiki/synthesis/**: Cross-cutting pages — comparisons (`[[RAG vs Fine-tuning]]`), timelines, thematic analyses, Q&A compilations.
- **wiki/index.md**: The master catalog. Lists every page with a one-line summary, tags, and links. Start here when answering questions.
- **wiki/log.md**: Append-only chronological log. Every ingest, query, or maintenance operation gets an entry.

## Page Format

Every wiki page uses **YAML frontmatter** and **wikilinks**:

```markdown
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
```

### Frontmatter Fields

- **title**: Human-readable page name
- **tags**: List of keywords for search and categorization
- **sources**: List of source page slugs (not paths, just the filename without .md)
- **created**: ISO date when page was first created
- **updated**: ISO date of last modification
- **aliases**: Alternative names for this concept (for search and linking)

### Wikilink Conventions

- Use `[[Page Name]]` for all cross-references
- Page names are case-insensitive for matching but prefer title case
- If a concept doesn't have a page yet, still link it — becomes a suggestion for creation
- Avoid deep nesting — prefer flat structure with rich linking

## Workflows

### 1. Ingest a New Source

**Goal**: Extract knowledge from a source document and integrate it into the wiki.

**Steps**:

1. **Read the source completely** — Don't skim. Understand the full context.

2. **Create a source summary page** in `wiki/sources/`:
   - Slug: kebab-case filename (e.g., `attention-is-all-you-need-2017.md`)
   - Frontmatter: title, date_ingested, source_path, tags
   - Content:
     - ## Summary (2-3 paragraphs)
     - ## Key Takeaways (bullet list)
     - ## Entities Mentioned (people, orgs, places with wikilinks)
     - ## Concepts Covered (ideas, technologies with wikilinks)
     - ## Questions Raised (gaps, follow-ups)

3. **For each entity mentioned**:
   - If entity page exists: add a reference to this source, update relevant sections
   - If not: create `wiki/entities/{name}.md` with bio/description, sources, related concepts

4. **For each concept covered**:
   - If concept page exists: integrate new information, add source reference
   - If not: create `wiki/concepts/{name}.md` with definition, connections, sources

5. **Update `wiki/index.md`**:
   - Add entries for all new pages (source, entities, concepts)
   - Format: `- [[Page Name]] — one-line summary (tags: #tag1, #tag2)`

6. **Append to `wiki/log.md`**:
   - Format: `## [2024-01-15 14:23] Ingested | attention-is-all-you-need-2017.md`
   - List: created 1 source page, updated 3 concept pages, created 2 entity pages

7. **Report**: Print summary of what was created and updated

**Example Output**:
```
[Ingest] Read: attention-is-all-you-need-2017.pdf (8 pages)
[Ingest] Created: wiki/sources/attention-is-all-you-need-2017.md
[Ingest] Created: wiki/concepts/transformer-architecture.md
[Ingest] Updated: wiki/concepts/attention-mechanism.md
[Ingest] Created: wiki/entities/google-brain.md
[Ingest] Updated: wiki/index.md (3 new entries)
[Ingest] Logged operation in wiki/log.md
✅ Ingested successfully. 1 source, 1 new concept, 1 updated concept, 1 new entity.
```

### 2. Answer a Question (Query)

**Goal**: Synthesize an answer from existing wiki pages.

**Steps**:

1. **Read `wiki/index.md`** — Scan for relevant pages by matching query keywords to titles, tags, summaries

2. **Read the relevant pages** — Load full content of top 5-10 matches

3. **Synthesize an answer**:
   - Write a clear, cited response
   - Use wikilinks to reference source pages
   - Include direct quotes where appropriate
   - Note any contradictions or uncertainties

4. **If the answer is valuable** (non-trivial, likely to be asked again):
   - File it in `wiki/synthesis/{query-slug}.md`
   - Add to index
   - Log the operation

**Example**:
```
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
```

### 3. Lint / Health Check

**Goal**: Find issues in the wiki and suggest improvements.

**Checks**:

1. **Broken links**: Scan all pages for `[[Page Name]]` where the target doesn't exist
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
```
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
```

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

```markdown
## [YYYY-MM-DD HH:MM] Action | Description

- Created: X new pages
- Updated: Y existing pages
- Details: brief summary
```

**Action verbs**: Ingested, Queried, Linted, Refactored, Merged, Deleted

## Integration with AI

This wiki is designed to be maintained by an AI assistant (you). To use it effectively:

1. **Share SCHEMA.md at the start of each session** — This primes the AI with conventions
2. **Use chat mode for queries** — "Update the wiki with this new paper" or "What does the wiki say about transformers?"
3. **Review AI changes** — The AI should report what it created/updated; spot-check for accuracy
4. **Git commit regularly** — Every few ingest operations, commit the wiki to preserve history
5. **Browse in Obsidian** — Set Obsidian vault to `knowledge-base/` for a graph view and rich editor

## Example Session

```
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
```

---

## Questions?

This schema is a living document. If you find a better convention or workflow, update this file and propagate changes to existing pages.

**The goal**: A knowledge base that compounds over time, gets smarter with every source you add, and lets you query accumulated wisdom instead of starting from scratch.
"""

def generate_index() -> str:
    """Generate initial index.md"""
    now = datetime.now().date().isoformat()
    return f"""---
title: Wiki Index
created: {now}
updated: {now}
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

**Total Pages**: 0 | **Last Updated**: {now}
"""

def generate_log() -> str:
    """Generate initial log.md"""
    now = datetime.now().isoformat()
    return f"""---
title: Wiki Operation Log
---

# Wiki Operation Log

> Chronological record of all wiki operations. Append-only.

## [{now}] Initialized | Knowledge base created

- Created directory structure
- Generated SCHEMA.md
- Generated index.md
- Status: Ready for first ingest
"""

def generate_gitignore() -> str:
    """Generate .gitignore"""
    return """# Large binary files
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
"""

def ensure_dir(dir_path: Path) -> None:
    """Ensure directory exists"""
    try:
        dir_path.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        Log.error(f"Failed to create directory {dir_path}: {e}")
        raise

def write_file(file_path: Path, content: str) -> None:
    """Write file with error handling"""
    try:
        file_path.write_text(content, encoding='utf-8')
    except Exception as e:
        Log.error(f"Failed to write file {file_path}: {e}")
        raise

def read_file(file_path: Path) -> str:
    """Read file with error handling"""
    try:
        return file_path.read_text(encoding='utf-8')
    except Exception as e:
        Log.error(f"Failed to read file {file_path}: {e}")
        raise

def cmd_init() -> None:
    """Initialize wiki structure"""
    Log.heading('Initializing Knowledge Base')
    
    dirs = [
        BASE_DIR / 'raw',
        BASE_DIR / 'raw' / 'assets',
        BASE_DIR / 'wiki',
        BASE_DIR / 'wiki' / 'entities',
        BASE_DIR / 'wiki' / 'concepts',
        BASE_DIR / 'wiki' / 'sources',
        BASE_DIR / 'wiki' / 'synthesis',
    ]
    
    for dir_path in dirs:
        ensure_dir(dir_path)
        Log.info(f"Created {dir_path}/")
    
    write_file(BASE_DIR / 'SCHEMA.md', generate_schema())
    Log.info('Generated SCHEMA.md (wiki conventions for your AI)')
    
    write_file(BASE_DIR / 'wiki' / 'index.md', generate_index())
    Log.info('Generated wiki/index.md')
    
    write_file(BASE_DIR / 'wiki' / 'log.md', generate_log())
    Log.info('Generated wiki/log.md')
    
    write_file(BASE_DIR / '.gitignore', generate_gitignore())
    Log.info('Generated .gitignore')
    
    Log.success("Knowledge base ready! Drop sources into raw/ and run 'ingest'.")
    Log.dim('\nNext steps:')
    Log.dim(f"  1. Add a source document to {BASE_DIR}/raw/")
    Log.dim(f"  2. Run: python cookbook/knowledge-wiki.py ingest {BASE_DIR}/raw/your-document.md")
    Log.dim(f"  3. Optional: Initialize git repo: cd {BASE_DIR} && git init")
    Log.dim(f"  4. Optional: Open in Obsidian for graph view")

def to_slug(filename: str) -> str:
    """Convert filename to slug"""
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', Path(filename).stem.lower()))

def cmd_ingest(source_file: str) -> None:
    """Ingest a source document"""
    Log.heading('Ingesting Source Document')
    
    source_path = Path(source_file)
    if not source_path.exists():
        Log.error(f"Source file not found: {source_file}")
        sys.exit(1)
    
    wiki_dir = BASE_DIR / 'wiki'
    if not wiki_dir.exists():
        Log.error("Wiki not initialized. Run 'init' first.")
        sys.exit(1)
    
    slug = to_slug(source_path.name)
    raw_dest = BASE_DIR / 'raw' / source_path.name
    source_page = BASE_DIR / 'wiki' / 'sources' / f'{slug}.md'
    
    # Copy source to raw/
    try:
        shutil.copy2(source_path, raw_dest)
        Log.info(f"Copied source to {raw_dest}")
    except Exception as e:
        Log.error(f"Failed to copy source: {e}")
        sys.exit(1)
    
    # Read source content
    content = read_file(source_path)
    now = datetime.now().date().isoformat()
    
    # Generate source summary page with TODO markers
    summary_content = f"""---
title: {source_path.name}
date_ingested: {now}
source_path: {raw_dest.relative_to(BASE_DIR)}
tags: []
---

# {source_path.name}

## Summary

TODO: Connect this to your LLM of choice (Copilot SDK, OpenAI, Anthropic, etc.) to auto-extract a 2-3 paragraph summary.

For now, this is a placeholder. The source has been copied to `{raw_dest.relative_to(BASE_DIR)}`.

**Character count**: {len(content)}
**Line count**: {len(content.splitlines())}

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
"""
    
    write_file(source_page, summary_content)
    Log.info(f"Created {source_page}")
    
    # Update index (simple append for now)
    index_path = BASE_DIR / 'wiki' / 'index.md'
    index_content = read_file(index_path)
    updated_index = index_content.replace(
        '## Sources\n\n*Ingested source documents will be listed here.*',
        f'## Sources\n\n- [[{slug}]] — {source_path.name} (ingested {now})'
    )
    # Update total pages count
    import re as regex
    match = regex.search(r'\*\*Total Pages\*\*: (\d+)', updated_index)
    if match:
        current = int(match.group(1))
        updated_index = regex.sub(
            r'\*\*Total Pages\*\*: \d+',
            f'**Total Pages**: {current + 1}',
            updated_index
        )
    write_file(index_path, updated_index)
    Log.info('Updated wiki/index.md')
    
    # Append to log
    log_path = BASE_DIR / 'wiki' / 'log.md'
    log_content = read_file(log_path)
    log_entry = f"""
## [{datetime.now().isoformat()}] Ingested | {source_path.name}

- Created: wiki/sources/{slug}.md
- Status: Summary page created with TODO markers
- Note: Connect an LLM to automatically extract entities and concepts
"""
    write_file(log_path, log_content + log_entry)
    Log.info('Logged operation in wiki/log.md')
    
    Log.success('Ingested successfully!')
    Log.dim('\nWhat was created:')
    Log.dim(f"  - Source summary: wiki/sources/{slug}.md")
    Log.dim(f"  - Raw copy: {raw_dest.relative_to(BASE_DIR)}")
    Log.dim('\nNext steps:')
    Log.dim('  - Review the generated summary page')
    Log.dim('  - Connect an LLM to automatically extract entities and concepts')
    Log.dim('  - See SCHEMA.md for the complete ingest workflow')

def extract_wikilinks(content: str) -> list[str]:
    """Extract wikilinks from markdown content"""
    pattern = r'\[\[([^\]]+)\]\]'
    return [match.group(1).lower().strip() for match in re.finditer(pattern, content)]

def cmd_search(query: str) -> None:
    """Search wiki pages"""
    Log.heading(f'Searching Wiki for "{query}"')
    
    wiki_dir = BASE_DIR / 'wiki'
    if not wiki_dir.exists():
        Log.error("Wiki not initialized. Run 'init' first.")
        sys.exit(1)
    
    query_lower = query.lower()
    results = []
    
    # Recursively search all .md files
    for md_file in wiki_dir.rglob('*.md'):
        try:
            content = read_file(md_file)
            lines = content.splitlines()
            score = 0
            matches = []
            
            # Check filename
            if query_lower in md_file.name.lower():
                score += 10
                matches.append(f"Filename: {md_file.name}")
            
            # Check frontmatter tags
            frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if frontmatter_match and query_lower in frontmatter_match.group(1).lower():
                score += 5
                matches.append('Match in frontmatter')
            
            # Check headings and content
            for i, line in enumerate(lines, 1):
                if query_lower in line.lower():
                    if line.startswith('#'):
                        score += 3
                        matches.append(f"Heading (line {i}): {line.strip()}")
                    else:
                        score += 1
                        truncated = line.strip()[:80]
                        if len(line) > 80:
                            truncated += '...'
                        matches.append(f"Content (line {i}): {truncated}")
            
            if score > 0:
                results.append({
                    'file': md_file.relative_to(BASE_DIR),
                    'score': score,
                    'matches': matches
                })
        except Exception as e:
            Log.warn(f"Error reading {md_file}: {e}")
    
    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    if not results:
        Log.warn('No results found.')
        Log.dim('\nTips:')
        Log.dim('  - Try different keywords')
        Log.dim('  - Check if the wiki has been populated with content')
        Log.dim('  - Search is case-insensitive')
        return
    
    Log.success(f"Found {len(results)} result(s):\n")
    
    for i, result in enumerate(results[:10], 1):
        print(f"{Colors.BRIGHT}{i}. {result['file']}{Colors.RESET} "
              f"{Colors.DIM}(score: {result['score']}){Colors.RESET}")
        for match in result['matches'][:3]:
            print(f"   {Colors.DIM}→{Colors.RESET} {match}")
        print()
    
    if len(results) > 10:
        Log.dim(f"... and {len(results) - 10} more results.")

def cmd_lint() -> None:
    """Lint the wiki"""
    Log.heading('Wiki Health Check')
    
    wiki_dir = BASE_DIR / 'wiki'
    if not wiki_dir.exists():
        Log.error("Wiki not initialized. Run 'init' first.")
        sys.exit(1)
    
    # Collect all pages and their links
    pages = []
    link_map = {}  # page -> outbound links
    inbound_map = defaultdict(list)  # link -> inbound pages
    all_wikilinks = set()
    
    for md_file in wiki_dir.rglob('*.md'):
        relative_path = md_file.relative_to(wiki_dir)
        pages.append(str(relative_path))
        
        try:
            content = read_file(md_file)
            links = extract_wikilinks(content)
            link_map[str(relative_path)] = links
            
            for link in links:
                all_wikilinks.add(link)
                inbound_map[link].append(str(relative_path))
        except Exception as e:
            Log.warn(f"Error reading {md_file}: {e}")
    
    Log.info('📊 Stats:')
    print(f"  - Total pages: {len(pages)}")
    total_links = sum(len(links) for links in link_map.values())
    print(f"  - Total links: {total_links}")
    avg_links = f"{total_links / len(pages):.1f}" if pages else "0"
    print(f"  - Average links per page: {avg_links}\n")
    
    # Find broken links
    broken_links = {}
    for link in all_wikilinks:
        exists = any(
            Path(page).stem.lower().replace('-', ' ') == link.replace('-', ' ')
            for page in pages
        )
        if not exists:
            broken_links[link] = inbound_map[link]
    
    if broken_links:
        Log.warn(f"Broken Links ({len(broken_links)}):")
        for i, (link, refs) in enumerate(list(broken_links.items())[:5]):
            print(f"  - [[{link}]] referenced in {len(refs)} page(s)")
            for ref in refs[:2]:
                print(f"    {Colors.DIM}→ {ref}{Colors.RESET}")
        if len(broken_links) > 5:
            Log.dim(f"  ... and {len(broken_links) - 5} more")
        print()
    
    # Find orphan pages (no inbound links)
    orphans = []
    for page in pages:
        page_name = Path(page).stem.lower().replace('-', ' ')
        if page_name not in inbound_map and page not in ['index.md', 'log.md']:
            orphans.append(page)
    
    if orphans:
        Log.warn(f"Orphan Pages ({len(orphans)}):")
        for orphan in orphans[:5]:
            print(f"  - {orphan} (no inbound links)")
        if len(orphans) > 5:
            Log.dim(f"  ... and {len(orphans) - 5} more")
        print()
    
    # Find isolated pages (no outbound links)
    isolated = []
    for page in pages:
        if not link_map.get(page, []) and page not in ['index.md', 'log.md']:
            isolated.append(page)
    
    if isolated:
        Log.warn(f"Isolated Pages ({len(isolated)}):")
        for iso in isolated[:5]:
            print(f"  - {iso} (no outbound links)")
        if len(isolated) > 5:
            Log.dim(f"  ... and {len(isolated) - 5} more")
        print()
    
    # Suggestions
    if broken_links:
        Log.info('💡 Suggestions:')
        print('  Create pages for frequently-mentioned topics:')
        sorted_broken = sorted(broken_links.items(), key=lambda x: len(x[1]), reverse=True)
        for link, refs in sorted_broken[:5]:
            print(f"    - [[{link}]] ({len(refs)} mentions)")
        print()
    
    # Overall health
    health_score = int((len(pages) - len(orphans)) / len(pages) * 100) if pages else 0
    if health_score >= 90:
        Log.success(f"Overall health: Excellent ({health_score}% of pages have inbound links)")
    elif health_score >= 70:
        Log.info(f"Overall health: Good ({health_score}% of pages have inbound links)")
    else:
        Log.warn(f"Overall health: Needs improvement ({health_score}% of pages have inbound links)")

def cmd_status() -> None:
    """Show wiki status"""
    Log.heading('Wiki Status')
    
    wiki_dir = BASE_DIR / 'wiki'
    if not wiki_dir.exists():
        Log.error("Wiki not initialized. Run 'init' first.")
        sys.exit(1)
    
    # Count pages by type
    counts = {
        'sources': 0,
        'entities': 0,
        'concepts': 0,
        'synthesis': 0,
        'total': 0,
    }
    
    for subdir, key in [
        ('sources', 'sources'),
        ('entities', 'entities'),
        ('concepts', 'concepts'),
        ('synthesis', 'synthesis'),
    ]:
        dir_path = wiki_dir / subdir
        if dir_path.exists():
            counts[key] = len(list(dir_path.glob('*.md')))
            counts['total'] += counts[key]
    
    print(f"{Colors.BRIGHT}📚 Pages{Colors.RESET}")
    print(f"  Total: {Colors.GREEN}{counts['total']}{Colors.RESET}")
    print(f"  Sources: {counts['sources']}")
    print(f"  Entities: {counts['entities']}")
    print(f"  Concepts: {counts['concepts']}")
    print(f"  Synthesis: {counts['synthesis']}\n")
    
    # Read last log entry
    log_path = wiki_dir / 'log.md'
    if log_path.exists():
        try:
            log_content = read_file(log_path)
            entries = log_content.split('\n## [')[1:]
            if entries:
                last_entry = entries[-1]
                match = re.match(r'^([^\]]+)\] ([^|]+)\|', last_entry)
                if match:
                    print(f"{Colors.BRIGHT}📅 Last Activity{Colors.RESET}")
                    print(f"  Date: {match.group(1)}")
                    print(f"  Action: {match.group(2).strip()}\n")
        except Exception as e:
            Log.warn(f"Could not read last activity from log: {e}")
    
    # Count total links
    total_links = 0
    for md_file in wiki_dir.rglob('*.md'):
        try:
            content = read_file(md_file)
            total_links += len(extract_wikilinks(content))
        except Exception as e:
            Log.warn(f"Could not count links in {md_file}: {e}")
    
    print(f"{Colors.BRIGHT}🔗 Connections{Colors.RESET}")
    print(f"  Total wikilinks: {total_links}\n")
    
    Log.dim("Run 'lint' for detailed health check")

def main():
    """Main CLI router"""
    parser = argparse.ArgumentParser(
        description='Knowledge Wiki — Personal Knowledge Base Manager',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cookbook/knowledge-wiki.py init
  python cookbook/knowledge-wiki.py ingest papers/attention-is-all-you-need.pdf
  python cookbook/knowledge-wiki.py search "transformer architecture"
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    subparsers.add_parser('init', help='Set up wiki structure')
    
    ingest_parser = subparsers.add_parser('ingest', help='Process a source document')
    ingest_parser.add_argument('file', help='Source file to ingest')
    
    search_parser = subparsers.add_parser('search', help='Search wiki pages')
    search_parser.add_argument('query', nargs='+', help='Search query')
    
    subparsers.add_parser('lint', help='Health-check the wiki')
    subparsers.add_parser('status', help='Show wiki stats')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.command == 'init':
        cmd_init()
    elif args.command == 'ingest':
        cmd_ingest(args.file)
    elif args.command == 'search':
        cmd_search(' '.join(args.query))
    elif args.command == 'lint':
        cmd_lint()
    elif args.command == 'status':
        cmd_status()

if __name__ == '__main__':
    main()
