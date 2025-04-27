#!/bin/bash
# Deployment script for quota upgrade changes

set -e  # Exit on error

echo "=================================================="
echo "SmartProxy Quota Upgrade Deployment Script"
echo "Updated Monthly Quota: 216,000 requests"
echo "Updated Daily Quota: 7,200 requests"
echo "=================================================="

# Configuration
PROJECT_ID="fluxori-web-app"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_ENV=${1:-"prod"}
DEPLOYMENT_ID="quota-upgrade-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="./backups/${DEPLOYMENT_ID}"
CONFIG_PATH="./config.json"
SUPPORT_EMAIL="alerts@fluxori.com"
LOG_FILE="../deployment_output.log"

# Create backup directory
mkdir -p $BACKUP_DIR
echo "Created backup directory: $BACKUP_DIR"

# Function to log messages
log_message() {
  local message=$1
  local level=${2:-"INFO"}
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] [$level] $message" | tee -a $LOG_FILE
}

log_message "Starting SmartProxy quota upgrade deployment for ${DEPLOY_ENV} environment" "INFO"
log_message "Deployment ID: ${DEPLOYMENT_ID}" "INFO"

# Check environment
if [ "$DEPLOY_ENV" != "prod" ] && [ "$DEPLOY_ENV" != "staging" ]; then
  log_message "Invalid environment: ${DEPLOY_ENV}. Must be 'prod' or 'staging'" "ERROR"
  exit 1
fi

# Check gcloud auth
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  log_message "Not authenticated with gcloud. Please run 'gcloud auth login'" "ERROR"
  exit 1
fi

# Check for active project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  log_message "Setting project to $PROJECT_ID..." "INFO"
  gcloud config set project $PROJECT_ID
fi

# Backup current configuration
log_message "Backing up current configuration..." "INFO"

# Backup config file
cp $CONFIG_PATH "${BACKUP_DIR}/config.json.bak"

# Backup Cloud Scheduler jobs
log_message "Backing up Cloud Scheduler jobs..." "INFO"
gcloud scheduler jobs list --format=json > "${BACKUP_DIR}/scheduler-jobs.json"

# Backup monitoring configuration
log_message "Backing up monitoring configuration..." "INFO"
mkdir -p "${BACKUP_DIR}/monitoring"
gcloud monitoring policies list --format=json > "${BACKUP_DIR}/monitoring/alert-policies.json"
gcloud monitoring dashboards list --format=json > "${BACKUP_DIR}/monitoring/dashboards.json"

log_message "Backups completed successfully" "INFO"

# Step 1: Update Cloud Run service env vars with new quota settings
log_message "Updating service configuration with new quota settings..." "INFO"

# Get current service configuration
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format=json > "${BACKUP_DIR}/service-config.json"

# Update service environment variables
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --update-env-vars="MONTHLY_QUOTA=216000,DAILY_QUOTA=7200,WARNING_THRESHOLD=0.85,EMERGENCY_THRESHOLD=0.97" \
  --quiet

log_message "Cloud Run service environment variables updated successfully" "INFO"

# Step 2: Deploy updated Cloud Scheduler jobs
log_message "Deploying updated Cloud Scheduler jobs..." "INFO"

# Check if scheduler jobs YAML exists
if [ ! -f "./scheduler/jobs.yaml" ]; then
  log_message "Scheduler jobs file not found: ./scheduler/jobs.yaml" "ERROR"
  exit 1
fi

# Convert YAML to JSON for deployment
if command -v yq &> /dev/null; then
  JOBS_JSON=$(yq -o=json eval "./scheduler/jobs.yaml")
else
  log_message "'yq' command not found, using Python to convert YAML" "WARN"
  JOBS_JSON=$(python3 -c "import yaml, json, sys; print(json.dumps(yaml.safe_load(open('./scheduler/jobs.yaml'))))")
fi

# Create temp JSON file
echo "$JOBS_JSON" > "${BACKUP_DIR}/jobs.json"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

