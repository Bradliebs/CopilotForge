/**
 * blog-writer.ts — CopilotForge Cookbook Recipe
 *
 * Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/document-code/write-discussions-or-blog-posts
 *
 * WHAT THIS DOES:
 *   Generates blog posts and discussion drafts from your PRs, issues, and code
 *   changes using a multi-step prompt pipeline (brainstorm → outline → draft → refine).
 *
 * WHEN TO USE THIS:
 *   When you need to write a blog post about recent work, create a discussion
 *   post for your team, or generate release notes from PR activity.
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Set your API key:
 *        bash/zsh:     export COPILOT_API_KEY="your-key-here"
 *        PowerShell:   $env:COPILOT_API_KEY="your-key-here"
 *        Windows cmd:  set COPILOT_API_KEY=your-key-here
 *   3. npx ts-node cookbook/blog-writer.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - A valid Copilot API key
 *
 * EXPECTED OUTPUT:
 *   [BlogWriter] Starting content pipeline...
 *   [Stage 1] Brainstorming topics from 3 PRs...
 *   [Ideas] 5 topic suggestions generated
 *   [Stage 2] Outlining: "How We Improved Auth Performance by 3x"
 *   [Outline] 6 sections with key points
 *   [Stage 3] Drafting full post...
 *   [Draft] 1,200 words generated
 *   [Stage 4] Refining for developer audience...
 *   [Final] Blog post saved to blog-draft.md
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join()
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 *
 * SOURCE:
 *   Adapted from: https://docs.github.com/en/copilot/tutorials/copilot-chat-cookbook/document-code/write-discussions-or-blog-posts
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as readline from "node:readline";

// --- Types ---

/** Audience for the blog post. */
type Audience = "developer" | "general" | "internal";

/** Tone of the blog post. */
type Tone = "technical" | "casual" | "formal";

/** Pipeline stage identifier. */
type Stage = "brainstorm" | "outline" | "draft" | "refine";

/** Configuration for the blog writing pipeline. */
interface BlogConfig {
  prNumbers: number[];
  issueNumbers: number[];
  repoName: string;
  audience: Audience;
  tone: Tone;
  outputPath: string;
}

/** A single prompt template used by the pipeline. */
interface BlogPromptTemplate {
  stage: Stage;
  audience: Audience;
  tone: Tone;
  template: string;
}

/** A blog topic suggestion from the brainstorm stage. */
interface BlogIdea {
  index: number;
  title: string;
  angle: string;
}

/** A section in the blog outline. */
interface OutlineSection {
  heading: string;
  keyPoints: string[];
}

/** Result of the draft stage. */
interface DraftResult {
  title: string;
  markdown: string;
  wordCount: number;
}

interface CopilotClientConfig {
  apiKey: string;
}

interface CopilotSession {
  id: string;
  send(message: string): Promise<string>;
  destroy(): void;
}

interface CopilotClient {
  start(): void;
  createSession(): CopilotSession;
  stop(): void;
}

// --- Mock SDK (replace with real import) ---
// TODO: Replace with: import { CopilotClient } from "@github/copilot-sdk";

function createCopilotClient(config: CopilotClientConfig): CopilotClient {
  const sessionId = `blog_${Date.now()}`;
  return {
    start() {
      console.log("[Client] Starting...");
    },
    createSession(): CopilotSession {
      return {
        id: sessionId,
        async send(message: string): Promise<string> {
          // TODO: Real SDK generates content from the prompt.
          return `[Copilot] Generated content for: "${message.slice(0, 80)}..."`;
        },
        destroy() {},
      };
    },
    stop() {
      console.log("[Client] Stopped.");
    },
  };
}

// --- Prompt Templates ---
// These templates are adapted from the GitHub Copilot Chat Cookbook patterns.
// Customize them to fit your project's voice and context.

