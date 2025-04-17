#!/bin/bash
# Phase 3: Application Deployment - Container Build and Cloud Run
# This script builds and deploys the Docker container to Cloud Run

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="/home/tarquin_stapa/fluxori/marketplace-scraper"
MEMORY="2Gi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="2"
CONCURRENCY="80"
TIMEOUT="300s"
SMARTPROXY_TOKEN=""

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
    --memory)
      MEMORY="$2"
      shift
      shift
      ;;
    --cpu)
      CPU="$2"
      shift
      shift
      ;;
    --min-instances)
      MIN_INSTANCES="$2"
      shift
      shift
      ;;
    --max-instances)
      MAX_INSTANCES="$2"
      shift
      shift
      ;;
    --smartproxy-token)
      SMARTPROXY_TOKEN="$2"
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
echo -e "${BLUE}Phase 3: Application Deployment${NC}"
echo -e "${BLUE}----------------------------${NC}"
echo ""

# Load configuration file if it exists
CONFIG_FILE="${HOME}/.config/gcloud/${PROJECT_ID}/market-scraper.conf"
if [[ -f "${CONFIG_FILE}" ]]; then
  source "${CONFIG_FILE}"
  echo "Loaded configuration from: ${CONFIG_FILE}"
else
  echo -e "${YELLOW}Configuration file not found. Using default values.${NC}"
fi

# Check if source directory exists
if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo -e "${RED}Error: Source directory not found: ${SOURCE_DIR}${NC}"
  exit 1
fi

# Create directory for service account keys if needed
mkdir -p "${DEPLOY_DIR}/keys"

# Check if SmartProxy auth token is in Secret Manager
if ! gcloud secrets describe smartproxy-auth-token --project=${PROJECT_ID} &>/dev/null; then
  echo "Creating SmartProxy auth token in Secret Manager..."
  
  # Use the token from the argument or prompt for it
  if [[ -z "${SMARTPROXY_TOKEN}" ]]; then
    read -s -p "Enter SmartProxy auth token: " SMARTPROXY_TOKEN
    echo ""
    
    if [[ -z "${SMARTPROXY_TOKEN}" ]]; then
      echo -e "${RED}Error: SmartProxy auth token is required.${NC}"
      exit 1
    fi
  fi
  
  # Create the secret
  echo -n "${SMARTPROXY_TOKEN}" | gcloud secrets create smartproxy-auth-token \
    --project=${PROJECT_ID} \
    --replication-policy="user-managed" \
    --locations="${REGION}" \
    --data-file=-
  
  echo -e "${GREEN}Created SmartProxy auth token in Secret Manager.${NC}"
else
  echo -e "${GREEN}SmartProxy auth token already exists in Secret Manager.${NC}"
fi

# Get the service account email
SA_EMAIL="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant access to the SmartProxy auth token secret
echo "Granting service account access to the SmartProxy auth token..."
gcloud secrets add-iam-policy-binding smartproxy-auth-token \
  --project=${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# Download service account key for local development (optional)
SA_KEY_FILE="${DEPLOY_DIR}/keys/${SERVICE_NAME}-sa.json"
if [[ ! -f "${SA_KEY_FILE}" ]]; then
  echo "Generating service account key for local development..."
  gcloud iam service-accounts keys create "${SA_KEY_FILE}" \
    --project=${PROJECT_ID} \
    --iam-account="${SA_EMAIL}"
  
  echo -e "${GREEN}Service account key saved to: ${SA_KEY_FILE}${NC}"
  echo -e "${YELLOW}Note: Keep this key secure and do not commit it to version control.${NC}"
else
  echo -e "${GREEN}Using existing service account key: ${SA_KEY_FILE}${NC}"
fi

# Copy the application configuration
CONFIG_JSON="${DEPLOY_DIR}/config/config.json"
if [[ -f "${CONFIG_JSON}" ]]; then
  echo "Copying application configuration..."
  cp "${CONFIG_JSON}" "${SOURCE_DIR}/deployment/config.json"
  echo -e "${GREEN}Configuration copied to: ${SOURCE_DIR}/deployment/config.json${NC}"
else
  echo -e "${RED}Error: Configuration file not found: ${CONFIG_JSON}${NC}"
  exit 1
fi

# Build and push Docker image
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
echo "Building and pushing Docker image: ${IMAGE_NAME}"

# Go to the source directory
cd "${SOURCE_DIR}"

# Build the Docker image
echo "Building Docker image..."
docker build -t "${IMAGE_NAME}" .

# Push the Docker image to Container Registry
echo "Pushing Docker image to Container Registry..."
docker push "${IMAGE_NAME}"

echo -e "${GREEN}Docker image built and pushed successfully.${NC}"

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --project=${PROJECT_ID} \
  --image=${IMAGE_NAME} \
  --platform=managed \
  --region=${REGION} \
  --memory=${MEMORY} \
  --cpu=${CPU} \
  --concurrency=${CONCURRENCY} \
  --max-instances=${MAX_INSTANCES} \
  --min-instances=${MIN_INSTANCES} \
  --timeout=${TIMEOUT} \
  --service-account=${SA_EMAIL} \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},CONFIG_PATH=/app/deployment/config.json" \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --format="value(status.url)")

echo -e "${GREEN}Service deployed at: ${SERVICE_URL}${NC}"

# Save the service URL to the configuration file
echo "SERVICE_URL=${SERVICE_URL}" >> "${CONFIG_FILE}"

# Wait for the service to be ready
echo "Waiting for service to be ready..."
sleep 10

# Test the service
echo "Testing service health..."
curl -s "${SERVICE_URL}/health" || echo -e "${YELLOW}Service health check failed. It may still be starting up.${NC}"

echo ""
echo -e "${BLUE}Application deployment completed successfully.${NC}"
echo -e "${BLUE}Service is now available at: ${SERVICE_URL}${NC}"
echo ""