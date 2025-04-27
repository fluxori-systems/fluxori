# Marketplace Scraper Deployment Instructions

This document provides simple instructions for deploying the marketplace scrapers to Google Cloud Platform.

## Prerequisites

Before you begin, make sure:

1. You have a Google Cloud Platform account with billing enabled
2. You have your SmartProxy API token available
3. You have Docker installed if you're running the deployment locally

## Deployment Steps

### Step 1: Prepare the Environment

Make sure you're in the project directory:

```bash
cd /home/tarquin_stapa/fluxori
```

### Step 2: Run the Deployment Script

Execute the all-in-one deployment script with your SmartProxy token:

```bash
./deployment/deploy-all.sh YOUR_SMARTPROXY_TOKEN_HERE
```

If you don't provide the token on the command line, the script will prompt you to enter it.

### Step 3: Monitor the Deployment

The script will guide you through the deployment process with clear status updates. The entire deployment should take approximately 15-20 minutes to complete.

You'll see progress indicators for each phase:

1. Foundation Infrastructure
2. Database Setup
3. Application Deployment
4. Scheduler Setup
5. Monitoring Setup
6. Validation and Testing

### Step 4: Verify Successful Deployment

When deployment completes successfully, you'll see:

```
DEPLOYMENT SUCCESSFULLY COMPLETED!

Your marketplace scrapers are now deployed and will run
autonomously during your 3-week absence.

Service URL: https://marketplace-scraper-xxxx-xx.a.run.app
Dashboard: https://console.cloud.google.com/monitoring/dashboards?project=fluxori-marketplace-data
```

### Step 5: Test the Deployment

Visit the service URL in your browser to verify it's running properly.

Add `/status` to the URL to check the system status:

```
https://marketplace-scraper-xxxx-xx.a.run.app/status
```

## Post-Deployment Verification

Before your departure, verify:

1. The service is responding to requests
2. The monitoring dashboard shows data
3. You can receive alert emails
4. The scheduled tasks are running

## Documentation

Review the following documents that were created during deployment:

- `deployment/docs/MONITORING_INSTRUCTIONS.md` - How to monitor the system
- `deployment/docs/EMERGENCY_RECOVERY.md` - How to recover from issues

## Support

If you encounter issues during deployment, contact:

- DevOps Team: devops@fluxori.com
