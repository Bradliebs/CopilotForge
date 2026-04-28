'use strict';

module.exports = {
  name: 'react-app',
  description: 'Build path for React/Next.js applications with TypeScript',
  buildPath: 'K',
  signals: ['react', 'nextjs', 'next.js', 'react-app', 'frontend'],
  questions: [
    {
      id: 'react-framework',
      prompt: 'Which React framework?',
      choices: ['Next.js', 'Vite', 'Create React App', 'Remix'],
    },
    {
      id: 'react-styling',
      prompt: 'Styling approach?',
      choices: ['Tailwind CSS', 'CSS Modules', 'styled-components', 'None'],
    },
  ],
  templates: {
    forge: `# FORGE.md — [Your Project Name]

<!-- copilotforge: path=K -->

## Project Summary
- **Build Path:** K — React Application
- **Framework:** [Next.js / Vite / CRA / Remix]
- **Styling:** [Tailwind / CSS Modules / styled-components]

## Conventions
- Components in \`src/components/\` with PascalCase naming
- Pages in \`src/app/\` (Next.js) or \`src/pages/\`
- Hooks in \`src/hooks/\` prefixed with \`use\`
- Types in \`src/types/\`

## Settings
- Build Path: K
- Path Name: React Application
`,
  },
};
