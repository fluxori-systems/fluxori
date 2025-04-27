/**
 * Fluxori Deployment Validation Script
 *
 * This script performs a comprehensive validation of the Fluxori deployment
 * on Google Cloud Platform. It checks the configuration of various services
 * and ensures that they are correctly set up for the South African market.
 */

const { exec } = require("child_process");
const util = require("util");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const axios = require("axios");

// Promisify exec
const execAsync = util.promisify(exec);

// Command line arguments
const args = process.argv.slice(2);
const projectId = args
  .find((arg) => arg.startsWith("--project="))
  ?.split("=")[1];
const env =
  args.find((arg) => arg.startsWith("--env="))?.split("=")[1] || "dev";
const region =
  args.find((arg) => arg.startsWith("--region="))?.split("=")[1] ||
  "africa-south1";
const outputFile = args
  .find((arg) => arg.startsWith("--output="))
  ?.split("=")[1];

// Set default project if provided
if (projectId) {
  try {
    execAsync(`gcloud config set project ${projectId}`);
    console.log(chalk.blue(`Set default project to: ${projectId}`));
  } catch (error) {
    console.error(chalk.red(`Failed to set default project: ${error.message}`));
  }
}

// Results collection
const results = {
  timestamp: new Date().toISOString(),
  environment: env,
  region: region,
  project: projectId,
  services: {},
  overall: {
    pass: true,
    issues: [],
  },
};

/**
 * Validates Cloud Run services
 */
async function validateCloudRun() {
  console.log(chalk.blue("\nValidating Cloud Run services..."));

  results.services.cloudRun = {
    status: "pending",
    details: [],
    services: {},
  };

  try {
    // Get list of Cloud Run services
    const { stdout } = await execAsync(
      `gcloud run services list --region=${region} --format=json`,
    );
    const services = JSON.parse(stdout);

    if (services.length === 0) {
      results.services.cloudRun.status = "fail";
      results.services.cloudRun.details.push("No Cloud Run services found");
      results.overall.pass = false;
      results.overall.issues.push("No Cloud Run services found");
      return;
    }

    // Expected services
    const expectedServices = [
      `fluxori-backend-${env}`,
      `fluxori-frontend-${env}`,
    ];

    // Check if all expected services exist
    const foundServices = services.map((service) => service.metadata.name);
    const missingServices = expectedServices.filter(
      (service) => !foundServices.includes(service),
    );

    if (missingServices.length > 0) {
      results.services.cloudRun.status = "warn";
      results.services.cloudRun.details.push(
        `Missing expected services: ${missingServices.join(", ")}`,
      );
      results.overall.issues.push(
        `Missing Cloud Run services: ${missingServices.join(", ")}`,
      );
    }

    // Check individual services
    for (const service of services) {
      const serviceName = service.metadata.name;
      console.log(chalk.blue(`Checking service: ${serviceName}`));

      const serviceResults = {
        status: "pass",
        url: service.status.url,
        issues: [],
      };

      // Check if the service is in the correct region
      if (service.metadata.labels.cloud_run_location !== region) {
        serviceResults.status = "warn";
        serviceResults.issues.push(
          `Service is in ${service.metadata.labels.cloud_run_location} instead of ${region}`,
        );
        results.overall.issues.push(
          `Service ${serviceName} is in ${service.metadata.labels.cloud_run_location} instead of ${region}`,
        );
      }

      // Check if the service is using HTTPS
      if (!service.status.url.startsWith("https://")) {
        serviceResults.status = "fail";
        serviceResults.issues.push("Service URL is not using HTTPS");
        results.overall.pass = false;
        results.overall.issues.push(
          `Service ${serviceName} is not using HTTPS`,
        );
      }

      // Check if the service is working by calling a health endpoint
      try {
        let healthEndpoint = "/health";
        if (serviceName.includes("frontend")) {
          healthEndpoint = "/";
        }

        const response = await axios.get(
          `${service.status.url}${healthEndpoint}`,
          {
            timeout: 5000,
            validateStatus: null,
          },
        );

        if (response.status >= 200 && response.status < 300) {
          serviceResults.health = "pass";
        } else {
          serviceResults.health = "fail";
          serviceResults.issues.push(
            `Health check failed with status ${response.status}`,
          );
          results.overall.issues.push(
            `Service ${serviceName} health check failed with status ${response.status}`,
          );
        }
      } catch (error) {
        serviceResults.health = "fail";
        serviceResults.issues.push(`Health check failed: ${error.message}`);
        results.overall.issues.push(
          `Service ${serviceName} health check failed: ${error.message}`,
        );
      }

      // Add service results
      results.services.cloudRun.services[serviceName] = serviceResults;
    }

    // Overall status for Cloud Run services
    results.services.cloudRun.status =
      missingServices.length > 0 ||
      Object.values(results.services.cloudRun.services).some(
        (service) => service.status === "fail",
      )
        ? "fail"
        : "pass";

    if (results.services.cloudRun.status === "fail") {
      results.overall.pass = false;
    }

    console.log(chalk.green("Cloud Run validation completed"));
  } catch (error) {
    console.error(
      chalk.red(`Error validating Cloud Run services: ${error.message}`),
    );
    results.services.cloudRun.status = "fail";
    results.services.cloudRun.details.push(`Error: ${error.message}`);
    results.overall.pass = false;
    results.overall.issues.push(`Cloud Run validation error: ${error.message}`);
  }
}

