'use strict';

module.exports = {
  name: 'python-api',
  description: 'Build path for Python API projects (FastAPI, Flask, Django)',
  buildPath: 'L',
  signals: ['python', 'fastapi', 'flask', 'django', 'python-api', 'uvicorn'],
  questions: [
    {
      id: 'python-framework',
      prompt: 'Which Python framework?',
      choices: ['FastAPI', 'Flask', 'Django', 'Other'],
    },
    {
      id: 'python-db',
      prompt: 'Database?',
      choices: ['PostgreSQL', 'SQLite', 'MongoDB', 'None'],
    },
  ],
  templates: {
    forge: `# FORGE.md — [Your Project Name]

<!-- copilotforge: path=L -->

## Project Summary
- **Build Path:** L — Python API
- **Framework:** [FastAPI / Flask / Django]
- **Database:** [PostgreSQL / SQLite / MongoDB]

## Conventions
- Source in \`src/\` or \`app/\`
- Tests in \`tests/\` using pytest
- Requirements in \`requirements.txt\` or \`pyproject.toml\`
- Type hints on all public functions

## Settings
- Build Path: L
- Path Name: Python API
`,
  },
};