const PROMPT_TEMPLATES: Record<Stage, BlogPromptTemplate[]> = {
  brainstorm: [
    {
      stage: "brainstorm",
      audience: "developer",
      tone: "technical",
      template:
        `I've worked on PRs {prNumbers} in the {repoName} repository. ` +
        `Suggest 5 blog topics highlighting unique technical challenges or solutions. ` +
        `For each, provide a title and a one-sentence angle describing what makes it interesting.`,
    },
    {
      stage: "brainstorm",
      audience: "general",
      tone: "casual",
      template:
        `We released new features in PRs {prNumbers} for {repoName}. ` +
        `Propose 5 blog angles a non-technical reader would enjoy: ` +
        `major user-facing changes, lessons learned, and community benefit.`,
    },
    {
      stage: "brainstorm",
      audience: "internal",
      tone: "formal",
      template:
        `Our team closed PRs {prNumbers} and issues {issueNumbers} in {repoName}. ` +
        `Suggest 5 internal discussion topics covering: architectural decisions, ` +
        `process improvements, and knowledge worth sharing with the wider org.`,
    },
  ],

  outline: [
    {
      stage: "outline",
      audience: "developer",
      tone: "technical",
      template:
        `Propose a detailed outline for a blog post titled "{title}" based on ` +
        `PRs {prNumbers} and issues {issueNumbers} in {repoName}. ` +
        `Include sections for: introduction, problem statement, technical approach, ` +
        `code highlights, results, and next steps. Each section should have 2-3 key points.`,
    },
    {
      stage: "outline",
      audience: "general",
      tone: "casual",
      template:
        `Create an outline for a blog post titled "{title}" about our work in {repoName}. ` +
        `Include sections for: hook/introduction, what changed and why it matters, ` +
        `user-facing improvements, behind-the-scenes highlights, and what's coming next.`,
    },
    {
      stage: "outline",
      audience: "internal",
      tone: "formal",
      template:
        `Draft an outline for an internal discussion post titled "{title}" covering ` +
        `PRs {prNumbers} and issues {issueNumbers}. Include: executive summary, ` +
        `scope of changes, design decisions, trade-offs, metrics/impact, and open questions.`,
    },
  ],

  draft: [
    {
      stage: "draft",
      audience: "developer",
      tone: "technical",
      template:
        `Write a blog post titled "{title}" for a developer audience. ` +
        `Use this outline:\n{outline}\n\n` +
        `Context: This is based on work in {repoName}, PRs {prNumbers}. ` +
        `Include code snippets where relevant. Highlight user benefits and suggest next steps. ` +
        `Target around 1,000-1,500 words. Use markdown formatting.`,
    },
    {
      stage: "draft",
      audience: "general",
      tone: "casual",
      template:
        `Write a friendly, approachable blog post titled "{title}". ` +
        `Use this outline:\n{outline}\n\n` +
        `This is about recent work in {repoName}. Explain what changed and why it's exciting ` +
        `without assuming deep technical knowledge. Keep it around 800-1,200 words. Use markdown.`,
    },
    {
      stage: "draft",
      audience: "internal",
      tone: "formal",
      template:
        `Write an internal discussion post titled "{title}". ` +
        `Use this outline:\n{outline}\n\n` +
        `This covers PRs {prNumbers} and issues {issueNumbers} in {repoName}. ` +
        `Be thorough on design decisions and trade-offs. Include links to relevant PRs/issues. ` +
        `Target 1,000-1,500 words. Use markdown formatting.`,
    },
  ],

  refine: [
    {
      stage: "refine",
      audience: "developer",
      tone: "technical",
      template:
        `Refine this blog post draft for a developer audience. Improve the technical accuracy, ` +
        `add better code examples where needed, and ensure the conclusion has clear next steps ` +
        `and a call to action.\n\nDraft:\n{draft}`,
    },
    {
      stage: "refine",
      audience: "general",
      tone: "casual",
      template:
        `Rewrite this blog post to be more engaging and approachable. ` +
        `Simplify jargon, add a compelling introduction hook, and make the conclusion ` +
        `feel more inviting. Add a "what's next" section.\n\nDraft:\n{draft}`,
    },
    {
      stage: "refine",
      audience: "internal",
      tone: "formal",
      template:
        `Refine this internal discussion post. Strengthen the executive summary, ` +
        `add a section on upcoming milestones and open issues, and include ` +
        `community engagement opportunities. Make it suitable for a company-wide audience.` +
        `\n\nDraft:\n{draft}`,
    },
  ],
};

// --- Prompt Builder ---

function buildPrompt(
  stage: Stage,
  config: BlogConfig,
  extra: Record<string, string> = {}
): string {
  const templates = PROMPT_TEMPLATES[stage];

  // Pick the template that best matches audience + tone, or fall back to first.
  const match =
    templates.find(
      (t) => t.audience === config.audience && t.tone === config.tone
    ) ?? templates[0];

  let prompt = match.template;

  // Substitute config placeholders.
  prompt = prompt.replace("{prNumbers}", config.prNumbers.map((n) => `#${n}`).join(", "));
  prompt = prompt.replace("{issueNumbers}", config.issueNumbers.map((n) => `#${n}`).join(", "));
  prompt = prompt.replace("{repoName}", config.repoName);

  // Substitute extra placeholders (title, outline, draft, etc.).
  for (const [key, value] of Object.entries(extra)) {
    prompt = prompt.replace(`{${key}}`, value);
  }

  return prompt;
}

