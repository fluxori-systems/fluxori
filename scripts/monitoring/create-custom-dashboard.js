/**
 * Custom Dashboard Creation Script for Fluxori
 * 
 * This script creates custom dashboards optimized for monitoring Fluxori's GCP
 * infrastructure with a focus on South African hosting requirements.
 */

const { google } = require('googleapis');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Command line arguments
const args = process.argv.slice(2);
const projectId = args.find(arg => arg.startsWith('--project='))?.split('=')[1];
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'dev';
const dashboardType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
const region = args.find(arg => arg.startsWith('--region='))?.split('=')[1] || 'africa-south1';

if (!projectId) {
  console.error(chalk.red('Error: Project ID is required. Use --project=YOUR_PROJECT_ID'));
  process.exit(1);
}

// Define service names based on environment
const services = {
  backend: `fluxori-backend-${env}`,
  frontend: `fluxori-frontend-${env}`,
};

/**
 * Creates a dashboard using the Monitoring API
 */
async function createDashboard(dashboardJson) {
  try {
    // Initialize monitoring client
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const monitoring = google.monitoring({
      version: 'v3',
      auth,
    });
    
    // Create the dashboard
    const response = await monitoring.projects.dashboards.create({
      parent: `projects/${projectId}`,
      requestBody: dashboardJson,
    });
    
    console.log(chalk.green(`Created dashboard: ${dashboardJson.displayName}`));
    return response.data;
  } catch (error) {
    console.error(chalk.red(`Error creating dashboard ${dashboardJson.displayName}:`), error.message);
    return null;
  }
}

/**
 * Creates a system overview dashboard
 */
async function createSystemDashboard() {
  console.log(chalk.blue('Creating system overview dashboard...'));
  
  const systemDashboard = {
    displayName: `Fluxori System Dashboard (${env})`,
    gridLayout: {
      widgets: [
        {
          title: "Cloud Run Requests",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/request_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                      groupByFields: ["metric.label.response_code_class"],
                    },
                  },
                  unitOverride: "1",
                },
                plotType: "LINE",
                legendTemplate: "Response Code: ${metric.label.response_code_class}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Requests per minute",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Cloud Run Latency",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/request_latencies"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_PERCENTILE_99",
                      crossSeriesReducer: "REDUCE_MEAN",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "p99 Latency",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/request_latencies"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_PERCENTILE_50",
                      crossSeriesReducer: "REDUCE_MEAN",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "p50 Latency",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Latency (ms)",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Firestore Operations",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="firestore_instance" AND metric.type="firestore.googleapis.com/document_read_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Read Operations",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="firestore_instance" AND metric.type="firestore.googleapis.com/document_write_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Write Operations",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Operations per minute",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "CPU Utilization",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/container/cpu/utilization"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_MEAN",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Backend CPU",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.frontend}" AND metric.type="run.googleapis.com/container/cpu/utilization"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_MEAN",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Frontend CPU",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "CPU utilization",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Memory Utilization",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/container/memory/utilizations"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_MEAN",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Backend Memory",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.frontend}" AND metric.type="run.googleapis.com/container/memory/utilizations"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_MEAN",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Frontend Memory",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Memory utilization",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Instance Count",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/container/instance_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Backend Instances",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.frontend}" AND metric.type="run.googleapis.com/container/instance_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Frontend Instances",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Instance count",
              scale: "LINEAR",
            },
          },
        },
      ],
    },
  };
  
  await createDashboard(systemDashboard);
}

/**
 * Creates an AI services dashboard
 */
