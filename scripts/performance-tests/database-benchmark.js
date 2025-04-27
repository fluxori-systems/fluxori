/**
 * Firestore Database Performance Benchmark
 *
 * This script runs comprehensive benchmarks for Firestore operations
 * to measure performance and help with optimization. It focuses on read,
 * write, query, and transaction operations with various collection sizes.
 */

const admin = require("firebase-admin");
const { Firestore } = require("@google-cloud/firestore");
const { performance, PerformanceObserver } = require("perf_hooks");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// Load configuration
const config = require("./config");
const args = process.argv.slice(2);
const env =
  args.find((arg) => arg.startsWith("--env="))?.split("=")[1] ||
  config.defaultEnvironment;

// Check if credentials file exists
let keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyFilePath) {
  keyFilePath = path.join(
    __dirname,
    `../../credentials/${env}-service-account.json`,
  );
  if (!fs.existsSync(keyFilePath)) {
    console.error(
      chalk.red(`Error: Service account key file not found at ${keyFilePath}`),
    );
    console.error(
      chalk.yellow(
        "Please set GOOGLE_APPLICATION_CREDENTIALS environment variable or provide credentials file",
      ),
    );
    process.exit(1);
  }
}

// Initialize Firestore
const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID || `fluxori-${env}`,
  keyFilename: keyFilePath,
});

// Initialize Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(keyFilePath),
  });
} catch (error) {
  console.error(chalk.red("Error initializing Firebase Admin SDK:"), error);
  process.exit(1);
}

// Create results directory
const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Performance measurement
const perfObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
  });
});

perfObserver.observe({ entryTypes: ["measure"] });

/**
 * Runs a read benchmark on a collection
 * @param {string} collection - Collection name
 * @param {number} samples - Number of samples
 * @param {boolean} useCache - Whether to use cache
 */
async function runReadBenchmark(collection, samples = 100, useCache = true) {
  console.log(
    chalk.cyan(
      `\nRunning read benchmark on ${collection} (${samples} reads, cache: ${useCache})`,
    ),
  );

  // Get sample documents first
  const snapshot = await firestore.collection(collection).limit(20).get();
  const docIds = snapshot.docs.map((doc) => doc.id);

  if (docIds.length === 0) {
    console.log(chalk.yellow(`No documents found in ${collection}`));
    return null;
  }

  // Start timing
  performance.mark("read-start");

  // Run read operations
  for (let i = 0; i < samples; i++) {
    const docId = docIds[i % docIds.length];
    await firestore
      .collection(collection)
      .doc(docId)
      .get({
        source: useCache ? "default" : "server",
      });
  }

  // End timing
  performance.mark("read-end");
  performance.measure("Read Operations", "read-start", "read-end");

  const duration = performance.getEntriesByName("Read Operations")[0].duration;
  const result = {
    operation: "read",
    collection,
    samples,
    useCache,
    totalTimeMs: duration,
    operationsPerSecond: (samples / (duration / 1000)).toFixed(2),
    averageLatencyMs: (duration / samples).toFixed(2),
  };

  console.log(
    chalk.green(
      `Read benchmark completed: ${result.operationsPerSecond} ops/sec, avg latency: ${result.averageLatencyMs}ms`,
    ),
  );

  return result;
}

/**
 * Runs a write benchmark on a collection
 * @param {string} collection - Collection name
 * @param {number} samples - Number of samples
 */
