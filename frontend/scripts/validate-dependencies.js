/**
 * Dependency Validation Script
 *
 * This script validates that no circular dependencies exist between UI and Motion modules
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Base project directory
const baseDir = path.resolve(__dirname, "..");

// Directories to check
const UI_DIR = path.join(baseDir, "src/lib/ui");
const MOTION_DIR = path.join(baseDir, "src/lib/motion");

// Problematic import patterns
const PROBLEMATIC_IMPORTS = {
  UI_IMPORTING_MOTION: {
    dir: UI_DIR,
    pattern: /import\s+.+\s+from\s+['"]\.\.\/motion\/(?!.*\.d\.ts)[^'"]+['"]/g,
    rule: "UI components should not directly import from Motion module",
  },
  MOTION_IMPORTING_UI: {
    dir: MOTION_DIR,
    pattern: /import\s+.+\s+from\s+['"]\.\.\/ui\/(?!.*\.d\.ts)[^'"]+['"]/g,
    rule: "Motion components should not directly import from UI module",
  },
};

// Allowed import patterns
const ALLOWED_IMPORTS = [
  // Allow importing type definitions
  /import\s+type\s+\{[^}]*\}\s+from\s+['"]/,
  // Allow importing from shared module
  /import\s+.+\s+from\s+['"]\.\.\/shared\//,
];

// Check if import is allowed
function isAllowedImport(importLine) {
  return ALLOWED_IMPORTS.some((pattern) => pattern.test(importLine));
}

// Check a directory for problematic imports
function checkDirectory(dirInfo) {
  const { dir, pattern, rule } = dirInfo;
  const errors = [];

  console.log(
    `Checking ${path.basename(dir)} directory for problematic imports...`,
  );

  // Find all TypeScript and TSX files
  const files = glob.sync(path.join(dir, "**/*.{ts,tsx}"));

  // Check each file
  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(pattern);

    if (matches) {
      // Check if any of the matches are not allowed
      const problematicImports = matches.filter(
        (importLine) => !isAllowedImport(importLine),
      );

      if (problematicImports.length > 0) {
        errors.push({
          file: path.relative(baseDir, file),
          rule,
          imports: problematicImports,
        });
      }
    }
  });

  return errors;
}

// Main function
function main() {
  let allErrors = [];

  // Check UI importing Motion
  allErrors = allErrors.concat(
    checkDirectory(PROBLEMATIC_IMPORTS.UI_IMPORTING_MOTION),
  );

  // Check Motion importing UI
  allErrors = allErrors.concat(
    checkDirectory(PROBLEMATIC_IMPORTS.MOTION_IMPORTING_UI),
  );

  // Print results
  if (allErrors.length === 0) {
    console.log("\n✅ No circular dependencies found!");
    return 0;
  } else {
    console.error(
      `\n❌ Found ${allErrors.length} files with circular dependencies:\n`,
    );

    allErrors.forEach((error) => {
      console.error(`📁 ${error.file}`);
      console.error(`   Rule: ${error.rule}`);
      console.error("   Problematic imports:");
      error.imports.forEach((importLine) => {
        console.error(`     - ${importLine.trim()}`);
      });
      console.error("");
    });

    return 1;
  }
}

// Run the script
const exitCode = main();
process.exit(exitCode);
