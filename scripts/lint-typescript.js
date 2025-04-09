#!/usr/bin/env node

/**
 * TypeScript Linting Script
 * 
 * This script runs TypeScript and ESLint checks on the codebase
 * and reports any issues.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

// ANSI color codes for formatting output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Run a command and return its output
 */
function runCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { encoding: 'utf8', cwd }).toString();
  } catch (error) {
    return error.stdout ? error.stdout.toString() : error.message;
  }
}

/**
 * Format error count with color
 */
function formatErrorCount(count) {
  if (count === 0) {
    return `${colors.green}${count} errors${colors.reset}`;
  } else {
    return `${colors.red}${count} errors${colors.reset}`;
  }
}

/**
 * Check TypeScript errors
 */
function checkTypeScript() {
  console.log(`\n${colors.bold}${colors.blue}Running TypeScript checks...${colors.reset}\n`);
  
  const output = runCommand('npx tsc --noEmit', FRONTEND_DIR);
  const errorCount = (output.match(/error TS\d+/g) || []).length;
  
  console.log(`Found ${formatErrorCount(errorCount)}`);
  
  if (errorCount > 0) {
    // Extract and group errors by file
    const errors = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        const [_, filePath, line, column, errorCode, message] = match;
        const relativePath = path.relative(FRONTEND_DIR, filePath);
        
        if (!errors[relativePath]) {
          errors[relativePath] = [];
        }
        
        errors[relativePath].push({
          line: Number(line),
          column: Number(column),
          code: errorCode,
          message
        });
      }
    }
    
    // Display top 5 files with most errors
    const topFiles = Object.entries(errors)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    console.log(`\n${colors.bold}Top files with TypeScript errors:${colors.reset}`);
    
    topFiles.forEach(([file, fileErrors]) => {
      console.log(`\n${colors.bold}${file}${colors.reset} (${fileErrors.length} errors):`);
      
      // Group by error code
      const byCode = {};
      fileErrors.forEach(error => {
        if (!byCode[error.code]) {
          byCode[error.code] = [];
        }
        byCode[error.code].push(error);
      });
      
      // Display error types and counts
      Object.entries(byCode).forEach(([code, codeErrors]) => {
        const example = codeErrors[0];
        console.log(`  ${colors.yellow}${code}${colors.reset} (${codeErrors.length}): ${example.message}`);
      });
    });
  }
  
  return errorCount;
}

/**
 * Check ESLint errors
 */
function checkESLint() {
  console.log(`\n${colors.bold}${colors.blue}Running ESLint checks...${colors.reset}\n`);
  
  // Check if custom ESLint config exists
  let eslintConfig = '.eslintrc.json';
  if (fs.existsSync(path.join(FRONTEND_DIR, '.eslintrc.custom.json'))) {
    eslintConfig = '.eslintrc.custom.json';
  }
  
  const output = runCommand(`npx eslint --config ${eslintConfig} "src/**/*.{ts,tsx}" --format stylish`, FRONTEND_DIR);
  const errorCount = (output.match(/✖/g) || []).length;
  
  console.log(output);
  console.log(`Found ${formatErrorCount(errorCount)}`);
  
  return errorCount;
}

/**
 * Check for deprecated Mantine props
 */
function checkMantineProps() {
  console.log(`\n${colors.bold}${colors.blue}Checking for deprecated Mantine props...${colors.reset}\n`);
  
  // Map of deprecated props to their modern equivalents
  const PROP_MAPPING = {
    'weight': 'fw',
    'align': 'ta',
    'spacing': 'gap',
    'position': 'justify',
    'leftIcon': 'leftSection',
    'rightIcon': 'rightSection',
    'color': 'c'
  };
  
  const results = {};
  
  // Search for these patterns in the codebase
  Object.keys(PROP_MAPPING).forEach(prop => {
    Object.entries({
      'Text': `<Text[^>]*${prop}=`,
      'Button': `<Button[^>]*${prop}=`,
      'Stack': `<Stack[^>]*${prop}=`,
      'Group': `<Group[^>]*${prop}=`,
    }).forEach(([component, pattern]) => {
      try {
        const grepOutput = runCommand(`grep -r "${pattern}" --include="*.tsx" src/`, FRONTEND_DIR);
        
        if (grepOutput) {
          const matches = grepOutput.split('\n').filter(Boolean);
          
          matches.forEach(match => {
            const [file] = match.split(':');
            
            if (!results[file]) {
              results[file] = {};
            }
            
            if (!results[file][prop]) {
              results[file][prop] = [];
            }
            
            results[file][prop].push(component);
          });
        }
      } catch (error) {
        // Grep returns non-zero exit code when no matches are found
      }
    });
  });
  
  const fileCount = Object.keys(results).length;
  
  if (fileCount > 0) {
    console.log(`Found ${colors.yellow}${fileCount} files${colors.reset} with deprecated Mantine props:\n`);
    
    Object.entries(results).forEach(([file, props]) => {
      console.log(`${colors.bold}${file}${colors.reset}:`);
      
      Object.entries(props).forEach(([prop, components]) => {
        const uniqueComponents = [...new Set(components)];
        console.log(`  ${colors.red}${prop}${colors.reset} → ${colors.green}${PROP_MAPPING[prop]}${colors.reset} in ${uniqueComponents.join(', ')}`);
      });
      
      console.log('');
    });
    
    console.log(`${colors.yellow}Note:${colors.reset} Use modern Mantine props instead. See TYPESCRIPT_GUIDE.md for details.`);
  } else {
    console.log(`${colors.green}No deprecated Mantine props found.${colors.reset}`);
  }
  
  return fileCount;
}

