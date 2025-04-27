module.exports = {
  // Lint TypeScript files
  "backend/src/**/*.ts": ["prettier --write", "npm run lint:boundaries"],
  "frontend/src/**/*.{ts,tsx}": ["prettier --write"],
  // Markdown files
  "*.md": ["prettier --write"],
};
