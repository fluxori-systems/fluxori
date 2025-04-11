/**
 * Update import statements across the codebase
 * This script updates import paths for the unified repository
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Root directory for the backend
const rootDir = '/home/tarquin_stapa/fluxori/backend';

// Find all repository files that import from firestore-base.repository
const findFiles = () => {
  try {
    const command = `grep -l "firestore-base.repository" ${rootDir}/src/modules/**/repositories/*.ts`;
    const output = execSync(command).toString();
    return output.split('\n').filter(file => file.trim() !== '');
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
};

// Update import statements in a file
const updateImports = (filePath) => {
  console.log(`Updating imports in ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import path
    content = content.replace(
      /import\s+{([^}]*)}\s+from\s+['"](.+?)firestore-base\.repository['"]/g,
      'import {$1} from \'$2unified-firestore.repository\''
    );
    
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated imports in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  Error updating ${filePath}:`, error.message);
    return false;
  }
};

// Main function
const main = () => {
  console.log('Starting import updates...');
  
  const files = findFiles();
  console.log(`Found ${files.length} files to update`);
  
  let updateCount = 0;
  
  for (const file of files) {
    if (updateImports(file)) {
      updateCount++;
    }
  }
  
  console.log(`\nUpdated imports in ${updateCount} files`);
};

// Run the script
main();