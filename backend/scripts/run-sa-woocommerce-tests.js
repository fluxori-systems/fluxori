#!/usr/bin/env node

/**
 * South African WooCommerce Store Test Runner CLI
 *
 * This script provides a command-line interface for running comprehensive
 * tests against South African WooCommerce stores, validating the WooCommerce
 * connector functionality in real-world conditions.
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

// Set up command line arguments
const args = process.argv.slice(2);
const command = args[0] || "help";

// Configuration file path
const configDir = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".fluxori",
);
const configFile = path.join(configDir, "sa-test-config.json");

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Default config template
const defaultConfig = {
  stores: [
    {
      id: "example-store",
      name: "Example Test Store",
      location: "Western Cape",
      credentials: {
        storeUrl: "https://example-store.co.za",
        apiKey: "YOUR_API_KEY",
        apiSecret: "YOUR_API_SECRET",
      },
      multiWarehouse: true,
    },
  ],
};

/**
 * Display help information
 */
function showHelp() {
  console.log("\nSouth African WooCommerce Store Test Runner");
  console.log("==========================================\n");
  console.log("Usage:");
  console.log("  run-sa-woocommerce-tests [command]\n");
  console.log("Available Commands:");
  console.log("  help                   Show this help message");
  console.log("  run                    Run all tests");
  console.log("  run-category [name]    Run a specific test category");
  console.log("  run-load-shedding      Run load shedding specific tests");
  console.log("  run-multi-warehouse    Run multi-warehouse specific tests");
  console.log("  init-config            Initialize configuration file");
  console.log("  edit-config            Edit configuration file");
  console.log("  show-report            Open the latest test report");
  console.log("\nExamples:");
  console.log("  run-sa-woocommerce-tests run");
  console.log('  run-sa-woocommerce-tests run-category "Network Resilience"');
  console.log("  run-sa-woocommerce-tests init-config");
  process.exit(0);
}

/**
 * Initialize configuration file
 */
function initConfig() {
  if (fs.existsSync(configFile)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "Configuration file already exists. Overwrite? (y/N): ",
      (answer) => {
        if (answer.toLowerCase() === "y") {
          writeConfig();
          rl.close();
        } else {
          console.log("Operation cancelled.");
          rl.close();
          process.exit(0);
        }
      },
    );
  } else {
    writeConfig();
  }

  function writeConfig() {
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
    console.log(`Configuration file initialized at: ${configFile}`);
    console.log(
      "Please edit this file to add your South African WooCommerce store credentials.",
    );
    process.exit(0);
  }
}

/**
 * Edit configuration file
 */
function editConfig() {
  if (!fs.existsSync(configFile)) {
    console.log("Configuration file does not exist. Creating it first...");
    writeConfig();
  }

  // Open the config file with the default editor
  const editor = process.env.EDITOR || "vi";
  const child = spawn(editor, [configFile], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code === 0) {
      console.log("Configuration updated successfully.");
    } else {
      console.log(`Editor exited with code ${code}`);
    }
    process.exit(code);
  });
}

/**
 * Run the TypeScript test runner
 */
function runTests(args = []) {
  console.log("Compiling TypeScript...");

  // Check if the test runner is already built
  const jsRunnerPath = path.join(
    __dirname,
    "../dist/modules/connectors/test/woocommerce-sa-test-runner.js",
  );
  const needsCompile = !fs.existsSync(jsRunnerPath);

  if (needsCompile) {
    // Compile the project first
    const tsc = spawn(
      "npx",
      ["tsc", "-p", path.join(__dirname, "../tsconfig.json")],
      {
        stdio: "inherit",
      },
    );

    tsc.on("exit", (code) => {
      if (code === 0) {
        console.log("TypeScript compilation successful.");
        runNode();
      } else {
        console.error("TypeScript compilation failed.");
        process.exit(code);
      }
    });
  } else {
    runNode();
  }

  function runNode() {
    console.log("Running South African WooCommerce tests...");

    const nodePath = process.execPath;
    const runner = path.join(
      __dirname,
      "../dist/modules/connectors/test/woocommerce-sa-test-runner.js",
    );
    const testProcess = spawn(nodePath, [runner, ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        SA_TEST_MODE: "true",
      },
    });

    testProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("Tests completed successfully!");
        console.log("Test report generated at: sa-test-report.html");

        // Try to open the report if supported
        if (process.platform === "darwin") {
          spawn("open", ["sa-test-report.html"]);
        } else if (process.platform === "win32") {
          spawn("cmd", ["/c", "start", "sa-test-report.html"]);
        } else if (process.platform === "linux") {
          spawn("xdg-open", ["sa-test-report.html"]);
        }
      } else {
        console.error(`Tests failed with code ${code}`);
      }
      process.exit(code);
    });
  }
}

/**
 * Show the latest test report
 */
function showReport() {
  const reportPath = path.join(process.cwd(), "sa-test-report.html");

  if (!fs.existsSync(reportPath)) {
    console.error(
      "No test report found. Run tests first to generate a report.",
    );
    process.exit(1);
  }

  console.log(`Opening test report: ${reportPath}`);

  // Try to open the report with the default browser
  if (process.platform === "darwin") {
    spawn("open", [reportPath], { stdio: "inherit" });
  } else if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", reportPath], { stdio: "inherit" });
  } else if (process.platform === "linux") {
    spawn("xdg-open", [reportPath], { stdio: "inherit" });
  } else {
    console.log(`Report available at: ${reportPath}`);
  }

  process.exit(0);
}

// Process commands
switch (command) {
  case "help":
    showHelp();
    break;

  case "run":
    runTests(["--all"]);
    break;

  case "run-category":
    const category = args[1];
    if (!category) {
      console.error("Error: Category name required");
      console.log("Available categories:");
      console.log("  - Authentication & Connection");
      console.log("  - Product Management");
      console.log("  - Order Management");
      console.log("  - Stock & Inventory");
      console.log("  - Network Resilience");
      console.log("  - South African Specific Features");
      console.log("  - Performance");
      process.exit(1);
    }
    runTests(["--category", category]);
    break;

  case "run-load-shedding":
    runTests(["--load-shedding"]);
    break;

  case "run-multi-warehouse":
    runTests(["--multi-warehouse"]);
    break;

  case "init-config":
    initConfig();
    break;

  case "edit-config":
    editConfig();
    break;

  case "show-report":
    showReport();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    break;
}
