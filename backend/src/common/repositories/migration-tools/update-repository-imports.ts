/**
 * Repository Migration Script
 *
 * This script automates the migration from the modular repository design
 * to the unified repository design. It updates imports and constructors.
 *
 * Usage:
 * - Compile this script with tsc
 * - Run with Node.js: node update-repository-imports.js
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

const SRC_DIR = path.resolve(__dirname, '../../../');
const EXCLUDED_DIRS = ['node_modules', 'dist', 'migration-tools'];

interface FileChange {
  file: string;
  replaced: boolean;
  importsChanged: boolean;
  constructorChanged: boolean;
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
      entry.endsWith('.ts') &&
      !entry.endsWith('.d.ts') &&
      !entry.endsWith('.spec.ts')
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Replace repository imports and constructors
 */
async function replaceRepositoryCode(file: string): Promise<FileChange> {
  const content = await readFileAsync(file, 'utf8');
  const result: FileChange = {
    file,
    replaced: false,
    importsChanged: false,
    constructorChanged: false,
  };

  // Replace imports
  let newContent = content.replace(
    /import\s+{([^}]*)FirestoreBaseRepository([^}]*)}.*from\s+['"]([^'"]*\/common\/repositories\/firestore-base\.repository)['"]/g,
    (match, before, after, path) => {
      result.importsChanged = true;
      return `import {${before}UnifiedFirestoreRepository${after}} from '${path.replace('firestore-base.repository', 'unified-firestore.repository')}'`;
    },
  );

  // Replace extends
  newContent = newContent.replace(
    /extends\s+FirestoreBaseRepository<([^>]+)>/g,
    (match, type) => {
      result.importsChanged = true;
      return `extends UnifiedFirestoreRepository<${type}>`;
    },
  );

  // Replace constructors - more complex pattern
  newContent = newContent.replace(
    /protected readonly collectionName\s*=\s*['"]([^'"]+)['"]/g,
    (match, collectionName) => {
      result.constructorChanged = true;
      // Just remove this line as we'll put it in the constructor
      return `// collectionName moved to constructor: '${collectionName}'`;
    },
  );

  // Replace constructor calls
  newContent = newContent.replace(
    /(constructor\s*\([^)]*\)\s*{[^{}]*)(super\s*\(\s*[^)]*\)\s*;)/g,
    (match, constructorStart, superCall) => {
      // Extract the collection name from the comment we added above
      const collectionNameMatch = newContent.match(
        /\/\/ collectionName moved to constructor: '([^']+)'/,
      );
      if (collectionNameMatch) {
        result.constructorChanged = true;

        // Extract the parameters from the super call
        const paramsMatch = superCall.match(/super\s*\(\s*([^)]*)\)/);
        if (paramsMatch) {
          const params = paramsMatch[1];
          return `${constructorStart}super(${params}, '${collectionNameMatch[1]}');`;
        }
      }
      return match;
    },
  );

  // Check if any changes were made
  if (content !== newContent) {
    await writeFileAsync(file, newContent, 'utf8');
    result.replaced = true;
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting repository migration...');

    const files = await walkDirectory(SRC_DIR);
    const changes: FileChange[] = [];

    for (const file of files) {
      const change = await replaceRepositoryCode(file);
      if (change.replaced) {
        changes.push(change);
        console.log(`Updated ${file}`);
      }
    }

    console.log('\nMigration summary:');
    console.log(`Total files processed: ${files.length}`);
    console.log(`Files changed: ${changes.length}`);
    console.log(
      `Import changes: ${changes.filter((c) => c.importsChanged).length}`,
    );
    console.log(
      `Constructor changes: ${changes.filter((c) => c.constructorChanged).length}`,
    );

    console.log('\nDone! Please review the changes and run tests.');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the script
main();
