/**
 * Dependency Visualization Script
 *
 * This script creates a text-based visualization of the dependencies
 * between UI, Motion, and Shared modules without requiring graphviz.
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Base project directory
const baseDir = path.resolve(__dirname, "..");
const srcDir = path.join(baseDir, "src");

// Modules to analyze
const UI_DIR = path.join(srcDir, "lib/ui");
const MOTION_DIR = path.join(srcDir, "lib/motion");
const SHARED_DIR = path.join(srcDir, "lib/shared");

// Store the dependencies
const dependencies = {
  "ui→motion": [],
  "ui→shared": [],
  "motion→ui": [],
  "motion→shared": [],
  "shared→ui": [],
  "shared→motion": [],
};

// Regular expressions to match imports
const IMPORT_REGEX = /import\s+.+\s+from\s+['"]([^'"]+)['"]/g;
const LIB_MODULE_REGEX = /(?:\.\.\/)+(?:lib\/)?(?:ui|motion|shared)\//;

// Process a file and find its dependencies
function processFile(filePath, moduleDir) {
  const relativePath = path.relative(baseDir, filePath);
  const moduleName = path.basename(moduleDir);

  // Read file content
  const content = fs.readFileSync(filePath, "utf8");

  // Find all imports
  let match;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = match[1];

    // Only process imports to lib modules
    if (LIB_MODULE_REGEX.test(importPath)) {
      let targetModule;

      if (importPath.includes("/lib/ui/")) {
        targetModule = "ui";
      } else if (importPath.includes("/lib/motion/")) {
        targetModule = "motion";
      } else if (importPath.includes("/lib/shared/")) {
        targetModule = "shared";
      } else {
        return; // Not a module we're tracking
      }

      // Skip imports from the same module
      if (targetModule !== moduleName) {
        const key = `${moduleName}→${targetModule}`;
        if (dependencies[key]) {
          dependencies[key].push({
            from: relativePath,
            to: importPath,
          });
        }
      }
    }
  }
}

// Process all files in a directory
function processDirectory(dir) {
  const files = glob.sync(path.join(dir, "**/*.{ts,tsx}"));

  files.forEach((file) => {
    processFile(file, dir);
  });
}

// Create the visualization
function createVisualization() {
  let output = `# Module Dependencies Visualization\n\n`;
  output += `## Project: Fluxori Frontend\n`;
  output += `## Date: ${new Date().toISOString().split("T")[0]}\n\n`;

  // Add a summary
  output += `## Summary\n\n`;
  output += `| From → To | Count |\n`;
  output += `|----------|-------|\n`;

  for (const [relation, deps] of Object.entries(dependencies)) {
    output += `| ${relation} | ${deps.length} |\n`;
  }

  // Add detailed dependencies
  output += `\n## Detailed Dependencies\n\n`;

  for (const [relation, deps] of Object.entries(dependencies)) {
    const [from, to] = relation.split("→");

    output += `### ${from} → ${to} (${deps.length})\n\n`;

    if (deps.length === 0) {
      output += `*No dependencies found*\n\n`;
    } else {
      deps.forEach((dep) => {
        output += `- \`${dep.from}\` imports from \`${dep.to}\`\n`;
      });
      output += `\n`;
    }
  }

  // Add a visualization guide
  output += `## Visualization Guide\n\n`;
  output += `\`\`\`\n`;
  output += `UI ───────────┐           \n`;
  output += `  │            ↓           \n`;
  output += `  │        [SHARED]       \n`;
  output += `  │            ↑           \n`;
  output += `  └────────→ MOTION       \n`;
  output += `\`\`\`\n\n`;

  output += `Ideal pattern (no circular dependencies):\n`;
  output += `\`\`\`\n`;
  output += `UI ↔ SHARED ↔ MOTION\n`;
  output += `\`\`\`\n\n`;

  // Add conclusion
  output += `## Conclusion\n\n`;

  if (
    dependencies["ui→motion"].length === 0 &&
    dependencies["motion→ui"].length === 0
  ) {
    output += `✅ **No circular dependencies detected!** The dependency structure follows the ideal pattern.\n`;
  } else {
    output += `❌ **Circular dependencies detected!** The modules have direct dependencies on each other:\n\n`;

    if (dependencies["ui→motion"].length > 0) {
      output += `- UI directly imports from Motion module (${dependencies["ui→motion"].length} dependencies)\n`;
    }

    if (dependencies["motion→ui"].length > 0) {
      output += `- Motion directly imports from UI module (${dependencies["motion→ui"].length} dependencies)\n`;
    }

    output += `\nRecommendation: Implement the dependency inversion pattern by moving shared functionality to the shared module.\n`;
  }

  return output;
}

// Main function
function main() {
  console.log("Analyzing dependencies...");

  // Process all directories
  processDirectory(UI_DIR);
  processDirectory(MOTION_DIR);
  processDirectory(SHARED_DIR);

  // Create the visualization
  const visualization = createVisualization();

  // Write the visualization to a file
  const outputFile = path.join(baseDir, "module-dependencies.md");
  fs.writeFileSync(outputFile, visualization, "utf8");

  console.log(`Visualization written to ${outputFile}`);
}

// Run the script
main();
