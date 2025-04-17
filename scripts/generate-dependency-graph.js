// This script generates dependency graphs using dependency-cruiser and viz.js
// without requiring graphviz to be installed on the system
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Viz = require('viz.js');

// Paths to generate dependency graphs for
const paths = [
  { 
    name: 'backend', 
    src: 'backend/src',
    outputs: [
      { name: 'module-graph', focus: '^src/modules/', output: 'backend/module-graph.dot' },
      { name: 'full-graph', include: '^src', output: 'backend/dependency-graph.dot' }
    ]
  },
  { 
    name: 'frontend', 
    src: 'frontend/src',
    outputs: [
      { name: 'module-graph', focus: '^src/lib/(ui|motion|shared)/', output: 'frontend/module-graph.dot' },
      { name: 'component-graph', include: '^src/components', output: 'frontend/component-dependencies.dot' }
    ]
  }
];

// Function to run dependency-cruiser
function runDepCruise(srcPath, options = {}) {
  // Use the correct option to skip TypeScript validation
  let command = `npx depcruise ${srcPath} --exclude "node_modules|.next|dist"`;
  
  if (options.include) {
    command += ` --include-only "${options.include}"`;
  }
  
  if (options.focus) {
    command += ` --focus "${options.focus}"`;
  }
  
  if (options.config) {
    command += ` --config ${options.config}`;
  } else {
    // If no config is specified, use a simplified approach
    command += ` --exclude "node_modules|.next|dist"`;
  }
  
  command += ` --output-type dot`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running dependency-cruiser: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

// Function to convert DOT to SVG using viz.js
function dotToSvg(dotContent) {
  try {
    return Viz(dotContent);
  } catch (error) {
    console.error('Error converting DOT to SVG:', error);
    return null;
  }
}

// Main function to generate all dependency graphs
async function generateDependencyGraphs() {
  console.log('Generating dependency graphs...');
  
  for (const path of paths) {
    console.log(`\nProcessing ${path.name}...`);
    
    for (const output of path.outputs) {
      try {
        console.log(`Generating ${output.name}...`);
        
        // Generate the DOT file
        const options = {
          include: output.include,
          focus: output.focus,
          config: path.name + '/.dependency-cruiser.js'
        };
        
        const dotContent = await runDepCruise(path.src, options);
        
        // Save DOT file
        fs.writeFileSync(output.output, dotContent);
        console.log(`DOT file saved to ${output.output}`);
        
        // Convert to SVG
        const svgContent = dotToSvg(dotContent);
        if (svgContent) {
          const svgPath = output.output.replace('.dot', '.svg');
          fs.writeFileSync(svgPath, svgContent);
          console.log(`SVG file saved to ${svgPath}`);
        }
      } catch (error) {
        console.error(`Error generating ${output.name} for ${path.name}:`, error);
      }
    }
  }
  
  console.log('\nDependency graph generation complete!');
}

// Run the script
generateDependencyGraphs().catch(error => {
  console.error('Error generating dependency graphs:', error);
  process.exit(1);
});