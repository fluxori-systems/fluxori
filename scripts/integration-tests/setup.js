/**
 * Jest Setup File
 *
 * This file is run before each test file, setting up the test environment
 * and providing global utilities for tests.
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const config = require("./config");
const { Firestore } = require("@google-cloud/firestore");
const { Storage } = require("@google-cloud/storage");

// Create required directories
fs.ensureDirSync(config.reporting.outputDir);
fs.ensureDirSync(config.reporting.screenshotsDir);
fs.ensureDirSync(config.storage.testFilesDir);

// Configure longer timeout for all tests
jest.setTimeout(config.testExecution.timeout);

// Configure global axios instance
const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Global Auth token
let authToken = null;

// Setup Firestore
const firestore = new Firestore({
  projectId: config.firestore.projectId,
});

// Setup Storage
const storage = new Storage({
  projectId: config.firestore.projectId,
});

// Helper to get a collection reference with proper prefix
const getCollection = (collectionName) => {
  const prefixedName = `${config.firestore.collectionPrefix}${collectionName}`;
  return firestore.collection(prefixedName);
};

// Global test utilities
global.testUtils = {
  // API Helpers
  api,

  // Set auth token for subsequent requests
  setAuthToken: (token) => {
    authToken = token;
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },

  clearAuthToken: () => {
    authToken = null;
    delete api.defaults.headers.common["Authorization"];
  },

  // Authenticate using email/password
  authenticate: async () => {
    try {
      if (!config.auth.email || !config.auth.password) {
        throw new Error("Authentication credentials not provided");
      }

      const response = await api.post("/auth/login", {
        email: config.auth.email,
        password: config.auth.password,
      });

      const { token } = response.data;
      global.testUtils.setAuthToken(token);
      return token;
    } catch (error) {
      console.error(chalk.red("Authentication failed:"), error.message);
      throw error;
    }
  },

  // Firestore helpers
  firestore,
  getCollection,

  // Create a test document
  createTestDocument: async (collectionName, data) => {
    const collection = getCollection(collectionName);
    const docRef = await collection.add({
      ...data,
      _testData: true,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...data };
  },

  // Clean up test documents
  cleanupTestDocuments: async (collectionName) => {
    const collection = getCollection(collectionName);
    const snapshot = await collection.where("_testData", "==", true).get();

    const deletions = [];
    snapshot.forEach((doc) => {
      deletions.push(doc.ref.delete());
    });

    await Promise.all(deletions);
    return deletions.length;
  },

  // Storage helpers
  storage,
  bucket: (name = config.storage.bucketName) => storage.bucket(name),

  // Upload a test file
  uploadTestFile: async (fileName, destination) => {
    const filePath = path.join(config.storage.testFilesDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }

    const bucket = storage.bucket(config.storage.bucketName);
    await bucket.upload(filePath, {
      destination: destination || fileName,
      metadata: {
        metadata: {
          _testData: "true",
        },
      },
    });

    return `gs://${config.storage.bucketName}/${destination || fileName}`;
  },

  // Clean up test files
  cleanupTestFiles: async () => {
    const bucket = storage.bucket(config.storage.bucketName);
    const [files] = await bucket.getFiles({
      prefix: "test/",
    });

    const deletions = [];
    for (const file of files) {
      if (
        file.metadata &&
        file.metadata.metadata &&
        file.metadata.metadata._testData === "true"
      ) {
        deletions.push(file.delete());
      }
    }

    await Promise.all(deletions);
    return deletions.length;
  },

  // Testing utilities
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  randomId: () => Math.random().toString(36).substring(2, 15),
};

// Global before all hook
beforeAll(async () => {
  console.log(chalk.blue(`Running tests in ${config.environment} environment`));
  console.log(chalk.blue(`API URL: ${config.api.baseUrl}`));

  if (config.features.skipSlowTests) {
    console.log(chalk.yellow("Skipping slow tests"));
  }

  if (config.features.skipNonCriticalTests) {
    console.log(chalk.yellow("Skipping non-critical tests"));
  }

  // Try to authenticate if credentials are provided
  if (config.auth.email && config.auth.password) {
    try {
      await global.testUtils.authenticate();
      console.log(chalk.green("Authentication successful"));
    } catch (error) {
      console.warn(
        chalk.yellow(
          "Pre-test authentication failed, tests may fail if they require auth",
        ),
      );
    }
  } else {
    console.warn(
      chalk.yellow(
        "No authentication credentials provided, tests requiring auth may fail",
      ),
    );
  }
});

// Global after all hook
afterAll(async () => {
  console.log(chalk.blue("Cleaning up test data..."));
  try {
    // Clean up any test documents
    await global.testUtils.cleanupTestDocuments("test_data");

    // Clean up any test files
    await global.testUtils.cleanupTestFiles();

    console.log(chalk.green("Cleanup complete"));
  } catch (error) {
    console.error(chalk.red("Error during cleanup:"), error.message);
  }
});