/**
 * Validates Firestore configuration
 */
async function validateFirestore() {
  console.log(chalk.blue("\nValidating Firestore configuration..."));

  results.services.firestore = {
    status: "pending",
    details: [],
  };

  try {
    // Check if Firestore is enabled
    const { stdout } = await execAsync(
      "gcloud firestore databases list --format=json",
    );
    const databases = JSON.parse(stdout);

    if (databases.length === 0) {
      results.services.firestore.status = "fail";
      results.services.firestore.details.push("Firestore database not found");
      results.overall.pass = false;
      results.overall.issues.push("Firestore database not found");
      return;
    }

    // Get database details
    const database = databases[0];
    results.services.firestore.database = {
      name: database.name,
      type: database.type,
      location: database.locationId,
    };

    // Check if using Firestore Native mode
    if (database.type !== "FIRESTORE_NATIVE") {
      results.services.firestore.status = "fail";
      results.services.firestore.details.push(
        "Firestore database is not in Native mode",
      );
      results.overall.pass = false;
      results.overall.issues.push("Firestore database is not in Native mode");
    }

    // Check if in the correct region
    // The region might be 'nam5' for multi-region or 'africa-south1' for single region
    if (
      !database.locationId.includes("nam5") &&
      !database.locationId.includes("africa-south1")
    ) {
      results.services.firestore.status = "warn";
      results.services.firestore.details.push(
        `Firestore database is in ${database.locationId}, which may not be optimal for South Africa`,
      );
      results.overall.issues.push(
        `Firestore database is in ${database.locationId}, which may not be optimal for South Africa`,
      );
    }

    // Overall status for Firestore
    results.services.firestore.status =
      results.services.firestore.details.length > 0 ? "fail" : "pass";

    console.log(chalk.green("Firestore validation completed"));
  } catch (error) {
    console.error(chalk.red(`Error validating Firestore: ${error.message}`));
    results.services.firestore.status = "fail";
    results.services.firestore.details.push(`Error: ${error.message}`);
    results.overall.pass = false;
    results.overall.issues.push(`Firestore validation error: ${error.message}`);
  }
}

/**
 * Validates Cloud Storage configuration
 */
