/**
 * ADR Dependency Visualization Generator
 * 
 * This script generates dependency visualizations specifically for Architecture Decision Records.
 * It can create focused dependency graphs for specific modules or architectural boundaries.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Types
interface VisualizationOptions {
  title: string;
  adrNumber: number;
  focusModules: string[];
  includeCommonUtilities?: boolean;
  outputFormat?: 'svg' | 'dot';
  highlightViolations?: boolean;
  excludeModules?: string[];
  collapseInternals?: boolean;
}

interface ModuleMapping {
  name: string;
  pattern: string;
}

/**
 * Generate a dependency visualization for an ADR
 */
function generateAdrDependencyVisualization(options: VisualizationOptions): string {
  const {
    title,
    adrNumber,
    focusModules,
    includeCommonUtilities = true,
    outputFormat = 'svg',
    highlightViolations = true,
    excludeModules = [],
    collapseInternals = false
  } = options;

  // Create sanitized title for filename
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const outputFilename = `adr-${adrNumber.toString().padStart(3, '0')}-${sanitizedTitle}`;
  
  // Create output directories if they don't exist
  const outputDir = path.join(__dirname, '..', '..', 'docs', 'adr', 'visualizations');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build the depcruise options
  const additionalOptions = buildDepCruiseOptions(
    focusModules,
    includeCommonUtilities,
    excludeModules,
    collapseInternals
  );

  // Get the path to the dependency-cruiser config
  const depCruiserConfigPath = path.join(__dirname, '..', '..', 'backend', '.dependency-cruiser.js');

  // Generate the command
  const commandBase = `npx depcruise --include-only "^src/modules/(${focusModules.join('|')})" --config "${depCruiserConfigPath}"`;
  const outputOption = outputFormat === 'svg' 
    ? `--output-type dot | dot -T svg -o "${path.join(outputDir, outputFilename + '.svg')}"`
    : `--output-type dot -o "${path.join(outputDir, outputFilename + '.dot')}"`;
  
  const command = `cd ${path.join(__dirname, '..', '..', 'backend')} && ${commandBase} ${additionalOptions} src ${outputOption}`;

  try {
    console.log(`Generating dependency visualization for ADR-${adrNumber.toString().padStart(3, '0')}: ${title}`);
    console.log(`Command: ${command}`);
    execSync(command, { stdio: 'inherit' });
    
    return path.join(outputDir, outputFilename + '.' + outputFormat);
  } catch (error) {
    console.error('Error generating dependency visualization:', error);
    throw error;
  }
}

/**
 * Build extra options for dependency-cruiser
 */
function buildDepCruiseOptions(
  focusModules: string[],
  includeCommonUtilities: boolean,
  excludeModules: string[],
  collapseInternals: boolean
): string {
  let options = '';

  // Include common utilities if requested
  if (includeCommonUtilities) {
    options += ' --include-only "^src/common/|^src/modules/(' + focusModules.join('|') + ')"';
  }

  // Exclude specified modules
  if (excludeModules.length > 0) {
    options += ' --exclude "^src/modules/(' + excludeModules.join('|') + ')"';
  }

  // Collapse internal module details if requested
  if (collapseInternals) {
    options += ' --collapse "^src/modules/[^/]+/(?!index\\.ts)"';
  }

  return options;
}

/**
 * Extract a subgraph for specific modules from the full dependency graph
 */
function extractSubgraph(
  inputDotFile: string, 
  outputFile: string, 
  focusModules: string[]
): string {
  // Read the input DOT file
  const dotContent = fs.readFileSync(inputDotFile, 'utf-8');
  
  // Filter the DOT content to include only the specified modules
  const modulePatterns = focusModules.map(module => `src/modules/${module}`);
  
  // Parse the DOT file to extract the subgraph
  // This is a simplified approach - for complex graphs, a proper DOT parser would be better
  const lines = dotContent.split('\n');
  let filteredLines: string[] = [];
  
  // Keep the header
  const headerEndIndex = lines.findIndex(line => line.trim() === 'digraph {');
  filteredLines = lines.slice(0, headerEndIndex + 1);
  
  // Add the nodes and edges for the specified modules
  for (let i = headerEndIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if the line references any of the modules we're interested in
    if (modulePatterns.some(pattern => line.includes(pattern))) {
      filteredLines.push(line);
    } else if (line.trim() === '}') {
      // Add the closing brace
      filteredLines.push(line);
      break;
    }
  }
  
  // Write the filtered content to the output file
  fs.writeFileSync(outputFile, filteredLines.join('\n'));
  
  // Convert to SVG if the output file is SVG
  if (outputFile.endsWith('.svg')) {
    const dotFile = outputFile.replace('.svg', '.dot');
    fs.writeFileSync(dotFile, filteredLines.join('\n'));
    execSync(`dot -Tsvg "${dotFile}" -o "${outputFile}"`);
    fs.unlinkSync(dotFile);
  }
  
  return outputFile;
}

