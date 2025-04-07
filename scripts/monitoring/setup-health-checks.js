/**
 * Fluxori Health Check and Monitoring Setup Script
 * 
 * This script sets up health checks and uptime monitoring for the Fluxori application
 * using Google Cloud Monitoring APIs directly. This allows for more fine-grained
 * control than using Terraform alone.
 */

const { google } = require('googleapis');
const { monitoring } = require('@google-cloud/monitoring');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Command line arguments
const args = process.argv.slice(2);
const projectId = args.find(arg => arg.startsWith('--project='))?.split('=')[1];
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'dev';
const region = args.find(arg => arg.startsWith('--region='))?.split('=')[1] || 'africa-south1';

if (!projectId) {
  console.error(chalk.red('Error: Project ID is required. Use --project=YOUR_PROJECT_ID'));
  process.exit(1);
}

// Configuration based on environment
const config = {
  dev: {
    backend: {
      url: `https://fluxori-backend-dev-${region}.run.app`,
      healthEndpoint: '/health',
    },
    frontend: {
      url: `https://fluxori-frontend-dev-${region}.run.app`,
      healthEndpoint: '/',
    }
  },
  staging: {
    backend: {
      url: `https://fluxori-backend-staging-${region}.run.app`,
      healthEndpoint: '/health',
    },
    frontend: {
      url: `https://fluxori-frontend-staging-${region}.run.app`,
      healthEndpoint: '/',
    }
  },
  prod: {
    backend: {
      url: 'https://api.fluxori.com',
      healthEndpoint: '/health',
    },
    frontend: {
      url: 'https://app.fluxori.com',
      healthEndpoint: '/',
    }
  }
};

// Get configuration for current environment
const envConfig = config[env];
if (!envConfig) {
  console.error(chalk.red(`Error: Invalid environment "${env}". Valid options: dev, staging, prod`));
  process.exit(1);
}

// Initialize monitoring client
const client = new monitoring.UptimeCheckServiceClient({
  projectId,
});

/**
 * Creates an uptime check configuration
 */
async function createUptimeCheck(displayName, url, resource) {
  try {
    const parent = client.projectPath(projectId);
    
    // Create request
    const request = {
      parent,
      uptimeCheckConfig: {
        displayName,
        monitoredResource: resource,
        httpCheck: {
          path: new URL(url).pathname,
          port: 443,
          useSsl: true,
          validateSsl: true,
        },
        period: {
          seconds: 300, // Check every 5 minutes
        },
        timeout: {
          seconds: 30,
        },
        contentMatchers: [
          {
            content: 'success|healthy|ok',
            matcher: 'MATCHES_REGEX',
          }
        ],
      },
    };
    
    // Create uptime check
    const [response] = await client.createUptimeCheckConfig(request);
    console.log(chalk.green(`Created uptime check: ${displayName}`));
    
    return response;
  } catch (error) {
    console.error(chalk.red(`Error creating uptime check ${displayName}:`), error.message);
    return null;
  }
}

/**
 * Sets up all uptime checks for Fluxori application
 */
async function setupUptimeChecks() {
  console.log(chalk.blue('Setting up uptime checks...'));
  
  try {
    // Backend API health check
    const backendHealthUrl = `${envConfig.backend.url}${envConfig.backend.healthEndpoint}`;
    await createUptimeCheck(
      `Fluxori Backend API Health (${env})`,
      backendHealthUrl,
      {
        type: 'uptime_url',
        labels: {
          host: new URL(backendHealthUrl).hostname,
        },
      }
    );
    
    // Frontend application health check
    const frontendHealthUrl = `${envConfig.frontend.url}${envConfig.frontend.healthEndpoint}`;
    await createUptimeCheck(
      `Fluxori Frontend App (${env})`,
      frontendHealthUrl,
      {
        type: 'uptime_url',
        labels: {
          host: new URL(frontendHealthUrl).hostname,
        },
      }
    );
    
    // Additional API endpoints to check
    const apiEndpoints = [
      { name: 'Authentication API', path: '/api/auth/status' },
      { name: 'Inventory API', path: '/api/inventory/status' },
      { name: 'AI Credits API', path: '/api/ai-credits/status' },
    ];
    
    for (const endpoint of apiEndpoints) {
      const url = `${envConfig.backend.url}${endpoint.path}`;
      await createUptimeCheck(
        `Fluxori ${endpoint.name} (${env})`,
        url,
        {
          type: 'uptime_url',
          labels: {
            host: new URL(url).hostname,
          },
        }
      );
    }
    
    console.log(chalk.green('All uptime checks created successfully!'));
  } catch (error) {
    console.error(chalk.red('Error setting up uptime checks:'), error.message);
  }
}

