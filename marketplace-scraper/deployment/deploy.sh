#!/bin/bash
# Deployment script for Marketplace Scraper to Google Cloud Run

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
CONFIG_PATH="./deployment/config.json"
MEMORY="2Gi"
CPU="1"
CONCURRENCY="80"
MAX_INSTANCES="10"
MIN_INSTANCES="1"
TIMEOUT="300s"

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
    --config)
      CONFIG_PATH="$2"
      shift
      shift
      ;;
    --setup-monitoring)
      SETUP_MONITORING="true"
      shift
      ;;
    --setup-scheduler)
      SETUP_SCHEDULER="true"
      shift
      ;;
    --force)
      FORCE="true"
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID    Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --region REGION         Google Cloud region (default: ${REGION})"
      echo "  --service SERVICE_NAME  Cloud Run service name (default: ${SERVICE_NAME})"
      echo "  --memory MEMORY         Memory allocation (default: ${MEMORY})"
      echo "  --cpu CPU               CPU allocation (default: ${CPU})"
      echo "  --config CONFIG_PATH    Path to configuration file (default: ${CONFIG_PATH})"
      echo "  --setup-monitoring      Set up monitoring dashboard and alerts"
      echo "  --setup-scheduler       Set up Cloud Scheduler jobs"
      echo "  --force                 Skip confirmation prompt"
      echo "  --help                  Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if config file exists
if [ ! -f "${CONFIG_PATH}" ]; then
  echo "Error: Configuration file not found at ${CONFIG_PATH}"
  exit 1
fi

# Confirmation prompt
if [ -z "${FORCE}" ]; then
  echo "Deploying Marketplace Scraper with the following configuration:"
  echo "  Project ID: ${PROJECT_ID}"
  echo "  Region: ${REGION}"
  echo "  Service Name: ${SERVICE_NAME}"
  echo "  Memory: ${MEMORY}"
  echo "  CPU: ${CPU}"
  echo "  Config Path: ${CONFIG_PATH}"
  echo "  Setup Monitoring: ${SETUP_MONITORING:-false}"
  echo "  Setup Scheduler: ${SETUP_SCHEDULER:-false}"
  echo ""
  read -p "Continue with deployment? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
  fi
fi

# Ensure project is set
gcloud config set project ${PROJECT_ID}

# Create directory for service account keys if needed
mkdir -p ./deployment/keys

# Check if SmartProxy auth token is in Secret Manager
if ! gcloud secrets describe smartproxy-auth-token &>/dev/null; then
  echo "Creating SmartProxy auth token in Secret Manager..."
  
  # Use the token from the config file or ask for it
  TOKEN=$(jq -r '.smartproxy_auth_token // empty' "${CONFIG_PATH}")
  if [ -z "${TOKEN}" ]; then
    read -p "Enter SmartProxy auth token: " TOKEN
  fi
  
  # Create the secret
  echo -n "${TOKEN}" | gcloud secrets create smartproxy-auth-token \
    --replication-policy="user-managed" \
    --locations="${REGION}" \
    --data-file=-
fi

# Create service account if it doesn't exist
SA_NAME="${SERVICE_NAME}-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe ${SA_EMAIL} &>/dev/null; then
  echo "Creating service account ${SA_EMAIL}..."
  gcloud iam service-accounts create ${SA_NAME} \
    --description="Service account for ${SERVICE_NAME}" \
    --display-name="${SERVICE_NAME} Service Account"
fi

# Grant necessary permissions
echo "Granting permissions to service account..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/monitoring.metricWriter"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/pubsub.publisher"

# Grant access to the SmartProxy auth token secret
gcloud secrets add-iam-policy-binding smartproxy-auth-token \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# Download service account key
if [ ! -f "./deployment/keys/${SA_NAME}.json" ]; then
  echo "Generating service account key..."
  gcloud iam service-accounts keys create \
    "./deployment/keys/${SA_NAME}.json" \
    --iam-account=${SA_EMAIL}
fi

# Build and push Docker image
echo "Building and pushing Docker image..."
docker build -t ${IMAGE_NAME} .
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
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
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo "Service deployed at: ${SERVICE_URL}"

# Setup monitoring if requested
if [ "${SETUP_MONITORING}" = "true" ]; then
  echo "Setting up monitoring..."
  # Generate a token for auth (in a real scenario, you would use a better auth mechanism)
  TEMP_TOKEN=$(openssl rand -base64 32)
  curl -X POST "${SERVICE_URL}/setup/monitoring" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TEMP_TOKEN}" \
    -d "{}"
fi

# Setup scheduler if requested
if [ "${SETUP_SCHEDULER}" = "true" ]; then
  echo "Setting up scheduler jobs..."
  # Generate a token for auth (in a real scenario, you would use a better auth mechanism)
  TEMP_TOKEN=$(openssl rand -base64 32)
  curl -X POST "${SERVICE_URL}/setup/scheduler" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TEMP_TOKEN}" \
    -d "{}"
fi

echo "Deployment completed successfully!"
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "To access the service:"
echo "  Status: ${SERVICE_URL}/status"
echo "  Quota: ${SERVICE_URL}/quota"
echo "  Health: ${SERVICE_URL}/health"
echo "  Daily summary: ${SERVICE_URL}/daily-summary"
echo ""
echo "To execute a task:"
echo "  curl -X POST \"${SERVICE_URL}/tasks/execute\" -H \"Content-Type: application/json\" -d '{\"task_type\":\"extract_daily_deals\",\"marketplace\":\"takealot\"}'"
echo ""
echo "To schedule tasks:"
echo "  curl -X POST \"${SERVICE_URL}/tasks/schedule\" -H \"Content-Type: application/json\" -d '{\"duration\":10}'"