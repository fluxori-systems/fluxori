/**
 * Component Dependency Update Script
 * 
 * This script updates UI components to use the dependency inversion pattern
 * by replacing direct imports from Motion module with imports from Shared module.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to replace
const PATTERNS = [
  {
    // Replace direct imports from motion/hooks/useConnectionQuality
    find: /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/\.\.\/motion\/hooks\/useConnectionQuality['"]/g,
    replace: "import { $1 } from '../hooks/useConnection'"
  },
  {
    // Replace direct imports from motion/hooks/useServices
    find: /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/\.\.\/motion\/hooks\/useServices['"]/g,
    replace: "import { $1 } from '../hooks/useConnection'"
  },
  {
    // Replace direct imports from motion/context/MotionContext
    find: /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/\.\.\/motion\/context\/MotionContext['"]/g,
    replace: "import { $1 } from '../../shared/providers/service-provider'"
  },
  {
    // Replace direct imports from motion/hooks/useReducedMotion
    find: /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/\.\.\/motion\/hooks\/useReducedMotion['"]/g,
    replace: "import { $1 } from '../hooks/useConnection'"
  },
  {
    // Replace direct imports from motion/components
    find: /import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/\.\.\/motion\/components\/([^'"]+)['"]/g,
    replace: "import { $1 } from '../../shared/components/$2'"
  },
  {
    // Add South African market optimizations import if it contains saSensitive prop
    find: /(saSensitive\s*[=:][^,\n;]+)/g,
    checkOnly: true,
    addImport: "import { useSouthAfricanMarketOptimizations } from '../../shared/hooks/useSouthAfricanMarketOptimizations';"
  },
];

// Directories to search
const COMPONENT_DIRS = [
  path.resolve(__dirname, '../src/lib/ui/components')
];

// Process a file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  // Read file
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let importsToAdd = new Set();
  
  // Apply patterns
  PATTERNS.forEach(pattern => {
    if (pattern.checkOnly) {
      // This pattern is just to check for conditions to add imports
      if (pattern.find.test(content)) {
        importsToAdd.add(pattern.addImport);
      }
    } else {
      // This pattern actually replaces content
      const newContent = content.replace(pattern.find, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });
  
  // Add any new imports at the top of the file, after the existing imports
  if (importsToAdd.size > 0) {
    const importRegex = /^import.*?;[\r\n]*/gm;
    let lastImportIndex = 0;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    if (lastImportIndex > 0) {
      const importsText = Array.from(importsToAdd).join('\n');
      content = 
        content.substring(0, lastImportIndex) + 
        '\n' + importsText + '\n' + 
        content.substring(lastImportIndex);
      modified = true;
    }
  }
  
  // Write file if changed
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    return 1;
  }
  
  console.log(`No changes needed for ${filePath}`);
  return 0;
}

// Main function
function main() {
  let totalFiles = 0;
  let updatedFiles = 0;
  
  // Process each component directory
  COMPONENT_DIRS.forEach(dir => {
    // Find all TypeScript and TSX files
    const files = glob.sync(path.join(dir, '**/*.{ts,tsx}'));
    totalFiles += files.length;
    
    // Process each file
    files.forEach(file => {
      updatedFiles += processFile(file);
    });
  });
  
  console.log(`\nSummary: Updated ${updatedFiles} of ${totalFiles} files`);
}

// Run the script
main();