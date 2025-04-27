/**
 * Cloud Storage Performance Benchmark
 *
 * This script runs benchmarks for Google Cloud Storage operations
 * to measure performance and help with optimization. It focuses on
 * upload, download, and metadata operations with various file sizes.
 */

const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { performance } = require("perf_hooks");
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

// Initialize GCS client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || `fluxori-${env}`,
  keyFilename: keyFilePath,
});

// Create results directory
const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Create temp directory for test files
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Test bucket name
const bucketName = process.env.GCS_TEST_BUCKET || `fluxori-${env}-benchmark`;
const testFolder = `benchmark-${Date.now()}`;

/**
 * Creates a test file of the specified size
 * @param {string} filePath - File path
 * @param {number} sizeBytes - Size in bytes
 * @returns {Promise<void>}
 */
async function createTestFile(filePath, sizeBytes) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);

    // Write data in chunks to avoid memory issues
    const chunkSize = 1024 * 1024; // 1MB
    const numChunks = Math.ceil(sizeBytes / chunkSize);

    function writeChunk(chunkIndex) {
      if (chunkIndex >= numChunks) {
        writeStream.end();
        return;
      }

      const remainingBytes = sizeBytes - chunkIndex * chunkSize;
      const currentChunkSize = Math.min(chunkSize, remainingBytes);
      const buffer = crypto.randomBytes(currentChunkSize);

      const canContinue = writeStream.write(buffer);
      if (canContinue) {
        process.nextTick(() => writeChunk(chunkIndex + 1));
      } else {
        writeStream.once("drain", () => writeChunk(chunkIndex + 1));
      }
    }

    writeChunk(0);
  });
}

/**
 * Runs upload benchmark for a file size
 * @param {number} fileSizeBytes - File size in bytes
 * @param {number} iterations - Number of iterations
 */
async function runUploadBenchmark(fileSizeBytes, iterations = 5) {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  console.log(
    chalk.cyan(
      `\nRunning upload benchmark for ${fileSizeMB.toFixed(2)}MB file (${iterations} iterations)`,
    ),
  );

  // Create bucket if it doesn't exist
  let bucket;
  try {
    const [exists] = await storage.bucket(bucketName).exists();
    if (!exists) {
      console.log(
        chalk.yellow(`Bucket ${bucketName} doesn't exist. Creating it...`),
      );
      [bucket] = await storage.createBucket(bucketName, {
        location: "africa-south1",
        storageClass: "STANDARD",
      });
    } else {
      bucket = storage.bucket(bucketName);
    }
  } catch (error) {
    console.error(
      chalk.red(`Error creating/accessing bucket: ${error.message}`),
    );
    return null;
  }

  // Create test file
  const fileName = `test-${fileSizeMB.toFixed(0)}mb-${Date.now()}.bin`;
  const filePath = path.join(tempDir, fileName);

  console.log(
    chalk.blue(`Creating test file of ${fileSizeMB.toFixed(2)}MB...`),
  );
  await createTestFile(filePath, fileSizeBytes);

  // Run uploads
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const destFileName = `${testFolder}/${fileName}-${i}`;
    const file = bucket.file(destFileName);

    console.log(chalk.blue(`Upload iteration ${i + 1}/${iterations}...`));

    const startTime = performance.now();

    try {
      await bucket.upload(filePath, {
        destination: destFileName,
        metadata: {
          contentType: "application/octet-stream",
          metadata: {
            benchmark: "true",
            fileSize: fileSizeBytes.toString(),
            iteration: i.toString(),
          },
        },
      });

      const endTime = performance.now();
      const durationMs = endTime - startTime;
      const throughputMBps = (fileSizeBytes / durationMs / 1000).toFixed(2);

      console.log(
        chalk.green(
          `Upload complete in ${durationMs.toFixed(2)}ms (${throughputMBps} MB/s)`,
        ),
      );

      results.push({
        sizeBytes: fileSizeBytes,
        durationMs,
        throughputMBps: parseFloat(throughputMBps),
      });
    } catch (error) {
      console.error(chalk.red(`Upload failed: ${error.message}`));
    }
  }

  // Clean up test file
  fs.unlinkSync(filePath);

  // Calculate average throughput
  const avgThroughput =
    results.reduce((sum, r) => sum + r.throughputMBps, 0) / results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;

  console.log(
    chalk.bold.green(
      `Upload benchmark complete for ${fileSizeMB.toFixed(2)}MB file:`,
    ),
  );
  console.log(
    chalk.bold.green(`Average throughput: ${avgThroughput.toFixed(2)} MB/s`),
  );
  console.log(
    chalk.bold.green(`Average duration: ${avgDuration.toFixed(2)}ms`),
  );

  return {
    operation: "upload",
    fileSizeBytes,
    fileSizeMB: fileSizeMB,
    iterations,
    results,
    averageThroughputMBps: parseFloat(avgThroughput.toFixed(2)),
    averageDurationMs: parseFloat(avgDuration.toFixed(2)),
  };
}