// --- Stage 1: Brainstorm ---

async function generateBlogIdeas(
  session: CopilotSession,
  config: BlogConfig
): Promise<BlogIdea[]> {
  console.log(`[Stage 1] Brainstorming topics from ${config.prNumbers.length} PRs...`);

  const prompt = buildPrompt("brainstorm", config);
  const response = await session.send(prompt);

  // TODO: Parse real Copilot response into structured ideas.
  // For now, return simulated ideas based on config.
  const ideas: BlogIdea[] = [
    {
      index: 1,
      title: `How We Improved Auth Performance by 3x`,
      angle: "Deep dive into the caching strategy that cut login times dramatically.",
    },
    {
      index: 2,
      title: `Lessons from Migrating to the New API Gateway`,
      angle: "What went wrong, what went right, and what we'd do differently.",
    },
    {
      index: 3,
      title: `Building a Developer-Friendly Error Handling System`,
      angle: "How structured error codes improved our debugging workflow.",
    },
    {
      index: 4,
      title: `Release Highlights: What's New in ${config.repoName}`,
      angle: "A roundup of the most impactful changes from recent PRs.",
    },
    {
      index: 5,
      title: `From Issue to Production: Our PR Review Pipeline`,
      angle: "How we streamlined code review to ship features faster.",
    },
  ];

  console.log(`[Ideas] ${ideas.length} topic suggestions generated`);
  return ideas;
}

// --- Stage 2: Outline ---

async function outlineBlogPost(
  session: CopilotSession,
  config: BlogConfig,
  title: string
): Promise<OutlineSection[]> {
  console.log(`[Stage 2] Outlining: "${title}"`);

  const prompt = buildPrompt("outline", config, { title });
  const response = await session.send(prompt);

  // TODO: Parse real Copilot response into structured sections.
  const sections: OutlineSection[] = [
    {
      heading: "Introduction",
      keyPoints: [
        "Hook: the problem we set out to solve",
        "Brief context on the project and its users",
      ],
    },
    {
      heading: "The Problem",
      keyPoints: [
        "What was slow or broken",
        "Impact on users and developer experience",
      ],
    },
    {
      heading: "Our Approach",
      keyPoints: [
        "High-level technical strategy",
        "Key design decisions and trade-offs",
        "Code highlights or architecture diagrams",
      ],
    },
    {
      heading: "Results",
      keyPoints: [
        "Before/after metrics",
        "User feedback and team reactions",
      ],
    },
    {
      heading: "Lessons Learned",
      keyPoints: [
        "What surprised us",
        "What we'd do differently next time",
      ],
    },
    {
      heading: "What's Next",
      keyPoints: [
        "Upcoming milestones and open issues",
        "Community engagement opportunities",
      ],
    },
  ];

  console.log(`[Outline] ${sections.length} sections with key points`);
  return sections;
}

// --- Stage 3: Draft ---

function formatOutlineForPrompt(sections: OutlineSection[]): string {
  return sections
    .map(
      (s) =>
        `## ${s.heading}\n${s.keyPoints.map((p) => `- ${p}`).join("\n")}`
    )
    .join("\n\n");
}

async function draftBlogPost(
  session: CopilotSession,
  config: BlogConfig,
  title: string,
  sections: OutlineSection[]
): Promise<DraftResult> {
  console.log("[Stage 3] Drafting full post...");

  const outlineText = formatOutlineForPrompt(sections);
  const prompt = buildPrompt("draft", config, { title, outline: outlineText });
  const response = await session.send(prompt);

  // TODO: Use real Copilot response as the draft body.
  const markdown = [
    `# ${title}`,
    "",
    `*Published from ${config.repoName} — PRs ${config.prNumbers.map((n) => `#${n}`).join(", ")}*`,
    "",
    ...sections.map((s) => {
      const points = s.keyPoints.map((p) => `- ${p}`).join("\n");
      return `## ${s.heading}\n\n${points}\n\n<!-- TODO: Expand this section with full prose from Copilot response -->\n`;
    }),
    "---",
    "",
    `*Generated by the blog-writer recipe. Edit and polish before publishing.*`,
  ].join("\n");

  const wordCount = markdown.split(/\s+/).length;
  console.log(`[Draft] ${wordCount.toLocaleString()} words generated`);

  return { title, markdown, wordCount };
}

