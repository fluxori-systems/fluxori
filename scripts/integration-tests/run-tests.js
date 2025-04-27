/**
 * Integration Tests - Runner
 *
 * This script runs the integration tests with various configuration options.
 */

const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { Command } = require("commander");

// Load config
const config = require("./config");

// Initialize command-line option parser
const program = new Command();

program
  .name("run-tests")
  .description("Run integration tests for the Fluxori platform")
  .option(
    "-e, --env <environment>",
    "Environment to test (dev, staging, production)",
    "dev",
  )
  .option("-s, --scenario <scenario>", "Specific test scenario to run")
  .option("-p, --path <path>", "Specific test path to run")
  .option("-t, --tag <tag>", "Run tests with specific tag")
  .option(
    "-d, --duration <duration>",
    "Test duration (short, medium, long)",
    "medium",
  )
  .option("--skip-slow", "Skip slow tests", false)
  .option("--skip-non-critical", "Skip non-critical tests", false)
  .option("--ci", "Run in CI mode", false)
  .option(
    "--parallel <count>",
    "Run tests in parallel with specified number of workers",
  )
  .option("--bail", "Stop running tests after the first failure", false)
  .option("--no-cleanup", "Do not clean up test data after tests", false)
  .option("--verbose", "Enable verbose output", false);

program.parse(process.argv);
const options = program.opts();

// Process options
const environment = options.env;
const cleanup = options.cleanup;
const verbose = options.verbose;
const ciMode = options.ci;
const bail = options.bail;

// Determine test path
let testPath = options.path;

if (!testPath && options.scenario) {
  // Map scenario to test path
  const scenarioMap = {
    auth: "auth",
    storage: "storage",
    inventory: "inventory",
    orders: "e2e/order-workflow.test.js",
    ai: "ai-insights",
    e2e: "e2e",
  };

  testPath = scenarioMap[options.scenario];

  if (!testPath) {
    console.error(chalk.red(`Unknown scenario: ${options.scenario}`));
    console.log(
      chalk.yellow(
        "Available scenarios: auth, storage, inventory, orders, ai, e2e",
      ),
    );
    process.exit(1);
  }
}

// Determine skip settings based on duration
if (options.duration === "short") {
  process.env.SKIP_SLOW_TESTS = "true";
  process.env.SKIP_NON_CRITICAL_TESTS = "true";
} else if (options.duration === "medium") {
  process.env.SKIP_SLOW_TESTS = "true";
  process.env.SKIP_NON_CRITICAL_TESTS = "false";
} else if (options.duration === "long") {
  process.env.SKIP_SLOW_TESTS = "false";
  process.env.SKIP_NON_CRITICAL_TESTS = "false";
}

// Override with explicit options
if (options.skipSlow) {
  process.env.SKIP_SLOW_TESTS = "true";
}

if (options.skipNonCritical) {
  process.env.SKIP_NON_CRITICAL_TESTS = "true";
}

// Set environment variables
process.env.TEST_ENVIRONMENT = environment;
process.env.TEST_BAIL = bail ? "true" : "false";
process.env.DISABLE_LOGGING = !verbose ? "true" : "false";

if (options.parallel) {
  process.env.TEST_PARALLEL = "true";
}

// Build Jest command
let jestCommand = "jest";

if (testPath) {
  jestCommand += ` ${testPath}`;
}

if (options.tag) {
  jestCommand += ` -t "${options.tag}"`;
}

if (ciMode) {
  jestCommand += " --ci --reporters=default --reporters=jest-junit";
}

if (options.parallel && !isNaN(parseInt(options.parallel))) {
  jestCommand += ` --maxWorkers=${options.parallel}`;
}

if (bail) {
  jestCommand += " --bail";
}

if (verbose) {
  jestCommand += " --verbose";
}

if (!cleanup) {
  process.env.SKIP_CLEANUP = "true";
}

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, "reports");
fs.ensureDirSync(reportsDir);

// Show configuration
console.log(chalk.blue("Running integration tests with configuration:"));
console.log(chalk.blue(`Environment: ${chalk.yellow(environment)}`));
console.log(chalk.blue(`Test path: ${chalk.yellow(testPath || "all")}`));
console.log(
  chalk.blue(
    `Skip slow tests: ${chalk.yellow(process.env.SKIP_SLOW_TESTS === "true")}`,
  ),
);
console.log(
  chalk.blue(
    `Skip non-critical tests: ${chalk.yellow(process.env.SKIP_NON_CRITICAL_TESTS === "true")}`,
  ),
);
console.log(chalk.blue(`Cleanup: ${chalk.yellow(cleanup)}`));
console.log(chalk.blue(`Command: ${chalk.yellow(jestCommand)}`));
console.log("");

// Run the tests
try {
  console.log(chalk.green("Starting tests..."));
  execSync(jestCommand, { stdio: "inherit" });
  console.log(chalk.green("All tests completed successfully"));

  // Generate HTML report if in CI mode
  if (ciMode) {
    try {
      console.log(chalk.blue("Generating HTML report..."));
      execSync("node generate-report.js", { stdio: "inherit" });
    } catch (error) {
      console.error(chalk.yellow("Warning: Failed to generate HTML report"));
    }
  }

  process.exit(0);
} catch (error) {
  console.error(chalk.red("Tests failed"));
  process.exit(1);
}
