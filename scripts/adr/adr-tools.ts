/**
 * ADR Tools
 *
 * A set of utilities for managing Architecture Decision Records (ADRs)
 * with dependency visualization integration.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { generateAdrDependencyVisualization } from "./generate-adr-dependencies";

// Types
interface ADRMetadata {
  number: number;
  title: string;
  filename: string;
  status: string;
  date: string;
  path: string;
  visualizations: string[];
}

interface ADRCreateOptions {
  title: string;
  modules?: string[];
  includeCommon?: boolean;
  status?: string;
}

const ADR_DIR = path.join(__dirname, "..", "..", "docs", "adr");
const ADR_TEMPLATE = path.join(ADR_DIR, "template.md");
const ADR_INDEX = path.join(ADR_DIR, "README.md");
const VISUALIZATION_DIR = path.join(ADR_DIR, "visualizations");

/**
 * Get the next available ADR number
 */
function getNextAdrNumber(): number {
  if (!fs.existsSync(ADR_DIR)) {
    fs.mkdirSync(ADR_DIR, { recursive: true });
    return 1;
  }

  const files = fs.readdirSync(ADR_DIR);
  const adrFiles = files.filter((file) => /^ADR-\d{3}-.+\.md$/.test(file));

  if (adrFiles.length === 0) {
    return 1;
  }

  const numbers = adrFiles.map((file) => {
    const match = file.match(/^ADR-(\d{3})/);
    return match ? parseInt(match[1], 10) : 0;
  });

  return Math.max(...numbers) + 1;
}

/**
 * Create a new ADR file from the template
 */
function createAdr(options: ADRCreateOptions): string {
  const {
    title,
    modules = [],
    includeCommon = true,
    status = "Proposed",
  } = options;

  // Get the next available ADR number
  const adrNumber = getNextAdrNumber();

  // Sanitize the title for filename
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Create the ADR filename
  const adrFilename = `ADR-${adrNumber.toString().padStart(3, "0")}-${sanitizedTitle}.md`;
  const adrPath = path.join(ADR_DIR, adrFilename);

  // Check if the template exists
  if (!fs.existsSync(ADR_TEMPLATE)) {
    throw new Error(`ADR template not found at ${ADR_TEMPLATE}`);
  }

  // Read the template
  let templateContent = fs.readFileSync(ADR_TEMPLATE, "utf-8");

  // Replace placeholders
  const today = new Date().toISOString().split("T")[0];
  templateContent = templateContent.replace(
    /# ADR-000: Title of Architecture Decision/,
    `# ADR-${adrNumber.toString().padStart(3, "0")}: ${title}`,
  );
  templateContent = templateContent.replace(/Proposed/, status);
  templateContent = templateContent.replace(/YYYY-MM-DD/, today);

  // Add any module-specific visualizations if modules are specified
  if (modules.length > 0) {
    // Create directories if they don't exist
    if (!fs.existsSync(VISUALIZATION_DIR)) {
      fs.mkdirSync(VISUALIZATION_DIR, { recursive: true });
    }

    // Generate visualization for specified modules
    try {
      const visualizationPath = generateAdrDependencyVisualization({
        title,
        adrNumber,
        focusModules: modules,
        includeCommonUtilities: includeCommon,
        outputFormat: "svg",
        highlightViolations: true,
      });

      // Update the template with the visualization path
      const relativePath = path.relative(ADR_DIR, visualizationPath);
      const placeholder =
        "<!-- Include the current dependency visualization, focused on the modules relevant to this decision. -->";
      const replacement = `![Module Dependencies](${relativePath})\n\nThis diagram shows the dependencies between the following modules: ${modules.join(", ")}.`;

      templateContent = templateContent.replace(placeholder, replacement);
    } catch (error) {
      console.warn(
        "Warning: Failed to generate dependency visualization.",
        error,
      );
    }
  }

  // Write the ADR file
  fs.writeFileSync(adrPath, templateContent);

  console.log(`Created ADR: ${adrPath}`);

  // Update the ADR index
  updateAdrIndex();

  return adrPath;
}

/**
 * Extract metadata from an ADR file
 */
