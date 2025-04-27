/**
 * Fix Connector Implementation Files
 *
 * This script fixes malformed methods in connector implementation files
 * by removing duplicate or malformed method implementations.
 */

import * as fs from "fs";
import * as path from "path";

// List of connector files to fix
const filesToFix = [
  path.resolve(
    __dirname,
    "../../src/modules/connectors/adapters/takealot-connector.ts",
  ),
  path.resolve(
    __dirname,
    "../../src/modules/connectors/adapters/amazon-sp/amazon-sp-connector.ts",
  ),
  path.resolve(
    __dirname,
    "../../src/modules/connectors/adapters/shopify/shopify-connector.ts",
  ),
];

function fixConnectorImplementation(filePath: string): void {
  console.log(`Fixing connector implementation in ${filePath}`);

  // Read the file content
  let content = fs.readFileSync(filePath, "utf8");

  // Check for pattern of malformed code
  // Regex to match malformed method implementations
  const malformedMethodPattern = /}(\s*)\{(\s*)\*\*(\s*)\*[^}]*?};(\s*)\}/g;

  // Fix malformed methods
  content = content.replace(malformedMethodPattern, "}");

  // Fix other common syntax errors
  // Empty blocks that should be removed
  content = content.replace(/};(\s*)}/g, "}");

  // Write fixed content back to file
  fs.writeFileSync(filePath, content, "utf8");

  console.log(`Fixed connector implementation in ${filePath}`);
}

// Process all files
function run() {
  filesToFix.forEach((file) => {
    if (fs.existsSync(file)) {
      fixConnectorImplementation(file);
    } else {
      console.warn(`File not found: ${file}`);
    }
  });

  console.log("All connector implementations fixed!");
}

run();