/**
 * Generate a dependency visualization that includes violation markers
 */
function generateViolationVisualization(
  adrNumber: number,
  title: string,
  focusModules: string[]
): string {
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outputFilename = `adr-${adrNumber.toString().padStart(3, '0')}-${sanitizedTitle}-violations`;
  const outputDir = path.join(__dirname, '..', '..', 'docs', 'adr', 'visualizations');
  const outputFile = path.join(outputDir, `${outputFilename}.svg`);
  
  // Generate the dependency graph with violations highlighted
  const command = `cd ${path.join(__dirname, '..', '..', 'backend')} && npx depcruise --include-only "^src/modules/(${focusModules.join('|')})" --output-type dot src | dot -T svg -o "${outputFile}"`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    return outputFile;
  } catch (error) {
    console.error('Error generating violation visualization:', error);
    throw error;
  }
}

/**
 * Print usage instructions
 */
function printUsage(): void {
  console.log(`
  Generate dependency visualizations for Architecture Decision Records.

  Usage:
    node generate-adr-dependencies.js --adr=<number> --title="<title>" --modules=module1,module2
    
  Options:
    --adr=<number>               ADR number (e.g., 1, 2, 3)
    --title="<title>"            Title of the ADR
    --modules=<module1,module2>  Comma-separated list of modules to include
    --include-common             Include common utilities (default: true)
    --format=<svg|dot>           Output format (default: svg)
    --highlight-violations       Highlight dependency violations (default: true)
    --exclude=<module1,module2>  Modules to exclude from visualization
    --collapse-internals         Collapse module internals, showing only the public API (default: false)
    --help                       Show this help message
  `);
}

/**
 * Parse command line arguments
 */
function parseArgs(): VisualizationOptions | null {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    return null;
  }
  
  const options: Partial<VisualizationOptions> = {
    includeCommonUtilities: true,
    outputFormat: 'svg',
    highlightViolations: true,
    collapseInternals: false
  };
  
  for (const arg of args) {
    if (arg.startsWith('--adr=')) {
      options.adrNumber = parseInt(arg.substring(6), 10);
    } else if (arg.startsWith('--title=')) {
      options.title = arg.substring(8);
    } else if (arg.startsWith('--modules=')) {
      options.focusModules = arg.substring(10).split(',');
    } else if (arg === '--include-common=false') {
      options.includeCommonUtilities = false;
    } else if (arg.startsWith('--format=')) {
      options.outputFormat = arg.substring(9) as 'svg' | 'dot';
    } else if (arg === '--highlight-violations=false') {
      options.highlightViolations = false;
    } else if (arg.startsWith('--exclude=')) {
      options.excludeModules = arg.substring(10).split(',');
    } else if (arg === '--collapse-internals') {
      options.collapseInternals = true;
    }
  }
  
  // Validate required options
  if (!options.adrNumber || !options.title || !options.focusModules) {
    console.error('Error: Missing required options. Use --help for usage information.');
    return null;
  }
  
  return options as VisualizationOptions;
}

/**
 * Main function
 */
function main(): void {
  const options = parseArgs();
  if (!options) return;
  
  try {
    const outputFile = generateAdrDependencyVisualization(options);
    console.log(`Dependency visualization generated: ${outputFile}`);
    
    if (options.highlightViolations) {
      const violationsFile = generateViolationVisualization(
        options.adrNumber,
        options.title + '-violations',
        options.focusModules
      );
      console.log(`Violation visualization generated: ${violationsFile}`);
    }
  } catch (error) {
    console.error('Error in dependency visualization generation:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export {
  generateAdrDependencyVisualization,
  extractSubgraph,
  generateViolationVisualization
};