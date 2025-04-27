# Emergency Recovery Procedures

If you encounter issues with the marketplace scraper system during your absence, follow these procedures:

## 1. System Not Responding

If the system is not responding to requests:

1. Go to https://console.cloud.google.com/run?project=fluxori-web-app
2. Select the marketplace-scraper service
3. Click the "RESTART" button at the top of the page
4. Wait 2-3 minutes for the service to restart
5. Check the logs to see if there are any startup errors

## 2. Quota Issues

If you receive alerts about high quota usage:

1. Go to the service URL with /quota endpoint to check current usage
2. If usage is above 90%, consider pausing non-critical tasks:
   - Go to https://console.cloud.google.com/cloudscheduler?project=fluxori-web-app
   - Pause the "bob-shop-refresh", "loot-refresh" and "buck-cheap-history" jobs
   - These can stay paused for several days without significant data loss
3. To resume normal operation when usage drops below 70%:
   - Go back to Cloud Scheduler
   - Resume the paused jobs

## 3. Load Shedding Issues

If load shedding detection gets stuck on:

1. Visit the service URL with /status endpoint to check if load shedding is still detected
2. If power is back but the system still reports load shedding, reset it:
   - Call the /admin/reset-load-shedding endpoint with an authenticated POST request
   - This will reset the load shedding detector to normal operation

## 4. Data Issues

If you notice data quality problems:

1. Check the most recent scraper runs in the logs
2. Identify which marketplace has data issues
3. Manually trigger a refresh for that marketplace:
   - Go to the service URL with /tasks/execute endpoint
   - Send a POST request with the payload:
   ```json
   {
     "task_type": "refresh_products",
     "marketplace": "affected_marketplace_name",
     "params": { "max_count": 100 },
     "priority": "HIGH"
   }
   ```
4. Monitor the logs for the results of this manual run

## 5. SmartProxy Authentication Failures

If SmartProxy authentication fails:

1. Go to SmartProxy dashboard and verify your account status
2. Generate a new token if necessary
3. Update the token in Secret Manager:
   - Go to https://console.cloud.google.com/security/secret-manager?project=fluxori-web-app
   - Select the "smartproxy-auth-token" secret
   - Add a new version with the updated token
4. Restart the Cloud Run service to pick up the new token

## 6. Complete Recovery

For a complete system recovery (last resort only):

1. Re-run the deploy-service-account.sh script with your token:
   ```
   cd /home/tarquin_stapa/fluxori
   ./deployment/deploy-service-account.sh
   ```
2. After the infrastructure is set up, go to the Google Cloud Console
3. From the Cloud Run section, click "CREATE SERVICE"
4. Create a new revision of the marketplace-scraper service
5. After deployment, get the new service URL
6. Update the finish-deployment.sh script with the new URL
7. Run finish-deployment.sh to set up the scheduler jobs and monitoring

## Contact Information

For emergency support, contact:

- DevOps Team: devops@fluxori.com
- SmartProxy Support: support@smartproxy.com
- Google Cloud Support: https://cloud.google.com/support

Keep this document accessible during your travel for quick reference in case of issues.