/**
 * Runs download benchmark for a file size
 * @param {number} fileSizeBytes - File size in bytes
 * @param {number} iterations - Number of iterations
 */
async function runDownloadBenchmark(fileSizeBytes, iterations = 5) {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  console.log(
    chalk.cyan(
      `\nRunning download benchmark for ${fileSizeMB.toFixed(2)}MB file (${iterations} iterations)`,
    ),
  );

  // Access bucket
  const bucket = storage.bucket(bucketName);

  // Use the files already uploaded by the upload benchmark
  let files;
  try {
    [files] = await bucket.getFiles({ prefix: testFolder });

    // Filter files by size (using metadata)
    files = files.filter((file) => {
      const metadata = file.metadata?.metadata;
      return (
        metadata?.benchmark === "true" &&
        parseInt(metadata?.fileSize) === fileSizeBytes
      );
    });

    if (files.length === 0) {
      console.error(
        chalk.yellow(
          `No test files found for size ${fileSizeMB}MB. Run upload benchmark first.`,
        ),
      );
      return null;
    }

    // Limit to the number of iterations
    files = files.slice(0, iterations);
  } catch (error) {
    console.error(chalk.red(`Error listing files: ${error.message}`));
    return null;
  }

  // Run downloads
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const downloadPath = path.join(tempDir, `download-${i}-${Date.now()}.bin`);

    console.log(chalk.blue(`Download iteration ${i + 1}/${files.length}...`));

    const startTime = performance.now();

    try {
      await file.download({ destination: downloadPath });

      const endTime = performance.now();
      const durationMs = endTime - startTime;
      const throughputMBps = (fileSizeBytes / durationMs / 1000).toFixed(2);

      console.log(
        chalk.green(
          `Download complete in ${durationMs.toFixed(2)}ms (${throughputMBps} MB/s)`,
        ),
      );

      results.push({
        sizeBytes: fileSizeBytes,
        durationMs,
        throughputMBps: parseFloat(throughputMBps),
      });

      // Clean up downloaded file
      fs.unlinkSync(downloadPath);
    } catch (error) {
      console.error(chalk.red(`Download failed: ${error.message}`));
    }
  }

  // Calculate average throughput
  const avgThroughput =
    results.reduce((sum, r) => sum + r.throughputMBps, 0) / results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;

  console.log(
    chalk.bold.green(
      `Download benchmark complete for ${fileSizeMB.toFixed(2)}MB file:`,
    ),
  );
  console.log(
    chalk.bold.green(`Average throughput: ${avgThroughput.toFixed(2)} MB/s`),
  );
  console.log(
    chalk.bold.green(`Average duration: ${avgDuration.toFixed(2)}ms`),
  );

  return {
    operation: "download",
    fileSizeBytes,
    fileSizeMB: fileSizeMB,
    iterations: results.length,
    results,
    averageThroughputMBps: parseFloat(avgThroughput.toFixed(2)),
    averageDurationMs: parseFloat(avgDuration.toFixed(2)),
  };
}

/**
 * Runs metadata operations benchmark
 * @param {number} iterations - Number of iterations
 */