# Function to create or update a Cloud Scheduler job
update_scheduler_job() {
  local job_name=$1
  local job_config=$2
  local service_url=$3
  
  # Extract job details
  local cron=$(echo $job_config | jq -r '.cron')
  local description=$(echo $job_config | jq -r '.description')
  local task_type=$(echo $job_config | jq -r '.task_type')
  local marketplace=$(echo $job_config | jq -r '.marketplace // "all"')
  local priority=$(echo $job_config | jq -r '.priority // 5')
  local params=$(echo $job_config | jq -r '.params // {}')
  
  # Create task payload
  local task_payload=$(cat <<EOF
{
  "task_type": "${task_type}",
  "marketplace": "${marketplace}",
  "priority": ${priority},
  "params": ${params}
}
EOF
)
  
  # Check if job exists
  if gcloud scheduler jobs describe "${job_name}" --location=${REGION} &> /dev/null; then
    # Update existing job
    gcloud scheduler jobs update http "${job_name}" \
      --location=${REGION} \
      --schedule="${cron}" \
      --uri="${service_url}/tasks/schedule" \
      --http-method=POST \
      --headers="Content-Type=application/json" \
      --message-body="${task_payload}" \
      --description="${description}" \
      --oidc-service-account="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
      --quiet
      
    log_message "Updated Cloud Scheduler job: ${job_name}" "INFO"
  else
    # Create new job
    gcloud scheduler jobs create http "${job_name}" \
      --location=${REGION} \
      --schedule="${cron}" \
      --uri="${service_url}/tasks/schedule" \
      --http-method=POST \
      --headers="Content-Type=application/json" \
      --message-body="${task_payload}" \
      --description="${description}" \
      --oidc-service-account="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
      --quiet
      
    log_message "Created new Cloud Scheduler job: ${job_name}" "INFO"
  fi
}

# Process each job in jobs.json
for job_name in $(echo "$JOBS_JSON" | jq -r 'keys[]'); do
  job_config=$(echo "$JOBS_JSON" | jq -r ".\"${job_name}\"")
  update_scheduler_job "${job_name}" "$job_config" "$SERVICE_URL" 
done

log_message "Cloud Scheduler jobs updated successfully" "INFO"

# Step 3: Update monitoring alert policies
log_message "Updating monitoring alert policies..." "INFO"

# Check if alert policies YAML exists
if [ ! -f "./monitoring/alert-policies.yaml" ]; then
  log_message "Alert policies file not found: ./monitoring/alert-policies.yaml" "ERROR"
  exit 1
fi

# Convert YAML to JSON for deployment
if command -v yq &> /dev/null; then
  ALERTS_JSON=$(yq -o=json eval "./monitoring/alert-policies.yaml")
else
  ALERTS_JSON=$(python3 -c "import yaml, json, sys; print(json.dumps(yaml.safe_load(open('./monitoring/alert-policies.yaml'))))")
fi

# Create temp JSON file
echo "$ALERTS_JSON" > "${BACKUP_DIR}/alert-policies.json"

# Function to update alert policies
update_alert_policy() {
  local policy_name=$1
  local policy_config=$2
  
  # Extract policy details
  local display_name=$(echo $policy_config | jq -r '.display_name')
  local doc_content=$(echo $policy_config | jq -r '.documentation.content')
  local doc_mime_type=$(echo $policy_config | jq -r '.documentation.mime_type')
  local conditions=$(echo $policy_config | jq -r '.conditions')
  local notification_period=$(echo $policy_config | jq -r '.alert_strategy.notification_rate_limit.period.seconds')
  
  # Create policy JSON
  local policy_json=$(cat <<EOF
{
  "displayName": "${display_name}",
  "documentation": {
    "content": "${doc_content}",
    "mimeType": "${doc_mime_type}"
  },
  "conditions": ${conditions},
  "alertStrategy": {
    "notificationRateLimit": {
      "period": {
        "seconds": ${notification_period}
      }
    }
  },
  "combiner": "OR"
}
EOF
)

  # Check if policy exists by display name
  local existing_policy=$(gcloud monitoring policies list --filter="displayName=${display_name}" --format="value(name)")
  
  if [ -n "$existing_policy" ]; then
    # Update existing policy
    echo "$policy_json" > "${BACKUP_DIR}/policy-${policy_name}.json"
    gcloud monitoring policies update "${existing_policy}" --policy-from-file="${BACKUP_DIR}/policy-${policy_name}.json" --quiet
    log_message "Updated monitoring policy: ${display_name}" "INFO"
  else
    # Create new policy
    echo "$policy_json" > "${BACKUP_DIR}/policy-${policy_name}.json"
    gcloud monitoring policies create --policy-from-file="${BACKUP_DIR}/policy-${policy_name}.json" --quiet
    log_message "Created new monitoring policy: ${display_name}" "INFO"
  fi
}

# Process each alert policy
for policy_name in $(echo "$ALERTS_JSON" | jq -r 'keys[]'); do
  policy_config=$(echo "$ALERTS_JSON" | jq -r ".\"${policy_name}\"")
  update_alert_policy "${policy_name}" "$policy_config"
done

log_message "Monitoring alert policies updated successfully" "INFO"

# Step 4: Deploy monitoring dashboards
log_message "Deploying monitoring dashboards..." "INFO"

# Check if dashboards exist
if [ ! -f "./monitoring/quota_dashboard.json" ]; then
  log_message "Dashboard file not found: ./monitoring/quota_dashboard.json" "WARN"
else
  # Create/update dashboard
  gcloud monitoring dashboards create --dashboard-json="./monitoring/quota_dashboard.json" --quiet
  log_message "Quota monitoring dashboard deployed successfully" "INFO"
