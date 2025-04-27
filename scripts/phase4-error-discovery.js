#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Script to run TypeScript error discovery per module and aggregate counts
const modulesDir = path.resolve(__dirname, "../backend/src/modules");
const results = {};

fs.readdirSync(modulesDir).forEach((mod) => {
  const modulePath = path.join(modulesDir, mod);
  if (!fs.statSync(modulePath).isDirectory()) return;
  const projectConfig = fs.existsSync(path.join(modulePath, "tsconfig.json"))
    ? path.join(modulePath, "tsconfig.json")
    : path.resolve(__dirname, "../backend/tsconfig.json");
  console.log(`\nChecking module: ${mod}`);
  try {
    execSync(`tsc --noEmit --pretty -p ${projectConfig}`, { stdio: "inherit" });
    results[mod] = { errors: 0 };
  } catch (err) {
    const output = err.stdout ? err.stdout.toString() : "";
    const count = (output.match(/error TS/g) || []).length;
    results[mod] = { errors: count };
  }
});

console.log("\nSummary of TS errors per module:");
console.table(results);
