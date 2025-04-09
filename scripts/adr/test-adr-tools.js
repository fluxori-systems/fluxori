/**
 * ADR Tools Test Script
 * 
 * This script tests the ADR tools to ensure they work as expected.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const ADR_DIR = path.join(__dirname, '..', '..', 'docs', 'adr');
const ADR_SCRIPTS_DIR = __dirname;
const TEST_ADR_TITLE = 'Test Architecture Decision';
const TEST_MODULES = ['feature-flags', 'auth'];

// Utility function to run a command and return its output
function runCommand(command, cwd = ADR_SCRIPTS_DIR) {
  try {
    return execSync(command, { cwd, encoding: 'utf8' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

// Utility function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Test ADR creation
function testAdrCreation() {
  console.log('Testing ADR creation...');
  
  const command = `./adr.sh create --title="${TEST_ADR_TITLE}" --modules=${TEST_MODULES.join(',')}`;
  const output = runCommand(command);
  
  // Extract the ADR number from the output
  const match = output.match(/Created ADR: .*ADR-(\d{3})/);
  if (!match) {
    console.error('Failed to extract ADR number from output:', output);
    process.exit(1);
  }
  
  const adrNumber = match[1];
  const sanitizedTitle = TEST_ADR_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const adrFilename = `ADR-${adrNumber}-${sanitizedTitle}.md`;
  const adrPath = path.join(ADR_DIR, adrFilename);
  
  if (!fileExists(adrPath)) {
    console.error(`ADR file not created: ${adrPath}`);
    process.exit(1);
  }
  
  console.log(`✓ ADR creation successful: ${adrPath}`);
  return { adrNumber, adrPath, adrFilename };
}

// Test index generation
function testIndexGeneration() {
  console.log('Testing ADR index generation...');
  
  const indexPath = path.join(ADR_DIR, 'README.md');
  
  // Remove the index if it exists
  if (fileExists(indexPath)) {
    fs.unlinkSync(indexPath);
  }
  
  const command = './adr.sh update-index';
  runCommand(command);
  
  if (!fileExists(indexPath)) {
    console.error(`Index file not created: ${indexPath}`);
    process.exit(1);
  }
  
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('# Architecture Decision Records')) {
    console.error('Index file does not contain expected content');
    process.exit(1);
  }
  
  console.log(`✓ Index generation successful: ${indexPath}`);
}

// Test visualization generation
function testVisualizationGeneration(adrNumber) {
  console.log('Testing visualization generation...');
  
  const command = `./adr.sh generate-viz --adr=${adrNumber} --title="Test Visualization" --modules=${TEST_MODULES.join(',')}`;
  runCommand(command);
  
  const visualizationPath = path.join(ADR_DIR, 'visualizations', `adr-${adrNumber.toString().padStart(3, '0')}-test-visualization.svg`);
  
  if (!fileExists(visualizationPath)) {
    console.error(`Visualization file not created: ${visualizationPath}`);
    process.exit(1);
  }
  
  console.log(`✓ Visualization generation successful: ${visualizationPath}`);
}

// Test Mermaid diagram generation
function testMermaidGeneration(adrNumber) {
  console.log('Testing Mermaid diagram generation...');
  
  const command = `./adr.sh generate-mermaid flowchart --adr=${adrNumber} --title="Test Flowchart" --modules=${TEST_MODULES.join(',')}`;
  runCommand(command);
  
  const mermaidPath = path.join(ADR_DIR, 'visualizations', `adr-${adrNumber.toString().padStart(3, '0')}-test-flowchart-mermaid.md`);
  
  if (!fileExists(mermaidPath)) {
    console.error(`Mermaid file not created: ${mermaidPath}`);
    process.exit(1);
  }
  
  console.log(`✓ Mermaid generation successful: ${mermaidPath}`);
}

// Test HTML rendering
function testHtmlRendering(adrPath) {
  console.log('Testing HTML rendering...');
  
  const outputDir = path.join(ADR_DIR, '..', 'adr-html');
  if (!fileExists(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, path.basename(adrPath, '.md') + '.html');
  
  const command = `./adr.sh render --input=${adrPath} --output=${outputPath}`;
  runCommand(command);
  
  if (!fileExists(outputPath)) {
    console.error(`HTML file not created: ${outputPath}`);
    process.exit(1);
  }
  
  console.log(`✓ HTML rendering successful: ${outputPath}`);
}

// Test updating ADR status
function testStatusUpdate(adrNumber) {
  console.log('Testing ADR status update...');
  
  const command = `./adr.sh update-status --adr=${adrNumber} --status=Accepted`;
  runCommand(command);
  
  const sanitizedTitle = TEST_ADR_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const adrFilename = `ADR-${adrNumber.toString().padStart(3, '0')}-${sanitizedTitle}.md`;
  const adrPath = path.join(ADR_DIR, adrFilename);
  
  const content = fs.readFileSync(adrPath, 'utf8');
  if (!content.includes('## Status\n\nAccepted')) {
    console.error(`ADR status not updated in file: ${adrPath}`);
    process.exit(1);
  }
  
  console.log(`✓ Status update successful: ${adrPath}`);
}

// Clean up test files
function cleanUp(adrPath) {
  console.log('Cleaning up test files...');
  
  if (fileExists(adrPath)) {
    fs.unlinkSync(adrPath);
    console.log(`Deleted test ADR: ${adrPath}`);
  }
  
  const adrNumber = path.basename(adrPath).match(/^ADR-(\d{3})/)[1];
  const visualizationPath = path.join(ADR_DIR, 'visualizations', `adr-${adrNumber}-test-visualization.svg`);
  if (fileExists(visualizationPath)) {
    fs.unlinkSync(visualizationPath);
    console.log(`Deleted test visualization: ${visualizationPath}`);
  }
  
  const mermaidPath = path.join(ADR_DIR, 'visualizations', `adr-${adrNumber}-test-flowchart-mermaid.md`);
  if (fileExists(mermaidPath)) {
    fs.unlinkSync(mermaidPath);
    console.log(`Deleted test Mermaid diagram: ${mermaidPath}`);
  }
  
  const htmlPath = path.join(ADR_DIR, '..', 'adr-html', path.basename(adrPath, '.md') + '.html');
  if (fileExists(htmlPath)) {
    fs.unlinkSync(htmlPath);
    console.log(`Deleted test HTML: ${htmlPath}`);
  }
  
  // Regenerate the index without the test ADR
  runCommand('./adr.sh update-index');
  console.log('Regenerated ADR index');
}

// Run all tests
function runTests() {
  console.log('Running ADR tools tests...');
  
  try {
    // Ensure the scripts are executable
    runCommand('chmod +x adr.sh extract-subgraph.sh update-adr-visualizations.sh');
    
    // Run the tests
    const { adrNumber, adrPath } = testAdrCreation();
    testIndexGeneration();
    testVisualizationGeneration(adrNumber);
    testMermaidGeneration(adrNumber);
    testHtmlRendering(adrPath);
    testStatusUpdate(adrNumber);
    
    // Clean up
    cleanUp(adrPath);
    
    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('\n✗ Tests failed:', error);
    process.exit(1);
  }
}

runTests();