/**
 * Fix Repository Query Filters
 *
 * This script fixes the common type errors with query filters by:
 * 1. Replacing direct filter objects with proper { filters: [] } format
 * 2. Fixing the filter operator type to use WhereFilterOp
 *
 * Run this after migrating repositories to the unified pattern.
 */

import * as fs from "fs";
import * as path from "path";
import * as util from "util";

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

const SRC_DIR = path.resolve(__dirname, "../../../");
const EXCLUDED_DIRS = ["node_modules", "dist", "migration-tools"];

interface FileChange {
  file: string;
  replaced: boolean;
  filterReplaceCount: number;
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
 * Fix query filter patterns in repository files
 */
async function fixQueryFilters(file: string): Promise<FileChange> {
  const content = await readFileAsync(file, "utf8");
  const result: FileChange = {
    file,
    replaced: false,
    filterReplaceCount: 0,
  };

  let newContent = content;

  // Fix 1: Replace this.findAll() with this.find() and add proper filters
  newContent = newContent.replace(
    /this\.findAll\s*\(\s*({[^}]*})\s*\)/g,
    (match, options) => {
      // Skip if it already has filters array
      if (options.includes("filters:")) {
        return match;
      }

      // Skip empty object
      if (options.trim() === "{}") {
        return match.replace("findAll", "find");
      }

      result.filterReplaceCount++;

      // Convert object properties to filter array
      const filterProperties = options
        .replace(/{\s*/, "")
        .replace(/\s*}/, "")
        .split(",")
        .map((prop: string) => prop.trim())
        .filter((prop: string) => prop.length > 0);

      if (filterProperties.length === 0) {
        return match.replace("findAll", "find");
      }

      const filtersArray = filterProperties
        .map((prop: string) => {
          const [key, value] = prop.split(":").map((p: string) => p.trim());
          return `{ field: '${key}', operator: '==', value: ${value} }`;
        })
        .join(",\n        ");

      return `this.find({\n      filters: [\n        ${filtersArray}\n      ]\n    })`;
    },
  );

  // Fix 2: Fix direct object property access in filter objects
  newContent = newContent.replace(
    /\{\s*([a-zA-Z0-9_]+)\s*:\s*([^,}]+)(?:,\s*([a-zA-Z0-9_]+)\s*:\s*([^,}]+))*\s*\}/g,
    (match) => {
      // Skip if it's already in filters format or doesn't look like a filter
      if (
        match.includes("filters:") ||
        match.includes("field:") ||
        match.includes("options:")
      ) {
        return match;
      }

      // Try to detect if this is likely a filter object
      if (
        match.includes("organizationId") ||
        match.includes("isActive") ||
        match.includes("type:")
      ) {
        result.filterReplaceCount++;

        // Extract key-value pairs
        const properties = match
          .replace(/[{}]/g, "")
          .split(",")
          .map((prop) => prop.trim())
          .filter((prop) => prop.length > 0);

        const filtersArray = properties
          .map((prop) => {
            const [key, value] = prop.split(":").map((p) => p.trim());
            return `{ field: '${key}', operator: '==', value: ${value} }`;
          })
          .join(",\n          ");

        return `{\n        filters: [\n          ${filtersArray}\n        ]\n      }`;
      }

      return match;
    },
  );

  // Fix 3: Ensure operator is properly formatted
  newContent = newContent.replace(
    /operator\s*:\s*['"]([^'"]+)['"]/g,
    (match, operator) => {
      const validOperators = [
        "==",
        "!=",
        ">",
        ">=",
        "<",
        "<=",
        "in",
        "array-contains",
        "array-contains-any",
        "not-in",
      ];

      if (validOperators.includes(operator)) {
        return match; // Already good
      }

      // Try to fix common typos
      const normalizedOp = operator.toLowerCase();
      for (const validOp of validOperators) {
        if (normalizedOp.includes(validOp) || validOp.includes(normalizedOp)) {
          result.filterReplaceCount++;
          return `operator: '${validOp}'`;
        }
      }

      return match;
    },
  );

  // Check if any changes were made
  if (content !== newContent) {
    await writeFileAsync(file, newContent, "utf8");
    result.replaced = true;
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log("Starting filter fix script...");

    const files = await walkDirectory(SRC_DIR);
    const changes: FileChange[] = [];

    for (const file of files) {
      const change = await fixQueryFilters(file);
      if (change.replaced) {
        changes.push(change);
        console.log(
          `Updated ${file} (${change.filterReplaceCount} filter patterns)`,
        );
      }
    }

    console.log("\nFix summary:");
    console.log(`Total repository files processed: ${files.length}`);
    console.log(`Files changed: ${changes.length}`);
    console.log(
      `Total filter patterns fixed: ${changes.reduce((sum, c) => sum + c.filterReplaceCount, 0)}`,
    );

    console.log("\nDone! Please review the changes and run tests.");
  } catch (error) {
    console.error("Error during fixes:", error);
  }
}

// Run the script
main();
