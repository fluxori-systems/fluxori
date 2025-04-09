#!/usr/bin/env node

/**
 * TypeScript Error Report Generator
 * 
 * This script runs the TypeScript compiler in noEmit mode and generates
 * a report of errors grouped by file and category.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const BACKEND_DIR = path.resolve(__dirname, '../backend');
const OUTPUT_PATH = path.resolve(__dirname, '../typescript-errors.md');

/**
 * Runs TypeScript compiler and returns error output
 */
function getTSErrors(directory) {
  try {
    execSync(`cd ${directory} && npx tsc --noEmit`, { stdio: 'ignore' });
    return ''; // No errors
  } catch (error) {
    return execSync(`cd ${directory} && npx tsc --noEmit`, { encoding: 'utf8' });
  }
}

/**
 * Parse TypeScript error output and organize by file and error code
 */
function parseErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
    if (match) {
      const [_, filePath, line, column, errorCode, message] = match;
      errors.push({
        filePath,
        line: Number(line),
        column: Number(column),
        errorCode,
        message
      });
    }
  }
  
  return errors;
}

/**
 * Group errors by file
 */
function groupErrorsByFile(errors) {
  const byFile = {};
  
  for (const error of errors) {
    if (!byFile[error.filePath]) {
      byFile[error.filePath] = [];
    }
    byFile[error.filePath].push(error);
  }
  
  return byFile;
}

/**
 * Group errors by error code
 */
function groupErrorsByCode(errors) {
  const byCode = {};
  
  for (const error of errors) {
    if (!byCode[error.errorCode]) {
      byCode[error.errorCode] = [];
    }
    byCode[error.errorCode].push(error);
  }
  
  return byCode;
}

/**
 * Generate the Markdown report
 */
function generateReport() {
  const frontendErrors = parseErrors(getTSErrors(FRONTEND_DIR));
  const backendErrors = parseErrors(getTSErrors(BACKEND_DIR));
  
  const frontendByFile = groupErrorsByFile(frontendErrors);
  const frontendByCode = groupErrorsByCode(frontendErrors);
  const backendByFile = groupErrorsByFile(backendErrors);
  const backendByCode = groupErrorsByCode(backendErrors);
  
  let report = '# TypeScript Error Report\n\n';
  
  // Summary
  report += '## Summary\n\n';
  report += `- Frontend: ${frontendErrors.length} errors across ${Object.keys(frontendByFile).length} files\n`;
  report += `- Backend: ${backendErrors.length} errors across ${Object.keys(backendByFile).length} files\n\n`;
  
  // Frontend Errors
  if (frontendErrors.length > 0) {
    report += '## Frontend Errors\n\n';
    
    // By error code
    report += '### By Error Type\n\n';
    for (const [code, errors] of Object.entries(frontendByCode)) {
      report += `#### ${code} (${errors.length} occurrences)\n\n`;
      report += `${errors[0].message}\n\n`;
      report += 'Top files:\n';
      
      // Group by file for this error code
      const fileCount = {};
      errors.forEach(e => {
        fileCount[e.filePath] = (fileCount[e.filePath] || 0) + 1;
      });
      
      // Sort by count
      const sortedFiles = Object.entries(fileCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      sortedFiles.forEach(([file, count]) => {
        report += `- ${file} (${count} occurrences)\n`;
      });
      
      report += '\n';
    }
    
    // By file
    report += '### By File\n\n';
    const topFiles = Object.entries(frontendByFile)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    for (const [file, errors] of topFiles) {
      report += `#### ${file} (${errors.length} errors)\n\n`;
      
      // Group by error code for this file
      const codeCount = {};
      errors.forEach(e => {
        codeCount[e.errorCode] = (codeCount[e.errorCode] || 0) + 1;
      });
      
      // Sort by count
      const sortedCodes = Object.entries(codeCount)
        .sort((a, b) => b[1] - a[1]);
      
      sortedCodes.forEach(([code, count]) => {
        report += `- ${code}: ${count} occurrences\n`;
      });
      
      report += '\n';
    }
  }
  
  // Backend Errors
  if (backendErrors.length > 0) {
    report += '## Backend Errors\n\n';
    
    // Same structure as frontend
    // By error code
    report += '### By Error Type\n\n';
    for (const [code, errors] of Object.entries(backendByCode)) {
      report += `#### ${code} (${errors.length} occurrences)\n\n`;
      report += `${errors[0].message}\n\n`;
      report += 'Top files:\n';
      
      // Group by file for this error code
      const fileCount = {};
      errors.forEach(e => {
        fileCount[e.filePath] = (fileCount[e.filePath] || 0) + 1;
      });
      
      // Sort by count
      const sortedFiles = Object.entries(fileCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      sortedFiles.forEach(([file, count]) => {
        report += `- ${file} (${count} occurrences)\n`;
      });
      
      report += '\n';
    }
    
    // By file
    report += '### By File\n\n';
    const topFiles = Object.entries(backendByFile)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    for (const [file, errors] of topFiles) {
      report += `#### ${file} (${errors.length} errors)\n\n`;
      
      // Group by error code for this file
      const codeCount = {};
      errors.forEach(e => {
        codeCount[e.errorCode] = (codeCount[e.errorCode] || 0) + 1;
      });
      
      // Sort by count
      const sortedCodes = Object.entries(codeCount)
        .sort((a, b) => b[1] - a[1]);
      
      sortedCodes.forEach(([code, count]) => {
        report += `- ${code}: ${count} occurrences\n`;
      });
      
      report += '\n';
    }
  }
  
  // Save report
  fs.writeFileSync(OUTPUT_PATH, report);
  console.log(`TypeScript error report saved to: ${OUTPUT_PATH}`);
  
  return {
    frontendErrors: frontendErrors.length,
    backendErrors: backendErrors.length
  };
}

// Run report
const results = generateReport();

// Exit with non-zero code if there are errors
if (results.frontendErrors > 0 || results.backendErrors > 0) {
  console.error(`Found ${results.frontendErrors + results.backendErrors} TypeScript errors.`);
  process.exit(1);
}