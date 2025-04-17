#!/bin/bash
# Script to complete the marketplace scraper deployment

set -e  # Exit on error

# Settings from service account deployment script
PROJECT_ID="fluxori-web-app"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
SA_NAME="${SERVICE_NAME}-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Creating topic and subscription if they don't exist..."
if ! gcloud pubsub topics describe ${SERVICE_NAME}-tasks &>/dev/null; then
  gcloud pubsub topics create ${SERVICE_NAME}-tasks
  gcloud pubsub subscriptions create ${SERVICE_NAME}-subscription \
    --topic=${SERVICE_NAME}-tasks \
    --ack-deadline=300
else
  echo "Topic already exists"
fi

echo "Creating scheduler jobs..."
SERVICE_URL="https://${SERVICE_NAME}-hash-africa-south1.a.run.app"

create_scheduler_job() {
  local name=$1
  local schedule=$2
  local marketplace=$3
  local task_type=$4
  local priority=$5
  local params=$6
  
  echo "Setting up ${marketplace} ${task_type} job..."
  
  # Check if job already exists
  if gcloud scheduler jobs describe "${SERVICE_NAME}-${name}" --location=${REGION} &>/dev/null; then
    gcloud scheduler jobs delete "${SERVICE_NAME}-${name}" --location=${REGION} --quiet
  fi
  
  # Create the job
  gcloud scheduler jobs create http "${SERVICE_NAME}-${name}" \
    --location=${REGION} \
    --schedule="${schedule}" \
    --time-zone="Africa/Johannesburg" \
    --uri="${SERVICE_URL}/tasks/execute" \
    --http-method="POST" \
    --headers="Content-Type=application/json" \
    --message-body="{\"task_type\":\"${task_type}\",\"marketplace\":\"${marketplace}\",\"params\":${params},\"priority\":\"${priority}\"}" \
    --attempt-deadline="300s" \
    --description="Scraper job for ${marketplace} ${task_type}"
}

# Create scheduler jobs
create_scheduler_job "takealot-refresh" "0 */4 * * *" "takealot" "refresh_products" "HIGH" "{\"max_count\":500}"
create_scheduler_job "takealot-deals" "0 9,13,17 * * *" "takealot" "extract_daily_deals" "HIGH" "{}"
create_scheduler_job "amazon-refresh" "0 */6 * * *" "amazon" "refresh_products" "HIGH" "{\"max_count\":300}"
create_scheduler_job "makro-refresh" "0 */8 * * *" "makro" "refresh_products" "MEDIUM" "{\"max_count\":200}"
create_scheduler_job "loot-refresh" "0 */12 * * *" "loot" "refresh_products" "MEDIUM" "{\"max_count\":150}"
create_scheduler_job "bob-shop-refresh" "0 */12 * * *" "bob_shop" "refresh_products" "MEDIUM" "{\"max_count\":100}"
create_scheduler_job "buck-cheap-history" "0 2 * * *" "buck_cheap" "extract_history" "LOW" "{\"max_count\":100}"
create_scheduler_job "load-shedding-check" "*/30 * * * *" "takealot" "check_load_shedding" "CRITICAL" "{}"

echo "Setting up monitoring..."
EMAIL="alerts@fluxori.com"
CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="marketplace-scraper-alerts" \
  --type=email \
  --channel-labels=email_address=${EMAIL} \
  --format="value(name)" 2>/dev/null || echo "")

# Create alert policies
create_alert_policy() {
  local name=$1
  local display_name=$2
  local filter=$3
  local threshold=$4
  local comparison=$5
  local duration=$6
  
  echo "Setting up ${display_name} alert..."
  
  # Check if policy already exists
  POLICY_ID=$(gcloud alpha monitoring policies list \
    --filter="displayName='${display_name}'" \
    --format="value(name)" 2>/dev/null || echo "")
  
  if [[ -n "${POLICY_ID}" ]]; then
    gcloud alpha monitoring policies delete ${POLICY_ID} --quiet
  fi
  
  # Create an alert policy
  gcloud alpha monitoring policies create \
    --display-name="${display_name}" \
    --condition-filter="${filter}" \
    --condition-threshold-value="${threshold}" \
    --condition-threshold-comparison="${comparison}" \
    --condition-threshold-duration="${duration}" \
    --notification-channels="${CHANNEL_ID}" \
    --documentation-content="Alert for ${display_name}" \
    --documentation-format="text/markdown" \
    --if-exists="overwrite" \
    --quiet
}

# Create alerts for key metrics
create_alert_policy "quota" "Marketplace Scraper - High Quota Usage" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/quota_usage\" resource.type=\"global\"" \
  "80" "COMPARISON_GT" "0s"

create_alert_policy "error" "Marketplace Scraper - High Error Rate" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/error_rate\" resource.type=\"global\"" \
  "20" "COMPARISON_GT" "600s"

create_alert_policy "loadshedding" "Marketplace Scraper - Load Shedding Detected" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/loadshedding_detected\" resource.type=\"global\"" \
  "0" "COMPARISON_GT" "0s"

create_alert_policy "inactivity" "Marketplace Scraper - Service Inactivity" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/tasks_completed\" resource.type=\"global\"" \
  "1" "COMPARISON_LT" "21600s"

echo "Creating final documentation..."
mkdir -p /home/tarquin_stapa/fluxori/deployment/docs
cat > /home/tarquin_stapa/fluxori/deployment/docs/PRE_DEPARTURE_CHECKLIST.md << EOF
# Pre-Departure Checklist for Marketplace Scrapers

Before your 3-week absence, verify the following:

## Infrastructure
- [ ] Cloud Run service is deployed and healthy
- [ ] Firestore database is properly set up
- [ ] Pub/Sub topics and subscriptions are configured
- [ ] Cloud Scheduler jobs are created and scheduled
- [ ] Monitoring and alerting is set up

## Functionality
- [ ] Takealot scraper is working
- [ ] Amazon scraper is working
- [ ] Bob Shop scraper is working
- [ ] Makro scraper is working
- [ ] Loot scraper is working
- [ ] Buck.cheap scraper is working
- [ ] Load shedding detection is working

## Security
- [ ] SmartProxy token is securely stored in Secret Manager
- [ ] Service account has appropriate permissions
- [ ] No sensitive information is exposed in code
- [ ] Access controls are properly configured

## Emergency Procedures
- [ ] You have access to GCP Console from your travel devices
- [ ] You have tested email alerts delivery
- [ ] You have documented emergency recovery procedures
- [ ] Key contacts have been informed of your absence

## First Day Verification
After the deployment is complete, perform these checks:
- [ ] Visit the service URL to check health endpoint
- [ ] Monitor logs for any errors or warnings
- [ ] Verify at least one scheduler job has successfully run
- [ ] Check quota usage metrics to ensure normal consumption
- [ ] Perform a mock load shedding recovery test
- [ ] Verify all marketplaces can be scraped correctly

## Notes
Keep this checklist handy for quick reference during your absence. Complete all items at least 24 hours before departure to allow time for troubleshooting if needed.
EOF

echo "Deployment script completed"
echo "IMPORTANT: After your Cloud Run service is actually deployed, update the SERVICE_URL in this script and re-run"
echo "NEXT STEP: You should check the status of the Cloud Run service in the Google Cloud Console to get the actual service URL"