async function runWriteBenchmark(collection, samples = 100) {
  console.log(
    chalk.cyan(
      `\nRunning write benchmark on ${collection}_test (${samples} writes)`,
    ),
  );

  // Test data
  const testData = {
    name: "Performance Test",
    value: "test-value",
    timestamp: Firestore.Timestamp.now(),
    attributes: {
      region: "africa-south1",
      testId: `benchmark-${Date.now()}`,
    },
  };

  // Use a test collection to avoid polluting real data
  const testCollection = `${collection}_test`;

  // Start timing
  performance.mark("write-start");

  // Use batched writes for efficiency
  const batchSize = 500; // Firestore batch size limit
  const batches = Math.ceil(samples / batchSize);

  for (let b = 0; b < batches; b++) {
    const batch = firestore.batch();
    const iterationCount = Math.min(batchSize, samples - b * batchSize);

    for (let i = 0; i < iterationCount; i++) {
      const docRef = firestore.collection(testCollection).doc();
      batch.set(docRef, {
        ...testData,
        index: b * batchSize + i,
      });
    }

    await batch.commit();
  }

  // End timing
  performance.mark("write-end");
  performance.measure("Write Operations", "write-start", "write-end");

  const duration = performance.getEntriesByName("Write Operations")[0].duration;
  const result = {
    operation: "write",
    collection: testCollection,
    samples,
    totalTimeMs: duration,
    operationsPerSecond: (samples / (duration / 1000)).toFixed(2),
    averageLatencyMs: (duration / samples).toFixed(2),
  };

  console.log(
    chalk.green(
      `Write benchmark completed: ${result.operationsPerSecond} ops/sec, avg latency: ${result.averageLatencyMs}ms`,
    ),
  );

  return result;
}

/**
 * Runs a query benchmark on a collection
 * @param {string} collection - Collection name
 * @param {number} samples - Number of samples
 */
async function runQueryBenchmark(collection, samples = 50) {
  console.log(
    chalk.cyan(
      `\nRunning query benchmark on ${collection} (${samples} queries)`,
    ),
  );

  // Start timing
  performance.mark("query-start");

  // Run different types of queries
  const queryTypes = [
    "simple-filter",
    "compound-filter",
    "order-limit",
    "aggregation",
  ];

  const queriesPerType = Math.ceil(samples / queryTypes.length);

  // Run simple filter queries
  for (let i = 0; i < queriesPerType; i++) {
    await firestore
      .collection(collection)
      .where("isActive", "==", true)
      .limit(20)
      .get();
  }

  // Run compound filter queries
  for (let i = 0; i < queriesPerType; i++) {
    await firestore
      .collection(collection)
      .where("isActive", "==", true)
      .where(
        "timestamp",
        ">",
        Firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000),
      )
      .limit(20)
      .get();
  }

  // Run ordered queries with limit
  for (let i = 0; i < queriesPerType; i++) {
    await firestore
      .collection(collection)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();
  }

  // Run more complex queries (if collection has necessary fields)
  try {
    for (let i = 0; i < queriesPerType; i++) {
      // Try to run a more complex query
      await firestore
        .collection(collection)
        .where("isActive", "==", true)
        .where("organizationId", "==", "test-org")
        .orderBy("timestamp", "desc")
        .limit(20)
        .get();
    }
  } catch (error) {
    // If this fails (e.g., missing fields or missing index), just continue
    console.log(
      chalk.yellow(`Skipping complex query due to error: ${error.message}`),
    );
  }

  // End timing
  performance.mark("query-end");
  performance.measure("Query Operations", "query-start", "query-end");

  const duration = performance.getEntriesByName("Query Operations")[0].duration;
  const result = {
    operation: "query",
    collection,
    samples,
    totalTimeMs: duration,
    operationsPerSecond: (samples / (duration / 1000)).toFixed(2),
    averageLatencyMs: (duration / samples).toFixed(2),
  };

  console.log(
    chalk.green(
      `Query benchmark completed: ${result.operationsPerSecond} ops/sec, avg latency: ${result.averageLatencyMs}ms`,
    ),
  );

  return result;
}

/**
 * Runs a transaction benchmark on a collection
 * @param {string} collection - Collection name
 * @param {number} samples - Number of samples
 */