fi

# Step 5: Update application configuration
log_message "Updating application configuration..." "INFO"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

# Call the application's update endpoint with new settings
if [ -f "./scripts/update_quota_settings.sh" ]; then
  chmod +x ./scripts/update_quota_settings.sh
  ./scripts/update_quota_settings.sh --url "${SERVICE_URL}" --config "${CONFIG_PATH}"
  
  if [ $? -eq 0 ]; then
    log_message "Application configuration updated successfully" "INFO"
  else
    log_message "Failed to update application configuration" "ERROR"
  fi
else
  log_message "Update script not found: ./scripts/update_quota_settings.sh" "ERROR"
fi

# Step 6: Setup validation monitoring
log_message "Setting up validation monitoring..." "INFO"

# Create validation Cloud Scheduler job
gcloud scheduler jobs create http "quota-upgrade-validation" \
  --location=${REGION} \
  --schedule="0 */4 * * *" \
  --uri="${SERVICE_URL}/admin/validate-quota" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"validate_daily":true, "validate_allocation":true, "notify_email":"'${SUPPORT_EMAIL}'"}' \
  --description="Validates quota settings and usage" \
  --oidc-service-account="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --quiet

log_message "Validation monitoring set up successfully" "INFO"

# Step 7: Create optimized PubSub topic for quota metrics
log_message "Setting up quota metrics PubSub topic..." "INFO"

# Create PubSub topic if it doesn't exist
if ! gcloud pubsub topics describe "quota-metrics" &> /dev/null; then
  gcloud pubsub topics create "quota-metrics"
  log_message "Created PubSub topic: quota-metrics" "INFO"
else
  log_message "PubSub topic quota-metrics already exists" "INFO"
fi

# Create subscription for quota metrics
if ! gcloud pubsub subscriptions describe "quota-metrics-sub" &> /dev/null; then
  gcloud pubsub subscriptions create "quota-metrics-sub" \
    --topic="quota-metrics" \
    --ack-deadline=60
  log_message "Created PubSub subscription: quota-metrics-sub" "INFO"
else
  log_message "PubSub subscription quota-metrics-sub already exists" "INFO"
fi

# Step 8: Update service account permissions if needed
log_message "Updating service account permissions..." "INFO"

# Grant necessary permissions to the service account
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

log_message "Service account permissions updated successfully" "INFO"

# Step 9: Deploy the updated configuration files
log_message "Deploying updated configuration files..." "INFO"

# Copy updated QUOTA_ALLOCATION_STRATEGY.md to Cloud Storage
gsutil cp ../QUOTA_ALLOCATION_STRATEGY.md gs://${PROJECT_ID}-configs/marketplace-scraper/

log_message "Configuration files deployed successfully" "INFO"

# Step 10: Send deployment notification
log_message "Sending deployment notification..." "INFO"

# Create notification message
NOTIFICATION=$(cat <<EOF
{
  "subject": "SmartProxy Quota Upgrade Deployed - ${DEPLOYMENT_ID}",
  "message": "The SmartProxy quota upgrade has been successfully deployed to the ${DEPLOY_ENV} environment.\n\nNew Monthly Quota: 216,000 requests\nNew Daily Quota: 7,200 requests\n\nValidation monitoring is in place and will run every 4 hours.\n\nDeployment completed at: $(date)",
  "email": "${SUPPORT_EMAIL}"
}
EOF
)

# Send notification to endpoint
curl -X POST "${SERVICE_URL}/admin/notify" \
  -H "Content-Type: application/json" \
  -d "${NOTIFICATION}" \
  --silent > /dev/null

log_message "Deployment notification sent" "INFO"

# Summary
log_message "=================================" "INFO"
log_message "Quota Upgrade Deployment Summary" "INFO"
log_message "=================================" "INFO"
log_message "Deployment ID: ${DEPLOYMENT_ID}" "INFO"
log_message "Environment: ${DEPLOY_ENV}" "INFO"
log_message "Service URL: ${SERVICE_URL}" "INFO"
log_message "Monthly Quota: 216,000 requests" "INFO"
log_message "Daily Quota: 7,200 requests" "INFO"
log_message "Warning Threshold: 85%" "INFO"
log_message "Emergency Threshold: 97%" "INFO"
log_message "Validation Schedule: Every 4 hours" "INFO"
log_message "Backup Location: ${BACKUP_DIR}" "INFO"
log_message "Deployment completed successfully at $(date)" "INFO"

echo ""
echo "Deployment completed successfully! ✅"
echo "See $LOG_FILE for detailed logs."
echo ""
echo "Next steps:"
echo "1. Monitor quota usage daily for the first week"
echo "2. Review validation reports for any anomalies"
echo "3. Check data freshness metrics to confirm improved scraping frequency"
echo "4. Adjust resource allocation if necessary based on metrics"