async function validateCloudStorage() {
  console.log(chalk.blue("\nValidating Cloud Storage configuration..."));

  results.services.cloudStorage = {
    status: "pending",
    details: [],
    buckets: {},
  };

  try {
    // Get list of buckets
    const { stdout } = await execAsync("gcloud storage ls --format=json");
    const buckets = JSON.parse(stdout);

    if (buckets.length === 0) {
      results.services.cloudStorage.status = "warn";
      results.services.cloudStorage.details.push("No storage buckets found");
      results.overall.issues.push("No storage buckets found");
      return;
    }

    // Expected buckets
    const expectedBuckets = [`${projectId}-uploads`, `${projectId}-assets`];

    // Check if expected buckets exist
    const bucketNames = buckets.map((bucket) => bucket.split("/")[2]); // Format: 'gs://bucket-name/'
    const missingBuckets = expectedBuckets.filter(
      (bucket) => !bucketNames.some((name) => name.includes(bucket)),
    );

    if (missingBuckets.length > 0) {
      results.services.cloudStorage.status = "warn";
      results.services.cloudStorage.details.push(
        `Missing expected buckets: ${missingBuckets.join(", ")}`,
      );
      results.overall.issues.push(
        `Missing expected storage buckets: ${missingBuckets.join(", ")}`,
      );
    }

    // Check each bucket's configuration
    for (const bucketUrl of buckets) {
      const bucketName = bucketUrl.split("/")[2];
      console.log(chalk.blue(`Checking bucket: ${bucketName}`));

      // Get bucket details
      const { stdout: detailsJson } = await execAsync(
        `gcloud storage buckets describe ${bucketUrl} --format=json`,
      );
      const bucketDetails = JSON.parse(detailsJson);

      const bucketResults = {
        status: "pass",
        location: bucketDetails.location,
        storageClass: bucketDetails.storageClass,
        issues: [],
      };

      // Check location (should be in africa-south1 for optimal performance)
      if (bucketDetails.location !== "AFRICA-SOUTH1") {
        bucketResults.status = "warn";
        bucketResults.issues.push(
          `Bucket is in ${bucketDetails.location} instead of AFRICA-SOUTH1`,
        );
        results.overall.issues.push(
          `Bucket ${bucketName} is in ${bucketDetails.location} instead of AFRICA-SOUTH1`,
        );
      }

      // Add bucket results
      results.services.cloudStorage.buckets[bucketName] = bucketResults;
    }

    // Overall status for Cloud Storage
    results.services.cloudStorage.status =
      missingBuckets.length > 0 ? "warn" : "pass";

    console.log(chalk.green("Cloud Storage validation completed"));
  } catch (error) {
    console.error(
      chalk.red(`Error validating Cloud Storage: ${error.message}`),
    );
    results.services.cloudStorage.status = "fail";
    results.services.cloudStorage.details.push(`Error: ${error.message}`);
    results.overall.pass = false;
    results.overall.issues.push(
      `Cloud Storage validation error: ${error.message}`,
    );
  }
}

/**
 * Validates monitoring and alerting configuration
 */
async function validateMonitoring() {
  console.log(
    chalk.blue("\nValidating monitoring and alerting configuration..."),
  );

  results.services.monitoring = {
    status: "pending",
    details: [],
  };

  try {
    // Check if monitoring is enabled
    const { stdout: policiesJson } = await execAsync(
      "gcloud alpha monitoring policies list --format=json",
    );
    const policies = JSON.parse(policiesJson);

    if (policies.length === 0) {
      results.services.monitoring.status = "warn";
      results.services.monitoring.details.push("No alert policies found");
      results.overall.issues.push("No monitoring alert policies found");
    } else {
      results.services.monitoring.alertPolicies = policies.length;
    }

    // Check dashboards
    const { stdout: dashboardsJson } = await execAsync(
      "gcloud monitoring dashboards list --format=json",
    );
    const dashboards = JSON.parse(dashboardsJson);

    if (dashboards.length === 0) {
      results.services.monitoring.status = "warn";
      results.services.monitoring.details.push("No dashboards found");
      results.overall.issues.push("No monitoring dashboards found");
    } else {
      results.services.monitoring.dashboards = dashboards.length;
    }

    // Check notification channels
    const { stdout: channelsJson } = await execAsync(
      "gcloud alpha monitoring channels list --format=json",
    );
    const channels = JSON.parse(channelsJson);

    if (channels.length === 0) {
      results.services.monitoring.status = "warn";
      results.services.monitoring.details.push(
        "No notification channels found",
      );
      results.overall.issues.push("No monitoring notification channels found");
    } else {
      results.services.monitoring.notificationChannels = channels.length;
    }

    // Overall status for monitoring
    results.services.monitoring.status =
      results.services.monitoring.details.length > 0 ? "warn" : "pass";

    console.log(chalk.green("Monitoring validation completed"));
  } catch (error) {
    console.error(chalk.red(`Error validating monitoring: ${error.message}`));
    results.services.monitoring.status = "fail";
    results.services.monitoring.details.push(`Error: ${error.message}`);
    results.overall.pass = false;
    results.overall.issues.push(
      `Monitoring validation error: ${error.message}`,
    );
  }
}

/**
 * Validates networking configuration
 */
