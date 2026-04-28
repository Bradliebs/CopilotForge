'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, success, warn, exists } = require('./utils');

/**
 * CopilotForge Memory Graph — Phase 20
 *
 * Graph-based relationship tracking between decisions, patterns, and code.
 * Builds a queryable graph from forge-memory/ files and playbook entries.
 *
 * Node types: decision, pattern, strategy, antipattern, insight, file, skill
 * Edge types: informs, contradicts, depends-on, relates-to, implements
 *
 * Usage:
 *   copilotforge graph                Build and display the memory graph
 *   copilotforge graph --query <term> Query nodes by keyword
 *   copilotforge graph --export       Export as JSON
 *   copilotforge graph --mermaid      Export as Mermaid diagram
 */

// ── Graph data structure ────────────────────────────────────────────────

function createGraph() {
  return { nodes: new Map(), edges: [] };
}

function addNode(graph, id, type, data = {}) {
  graph.nodes.set(id, { id, type, ...data });
}

function addEdge(graph, from, to, relationship) {
  graph.edges.push({ from, to, relationship });
}

// ── Graph building ──────────────────────────────────────────────────────

function buildGraph(cwd) {
  const graph = createGraph();

  // Parse decisions.md
  const decisionsPath = path.join(cwd, 'forge-memory', 'decisions.md');
  if (exists(decisionsPath)) {
    const content = fs.readFileSync(decisionsPath, 'utf8');
    const sections = content.split(/^## /m).filter(Boolean);
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const title = lines[0]?.trim();
      if (!title || title.startsWith('#')) continue;
      const id = `decision:${slugify(title)}`;
      addNode(graph, id, 'decision', { title, content: lines.slice(1).join('\n').trim() });
    }
  }

  // Parse patterns.md
  const patternsPath = path.join(cwd, 'forge-memory', 'patterns.md');
  if (exists(patternsPath)) {
    const content = fs.readFileSync(patternsPath, 'utf8');
    const sections = content.split(/^## /m).filter(Boolean);
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const title = lines[0]?.trim();
      if (!title || title.startsWith('#')) continue;
      const id = `pattern:${slugify(title)}`;
      addNode(graph, id, 'pattern', { title, content: lines.slice(1).join('\n').trim() });
    }
  }

  // Parse playbook entries
  const playbookPath = path.join(cwd, 'forge-memory', 'playbook.md');
  if (exists(playbookPath)) {
    try {
      const { parsePlaybook } = require('./experiential-memory');
      const content = fs.readFileSync(playbookPath, 'utf8');
      const { entries } = parsePlaybook(content);
      for (const entry of entries) {
        const id = `${entry.type.toLowerCase()}:${slugify(entry.title)}`;
        addNode(graph, id, entry.type.toLowerCase(), {
          title: entry.title,
          content: entry.content,
          score: entry.score,
        });
      }
    } catch { /* playbook parsing optional */ }
  }

  // Add skill nodes
  const skillsDir = path.join(cwd, '.github', 'skills');
  if (exists(skillsDir)) {
    try {
      const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      for (const folder of skillFolders) {
        const id = `skill:${folder.name}`;
        addNode(graph, id, 'skill', { title: folder.name });
      }
    } catch { /* ignore */ }
  }

  // Infer edges from content overlap
  inferEdges(graph);

  return graph;
}

function inferEdges(graph) {
  const nodes = Array.from(graph.nodes.values());

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      // Check for keyword overlap in content
      const aWords = extractKeywords(a.content || a.title || '');
      const bWords = extractKeywords(b.content || b.title || '');
      const overlap = aWords.filter((w) => bWords.includes(w));

      if (overlap.length >= 2) {
        const rel = a.type === 'antipattern' || b.type === 'antipattern' ? 'contradicts' : 'relates-to';
        addEdge(graph, a.id, b.id, rel);
      }
    }
  }
}

function extractKeywords(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !['this', 'that', 'with', 'from', 'have', 'been', 'when', 'what', 'each', 'them', 'your', 'will', 'should', 'must'].includes(w));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// ── Query ───────────────────────────────────────────────────────────────

