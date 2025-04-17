#!/bin/bash
# Deployment script using service account authentication
# This script assumes you have a service account key file

set -e  # Exit on error

# Default settings
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_FILE="${DEPLOY_DIR}/keys/service-account.json"
TOKEN_FILE="smartproxy_token.txt"

# Color coding for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display welcome banner
echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}         FLUXORI MARKETPLACE SCRAPER DEPLOYMENT                  ${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE} This script will handle the deployment using a service account  ${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""

# Check if service account key file exists
if [[ ! -f "${KEY_FILE}" ]]; then
  echo -e "${RED}Error: Service account key file not found at ${KEY_FILE}${NC}"
  echo "Please create a service account key file and save it to ${KEY_FILE}"
  exit 1
fi

# Check if SmartProxy token file exists
if [[ ! -f "${TOKEN_FILE}" ]]; then
  echo -e "${RED}Error: SmartProxy token file not found at ${TOKEN_FILE}${NC}"
  echo "Please create a file containing your SmartProxy token"
  exit 1
fi

SMARTPROXY_TOKEN=$(cat "${TOKEN_FILE}")

# Authenticate with service account
echo "Authenticating with service account..."
gcloud auth activate-service-account --key-file="${KEY_FILE}"

# Set the project
echo "Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable APIs
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com firestore.googleapis.com \
  secretmanager.googleapis.com pubsub.googleapis.com monitoring.googleapis.com \
  cloudtrace.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com \
  artifactregistry.googleapis.com

# Create service account for the scraper
echo "Setting up service account for the scraper..."
SA_NAME="${SERVICE_NAME}-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe ${SA_EMAIL} &>/dev/null; then
  gcloud iam service-accounts create ${SA_NAME} \
    --description="Service account for marketplace scraper" \
    --display-name="Marketplace Scraper Service Account"
fi

# Assign roles
ROLES="roles/datastore.user roles/secretmanager.secretAccessor roles/monitoring.metricWriter roles/pubsub.publisher roles/cloudtrace.agent roles/run.invoker"
for role in $ROLES; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --quiet
done

# Store SmartProxy token in Secret Manager
echo "Storing SmartProxy token in Secret Manager..."
if ! gcloud secrets describe smartproxy-auth-token &>/dev/null; then
  echo -n "${SMARTPROXY_TOKEN}" | gcloud secrets create smartproxy-auth-token \
    --replication-policy="user-managed" \
    --locations="${REGION}" \
    --data-file=-
  
  gcloud secrets add-iam-policy-binding smartproxy-auth-token \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
fi

# Create a simple Firestore database
echo "Setting up Firestore database..."
if ! gcloud firestore databases list | grep -q "(default)"; then
  gcloud firestore databases create --location=${REGION} --type=firestore-native
fi

# Create sample data for testing
mkdir -p /tmp/firestore
cat > /tmp/firestore/sample_product.json << EOF
{
  "fields": {
    "marketplace": {"stringValue": "takealot"},
    "productId": {"stringValue": "SAMPLE12345"},
    "title": {"stringValue": "Sample Product"},
    "category": {"stringValue": "electronics"},
    "brand": {"stringValue": "SampleBrand"},
    "price": {"doubleValue": 999.99},
    "updatedAt": {"timestampValue": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
  }
}
EOF

# Upload sample data
echo "Creating sample Firestore data..."
gcloud firestore documents create "projects/${PROJECT_ID}/databases/(default)/documents/products/sample_product" \
  --from-file=/tmp/firestore/sample_product.json

# Create configuration for deployment
mkdir -p "${DEPLOY_DIR}/config"
cat > "${DEPLOY_DIR}/config/config.json" << EOF
{
  "project_id": "${PROJECT_ID}",
  "region": "${REGION}",
  "version": "1.0.0",
  "monthly_quota": 82000,
  "daily_quota": 2700,
  "max_concurrent_tasks": 5,
  "load_shedding_detection": true,
  "persistence_enabled": true,
  "task_topic": "${SERVICE_NAME}-tasks",
  "service_name": "${SERVICE_NAME}",
  "service_account": "${SA_EMAIL}",
  "notification_email": "alerts@fluxori.com",
  "enable_takealot": true,
  "enable_amazon": true,
  "enable_bob_shop": true,
  "enable_makro": true,
  "enable_loot": true,
  "enable_buck_cheap": true,
  "emergency_threshold": 0.95,
  "warning_threshold": 0.80,
  "storage_cache_enabled": true,
  "storage_cache_ttl": 3600
}
EOF

# Create documentation
mkdir -p "${DEPLOY_DIR}/docs"
cat > "${DEPLOY_DIR}/docs/MONITORING_INSTRUCTIONS.md" << EOF
# Marketplace Scraper Monitoring Instructions

Your marketplace scrapers are now deployed and will run autonomously during your absence.

## Key URLs
- Service URL: [Will be provided when deployment completes]
- Monitoring Dashboard: https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}
- Google Cloud Console: https://console.cloud.google.com/home/dashboard?project=${PROJECT_ID}

## Daily Check
To check system status daily:
1. Visit your service URL with /status
2. Visit your service URL with /quota to check API quota usage
3. Visit your service URL with /daily-summary for a complete report

## Alert Response
You'll receive email alerts at alerts@fluxori.com if:
- API quota exceeds 80%
- Error rates are high
- Load shedding is detected
- Service is inactive

## Emergency Recovery
If the service needs to be restarted:
1. Go to https://console.cloud.google.com/run?project=${PROJECT_ID}
2. Select the marketplace-scraper service
3. Click the "RESTART" button at the top of the page

## Contact Information
For support, contact:
- DevOps Team: devops@fluxori.com
- SmartProxy Support: support@smartproxy.com
EOF

# Create Pub/Sub topic for tasks
echo "Setting up Pub/Sub for task distribution..."
if ! gcloud pubsub topics describe ${SERVICE_NAME}-tasks &>/dev/null; then
  gcloud pubsub topics create ${SERVICE_NAME}-tasks
  gcloud pubsub subscriptions create ${SERVICE_NAME}-subscription \
    --topic=${SERVICE_NAME}-tasks \
    --ack-deadline=300
fi

echo -e "${GREEN}Deployment preparation completed successfully.${NC}"
echo ""
echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}DEPLOYMENT INFRASTRUCTURE READY!${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE} The basic infrastructure for your marketplace scrapers has been ${NC}"
echo -e "${BLUE} set up successfully. To complete the deployment, upload your    ${NC}"
echo -e "${BLUE} container image and deploy it to Cloud Run.                     ${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""
echo -e "Service Account: ${GREEN}${SA_EMAIL}${NC}"
echo -e "SmartProxy Token: ${GREEN}Stored in Secret Manager${NC}"
echo -e "Documentation: ${GREEN}${DEPLOY_DIR}/docs/MONITORING_INSTRUCTIONS.md${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Build and push your container image"
echo -e "2. Deploy to Cloud Run"
echo -e "3. Set up Cloud Scheduler jobs"
echo ""
echo -e "${BLUE}==================================================================${NC}"