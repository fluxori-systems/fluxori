# Fluxori Monitoring Scripts

This directory contains monitoring scripts for the Fluxori application. These scripts are designed to set up and manage monitoring, alerting, and dashboard creation for the Fluxori application running on Google Cloud Platform.

## Prerequisites

- Node.js 14+
- Google Cloud SDK
- Appropriate permissions to create monitoring resources in the GCP project
- Service account credentials with access to Firestore, Cloud Monitoring, and Cloud Logging

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
export GCP_PROJECT_ID=your-project-id
```

## Scripts

### Health Checks Setup

Sets up health checks and uptime monitoring for Fluxori services.

```bash
# Usage
npm run setup-health-checks -- --project=your-project-id --env=dev|staging|prod --region=africa-south1
```

Options:
- `--project`: (Required) GCP project ID
- `--env`: (Optional) Environment (dev, staging, prod). Default: dev
- `--region`: (Optional) Region. Default: africa-south1

### AI Credits Monitoring

Monitors AI credits usage across organizations and reports metrics to Google Cloud Monitoring.

```bash
# Usage
npm run monitor-credits -- --project=your-project-id --env=dev|staging|prod [--dry-run]
```

Options:
- `--project`: (Required) GCP project ID
- `--env`: (Optional) Environment (dev, staging, prod). Default: dev
- `--dry-run`: (Optional) Run in dry run mode (no metrics will be written)

### Custom Dashboard Creation

Creates custom dashboards for monitoring Fluxori's GCP infrastructure.

```bash
# Usage
npm run create-dashboard -- --project=your-project-id --env=dev|staging|prod --type=all|system|ai|network
```

Options:
- `--project`: (Required) GCP project ID
- `--env`: (Optional) Environment (dev, staging, prod). Default: dev
- `--type`: (Optional) Dashboard type. Can be 'all', 'system', 'ai', or 'network'. Default: all

## Setting Up Cron Jobs

You can set up cron jobs to run these scripts periodically. For example:

```bash
# Run AI credits monitoring every hour
0 * * * * cd /path/to/fluxori/scripts/monitoring && npm run monitor-credits -- --project=your-project-id > /var/log/fluxori/credits-monitor.log 2>&1
```

## South Africa-Specific Optimizations

These scripts are optimized for monitoring a GCP deployment in South Africa, specifically:

1. **Regional Configuration**: Using `africa-south1` (Johannesburg) as the primary region.
2. **Network Monitoring**: Special focus on monitoring network latency and performance, which is crucial for South African users.
3. **Cost Monitoring**: Monitoring of Cloud Storage operations to optimize costs (data transfer costs in South Africa can be higher).

## Dashboards

The dashboards created by these scripts include:

1. **System Dashboard**: Monitors Cloud Run services, Firestore operations, and system resources.
2. **AI Services Dashboard**: Monitors AI credits usage, Vertex AI operations, and model performance.
3. **Network Performance Dashboard**: Monitors network traffic, latency by region, and Cloud Storage operations.

## Alerting Policies

The scripts set up the following alerting policies:

1. **High Error Rate Alert**: Alerts when there is a high rate of 5xx errors.
2. **High Latency Alert**: Alerts when API latency exceeds thresholds.
3. **Uptime Check Failures**: Alerts when health checks fail.
4. **AI Credit Usage Threshold**: Alerts when organizations are approaching their credit limits.

## Troubleshooting

- **Authentication Issues**: Ensure your service account has the necessary permissions (Monitoring Admin, Logs Writer, etc.)
- **API Quotas**: Check for API quota limitations if you're creating many monitoring resources
- **Log Files**: Check the Cloud Logging console for logs from the scripts