/**
 * CDN Performance Test Script
 *
 * This script tests the performance of the Cloud CDN by measuring
 * response times for static assets with different cache statuses.
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

// Configuration
const config = {
  // Base URL for your CDN (e.g., https://assets.fluxori.com or a Cloud Storage URL)
  cdnBaseUrl: process.env.CDN_BASE_URL || "",

  // URL for direct Cloud Storage access (for comparison)
  directStorageUrl: process.env.DIRECT_STORAGE_URL || "",

  // Locations to test from (simulated by adding cache-busting parameters)
  locations: [
    { name: "South Africa", cacheParam: "za" },
    { name: "Europe", cacheParam: "eu" },
    { name: "North America", cacheParam: "na" },
  ],

  // File types to test
  fileTypes: [
    { name: "Image (JPEG)", path: "/images/sample.jpg" },
    { name: "Image (PNG)", path: "/images/logo.png" },
    { name: "JavaScript", path: "/js/main.js" },
    { name: "CSS", path: "/css/styles.css" },
    { name: "JSON", path: "/data/config.json" },
  ],

  // Test parameters
  requestsPerTest: 10,
  delayBetweenRequests: 500, // milliseconds
  warmupRequests: 3,

  // Output directory for results
  outputDir: path.join(__dirname, "results"),
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Helper for formatted timestamps
const getTimestamp = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}-${String(date.getMinutes()).padStart(2, "0")}`;
};

// Set up logging
const logFile = path.join(config.outputDir, `cdn_test_${getTimestamp()}.log`);
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + "\n");
};

// Initialize log file
fs.writeFileSync(
  logFile,
  `CDN Performance Test - ${new Date().toISOString()}\n\n`,
);
log(`Test Configuration: ${JSON.stringify(config, null, 2)}`);

// Function to make a single request and measure performance
const makeRequest = async (url, expectedCacheStatus = null) => {
  try {
    const startTime = performance.now();

    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Accept any status code
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Check for CDN cache headers
    const cacheStatus =
      response.headers["x-cache"] ||
      response.headers["cf-cache-status"] ||
      response.headers["x-cache-status"] ||
      response.headers["cdn-cache-status"] ||
      "Unknown";

    const serverLocation =
      response.headers["server-location"] ||
      response.headers["cf-ray"]?.split("-")[1] ||
      "Unknown";

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      responseTime,
      cacheStatus,
      serverLocation,
      contentLength: parseInt(response.headers["content-length"] || "0", 10),
      contentType: response.headers["content-type"] || "Unknown",
      headers: response.headers,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      responseTime: -1,
      cacheStatus: "Error",
      serverLocation: "Unknown",
    };
  }
};

// Function to test a specific asset through CDN and direct
const testAsset = async (assetPath, location, isCDN = true) => {
  const base = isCDN ? config.cdnBaseUrl : config.directStorageUrl;
  if (!base) {
    log(`${isCDN ? "CDN" : "Direct"} base URL not configured. Skipping...`);
    return null;
  }

  const cacheBuster = `?region=${location.cacheParam}&t=${Date.now()}`;
  const url = `${base}${assetPath}${cacheBuster}`;

  log(`Testing ${isCDN ? "CDN" : "Direct"} URL: ${url}`);

  // Perform warmup requests
  log(`Performing ${config.warmupRequests} warmup requests...`);
  for (let i = 0; i < config.warmupRequests; i++) {
    await makeRequest(url);
    await new Promise((resolve) =>
      setTimeout(resolve, config.delayBetweenRequests),
    );
  }

  // Perform actual test requests
  log(`Performing ${config.requestsPerTest} test requests...`);
  const results = [];

  for (let i = 0; i < config.requestsPerTest; i++) {
    const result = await makeRequest(url);
    results.push(result);

    if (i < config.requestsPerTest - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, config.delayBetweenRequests),
      );
    }
  }

  // Calculate statistics
  const successfulResults = results.filter((r) => r.success);
  const responseTimes = successfulResults.map((r) => r.responseTime);

  let statistics = {
    totalRequests: results.length,
    successfulRequests: successfulResults.length,
    successRate: (successfulResults.length / results.length) * 100,
    cacheStatuses: {},
  };

  if (responseTimes.length > 0) {
    statistics = {
      ...statistics,
      averageResponseTime:
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      medianResponseTime: [...responseTimes].sort((a, b) => a - b)[
        Math.floor(responseTimes.length / 2)
      ],
    };
  }

  // Count cache statuses
  successfulResults.forEach((result) => {
    const status = result.cacheStatus;
    statistics.cacheStatuses[status] =
      (statistics.cacheStatuses[status] || 0) + 1;
  });

  return {
    url,
    isCDN,
    location: location.name,
    results,
    statistics,
  };
};

// Main function to run all tests
const runCdnTests = async () => {
  log("Starting CDN performance tests...");

  const allResults = [];

  // Test each file type
  for (const fileType of config.fileTypes) {
    log(`\nTesting file type: ${fileType.name} (${fileType.path})`);

    // Test from each location
    for (const location of config.locations) {
      log(`\nTesting from location: ${location.name}`);

      // Test CDN
      const cdnResult = await testAsset(fileType.path, location, true);
      if (cdnResult) {
        allResults.push(cdnResult);
        log(
          `CDN test complete. Average response time: ${cdnResult.statistics.averageResponseTime?.toFixed(2)}ms`,
        );
        log(
          `Cache statuses: ${JSON.stringify(cdnResult.statistics.cacheStatuses)}`,
        );
      }

      // Test direct storage access
      if (config.directStorageUrl) {
        const directResult = await testAsset(fileType.path, location, false);
        if (directResult) {
          allResults.push(directResult);
          log(
            `Direct storage test complete. Average response time: ${directResult.statistics.averageResponseTime?.toFixed(2)}ms`,
          );
        }
      }
    }
  }

  // Analyze results
  log("\nAnalyzing results...");

  // Group by file type
  const resultsByFileType = {};

  for (const fileType of config.fileTypes) {
    const fileResults = allResults.filter((r) => r.url.includes(fileType.path));

    if (fileResults.length === 0) continue;

    const cdnResults = fileResults.filter((r) => r.isCDN);
    const directResults = fileResults.filter((r) => !r.isCDN);

    const cdnAvg =
      cdnResults.reduce(
        (sum, r) => sum + (r.statistics.averageResponseTime || 0),
        0,
      ) / cdnResults.length;
    const directAvg =
      directResults.length > 0
        ? directResults.reduce(
            (sum, r) => sum + (r.statistics.averageResponseTime || 0),
            0,
          ) / directResults.length
        : null;

    const improvement = directAvg
      ? ((directAvg - cdnAvg) / directAvg) * 100
      : null;

    resultsByFileType[fileType.name] = {
      cdnAverageResponseTime: cdnAvg,
      directAverageResponseTime: directAvg,
      improvementPercentage: improvement,
      cacheHitRate:
        (cdnResults.reduce((sum, r) => {
          const hitCount = r.statistics.cacheStatuses["HIT"] || 0;
          return sum + hitCount / r.statistics.totalRequests;
        }, 0) /
          cdnResults.length) *
        100,
    };
  }

  // Generate report
  const report = {
    configuration: config,
    timestamp: new Date().toISOString(),
    testDuration: null, // Will be set at the end
    summary: {
      totalTests: allResults.length,
      fileTypeResults: resultsByFileType,
      overallCdnImprovement: null, // Will be calculated below
    },
    detailedResults: allResults,
  };

  // Calculate overall improvement
  const cdnResults = allResults.filter((r) => r.isCDN);
  const directResults = allResults.filter((r) => !r.isCDN);

  if (cdnResults.length > 0 && directResults.length > 0) {
    const cdnAvg =
      cdnResults.reduce(
        (sum, r) => sum + (r.statistics.averageResponseTime || 0),
        0,
      ) / cdnResults.length;
    const directAvg =
      directResults.reduce(
        (sum, r) => sum + (r.statistics.averageResponseTime || 0),
        0,
      ) / directResults.length;

    report.summary.overallCdnImprovement =
      ((directAvg - cdnAvg) / directAvg) * 100;

    log(
      `Overall CDN performance improvement: ${report.summary.overallCdnImprovement.toFixed(2)}%`,
    );
  } else {
    log("Could not calculate overall CDN improvement (missing data)");
  }

  // Print summary for each file type
  log("\nFile type performance summary:");
  for (const [fileType, results] of Object.entries(resultsByFileType)) {
    log(`${fileType}:`);
    log(
      `  CDN average response time: ${results.cdnAverageResponseTime.toFixed(2)}ms`,
    );

    if (results.directAverageResponseTime !== null) {
      log(
        `  Direct average response time: ${results.directAverageResponseTime.toFixed(2)}ms`,
      );
      log(`  Improvement: ${results.improvementPercentage.toFixed(2)}%`);
    }

    log(`  Cache hit rate: ${results.cacheHitRate.toFixed(2)}%`);
  }

  // Save full report
  report.testDuration =
    new Date().getTime() - new Date(report.timestamp).getTime();

  const reportFile = path.join(
    config.outputDir,
    `cdn_report_${getTimestamp()}.json`,
  );
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  log(`\nFull report saved to: ${reportFile}`);

  return report;
};

// Run the test if executed directly
if (require.main === module) {
  if (!config.cdnBaseUrl) {
    console.error("Error: CDN_BASE_URL environment variable must be set");
    process.exit(1);
  }

  runCdnTests()
    .then(() => {
      log("All tests completed");
      process.exit(0);
    })
    .catch((error) => {
      log(`Tests failed with error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

// Export for programmatic use
module.exports = {
  runCdnTests,
  makeRequest,
  testAsset,
};
