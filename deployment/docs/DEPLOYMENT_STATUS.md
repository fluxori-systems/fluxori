# Deployment Status and Verification

The deployment is in progress but may take some time to complete. Here's how to verify each component's status:

## 1. Cloud Run Deployment

```bash
# Check if Cloud Run service is deployed
gcloud run services list --platform=managed --region=africa-south1

# Get the service URL once deployed
gcloud run services describe marketplace-scraper --platform=managed --region=africa-south1 --format="value(status.url)"
```

## 2. Infrastructure Verification

✅ Service account created: `marketplace-scraper-sa@fluxori-web-app.iam.gserviceaccount.com`
✅ Pub/Sub topic created: `marketplace-scraper-tasks`
✅ Pub/Sub subscription created: `marketplace-scraper-subscription`
✅ Secret created: `smartproxy-auth-token`
✅ Permissions granted to service account

## 3. After Deployment Completes

Once the Cloud Run service is deployed (check using the commands above), run the finish-deployment.sh script to set up the scheduler jobs and monitoring:

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe marketplace-scraper --platform=managed --region=africa-south1 --format="value(status.url)")

# Update the SERVICE_URL in finish-deployment.sh (line 24)
sed -i "s|SERVICE_URL=\"https://\${SERVICE_NAME}-hash-africa-south1.a.run.app\"|SERVICE_URL=\"$SERVICE_URL\"|" /home/tarquin_stapa/fluxori/deployment/finish-deployment.sh

# Run the script
cd /home/tarquin_stapa/fluxori
./deployment/finish-deployment.sh
```

## 4. Verifying the Scrapers are Working

Once the deployment is complete and the scheduler jobs are set up, verify the scrapers are working:

1. Visit the service health endpoint:

   ```
   curl ${SERVICE_URL}/health
   ```

2. Manually trigger a test scraper run:

   ```
   curl -X POST ${SERVICE_URL}/tasks/execute \
     -H "Content-Type: application/json" \
     -d '{"task_type":"refresh_products","marketplace":"takealot","params":{"max_count":5},"priority":"HIGH"}'
   ```

3. Check logs to see if the scraper executed successfully:

   ```
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper" --limit=10
   ```

4. Check Firestore for newly stored data:
   ```
   gcloud firestore documents list --collection=products --limit=5
   ```

## 5. Pre-Departure Verification

Before your 3-week absence, follow the pre-departure checklist in `/home/tarquin_stapa/fluxori/deployment/docs/PRE_DEPARTURE_CHECKLIST.md`

## 6. Cloud Build Issues

If you continue to experience Cloud Build issues, you can try an alternative deployment approach:

1. Go to the Google Cloud Console: https://console.cloud.google.com/run?project=fluxori-web-app
2. Click "CREATE SERVICE"
3. Choose "Deploy from source"
4. Connect to your repository where the marketplace-scraper code is stored
5. Configure the settings as described in the documentation
6. Click "CREATE"
