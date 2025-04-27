#!/bin/bash
# Setup script for Firestore database

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-web-app"
REGION="africa-south1"
INDEXES_FILE="$(dirname "$0")/indexes.json"

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
    --indexes)
      INDEXES_FILE="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID    Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --region REGION         Google Cloud region (default: ${REGION})"
      echo "  --indexes INDEXES_FILE  Path to indexes.json file (default: ${INDEXES_FILE})"
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
echo "  Marketplace Scraper Firestore Setup"
echo "======================================================================"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Indexes: ${INDEXES_FILE}"
echo "======================================================================"

# Enable Firestore API
echo "Enabling Firestore API..."
gcloud services enable firestore.googleapis.com --project=${PROJECT_ID}

# Check if Firestore database exists
echo "Checking Firestore database..."
DB_MODE=$(gcloud firestore databases describe --project=${PROJECT_ID} --format="value(type)" 2>/dev/null || echo "")

if [ -z "${DB_MODE}" ]; then
  echo "Creating Firestore database in Native mode..."
  gcloud firestore databases create --project=${PROJECT_ID} --location=${REGION} --type=firestore-native
  echo "Created Firestore database"
else
  echo "Firestore database already exists in ${DB_MODE} mode"
fi

# Create Firestore indexes
echo "Creating Firestore indexes..."

if [ ! -f "${INDEXES_FILE}" ]; then
  echo "Error: Indexes file not found at ${INDEXES_FILE}"
  exit 1
fi

# Create temporary directory for index operations
TEMP_DIR=$(mktemp -d)

# Create collection structure
echo "Creating collection structure..."

# Function to create collection with sample document
create_collection() {
  local collection=$1
  local doc_id=$2
  local data=$3
  
  echo "  Creating collection: ${collection}"
  
  # Create temporary file with document data
  echo "${data}" > "${TEMP_DIR}/${collection}_${doc_id}.json"
  
  # Create document in collection
  gcloud firestore documents create "projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${doc_id}" \
    --from-file="${TEMP_DIR}/${collection}_${doc_id}.json" \
    --project=${PROJECT_ID} \
    --quiet || true  # Continue even if document exists
}

# Create essential collections with sample documents
create_collection "products" "sample_product" '{
  "fields": {
    "marketplace": {"stringValue": "takealot"},
    "productId": {"stringValue": "SAMPLE12345"},
    "title": {"stringValue": "Sample Product"},
    "category": {"stringValue": "electronics"},
    "brand": {"stringValue": "SampleBrand"},
    "url": {"stringValue": "https://www.takealot.com/sample-product"},
    "price": {"doubleValue": 999.99},
    "updatedAt": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }
}'

create_collection "categories" "sample_category" '{
  "fields": {
    "marketplace": {"stringValue": "takealot"},
    "categoryId": {"stringValue": "SAMPLE_CAT"},
    "name": {"stringValue": "Sample Category"},
    "parent": {"stringValue": ""},
    "url": {"stringValue": "https://www.takealot.com/sample-category"},
    "updatedAt": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }
}'

create_collection "search_results" "sample_search" '{
  "fields": {
    "marketplace": {"stringValue": "takealot"},
    "keyword": {"stringValue": "sample search"},
    "results": {"arrayValue": {"values": []}},
    "timestamp": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }
}'

create_collection "daily_deals" "sample_deal" '{
  "fields": {
    "marketplace": {"stringValue": "takealot"},
    "date": {"stringValue": "'$(date +"%Y-%m-%d")'"},
    "deals": {"arrayValue": {"values": []}},
    "updatedAt": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }
}'

create_collection "task_history" "sample_task" '{
  "fields": {
    "task_type": {"stringValue": "sample_task"},
    "marketplace": {"stringValue": "takealot"},
    "status": {"stringValue": "completed"},
    "completed_at": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }
}'

create_collection "quota_usage" "today" '{
  "fields": {
    "date": {"stringValue": "'$(date +"%Y-%m-%d")'"},
    "daily_usage": {"integerValue": "0"},
    "monthly_usage": {"integerValue": "0"},
    "priority": {"mapValue": {"fields": {
      "CRITICAL": {"integerValue": "0"},
      "HIGH": {"integerValue": "0"},
      "MEDIUM": {"integerValue": "0"},
      "LOW": {"integerValue": "0"},
      "BACKGROUND": {"integerValue": "0"}
    }}},
    "updated_at": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }
}'

create_collection "load_shedding_events" "sample_event" '{
  "fields": {
    "start_time": {"timestampValue": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"},
    "end_time": {"timestampValue": "'$(date -d "+2 hours" -u +"%Y-%m-%dT%H:%M:%SZ")'"},
    "detected_by": {"stringValue": "system_initialization"}
  }
}'

# Deploy Firestore indexes
echo "Deploying Firestore indexes..."
gcloud firestore indexes composite create ${INDEXES_FILE} --project=${PROJECT_ID}

# Clean up
rm -rf "${TEMP_DIR}"

echo "======================================================================"
echo "Firestore setup complete!"
echo ""
echo "Database URL: https://console.cloud.google.com/firestore/data?project=${PROJECT_ID}"
echo "Indexes URL: https://console.cloud.google.com/firestore/indexes?project=${PROJECT_ID}"
echo "======================================================================"
