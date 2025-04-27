#!/usr/bin/env node

/**
 * This script sets up TypeScript validation tools for the project
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Paths
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");
const FRONTEND_PACKAGE_JSON = path.join(FRONTEND_DIR, "package.json");
const ESLINT_CONFIG = path.join(FRONTEND_DIR, ".eslintrc.json");

// Add scripts to package.json
function updatePackageJson() {
  console.log("Updating package.json scripts...");

  const packageJson = JSON.parse(
    fs.readFileSync(FRONTEND_PACKAGE_JSON, "utf8"),
  );

  // Add or update scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    typecheck: "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "lint-ts": "eslint --config .eslintrc.custom.json 'src/**/*.{ts,tsx}'",
    "ts-error-report": "node ../scripts/typescript-error-report.js",
    precommit: "npm run typecheck && npm run lint-ts",
  };

  fs.writeFileSync(FRONTEND_PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
  console.log("✅ package.json updated with TypeScript validation scripts");
}

// Update ESLint config to include Mantine plugin
function updateEslintConfig() {
  console.log("Updating ESLint configuration...");

  if (fs.existsSync(ESLINT_CONFIG)) {
    const config = JSON.parse(fs.readFileSync(ESLINT_CONFIG, "utf8"));

    // Add mantine plugin if not already present
    if (!config.plugins) {
      config.plugins = [];
    }

    if (!config.plugins.includes("mantine")) {
      config.plugins.push("mantine");
    }

    // Add mantine rules
    if (!config.rules) {
      config.rules = {};
    }

    config.rules["mantine/no-deprecated-props"] = "error";
    config.rules["mantine/enforce-client-directive"] = "error";

    fs.writeFileSync(ESLINT_CONFIG, JSON.stringify(config, null, 2));
    console.log("✅ ESLint config updated with Mantine plugin");
  } else {
    console.log("⚠️ ESLint config not found, skipping update");
  }
}

// Install required dev dependencies
function installDependencies() {
  console.log("Installing required development dependencies...");

  // These are the packages needed for TypeScript validation
  const devDependencies = [
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint",
    "typescript",
  ];

  try {
    execSync(
      `cd ${FRONTEND_DIR} && npm install --save-dev ${devDependencies.join(" ")}`,
      {
        stdio: "inherit",
      },
    );
    console.log("✅ Dependencies installed");
  } catch (error) {
    console.error("❌ Failed to install dependencies:", error.message);
  }
}

// Register the custom ESLint plugin
function setupEslintPlugin() {
  console.log("Setting up Mantine ESLint plugin...");

  try {
    execSync(`cd ${FRONTEND_DIR} && npm link ./eslint-plugin-mantine`, {
      stdio: "inherit",
    });
    console.log("✅ Mantine ESLint plugin linked");
  } catch (error) {
    console.error("❌ Failed to link Mantine ESLint plugin:", error.message);
  }
}

// Run setup tasks
function run() {
  console.log("Setting up TypeScript validation tools...");

  updatePackageJson();
  updateEslintConfig();
  installDependencies();
  setupEslintPlugin();

  console.log("\n✅ TypeScript validation tools setup complete!");
  console.log("\nAvailable commands:");
  console.log("  npm run typecheck         - Check for TypeScript errors");
  console.log("  npm run typecheck:watch   - Watch for TypeScript errors");
  console.log("  npm run lint-ts           - Run ESLint on TypeScript files");
  console.log(
    "  npm run ts-error-report   - Generate a TypeScript error report",
  );
}

// Execute the setup
run();
