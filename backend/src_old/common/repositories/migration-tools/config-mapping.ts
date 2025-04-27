/**
 * Repository Configuration Mapping Utility
 *
 * This script extracts repository configuration from existing repositories
 * to help with migration to the unified pattern.
 */

import * as fs from "fs";
import * as path from "path";
import * as util from "util";

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

const SRC_DIR = path.resolve(__dirname, "../../../");
const OUTPUT_FILE = path.resolve(__dirname, "repository-configs.json");
const EXCLUDED_DIRS = ["node_modules", "dist", "migration-tools"];

interface RepositoryConfig {
  path: string;
  className: string;
  collectionName: string;
  configOptions: Record<string, any>;
}

/**
 * Walk through directory recursively
 */
async function walkDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  if (EXCLUDED_DIRS.includes(path.basename(dir))) {
    return files;
  }

  const entries = await readdirAsync(dir);

  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    const stat = await statAsync(entryPath);

    if (stat.isDirectory()) {
      const subDirFiles = await walkDirectory(entryPath);
      files.push(...subDirFiles);
    } else if (entry.endsWith(".repository.ts")) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Extract repository configuration
 */
async function extractRepositoryConfig(
  file: string,
): Promise<RepositoryConfig | null> {
  const content = await readFileAsync(file, "utf8");

  // Check if it's a FirestoreBaseRepository
  if (!content.includes("FirestoreBaseRepository")) {
    return null;
  }

  // Extract class name
  const classNameMatch = content.match(
    /export\s+class\s+(\w+)\s+extends\s+FirestoreBaseRepository/,
  );
  if (!classNameMatch) {
    return null;
  }

  // Extract collection name
  const collectionNameMatch = content.match(
    /protected\s+readonly\s+collectionName\s*=\s*['"]([^'"]+)['"]/,
  );
  if (!collectionNameMatch) {
    return null;
  }

  // Extract constructor options
  const optionsMatch = content.match(/super\(.*?,\s*(\{[^}]+\})\s*\)/s);
  let configOptions: Record<string, any> = {};

  if (optionsMatch) {
    try {
      // Convert the options string to valid JSON
      const optionsStr = optionsMatch[1]
        .replace(/(\w+):/g, '"$1":') // Add quotes to keys
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,\s*\}/g, "}"); // Remove trailing commas

      configOptions = JSON.parse(optionsStr);
    } catch (error) {
      console.warn(`Could not parse options for ${file}: ${error}`);
    }
  }

  return {
    path: file,
    className: classNameMatch[1],
    collectionName: collectionNameMatch[1],
    configOptions,
  };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log("Extracting repository configurations...");

    const files = await walkDirectory(SRC_DIR);
    const configs: RepositoryConfig[] = [];

    for (const file of files) {
      const config = await extractRepositoryConfig(file);
      if (config) {
        configs.push(config);
        console.log(`Extracted config from ${file}`);
      }
    }

    // Save configurations to a file
    await writeFileAsync(OUTPUT_FILE, JSON.stringify(configs, null, 2));

    console.log(`\nExtracted ${configs.length} repository configurations.`);
    console.log(`Results saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error during extraction:", error);
  }
}

// Run the script
main();
