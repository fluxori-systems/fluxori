/**
 * ADR Index Generator
 * 
 * This script generates an enhanced index of Architecture Decision Records
 * with thumbnail visualizations and categorization.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ADRMetadata {
  number: number;
  title: string;
  filename: string;
  status: string;
  date: string;
  description: string;
  modules: string[];
  visualizations: string[];
}

const ADR_DIR = path.join(__dirname, '..', '..', 'docs', 'adr');
const ADR_INDEX = path.join(ADR_DIR, 'README.md');
const VIZ_DIR = path.join(ADR_DIR, 'visualizations');
const THUMBNAIL_DIR = path.join(VIZ_DIR, 'thumbnails');

/**
 * Extract metadata from an ADR file
 */
function extractAdrMetadata(filePath: string): ADRMetadata | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract title and number
    const titleMatch = content.match(/# ADR-(\d{3}): (.+)/);
    if (!titleMatch) return null;
    
    const number = parseInt(titleMatch[1], 10);
    const title = titleMatch[2].trim();
    
    // Extract status
    const statusMatch = content.match(/## Status\s+([A-Za-z]+)/);
    const status = statusMatch ? statusMatch[1] : 'Unknown';
    
    // Extract date
    const dateMatch = content.match(/## Date\s+(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : 'N/A';
    
    // Extract description (first paragraph of context)
    const contextMatch = content.match(/## Context\s+(.*?)(?=##)/s);
    const description = contextMatch 
      ? contextMatch[1].split('\n\n')[0].replace(/\n/g, ' ').trim()
      : 'No description provided.';
    
    // Extract modules
    const moduleMatches = content.match(/modules: ([a-zA-Z0-9-,\s]+)/) || 
                         content.match(/modules: \[(.*?)\]/) ||
                         content.match(/dependencies between the following modules: ([a-zA-Z0-9-,\s]+)/);
    
    const modules = moduleMatches
      ? moduleMatches[1].split(',').map(m => m.trim())
      : [];
    
    // Extract visualizations
    const visualizationMatches = content.match(/!\[.*?\]\((.*?)\)/g) || [];
    const visualizations = visualizationMatches.map(match => {
      const pathMatch = match.match(/!\[.*?\]\((.*?)\)/);
      return pathMatch ? pathMatch[1] : '';
    }).filter(Boolean);
    
    return {
      number,
      title,
      filename: path.basename(filePath),
      status,
      date,
      description,
      modules,
      visualizations
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    return null;
  }
}

/**
 * Generate the ADR index with thumbnails
 */
function generateADRIndex(): void {
  if (!fs.existsSync(ADR_DIR)) {
    console.error(`ADR directory not found: ${ADR_DIR}`);
    process.exit(1);
  }
  
  // Create visualization and thumbnail directories if they don't exist
  if (!fs.existsSync(VIZ_DIR)) {
    fs.mkdirSync(VIZ_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }
  
  // Get all ADR files
  const files = fs.readdirSync(ADR_DIR);
  const adrFiles = files
    .filter(file => /^ADR-\d{3}-.+\.md$/.test(file))
    .map(file => path.join(ADR_DIR, file));
  
  // Extract metadata from each ADR
  const adrs = adrFiles
    .map(file => extractAdrMetadata(file))
    .filter((adr): adr is ADRMetadata => adr !== null)
    .sort((a, b) => a.number - b.number);
  
  // Generate the index content
  let indexContent = '# Architecture Decision Records\n\n';
  
  indexContent += '## Overview\n\n';
  indexContent += 'This directory contains Architecture Decision Records (ADRs) for the Fluxori project. ';
  indexContent += 'Each ADR documents a significant architectural decision, including context, consequences, and dependency visualizations.\n\n';
  
  indexContent += '## Creating and Updating ADRs\n\n';
  indexContent += 'ADRs can be created and updated using the tools in `scripts/adr/`:\n\n';
  indexContent += '```bash\n';
  indexContent += '# Create a new ADR\n';
  indexContent += 'npm run adr:create -- --title="Your Decision Title" --modules=module1,module2\n\n';
  indexContent += '# Update the ADR index\n';
  indexContent += 'npm run adr:update-index\n\n';
  indexContent += '# Update an ADR\'s status\n';
  indexContent += 'npm run adr:update-status -- --adr=1 --status=Accepted\n\n';
  indexContent += '# Regenerate all ADR visualizations\n';
  indexContent += 'npm run adr:regen-viz\n';
  indexContent += '```\n\n';
  indexContent += 'For more details, see [ADR Process](../adr-process.md).\n\n';
  
  indexContent += '## Quick Index\n\n';
  
  // Add a table of contents
  indexContent += '| # | Title | Status | Date | Description |\n';
  indexContent += '|---|-------|--------|------|-------------|\n';
  
  for (const adr of adrs) {
    const description = adr.description.length > 100 
      ? adr.description.substring(0, 97) + '...' 
      : adr.description;
    
    indexContent += `| ${adr.number.toString().padStart(3, '0')} | [${adr.title}](#adr-${adr.number.toString().padStart(3, '0')}-${adr.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}) | ${adr.status} | ${adr.date} | ${description} |\n`;
  }
  
  indexContent += '\n## ADRs with Visualizations\n\n';
  
  // Add visual cards for each ADR
  for (const adr of adrs) {
    const adrId = `adr-${adr.number.toString().padStart(3, '0')}-${adr.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    
    indexContent += `### <a id="${adrId}"></a>ADR-${adr.number.toString().padStart(3, '0')}: ${adr.title}\n\n`;
    indexContent += `**Status:** ${adr.status} | **Date:** ${adr.date}\n\n`;
    indexContent += `${adr.description}\n\n`;
    
    if (adr.modules.length > 0) {
      indexContent += `**Modules:** ${adr.modules.join(', ')}\n\n`;
    }
    
    if (adr.visualizations.length > 0) {
      const mainVisualization = adr.visualizations[0];
      indexContent += `[Read full ADR](${adr.filename})\n\n`;
      indexContent += `[![Dependency visualization](${mainVisualization})](${adr.filename})\n\n`;
    } else {
      indexContent += `[Read full ADR](${adr.filename})\n\n`;
    }
    
    indexContent += '---\n\n';
  }
  
  indexContent += '## ADRs by Status\n\n';
  
  // Group ADRs by status
  const statusGroups: Record<string, ADRMetadata[]> = {};
  for (const adr of adrs) {
    if (!statusGroups[adr.status]) {
      statusGroups[adr.status] = [];
    }
    statusGroups[adr.status].push(adr);
  }
  
  for (const [status, adrsInStatus] of Object.entries(statusGroups)) {
    indexContent += `### ${status}\n\n`;
    for (const adr of adrsInStatus) {
      indexContent += `- [ADR-${adr.number.toString().padStart(3, '0')}: ${adr.title}](${adr.filename})\n`;
    }
    indexContent += '\n';
  }
  
  if (adrs.length > 0) {
    indexContent += '## ADRs by Module\n\n';
    
    // Group ADRs by module
    const moduleGroups: Record<string, ADRMetadata[]> = {};
    for (const adr of adrs) {
      for (const module of adr.modules) {
        if (!moduleGroups[module]) {
          moduleGroups[module] = [];
        }
        if (!moduleGroups[module].includes(adr)) {
          moduleGroups[module].push(adr);
        }
      }
    }
    
    const sortedModules = Object.keys(moduleGroups).sort();
    
    for (const module of sortedModules) {
      indexContent += `### ${module}\n\n`;
      for (const adr of moduleGroups[module]) {
        indexContent += `- [ADR-${adr.number.toString().padStart(3, '0')}: ${adr.title}](${adr.filename})\n`;
      }
      indexContent += '\n';
    }
  }
  
  // Write the index file
  fs.writeFileSync(ADR_INDEX, indexContent);
  
  console.log(`Generated ADR index: ${ADR_INDEX}`);
}

/**
 * Main function
 */
function main(): void {
  try {
    generateADRIndex();
  } catch (error) {
    console.error('Error generating ADR index:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export {
  generateADRIndex,
  extractAdrMetadata
};