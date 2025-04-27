/**
 * Integration Tests - Configuration
 *
 * This file contains the configuration for the integration tests.
 */

require("dotenv").config();
const path = require("path");

const config = {
  // Environment: dev, staging, or production
  environment: process.env.TEST_ENVIRONMENT || "dev",

  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || "http://localhost:3001",
    timeout: parseInt(process.env.API_TIMEOUT || "10000", 10),
  },

  // Authentication
  auth: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    apiKey: process.env.TEST_API_KEY,
  },

  // Test data
  testData: {
    organizationId: process.env.TEST_ORGANIZATION_ID,
    userId: process.env.TEST_USER_ID,
  },

  // Firestore configuration
  firestore: {
    projectId: process.env.GCP_PROJECT_ID,
    collectionPrefix: process.env.FIRESTORE_COLLECTION_PREFIX || "",
  },

  // Storage configuration
  storage: {
    bucketName: process.env.STORAGE_BUCKET_NAME,
    testFilesDir: path.join(__dirname, "test-files"),
  },

  // Test execution
  testExecution: {
    parallel: process.env.TEST_PARALLEL === "true",
    retries: parseInt(process.env.TEST_RETRIES || "2", 10),
    bail: process.env.TEST_BAIL === "true",
    timeout: parseInt(process.env.TEST_TIMEOUT || "30000", 10),
  },

  // Reporting
  reporting: {
    outputDir: path.join(__dirname, "reports"),
    screenshotsDir: path.join(__dirname, "reports", "screenshots"),
    video: process.env.TEST_VIDEO === "true",
  },

  // Feature flags for tests
  features: {
    skipSlowTests: process.env.SKIP_SLOW_TESTS === "true",
    skipNonCriticalTests: process.env.SKIP_NON_CRITICAL_TESTS === "true",
    loggingEnabled: process.env.DISABLE_LOGGING !== "true",
  },

  // Environment-specific configurations
  environments: {
    dev: {
      api: {
        baseUrl: process.env.DEV_API_BASE_URL || "https://api.dev.fluxori.com",
      },
      storage: {
        bucketName:
          process.env.DEV_STORAGE_BUCKET_NAME || "fluxori-dev-storage",
      },
      firestore: {
        collectionPrefix: "dev_",
      },
    },

    staging: {
      api: {
        baseUrl:
          process.env.STAGING_API_BASE_URL || "https://api.staging.fluxori.com",
      },
      storage: {
        bucketName:
          process.env.STAGING_STORAGE_BUCKET_NAME || "fluxori-staging-storage",
      },
      firestore: {
        collectionPrefix: "staging_",
      },
    },

    production: {
      api: {
        baseUrl: process.env.PROD_API_BASE_URL || "https://api.fluxori.com",
      },
      storage: {
        bucketName: process.env.PROD_STORAGE_BUCKET_NAME || "fluxori-storage",
      },
      firestore: {
        collectionPrefix: "",
      },
    },
  },
};

// Merge environment-specific configuration
if (config.environments[config.environment]) {
  Object.keys(config.environments[config.environment]).forEach((key) => {
    if (typeof config.environments[config.environment][key] === "object") {
      config[key] = {
        ...config[key],
        ...config.environments[config.environment][key],
      };
    } else {
      config[key] = config.environments[config.environment][key];
    }
  });
}

module.exports = config;
