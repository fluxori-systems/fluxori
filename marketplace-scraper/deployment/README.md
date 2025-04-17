# Marketplace Scraper Deployment

This directory contains configuration files and scripts for deploying the South African Marketplace Scraper to Google Cloud Platform, specifically optimized for the `africa-south1` region (Johannesburg).

## Overview

The deployment infrastructure includes:

- Cloud Run service for running the scraper
- Firestore database for storing scraped data
- Pub/Sub for task distribution
- Cloud Scheduler for scheduling recurring tasks
- Secret Manager for storing sensitive credentials
- Cloud Monitoring for dashboards and alerts
- Custom IAM roles and service accounts

## Prerequisites

Before deploying, ensure you have the following:

1. Google Cloud CLI (`gcloud`) installed and configured
2. Docker installed (for building the container image)
3. Terraform installed (for infrastructure as code deployment)
4. SmartProxy API credentials with sufficient quota (minimum 82,000 requests per month)
5. A Google Cloud project with billing enabled

## Deployment Options

There are two main ways to deploy the system:

### Option 1: Using the Deployment Script (Recommended)

The `deploy.sh` script automates the entire deployment process:

```bash
# Deploy with default settings
./deploy.sh

# Deploy with custom settings
./deploy.sh --project fluxori-marketplace-data \
            --region africa-south1 \
            --service marketplace-scraper \
            --memory 2Gi \
            --cpu 1 \
            --config ./config.json \
            --setup-monitoring \
            --setup-scheduler
```

### Option 2: Using Terraform (Infrastructure as Code)

For a more declarative approach:

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var "project_id=fluxori-marketplace-data" \
               -var "region=africa-south1" \
               -var "smartproxy_auth_token=YOUR_TOKEN"

# Apply the configuration
terraform apply -var "project_id=fluxori-marketplace-data" \
                -var "region=africa-south1" \
                -var "smartproxy_auth_token=YOUR_TOKEN"
```

## Configuration

### config.json

The main configuration file for the scraper service:

```json
{
  "project_id": "fluxori-marketplace-data",
  "region": "africa-south1",
  "monthly_quota": 82000,
  "daily_quota": 2700,
  "schedule_jobs": [
    {
      "name": "daily-product-refresh",
      "cron": "0 */4 * * *",
      "marketplace": "takealot",
      "task_type": "refresh_products",
      "max_count": 500,
      "priority": "HIGH"
    },
    // ... other jobs
  ]
}
```

## Load Shedding Resilience

The system incorporates several mechanisms to handle South African load shedding:

1. **Automatic Detection**: The system can detect load shedding through:
   - Network pattern analysis
   - Failed request pattern monitoring
   - Configurable detection thresholds

2. **Adaptive Behavior**: During load shedding periods:
   - Non-critical tasks are automatically paused
   - Request timeouts are dynamically adjusted
   - Results are cached for longer periods
   - Retry strategies become more conservative

3. **Recovery Mechanisms**: After load shedding:
   - Automatic task rescheduling
   - Gradual resumption of normal operation
   - Recovery of interrupted tasks

## Quota Management

The system implements sophisticated quota management to stay within the 82K monthly limit:

1. **Hierarchical Allocation**:
   - Critical tasks: 40% (32,800 requests)
   - High priority: 30% (24,600 requests)
   - Medium priority: 20% (16,400 requests)
   - Low priority: 5% (4,100 requests)
   - Background: 5% (4,100 requests)

2. **Daily Limits**:
   - Default: 2,700 requests per day
   - Adjustable per category and task type

3. **Circuit Breaker**:
   - Emergency threshold: 95% of quota
   - Warning threshold: 80% of quota
   - Auto-recovery after 3 hours

## Monitoring and Alerting

The deployment includes comprehensive monitoring:

1. **Dashboard**: Real-time visualization of:
   - Quota usage
   - Success rates
   - Response times
   - Task completions
   - Load shedding status

2. **Alerts**:
   - High quota usage (>80%)
   - Elevated error rates (>20%)
   - Load shedding detection
   - Service inactivity (no tasks for 6 hours)

3. **Daily Summary Reports**:
   - Available at `/daily-summary` endpoint
   - Email reports (configurable)

## Troubleshooting

### Common Issues

1. **Deployment Failures**:
   - Check service account permissions
   - Verify API enablement in the GCP project
   - Check billing status

2. **Runtime Errors**:
   - Check logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper"`
   - Verify SmartProxy token validity
   - Check Firestore indexes

3. **Quota Exhaustion**:
   - Review usage patterns in monitoring dashboard
   - Adjust daily and category allocations
   - Consider increasing SmartProxy plan

### Recovery Steps

1. **Service Not Starting**:
   ```bash
   # Check Cloud Run logs
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper" --limit=50
   
   # Restart service
   gcloud run services update marketplace-scraper --region=africa-south1 --clear-env-vars
   gcloud run services update marketplace-scraper --region=africa-south1 --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"
   ```

2. **Scheduler Jobs Failing**:
   ```bash
   # Check job status
   gcloud scheduler jobs describe marketplace-scraper-daily-product-refresh

   # Reset job
   gcloud scheduler jobs update http marketplace-scraper-daily-product-refresh --schedule="0 */4 * * *"
   ```

3. **Manual System Reset**:
   ```bash
   # Clear task queue
   curl -X POST "https://marketplace-scraper-xxxx-uc.a.run.app/tasks/reset" \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}'
   ```

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review quota usage trends
   - Check error patterns
   - Verify data quality

2. **Monthly**:
   - Adjust quota allocation based on usage
   - Update category and keyword priorities
   - Review and optimize scheduling

3. **Quarterly**:
   - Update SmartProxy token
   - Review and update firestore indexes
   - Optimize monitoring thresholds

### Upgrading

To upgrade the deployment:

```bash
# Update the container image
./deploy.sh --force

# Or with terraform
cd terraform
terraform apply -var "container_image=gcr.io/fluxori-marketplace-data/marketplace-scraper:v2"
```