/**
 * Migrate Repositories Script
 *
 * This script automates the migration from UnifiedFirestoreRepository
 * to FirestoreBaseRepository across the codebase.
 *
 * Usage:
 * - node migrate-repositories.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

const SRC_DIR = path.resolve(__dirname, '../../../');
const EXCLUDED_DIRS = ['node_modules', 'dist', 'migration-tools'];

/**
 * File changes tracking
 */
class FileChange {
  constructor(file) {
    this.file = file;
    this.importsChanged = false;
    this.extendsChanged = false;
    this.changed = false;
  }
}

/**
 * Process all .ts files in the codebase
 */
async function walkDirectory(dir) {
  const files = [];

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
      entry.endsWith('.repository.ts') &&
      !entry.endsWith('.spec.ts')
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Fix repository imports and extends
 */
async function migrateRepository(file) {
  console.log(`Processing ${file}...`);
  const content = await readFileAsync(file, 'utf8');
  const fileChange = new FileChange(file);

  // Replace imports
  let newContent = content.replace(
    /import\s+{([^}]*)UnifiedFirestoreRepository([^}]*)}.*from\s+['"]([^'"]*)/g,
    (match, before, after, importPath) => {
      fileChange.importsChanged = true;

      // If it's directly importing from unified-firestore.repository
      if (importPath.includes('unified-firestore.repository')) {
        return `import {${before}FirestoreBaseRepository${after}} from 'src/common/repositories'`;
      }

      // Handle other import patterns
      return `import {${before.replace('UnifiedFirestoreRepository', 'FirestoreBaseRepository')}${after}} from ${importPath}`;
    },
  );

  // Replace extends
  newContent = newContent.replace(
    /extends\s+UnifiedFirestoreRepository<([^>]+)>/g,
    (match, type) => {
      fileChange.extendsChanged = true;
      return `extends FirestoreBaseRepository<${type}>`;
    },
  );

  // Only write if changes were made
  if (content !== newContent) {
    fileChange.changed = true;
    await writeFileAsync(file, newContent, 'utf8');
    console.log(`  Updated ${file}`);
  } else {
    console.log(`  No changes needed for ${file}`);
  }

  return fileChange;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting repository migration...');

    const files = await walkDirectory(SRC_DIR);
    console.log(`Found ${files.length} repository files to process`);

    const changes = [];

    for (const file of files) {
      const change = await migrateRepository(file);
      changes.push(change);
    }

    // Generate summary
    const changedFiles = changes.filter((c) => c.changed);
    const importsChanged = changes.filter((c) => c.importsChanged);
    const extendsChanged = changes.filter((c) => c.extendsChanged);

    console.log('\nMigration summary:');
    console.log(`Total repository files: ${files.length}`);
    console.log(`Files changed: ${changedFiles.length}`);
    console.log(`Import statements updated: ${importsChanged.length}`);
    console.log(`Class extensions updated: ${extendsChanged.length}`);

    if (changedFiles.length > 0) {
      console.log('\nFiles updated:');
      changedFiles.forEach((c) =>
        console.log(`- ${path.relative(SRC_DIR, c.file)}`),
      );
    }

    console.log('\nDone! Please review the changes and run tests.');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the script
main();
