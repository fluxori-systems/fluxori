#!/bin/bash
# Phase 1: Foundation Infrastructure - Project and IAM Setup
# This script sets up the project, enables required APIs, and creates service accounts

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
NOTIFICATION_EMAIL="alerts@fluxori.com"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    --notification-email)
      NOTIFICATION_EMAIL="$2"
      shift
      shift
      ;;
    *)
      # Skip unknown options
      shift
      ;;
  esac
done

# Display phase header
echo -e "${BLUE}Phase 1: Foundation Infrastructure${NC}"
echo -e "${BLUE}----------------------------------${NC}"
echo ""

# Check if project exists
echo "Checking if project exists..."
if ! gcloud projects describe ${PROJECT_ID} &>/dev/null; then
  echo -e "${YELLOW}Project ${PROJECT_ID} does not exist. Creating...${NC}"
  gcloud projects create ${PROJECT_ID} --name="Fluxori Marketplace Data"
else
  echo -e "${GREEN}Project ${PROJECT_ID} already exists.${NC}"
fi

# Set the billing account if needed (interactive step)
echo "Checking billing account..."
if ! gcloud billing projects describe ${PROJECT_ID} &>/dev/null; then
  echo -e "${YELLOW}No billing account linked to this project.${NC}"
  echo "Please select a billing account for this project manually:"
  gcloud billing accounts list
  
  read -p "Enter the billing account ID from the list above: " BILLING_ACCOUNT_ID
  gcloud billing projects link ${PROJECT_ID} --billing-account=${BILLING_ACCOUNT_ID}
else
  echo -e "${GREEN}Billing already configured for project.${NC}"
fi

# Enable required APIs
echo "Enabling required Google Cloud APIs..."
APIS_TO_ENABLE=(
  "run.googleapis.com"             # Cloud Run
  "cloudscheduler.googleapis.com"  # Cloud Scheduler
  "firestore.googleapis.com"       # Firestore
  "secretmanager.googleapis.com"   # Secret Manager
  "pubsub.googleapis.com"          # Pub/Sub
  "monitoring.googleapis.com"      # Cloud Monitoring
  "cloudtrace.googleapis.com"      # Cloud Trace
  "cloudbuild.googleapis.com"      # Cloud Build
  "containerregistry.googleapis.com" # Container Registry
  "artifactregistry.googleapis.com"  # Artifact Registry
  "iam.googleapis.com"             # IAM
)

for api in "${APIS_TO_ENABLE[@]}"; do
  echo "  Enabling ${api}..."
  gcloud services enable ${api} --project=${PROJECT_ID}
done

echo -e "${GREEN}All required APIs enabled successfully.${NC}"

# Create service account for the scraper
SA_NAME="${SERVICE_NAME}-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Setting up service account..."
if ! gcloud iam service-accounts describe ${SA_EMAIL} --project=${PROJECT_ID} &>/dev/null; then
  echo "  Creating service account ${SA_EMAIL}..."
  gcloud iam service-accounts create ${SA_NAME} \
    --description="Service account for ${SERVICE_NAME}" \
    --display-name="${SERVICE_NAME} Service Account" \
    --project=${PROJECT_ID}
else
  echo -e "${GREEN}  Service account ${SA_EMAIL} already exists.${NC}"
fi

# Grant necessary roles to the service account
echo "Granting IAM roles to service account..."
ROLES_TO_GRANT=(
  "roles/datastore.user"              # Firestore access
  "roles/secretmanager.secretAccessor" # Secret access
  "roles/monitoring.metricWriter"      # Write metrics
  "roles/pubsub.publisher"             # Publish to Pub/Sub
  "roles/cloudtrace.agent"             # Write trace data
  "roles/run.invoker"                  # Invoke Cloud Run
)

for role in "${ROLES_TO_GRANT[@]}"; do
  echo "  Granting ${role}..."
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}"
done

echo -e "${GREEN}Service account roles assigned successfully.${NC}"

# Create Pub/Sub topic for task distribution
TOPIC_NAME="${SERVICE_NAME}-tasks"

echo "Creating Pub/Sub topic..."
if ! gcloud pubsub topics describe ${TOPIC_NAME} --project=${PROJECT_ID} &>/dev/null; then
  gcloud pubsub topics create ${TOPIC_NAME} --project=${PROJECT_ID}
  echo -e "${GREEN}  Created Pub/Sub topic: ${TOPIC_NAME}${NC}"
else
  echo -e "${GREEN}  Pub/Sub topic ${TOPIC_NAME} already exists.${NC}"
fi

# Create subscription for the topic
SUBSCRIPTION_NAME="${SERVICE_NAME}-subscription"

echo "Creating Pub/Sub subscription..."
if ! gcloud pubsub subscriptions describe ${SUBSCRIPTION_NAME} --project=${PROJECT_ID} &>/dev/null; then
  gcloud pubsub subscriptions create ${SUBSCRIPTION_NAME} \
    --topic=${TOPIC_NAME} \
    --ack-deadline=300 \
    --project=${PROJECT_ID}
  echo -e "${GREEN}  Created Pub/Sub subscription: ${SUBSCRIPTION_NAME}${NC}"
else
  echo -e "${GREEN}  Pub/Sub subscription ${SUBSCRIPTION_NAME} already exists.${NC}"
fi

# Create deployment configuration directory if it doesn't exist
mkdir -p "${HOME}/.config/gcloud/${PROJECT_ID}"

# Save configuration details
CONFIG_FILE="${HOME}/.config/gcloud/${PROJECT_ID}/market-scraper.conf"
echo "# Marketplace Scraper Configuration" > "${CONFIG_FILE}"
echo "PROJECT_ID=${PROJECT_ID}" >> "${CONFIG_FILE}"
echo "REGION=${REGION}" >> "${CONFIG_FILE}"
echo "SERVICE_NAME=${SERVICE_NAME}" >> "${CONFIG_FILE}"
echo "SERVICE_ACCOUNT=${SA_EMAIL}" >> "${CONFIG_FILE}"
echo "TOPIC_NAME=${TOPIC_NAME}" >> "${CONFIG_FILE}"
echo "SUBSCRIPTION_NAME=${SUBSCRIPTION_NAME}" >> "${CONFIG_FILE}"
echo "NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL}" >> "${CONFIG_FILE}"
echo "SETUP_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "${CONFIG_FILE}"

echo -e "${GREEN}Configuration saved to: ${CONFIG_FILE}${NC}"
echo ""
echo -e "${BLUE}Foundation infrastructure setup completed successfully.${NC}"
echo -e "${BLUE}Project is ready for the next deployment phase.${NC}"
echo ""