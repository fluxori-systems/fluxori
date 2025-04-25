#!/usr/bin/env node
"use strict";
const { execSync } = require('child_process');

// Parse --slice argument
const sliceArg = process.argv.find(arg => arg.startsWith('--slice='));
if (!sliceArg) {
  console.error('Error: Missing --slice argument.');
  console.error('Usage: node scripts/phase2-clean.js --slice=<backend/... or frontend/...>');
  process.exit(1);
}
const slice = sliceArg.split('=')[1];
console.log(`Phase 2 Cleanup for slice: ${slice}`);


// Determine workspace and relative slice path
let workspaceDir;
let lintTarget;
let tsTarget;
if (slice.startsWith('backend/')) {
  workspaceDir = 'backend';
  const rel = slice.replace(/^backend\//, '');
  lintTarget = `${rel}/**/*.{ts,tsx}`;
  tsTarget = `"${rel}/**/*.{ts,tsx}"`;
} else if (slice.startsWith('frontend/')) {
  workspaceDir = 'frontend';
  const rel = slice.replace(/^frontend\//, '');
  lintTarget = `src/${rel}/**/*.{ts,tsx}`;
  tsTarget = `"src/${rel}/**/*.{ts,tsx}"`;
} else {
  console.error('Error: slice must start with "backend/" or "frontend/"');
  process.exit(1);
}

// Before cleaning, validate dependencies (cycles/boundary rules)
console.log(`\nRunning dependency validation for ${slice}...`);
try {
  if (workspaceDir === 'backend') {
    execSync(
      `cd ${workspaceDir} && npx depcruise ${slice.replace('backend/','src/')} --config .dependency-cruiser.js --validate`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(
      `cd ${workspaceDir} && npx depcruise ${slice.replace('frontend/','src/')} --config .dependency-cruiser.js --validate`,
      { stdio: 'inherit' }
    );
  }
} catch (err) {
  console.warn('Dependency validation reported issues (expected if cycles exist). Please review above report.');
}

// Run ESLint auto-fix on slice
console.log(`Running ESLint auto-fix on ${workspaceDir}/${lintTarget} (disabling import/no-unresolved & import/no-cycle)`);
execSync(
  `cd ${workspaceDir} && npx eslint --ext .ts,.tsx "${lintTarget}" --fix --cache \
    --rule "import/no-unresolved:off" \
    --rule "import/no-cycle:off" \
    --rule "import/namespace:off" \
    --rule "import/order:off" \
    --rule "import/named:off" \
    --rule "import/no-restricted-paths:off" \
    --rule "import/no-duplicates:off" \
    --rule "import/export:off" \
    --rule "@typescript-eslint/no-unused-vars:off"`,
  { stdio: 'inherit' }
);

// Run full TypeScript check
console.log(`Running full TypeScript check in ${workspaceDir}...`);
execSync(`cd ${workspaceDir} && npx tsc --noEmit`, { stdio: 'inherit' });