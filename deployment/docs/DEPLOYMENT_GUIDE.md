# South African Marketplace Scrapers Deployment Guide

This guide provides comprehensive instructions for deploying the marketplace scrapers to Google Cloud Platform, optimized for the South African market.

## Prerequisites

- Google Cloud Platform account with billing enabled
- SmartProxy account with token
- Service account with appropriate permissions
- `gcloud` CLI configured

## Deployment Components

The deployment consists of the following components:

1. **Infrastructure** - GCP services, service accounts, permissions
2. **Database** - Firestore database for storing scraped data
3. **Application** - Cloud Run service running the scraper code
4. **Scheduler** - Cloud Scheduler jobs for running scrapers on schedule
5. **Monitoring** - Monitoring and alerting for system health

## Deployment Process

The deployment is handled by two main scripts:

1. `deploy-service-account.sh` - Sets up the basic infrastructure
2. `finish-deployment.sh` - Sets up scheduler jobs and monitoring

### Step 1: Set up Infrastructure

The first script handles:
- Service account authentication
- Enabling required APIs
- Creating service account for the scraper
- Assigning necessary permissions
- Storing SmartProxy token in Secret Manager
- Setting up Firestore database
- Creating Pub/Sub topics and subscriptions

```bash
# Run the deployment script
cd /home/tarquin_stapa/fluxori
./deployment/deploy-service-account.sh
```

### Step 2: Deploy the Application

The application is deployed directly from the Google Cloud Console:

1. Go to https://console.cloud.google.com/run?project=fluxori-web-app
2. Click "CREATE SERVICE"
3. Choose "Continuously deploy from a repository" or "Deploy a prebuilt container"
4. Configure the service:
   - Name: marketplace-scraper
   - Region: africa-south1
   - Memory: 2Gi
   - CPU: 1
   - Max instances: 2
   - Min instances: 0
   - Service account: marketplace-scraper-sa@fluxori-web-app.iam.gserviceaccount.com
   - Allow unauthenticated invocations: Yes
   - Environment variables:
     - GCP_PROJECT_ID=fluxori-web-app
     - GCP_REGION=africa-south1
     - CONFIG_PATH=/app/deployment/config.json
5. Click "CREATE"

### Step 3: Set up Scheduler and Monitoring

After the application is deployed:

1. Get the service URL from the Cloud Run console
2. Update the SERVICE_URL variable in finish-deployment.sh
3. Run the finish-deployment.sh script:

```bash
# Update the service URL first
nano /home/tarquin_stapa/fluxori/deployment/finish-deployment.sh

# Run the script
cd /home/tarquin_stapa/fluxori
./deployment/finish-deployment.sh
```

This will:
- Create scheduler jobs for all marketplaces
- Set up monitoring and alerting
- Create final documentation

## South African Market Optimizations

This deployment is optimized for the South African market:

- **Location** - Deployed in africa-south1 (Johannesburg) region
- **Load Shedding** - Includes load shedding detection and adaptation
- **Local Marketplaces** - Optimized for Takealot, Bob Shop, Makro, Loot, and Buck.cheap
- **Quota Management** - Conservative quota usage (82K monthly requests)
- **Time Zone** - All schedules use Africa/Johannesburg time zone

## Verifying the Deployment

After deployment, verify:

1. **Cloud Run Service** - Service is deployed and running
2. **Firestore** - Database is created and can store data
3. **Pub/Sub** - Topics and subscriptions are created
4. **Cloud Scheduler** - All scheduler jobs are created and scheduled
5. **Secret Manager** - SmartProxy token is securely stored
6. **Monitoring** - Alerts are configured correctly

## Autonomous Operation

The system is designed to run autonomously:

- **Self-Healing** - Automatically adapts to load shedding
- **Quota Management** - Self-limits to avoid exceeding API quotas
- **Error Recovery** - Automatically retries failed tasks
- **Alerting** - Sends alerts for critical issues
- **Monitoring** - Tracks health and performance metrics

## Maintenance and Updates

For future maintenance and updates:

1. Make code changes to the repository
2. Use the Cloud Build trigger for automatic deployment
3. Monitor system health through the monitoring dashboard
4. Review logs regularly for any issues

## Troubleshooting

For troubleshooting, refer to:

- **Emergency Recovery** - See EMERGENCY_RECOVERY.md
- **Pre-Departure Checklist** - See PRE_DEPARTURE_CHECKLIST.md
- **Logs** - Cloud Run logs and Firestore audit logs
- **Monitoring** - Custom dashboard in Cloud Monitoring