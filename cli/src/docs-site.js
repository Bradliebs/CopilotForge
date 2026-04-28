'use strict';

const fs = require('fs');
const path = require('path');
const { colors, info, success, warn, exists } = require('./utils');

/**
 * CopilotForge Documentation Site Generator — Phase 19
 *
 * Generates a static HTML documentation site from the docs/ directory.
 * Zero dependencies — uses Node.js built-in HTTP server for preview.
 *
 * Usage:
 *   copilotforge docs build             Generate HTML from docs/
 *   copilotforge docs serve             Preview at localhost:4000
 *   copilotforge docs --output <dir>    Custom output directory
 */

// ── Markdown to HTML ────────────────────────────────────────────────────

function markdownToHtml(md) {
  let html = md;

  // Code blocks (must be before inline code)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code (after code blocks)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Tables (basic)
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, body) => {
    const headers = header.split('|').filter(Boolean).map((h) => `<th>${h.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map((row) => {
      const cells = row.split('|').filter(Boolean).map((c) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Paragraphs
  html = html.replace(/\n\n([^<\n].+)/g, '\n\n<p>$1</p>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  return html;
}

// ── HTML template ───────────────────────────────────────────────────────

function htmlPage(title, content, nav) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — CopilotForge</title>
  <style>
    :root { --bg: #0d1117; --fg: #c9d1d9; --accent: #58a6ff; --border: #30363d; --code-bg: #161b22; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--fg); line-height: 1.6; }
    .container { display: flex; max-width: 1200px; margin: 0 auto; }
    nav { width: 250px; padding: 2rem 1rem; border-right: 1px solid var(--border); position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    nav a { display: block; color: var(--fg); text-decoration: none; padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }
    nav a:hover, nav a.active { background: var(--border); color: var(--accent); }
    nav h3 { color: var(--accent); margin: 1rem 0 0.5rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
    main { flex: 1; padding: 2rem 3rem; max-width: 800px; }
    h1 { color: var(--accent); margin-bottom: 1rem; font-size: 2rem; }
    h2 { color: var(--accent); margin: 2rem 0 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    h3 { color: var(--fg); margin: 1.5rem 0 0.5rem; }
    a { color: var(--accent); }
    code { background: var(--code-bg); padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.9em; }
    pre { background: var(--code-bg); padding: 1rem; border-radius: 6px; overflow-x: auto; margin: 1rem 0; }
    pre code { background: none; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; border: 1px solid var(--border); text-align: left; }
    th { background: var(--code-bg); }
    blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1rem 0; color: #8b949e; }
    ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin: 0.25rem 0; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    .header { padding: 1rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; }
    .header h1 { font-size: 1.2rem; margin: 0; }
    .header .version { color: #8b949e; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔥 CopilotForge</h1>
    <span class="version">v${require('../package.json').version}</span>
  </div>
  <div class="container">
    <nav>${nav}</nav>
    <main>${content}</main>
  </div>
</body>
</html>`;
}

// ── Build ───────────────────────────────────────────────────────────────

function collectDocs(cwd) {
  const docsDir = path.join(cwd, 'docs');
  const docs = [];

  // Add README as index
  const readmePath = path.join(cwd, 'README.md');
  if (exists(readmePath)) {
    docs.push({ name: 'index', title: 'Home', path: readmePath, slug: 'index' });
  }

  // Add docs/ files
  if (exists(docsDir)) {
    try {
      const files = fs.readdirSync(docsDir)
        .filter((f) => f.endsWith('.md'))
        .sort();

      for (const file of files) {
        const name = file.replace('.md', '');
        const title = name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        docs.push({ name, title, path: path.join(docsDir, file), slug: name.toLowerCase() });
      }
    } catch { /* ignore */ }
  }

  return docs;
}

function buildNav(docs, currentSlug) {
  let nav = '<h3>Documentation</h3>\n';
  for (const doc of docs) {
    const active = doc.slug === currentSlug ? ' class="active"' : '';
    nav += `<a href="${doc.slug}.html"${active}>${doc.title}</a>\n`;
  }
  return nav;
}

function buildSite(cwd, outputDir) {
  const docs = collectDocs(cwd);
  const generated = [];

  fs.mkdirSync(outputDir, { recursive: true });

  for (const doc of docs) {
    const md = fs.readFileSync(doc.path, 'utf8');
    const content = markdownToHtml(md);
    const nav = buildNav(docs, doc.slug);
    const html = htmlPage(doc.title, content, nav);
    const outputPath = path.join(outputDir, `${doc.slug}.html`);

    fs.writeFileSync(outputPath, html, 'utf8');
    generated.push(doc.slug + '.html');
  }

  return { pages: generated, outputDir };
}

// ── Serve ───────────────────────────────────────────────────────────────

function serve(outputDir, port = 4000) {
  const http = require('http');

  const server = http.createServer((req, res) => {
    let filePath = path.join(outputDir, req.url === '/' ? 'index.html' : req.url);

    if (!filePath.endsWith('.html')) filePath += '.html';

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(filePath, 'utf8'));
  });

  server.listen(port, '127.0.0.1', () => {
    info(`📖 Docs server running at ${colors.cyan(`http://127.0.0.1:${port}`)}`);
    info(colors.dim('  Press Ctrl+C to stop'));
  });

  process.on('SIGINT', () => { server.close(); process.exit(0); });
}

// ── CLI ─────────────────────────────────────────────────────────────────

function run(args = []) {
  const cwd = process.cwd();
  const sub = args[0] || 'build';
  const outputIdx = args.indexOf('--output');
  const outputDir = outputIdx >= 0 ? args[outputIdx + 1] : path.join(cwd, '_site');

  switch (sub) {
    case 'build': {
      console.log();
      info('📖 Building documentation site...');
      console.log();

      const result = buildSite(cwd, outputDir);
      for (const page of result.pages) {
        success(`  Created ${page}`);
      }
      console.log();
      info(`  Output: ${colors.dim(result.outputDir)}`);
      info(colors.dim('  Run `copilotforge docs serve` to preview'));
      console.log();
      break;
    }

    case 'serve': {
      const portIdx = args.indexOf('--port');
      const port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) || 4000 : 4000;

      if (!exists(outputDir)) {
        info('Building site first...');
        buildSite(cwd, outputDir);
      }

      console.log();
      serve(outputDir, port);
      break;
    }

    default:
      console.log();
      info('📖 CopilotForge Documentation');
      console.log();
      info('  Usage:');
      info('    copilotforge docs build              Generate HTML from docs/');
      info('    copilotforge docs serve              Preview at localhost:4000');
      info('    copilotforge docs build --output dir  Custom output directory');
      console.log();
  }
}

module.exports = {
  run,
  buildSite,
  collectDocs,
  markdownToHtml,
  htmlPage,
};
