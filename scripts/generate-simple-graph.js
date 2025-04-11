// Simple dependency visualization script
// This script analyzes the imports/exports in TypeScript/JavaScript files
// and creates a DOT file that can be visualized using Graphviz or online tools

const fs = require('fs');
const path = require('path');

// Patterns to look for imports/exports
const IMPORT_PATTERN = /import\s+(?:(?:[{}\s\w*,]+from\s+)?["']([^"']+)["'])/g;
const EXPORT_PATTERN = /export\s+(?:{\s*([^}]+)\s*}|(?:default|[*])\s+(?:from\s+)?["']([^"']+)["'])/g;

// Configuration for modules we want to analyze
const MODULES = [
  {
    name: 'Frontend UI Components',
    rootPath: path.resolve(__dirname, '../frontend/src/lib/ui'),
    outputDot: path.resolve(__dirname, '../frontend/ui-dependencies.dot')
  },
  {
    name: 'Frontend Motion Components',
    rootPath: path.resolve(__dirname, '../frontend/src/lib/motion'),
    outputDot: path.resolve(__dirname, '../frontend/motion-dependencies.dot')
  },
  {
    name: 'Frontend Shared Components',
    rootPath: path.resolve(__dirname, '../frontend/src/lib/shared'),
    outputDot: path.resolve(__dirname, '../frontend/shared-dependencies.dot')
  }
];

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

// Extract imports from a file
function extractImports(filePath, rootPath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  let match;
  
  // Reset the RegExp
  IMPORT_PATTERN.lastIndex = 0;
  
  // Find all imports
  while ((match = IMPORT_PATTERN.exec(content)) !== null) {
    const importPath = match[1];
    if (!importPath.startsWith('.')) continue; // Skip external modules
    
    const sourceFile = path.relative(rootPath, filePath);
    const resolvedImport = resolveImportPath(filePath, importPath);
    const targetFile = resolvedImport ? path.relative(rootPath, resolvedImport) : null;
    
    if (targetFile) {
      imports.push({
        source: sourceFile,
        target: targetFile
      });
    }
  }
  
  return imports;
}

// Resolve a relative import path to an absolute file path
function resolveImportPath(sourceFile, importPath) {
  const sourceDir = path.dirname(sourceFile);
  let resolvedPath = path.resolve(sourceDir, importPath);
  
  // Handle directory imports (index files)
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    resolvedPath = path.join(resolvedPath, 'index');
  }
  
  // Try various extensions
  for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
    const withExt = resolvedPath + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }
  
  return null;
}

// Generate DOT graph from dependencies
function generateDotGraph(dependencies, name) {
  let dot = `digraph "${name}" {\n`;
  dot += '  rankdir="TB";\n';
  dot += '  node [shape=box, style=filled, fillcolor=lightskyblue];\n';
  dot += '  edge [color=gray50, fontcolor=gray50];\n\n';
  
  // Add nodes
  const nodes = new Set();
  dependencies.forEach(dep => {
    nodes.add(dep.source);
    nodes.add(dep.target);
  });
  
  nodes.forEach(node => {
    // Clean up node name for DOT
    const nodeName = node.replace(/[\\/.-]/g, '_');
    const displayName = node.replace(/\\/g, '/');
    dot += `  ${nodeName} [label="${displayName}"];\n`;
  });
  
  dot += '\n';
  
  // Add edges
  dependencies.forEach(dep => {
    const sourceName = dep.source.replace(/[\\/.-]/g, '_');
    const targetName = dep.target.replace(/[\\/.-]/g, '_');
    dot += `  ${sourceName} -> ${targetName};\n`;
  });
  
  dot += '}\n';
  return dot;
}

// Process a module and generate its dependency graph
function processModule(module) {
  console.log(`Processing ${module.name}...`);
  
  // Find all TypeScript files
  const files = findFiles(module.rootPath);
  console.log(`Found ${files.length} files`);
  
  // Extract dependencies
  const dependencies = [];
  files.forEach(file => {
    const fileImports = extractImports(file, module.rootPath);
    dependencies.push(...fileImports);
  });
  
  console.log(`Found ${dependencies.length} dependencies`);
  
  // Generate DOT graph
  const dotGraph = generateDotGraph(dependencies, module.name);
  
  // Write DOT file
  fs.writeFileSync(module.outputDot, dotGraph);
  console.log(`DOT file written to ${module.outputDot}`);
  
  // Info message for visualizing the DOT file
  console.log(`To visualize this DOT file, you can:
  - Use an online DOT visualizer like https://dreampuf.github.io/GraphvizOnline/
  - Install Graphviz locally and run: dot -Tsvg ${module.outputDot} -o ${module.outputDot.replace('.dot', '.svg')}`);
}

// Process all modules
function main() {
  console.log('Generating dependency graphs...');
  MODULES.forEach(processModule);
  console.log('Done!');
}

main();