/**
 * Creates an alerting policy for uptime check failures
 */
async function createUptimeAlertPolicy() {
  console.log(chalk.blue('Setting up uptime check alerting policy...'));
  
  try {
    // Initialize monitoring admin client
    const monitoringAdmin = google.monitoring({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      }),
    });
    
    // List existing notification channels
    const notificationChannels = await monitoringAdmin.projects.notificationChannels.list({
      name: `projects/${projectId}`,
    });
    
    const channelIds = notificationChannels.data.notificationChannels?.map(channel => channel.name) || [];
    
    if (channelIds.length === 0) {
      console.warn(chalk.yellow('Warning: No notification channels found. Alerts will not be sent.'));
    }
    
    // Create uptime check alert policy
    const alertPolicy = {
      displayName: `Fluxori Uptime Check Failures (${env})`,
      combiner: 'OR',
      conditions: [
        {
          displayName: 'Uptime check failure',
          conditionThreshold: {
            filter: 'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url" AND metric.label.check_id=~"fluxori.*"',
            comparison: 'COMPARISON_LT',
            thresholdValue: 1, // Alert when check_passed is less than 1 (i.e., 0 = failed)
            duration: '300s', // Alert after uptime check fails for 2 consecutive checks (5 min interval)
            trigger: {
              count: 1,
            },
            aggregations: [
              {
                alignmentPeriod: '300s',
                perSeriesAligner: 'ALIGN_NEXT_OLDER',
                crossSeriesReducer: 'REDUCE_COUNT_FALSE',
                groupByFields: ['resource.label.host'],
              },
            ],
          },
        },
      ],
      alertStrategy: {
        autoClose: '1800s', // Auto-close after 30 minutes of recovery
      },
      notificationChannels: channelIds,
      documentation: {
        content: `
# Fluxori Service Downtime Alert

One or more Fluxori services are not responding to health checks.

## Impact
Service may be unavailable to users in ${env} environment.

## Troubleshooting Steps
1. Check Cloud Run service logs in project ${projectId}
2. Verify Firestore connectivity
3. Check for recent deployments
4. Verify external dependencies (Vertex AI, etc.)

## Escalation Contacts
- Primary: ${process.env.PRIMARY_CONTACT || 'oncall@fluxori.com'}
- Secondary: ${process.env.SECONDARY_CONTACT || 'oncall-backup@fluxori.com'}
`,
        mimeType: 'text/markdown',
      },
    };
    
    const response = await monitoringAdmin.projects.alertPolicies.create({
      name: `projects/${projectId}`,
      requestBody: alertPolicy,
    });
    
    console.log(chalk.green(`Created uptime check alert policy: ${response.data.name}`));
  } catch (error) {
    console.error(chalk.red('Error creating alert policy:'), error.message);
  }
}

/**
 * Main function to run all setup
 */
async function main() {
  console.log(chalk.bold.green('Fluxori Health Check & Monitoring Setup'));
  console.log(chalk.bold.green('====================================='));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Project ID: ${projectId}`));
  console.log(chalk.blue(`Region: ${region}`));
  console.log(chalk.bold.green('=====================================\n'));
  
  // Setup uptime checks
  await setupUptimeChecks();
  
  // Create alert policy
  await createUptimeAlertPolicy();
  
  console.log(chalk.bold.green('\nSetup complete!'));
}

// Run main function
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});