async function validateNetworking() {
  console.log(chalk.blue("\nValidating networking configuration..."));

  results.services.networking = {
    status: "pending",
    details: [],
  };

  try {
    // Check if load balancer is set up
    const { stdout: lbJson } = await execAsync(
      "gcloud compute forwarding-rules list --format=json",
    );
    const loadBalancers = JSON.parse(lbJson);

    if (loadBalancers.length === 0) {
      results.services.networking.status = "warn";
      results.services.networking.details.push("No load balancers found");
      results.overall.issues.push("No load balancers found");
    } else {
      results.services.networking.loadBalancers = loadBalancers.length;

      // Check if using Premium Network Tier
      const premiumTier = loadBalancers.some(
        (lb) => lb.networkTier === "PREMIUM",
      );
      if (!premiumTier) {
        results.services.networking.status = "warn";
        results.services.networking.details.push(
          "Not using Premium Network Tier, which may impact performance in South Africa",
        );
        results.overall.issues.push(
          "Not using Premium Network Tier, which may impact performance in South Africa",
        );
      }
    }

    // Check if security policies are set up
    const { stdout: securityJson } = await execAsync(
      "gcloud compute security-policies list --format=json",
    );
    const securityPolicies = JSON.parse(securityJson);

    if (securityPolicies.length === 0) {
      results.services.networking.status = "warn";
      results.services.networking.details.push("No security policies found");
      results.overall.issues.push("No Cloud Armor security policies found");
    } else {
      results.services.networking.securityPolicies = securityPolicies.length;
    }

    // Overall status for networking
    results.services.networking.status =
      results.services.networking.details.length > 0 ? "warn" : "pass";

    console.log(chalk.green("Networking validation completed"));
  } catch (error) {
    console.error(chalk.red(`Error validating networking: ${error.message}`));
    results.services.networking.status = "fail";
    results.services.networking.details.push(`Error: ${error.message}`);
    results.overall.pass = false;
    results.overall.issues.push(
      `Networking validation error: ${error.message}`,
    );
  }
}

/**
 * Prints a summary of validation results
 */
function printSummary() {
  console.log(chalk.bold.green("\nValidation Summary:"));
  console.log(chalk.bold.green("==================="));

  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Region: ${region}`));
  console.log(chalk.blue(`Project: ${projectId}`));
  console.log(chalk.blue(`Timestamp: ${results.timestamp}`));
  console.log();

  // Print service results
  for (const [service, result] of Object.entries(results.services)) {
    const statusColor =
      result.status === "pass"
        ? chalk.green
        : result.status === "warn"
          ? chalk.yellow
          : chalk.red;

    console.log(statusColor(`${service}: ${result.status.toUpperCase()}`));

    if (result.details && result.details.length > 0) {
      result.details.forEach((detail) => {
        console.log(statusColor(`  - ${detail}`));
      });
    }

    console.log();
  }

  // Print overall result
  const overallColor = results.overall.pass ? chalk.green : chalk.red;
  console.log(
    overallColor(`Overall: ${results.overall.pass ? "PASS" : "FAIL"}`),
  );

  if (results.overall.issues.length > 0) {
    console.log(chalk.bold("\nIssues to address:"));
    results.overall.issues.forEach((issue, index) => {
      console.log(chalk.yellow(`${index + 1}. ${issue}`));
    });
  }
}

/**
 * Save results to a file
 */
function saveResults() {
  if (!outputFile) return;

  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(chalk.green(`\nResults saved to ${outputFile}`));
  } catch (error) {
    console.error(chalk.red(`Error saving results: ${error.message}`));
  }
}

/**
 * Main function to run all validations
 */
async function main() {
  console.log(chalk.bold.green("Fluxori Deployment Validation"));
  console.log(chalk.bold.green("============================="));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Region: ${region}`));
  console.log(chalk.blue(`Project: ${projectId || "Not specified"}`));
  console.log(chalk.bold.green("=============================\n"));

  // Run validations
  await validateCloudRun();
  await validateFirestore();
  await validateCloudStorage();
  await validateMonitoring();
  await validateNetworking();

  // Print summary and save results
  printSummary();
  saveResults();
}

// Run main function
main().catch((error) => {
  console.error(chalk.red("Unhandled error:"), error);
  process.exit(1);
});