function queryGraph(graph, term) {
  const lower = term.toLowerCase();
  const matchingNodes = [];

  for (const node of graph.nodes.values()) {
    const text = `${node.title || ''} ${node.content || ''}`.toLowerCase();
    if (text.includes(lower)) {
      matchingNodes.push(node);
    }
  }

  // Find connected edges
  const nodeIds = new Set(matchingNodes.map((n) => n.id));
  const connectedEdges = graph.edges.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to));

  return { nodes: matchingNodes, edges: connectedEdges };
}

// ── Export ───────────────────────────────────────────────────────────────

function toJSON(graph) {
  return {
    nodes: Array.from(graph.nodes.values()),
    edges: graph.edges,
    stats: {
      nodeCount: graph.nodes.size,
      edgeCount: graph.edges.length,
      types: [...new Set(Array.from(graph.nodes.values()).map((n) => n.type))],
    },
  };
}

function toMermaid(graph) {
  const lines = ['graph TD'];
  const nodeMap = new Map();
  let idx = 0;

  for (const node of graph.nodes.values()) {
    const label = (node.title || node.id).replace(/"/g, "'").slice(0, 30);
    const nodeId = `N${idx++}`;
    nodeMap.set(node.id, nodeId);

    const shape = node.type === 'decision' ? `[${label}]` :
      node.type === 'antipattern' ? `((${label}))` :
        node.type === 'skill' ? `{${label}}` :
          `(${label})`;

    lines.push(`  ${nodeId}${shape}`);
  }

  for (const edge of graph.edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (from && to) {
      const label = edge.relationship === 'contradicts' ? '-.->|contradicts|' :
        edge.relationship === 'depends-on' ? '-->|depends|' : '-->|relates|';
      lines.push(`  ${from} ${label} ${to}`);
    }
  }

  return lines.join('\n');
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const queryTerm = args.indexOf('--query') >= 0 ? args[args.indexOf('--query') + 1] : null;
  const exportJson = args.includes('--export');
  const mermaid = args.includes('--mermaid');

  const graph = buildGraph(cwd);

  if (exportJson) {
    console.log(JSON.stringify(toJSON(graph), null, 2));
    return;
  }

  if (mermaid) {
    console.log(toMermaid(graph));
    return;
  }

  if (queryTerm) {
    const results = queryGraph(graph, queryTerm);
    console.log();
    info(`🔍 Query: "${queryTerm}" — ${results.nodes.length} results`);
    console.log();
    for (const node of results.nodes) {
      info(`  ${colors.cyan(node.type)} ${node.title || node.id}`);
    }
    if (results.edges.length > 0) {
      console.log();
      info('  Connections:');
      for (const edge of results.edges) {
        info(`    ${edge.from} —[${edge.relationship}]→ ${edge.to}`);
      }
    }
    console.log();
    return;
  }

  // Default: display graph stats
  console.log();
  info('🕸️ Memory Graph');
  console.log();

  const types = {};
  for (const node of graph.nodes.values()) {
    types[node.type] = (types[node.type] || 0) + 1;
  }

  info(`  Nodes: ${colors.bold(String(graph.nodes.size))}`);
  info(`  Edges: ${colors.bold(String(graph.edges.length))}`);
  console.log();

  for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
    info(`  ${colors.cyan(type.padEnd(16))} ${count}`);
  }

  if (graph.edges.length > 0) {
    console.log();
    info('  Relationships:');
    const edgeTypes = {};
    for (const e of graph.edges) {
      edgeTypes[e.relationship] = (edgeTypes[e.relationship] || 0) + 1;
    }
    for (const [rel, count] of Object.entries(edgeTypes)) {
      info(`    ${rel}: ${count}`);
    }
  }

  console.log();
  info(colors.dim('  --query <term>  Search nodes'));
  info(colors.dim('  --export        Export as JSON'));
  info(colors.dim('  --mermaid       Export as Mermaid diagram'));
  console.log();
}

module.exports = {
  run,
  buildGraph,
  queryGraph,
  toJSON,
  toMermaid,
  createGraph,
  addNode,
  addEdge,
};
