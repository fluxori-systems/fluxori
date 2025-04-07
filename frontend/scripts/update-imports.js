#!/usr/bin/env node

/**
 * This script updates imports throughout the codebase to use the new library structure.
 * It replaces:
 * 1. Mantine UI component imports with our custom UI components
 * 2. Old API client imports with the new type-safe API client
 * 3. Chart.js utility imports with our type-safe chart helpers
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Components that should be imported from our UI library
const UI_COMPONENTS = [
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
const srcDir = path.resolve(process.cwd(), 'src');
const files = glob.sync(`${srcDir}/**/*.{ts,tsx}`, {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/lib/**']
});

let updatedFiles = 0;

// Update Mantine UI imports
function updateMantineImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Check if the file imports from @mantine/core
  if (content.includes('@mantine/core')) {
    // Extract the import statement
    const mantineImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@mantine\/core['"]/g;
    let match;
    
    while ((match = mantineImportRegex.exec(originalContent)) !== null) {
      const importComponents = match[1].split(',').map(c => c.trim());
      const componentsToExtract = [];
      const remainingComponents = [];
      
      // Separate components that need to be extracted
      importComponents.forEach(comp => {
        const compName = comp.trim().split(' as ')[0].trim();
        if (UI_COMPONENTS.includes(compName)) {
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
        
        const uiImport = `import { ${componentsToExtract.join(', ')} } from '@/lib/ui'`;
        
        // Check if we already have a UI import
        if (content.includes("from '@/lib/ui'")) {
          // Extract existing UI import
          const uiImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/ui['"]/;
          const uiMatch = content.match(uiImportRegex);
          
          if (uiMatch) {
            // Combine with existing UI import
            const existingComponents = uiMatch[1].split(',').map(c => c.trim());
            const allComponents = [...existingComponents, ...componentsToExtract];
            const uniqueComponents = [...new Set(allComponents)];
            
            const newUiImport = `import { ${uniqueComponents.join(', ')} } from '@/lib/ui'`;
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
  }
  
  // Check if the file imports from the old API client
  if (content.includes('from \'@/api/apiClient\'') || content.includes('from "@/api/apiClient"')) {
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]@\/api\/apiClient['"]/g,
      'import { $1 } from \'@/lib/api\''
    );
  }
  
  // Update hooks/visualization imports to use the new chart library
  if (content.includes('from \'@/hooks/visualization/useChartAnimation\'')) {
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]@\/hooks\/visualization\/useChartAnimation['"]/g,
      'import { $1 } from \'@/lib/charts\''
    );
  }
  
  if (content.includes('from \'@/hooks/visualization/useResponsiveChart\'')) {
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]@\/hooks\/visualization\/useResponsiveChart['"]/g,
      'import { $1 } from \'@/lib/charts\''
    );
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

// Process each file
files.forEach(filePath => {
  updateMantineImports(filePath);
});

console.log(`\nComplete! Updated ${updatedFiles} files.`);