/**
 * Check for missing 'use client' directives
 */
function checkUseClientDirectives() {
  console.log(`\n${colors.bold}${colors.blue}Checking for missing 'use client' directives...${colors.reset}\n`);
  
  const clientHookPatterns = [
    'useState', 
    'useEffect', 
    'useRef', 
    'useCallback', 
    'useMemo', 
    'useContext',
    'useRouter',
    'useSearchParams'
  ].join('|');
  
  const eventHandlerPatterns = [
    'onClick', 
    'onChange', 
    'onSubmit', 
    'onBlur', 
    'onFocus', 
    'onKeyDown', 
    'onKeyUp'
  ].join('|');
  
  const results = [];
  
  // Find files with hooks or event handlers
  try {
    const hookMatches = runCommand(`grep -l -E "(${clientHookPatterns})" --include="*.tsx" src/`, FRONTEND_DIR).split('\n').filter(Boolean);
    const eventMatches = runCommand(`grep -l -E "(${eventHandlerPatterns})" --include="*.tsx" src/`, FRONTEND_DIR).split('\n').filter(Boolean);
    
    // Combine and remove duplicates
    const clientComponentFiles = [...new Set([...hookMatches, ...eventMatches])];
    
    // Check which ones are missing 'use client'
    clientComponentFiles.forEach(file => {
      const content = fs.readFileSync(path.join(FRONTEND_DIR, file), 'utf8');
      if (!content.includes("'use client'") && !content.includes('"use client"')) {
        results.push(file);
      }
    });
  } catch (error) {
    // Grep returns non-zero exit code when no matches are found
  }
  
  if (results.length > 0) {
    console.log(`Found ${colors.yellow}${results.length} files${colors.reset} missing 'use client' directive:\n`);
    
    results.forEach(file => {
      console.log(`${colors.bold}${file}${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}Note:${colors.reset} Add 'use client' to the top of these files. Client components must include this directive.`);
  } else {
    console.log(`${colors.green}No files missing 'use client' directive.${colors.reset}`);
  }
  
  return results.length;
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bold}${colors.magenta}TypeScript Linting Report${colors.reset}\n`);
  
  const tsErrorCount = checkTypeScript();
  const eslintErrorCount = checkESLint();
  const deprecatedPropsCount = checkMantineProps();
  const missingClientDirectivesCount = checkUseClientDirectives();
  
  const totalIssues = tsErrorCount + eslintErrorCount + deprecatedPropsCount + missingClientDirectivesCount;
  
  console.log(`\n${colors.bold}${colors.magenta}Summary:${colors.reset}`);
  console.log(`TypeScript errors: ${formatErrorCount(tsErrorCount)}`);
  console.log(`ESLint issues: ${formatErrorCount(eslintErrorCount)}`);
  console.log(`Files with deprecated props: ${formatErrorCount(deprecatedPropsCount)}`);
  console.log(`Files missing 'use client': ${formatErrorCount(missingClientDirectivesCount)}`);
  console.log(`Total issues: ${formatErrorCount(totalIssues)}`);
  
  if (totalIssues > 0) {
    console.log(`\n${colors.yellow}See TYPESCRIPT_GUIDE.md for guidance on fixing these issues.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ All checks passed! Code looks good.${colors.reset}`);
    process.exit(0);
  }
}

// Run the linting script
main();