async function runMetadataBenchmark(iterations = 50) {
  console.log(
    chalk.cyan(
      `\nRunning metadata operations benchmark (${iterations} iterations)`,
    ),
  );

  // Access bucket
  const bucket = storage.bucket(bucketName);

  // Use the files already uploaded by the upload benchmark
  let files;
  try {
    [files] = await bucket.getFiles({ prefix: testFolder });

    if (files.length === 0) {
      console.error(
        chalk.yellow(`No test files found. Run upload benchmark first.`),
      );
      return null;
    }

    // Limit to the number of iterations
    if (files.length < iterations) {
      console.log(
        chalk.yellow(`Only ${files.length} files available for testing.`),
      );
    }

    files = files.slice(0, Math.min(files.length, iterations));
  } catch (error) {
    console.error(chalk.red(`Error listing files: ${error.message}`));
    return null;
  }

  // Benchmark results
  const results = {
    getMetadata: [],
    updateMetadata: [],
    listFiles: [],
  };

  // Test getMetadata
  console.log(chalk.blue(`Testing getMetadata operations...`));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const startTime = performance.now();
    try {
      await file.getMetadata();
      const endTime = performance.now();
      const durationMs = endTime - startTime;

      results.getMetadata.push({
        fileId: file.name,
        durationMs,
      });
    } catch (error) {
      console.error(chalk.red(`getMetadata failed: ${error.message}`));
    }
  }

  // Test updateMetadata
  console.log(chalk.blue(`Testing updateMetadata operations...`));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const startTime = performance.now();
    try {
      await file.setMetadata({
        metadata: {
          benchmark: "true",
          lastUpdated: new Date().toISOString(),
          testValue: crypto.randomBytes(16).toString("hex"),
        },
      });
      const endTime = performance.now();
      const durationMs = endTime - startTime;

      results.updateMetadata.push({
        fileId: file.name,
        durationMs,
      });
    } catch (error) {
      console.error(chalk.red(`updateMetadata failed: ${error.message}`));
    }
  }

  // Test listFiles with different prefix depths
  console.log(chalk.blue(`Testing listFiles operations...`));

  // Test listing all files
  const startTime1 = performance.now();
  try {
    await bucket.getFiles();
    const endTime1 = performance.now();
    const durationMs1 = endTime1 - startTime1;

    results.listFiles.push({
      description: "List all files",
      durationMs: durationMs1,
    });
  } catch (error) {
    console.error(chalk.red(`listFiles (all) failed: ${error.message}`));
  }

  // Test listing with prefix
  const startTime2 = performance.now();
  try {
    await bucket.getFiles({ prefix: testFolder });
    const endTime2 = performance.now();
    const durationMs2 = endTime2 - startTime2;

    results.listFiles.push({
      description: `List files with prefix ${testFolder}`,
      durationMs: durationMs2,
    });
  } catch (error) {
    console.error(chalk.red(`listFiles (prefix) failed: ${error.message}`));
  }

  // Test listing with prefix and maxResults
  const startTime3 = performance.now();
  try {
    await bucket.getFiles({ prefix: testFolder, maxResults: 10 });
    const endTime3 = performance.now();
    const durationMs3 = endTime3 - startTime3;

    results.listFiles.push({
      description: `List files with prefix ${testFolder} and maxResults 10`,
      durationMs: durationMs3,
    });
  } catch (error) {
    console.error(
      chalk.red(`listFiles (prefix+maxResults) failed: ${error.message}`),
    );
  }

  // Calculate averages
  const getMetadataAvg =
    results.getMetadata.reduce((sum, r) => sum + r.durationMs, 0) /
    results.getMetadata.length;
  const updateMetadataAvg =
    results.updateMetadata.reduce((sum, r) => sum + r.durationMs, 0) /
    results.updateMetadata.length;

  console.log(chalk.bold.green(`Metadata benchmark complete:`));
  console.log(
    chalk.bold.green(
      `Average getMetadata duration: ${getMetadataAvg.toFixed(2)}ms`,
    ),
  );
  console.log(
    chalk.bold.green(
      `Average updateMetadata duration: ${updateMetadataAvg.toFixed(2)}ms`,
    ),
  );

  results.getMetadataAvgMs = parseFloat(getMetadataAvg.toFixed(2));
  results.updateMetadataAvgMs = parseFloat(updateMetadataAvg.toFixed(2));

  return {
    operation: "metadata",
    iterations: files.length,
    results,
  };
}

/**
 * Clean up benchmark files
 */
