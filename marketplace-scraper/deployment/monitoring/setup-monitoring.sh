#!/bin/bash
# Setup script for monitoring and alerts

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
NOTIFICATION_EMAIL="alerts@fluxori.com"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --project)
      PROJECT_ID="$2"
      shift
      shift
      ;;
    --region)
      REGION="$2"
      shift
      shift
      ;;
    --service)
      SERVICE_NAME="$2"
      shift
      shift
      ;;
    --email)
      NOTIFICATION_EMAIL="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID    Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --region REGION         Google Cloud region (default: ${REGION})"
      echo "  --service SERVICE_NAME  Cloud Run service name (default: ${SERVICE_NAME})"
      echo "  --email EMAIL           Notification email (default: ${NOTIFICATION_EMAIL})"
      echo "  --help                  Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Display banner
echo "======================================================================"
echo "  Marketplace Scraper Monitoring Setup"
echo "======================================================================"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo "  Notification Email: ${NOTIFICATION_EMAIL}"
echo "======================================================================"

# Enable required APIs
echo "Enabling required Google Cloud APIs..."
gcloud services enable monitoring.googleapis.com --project=${PROJECT_ID}
gcloud services enable cloudmonitoring.googleapis.com --project=${PROJECT_ID}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "${SERVICE_URL}" ]; then
  echo "Error: Could not retrieve service URL. Make sure the service ${SERVICE_NAME} exists in region ${REGION}."
  exit 1
fi

echo "Service URL: ${SERVICE_URL}"

# Create notification channel for email alerts
echo "Creating email notification channel..."
CHANNEL_NAME="marketplace-scraper-alerts"

# Check if channel already exists
EXISTING_CHANNEL=$(gcloud alpha monitoring channels list --project=${PROJECT_ID} --filter="displayName=${CHANNEL_NAME}" --format="value(name)" 2>/dev/null || echo "")

if [ -z "${EXISTING_CHANNEL}" ]; then
  # Create new channel
  echo "Creating new notification channel..."
  CHANNEL_ID=$(gcloud alpha monitoring channels create \
    --description="Email notifications for Marketplace Scraper alerts" \
    --display-name="${CHANNEL_NAME}" \
    --type=email \
    --channel-labels=email_address=${NOTIFICATION_EMAIL} \
    --project=${PROJECT_ID} \
    --format="value(name)")
    
  echo "Created notification channel: ${CHANNEL_ID}"
else
  echo "Using existing notification channel: ${EXISTING_CHANNEL}"
  CHANNEL_ID=${EXISTING_CHANNEL}
fi

# Create dashboard
echo "Creating monitoring dashboard..."
DASHBOARD_FILE="$(dirname "$0")/dashboard.json"

if [ ! -f "${DASHBOARD_FILE}" ]; then
  echo "Error: Dashboard file not found at ${DASHBOARD_FILE}"
  exit 1
fi

# Update project ID in dashboard file
sed -i "s/YOUR_PROJECT_ID/${PROJECT_ID}/g" "${DASHBOARD_FILE}"

# Check if dashboard already exists
DASHBOARD_NAME="projects/${PROJECT_ID}/dashboards/marketplace-scraper-dashboard"
EXISTING_DASHBOARD=$(gcloud monitoring dashboards list --project=${PROJECT_ID} --filter="name:${DASHBOARD_NAME}" --format="value(name)" 2>/dev/null || echo "")

if [ -z "${EXISTING_DASHBOARD}" ]; then
  # Create new dashboard
  echo "Creating new dashboard..."
  gcloud monitoring dashboards create --project=${PROJECT_ID} --dashboard-json="${DASHBOARD_FILE}"
  echo "Created dashboard"
else
  # Update existing dashboard
  echo "Updating existing dashboard..."
  gcloud monitoring dashboards update ${DASHBOARD_NAME} --project=${PROJECT_ID} --dashboard-json="${DASHBOARD_FILE}"
  echo "Updated dashboard"
fi

# Create alert policies
echo "Creating alert policies..."
ALERT_POLICIES_FILE="$(dirname "$0")/alert-policies.yaml"

if [ ! -f "${ALERT_POLICIES_FILE}" ]; then
  echo "Error: Alert policies file not found at ${ALERT_POLICIES_FILE}"
  exit 1
fi

# Create each alert policy
for POLICY_NAME in quota_alert error_rate_alert loadshedding_alert inactivity_alert response_time_alert data_quality_alert; do
  echo "Creating/updating alert policy: ${POLICY_NAME}..."
  
  # Extract policy JSON
  POLICY_JSON=$(python3 -c "
import yaml
import json
import sys

with open('${ALERT_POLICIES_FILE}', 'r') as f:
    policies = yaml.safe_load(f)
    
if '${POLICY_NAME}' in policies:
    policy = policies['${POLICY_NAME}']
    # Add notification channel
    if 'notificationChannels' not in policy:
        policy['notificationChannels'] = []
    policy['notificationChannels'].append('${CHANNEL_ID}')
    print(json.dumps(policy))
else:
    print('Policy not found: ${POLICY_NAME}')
    sys.exit(1)
")

  if [ $? -ne 0 ]; then
    echo "Error: Could not extract policy JSON for ${POLICY_NAME}"
    continue
  fi
  
  # Create temporary policy file
  TEMP_POLICY_FILE=$(mktemp)
  echo "${POLICY_JSON}" > "${TEMP_POLICY_FILE}"
  
  # Check if policy already exists
  EXISTING_POLICY=$(gcloud alpha monitoring policies list --project=${PROJECT_ID} --filter="displayName='${POLICY_NAME}'" --format="value(name)" 2>/dev/null || echo "")
  
  if [ -z "${EXISTING_POLICY}" ]; then
    # Create new policy
    gcloud alpha monitoring policies create --project=${PROJECT_ID} --policy-from-file="${TEMP_POLICY_FILE}"
    echo "Created alert policy: ${POLICY_NAME}"
  else
    # Update existing policy
    gcloud alpha monitoring policies update ${EXISTING_POLICY} --project=${PROJECT_ID} --policy-from-file="${TEMP_POLICY_FILE}"
    echo "Updated alert policy: ${POLICY_NAME}"
  fi
  
  # Clean up temporary file
  rm "${TEMP_POLICY_FILE}"
done

# Set up initial metrics
echo "Setting up initial metrics..."
TOKEN=$(gcloud auth print-identity-token)

# Initialize system health metric
curl -X POST "${SERVICE_URL}/tasks/execute" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "initialize_metrics",
    "params": {},
    "priority": "HIGH"
  }'

echo "======================================================================"
echo "Monitoring setup complete!"
echo ""
echo "Dashboard URL: https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}"
echo "Alerts URL: https://console.cloud.google.com/monitoring/alerting?project=${PROJECT_ID}"
echo ""
echo "Daily email summaries will be sent to: ${NOTIFICATION_EMAIL}"
echo "======================================================================"