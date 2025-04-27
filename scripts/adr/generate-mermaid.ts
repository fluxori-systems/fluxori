/**
 * Mermaid Diagram Generator for ADRs
 *
 * This script generates Mermaid diagrams for ADRs when Dependency-cruiser
 * visualizations might be too complex or when a more abstract view is needed.
 */

import * as fs from "fs";
import * as path from "path";

interface MermaidOptions {
  type: "flowchart" | "classDiagram" | "sequenceDiagram" | "erDiagram";
  title: string;
  adrNumber: number;
  content: string;
}

/**
 * Generate a Mermaid diagram for an ADR
 */
function generateMermaidDiagram(options: MermaidOptions): string {
  const { type, title, adrNumber, content } = options;

  // Create sanitized title for filename
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `adr-${adrNumber.toString().padStart(3, "0")}-${sanitizedTitle}-mermaid.md`;

  // Create output directory if it doesn't exist
  const outputDir = path.join(
    __dirname,
    "..",
    "..",
    "docs",
    "adr",
    "visualizations",
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);

  // Create the Mermaid diagram markdown
  const mermaidContent = `# ${title}

\`\`\`mermaid
${type}
${content}
\`\`\`

*This diagram was generated for ADR-${adrNumber.toString().padStart(3, "0")} on ${new Date().toISOString().split("T")[0]}*
`;

  // Write the Mermaid diagram to file
  fs.writeFileSync(outputPath, mermaidContent);

  return outputPath;
}

/**
 * Generate a module dependency flowchart
 */
function generateModuleDependencyFlowchart(
  modules: string[],
  adrNumber: number,
  title: string,
): string {
  let content = "flowchart TB\n";
  content += "  %% Module nodes\n";

  // Add nodes for each module
  modules.forEach((module) => {
    const moduleId = module.replace(/-/g, "_");
    content += `  ${moduleId}["${module}"]\n`;
  });

  content += "\n  %% Common modules\n";
  content += '  common["Common Utilities"]\n';
  content += '  config["Configuration"]\n\n';

  content += "  %% Dependencies\n";

  // For demo purposes, add some random dependencies
  // In a real implementation, these would be derived from actual code analysis
  for (let i = 0; i < modules.length; i++) {
    const moduleId = modules[i].replace(/-/g, "_");

    // Each module depends on common
    content += `  ${moduleId} --> common\n`;

    // Add some dependencies between modules
    if (i < modules.length - 1) {
      const nextModuleId = modules[i + 1].replace(/-/g, "_");
      content += `  ${moduleId} --> ${nextModuleId}\n`;
    }

    // Add some config dependencies
    if (i % 2 === 0) {
      content += `  ${moduleId} --> config\n`;
    }
  }

  return generateMermaidDiagram({
    type: "flowchart",
    title: `${title} - Module Dependencies`,
    adrNumber,
    content,
  });
}

/**
 * Generate a class diagram for a module
 */
function generateClassDiagram(moduleName: string, adrNumber: number): string {
  const content = `classDiagram
  %% Module: ${moduleName}
  
  class ${moduleName}Module {
    +configure()
    +onModuleInit()
  }
  
  class ${moduleName}Controller {
    +create()
    +findAll()
    +findOne()
    +update()
    +remove()
  }
  
  class ${moduleName}Service {
    -repository: ${moduleName}Repository
    +create()
    +findAll()
    +findOne()
    +update()
    +remove()
  }
  
  class ${moduleName}Repository {
    -firestore: FirestoreService
    +create()
    +findAll()
    +findOne()
    +update()
    +remove()
  }
  
  class ${moduleName}Entity {
    +id: string
    +name: string
    +createdAt: Date
    +updatedAt: Date
  }
  
  ${moduleName}Controller --> ${moduleName}Service: uses
  ${moduleName}Service --> ${moduleName}Repository: uses
  ${moduleName}Repository --> ${moduleName}Entity: manages
  ${moduleName}Module --> ${moduleName}Controller: provides
  ${moduleName}Module --> ${moduleName}Service: provides
  ${moduleName}Module --> ${moduleName}Repository: provides
  `;

  return generateMermaidDiagram({
    type: "classDiagram",
    title: `${moduleName} Module Structure`,
    adrNumber,
    content,
  });
}

/**
 * Generate a sequence diagram for a process flow
 */
