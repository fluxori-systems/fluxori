/**
 * Script to add properly documented TypeScript expect-error comments 
 * for jest-dom matchers in test files.
 * 
 * This approach uses explicit @ts-expect-error with clear documentation
 * about why the error is being suppressed.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all test files
const testFiles = glob.sync('src/**/__tests__/**/*.{spec,test}.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true
});

// Matchers to look for and properly document
const jestDomMatchers = [
  'toBeInTheDocument',
  'toBeVisible',
  'toBeEmpty',
  'toBeDisabled',
  'toBeEnabled',
  'toBeInvalid',
  'toBeRequired',
  'toBeValid',
  'toHaveAttribute',
  'toHaveClass',
  'toHaveFocus',
  'toHaveFormValues',
  'toHaveStyle',
  'toHaveTextContent',
  'toHaveValue',
  'toHaveDisplayValue',
  'toBeChecked',
  'toBePartiallyChecked',
  'toHaveDescription',
  'toContainElement',
  'toContainHTML',
  'toHaveErrorMessage'
];

// Regular expression to find expect statements using these matchers
const expectMatcherRegex = new RegExp(`expect\\([^)]+\\)\\.(?:not\\.)?(?:${jestDomMatchers.join('|')})`, 'g');

// Process each file
testFiles.forEach(filePath => {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file imports jest-dom
  if (!content.includes("'@testing-library/jest-dom'") && !content.includes('"@testing-library/jest-dom"')) {
    // Add import at the top of the file
    content = `// @vitest-environment jsdom
import '@testing-library/jest-dom';
${content}`;
  }
  
  // Replace each expect matcher with a properly documented expect-error
  jestDomMatchers.forEach(matcher => {
    // Look for the pattern "expect(...).matcher" or "expect(...).not.matcher"
    const matcherRegex = new RegExp(`(expect\\([^)]+\\))(\\.not)?\\.(${matcher})`, 'g');
    content = content.replace(matcherRegex, (match, expPart, notPart, matcherPart) => {
      return `// @ts-expect-error - ${matcherPart} comes from jest-dom
${expPart}${notPart || ''}.${matcherPart}`;
    });
  });
  
  // Write back the modified content
  fs.writeFileSync(filePath, content);
});

console.log('All test files processed with properly documented TypeScript expect-error comments');