const fs = require("fs");
const path = require("path");

// Function to analyze module dependencies in backend
function analyzeBackendModules() {
  const modulesDir = path.resolve(__dirname, "../backend/src/modules");
  const modules = fs
    .readdirSync(modulesDir)
    .filter((file) => fs.statSync(path.join(modulesDir, file)).isDirectory());

  console.log(`Found ${modules.length} modules in backend:`);
  console.log(modules.join(", "));

  // Module dependencies mapping
  const dependencies = {};

  // Initialize dependencies structure
  modules.forEach((module) => {
    dependencies[module] = {
      dependsOn: [],
      importedBy: [],
    };
  });

  // Analyze each module's index.ts to find dependencies
  modules.forEach((module) => {
    try {
      const indexPath = path.join(modulesDir, module, "index.ts");
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, "utf8");

        // Find import statements
        const importRegex =
          /import\s+(?:(?:[{}\s\w*,]+from\s+)?["']\.\.\/([^"'\/]+))/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          const importedModule = match[1];

          // Only consider other modules
          if (modules.includes(importedModule) && importedModule !== module) {
            dependencies[module].dependsOn.push(importedModule);
            dependencies[importedModule].importedBy.push(module);
          }
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${module}/index.ts:`, error.message);
    }
  });

  // Print results
  console.log("\nModule Dependencies:");
  modules.forEach((module) => {
    console.log(`\n${module}:`);
    console.log(
      `  Depends on: ${dependencies[module].dependsOn.join(", ") || "none"}`,
    );
    console.log(
      `  Imported by: ${dependencies[module].importedBy.join(", ") || "none"}`,
    );
  });

  // Generate DOT graph
  generateDotGraph(modules, dependencies);

  return { modules, dependencies };
}

// Generate DOT graph for visualization
function generateDotGraph(modules, dependencies) {
  let dot = "digraph ModuleDependencies {\n";
  dot += '  rankdir="TB";\n';
  dot += "  node [shape=box, style=filled, fillcolor=lightblue];\n\n";

  // Add all modules as nodes
  modules.forEach((module) => {
    dot += `  "${module}" [label="${module}"];\n`;
  });

  dot += "\n";

  // Add dependencies as edges
  modules.forEach((module) => {
    dependencies[module].dependsOn.forEach((dep) => {
      dot += `  "${module}" -> "${dep}";\n`;
    });
  });

  dot += "}\n";

  // Save to file
  const outputPath = path.resolve(
    __dirname,
    "../backend/module-dependencies.dot",
  );
  fs.writeFileSync(outputPath, dot);
  console.log(`\nDOT graph saved to ${outputPath}`);
}

// Analyze frontend module dependencies
function analyzeFrontendModules() {
  const componentsDir = path.resolve(__dirname, "../frontend/src/components");
  const libDir = path.resolve(__dirname, "../frontend/src/lib");

  // Map component and lib dependencies
  const frontendReport = {
    components: [],
    libs: [],
    dependencies: {},
  };

  // Get components
  if (fs.existsSync(componentsDir)) {
    const components = fs
      .readdirSync(componentsDir)
      .filter((file) =>
        fs.statSync(path.join(componentsDir, file)).isDirectory(),
      );

    console.log(`\nFound ${components.length} component groups in frontend:`);
    console.log(components.join(", "));

    frontendReport.components = components;
  }

  // Get lib modules
  if (fs.existsSync(libDir)) {
    const libs = fs
      .readdirSync(libDir)
      .filter((file) => fs.statSync(path.join(libDir, file)).isDirectory());

    console.log(`\nFound ${libs.length} library modules in frontend:`);
    console.log(libs.join(", "));

    frontendReport.libs = libs;
  }

  // Generate a simplified dot for frontend
  generateFrontendDot(frontendReport);

  return frontendReport;
}

// Generate a simplified DOT for frontend
function generateFrontendDot(frontendReport) {
  let dot = "digraph FrontendModules {\n";
  dot += '  rankdir="TB";\n';
  dot += "  node [shape=box, style=filled];\n\n";

  // Add lib nodes
  frontendReport.libs.forEach((lib) => {
    dot += `  "${lib}" [label="${lib}", fillcolor=lightblue];\n`;
  });

  // Add component nodes
  frontendReport.components.forEach((component) => {
    dot += `  "${component}" [label="${component}", fillcolor=lightgreen];\n`;
  });

  // Add some basic edges (simplified)
  if (
    frontendReport.libs.includes("ui") &&
    frontendReport.libs.includes("shared")
  ) {
    dot += '  "ui" -> "shared";\n';
  }

  if (
    frontendReport.libs.includes("motion") &&
    frontendReport.libs.includes("shared")
  ) {
    dot += '  "motion" -> "shared";\n';
  }

  // Add component to lib dependencies (simplified)
  frontendReport.components.forEach((component) => {
    if (component === "pim" && frontendReport.libs.includes("ui")) {
      dot += `  "${component}" -> "ui";\n`;
    }
  });

  dot += "}\n";

  // Save to file
  const outputPath = path.resolve(
    __dirname,
    "../frontend/module-dependencies.dot",
  );
  fs.writeFileSync(outputPath, dot);
  console.log(`\nFrontend DOT graph saved to ${outputPath}`);
}

// Convert DOT files to SVG
function convertDotToSvg() {
  const { exec } = require("child_process");

  const backendDot = path.resolve(
    __dirname,
    "../backend/module-dependencies.dot",
  );
  const frontendDot = path.resolve(
    __dirname,
    "../frontend/module-dependencies.dot",
  );

  if (fs.existsSync(backendDot)) {
    const backendSvg = backendDot.replace(".dot", ".svg");
    exec(`dot -Tsvg ${backendDot} -o ${backendSvg}`, (error) => {
      if (error) {
        console.error("Error generating backend SVG:", error.message);
      } else {
        console.log(`Backend SVG saved to ${backendSvg}`);
      }
    });
  }

  if (fs.existsSync(frontendDot)) {
    const frontendSvg = frontendDot.replace(".dot", ".svg");
    exec(`dot -Tsvg ${frontendDot} -o ${frontendSvg}`, (error) => {
      if (error) {
        console.error("Error generating frontend SVG:", error.message);
      } else {
        console.log(`Frontend SVG saved to ${frontendSvg}`);
      }
    });
  }
}

// Main execution
console.log("Analyzing module dependencies...");
const backendAnalysis = analyzeBackendModules();
const frontendAnalysis = analyzeFrontendModules();
convertDotToSvg();

// Save full analysis as JSON
const fullAnalysis = {
  backend: backendAnalysis,
  frontend: frontendAnalysis,
};

const jsonOutputPath = path.resolve(__dirname, "../module-analysis.json");
fs.writeFileSync(jsonOutputPath, JSON.stringify(fullAnalysis, null, 2));
console.log(`\nFull analysis saved to ${jsonOutputPath}`);