async function runTransactionBenchmark(collection, samples = 50) {
  console.log(
    chalk.cyan(
      `\nRunning transaction benchmark on ${collection}_test (${samples} transactions)`,
    ),
  );

  // Use a test collection to avoid polluting real data
  const testCollection = `${collection}_test`;

  // Create some documents to update
  const docIds = [];
  const batch = firestore.batch();

  for (let i = 0; i < Math.min(samples, 20); i++) {
    const docRef = firestore.collection(testCollection).doc();
    docIds.push(docRef.id);
    batch.set(docRef, {
      counter: 0,
      updatedAt: Firestore.Timestamp.now(),
    });
  }

  await batch.commit();

  // Start timing
  performance.mark("transaction-start");

  // Run transaction operations
  for (let i = 0; i < samples; i++) {
    const docId = docIds[i % docIds.length];

    await firestore.runTransaction(async (transaction) => {
      const docRef = firestore.collection(testCollection).doc(docId);
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        throw new Error(`Document ${docId} does not exist!`);
      }

      const newCounter = (doc.data().counter || 0) + 1;

      transaction.update(docRef, {
        counter: newCounter,
        updatedAt: Firestore.Timestamp.now(),
      });

      return newCounter;
    });
  }

  // End timing
  performance.mark("transaction-end");
  performance.measure(
    "Transaction Operations",
    "transaction-start",
    "transaction-end",
  );

  const duration = performance.getEntriesByName("Transaction Operations")[0]
    .duration;
  const result = {
    operation: "transaction",
    collection: testCollection,
    samples,
    totalTimeMs: duration,
    operationsPerSecond: (samples / (duration / 1000)).toFixed(2),
    averageLatencyMs: (duration / samples).toFixed(2),
  };

  console.log(
    chalk.green(
      `Transaction benchmark completed: ${result.operationsPerSecond} ops/sec, avg latency: ${result.averageLatencyMs}ms`,
    ),
  );

  return result;
}

/**
 * Runs all benchmarks
 */