function generateSequenceDiagram(
  adrNumber: number,
  title: string,
  actors: string[],
): string {
  let content = "sequenceDiagram\n";

  // Add actors
  actors.forEach((actor) => {
    content += `  participant ${actor}\n`;
  });

  content += "\n  %% Sequence flows\n";

  // Add some example flows (in a real implementation these would be based on actual processes)
  for (let i = 0; i < actors.length - 1; i++) {
    content += `  ${actors[i]}->>+${actors[i + 1]}: Request\n`;
    content += `  ${actors[i + 1]}-->>-${actors[i]}: Response\n`;
  }

  // Add some additional interactions
  if (actors.length > 2) {
    content += `\n  ${actors[0]}->>+${actors[2]}: Direct request\n`;
    content += `  ${actors[2]}-->>-${actors[0]}: Direct response\n`;
  }

  return generateMermaidDiagram({
    type: "sequenceDiagram",
    title: `${title} - Sequence Flow`,
    adrNumber,
    content,
  });
}

/**
 * Generate an ER diagram for a module's data model
 */
function generateERDiagram(moduleName: string, adrNumber: number): string {
  const content = `erDiagram
    ${moduleName} ||--o{ ${moduleName}Detail : contains
    ${moduleName} {
        string id PK
        string name
        date createdAt
        date updatedAt
        string status
    }
    ${moduleName}Detail {
        string id PK
        string ${moduleName.toLowerCase()}Id FK
        string value
        string description
    }
    Config ||--o{ ${moduleName} : configures
    Config {
        string id PK
        string key
        string value
    }
  `;

  return generateMermaidDiagram({
    type: "erDiagram",
    title: `${moduleName} Entity Relationships`,
    adrNumber,
    content,
  });
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
  Mermaid Diagram Generator for ADRs.

  Usage:
    node generate-mermaid.js <command> [options]
    
  Commands:
    flowchart             Generate a module dependency flowchart
    class-diagram         Generate a class diagram for a module
    sequence-diagram      Generate a sequence diagram
    er-diagram            Generate an ER diagram
    
  Options:
    --adr=<number>               ADR number (required)
    --title="<title>"            Title for the diagram
    --modules=<module1,module2>  Comma-separated list of modules
    --module=<module>            Single module name
    --actors=<actor1,actor2>     Comma-separated list of actors for sequence diagrams
    
  Examples:
    node generate-mermaid.js flowchart --adr=1 --title="Auth Module Dependencies" --modules=auth,users,feature-flags
    node generate-mermaid.js class-diagram --adr=2 --module=products
    node generate-mermaid.js sequence-diagram --adr=3 --title="Order Process" --actors=Client,OrderService,InventoryService,NotificationService
    node generate-mermaid.js er-diagram --adr=4 --module=inventory
  `);
}

/**
 * Parse command line arguments
 */
function parseArgs(): { command: string; options: Record<string, any> } | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help") {
    printUsage();
    return null;
  }

  const command = args[0];
  const options: Record<string, any> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--adr=")) {
      options.adr = parseInt(arg.substring(6), 10);
    } else if (arg.startsWith("--title=")) {
      options.title = arg.substring(8);
    } else if (arg.startsWith("--modules=")) {
      options.modules = arg.substring(10).split(",");
    } else if (arg.startsWith("--module=")) {
      options.module = arg.substring(9);
    } else if (arg.startsWith("--actors=")) {
      options.actors = arg.substring(9).split(",");
    }
  }

  return { command, options };
}

/**
 * Main function
 */
function main(): void {
  const args = parseArgs();
  if (!args) return;

  const { command, options } = args;

  try {
    switch (command) {
      case "flowchart":
        if (!options.adr || !options.modules) {
          console.error(
            "Error: Missing required options --adr and/or --modules",
          );
          printUsage();
          break;
        }
        const title = options.title || "Module Dependencies";
        const outputPath = generateModuleDependencyFlowchart(
          options.modules,
          options.adr,
          title,
        );
        console.log(`Generated flowchart: ${outputPath}`);
        break;

      case "class-diagram":
        if (!options.adr || !options.module) {
          console.error(
            "Error: Missing required options --adr and/or --module",
          );
          printUsage();
          break;
        }
        const classOutput = generateClassDiagram(options.module, options.adr);
        console.log(`Generated class diagram: ${classOutput}`);
        break;

      case "sequence-diagram":
        if (!options.adr || !options.actors) {
          console.error(
            "Error: Missing required options --adr and/or --actors",
          );
          printUsage();
          break;
        }
        const seqTitle = options.title || "Sequence Flow";
        const seqOutput = generateSequenceDiagram(
          options.adr,
          seqTitle,
          options.actors,
        );
        console.log(`Generated sequence diagram: ${seqOutput}`);
        break;

      case "er-diagram":
        if (!options.adr || !options.module) {
          console.error(
            "Error: Missing required options --adr and/or --module",
          );
          printUsage();
          break;
        }
        const erOutput = generateERDiagram(options.module, options.adr);
        console.log(`Generated ER diagram: ${erOutput}`);
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        printUsage();
    }
  } catch (error) {
    console.error("Error generating Mermaid diagram:", error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export {
  generateModuleDependencyFlowchart,
  generateClassDiagram,
  generateSequenceDiagram,
  generateERDiagram,
};
