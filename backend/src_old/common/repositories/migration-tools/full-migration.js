/**
 * Full Repository Migration Script
 * This script migrates all repositories in the codebase to use the unified repository pattern
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");

// Convert exec to Promise-based
const execAsync = util.promisify(exec);

// Configuration
const BACKEND_DIR = "/home/tarquin_stapa/fluxori/backend";
const SRC_DIR = path.join(BACKEND_DIR, "src");
const SOURCE_PATTERN = "FirestoreBaseRepository";
const TARGET_PATTERN = "UnifiedFirestoreRepository";
const EXCLUDED_PATTERNS = [
  "unified-firestore.repository.ts",
  "firestore-base.repository.ts",
  "migration-tools",
];

// Already migrated repositories - skip these
const ALREADY_MIGRATED = [
  "src/modules/agent-framework/repositories/model-registry.repository.ts",
  "src/modules/agent-framework/repositories/agent-conversation.repository.ts",
  "src/modules/agent-framework/repositories/agent-config.repository.ts",
  "src/modules/inventory/repositories/warehouse.repository.ts",
  "src/modules/rag-retrieval/repositories/embedding-provider.repository.ts",
];

/**
 * Run a shell command and return the output
 */
async function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: BACKEND_DIR });
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

/**
 * Find all repository files in the codebase
 */
async function findRepositoryFiles() {
  const findCommand = `find ${SRC_DIR} -name "*.repository.ts"`;
  const output = await runCommand(findCommand);

  // Split into lines and filter out excluded patterns and already migrated files
  const files = output.split("\n").filter((file) => {
    const relativePath = path.relative(BACKEND_DIR, file);

    // Skip if it's in the exclusion list
    if (EXCLUDED_PATTERNS.some((pattern) => file.includes(pattern))) {
      return false;
    }

    // Skip if it's already migrated
    if (ALREADY_MIGRATED.includes(relativePath)) {
      return false;
    }

    return true;
  });

  return files;
}

/**
 * Read a file
 */
function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Write a file
 */
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Update imports in a file
 */
function updateImports(filePath) {
  console.log(`Processing ${filePath}`);
  let content = readFile(filePath);

  // Skip if it doesn't contain FirestoreBaseRepository
  if (!content.includes(SOURCE_PATTERN)) {
    console.log(`  Skipping: File doesn't use ${SOURCE_PATTERN}`);
    return null;
  }

  // Replace class inheritance
  content = content.replace(new RegExp(SOURCE_PATTERN, "g"), TARGET_PATTERN);

  // Calculate relative path to unified repository
  const fileDir = path.dirname(filePath);
  const relPath = path
    .relative(fileDir, path.join(BACKEND_DIR, "src/common/repositories"))
    .replace(/\\/g, "/");

  // Replace import statement
  content = content.replace(
    /import\s+\{\s*([^}]*FirestoreBaseRepository[^}]*)\s*\}\s*from\s*['"]([^'"]*)['"]/,
    (match, importNames, importPath) => {
      const newImportNames = importNames.replace(
        /FirestoreBaseRepository/,
        "UnifiedFirestoreRepository",
      );
      return `import { ${newImportNames} } from '${relPath}/unified-firestore.repository'`;
    },
  );

  // Add QueryFilter import if filtering is used
  if (content.includes("filters: [") && !content.includes("QueryFilter")) {
    content = content.replace(
      /import\s+\{([^}]*)\}\s+from\s+['"]([^'"]*types[^'"]*)['"]/,
      (match, imports, importPath) => {
        if (importPath.includes("google-cloud.types")) {
          if (!imports.includes("QueryFilter")) {
            return `import { ${imports}, QueryFilter } from '${importPath}'`;
          }
        }
        return match;
      },
    );

    // If no existing types import, add one
    if (!content.includes("QueryFilter")) {
      const typeImportPath = content.match(
        /from\s+['"]([^'"]*config\/firestore\.config)['"]/,
      );
      if (typeImportPath) {
        const basePath = typeImportPath[1].replace(
          /config\/firestore\.config/,
          "",
        );
        content = content.replace(
          /import.*firestore\.config['"];/,
          (match) =>
            `${match}\nimport { QueryFilter } from '${basePath}types/google-cloud.types';`,
        );
      }
    }
  }

  // Convert constructor and collection name
  content = content.replace(
    /protected\s+readonly\s+collectionName\s*=\s*['"]([^'"]+)['"]/,
    (match, collectionName) => {
      // Comment out the line, we'll move it to the constructor
      return `// collectionName moved to constructor: '${collectionName}'`;
    },
  );

  content = content.replace(
    /(constructor\s*\([^)]*\)\s*\{[^{}]*)(super\s*\(\s*[^)]*\)\s*;)/,
    (match, constructorStart, superCall) => {
      // Extract the collection name from the comment we added above
      const collectionNameMatch = content.match(
        /\/\/ collectionName moved to constructor: '([^']+)'/,
      );
      if (collectionNameMatch) {
        // Extract the parameters from the super call
        const paramsMatch = superCall.match(/super\s*\(\s*([^)]*)\)/);
        if (paramsMatch) {
          const params = paramsMatch[1].trim();
          if (params.includes("{")) {
            // Has options object
            return `${constructorStart}super(${params.replace(/\{/, `'${collectionNameMatch[1]}', {`)});`;
          } else {
            return `${constructorStart}super(${params}, '${collectionNameMatch[1]}');`;
          }
        }
      }
      return match;
    },
  );

  // Save the file
  writeFile(filePath, content);
  console.log(`  Updated imports and constructor in ${filePath}`);

  return content;
}

