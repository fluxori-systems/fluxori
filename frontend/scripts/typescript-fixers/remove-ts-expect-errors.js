/**
 * Script to remove @ts-expect-error annotations from test files
 *
 * This script systematically removes TypeScript suppressions from test files
 * now that we have proper type definitions set up.
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Find all test files
const testFiles = glob.sync("src/**/__tests__/**/*.{spec,test}.{ts,tsx}", {
  cwd: process.cwd(),
  absolute: true,
});

// Process each file
testFiles.forEach((file) => {
  console.log(`Processing ${file}`);

  // Read the file
  let content = fs.readFileSync(file, "utf8");

  // Check if file has TypeScript suppressions
  if (content.includes("@ts-expect-error")) {
    // Add import if not already present
    if (!content.includes("import '@testing-library/jest-dom'")) {
      // Add after the last import statement
      const importRegex = /^import .+;$/gm;
      const lastImport = [...content.matchAll(importRegex)].pop();

      if (lastImport) {
        const position = lastImport.index + lastImport[0].length;
        content =
          content.slice(0, position) +
          "\nimport '@testing-library/jest-dom';" +
          content.slice(position);
      } else {
        // No imports found, add at the top after 'use client' if present
        if (content.startsWith("'use client'")) {
          const clientDirectiveEndPosition =
            content.indexOf("'use client'") + "'use client'".length;
          content =
            content.slice(0, clientDirectiveEndPosition) +
            "\n\nimport '@testing-library/jest-dom';" +
            content.slice(clientDirectiveEndPosition);
        } else {
          content = "import '@testing-library/jest-dom';\n" + content;
        }
      }
    }

    // Make sure vitest environment is set
    if (!content.includes("@vitest-environment jsdom")) {
      content = "// @vitest-environment jsdom\n" + content;
    }

    // Remove all @ts-expect-error comments
    content = content.replace(/\/\/ @ts-expect-error.*\n/g, "");

    // Write the updated content
    fs.writeFileSync(file, content);

    console.log(`  - Removed TypeScript suppressions and added proper imports`);
  } else {
    console.log(`  - No TypeScript suppressions found`);
  }
});

console.log("\nAll test files processed successfully");
