/**
 * Module Interface Analyzer
 *
 * This script analyzes the current state of module interfaces by:
 * 1. Finding all modules in the backend
 * 2. Checking for index.ts files and analyzing their exports
 * 3. Identifying modules without proper public interfaces
 * 4. Generating a report of current vs. ideal module interfaces
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const BACKEND_PATH = path.join(__dirname, "..", "backend");
const MODULES_PATH = path.join(BACKEND_PATH, "src", "modules");
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "docs",
  "analysis",
  "module-interfaces.md",
);

/**
 * Get all module directories
 */
function getModuleDirectories() {
  return fs
    .readdirSync(MODULES_PATH, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => ({
      name: dirent.name,
      path: path.join(MODULES_PATH, dirent.name),
    }));
}

/**
 * Check if a module has an index.ts file
 */
function hasIndexFile(modulePath) {
  const indexPath = path.join(modulePath, "index.ts");
  return fs.existsSync(indexPath);
}

/**
 * Analyze a module's structure
 */
function analyzeModule(moduleInfo) {
  const result = {
    name: moduleInfo.name,
    hasIndex: hasIndexFile(moduleInfo.path),
    components: {
      controllers: [],
      services: [],
      repositories: [],
      models: [],
      interfaces: [],
    },
    exports: [],
    missingExports: [],
  };

  // Find components
  const controllers = findFiles(
    path.join(moduleInfo.path, "controllers"),
    ".controller.ts",
  );
  const services = findFiles(
    path.join(moduleInfo.path, "services"),
    ".service.ts",
  );
  const repositories = findFiles(
    path.join(moduleInfo.path, "repositories"),
    ".repository.ts",
  );
  const models = [
    ...findFiles(path.join(moduleInfo.path, "models"), ".model.ts"),
    ...findFiles(path.join(moduleInfo.path, "models"), ".schema.ts"),
  ];
  const interfaces = findFiles(path.join(moduleInfo.path, "interfaces"), ".ts");

  result.components.controllers = controllers.map(extractClassName);
  result.components.services = services.map(extractClassName);
  result.components.repositories = repositories.map(extractClassName);
  result.components.models = models.map(extractClassName);
  result.components.interfaces = interfaces;

  // If there's an index.ts, analyze exports
  if (result.hasIndex) {
    const indexPath = path.join(moduleInfo.path, "index.ts");
    result.exports = analyzeExports(indexPath);
  }

  // Determine what should be exported but isn't
  if (result.hasIndex) {
    const allComponents = [
      ...result.components.services,
      ...result.components.models,
      result.name + "Module",
    ];

    result.missingExports = allComponents.filter(
      (component) => !result.exports.includes(component),
    );
  }

  return result;
}

/**
 * Find files with a specific extension in a directory
 */
function findFiles(dirPath, extension) {
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith(extension))
    .map((file) => path.join(dirPath, file.name));
}

/**
 * Extract class name from a file path
 */
function extractClassName(filePath) {
  const fileName = path.basename(filePath);
  const parts = fileName.split(".");

  // Convert kebab-case to PascalCase
  return parts[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Analyze exports from an index.ts file
 */
function analyzeExports(indexPath) {
  try {
    const content = fs.readFileSync(indexPath, "utf8");
    const exportMatches = content.match(/export\s+\{([^}]+)\}/g) || [];
    const reExportMatches = content.match(/export\s+\*\s+from/g) || [];

    const exports = [];

    exportMatches.forEach((match) => {
      const names = match
        .replace(/export\s+\{|\}/g, "")
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name && !name.includes(" as "));

      exports.push(...names);
    });

    return exports;
  } catch (error) {
    console.error(`Error analyzing exports in ${indexPath}:`, error);
    return [];
  }
}

/**
 * Generate a report of module interfaces
 */
function generateReport(modules) {
  let report = "# Module Interface Analysis\n\n";

  report += "## Summary\n\n";
  report += `Total modules: ${modules.length}\n`;
  report += `Modules with index.ts: ${modules.filter((m) => m.hasIndex).length}\n`;
  report += `Modules without index.ts: ${modules.filter((m) => !m.hasIndex).length}\n\n`;

  report += "## Modules With Proper Public API\n\n";
  const goodModules = modules.filter(
    (m) => m.hasIndex && m.missingExports.length === 0,
  );
  if (goodModules.length === 0) {
    report += "No modules have a complete public API.\n\n";
  } else {
    goodModules.forEach((module) => {
      report += `### ${module.name}\n`;
      report += `Exports: ${module.exports.join(", ")}\n\n`;
    });
  }

  report += "## Modules With Incomplete Public API\n\n";
  const incompleteModules = modules.filter(
    (m) => m.hasIndex && m.missingExports.length > 0,
  );
  if (incompleteModules.length === 0) {
    report += "No modules have an incomplete public API.\n\n";
  } else {
    incompleteModules.forEach((module) => {
      report += `### ${module.name}\n`;
      report += `Current exports: ${module.exports.join(", ")}\n`;
      report += `Missing exports: ${module.missingExports.join(", ")}\n\n`;
    });
  }

  report += "## Modules Without Public API\n\n";
  const noApiModules = modules.filter((m) => !m.hasIndex);
  if (noApiModules.length === 0) {
    report += "All modules have a public API.\n\n";
  } else {
    noApiModules.forEach((module) => {
      report += `### ${module.name}\n`;
      report += "Components that should be exported:\n";
      if (module.components.services.length > 0) {
        report += `- Services: ${module.components.services.join(", ")}\n`;
      }
      if (module.components.models.length > 0) {
        report += `- Models: ${module.components.models.join(", ")}\n`;
      }
      report += `- Module: ${module.name}Module\n\n`;
    });
  }

  return report;
}

/**
 * Main function
 */
function main() {
  try {
    console.log("Analyzing module interfaces...");

    // Get all module directories
    const moduleDirectories = getModuleDirectories();
    console.log(`Found ${moduleDirectories.length} modules.`);

    // Analyze each module
    const moduleAnalyses = moduleDirectories.map(analyzeModule);

    // Generate report
    const report = generateReport(moduleAnalyses);

    // Write report to file
    fs.writeFileSync(OUTPUT_PATH, report);
    console.log(`Report written to ${OUTPUT_PATH}`);

    // Also print to stdout
    console.log("\n--- REPORT ---\n");
    console.log(report);
  } catch (error) {
    console.error("Error analyzing module interfaces:", error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeModule,
  generateReport,
  main,
};