async function createAIDashboard() {
  console.log(chalk.blue('Creating AI services dashboard...'));
  
  const aiDashboard = {
    displayName: `Fluxori AI Services Dashboard (${env})`,
    gridLayout: {
      widgets: [
        {
          title: "AI Credit Usage by Organization",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="global" AND metric.type="custom.googleapis.com/fluxori/ai_credits_current_usage"`,
                    aggregation: {
                      alignmentPeriod: "300s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_SUM",
                      groupByFields: ["metric.label.organization_name"],
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "${metric.label.organization_name}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Credits used",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "AI Credit Usage Percentage",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="global" AND metric.type="custom.googleapis.com/fluxori/ai_credit_usage_percentage"`,
                    aggregation: {
                      alignmentPeriod: "300s",
                      perSeriesAligner: "ALIGN_MEAN",
                      crossSeriesReducer: "REDUCE_SUM",
                      groupByFields: ["metric.label.organization_name"],
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "${metric.label.organization_name}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Percentage of monthly allocation",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Vector Search Operations",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="global" AND metric.type="custom.googleapis.com/fluxori/vector_search_operations"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                      groupByFields: ["metric.label.operation_type"],
                    },
                  },
                },
                plotType: "STACKED_BAR",
                legendTemplate: "${metric.label.operation_type}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Operations per minute",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "AI Model Latency",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="global" AND metric.type="custom.googleapis.com/fluxori/ai_model_latency"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_PERCENTILE_95",
                      crossSeriesReducer: "REDUCE_MEAN",
                      groupByFields: ["metric.label.model_type"],
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "${metric.label.model_type}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Latency (ms)",
              scale: "LINEAR",
            },
          },
        },
      ],
    },
  };
  
  await createDashboard(aiDashboard);
}

/**
 * Creates a network performance dashboard optimized for South Africa
 */
async function createNetworkDashboard() {
  console.log(chalk.blue('Creating network performance dashboard...'));
  
  const networkDashboard = {
    displayName: `Fluxori Network Performance Dashboard (${env})`,
    gridLayout: {
      widgets: [
        {
          title: "Network Egress (Outbound Traffic)",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/container/network/sent_bytes_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Backend Egress",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.frontend}" AND metric.type="run.googleapis.com/container/network/sent_bytes_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Frontend Egress",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Bytes per second",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Network Ingress (Inbound Traffic)",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.backend}" AND metric.type="run.googleapis.com/container/network/received_bytes_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Backend Ingress",
              },
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="${services.frontend}" AND metric.type="run.googleapis.com/container/network/received_bytes_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "Frontend Ingress",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Bytes per second",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Request Latency by Region",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="global" AND metric.type="custom.googleapis.com/fluxori/regional_latency"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_PERCENTILE_95",
                      crossSeriesReducer: "REDUCE_MEAN",
                      groupByFields: ["metric.label.region"],
                    },
                  },
                },
                plotType: "LINE",
                legendTemplate: "${metric.label.region}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Latency (ms)",
              scale: "LINEAR",
            },
          },
        },
        {
          title: "Cloud Storage Operations",
          xyChart: {
            dataSets: [
              {
                timeSeriesQuery: {
                  timeSeriesFilter: {
                    filter: `resource.type="gcs_bucket" AND metric.type="storage.googleapis.com/api/request_count"`,
                    aggregation: {
                      alignmentPeriod: "60s",
                      perSeriesAligner: "ALIGN_RATE",
                      crossSeriesReducer: "REDUCE_SUM",
                      groupByFields: ["metric.label.method"],
                    },
                  },
                },
                plotType: "STACKED_BAR",
                legendTemplate: "${metric.label.method}",
              },
            ],
            timeshiftDuration: "0s",
            yAxis: {
              label: "Operations per minute",
              scale: "LINEAR",
            },
          },
        },
      ],
    },
  };
  
  await createDashboard(networkDashboard);
}

/**
 * Main function to create dashboards
 */
async function main() {
  console.log(chalk.bold.green('Fluxori Custom Dashboard Creation'));
  console.log(chalk.bold.green('================================'));
  console.log(chalk.blue(`Environment: ${env}`));
  console.log(chalk.blue(`Project ID: ${projectId}`));
  console.log(chalk.blue(`Dashboard Type: ${dashboardType}`));
  console.log(chalk.bold.green('================================\n'));
  
  if (dashboardType === 'all' || dashboardType === 'system') {
    await createSystemDashboard();
  }
  
  if (dashboardType === 'all' || dashboardType === 'ai') {
    await createAIDashboard();
  }
  
  if (dashboardType === 'all' || dashboardType === 'network') {
    await createNetworkDashboard();
  }
  
  console.log(chalk.bold.green('\nDashboard creation complete!'));
}

// Run main function
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});