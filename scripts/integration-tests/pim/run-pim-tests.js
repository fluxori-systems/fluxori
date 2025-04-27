#!/usr/bin/env node

/**
 * PIM Integration Tests Runner
 *
 * This script runs the PIM module integration tests with marketplace connectors,
 * performance tests, and South African market-specific tests.
 *
 * Usage:
 *   node run-pim-tests.js [options]
 *
 * Options:
 *   --marketplace        Run marketplace integration tests
 *   --performance        Run performance tests
 *   --sa                 Run South African specific tests
 *   --full               Run all test suites
 *   --skip-cleanup       Skip test data cleanup after tests
 *   --load-shedding      Enable load shedding tests (disabled by default)
 *   --network            Enable network condition tests (disabled by default)
 *   --help               Show help
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  marketplace: args.includes("--marketplace") || args.includes("--full"),
  performance: args.includes("--performance") || args.includes("--full"),
  sa: args.includes("--sa") || args.includes("--full"),
  skipCleanup: args.includes("--skip-cleanup"),
  loadShedding: args.includes("--load-shedding"),
  network: args.includes("--network"),
  help: args.includes("--help"),
};

// Show help if requested
if (options.help || args.length === 0) {
  console.log(`
PIM Integration Tests Runner

This script runs the PIM module integration tests with marketplace connectors, 
performance tests, and South African market-specific tests.

Usage:
  node run-pim-tests.js [options]

Options:
  --marketplace        Run marketplace integration tests
  --performance        Run performance tests
  --sa                 Run South African specific tests
  --full               Run all test suites
  --skip-cleanup       Skip test data cleanup after tests
  --load-shedding      Enable load shedding tests (disabled by default)
  --network            Enable network condition tests (disabled by default)
  --help               Show help
  `);
  process.exit(0);
}

// Define test files
const TEST_FILES = {
  marketplace: path.join(__dirname, "pim-marketplace-integration.test.js"),
  performance: path.join(__dirname, "pim-performance.test.js"),
  sa: path.join(__dirname, "south-african-marketplace.test.js"),
};

// Verify test files exist
Object.entries(TEST_FILES).forEach(([key, file]) => {
  if (!fs.existsSync(file)) {
    console.error(`Error: Test file not found: ${file}`);
    process.exit(1);
  }
});

// Set environment variables for special tests
const env = {
  ...process.env,
  RUN_LOAD_SHEDDING_TESTS: options.loadShedding ? "true" : "false",
  RUN_NETWORK_TESTS: options.network ? "true" : "false",
  SKIP_CLEANUP: options.skipCleanup ? "true" : "false",
};

// Run the tests
console.log("========================================");
console.log("PIM INTEGRATION TESTS");
console.log("========================================");
console.log("Options:");
console.log(
  `  Marketplace Tests:      ${options.marketplace ? "Enabled" : "Disabled"}`,
);
console.log(
  `  Performance Tests:      ${options.performance ? "Enabled" : "Disabled"}`,
);
console.log(`  South African Tests:    ${options.sa ? "Enabled" : "Disabled"}`);
console.log(
  `  Load Shedding Tests:    ${options.loadShedding ? "Enabled" : "Disabled"}`,
);
console.log(
  `  Network Condition Tests: ${options.network ? "Enabled" : "Disabled"}`,
);
console.log(
  `  Skip Cleanup:           ${options.skipCleanup ? "Enabled" : "Disabled"}`,
);
console.log("========================================");

// Timestamp for logs
const timestamp = new Date()
  .toISOString()
  .replace(/:/g, "-")
  .replace(/\..+/, "");
const logDir = path.join(__dirname, "../reports");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Run tests based on options
try {
  if (options.marketplace) {
    console.log("\nRunning PIM-Marketplace Integration Tests...");
    const logFile = path.join(logDir, `marketplace-${timestamp}.log`);
    console.log(`Logging to ${logFile}`);

    execSync(
      `npx jest ${TEST_FILES.marketplace} --forceExit --detectOpenHandles --json`,
      {
        stdio: "inherit",
        env,
      },
    );

    console.log("\nPIM-Marketplace Integration Tests completed successfully");
  }

  if (options.sa) {
    console.log("\nRunning South African Marketplace Tests...");
    const logFile = path.join(logDir, `sa-marketplace-${timestamp}.log`);
    console.log(`Logging to ${logFile}`);

    execSync(
      `npx jest ${TEST_FILES.sa} --forceExit --detectOpenHandles --json`,
      {
        stdio: "inherit",
        env,
      },
    );

    console.log("\nSouth African Marketplace Tests completed successfully");
  }

  if (options.performance) {
    console.log("\nRunning PIM Performance Tests...");
    console.log("These tests may take some time to complete...");
    const logFile = path.join(logDir, `performance-${timestamp}.log`);
    console.log(`Logging to ${logFile}`);

    execSync(
      `npx jest ${TEST_FILES.performance} --forceExit --detectOpenHandles --testTimeout=300000 --json`,
      {
        stdio: "inherit",
        env,
      },
    );

    console.log("\nPIM Performance Tests completed successfully");
  }

  console.log("\nAll requested PIM integration tests completed successfully");
} catch (error) {
  console.error("\nSome tests failed. Check the logs for details.");
  process.exit(1);
}
