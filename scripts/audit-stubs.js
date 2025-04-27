#!/usr/bin/env node
// Audit stub artifacts: placeholder files and ignored TS directives
const fs = require("fs");
const path = require("path");

// Patterns for stub artifacts
const stubPatterns = [
  /\.stub\.tsx?$/,
  /__stubs__\//,
  /__mocks__\//,
  /\.d\.ts$/,
];

// Directories to ignore
const ignoreDirs = new Set(["node_modules", "dist", ".git"]);

function isStubFile(filePath) {
  return stubPatterns.some((re) => re.test(filePath));
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!ignoreDirs.has(file)) {
        results.push(...walk(filePath));
      }
    } else {
      if (isStubFile(filePath)) {
        results.push(filePath);
      }
    }
  }
  return results;
}

function auditStubs() {
  console.log("Scanning for stub artifacts...");
  const root = process.cwd();
  const files = walk(root);
  if (!files.length) {
    console.log("No stub artifacts found.");
    return;
  }
  console.log(`Found ${files.length} stub artifact(s):`);
  files.sort().forEach((f) => console.log(" - " + path.relative(root, f)));

  console.log(
    "\nSearching for @ts-ignore and @ts-expect-error in stub artifacts...",
  );
  let found = 0;
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes("@ts-ignore") || line.includes("@ts-expect-error")) {
        if (!found) console.log("");
        console.log(`${path.relative(root, file)}:${idx + 1}: ${line.trim()}`);
        found++;
      }
    });
  }
  if (!found) console.log("No TS ignore directives found in stub artifacts.");
}

// Run audit
try {
  auditStubs();
} catch (err) {
  console.error("Error during stub audit:", err);
  process.exit(1);
}
