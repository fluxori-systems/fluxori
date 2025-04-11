/**
 * Simple test migration script - no TypeScript, just plain JavaScript
 * This helps us test the migration process with minimal dependencies
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const BACKEND_DIR = "/home/tarquin_stapa/fluxori/backend";
const SRC_DIR = path.join(BACKEND_DIR, "src");
const SOURCE_PATTERN = "FirestoreBaseRepository";
const TARGET_PATTERN = "UnifiedFirestoreRepository";
const EXAMPLE_REPOS = [
  "src/modules/agent-framework/repositories/model-registry.repository.ts",
  "src/modules/agent-framework/repositories/agent-conversation.repository.ts",
  "src/modules/agent-framework/repositories/agent-config.repository.ts",
  "src/modules/inventory/repositories/warehouse.repository.ts",
  "src/modules/rag-retrieval/repositories/embedding-provider.repository.ts"
];

/**
 * Run a shell command and return the output
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: BACKEND_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(stderr);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Read a file
 */
function readFile(filePath) {
  return fs.readFileSync(path.join(BACKEND_DIR, filePath), 'utf8');
}

/**
 * Write a file
 */
function writeFile(filePath, content) {
  fs.writeFileSync(path.join(BACKEND_DIR, filePath), content, 'utf8');
}

/**
 * Update imports in a file
 */
function updateImports(filePath) {
  console.log(`Processing ${filePath}`);
  let content = readFile(filePath);
  
  // Replace class inheritance
  content = content.replace(
    new RegExp(SOURCE_PATTERN, 'g'), 
    TARGET_PATTERN
  );
  
  // Calculate relative path to unified repository
  const fileDir = path.dirname(filePath);
  const relPath = path.relative(
    fileDir,
    "src/common/repositories"
  ).replace(/\\/g, '/');
  
  // Replace import statement
  content = content.replace(
    /import\s+\{\s*([^}]*FirestoreBaseRepository[^}]*)\s*\}\s*from\s*['"]([^'"]*)['"]/,
    (match, importNames, importPath) => {
      const newImportNames = importNames.replace(
        /FirestoreBaseRepository/,
        "UnifiedFirestoreRepository"
      );
      return `import { ${newImportNames} } from '${relPath}/unified-firestore.repository'`;
    }
  );
  
  // Convert constructor and collection name
  content = content.replace(
    /protected\s+readonly\s+collectionName\s*=\s*['"]([^'"]+)['"]/,
    (match, collectionName) => {
      // Comment out the line, we'll move it to the constructor
      return `// collectionName moved to constructor: '${collectionName}'`;
    }
  );
  
  content = content.replace(
    /(constructor\s*\([^)]*\)\s*\{[^{}]*)(super\s*\(\s*[^)]*\)\s*;)/,
    (match, constructorStart, superCall) => {
      // Extract the collection name from the comment we added above
      const collectionNameMatch = content.match(/\/\/ collectionName moved to constructor: '([^']+)'/);
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
    }
  );
  
  // Save the file
  writeFile(filePath, content);
  console.log(`Updated ${filePath}`);
  
  return content;
}

/**
 * Fix query filters in a file
 */
function fixQueryFilters(filePath, content) {
  // Replace direct filter objects with filters array
  content = content.replace(
    /this\.findAll\(\s*\{([^{}]*)\}\s*\)/g,
    (match, options) => {
      // Skip if it already has filters array
      if (options.includes('filters:')) {
        return match.replace('findAll', 'find');
      }
      
      // Skip empty object
      if (options.trim() === '') {
        return match.replace('findAll', 'find');
      }
      
      // Convert object properties to filter array
      const filterProperties = options
        .split(',')
        .map(prop => prop.trim())
        .filter(prop => prop.length > 0);
      
      if (filterProperties.length === 0) {
        return match.replace('findAll', 'find');
      }
      
      const filtersArray = filterProperties
        .map(prop => {
          const [key, value] = prop.split(':').map(p => p.trim());
          return `{ field: '${key}', operator: '==', value: ${value} }`;
        })
        .join(',\n        ');
      
      return `this.find({\n      filters: [\n        ${filtersArray}\n      ]\n    })`;
    }
  );
  
  // Save the file
  writeFile(filePath, content);
  console.log(`Fixed query filters in ${filePath}`);
  
  return content;
}

/**
 * Fix transaction methods in a file
 */
function fixTransactionMethods(filePath, content) {
  // Replace withTransaction with runTransaction
  content = content.replace(
    /withTransaction\(/g,
    'runTransaction('
  );
  
  // Replace transaction context usage
  content = content.replace(
    /(const|let)\s+(\w+)\s*=\s*await\s+transaction\.get\(/g,
    (match, declType, varName) => {
      return `${declType} ${varName} = await context.get(`;
    }
  );
  
  // Save the file
  writeFile(filePath, content);
  console.log(`Fixed transaction methods in ${filePath}`);
  
  return content;
}

/**
 * Main function
 */
async function main() {
  console.log("Starting simple migration test...");
  
  // Process each example repository
  for (const repoPath of EXAMPLE_REPOS) {
    try {
      let content = updateImports(repoPath);
      content = fixQueryFilters(repoPath, content);
      content = fixTransactionMethods(repoPath, content);
    } catch (err) {
      console.error(`Error processing ${repoPath}:`, err);
    }
  }
  
  console.log("\nMigration test complete!");
}

// Run the script
main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});