/**
 * Fix query filters in a file
 */
function fixQueryFilters(filePath, content) {
  if (!content) {
    content = readFile(filePath);
  }

  // Replace findAll({ key: value }) with find({ filters: [{ field: 'key', operator: '==', value: value }] })
  content = content.replace(
    /this\.findAll\(\s*\{([^{}]*)\}\s*\)/g,
    (match, options) => {
      // Skip if it already has filters array
      if (options.includes("filters:")) {
        return match.replace("findAll", "find");
      }

      // Skip empty object
      if (options.trim() === "") {
        return match.replace("findAll", "find");
      }

      // Convert object properties to filter array
      const filterProperties = options
        .split(",")
        .map((prop) => prop.trim())
        .filter((prop) => prop.length > 0);

      if (filterProperties.length === 0) {
        return match.replace("findAll", "find");
      }

      const filtersArray = filterProperties
        .map((prop) => {
          const [key, value] = prop.split(":").map((p) => p.trim());
          return `{ field: '${key}', operator: '==', value: ${value} }`;
        })
        .join(",\n        ");

      return `this.find({\n      filters: [\n        ${filtersArray}\n      ]\n    })`;
    },
  );

  // Add type annotation to filter arrays
  content = content.replace(
    /const\s+filters\s*=\s*\[/g,
    "const filters: QueryFilter[] = [",
  );

  // Save the file
  writeFile(filePath, content);
  console.log(`  Fixed query filters in ${filePath}`);

  return content;
}

/**
 * Fix transaction methods in a file
 */
function fixTransactionMethods(filePath, content) {
  if (!content) {
    content = readFile(filePath);
  }

  // Replace withTransaction with runTransaction
  content = content.replace(/withTransaction\(/g, "runTransaction(");

  // Replace transaction context usage
  content = content.replace(
    /(const|let)\s+(\w+)\s*=\s*await\s+transaction\.get\(/g,
    (match, declType, varName) => {
      return `${declType} ${varName} = await context.get(`;
    },
  );

  // Replace transaction.update(docRef, ...) with context.update(docRef.id, ...)
  content = content.replace(
    /transaction\.update\(\s*(\w+Ref|\w+\.doc\(['"][^)]*['"]\)),/g,
    (match, docRef) => {
      if (docRef.includes(".doc(")) {
        // If it's a direct doc() call, extract the ID
        const idMatch = docRef.match(/\.doc\(['"]([^)]*)['"]\)/);
        if (idMatch) {
          return `context.update('${idMatch[1]}',`;
        }
      }
      return `context.update(${docRef}.id,`;
    },
  );

  // Replace transaction.delete
  content = content.replace(
    /transaction\.delete\(\s*(\w+Ref|\w+\.doc\(['"][^)]*['"]\))\s*\)/g,
    (match, docRef) => {
      if (docRef.includes(".doc(")) {
        // If it's a direct doc() call, extract the ID
        const idMatch = docRef.match(/\.doc\(['"]([^)]*)['"]\)/);
        if (idMatch) {
          return `context.delete('${idMatch[1]}')`;
        }
      }
      return `context.delete(${docRef}.id)`;
    },
  );

  // Save the file
  writeFile(filePath, content);
  console.log(`  Fixed transaction methods in ${filePath}`);

  return content;
}

/**
 * Main function
 */
async function main() {
  console.log("Starting full migration...");

  try {
    // Find all repository files
    const files = await findRepositoryFiles();
    console.log(`Found ${files.length} repository files to migrate:`);
    files.forEach((file) => console.log(`  ${file}`));

    // Process each repository
    let migratedCount = 0;

    for (const filePath of files) {
      try {
        console.log(`\nMigrating ${filePath}...`);
        let content = updateImports(filePath);

        if (content) {
          content = fixQueryFilters(filePath, content);
          content = fixTransactionMethods(filePath, content);
          migratedCount++;
        }
      } catch (err) {
        console.error(`Error migrating ${filePath}:`, err);
      }
    }

    console.log(
      `\nMigration complete! Successfully migrated ${migratedCount} repositories.`,
    );
    console.log(
      "Please review the changes and run TypeScript compilation to verify.",
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

// Run the script
main();
