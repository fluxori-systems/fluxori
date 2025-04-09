#!/usr/bin/env node

/**
 * Fix Mantine Props Script
 * 
 * This script finds and fixes deprecated Mantine props in React components.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const SRC_DIR = path.join(FRONTEND_DIR, 'src');

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

// Components that might use these props
const COMPONENTS = [
  'Text',
  'Title',
  'Stack',
  'Group',
  'Button',
  'Menu.Item',
  'Tabs.Tab',
  'SimpleGrid',
  'Grid',
  'Box',
  'Container',
  'Paper'
];

/**
 * Run a command and return its output
 */
function runCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { encoding: 'utf8', cwd }).toString();
  } catch (error) {
    return error.stdout ? error.stdout.toString() : '';
  }
}

/**
 * Find files with deprecated props
 */
function findFilesWithDeprecatedProps() {
  console.log('Finding files with deprecated Mantine props...');
  
  const filesByProp = {};
  
  // Search for each deprecated prop in each component
  for (const component of COMPONENTS) {
    for (const [deprecatedProp, modernProp] of Object.entries(PROP_MAPPING)) {
      const pattern = `<${component}[^>]*${deprecatedProp}`;
      
      try {
        const grepOutput = runCommand(`grep -r "${pattern}" --include="*.tsx" .`, SRC_DIR);
        
        if (grepOutput) {
          const fileMatches = grepOutput.split('\n').filter(Boolean);
          
          for (const match of fileMatches) {
            const [filePath] = match.split(':');
            const absolutePath = path.join(SRC_DIR, filePath);
            
            if (!filesByProp[absolutePath]) {
              filesByProp[absolutePath] = new Set();
            }
            
            filesByProp[absolutePath].add({
              component,
              deprecatedProp,
              modernProp
            });
          }
        }
      } catch (error) {
        // Grep returns non-zero exit code when no matches are found
      }
    }
  }
  
  return filesByProp;
}

/**
 * Fix deprecated props in a file
 */
function fixFile(filePath, deprecatedProps) {
  console.log(`\nFixing ${path.relative(FRONTEND_DIR, filePath)}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Sort props by component to group log messages
  const propsByComponent = {};
  for (const prop of deprecatedProps) {
    if (!propsByComponent[prop.component]) {
      propsByComponent[prop.component] = [];
    }
    propsByComponent[prop.component].push(prop);
  }
  
  // Log what we're fixing
  for (const [component, props] of Object.entries(propsByComponent)) {
    console.log(`  ${component}:`);
    for (const prop of props) {
      console.log(`    ${prop.deprecatedProp} → ${prop.modernProp}`);
    }
  }
  
  // Replace all deprecated props
  for (const prop of deprecatedProps) {
    const regex = new RegExp(`<(${prop.component}[^>]*)${prop.deprecatedProp}`, 'g');
    content = content.replace(regex, (match, p1) => {
      return `<${p1}${prop.modernProp}`;
    });
  }
  
  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Fixed!`);
    return true;
  } else {
    console.log(`  ⚠️ No changes made (possible false positive)`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('Fixing deprecated Mantine props...\n');
  
  const filesByProp = findFilesWithDeprecatedProps();
  const filePaths = Object.keys(filesByProp);
  
  if (filePaths.length === 0) {
    console.log('No files with deprecated props found!');
    return;
  }
  
  console.log(`Found ${filePaths.length} files with deprecated props.`);
  
  let fixedCount = 0;
  
  for (const filePath of filePaths) {
    const deprecatedProps = Array.from(filesByProp[filePath]);
    const fixed = fixFile(filePath, deprecatedProps);
    
    if (fixed) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} of ${filePaths.length} files!`);
  
  if (fixedCount > 0) {
    console.log(`\nRun TypeScript checks to verify there are no errors:`);
    console.log(`  cd ${FRONTEND_DIR} && npm run typecheck`);
  }
}

// Run the script
main();