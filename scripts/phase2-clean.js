#!/usr/bin/env node
"use strict";
const { execSync } = require("child_process");

// Parse --slice argument
const sliceArg = process.argv.find((arg) => arg.startsWith("--slice="));
if (!sliceArg) {
  console.error("Error: Missing --slice argument.");
  console.error(
    "Usage: node scripts/phase2-clean.js --slice=<backend/... or frontend/...>",
  );
  process.exit(1);
}
const slice = sliceArg.split("=")[1];
console.log(`Phase 2 Cleanup for slice: ${slice}`);

// Determine workspace and relative slice path
let workspaceDir;
let lintTarget;
let tsTarget;
if (slice.startsWith("backend/")) {
  workspaceDir = "backend";
  const rel = slice.replace(/^backend\//, "");
  lintTarget = `${rel}/**/*.{ts,tsx}`;
  tsTarget = `"${rel}/**/*.{ts,tsx}"`;
} else if (slice.startsWith("frontend/")) {
  workspaceDir = "frontend";
  const rel = slice.replace(/^frontend\//, "");
  lintTarget = `src/${rel}/**/*.{ts,tsx}`;
  tsTarget = `"src/${rel}/**/*.{ts,tsx}"`;
} else {
  console.error('Error: slice must start with "backend/" or "frontend/"');
  process.exit(1);
}

// Before cleaning, validate dependencies (cycles/boundary rules)
console.log(`\nRunning dependency validation for ${slice}...`);
try {
  // Use relative slice path (rel) for dependency validation
  execSync(
    `cd ${workspaceDir} && npx depcruise ${rel} --config .dependency-cruiser.js --validate`,
    { stdio: "inherit" },
  );
} catch (err) {
  console.warn(
    "Dependency validation reported issues (expected if cycles exist). Please review above report.",
  );
}

// Run ESLint auto-fix on slice
console.log(`Running ESLint auto-fix on ${workspaceDir}/${lintTarget}`);
execSync(
  `cd ${workspaceDir} && npx eslint --ext .ts,.tsx "${lintTarget}" --fix --cache`,
  { stdio: "inherit" },
);
