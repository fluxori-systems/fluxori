# Manual Deployment Instructions for Marketplace Scrapers

The automated deployment through Cloud Build appears to be experiencing issues. Follow these manual steps to complete the deployment:

## 1. Deploy Cloud Run Service Using the Console

1. Go to the Google Cloud Console: https://console.cloud.google.com/run?project=fluxori-web-app
2. Click "CREATE SERVICE"
3. Choose the "Continuously deploy from a repository" option
   - Connect to your repository where the marketplace scraper code is stored
   - Select the branch containing the code
   - Set the build type to "Dockerfile"
   - Use the Dockerfile at `/marketplace-scraper/Dockerfile`
4. Configure the service:
   - **Service name**: `marketplace-scraper`
   - **Region**: `africa-south1` (Johannesburg)
   - **CPU allocation**: `CPU is only allocated during request processing`
   - **Autoscaling**: 
     - Minimum instances: `0`
     - Maximum instances: `2`
   - **CPU**: `1`
   - **Memory**: `2GiB`
   - **Request timeout**: `300 seconds`
   - **Service account**: `marketplace-scraper-sa@fluxori-web-app.iam.gserviceaccount.com`
   - **Ingress**: `Allow all traffic`
   - **Authentication**: `Allow unauthenticated invocations`
5. Expand "Container, Networking, Security" and add these environment variables:
   - `GCP_PROJECT_ID`: `fluxori-web-app`
   - `GCP_REGION`: `africa-south1`
   - `CONFIG_PATH`: `/app/deployment/config.json`
6. Click "CREATE"

## 2. Alternative: Deploy Using a Pre-Built Container

If you have problems with the source code approach:

1. Go to Cloud Shell in the Google Cloud Console
2. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/fluxori.git
   cd fluxori/marketplace-scraper
   ```
3. Build the container manually:
   ```bash
   gcloud builds submit --tag gcr.io/fluxori-web-app/marketplace-scraper:latest
   ```
4. Deploy the container:
   ```bash
   gcloud run deploy marketplace-scraper \
     --image=gcr.io/fluxori-web-app/marketplace-scraper:latest \
     --platform=managed \
     --region=africa-south1 \
     --memory=2Gi \
     --cpu=1 \
     --max-instances=2 \
     --min-instances=0 \
     --service-account=marketplace-scraper-sa@fluxori-web-app.iam.gserviceaccount.com \
     --allow-unauthenticated \
     --set-env-vars="GCP_PROJECT_ID=fluxori-web-app,GCP_REGION=africa-south1,CONFIG_PATH=/app/deployment/config.json"
   ```

## 3. After Successful Deployment

Once the Cloud Run service is deployed:

1. Get the service URL from the Cloud Run console
2. Verify the service is working by visiting the health endpoint:
   ```
   https://your-service-url/health
   ```
3. Update the SERVICE_URL in the finish-deployment.sh script:
   ```bash
   # From Cloud Shell or your local machine
   nano /path/to/fluxori/deployment/finish-deployment.sh
   # Change line 24 to:
   SERVICE_URL="https://your-service-url"
   ```
4. Run the finish-deployment.sh script to set up scheduler jobs and monitoring:
   ```bash
   ./deployment/finish-deployment.sh
   ```

## 4. Verify Configuration

After completing the deployment:

1. Check the Firestore database for test data:
   - Go to https://console.cloud.google.com/firestore/data?project=fluxori-web-app
   - Look for the "products" collection
   
2. Verify scheduler jobs are created:
   - Go to https://console.cloud.google.com/cloudscheduler?project=fluxori-web-app
   - You should see jobs for each marketplace
   
3. Test a manual scrape:
   - Use cURL or a tool like Postman
   - Send a POST request to `https://your-service-url/tasks/execute`
   - With this JSON body:
   ```json
   {
     "task_type": "refresh_products",
     "marketplace": "takealot",
     "params": {"max_count": 5},
     "priority": "HIGH"
   }
   ```

4. Check logs:
   - Go to https://console.cloud.google.com/logs?project=fluxori-web-app
   - Filter for the marketplace-scraper service

## 5. Before Your Departure

Complete all the steps in the PRE_DEPARTURE_CHECKLIST.md to ensure the system will run autonomously during your absence.