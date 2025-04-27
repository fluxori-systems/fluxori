#!/usr/bin/env node
// Bulk ESLint auto-fix in smaller chunks to avoid OOM in large codebase
const { execSync } = require("child_process");
const fs = require("fs");

function run(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch (err) {
    console.warn(`Command failed: ${command}`);
  }
}

// Load module list from analysis file
let modules = [];
try {
  const analysis = JSON.parse(fs.readFileSync("module-analysis.json", "utf-8"));
  if (analysis.backend && Array.isArray(analysis.backend.modules)) {
    modules = analysis.backend.modules;
  }
} catch (err) {
  console.warn(
    "Could not parse module-analysis.json, skipping per-module lint.",
  );
}

// Lint-fix each backend module
if (modules.length) {
  console.log("Autofixing backend modules:");
  modules.forEach((mod) => {
    run(`npx eslint \
      "backend/src/modules/${mod}/**/*.ts" \
      --fix --cache`);
  });
}

// Lint-fix other backend directories
["common", "config", "health"].forEach((dir) => {
  run(`npx eslint "backend/src/${dir}/**/*.ts" --fix --cache`);
});

// Lint-fix root-level backend files
run(`npx eslint "backend/src/*.ts" --fix --cache`);

// Frontend auto-fix
console.log("Autofixing frontend:");
run(`npm run lint:frontend`);

// Type-check both projects
console.log("Running type-check:");
run(`npm run typecheck`);
