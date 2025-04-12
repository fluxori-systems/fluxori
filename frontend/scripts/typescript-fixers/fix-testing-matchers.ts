/**
 * TypeScript fixer for jest-dom matchers with Vitest
 * 
 * This script creates proper type declarations for jest-dom
 * matchers when used with Vitest. It solves the common problem
 * where TypeScript doesn't recognize matchers like toBeInTheDocument()
 * and toHaveAttribute() in test files, requiring @ts-expect-error.
 */

import * as fs from 'fs';
import * as path from 'path';

// Define the path for our global augmentation file
const typesDir = path.resolve(__dirname, '../../src/types');
const targetFile = path.join(typesDir, 'vitest-matchers.d.ts');

// Ensure the directory exists
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

// Create type declaration content
const typeDeclaration = `/**
 * Type declarations for @testing-library/jest-dom with Vitest
 * Global augmentation to properly type jest-dom matchers
 */

import '@testing-library/jest-dom';

// Declare the matchers on Vitest's expect interface
declare module 'vitest' {
  interface Assertion<T = any> {
    // DOM Testing Library matchers
    toBeInTheDocument(): T;
    toBeVisible(): T;
    toBeEmpty(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeInvalid(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toHaveAttribute(attr: string, value?: string | RegExp): T;
    toHaveClass(...classNames: string[]): T;
    toHaveFocus(): T;
    toHaveFormValues(expectedValues: Record<string, any>): T;
    toHaveStyle(css: string | Record<string, any>): T;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): T;
    toHaveValue(value?: string | string[] | number | null): T;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): T;
    toBeChecked(): T;
    toBePartiallyChecked(): T;
    toHaveDescription(text?: string | RegExp): T;
    toContainElement(element: HTMLElement | null): T;
    toContainHTML(htmlText: string): T;
    toHaveErrorMessage(text?: string | RegExp): T;
  }

  // Also augment the asymmetric matchers
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): any;
    toBeVisible(): any;
    toBeEmpty(): any;
    toBeDisabled(): any;
    toBeEnabled(): any;
    toBeInvalid(): any;
    toBeRequired(): any;
    toBeValid(): any;
    toHaveAttribute(attr: string, value?: string | RegExp): any;
    toHaveClass(...classNames: string[]): any;
    toHaveFocus(): any;
    toHaveFormValues(expectedValues: Record<string, any>): any;
    toHaveStyle(css: string | Record<string, any>): any;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): any;
    toHaveValue(value?: string | string[] | number | null): any;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): any;
    toBeChecked(): any;
    toBePartiallyChecked(): any;
    toHaveDescription(text?: string | RegExp): any;
    toContainElement(element: HTMLElement | null): any;
    toContainHTML(htmlText: string): any;
    toHaveErrorMessage(text?: string | RegExp): any;
  }
}

// For Jest backwards compatibility
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number | null): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDescription(text?: string | RegExp): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}
`;

// Write the file
fs.writeFileSync(targetFile, typeDeclaration);

// Update tsconfig.json to include the new types file
const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json');
let tsconfig;

try {
  const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
  tsconfig = JSON.parse(tsconfigContent);
  
  // Make sure we have a types array
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }
  
  if (!tsconfig.compilerOptions.types) {
    tsconfig.compilerOptions.types = [];
  }
  
  // Add our file to the types if it's not already there
  const relativePath = './src/types/vitest-matchers';
  if (!tsconfig.compilerOptions.types.includes(relativePath)) {
    tsconfig.compilerOptions.types.push(relativePath);
    
    // Write back the updated config
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }
  
  console.log('Successfully created vitest-matchers.d.ts and updated tsconfig.json');
} catch (error) {
  console.error('Error updating tsconfig.json:', error);
}

// Fix the test files to remove @ts-expect-error comments
const testDirs = [
  path.resolve(__dirname, '../../src/lib/ui/components/__tests__'),
  path.resolve(__dirname, '../../src/components/__tests__'),
  // Add other test directories as needed
];

// Process all test files
for (const dir of testDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`Skipping non-existent directory: ${dir}`);
    continue;
  }
  
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.spec.tsx') || file.endsWith('.test.tsx'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all @ts-expect-error comments for jest-dom matchers
    const updatedContent = content.replace(/\/\/ @ts-expect-error.*jest-dom\s*\n/g, '');
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Fixed TypeScript suppressions in: ${filePath}`);
    }
  }
}

console.log('TypeScript fixing for testing library matchers completed!');