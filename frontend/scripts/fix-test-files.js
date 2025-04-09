#!/usr/bin/env node

/**
 * TypeScript Test Files Fix Script
 * 
 * This script helps fix common TypeScript errors in test files by:
 * 1. Updating imports to use typed test utilities
 * 2. Adding imports for typed mock creators
 * 3. Fixing screen queries to use proper return types
 * 4. Fixing mock function typing issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to find test files
const testPatterns = [
  'src/**/*.test.{ts,tsx}',
  'src/**/*.spec.{ts,tsx}'
];

// Get all test files
const getTestFiles = () => {
  try {
    const output = execSync(`find src -name "*.test.tsx" -o -name "*.spec.tsx" -o -name "*.test.ts" -o -name "*.spec.ts"`, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error(`Error finding test files:`, error);
    return [];
  }
};

// Fix imports in test files
const fixImports = (content) => {
  // Add createTypedMock import
  if (content.includes('vi.fn()') && !content.includes('createTypedMock')) {
    content = content.replace(
      /import\s+{\s*([^}]*vi[^}]*)\s*}\s*from\s+['"]vitest['"]/g,
      'import { $1, describe, test, expect, beforeEach, afterEach } from \'vitest\';\nimport { createTypedMock } from \'../../../testing/mocks/browser-apis\''
    );
  }

  // Fix render imports to include screen, fireEvent, within
  content = content.replace(
    /import\s+{\s*renderWithProviders\s*}\s*from\s+['"]([^'"]+)['"]/g,
    'import { renderWithProviders, screen, fireEvent, within } from \'$1\''
  );

  // Replace outdated testing library imports
  content = content.replace(
    /import\s+{\s*([^}]*?)(screen|fireEvent|waitFor|within)([^}]*?)\s*}\s*from\s+['"]@testing-library\/react['"]/g,
    'import { $1$3 } from \'@testing-library/react\';\nimport { $2, screen, fireEvent, waitFor, within } from \'../../../testing/utils/render\''
  );

  // Convert jest.fn() to createTypedMock()
  content = content.replace(/vi\.fn\(\)/g, 'createTypedMock()');
  content = content.replace(/jest\.fn\(\)/g, 'createTypedMock()');
  
  return content;
};

// Fix test assertions for HTMLElement
const fixAssertions = (content) => {
  // Fix .toBeInTheDocument() with queryBy methods
  content = content.replace(
    /expect\(screen\.queryByText\(([^)]+)\)\)\.not\.toBeInTheDocument\(\)/g,
    'expect(screen.queryByText($1)).toBeNull()'
  );
  
  // Fix querySelector assertions
  content = content.replace(
    /expect\(([^)]+)\.querySelector\((['"][^'"]+['"])\)\)\.toBeInTheDocument\(\)/g,
    'const element = $1.querySelector($2);\nexpect(element).not.toBeNull()'
  );
  
  // Fix querySelector with not.toBeInTheDocument
  content = content.replace(
    /expect\(([^)]+)\.querySelector\((['"][^'"]+['"])\)\)\.not\.toBeInTheDocument\(\)/g,
    'const element = $1.querySelector($2);\nexpect(element).toBeNull()'
  );
  
  return content;
};

// Fix mock function typing issues
const fixMockTyping = (content) => {
  // Fix mockImplementation with arrow function returns
  content = content.replace(
    /\.mockImplementation\(\(\)\s*=>\s*\{\s*return\s+\(\)\s*=>\s*\{\s*\/\*[^*]*\*\/\s*\}\s*\}\)/g,
    '.mockImplementation(() => (() => { /* cleanup */ }))'
  );
  
  // Fix mockReturnValue with complex return types
  content = content.replace(
    /\.mockReturnValue\(\{\s*([^}]+)\s*\}\)/g,
    '.mockReturnValue({\n      $1\n    })'
  );
  
  // Fix typed mocks creation
  content = content.replace(
    /createTypedMock\(\)\.mockImplementation\(([^)]+)\)/g,
    'createTypedMock($1)'
  );
  
  return content;
};

// Process a single test file
const processTestFile = (filePath) => {
  console.log(`Processing ${filePath}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    let updatedContent = content;
    updatedContent = fixImports(updatedContent);
    updatedContent = fixAssertions(updatedContent);
    updatedContent = fixMockTyping(updatedContent);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  console.log('Finding test files...');
  const testFiles = getTestFiles();
  console.log(`Found ${testFiles.length} test files`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  testFiles.forEach(file => {
    try {
      const updated = processTestFile(file);
      if (updated) updatedCount++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      errorCount++;
    }
  });
  
  console.log('\nSummary:');
  console.log(`- Total test files found: ${testFiles.length}`);
  console.log(`- Files updated: ${updatedCount}`);
  console.log(`- Files with errors: ${errorCount}`);
  console.log(`- Files unchanged: ${testFiles.length - updatedCount - errorCount}`);
  
  console.log('\nNext steps:');
  console.log('1. Run TypeScript check with: npx tsc --noEmit --skipLibCheck');
  console.log('2. Fix any remaining issues manually');
  console.log('3. Run tests with: npm run test');
};

main();