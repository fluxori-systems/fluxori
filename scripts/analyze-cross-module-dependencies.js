// Cross-module dependency analysis script
// This script analyzes imports/exports between UI, Motion, and Shared modules
// to identify potential circular dependencies and violations of module boundaries

const fs = require('fs');
const path = require('path');

// Paths to the modules
const MODULE_PATHS = {
  ui: path.resolve(__dirname, '../frontend/src/lib/ui'),
  motion: path.resolve(__dirname, '../frontend/src/lib/motion'),
  shared: path.resolve(__dirname, '../frontend/src/lib/shared')
};

// Pattern to find imports
const IMPORT_PATTERN = /import\s+(?:(?:[{}\s\w*,]+from\s+)?["']([^"']+)["'])/g;

// Function to determine which module a file belongs to
function getModuleForFile(filePath) {
  if (filePath.includes('/lib/ui/')) return 'ui';
  if (filePath.includes('/lib/motion/')) return 'motion';
  if (filePath.includes('/lib/shared/')) return 'shared';
  return 'other';
}

// Function to determine which module an import belongs to
function getModuleForImport(importPath, sourceFile) {
  if (importPath.includes('../ui/')) return 'ui';
  if (importPath.includes('../motion/')) return 'motion';
  if (importPath.includes('../shared/')) return 'shared';
  
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const sourceModule = getModuleForFile(sourceFile);
    if (sourceModule !== 'other') return sourceModule;
  }
  
  return 'external';
}

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      findFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file) && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to extract module imports from a file
function extractModuleImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  let match;
  
  // Reset the RegExp
  IMPORT_PATTERN.lastIndex = 0;
  
  // Find all imports
  while ((match = IMPORT_PATTERN.exec(content)) !== null) {
    const importPath = match[1];
    const sourceModule = getModuleForFile(filePath);
    const targetModule = getModuleForImport(importPath, filePath);
    
    if (sourceModule !== 'other' && targetModule !== 'external') {
      imports.push({
        source: {
          module: sourceModule,
          file: path.relative(MODULE_PATHS[sourceModule], filePath)
        },
        target: {
          module: targetModule,
          path: importPath
        }
      });
    }
  }
  
  return imports;
}

// Function to analyze cross-module dependencies
function analyzeModules() {
  const moduleFiles = {};
  const moduleImports = {};
  const crossModuleImports = [];
  
  // Find all files in each module
  Object.keys(MODULE_PATHS).forEach(moduleName => {
    moduleFiles[moduleName] = findFiles(MODULE_PATHS[moduleName]);
    console.log(`Found ${moduleFiles[moduleName].length} files in ${moduleName} module`);
  });
  
  // Extract imports from each file
  Object.keys(moduleFiles).forEach(moduleName => {
    moduleImports[moduleName] = [];
    
    moduleFiles[moduleName].forEach(filePath => {
      const fileImports = extractModuleImports(filePath);
      moduleImports[moduleName].push(...fileImports);
      
      // Add cross-module imports to the list
      fileImports.forEach(importInfo => {
        if (importInfo.source.module !== importInfo.target.module) {
          crossModuleImports.push(importInfo);
        }
      });
    });
    
    console.log(`Found ${moduleImports[moduleName].length} imports in ${moduleName} module`);
  });
  
  console.log(`\nCross-module dependencies: ${crossModuleImports.length}`);
  
  // Analyze dependencies between modules
  const moduleDependencies = {
    'ui→motion': 0,
    'ui→shared': 0,
    'motion→ui': 0,
    'motion→shared': 0,
    'shared→ui': 0,
    'shared→motion': 0
  };
  
  crossModuleImports.forEach(importInfo => {
    const key = `${importInfo.source.module}→${importInfo.target.module}`;
    if (moduleDependencies[key] !== undefined) {
      moduleDependencies[key]++;
    }
  });
  
  // Print module dependencies
  console.log('\nModule Dependencies:');
  Object.keys(moduleDependencies).forEach(key => {
    console.log(`  ${key}: ${moduleDependencies[key]}`);
  });
  
  // Check for circular dependencies
  if (moduleDependencies['ui→motion'] > 0 && moduleDependencies['motion→ui'] > 0) {
    console.log('\n⚠️ WARNING: Circular dependency detected between UI and Motion modules!');
    
    // List the specific files involved
    console.log('\nFiles where UI imports from Motion:');
    crossModuleImports
      .filter(imp => imp.source.module === 'ui' && imp.target.module === 'motion')
      .forEach(imp => {
        console.log(`  ${imp.source.file} imports from ${imp.target.path}`);
      });
    
    console.log('\nFiles where Motion imports from UI:');
    crossModuleImports
      .filter(imp => imp.source.module === 'motion' && imp.target.module === 'ui')
      .forEach(imp => {
        console.log(`  ${imp.source.file} imports from ${imp.target.path}`);
      });
  }
  
  // Create summary DOT graph of module dependencies
  let dotGraph = 'digraph "Module Dependencies" {\n';
  dotGraph += '  rankdir="TB";\n';
  dotGraph += '  node [shape=box, style=filled];\n';
  dotGraph += '  edge [fontsize=12, fontcolor=gray50];\n\n';
  
  // Add nodes
  dotGraph += '  ui [label="UI Module", fillcolor="#2563eb", fontcolor="white"];\n';
  dotGraph += '  motion [label="Motion Module", fillcolor="#db2777", fontcolor="white"];\n';
  dotGraph += '  shared [label="Shared Module", fillcolor="#16a34a", fontcolor="white"];\n\n';
  
  // Add edges
  Object.keys(moduleDependencies).forEach(key => {
    const count = moduleDependencies[key];
    if (count > 0) {
      const [source, target] = key.split('→');
      dotGraph += `  ${source} -> ${target} [label="${count} imports"];\n`;
    }
  });
  
  dotGraph += '}\n';
  
  // Write DOT file
  const dotFile = path.resolve(__dirname, '../frontend/module-dependencies.dot');
  fs.writeFileSync(dotFile, dotGraph);
  console.log(`\nModule dependency graph written to ${dotFile}`);
  console.log(`To visualize this DOT file, you can:
  - Use an online DOT visualizer like https://dreampuf.github.io/GraphvizOnline/
  - Install Graphviz locally and run: dot -Tsvg ${dotFile} -o ${dotFile.replace('.dot', '.svg')}`);
  
  // Provide recommendations
  console.log('\nRecommendations:');
  
  if (moduleDependencies['ui→motion'] > 0 && moduleDependencies['motion→ui'] > 0) {
    console.log('  1. Resolve circular dependencies between UI and Motion modules:');
    console.log('     - Move shared functionality to the Shared module');
    console.log('     - Create interfaces in the Shared module that both UI and Motion can implement');
    console.log('     - Use dependency injection to avoid direct imports');
  }
  
  if (moduleDependencies['ui→shared'] === 0 || moduleDependencies['motion→shared'] === 0) {
    console.log('  2. Make better use of the Shared module:');
    console.log('     - Extract common types and interfaces to the Shared module');
    console.log('     - Define shared service interfaces in the Shared module');
  }
  
  console.log('  3. Follow these dependency direction principles:');
  console.log('     - UI and Motion modules should both depend on Shared');
  console.log('     - Shared module should not depend on UI or Motion');
  console.log('     - Consider making UI and Motion completely independent of each other');
}

// Run the analysis
console.log('Analyzing cross-module dependencies...');
analyzeModules();