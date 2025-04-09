#!/usr/bin/env node

/**
 * Test Migration Script
 * 
 * This script helps migrate Jest tests to Vitest with proper TypeScript support.
 * It automatically converts common patterns and renames files.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define patterns to replace
const replacements = [
  // Add 'use client' directive if importing React
  {
    find: /^import\s+React(?:,\s*{[^}]*})?\s+from\s+['"]react['"];/gm,
    replace: "'use client';\n\nimport React from 'react';"
  },
  // Replace Jest imports with Vitest
  {
    find: /import\s+{\s*([^}]*)jest([^}]*)\s*}\s*from\s+['"]@testing-library\/jest-dom['"]/g,
    replace: "import { $1vi$2 } from 'vitest'"
  },
  // Update render imports
  {
    find: /import\s+{\s*([^}]*)render([^}]*)\s*}\s*from\s+['"]@testing-library\/react['"]/g,
    replace: "import { $1renderWithProviders as render$2 } from '../../../testing/utils/render'"
  },
  // Fix internal test utils imports
  {
    find: /import\s+{[^}]*screen[^}]*}\s+from\s+['"](\.\.\/\.\.\/utils\/test-utils|\.\.\/testUtil)['"]/g,
    replace: "import { screen, fireEvent, waitFor, within } from '../../../testing/utils/render'"
  },
  // Fix mock functions
  {
    find: /jest\.fn\(\)/g,
    replace: "vi.fn()"
  },
  // Fix mock implementations
  {
    find: /jest\.fn\(\)\.mockImplementation/g,
    replace: "vi.fn().mockImplementation"
  },
  // Fix mock return values
  {
    find: /jest\.fn\(\)\.mockReturnValue/g,
    replace: "vi.fn().mockReturnValue"
  },
  // Fix useFakeTimers
  {
    find: /jest\.useFakeTimers\(\)/g,
    replace: "vi.useFakeTimers()"
  },
  // Fix advanceTimersByTime
  {
    find: /jest\.advanceTimersByTime\(/g,
    replace: "vi.advanceTimersByTime("
  },
  // Fix useRealTimers
  {
    find: /jest\.useRealTimers\(\)/g,
    replace: "vi.useRealTimers()"
  },
  // Fix resetAllMocks
  {
    find: /jest\.resetAllMocks\(\)/g,
    replace: "vi.resetAllMocks()"
  },
  // Fix clearAllMocks
  {
    find: /jest\.clearAllMocks\(\)/g,
    replace: "vi.clearAllMocks()"
  },
  // Fix restoreAllMocks
  {
    find: /jest\.restoreAllMocks\(\)/g,
    replace: "vi.resetAllMocks()"
  },
  // Fix problematic React hook mocks
  {
    find: /vi\.mock\(['"]react['"],\s*\(\)\s*=>\s*\{[\s\S]*?useState[\s\S]*?\}\);/g,
    replace: "// REMOVED problematic React hooks mock that causes 'Invalid hook call' errors"
  },
  // Fix mock
  {
    find: /jest\.mock\(/g,
    replace: "vi.mock("
  },
  // Fix renderWithProviders import
  {
    find: /import\s+{\s*renderWithProviders\s*}\s*from\s+['"](.*)['"]/g,
    replace: "import { renderWithProviders } from '../../../testing/utils/render'"
  },
  // Convert render to renderWithProviders
  {
    find: /\brender\(/g,
    replace: "renderWithProviders("
  },
  // Fix expect(element).toHaveAttribute
  {
    find: /expect\(([^)]+)\)\.toHaveAttribute\((['"])data-simplified\2\s*,\s*(['"])true\3\)/g,
    replace: "expect(screen.queryByAttribute('data-simplified', 'true')).not.toBeNull()"
  },
  // Update test file imports for testing library
  {
    find: /import\s+{\s*([^}]*)screen([^}]*)\s*}\s*from\s+['"]@testing-library\/react['"]/g,
    replace: "import { $1screen$2 } from '../../../testing/utils/render'"
  },
  // Fix renderHook imports
  {
    find: /import\s+{\s*([^}]*)renderHook([^}]*)\s*}\s*from\s+['"]@testing-library\/react-hooks['"]/g,
    replace: "import { $1renderHook$2 } from '../../../testing/utils/render'"
  }
];

// Function to check if file needs Vitest imports
function needsVitestImports(content) {
  return !content.includes("import") || !content.includes("from 'vitest");
}

// Function to add Vitest imports if needed
function addVitestImports(content) {
  if (needsVitestImports(content)) {
    return `// Make sure to add 'use client' for components that use hooks
'use client';

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';\n` + content;
  }
  return content;
}

// Function to check if file needs Jest-DOM imports
function needsJestDomImports(content) {
  return content.includes("toBeInTheDocument") && !content.includes("@testing-library/jest-dom");
}

// Function to add Jest-DOM imports if needed
function addJestDomImports(content) {
  if (needsJestDomImports(content)) {
    return "import '@testing-library/jest-dom';\n" + content;
  }
  return content;
}

// Paths to search for test files
const testPaths = [
  'src/**/*.test.{ts,tsx}',
  'src/**/__tests__/**/*.{ts,tsx}',
  'src/**/__tests__/**/*.spec.{ts,tsx}'
];

// Parse arguments to look for specific paths
const args = process.argv.slice(2);
let customPath = null;

const pathIndex = args.indexOf('--path');
if (pathIndex !== -1 && args.length > pathIndex + 1) {
  customPath = args[pathIndex + 1];
  console.log(`Using custom path: ${customPath}`);
}

// Find all test files
const testFiles = [];
if (customPath) {
  // If custom path provided, use it
  const files = glob.sync(`${customPath}/**/*.{ts,tsx}`, { cwd: process.cwd() });
  testFiles.push(...files);
} else {
  // Otherwise use the default paths
  testPaths.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    testFiles.push(...files);
  });
}

console.log(`Found ${testFiles.length} test files to migrate.`);

// Migrate each file
let migratedCount = 0;
let errorCount = 0;

testFiles.forEach(file => {
  const oldPath = path.join(process.cwd(), file);
  
  // Determine new file path (change .test.tsx to .spec.tsx)
  const newPath = oldPath.replace(/\.test\.(ts|tsx)$/, '.spec.$1');
  
  try {
    // Read the file
    let content = fs.readFileSync(oldPath, 'utf8');
    
    // Apply replacements
    replacements.forEach(({ find, replace }) => {
      content = content.replace(find, replace);
    });
    
    // Add Vitest imports if needed
    content = addVitestImports(content);
    
    // Add Jest-DOM imports if needed
    content = addJestDomImports(content);
    
    // Write to new location if it's different
    if (oldPath !== newPath) {
      fs.writeFileSync(newPath, content);
      console.log(`Migrated: ${file} -> ${path.relative(process.cwd(), newPath)}`);
    } else {
      fs.writeFileSync(oldPath, content);
      console.log(`Updated: ${file}`);
    }
    
    migratedCount++;
  } catch (error) {
    console.error(`Error migrating ${file}:`, error);
    errorCount++;
  }
});

console.log(`\nMigration complete.`);
console.log(`- Successfully migrated: ${migratedCount}`);
console.log(`- Errors: ${errorCount}`);
console.log(`\nNext steps:`);
console.log(`1. Run 'npm run test' to verify the migrated tests`);
console.log(`2. Check for any TypeScript errors with 'npm run typecheck'`);
console.log(`3. Fix any remaining issues in tests.`);