function extractAdrMetadata(filePath: string): ADRMetadata | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Extract title
    const titleMatch = content.match(/# ADR-(\d{3}): (.+)/);
    if (!titleMatch) return null;

    const number = parseInt(titleMatch[1], 10);
    const title = titleMatch[2].trim();

    // Extract status
    const statusMatch = content.match(/## Status\s+([A-Za-z]+)/);
    const status = statusMatch ? statusMatch[1] : "Unknown";

    // Extract date
    const dateMatch = content.match(/## Date\s+(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : "N/A";

    // Extract visualizations
    const visualizationMatches = content.match(/!\[.*?\]\((.*?)\)/g) || [];
    const visualizations = visualizationMatches
      .map((match) => {
        const pathMatch = match.match(/!\[.*?\]\((.*?)\)/);
        return pathMatch ? pathMatch[1] : "";
      })
      .filter(Boolean);

    return {
      number,
      title,
      filename: path.basename(filePath),
      status,
      date,
      path: filePath,
      visualizations,
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    return null;
  }
}

/**
 * Update the ADR index file
 */
function updateAdrIndex(): void {
  if (!fs.existsSync(ADR_DIR)) {
    fs.mkdirSync(ADR_DIR, { recursive: true });
  }

  // Get all ADR files
  const files = fs.readdirSync(ADR_DIR);
  const adrFiles = files
    .filter((file) => /^ADR-\d{3}-.+\.md$/.test(file))
    .map((file) => path.join(ADR_DIR, file));

  // Extract metadata from each ADR
  const adrs = adrFiles
    .map((file) => extractAdrMetadata(file))
    .filter((adr): adr is ADRMetadata => adr !== null)
    .sort((a, b) => a.number - b.number);

  // Generate the index content
  let indexContent = "# Architecture Decision Records\n\n";

  indexContent += "## Overview\n\n";
  indexContent +=
    "This directory contains Architecture Decision Records (ADRs) for the Fluxori project. ";
  indexContent +=
    "Each ADR documents a significant architectural decision, including context, consequences, and dependency visualizations.\n\n";

  indexContent += "## Index\n\n";
  indexContent += "| Number | Title | Status | Date | Visualization |\n";
  indexContent += "|--------|-------|--------|------|--------------|\n";

  for (const adr of adrs) {
    const hasViz = adr.visualizations.length > 0;
    const vizLink = hasViz ? `[View](${adr.visualizations[0]})` : "N/A";

    indexContent += `| ${adr.number.toString().padStart(3, "0")} | [${adr.title}](${adr.filename}) | ${adr.status} | ${adr.date} | ${vizLink} |\n`;
  }

  indexContent += "\n## ADR Categories\n\n";
  indexContent += "### By Status\n\n";

  const statusGroups: Record<string, ADRMetadata[]> = {};
  for (const adr of adrs) {
    if (!statusGroups[adr.status]) {
      statusGroups[adr.status] = [];
    }
    statusGroups[adr.status].push(adr);
  }

  for (const [status, adrsInStatus] of Object.entries(statusGroups)) {
    indexContent += `#### ${status}\n\n`;
    for (const adr of adrsInStatus) {
      indexContent += `- [ADR-${adr.number.toString().padStart(3, "0")}: ${adr.title}](${adr.filename})\n`;
    }
    indexContent += "\n";
  }

  // Write the index file
  fs.writeFileSync(ADR_INDEX, indexContent);

  console.log(`Updated ADR index: ${ADR_INDEX}`);
}

/**
 * Update the status of an ADR
 */
function updateAdrStatus(adrNumber: number, newStatus: string): boolean {
  // Find the ADR file
  const files = fs.readdirSync(ADR_DIR);
  const adrFile = files.find((file) =>
    file.startsWith(`ADR-${adrNumber.toString().padStart(3, "0")}`),
  );

  if (!adrFile) {
    console.error(`Error: ADR-${adrNumber} not found.`);
    return false;
  }

  const adrPath = path.join(ADR_DIR, adrFile);
  let content = fs.readFileSync(adrPath, "utf-8");

  // Update the status
  content = content.replace(/(## Status\s+)([A-Za-z]+)/, `$1${newStatus}`);

  // Write the updated content
  fs.writeFileSync(adrPath, content);

  console.log(`Updated ADR-${adrNumber} status to ${newStatus}`);

  // Update the index
  updateAdrIndex();

  return true;
}

/**
 * Regenerate visualizations for all ADRs
 */
function regenerateVisualizations(): void {
  // Get all ADR files
  const files = fs.readdirSync(ADR_DIR);
  const adrFiles = files
    .filter((file) => /^ADR-\d{3}-.+\.md$/.test(file))
    .map((file) => path.join(ADR_DIR, file));

  // Extract metadata from each ADR
  const adrs = adrFiles
    .map((file) => extractAdrMetadata(file))
    .filter((adr): adr is ADRMetadata => adr !== null);

  for (const adr of adrs) {
    // Skip ADRs without visualizations
    if (adr.visualizations.length === 0) continue;

    // Extract module information from ADR content
    const content = fs.readFileSync(adr.path, "utf-8");
    const moduleMatches =
      content.match(/modules: ([a-zA-Z0-9-,\s]+)/) ||
      content.match(/modules: \[(.*?)\]/) ||
      content.match(
        /dependencies between the following modules: ([a-zA-Z0-9-,\s]+)/,
      );

    if (!moduleMatches) {
      console.warn(
        `Warning: Could not extract module information from ADR-${adr.number}`,
      );
      continue;
    }

    const moduleList = moduleMatches[1].split(",").map((m) => m.trim());

    try {
      // Regenerate the visualization
      generateAdrDependencyVisualization({
        title: adr.title,
        adrNumber: adr.number,
        focusModules: moduleList,
        outputFormat: "svg",
        highlightViolations: true,
      });

      console.log(`Regenerated visualization for ADR-${adr.number}`);
    } catch (error) {
      console.error(
        `Error regenerating visualization for ADR-${adr.number}:`,
        error,
      );
    }
  }

  // Update the index
  updateAdrIndex();
}

/**
 * Print usage instructions
 */
function printUsage(): void {
  console.log(`
  ADR Tools - Manage Architecture Decision Records with dependency visualizations.

  Usage:
    node adr-tools.js <command> [options]
    
  Commands:
    create        Create a new ADR
    update-index  Update the ADR index
    update-status Update the status of an ADR
    regen-viz     Regenerate visualizations for all ADRs
    help          Show this help message
    
  Options for 'create':
    --title="<title>"            Title of the ADR (required)
    --modules=<module1,module2>  Comma-separated list of modules to include in visualization
    --include-common=<true|false> Include common utilities in visualization (default: true)
    --status=<status>            Initial status (default: Proposed)
    
  Options for 'update-status':
    --adr=<number>               ADR number (required)
    --status=<status>            New status (required)
  `);
}

/**
 * Parse command line arguments
 */
function parseArgs(): { command: string; options: Record<string, any> } | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help") {
    printUsage();
    return null;
  }

  const command = args[0];
  const options: Record<string, any> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--title=")) {
      options.title = arg.substring(8);
    } else if (arg.startsWith("--modules=")) {
      options.modules = arg.substring(10).split(",");
    } else if (arg.startsWith("--include-common=")) {
      options.includeCommon = arg.substring(17) === "true";
    } else if (arg.startsWith("--status=")) {
      options.status = arg.substring(9);
    } else if (arg.startsWith("--adr=")) {
      options.adr = parseInt(arg.substring(6), 10);
    }
  }

  return { command, options };
}

/**
 * Main function
 */
function main(): void {
  const args = parseArgs();
  if (!args) return;

  const { command, options } = args;

  try {
    switch (command) {
      case "create":
        if (!options.title) {
          console.error("Error: Missing required option --title");
          printUsage();
          break;
        }
        createAdr(options);
        break;

      case "update-index":
        updateAdrIndex();
        break;

      case "update-status":
        if (!options.adr || !options.status) {
          console.error(
            "Error: Missing required options --adr and/or --status",
          );
          printUsage();
          break;
        }
        updateAdrStatus(options.adr, options.status);
        break;

      case "regen-viz":
        regenerateVisualizations();
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        printUsage();
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export { createAdr, updateAdrIndex, updateAdrStatus, regenerateVisualizations };
