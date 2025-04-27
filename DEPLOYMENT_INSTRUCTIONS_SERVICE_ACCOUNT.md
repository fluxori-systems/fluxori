# Marketplace Scraper Deployment with Service Account

This document provides instructions for deploying the marketplace scrapers to Google Cloud Platform using a service account for automation.

## Prerequisites

Before you begin, make sure:

1. You have a Google Cloud Platform account with billing enabled
2. You have your SmartProxy API token available
3. You can create a service account with appropriate permissions

## Deployment Steps

### Step 1: Create a Service Account

1. Go to the Google Cloud Console: https://console.cloud.google.com/
2. Navigate to IAM & Admin > Service Accounts
3. Click "Create Service Account"
4. Name it "fluxori-deployment-sa" (or similar)
5. Grant it the following roles:
   - Cloud Run Admin
   - Firestore Admin
   - Secret Manager Admin
   - Pub/Sub Admin
   - Monitoring Admin
   - Service Account User
6. Click "Create and Continue"
7. Click "Done"

### Step 2: Create a Service Account Key

1. On the Service Accounts page, find your new service account
2. Click the three dots in the "Actions" column
3. Select "Manage keys"
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Click "Create" - this will download the key file to your computer

### Step 3: Prepare the Environment

1. Copy the downloaded key file to:

   ```
   /home/tarquin_stapa/fluxori/deployment/keys/service-account.json
   ```

2. Make sure your SmartProxy token is saved to:
   ```
   /home/tarquin_stapa/fluxori/smartproxy_token.txt
   ```

### Step 4: Run the Deployment Script

Execute the service account deployment script:

```bash
cd /home/tarquin_stapa/fluxori
./deployment/deploy-service-account.sh
```

The script will:

1. Authenticate using the service account
2. Set up the infrastructure on Google Cloud
3. Store your SmartProxy token securely
4. Configure Firestore database
5. Create the necessary Pub/Sub topics
6. Generate deployment documentation

### Step 5: Complete the Deployment

After the script runs successfully, you need to:

1. **Build and push the container image**:

   ```bash
   cd /home/tarquin_stapa/fluxori/marketplace-scraper
   docker build -t gcr.io/fluxori-marketplace-data/marketplace-scraper:latest -f ../deployment/Dockerfile .
   docker push gcr.io/fluxori-marketplace-data/marketplace-scraper:latest
   ```

2. **Deploy to Cloud Run**:

   ```bash
   gcloud run deploy marketplace-scraper \
     --image=gcr.io/fluxori-marketplace-data/marketplace-scraper:latest \
     --platform=managed \
     --region=africa-south1 \
     --memory=2Gi \
     --cpu=1 \
     --max-instances=2 \
     --min-instances=0 \
     --service-account=marketplace-scraper-sa@fluxori-marketplace-data.iam.gserviceaccount.com \
     --allow-unauthenticated \
     --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1,CONFIG_PATH=/app/deployment/config.json"
   ```

3. **Set up Cloud Scheduler jobs** (once your service is deployed):

   ```bash
   # Get your service URL
   SERVICE_URL=$(gcloud run services describe marketplace-scraper --platform=managed --region=africa-south1 --format="value(status.url)")

   # Create sample scheduler job for Takealot product refresh
   gcloud scheduler jobs create http marketplace-scraper-takealot-refresh \
     --location=africa-south1 \
     --schedule="0 */4 * * *" \
     --time-zone="Africa/Johannesburg" \
     --uri="${SERVICE_URL}/tasks/execute" \
     --http-method="POST" \
     --headers="Content-Type=application/json" \
     --message-body='{"task_type":"refresh_products","marketplace":"takealot","params":{"max_count":500},"priority":"HIGH"}' \
     --attempt-deadline="300s"
   ```

## Post-Deployment Verification

Verify your deployment by:

1. Visiting the service URL in your browser
2. Adding `/status` to check the system status
3. Checking the Firestore database for sample data
4. Verifying Cloud Scheduler jobs are created

## Documentation

Review the generated documentation at:

- `deployment/docs/MONITORING_INSTRUCTIONS.md`

## Security

After deployment:

1. Store the service account key securely
2. Consider revoking the key when no longer needed
3. Regularly monitor the GCP audit logs
