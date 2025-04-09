/**
 * ADR Markdown Renderer
 * 
 * This script provides a custom markdown renderer for ADRs with enhanced
 * visualization capabilities. It can be used to generate HTML or other formats
 * from ADRs with proper rendering of dependency diagrams.
 */

import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

interface RenderOptions {
  inputFile: string;
  outputFile?: string;
  includeStyles?: boolean;
  interactive?: boolean;
  outputFormat?: 'html' | 'pdf';
}

// Custom renderer for handling dependency visualizations
class ADRRenderer extends marked.Renderer {
  constructor(private options: { baseDir: string, interactive?: boolean }) {
    super();
  }
  
  // Override the image rendering to handle dependency visualizations
  image(href: string, title: string, text: string): string {
    // Check if this is a dependency visualization
    const isDependencyViz = 
      href.includes('visualizations/') && 
      (href.endsWith('.svg') || href.endsWith('.dot'));
      
    if (!isDependencyViz) {
      // Use default rendering for non-dependency visualizations
      return super.image(href, title, text);
    }
    
    const fullPath = path.resolve(this.options.baseDir, href);
    const altText = text || 'Dependency visualization';
    
    if (!fs.existsSync(fullPath)) {
      return `<div class="missing-visualization">
                <p>Missing visualization: ${href}</p>
              </div>`;
    }
    
    // For SVG visualizations, either embed the SVG directly or use an image tag
    if (href.endsWith('.svg')) {
      if (this.options.interactive) {
        try {
          const svgContent = fs.readFileSync(fullPath, 'utf-8');
          return `<div class="dependency-visualization interactive">
                    <div class="visualization-title">${altText}</div>
                    ${svgContent}
                  </div>`;
        } catch (error) {
          console.error(`Error reading SVG file: ${fullPath}`, error);
          return super.image(href, title, text);
        }
      } else {
        return `<div class="dependency-visualization">
                  <div class="visualization-title">${altText}</div>
                  <img src="${href}" alt="${altText}" title="${title || ''}" />
                </div>`;
      }
    }
    
    // For DOT files, include a link to view/download the DOT file
    if (href.endsWith('.dot')) {
      return `<div class="dependency-visualization dot-file">
                <div class="visualization-title">${altText}</div>
                <p>This visualization is available as a DOT file: <a href="${href}" download>${path.basename(href)}</a></p>
              </div>`;
    }
    
    // Fallback to default rendering
    return super.image(href, title, text);
  }
  
  // Override code block rendering to handle mermaid diagrams
  code(code: string, language: string | undefined): string {
    if (language === 'mermaid') {
      return `<div class="mermaid-diagram">
                <pre class="mermaid">${code}</pre>
              </div>`;
    }
    
    // Handle dependency-cruiser rule blocks
    if (language === 'javascript' && code.includes('severity')) {
      return `<div class="dependency-rule">
                <pre><code class="language-javascript">${code}</code></pre>
              </div>`;
    }
    
    return super.code(code, language);
  }
}

/**
 * Render an ADR Markdown file to HTML
 */
function renderADR(options: RenderOptions): string {
  const { inputFile, includeStyles = true, interactive = false } = options;
  
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }
  
  const baseDir = path.dirname(inputFile);
  const markdown = fs.readFileSync(inputFile, 'utf-8');
  
  // Set up the custom renderer
  const renderer = new ADRRenderer({ baseDir, interactive });
  
  marked.setOptions({
    renderer,
    headerIds: true,
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true
  });
  
  // Render the markdown to HTML
  const contentHtml = marked.parse(markdown);
  
  // Build the full HTML document
  let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
  html += '<meta charset="UTF-8">\n';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += `<title>ADR: ${path.basename(inputFile, '.md')}</title>\n`;
  
  if (includeStyles) {
    html += '<style>\n';
    html += fs.readFileSync(path.join(__dirname, 'adr-styles.css'), 'utf-8');
    html += '\n</style>\n';
  }
  
  if (interactive) {
    html += '<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>\n';
    html += '<script>mermaid.initialize({startOnLoad:true});</script>\n';
  }
  
  html += '</head>\n<body>\n';
  html += '<div class="adr-document">\n';
  html += contentHtml;
  html += '\n</div>\n';
  
  if (interactive) {
    html += '<script>\n';
    html += 'document.addEventListener("DOMContentLoaded", function() {\n';
    html += '  // Initialize interactive visualizations\n';
    html += '  const vizElements = document.querySelectorAll(".dependency-visualization.interactive svg");\n';
    html += '  vizElements.forEach(svg => {\n';
    html += '    // Add zoom and pan functionality\n';
    html += '    let isPanning = false;\n';
    html += '    let startPoint = { x: 0, y: 0 };\n';
    html += '    let scale = 1;\n';
    html += '    let viewBox = svg.viewBox.baseVal;\n';
    html += '    let originalViewBox = {\n';
    html += '      x: viewBox.x,\n';
    html += '      y: viewBox.y,\n';
    html += '      width: viewBox.width,\n';
    html += '      height: viewBox.height\n';
    html += '    };\n';
    html += '\n';
    html += '    // Add zoom controls\n';
    html += '    const controls = document.createElement("div");\n';
    html += '    controls.className = "viz-controls";\n';
    html += '    controls.innerHTML = `\n';
    html += '      <button class="zoom-in">+</button>\n';
    html += '      <button class="zoom-out">-</button>\n';
    html += '      <button class="reset">Reset</button>\n';
    html += '    `;\n';
    html += '    svg.parentNode.insertBefore(controls, svg);\n';
    html += '\n';
    html += '    // Attach event handlers\n';
    html += '    controls.querySelector(".zoom-in").addEventListener("click", () => {\n';
    html += '      scale *= 1.2;\n';
    html += '      updateViewBox();\n';
    html += '    });\n';
    html += '\n';
    html += '    controls.querySelector(".zoom-out").addEventListener("click", () => {\n';
    html += '      scale /= 1.2;\n';
    html += '      updateViewBox();\n';
    html += '    });\n';
    html += '\n';
    html += '    controls.querySelector(".reset").addEventListener("click", () => {\n';
    html += '      scale = 1;\n';
    html += '      viewBox.x = originalViewBox.x;\n';
    html += '      viewBox.y = originalViewBox.y;\n';
    html += '      viewBox.width = originalViewBox.width;\n';
    html += '      viewBox.height = originalViewBox.height;\n';
    html += '    });\n';
    html += '\n';
    html += '    function updateViewBox() {\n';
    html += '      viewBox.width = originalViewBox.width / scale;\n';
    html += '      viewBox.height = originalViewBox.height / scale;\n';
    html += '    }\n';
    html += '  });\n';
    html += '});\n';
    html += '</script>\n';
  }
  
  html += '</body>\n</html>';
  
  // Write the output file if specified
  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, html);
    console.log(`Rendered ADR to ${options.outputFile}`);
  }
  
  return html;
}

