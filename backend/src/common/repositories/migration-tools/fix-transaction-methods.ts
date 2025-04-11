/**
 * Fix Transaction Method Names
 *
 * This script replaces withTransaction with runTransaction method calls
 * in repositories and services, and fixes transaction context usage.
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
  withTransactionCount: number;
  transactionContextCount: number;
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
    } else if (
      entry.endsWith(".ts") &&
      !entry.includes("unified-firestore.repository.ts")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Fix transaction method names and context usage
 */
async function fixTransactionMethods(file: string): Promise<FileChange> {
  const content = await readFileAsync(file, "utf8");
  const result: FileChange = {
    file,
    replaced: false,
    withTransactionCount: 0,
    transactionContextCount: 0,
  };

  let newContent = content;

  // Replace withTransaction with runTransaction
  newContent = newContent.replace(/withTransaction\(/g, (match) => {
    result.withTransactionCount++;
    return "runTransaction(";
  });

  // Replace property references (avoid transactions. prefix)
  newContent = newContent.replace(/\.transactions\./g, ".");

  // Fix transaction context usage - this handles the common pattern of passing a transaction
  // directly to docRef.get() and similar operations
  newContent = newContent.replace(
    /(const|let)\s+(\w+)\s*=\s*await\s+transaction\.get\(/g,
    (match, declType, varName) => {
      result.transactionContextCount++;
      return `${declType} ${varName} = await context.get(`;
    },
  );

  newContent = newContent.replace(
    /transaction\.update\(\s*([^,)]+),/g,
    (match, docRefOrId) => {
      // Only replace if it looks like we're passing a document reference directly
      if (docRefOrId.includes("docRef") || docRefOrId.includes("getDoc")) {
        result.transactionContextCount++;
        // Look for the ID in the reference
        const idMatch = docRefOrId.match(/\('([^']+)'\)/);
        if (idMatch) {
          return `context.update(${idMatch[1]},`;
        }

        return `context.update(${docRefOrId}.id,`;
      }

      return match;
    },
  );

  newContent = newContent.replace(
    /transaction\.create\(\s*([^,)]+),/g,
    (match, docRefOrId) => {
      // Only replace if it looks like we're not using context already
      if (!match.includes("context.create")) {
        result.transactionContextCount++;

        // Handle both document references and direct IDs
        if (docRefOrId.includes("doc(")) {
          return `context.create(`;
        }

        return match;
      }

      return match;
    },
  );

  newContent = newContent.replace(
    /transaction\.delete\(\s*([^,)]+)\s*\)/g,
    (match, docRefOrId) => {
      // Only replace if it looks like we're passing a document reference directly
      if (docRefOrId.includes("docRef") || docRefOrId.includes("getDoc")) {
        result.transactionContextCount++;
        // Look for the ID in the reference
        const idMatch = docRefOrId.match(/\('([^']+)'\)/);
        if (idMatch) {
          return `context.delete(${idMatch[1]})`;
        }

        return `context.delete(${docRefOrId}.id)`;
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
    console.log("Starting transaction method fix script...");

    const files = await walkDirectory(SRC_DIR);
    const changes: FileChange[] = [];

    for (const file of files) {
      const change = await fixTransactionMethods(file);
      if (change.replaced) {
        changes.push(change);
        console.log(
          `Updated ${file} (${change.withTransactionCount} transaction calls, ${change.transactionContextCount} context fixes)`,
        );
      }
    }

    console.log("\nFix summary:");
    console.log(`Total files processed: ${files.length}`);
    console.log(`Files changed: ${changes.length}`);
    console.log(
      `Total transaction calls fixed: ${changes.reduce((sum, c) => sum + c.withTransactionCount, 0)}`,
    );
    console.log(
      `Total transaction context usages fixed: ${changes.reduce((sum, c) => sum + c.transactionContextCount, 0)}`,
    );

    console.log("\nDone! Please review the changes and run tests.");
  } catch (error) {
    console.error("Error during fixes:", error);
  }
}

// Run the script
main();