// --- Stage 4: Refine ---

async function refineDraft(
  session: CopilotSession,
  config: BlogConfig,
  draft: DraftResult
): Promise<DraftResult> {
  console.log(`[Stage 4] Refining for ${config.audience} audience...`);

  const prompt = buildPrompt("refine", config, { draft: draft.markdown });
  const response = await session.send(prompt);

  // TODO: Use real Copilot response as the refined version.
  // For now, return the draft with a refinement note appended.
  const refined = draft.markdown + "\n\n<!-- Refined for " + config.audience + " audience, " + config.tone + " tone -->\n";
  const wordCount = refined.split(/\s+/).length;

  return { title: draft.title, markdown: refined, wordCount };
}

// --- Interactive Helpers ---

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function displayIdeas(ideas: BlogIdea[]): void {
  console.log("\n--- Blog Topic Suggestions ---");
  for (const idea of ideas) {
    console.log(`  ${idea.index}. ${idea.title}`);
    console.log(`     → ${idea.angle}`);
  }
  console.log("");
}

function displayOutline(sections: OutlineSection[]): void {
  console.log("\n--- Blog Outline ---");
  for (const section of sections) {
    console.log(`  ## ${section.heading}`);
    for (const point of section.keyPoints) {
      console.log(`     - ${point}`);
    }
  }
  console.log("");
}

// --- Main Pipeline ---

async function main(): Promise<void> {
  const apiKey = process.env.COPILOT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing COPILOT_API_KEY environment variable.");
  }

  // Default configuration — customize or accept from CLI args.
  // TODO: Add argparse-style CLI argument parsing for config overrides.
  const config: BlogConfig = {
    prNumbers: [142, 145, 148],
    issueNumbers: [87, 92],
    repoName: "acme/web-platform",
    audience: "developer",
    tone: "technical",
    outputPath: "blog-draft.md",
  };

  console.log("[BlogWriter] Starting content pipeline...");

  const client = createCopilotClient({ apiKey });
  client.start();
  const session = client.createSession();
  const rl = createReadlineInterface();

  try {
    // Stage 1: Brainstorm topics.
    const ideas = await generateBlogIdeas(session, config);
    displayIdeas(ideas);

    const pickStr = await prompt(rl, "Pick a topic number (1-5): ");
    const pickIndex = parseInt(pickStr, 10);
    const chosenIdea = ideas.find((i) => i.index === pickIndex) ?? ideas[0];
    console.log(`\n[Selected] "${chosenIdea.title}"\n`);

    // Stage 2: Outline the chosen topic.
    const sections = await outlineBlogPost(session, config, chosenIdea.title);
    displayOutline(sections);

    const approveOutline = await prompt(rl, "Approve this outline? (yes/no): ");
    if (approveOutline.toLowerCase() !== "yes" && approveOutline.toLowerCase() !== "y") {
      console.log("[BlogWriter] Outline not approved. Exiting pipeline.");
      return;
    }

    // Stage 3: Draft the full post.
    const draft = await draftBlogPost(session, config, chosenIdea.title, sections);

    // Stage 4: Refine the draft.
    const toneChoice = await prompt(
      rl,
      `Refine tone? (${config.tone}/casual/formal, or "skip"): `
    );
    let finalDraft: DraftResult;
    if (toneChoice.toLowerCase() === "skip") {
      finalDraft = draft;
    } else {
      const refineTone = (["technical", "casual", "formal"].includes(toneChoice)
        ? toneChoice
        : config.tone) as Tone;
      const refineConfig = { ...config, tone: refineTone };
      finalDraft = await refineDraft(session, refineConfig, draft);
    }

    // Save to file.
    const outputPath = path.resolve(config.outputPath);
    await fs.writeFile(outputPath, finalDraft.markdown, "utf-8");
    console.log(`[Final] Blog post saved to ${config.outputPath}`);
  } catch (error) {
    console.error("[Error]", error instanceof Error ? error.message : error);
  } finally {
    rl.close();
    session.destroy();
    client.stop();
  }
}

// Run the pipeline.
main().catch(console.error);