/**
 * Generate CSS styles for ADR rendering
 */
function generateStyles(): string {
  return `
/* ADR Document Styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.adr-document {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  padding: 2rem;
}

h1 {
  border-bottom: 2px solid #eaecef;
  padding-bottom: 0.3em;
  margin-bottom: 1.5rem;
}

h2 {
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

code {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9em;
  background-color: rgba(27,31,35,0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 1em;
  overflow: auto;
}

pre code {
  background-color: transparent;
  padding: 0;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1rem;
}

th, td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #f6f8fa;
  font-weight: 600;
}

blockquote {
  margin-left: 0;
  padding-left: 1em;
  border-left: 3px solid #dfe2e5;
  color: #6a737d;
}

/* Dependency Visualization Styles */
.dependency-visualization {
  margin: 2rem 0;
  border: 1px solid #dfe2e5;
  border-radius: 6px;
  overflow: hidden;
}

.visualization-title {
  background-color: #f6f8fa;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-bottom: 1px solid #dfe2e5;
}

.dependency-visualization img,
.dependency-visualization svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.dependency-visualization.interactive {
  position: relative;
}

.viz-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 5px;
  display: flex;
  gap: 5px;
}

.viz-controls button {
  background-color: #fff;
  border: 1px solid #dfe2e5;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.viz-controls button:hover {
  background-color: #f6f8fa;
}

.dependency-rule {
  margin: 1.5rem 0;
  border-radius: 6px;
  overflow: hidden;
}

.dependency-rule pre {
  margin: 0;
  background-color: #f8f9fc;
  border: 1px solid #dfe2e5;
}

.mermaid-diagram {
  margin: 2rem 0;
  text-align: center;
}

.mermaid {
  max-width: 100%;
  overflow: auto;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0d1117;
    color: #c9d1d9;
  }
  
  .adr-document {
    background-color: #161b22;
    box-shadow: 0 1px 3px rgba(0,0,0,0.24), 0 1px 2px rgba(0,0,0,0.36);
  }
  
  h1, h2 {
    border-bottom-color: #30363d;
  }
  
  code {
    background-color: rgba(110,118,129,0.1);
  }
  
  pre {
    background-color: #0d1117;
  }
  
  table, th, td {
    border-color: #30363d;
  }
  
  th {
    background-color: #161b22;
  }
  
  blockquote {
    border-left-color: #30363d;
    color: #8b949e;
  }
  
  .dependency-visualization {
    border-color: #30363d;
  }
  
  .visualization-title {
    background-color: #161b22;
    border-bottom-color: #30363d;
  }
  
  .viz-controls {
    background-color: rgba(22, 27, 34, 0.8);
  }
  
  .viz-controls button {
    background-color: #0d1117;
    border-color: #30363d;
    color: #c9d1d9;
  }
  
  .viz-controls button:hover {
    background-color: #161b22;
  }
  
  .dependency-rule pre {
    background-color: #0d1117;
    border-color: #30363d;
  }
}
`;
}

/**
 * Create the CSS file if it doesn't exist
 */
