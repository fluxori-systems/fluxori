/**
 * Script to remove all TypeScript suppressions from the codebase
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const { execSync } = require("child_process");

// Find all files with TypeScript suppressions
console.log("Finding files with TypeScript suppressions...");
const findCommand =
  "grep -r '@ts-expect-error\\|@ts-ignore\\|@ts-nocheck' --include='*.ts' --include='*.tsx' ./src";
let filePaths = [];

try {
  const result = execSync(findCommand, { encoding: "utf8" });
  // Extract file paths from grep results
  filePaths = result
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.split(":")[0]);

  // Remove duplicates
  filePaths = [...new Set(filePaths)];
} catch (error) {
  // If grep doesn't find any matches, it will exit with code 1
  console.log("No TypeScript suppressions found.");
  process.exit(0);
}

if (filePaths.length === 0) {
  console.log("No TypeScript suppressions found.");
  process.exit(0);
}

console.log(`Found ${filePaths.length} files with suppressions:`);
filePaths.forEach((file) => console.log(`- ${file}`));

// Process each file
console.log("\nRemoving suppressions...");
filePaths.forEach((filePath) => {
  let content = fs.readFileSync(filePath, "utf8");

  // Add imports if needed for test files
  if (
    filePath.includes("__tests__") &&
    !content.includes("import '@testing-library/jest-dom'")
  ) {
    // Add jest-dom import before the first import
    const importMatch = content.match(/^import /m);
    if (importMatch) {
      const pos = importMatch.index;
      content =
        content.slice(0, pos) +
        "import '@testing-library/jest-dom';\n" +
        content.slice(pos);
    }
  }

  // Remove all TypeScript suppressions
  const beforeCount = (
    content.match(/@ts-(expect-error|ignore|nocheck)/g) || []
  ).length;
  content = content.replace(
    /\/\/\s*@ts-(expect-error|ignore|nocheck).*\n/g,
    "",
  );
  content = content.replace(
    /\/\*\s*@ts-(expect-error|ignore|nocheck).*?\*\//g,
    "",
  );
  content = content.replace(/@ts-(expect-error|ignore|nocheck).*/g, "");

  // Write the updated content
  fs.writeFileSync(filePath, content);

  console.log(`- ${filePath}: Removed ${beforeCount} suppressions`);
});

console.log("\nAll TypeScript suppressions have been removed.");
