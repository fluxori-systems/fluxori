#!/usr/bin/env node

/**
 * This script updates component imports across the codebase
 * to use our custom UI components instead of directly importing from Mantine.
 * 
 * Usage:
 * node scripts/fix-component-imports.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Components that need to be imported from our custom UI library
const COMPONENTS_TO_REPLACE = [
  'Button',
  'Text',
  'Stack',
  'Group',
  'Grid',
  'SimpleGrid',
  'Tabs',
  'Menu',
];

// Find all TypeScript and TSX files in the src directory
const srcDir = path.resolve(__dirname, '../src');
const files = glob.sync(`${srcDir}/**/*.{ts,tsx}`, {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/components/ui/**']
});

let updatedFiles = 0;

// Process each file
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Check if the file imports from @mantine/core
  if (content.includes('@mantine/core')) {
    // Extract the import statement
    const mantineImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@mantine\/core['"]/g;
    let match;
    
    while ((match = mantineImportRegex.exec(content)) !== null) {
      const importComponents = match[1].split(',').map(c => c.trim());
      const componentsToExtract = [];
      const remainingComponents = [];
      
      // Separate components that need to be extracted
      importComponents.forEach(comp => {
        const compName = comp.trim().split(' as ')[0].trim();
        if (COMPONENTS_TO_REPLACE.includes(compName)) {
          componentsToExtract.push(comp);
        } else {
          remainingComponents.push(comp);
        }
      });
      
      // If we have components to extract
      if (componentsToExtract.length > 0) {
        // Build the new import statements
        let newContent = content;
        
        // Replace the original import
        const originalImport = match[0];
        let newMantineImport = '';
        
        if (remainingComponents.length > 0) {
          newMantineImport = `import { ${remainingComponents.join(', ')} } from '@mantine/core'`;
        }
        
        const uiImport = `import { ${componentsToExtract.join(', ')} } from '@/components/ui'`;
        
        // Check if we already have a UI import
        if (content.includes("from '@/components/ui'")) {
          // Extract existing UI import
          const uiImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui['"]/;
          const uiMatch = content.match(uiImportRegex);
          
          if (uiMatch) {
            // Combine with existing UI import
            const existingComponents = uiMatch[1].split(',').map(c => c.trim());
            const allComponents = [...existingComponents, ...componentsToExtract];
            const uniqueComponents = [...new Set(allComponents)];
            
            const newUiImport = `import { ${uniqueComponents.join(', ')} } from '@/components/ui'`;
            newContent = newContent.replace(uiMatch[0], newUiImport);
            
            // Remove the components from Mantine import
            if (remainingComponents.length > 0) {
              newContent = newContent.replace(originalImport, newMantineImport);
            } else {
              // Remove the entire Mantine import if no components remain
              newContent = newContent.replace(originalImport, '');
            }
          }
        } else {
          // Add new UI import after the Mantine import
          if (remainingComponents.length > 0) {
            newContent = newContent.replace(originalImport, `${newMantineImport}\n${uiImport}`);
          } else {
            newContent = newContent.replace(originalImport, uiImport);
          }
        }
        
        content = newContent;
      }
    }
    
    // Clean up any duplicate newlines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Write the updated content if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedFiles++;
      console.log(`Updated imports in: ${path.relative(process.cwd(), filePath)}`);
    }
  }
});

console.log(`\nComplete! Updated ${updatedFiles} files.`);