function createStyleFile(): void {
  const styleFile = path.join(__dirname, 'adr-styles.css');
  
  if (!fs.existsSync(styleFile)) {
    fs.writeFileSync(styleFile, generateStyles());
    console.log(`Created ADR style file: ${styleFile}`);
  }
}

/**
 * Render a directory of ADRs to HTML
 */
function renderADRDirectory(inputDir: string, outputDir: string): void {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create style file if it doesn't exist
  createStyleFile();
  
  // Get all ADR files
  const files = fs.readdirSync(inputDir);
  const adrFiles = files.filter(file => /^ADR-\d{3}-.+\.md$/.test(file));
  
  console.log(`Found ${adrFiles.length} ADR files to render.`);
  
  // Render each ADR
  for (const adrFile of adrFiles) {
    const inputFile = path.join(inputDir, adrFile);
    const outputFile = path.join(outputDir, adrFile.replace('.md', '.html'));
    
    try {
      renderADR({
        inputFile,
        outputFile,
        includeStyles: true,
        interactive: true
      });
      
      console.log(`Rendered ${adrFile} to ${outputFile}`);
    } catch (error) {
      console.error(`Error rendering ${adrFile}:`, error);
    }
  }
  
  // Copy visualization files to output directory
  const vizDir = path.join(inputDir, 'visualizations');
  const outputVizDir = path.join(outputDir, 'visualizations');
  
  if (fs.existsSync(vizDir)) {
    if (!fs.existsSync(outputVizDir)) {
      fs.mkdirSync(outputVizDir, { recursive: true });
    }
    
    const vizFiles = fs.readdirSync(vizDir);
    
    for (const vizFile of vizFiles) {
      if (vizFile.endsWith('.svg') || vizFile.endsWith('.dot')) {
        fs.copyFileSync(
          path.join(vizDir, vizFile),
          path.join(outputVizDir, vizFile)
        );
      }
    }
    
    console.log(`Copied ${vizFiles.length} visualization files to ${outputVizDir}`);
  }
  
  // Create index file
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Architecture Decision Records</title>
  <style>
${generateStyles()}
  </style>
</head>
<body>
  <div class="adr-document">
    <h1>Architecture Decision Records</h1>
    <p>This is a collection of Architecture Decision Records (ADRs) for the Fluxori project.</p>
    <ul>
${adrFiles.map(file => {
  const adrNum = file.match(/^ADR-(\d{3})/)?.[1] || '';
  const adrTitle = file.replace(/^ADR-\d{3}-/, '').replace('.md', '');
  return `      <li><a href="${file.replace('.md', '.html')}">ADR-${adrNum}: ${adrTitle.replace(/-/g, ' ')}</a></li>`;
}).join('\n')}
    </ul>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
  console.log(`Created index file: ${path.join(outputDir, 'index.html')}`);
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
  ADR Markdown Renderer - Render ADRs with enhanced visualization support.

  Usage:
    node markdown-renderer.js <command> [options]
    
  Commands:
    render-file       Render a single ADR file
    render-directory  Render a directory of ADRs
    generate-styles   Generate CSS styles for ADRs
    
  Options for 'render-file':
    --input=<file>     Input Markdown file (required)
    --output=<file>    Output HTML file (required)
    --interactive      Enable interactive visualizations (default: false)
    
  Options for 'render-directory':
    --input=<dir>      Input directory containing ADRs (required)
    --output=<dir>     Output directory for rendered HTML (required)
    
  Examples:
    node markdown-renderer.js render-file --input=../../docs/adr/ADR-001-example.md --output=ADR-001-example.html
    node markdown-renderer.js render-directory --input=../../docs/adr --output=../../docs/adr-html
    node markdown-renderer.js generate-styles > adr-styles.css
  `);
}

/**
 * Parse command line arguments
 */
function parseArgs(): { command: string, options: Record<string, any> } | null {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    return null;
  }
  
  const command = args[0];
  const options: Record<string, any> = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--input=')) {
      options.input = arg.substring(8);
    } else if (arg.startsWith('--output=')) {
      options.output = arg.substring(9);
    } else if (arg === '--interactive') {
      options.interactive = true;
    }
  }
  
  return { command, options };
}

/**
 * Main function
 */
function main(): void {
  createStyleFile();
  
  const args = parseArgs();
  if (!args) return;
  
  const { command, options } = args;
  
  try {
    switch (command) {
      case 'render-file':
        if (!options.input || !options.output) {
          console.error('Error: --input and --output are required for render-file command');
          printUsage();
          break;
        }
        
        renderADR({
          inputFile: options.input,
          outputFile: options.output,
          interactive: options.interactive || false
        });
        break;
        
      case 'render-directory':
        if (!options.input || !options.output) {
          console.error('Error: --input and --output are required for render-directory command');
          printUsage();
          break;
        }
        
        renderADRDirectory(options.input, options.output);
        break;
        
      case 'generate-styles':
        console.log(generateStyles());
        break;
        
      default:
        console.error(`Error: Unknown command '${command}'`);
        printUsage();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export {
  renderADR,
  renderADRDirectory,
  generateStyles
};