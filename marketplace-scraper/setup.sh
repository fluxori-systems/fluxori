#!/bin/bash
# Setup script for Marketplace Scraper

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
CONFIG_DIR="./deployment"

# Set up directories
mkdir -p ${CONFIG_DIR}/keys
mkdir -p ${CONFIG_DIR}/terraform
mkdir -p ${CONFIG_DIR}/logs

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
    --config)
      CONFIG_DIR="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID    Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --region REGION         Google Cloud region (default: ${REGION})"
      echo "  --config CONFIG_DIR     Configuration directory (default: ${CONFIG_DIR})"
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
echo "  Marketplace Scraper Setup - South African Marketplace Data Collection"
echo "======================================================================"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Config: ${CONFIG_DIR}"
echo "======================================================================"

# Check requirements
echo "Checking requirements..."

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 is required but not installed."
  exit 1
fi
echo "✓ Python 3 found"

# Check pip
if ! command -v pip3 &> /dev/null; then
  echo "Error: pip3 is required but not installed."
  exit 1
fi
echo "✓ pip3 found"

# Check docker
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is required but not installed."
  exit 1
fi
echo "✓ Docker found"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
  echo "Error: Google Cloud SDK (gcloud) is required but not installed."
  exit 1
fi
echo "✓ gcloud found"

# Check jq
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed."
  exit 1
fi
echo "✓ jq found"

# Check Terraform (optional)
if ! command -v terraform &> /dev/null; then
  echo "⚠ Terraform not found (optional for IaC deployment)"
else
  echo "✓ Terraform found"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Verify GCP configuration
echo "Verifying Google Cloud configuration..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  echo "Setting Google Cloud project to: ${PROJECT_ID}"
  gcloud config set project ${PROJECT_ID}
fi

# Check for GCP project existence
if ! gcloud projects describe ${PROJECT_ID} &>/dev/null; then
  echo "Error: Project ${PROJECT_ID} not found or you don't have access to it."
  echo "Please create the project or check your permissions."
  exit 1
fi
echo "✓ Project ${PROJECT_ID} verified"

# Check region
REGIONS=$(gcloud compute regions list --format="value(name)")
if ! echo "${REGIONS}" | grep -q "^${REGION}$"; then
  echo "Error: Region ${REGION} is not valid or not available."
  echo "Available regions: ${REGIONS}"
  exit 1
fi
echo "✓ Region ${REGION} verified"

# Enable required APIs
echo "Enabling required Google Cloud APIs (this may take a few minutes)..."
APIS="run.googleapis.com cloudscheduler.googleapis.com firestore.googleapis.com secretmanager.googleapis.com pubsub.googleapis.com monitoring.googleapis.com cloudtrace.googleapis.com cloudbuild.googleapis.com"
for API in $APIS; do
  echo "Enabling ${API}..."
  gcloud services enable ${API} --quiet
done
echo "✓ APIs enabled"

# Initialize Firestore (if not already initialized)
echo "Checking Firestore database..."
if ! gcloud firestore databases describe --format="value(name)" 2>/dev/null | grep -q ""; then
  echo "Initializing Firestore database in Native mode..."
  gcloud firestore databases create --location=${REGION} --quiet
  echo "✓ Firestore database created"
else
  echo "✓ Firestore database already exists"
fi

# Check for SmartProxy auth token
echo "Checking SmartProxy authentication..."
if ! gcloud secrets describe smartproxy-auth-token &>/dev/null; then
  echo "SmartProxy auth token not found in Secret Manager."
  read -p "Enter your SmartProxy auth token: " SMARTPROXY_TOKEN
  echo "Creating Secret Manager secret for SmartProxy auth token..."
  echo -n "${SMARTPROXY_TOKEN}" | gcloud secrets create smartproxy-auth-token \
    --replication-policy="user-managed" \
    --locations="${REGION}" \
    --data-file=-
  echo "✓ SmartProxy auth token stored in Secret Manager"
else
  echo "✓ SmartProxy auth token found in Secret Manager"
fi

# Set up deployment files permissions
echo "Setting up deployment files..."
chmod +x ${CONFIG_DIR}/deploy.sh

# Create a basic test environment
echo "Creating test environment..."
python3 -c "
import os
import sys
import json

# Create a simplified test configuration
test_config = {
    'project_id': '${PROJECT_ID}',
    'region': '${REGION}',
    'version': '1.0.0-test',
    'monthly_quota': 100,
    'daily_quota': 10,
    'max_concurrent_tasks': 2,
    'load_shedding_detection': True,
    'popular_categories': ['electronics', 'computers'],
    'popular_keywords': ['test', 'sample']
}

# Write test configuration
with open('${CONFIG_DIR}/test-config.json', 'w') as f:
    json.dump(test_config, f, indent=2)

print('Test configuration created at ${CONFIG_DIR}/test-config.json')
"

# Build and tag Docker image
echo "Building Docker image for local testing..."
docker build -t marketplace-scraper:local .

# Run the local test
echo "Running local test..."
docker run --rm marketplace-scraper:local python -m src.main --task=status

echo "======================================================================"
echo "Setup complete! Your environment is ready for deployment."
echo ""
echo "Next steps:"
echo "1. Review and customize the configuration files in ${CONFIG_DIR}"
echo "2. Deploy using: ${CONFIG_DIR}/deploy.sh"
echo "3. For Terraform deployment: cd ${CONFIG_DIR}/terraform && terraform init && terraform apply"
echo ""
echo "For maintenance and operations, see: OPERATING_GUIDE.md"
echo "======================================================================"