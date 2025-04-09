/**
 * Script to automatically fix deprecated Mantine props
 * This script searches for deprecated Mantine props in component files and replaces them with the modern equivalents
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of deprecated props to their modern equivalents
const PROP_MAPPING = {
  'weight=': 'fw=',
  'align=': 'ta=',
  'spacing=': 'gap=',
  'position=': 'justify=',
  'leftIcon=': 'leftSection=',
  'rightIcon=': 'rightSection=',
  'color=': 'c='
};

// Target directories to scan
const DIRECTORIES = [
  'src/components',
  'src/app'
];

// Excluded directories (node_modules are excluded by default)
const EXCLUDED_DIRS = [
  '.next',
  '.storybook',
  'node_modules'
];

// File extensions to process
const EXTENSIONS = ['.tsx', '.jsx'];

// Function to get all files to process
function getFiles() {
  const files = [];
  
  DIRECTORIES.forEach(dir => {
    const pattern = path.join(process.cwd(), dir, '**', `*{${EXTENSIONS.join(',')}}`);
    const matches = glob.sync(pattern, {
      ignore: EXCLUDED_DIRS.map(d => `**/${d}/**`)
    });
    files.push(...matches);
  });
  
  return files;
}

// Function to check if a file contains any deprecated props
function fileContainsDeprecatedProps(content) {
  return Object.keys(PROP_MAPPING).some(prop => 
    content.includes(prop.replace('=', ''))
  );
}

// Function to fix deprecated props in a file
function fixDeprecatedProps(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Check if this file has any deprecated props
  if (!fileContainsDeprecatedProps(content)) {
    console.log(`  No deprecated props found, skipping`);
    return false;
  }
  
  // Replace each deprecated prop
  Object.entries(PROP_MAPPING).forEach(([oldProp, newProp]) => {
    const propName = oldProp.replace('=', '');
    const regexPattern = new RegExp(`${propName}\\s*=\\s*(?:{[^}]+}|"[^"]+"|'[^']+'|\\{[^}]+\\})`, 'g');
    
    const matches = content.match(regexPattern);
    if (matches && matches.length > 0) {
      console.log(`  Found ${matches.length} instances of ${propName}`);
      
      matches.forEach(match => {
        const newMatch = match.replace(propName, newProp.replace('=', ''));
        content = content.replace(match, newMatch);
      });
    }
  });
  
  // If content was modified, write it back to the file
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
function main() {
  console.log('Scanning for files with deprecated Mantine props...');
  const files = getFiles();
  console.log(`Found ${files.length} files to scan`);
  
  let updatedFiles = 0;
  
  files.forEach(file => {
    const updated = fixDeprecatedProps(file);
    if (updated) {
      updatedFiles++;
    }
  });
  
  console.log(`\nCompleted! Updated ${updatedFiles} files.`);
}

main();