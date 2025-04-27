/**
 * AI Credits Monitoring Script for Fluxori
 *
 * This script monitors AI credits usage across organizations and reports metrics
 * to Google Cloud Monitoring. It also checks for organizations approaching their
 * monthly limit and sends alerts.
 */

const { Firestore } = require("@google-cloud/firestore");
const { monitoring } = require("@google-cloud/monitoring");
const { Logging } = require("@google-cloud/logging");
const chalk = require("chalk");

// Command line arguments
const args = process.argv.slice(2);
const projectId = args
  .find((arg) => arg.startsWith("--project="))
  ?.split("=")[1];
const env =
  args.find((arg) => arg.startsWith("--env="))?.split("=")[1] || "dev";
const dryRun = args.includes("--dry-run");

if (!projectId) {
  console.error(
    chalk.red("Error: Project ID is required. Use --project=YOUR_PROJECT_ID"),
  );
  process.exit(1);
}

// Initialize clients
const firestore = new Firestore({
  projectId,
});

const monitoringClient = new monitoring.MetricServiceClient({
  projectId,
});

const logging = new Logging({
  projectId,
});

// Log to Cloud Logging
const log = logging.log("ai-credits-monitor");

/**
 * Writes a custom metric to Cloud Monitoring
 */
async function writeCustomMetric(metricType, value, labels = {}) {
  if (dryRun) {
    console.log(
      chalk.blue(
        `[DRY RUN] Would write metric ${metricType} = ${value} with labels:`,
        labels,
      ),
    );
    return;
  }

  try {
    // Format the Cloud Monitoring data point
    const dataPoint = {
      interval: {
        endTime: {
          seconds: Math.floor(Date.now() / 1000),
          nanos: 0,
        },
      },
      value: {
        int64Value: value,
      },
    };

    // Format the time series with the metric type and labels
    const timeSeries = {
      metric: {
        type: `custom.googleapis.com/fluxori/${metricType}`,
        labels,
      },
      resource: {
        type: "global",
        labels: {
          project_id: projectId,
        },
      },
      points: [dataPoint],
    };

    // Write the time series data
    const request = {
      name: monitoringClient.projectPath(projectId),
      timeSeries: [timeSeries],
    };

    await monitoringClient.createTimeSeries(request);
    console.log(
      chalk.green(`Successfully wrote metric ${metricType} = ${value}`),
    );
  } catch (error) {
    console.error(
      chalk.red(`Error writing custom metric ${metricType}:`),
      error.message,
    );

    // Log to Cloud Logging
    const logEntry = log.entry(
      { severity: "ERROR", resource: { type: "global" } },
      {
        message: `Error writing custom metric ${metricType}`,
        error: error.message,
        metricType,
        value,
        labels,
      },
    );
    await log.write(logEntry);
  }
}

/**
 * Gets all organizations and their credit allotments
 */
async function getOrganizationCreditData() {
  try {
    // Get all organizations
    const orgsSnapshot = await firestore.collection("organizations").get();

    // Get credit allotments
    const allotmentsSnapshot = await firestore
      .collection("ai_credit_allotments")
      .get();
    const allotments = allotmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get credit usage for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageSnapshot = await firestore
      .collection("ai_credit_usage")
      .where("timestamp", ">=", startOfMonth)
      .get();

    const usageByOrg = {};

    usageSnapshot.docs.forEach((doc) => {
      const usage = doc.data();
      const orgId = usage.organizationId;

      if (!usageByOrg[orgId]) {
        usageByOrg[orgId] = 0;
      }

      usageByOrg[orgId] += usage.creditsUsed || 0;
    });

    // Combine data
    const orgData = orgsSnapshot.docs.map((doc) => {
      const org = { id: doc.id, ...doc.data() };
      const allotment = allotments.find((a) => a.organizationId === org.id) || {
        monthlyLimit: 0,
      };
      const currentUsage = usageByOrg[org.id] || 0;

      return {
        id: org.id,
        name: org.name,
        monthlyLimit: allotment.monthlyLimit || 0,
        currentUsage,
        usagePercentage: allotment.monthlyLimit
          ? (currentUsage / allotment.monthlyLimit) * 100
          : 0,
      };
    });

    return orgData;
  } catch (error) {
    console.error(
      chalk.red("Error getting organization credit data:"),
      error.message,
    );

    // Log to Cloud Logging
    const logEntry = log.entry(
      { severity: "ERROR", resource: { type: "global" } },
      {
        message: "Error getting organization credit data",
        error: error.message,
      },
    );
    await log.write(logEntry);

    return [];
  }
}

/**
 * Reports credit metrics for all organizations
 */
async function reportCreditMetrics() {
  console.log(chalk.blue("Getting organization credit data..."));
  const orgData = await getOrganizationCreditData();

  if (orgData.length === 0) {
    console.log(chalk.yellow("No organization data found."));
    return;
  }

  console.log(chalk.blue(`Found ${orgData.length} organizations.`));

  for (const org of orgData) {
    console.log(
      chalk.blue(`Reporting metrics for organization: ${org.name} (${org.id})`),
    );

    // Report monthly limit
    await writeCustomMetric("ai_credits_monthly_limit", org.monthlyLimit, {
      organization_id: org.id,
      organization_name: org.name,
    });

    // Report current usage
    await writeCustomMetric(
      "ai_credits_current_usage",
      Math.round(org.currentUsage),
      {
        organization_id: org.id,
        organization_name: org.name,
      },
    );

    // Report usage percentage
    await writeCustomMetric(
      "ai_credit_usage_percentage",
      Math.round(org.usagePercentage),
      {
        organization_id: org.id,
        organization_name: org.name,
      },
    );

    // Check for approaching limit (over 80%)
    if (org.usagePercentage >= 80 && !dryRun) {
      console.log(
        chalk.yellow(
          `Organization ${org.name} is approaching credit limit (${Math.round(org.usagePercentage)}%)`,
        ),
      );

      // Log to Cloud Logging with higher severity for alert trigger
      const logEntry = log.entry(
        { severity: "WARNING", resource: { type: "global" } },
        {
          message: `Organization approaching credit limit`,
          organizationId: org.id,
          organizationName: org.name,
          usagePercentage: Math.round(org.usagePercentage),
          currentUsage: Math.round(org.currentUsage),
          monthlyLimit: org.monthlyLimit,
        },
      );
      await log.write(logEntry);
    }
  }

  console.log(
    chalk.green("Successfully reported credit metrics for all organizations."),
  );
}

/**
 * Main function to run monitoring
 */
async function main() {
  console.log(chalk.bold.green("Fluxori AI Credits Monitoring"));
  console.log(chalk.bold.green("============================"));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Project ID: ${projectId}`));
  if (dryRun) {
    console.log(chalk.yellow("DRY RUN MODE - No metrics will be written"));
  }
  console.log(chalk.bold.green("============================\n"));

  // Report credit metrics
  await reportCreditMetrics();

  console.log(chalk.bold.green("\nMonitoring complete!"));
}

// Run main function
main().catch((error) => {
  console.error(chalk.red("Unhandled error:"), error);
  process.exit(1);
});