async function runBenchmarks() {
  console.log(chalk.bold.green("Starting Firestore Performance Benchmarks"));
  console.log(chalk.bold.green("========================================"));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(
    chalk.blue(`Project ID: ${process.env.GCP_PROJECT_ID || `fluxori-${env}`}`),
  );
  console.log(chalk.blue(`Credentials: ${keyFilePath}`));
  console.log(chalk.bold.green("========================================\n"));

  // Get collections to test
  let collections = [
    "inventory_products",
    "orders",
    "users",
    "organizations",
    "marketplace_credentials",
    "ai_insights",
    "file_metadata",
  ];

  // Check if collections exist and have data
  const validCollections = [];
  for (const collection of collections) {
    try {
      const snapshot = await firestore.collection(collection).limit(1).get();
      if (!snapshot.empty) {
        validCollections.push(collection);
      } else {
        console.log(
          chalk.yellow(`Collection ${collection} is empty, skipping...`),
        );
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          `Error accessing collection ${collection}, skipping: ${error.message}`,
        ),
      );
    }
  }

  if (validCollections.length === 0) {
    console.error(
      chalk.red(
        "No valid collections found with data. Please populate the database first.",
      ),
    );
    process.exit(1);
  }

  // Define benchmarks
  const readSamples = 100;
  const writeSamples = 100;
  const querySamples = 50;
  const transactionSamples = 50;

  // Results collection
  const results = {
    environment: env,
    timestamp: new Date().toISOString(),
    collections: {},
  };

  // Run benchmarks for each collection
  for (const collection of validCollections) {
    console.log(
      chalk.magenta(`\n==== Benchmarking collection: ${collection} ====`),
    );
    results.collections[collection] = {};

    // Run read benchmarks
    results.collections[collection].read = await runReadBenchmark(
      collection,
      readSamples,
      true,
    );
    results.collections[collection].readUncached = await runReadBenchmark(
      collection,
      readSamples,
      false,
    );

    // Run write benchmarks
    results.collections[collection].write = await runWriteBenchmark(
      collection,
      writeSamples,
    );

    // Run query benchmarks
    results.collections[collection].query = await runQueryBenchmark(
      collection,
      querySamples,
    );

    // Run transaction benchmarks
    results.collections[collection].transaction = await runTransactionBenchmark(
      collection,
      transactionSamples,
    );
  }

  // Calculate overall stats
  const overallStats = {
    read: {
      totalOperations: validCollections.length * readSamples,
      averageOpsPerSecond:
        validCollections.reduce(
          (acc, col) =>
            acc + parseFloat(results.collections[col].read.operationsPerSecond),
          0,
        ) / validCollections.length,
      averageLatencyMs:
        validCollections.reduce(
          (acc, col) =>
            acc + parseFloat(results.collections[col].read.averageLatencyMs),
          0,
        ) / validCollections.length,
    },
    write: {
      totalOperations: validCollections.length * writeSamples,
      averageOpsPerSecond:
        validCollections.reduce(
          (acc, col) =>
            acc +
            parseFloat(results.collections[col].write.operationsPerSecond),
          0,
        ) / validCollections.length,
      averageLatencyMs:
        validCollections.reduce(
          (acc, col) =>
            acc + parseFloat(results.collections[col].write.averageLatencyMs),
          0,
        ) / validCollections.length,
    },
    query: {
      totalOperations: validCollections.length * querySamples,
      averageOpsPerSecond:
        validCollections.reduce(
          (acc, col) =>
            acc +
            parseFloat(results.collections[col].query.operationsPerSecond),
          0,
        ) / validCollections.length,
      averageLatencyMs:
        validCollections.reduce(
          (acc, col) =>
            acc + parseFloat(results.collections[col].query.averageLatencyMs),
          0,
        ) / validCollections.length,
    },
    transaction: {
      totalOperations: validCollections.length * transactionSamples,
      averageOpsPerSecond:
        validCollections.reduce(
          (acc, col) =>
            acc +
            parseFloat(
              results.collections[col].transaction.operationsPerSecond,
            ),
          0,
        ) / validCollections.length,
      averageLatencyMs:
        validCollections.reduce(
          (acc, col) =>
            acc +
            parseFloat(results.collections[col].transaction.averageLatencyMs),
          0,
        ) / validCollections.length,
    },
  };

  results.overallStats = overallStats;

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsFile = path.join(
    resultsDir,
    `firestore-benchmark-${env}-${timestamp}.json`,
  );
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  // Print summary
  console.log(chalk.bold.green("\nBenchmark Summary:"));
  console.log(chalk.bold.green("=================="));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Collections tested: ${validCollections.length}`));
  console.log(chalk.blue(`Results saved to: ${resultsFile}`));
  console.log(chalk.bold.green("\nOverall Performance:"));
  console.log(
    chalk.cyan(
      `Read operations: ${overallStats.read.averageOpsPerSecond.toFixed(2)} ops/sec (${overallStats.read.averageLatencyMs.toFixed(2)}ms avg latency)`,
    ),
  );
  console.log(
    chalk.cyan(
      `Write operations: ${overallStats.write.averageOpsPerSecond.toFixed(2)} ops/sec (${overallStats.write.averageLatencyMs.toFixed(2)}ms avg latency)`,
    ),
  );
  console.log(
    chalk.cyan(
      `Query operations: ${overallStats.query.averageOpsPerSecond.toFixed(2)} ops/sec (${overallStats.query.averageLatencyMs.toFixed(2)}ms avg latency)`,
    ),
  );
  console.log(
    chalk.cyan(
      `Transaction operations: ${overallStats.transaction.averageOpsPerSecond.toFixed(2)} ops/sec (${overallStats.transaction.averageLatencyMs.toFixed(2)}ms avg latency)`,
    ),
  );

  // Also save the results to Firestore for historical tracking
  try {
    await firestore.collection("benchmark_results").add({
      timestamp: Firestore.Timestamp.now(),
      environment: env,
      results: results,
    });
    console.log(
      chalk.green(
        'Benchmark results saved to Firestore collection "benchmark_results"',
      ),
    );
  } catch (error) {
    console.error(
      chalk.yellow("Failed to save benchmark results to Firestore:"),
      error.message,
    );
  }
}

// Run benchmarks
runBenchmarks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red("Error running benchmarks:"), error);
    process.exit(1);
  });