async function cleanupBenchmarkFiles() {
  console.log(chalk.cyan(`\nCleaning up benchmark files...`));

  // Access bucket
  const bucket = storage.bucket(bucketName);

  try {
    // Delete files with the benchmark folder prefix
    const [files] = await bucket.getFiles({ prefix: testFolder });

    if (files.length === 0) {
      console.log(chalk.yellow(`No test files found to clean up.`));
      return;
    }

    console.log(chalk.blue(`Deleting ${files.length} test files...`));

    for (const file of files) {
      await file.delete();
    }

    console.log(
      chalk.green(`Cleanup complete. Deleted ${files.length} files.`),
    );
  } catch (error) {
    console.error(chalk.red(`Error cleaning up files: ${error.message}`));
  }

  // Clean up temp directory
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    }
  } catch (error) {
    console.error(
      chalk.red(`Error cleaning up temp directory: ${error.message}`),
    );
  }
}

/**
 * Run benchmarks with various file sizes
 */
async function runAllBenchmarks() {
  console.log(
    chalk.bold.green("Starting Google Cloud Storage Performance Benchmarks"),
  );
  console.log(
    chalk.bold.green("================================================="),
  );
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(
    chalk.blue(`Project ID: ${process.env.GCP_PROJECT_ID || `fluxori-${env}`}`),
  );
  console.log(chalk.blue(`Bucket: ${bucketName}`));
  console.log(chalk.blue(`Test folder: ${testFolder}`));
  console.log(
    chalk.bold.green("=================================================\n"),
  );

  // Define file sizes to test
  const fileSizes = [
    1 * 1024 * 1024, // 1MB
    10 * 1024 * 1024, // 10MB
    50 * 1024 * 1024, // 50MB
    100 * 1024 * 1024, // 100MB
  ];

  // Results collection
  const results = {
    environment: env,
    timestamp: new Date().toISOString(),
    bucket: bucketName,
    testFolder,
    upload: {},
    download: {},
    metadata: null,
  };

  // Run upload and download benchmarks for each file size
  for (const size of fileSizes) {
    const sizeMB = size / (1024 * 1024);
    const key = `${sizeMB}MB`;

    // Run upload benchmark
    results.upload[key] = await runUploadBenchmark(size, 5);

    // Run download benchmark
    results.download[key] = await runDownloadBenchmark(size, 5);
  }

  // Run metadata operations benchmark
  results.metadata = await runMetadataBenchmark(50);

  // Clean up benchmark files
  if (!process.env.KEEP_BENCHMARK_FILES) {
    await cleanupBenchmarkFiles();
  } else {
    console.log(
      chalk.yellow(`Keeping benchmark files as KEEP_BENCHMARK_FILES is set.`),
    );
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsFile = path.join(
    resultsDir,
    `gcs-benchmark-${env}-${timestamp}.json`,
  );
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  // Create summary
  console.log(chalk.bold.green("\nBenchmark Summary:"));
  console.log(chalk.bold.green("=================="));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Bucket: ${bucketName}`));
  console.log(chalk.blue(`Results saved to: ${resultsFile}`));

  // Upload summary
  console.log(chalk.bold.cyan("\nUpload Throughput:"));
  Object.entries(results.upload).forEach(([size, data]) => {
    if (data) {
      console.log(
        chalk.cyan(
          `${size}: ${data.averageThroughputMBps} MB/s (${data.averageDurationMs.toFixed(2)}ms)`,
        ),
      );
    }
  });

  // Download summary
  console.log(chalk.bold.cyan("\nDownload Throughput:"));
  Object.entries(results.download).forEach(([size, data]) => {
    if (data) {
      console.log(
        chalk.cyan(
          `${size}: ${data.averageThroughputMBps} MB/s (${data.averageDurationMs.toFixed(2)}ms)`,
        ),
      );
    }
  });

  // Metadata summary
  if (results.metadata) {
    console.log(chalk.bold.cyan("\nMetadata Operations:"));
    console.log(
      chalk.cyan(
        `getMetadata: ${results.metadata.results.getMetadataAvgMs}ms average`,
      ),
    );
    console.log(
      chalk.cyan(
        `updateMetadata: ${results.metadata.results.updateMetadataAvgMs}ms average`,
      ),
    );

    results.metadata.results.listFiles.forEach((data) => {
      console.log(
        chalk.cyan(`${data.description}: ${data.durationMs.toFixed(2)}ms`),
      );
    });
  }
}

// Run benchmarks
runAllBenchmarks()
  .then(() => {
    console.log(chalk.green("\nBenchmarks completed successfully."));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("Error running benchmarks:"), error);
    process.exit(1);
  });
