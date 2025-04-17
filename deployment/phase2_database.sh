#!/bin/bash
# Phase 2: Database Setup - Firestore Configuration
# This script sets up Firestore database, collections, and indexes

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIRESTORE_DIR="${DEPLOY_DIR}/firestore"

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
    *)
      # Skip unknown options
      shift
      ;;
  esac
done

# Display phase header
echo -e "${BLUE}Phase 2: Database Setup${NC}"
echo -e "${BLUE}---------------------${NC}"
echo ""

# Load configuration file if it exists
CONFIG_FILE="${HOME}/.config/gcloud/${PROJECT_ID}/market-scraper.conf"
if [[ -f "${CONFIG_FILE}" ]]; then
  source "${CONFIG_FILE}"
  echo "Loaded configuration from: ${CONFIG_FILE}"
else
  echo -e "${YELLOW}Configuration file not found. Using default values.${NC}"
fi

# Make sure the Firestore indexes directory exists
mkdir -p "${FIRESTORE_DIR}"

# Create Firestore indexes file if it doesn't exist
INDEXES_FILE="${FIRESTORE_DIR}/indexes.json"
if [[ ! -f "${INDEXES_FILE}" ]]; then
  echo "Creating Firestore indexes file..."
  cat > "${INDEXES_FILE}" << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "price",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "categories",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "parent",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "search_results",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "keyword",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "daily_deals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "task_history",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "task_type",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completed_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "task_history",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "marketplace",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completed_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "quota_usage",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "priority",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "load_shedding_events",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "start_time",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "end_time",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
  echo -e "${GREEN}Created Firestore indexes file: ${INDEXES_FILE}${NC}"
else
  echo -e "${GREEN}Using existing Firestore indexes file: ${INDEXES_FILE}${NC}"
fi

# Create Firestore setup script
SETUP_SCRIPT="${FIRESTORE_DIR}/setup-firestore.sh"
if [[ ! -f "${SETUP_SCRIPT}" ]]; then
  echo "Creating Firestore setup script..."
  cat > "${SETUP_SCRIPT}" << 'EOF'
#!/bin/bash
# Setup script for Firestore database

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
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
EOF
  chmod +x "${SETUP_SCRIPT}"
  echo -e "${GREEN}Created Firestore setup script: ${SETUP_SCRIPT}${NC}"
else
  echo -e "${GREEN}Using existing Firestore setup script: ${SETUP_SCRIPT}${NC}"
  chmod +x "${SETUP_SCRIPT}"
fi

# Execute the Firestore setup script
echo "Executing Firestore setup script..."
"${SETUP_SCRIPT}" --project="${PROJECT_ID}" --region="${REGION}" --indexes="${INDEXES_FILE}"

# Create config for the scraper application
mkdir -p "${DEPLOY_DIR}/config"
CONFIG_JSON="${DEPLOY_DIR}/config/config.json"

echo "Creating scraper configuration file..."
cat > "${CONFIG_JSON}" << EOF
{
  "project_id": "${PROJECT_ID}",
  "region": "${REGION}",
  "version": "1.0.0",
  "monthly_quota": 82000,
  "daily_quota": 2700,
  "max_concurrent_tasks": 5,
  "load_shedding_detection": true,
  "persistence_enabled": true,
  "task_topic": "${TOPIC_NAME:-"marketplace-scraper-tasks"}",
  "service_name": "${SERVICE_NAME}",
  "service_account": "${SA_EMAIL:-"${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"}",
  "notification_email": "${NOTIFICATION_EMAIL:-"alerts@fluxori.com"}",
  "enable_takealot": true,
  "enable_amazon": true,
  "enable_bob_shop": true,
  "enable_makro": true,
  "enable_loot": true,
  "enable_buck_cheap": true,
  "emergency_threshold": 0.95,
  "warning_threshold": 0.80,
  "storage_cache_enabled": true,
  "storage_cache_ttl": 3600,
  "popular_categories": [
    "electronics", 
    "computers", 
    "home-kitchen",
    "phones",
    "beauty",
    "appliances",
    "tv-video"
  ],
  "popular_keywords": [
    "iphone", 
    "samsung", 
    "laptop", 
    "headphones", 
    "smart tv",
    "playstation",
    "xbox",
    "nintendo",
    "air fryer",
    "vacuum cleaner"
  ],
  "schedule_jobs": [
    {
      "name": "daily-product-refresh",
      "cron": "0 */4 * * *",
      "marketplace": "takealot",
      "task_type": "refresh_products",
      "max_count": 500,
      "priority": "HIGH"
    },
    {
      "name": "daily-deals",
      "cron": "0 9,13,17 * * *",
      "marketplace": "takealot",
      "task_type": "extract_daily_deals",
      "priority": "HIGH"
    },
    {
      "name": "category-discovery",
      "cron": "0 1 * * *",
      "marketplace": "takealot",
      "task_type": "discover_products",
      "categories": ["electronics", "computers", "phones", "home-kitchen", "beauty", "appliances", "tv-video"],
      "max_per_category": 100,
      "priority": "MEDIUM"
    },
    {
      "name": "search-monitoring",
      "cron": "0 10,15 * * 1-5",
      "marketplace": "takealot",
      "task_type": "search",
      "keywords": ["iphone", "samsung", "laptop", "headphones", "smart tv"],
      "max_per_keyword": 50,
      "priority": "MEDIUM"
    },
    {
      "name": "amazon-refresh",
      "cron": "0 */6 * * *",
      "marketplace": "amazon",
      "task_type": "refresh_products",
      "max_count": 300,
      "priority": "HIGH"
    },
    {
      "name": "makro-refresh",
      "cron": "0 */8 * * *",
      "marketplace": "makro",
      "task_type": "refresh_products",
      "max_count": 200,
      "priority": "MEDIUM"
    },
    {
      "name": "loot-refresh",
      "cron": "0 */12 * * *",
      "marketplace": "loot",
      "task_type": "refresh_products",
      "max_count": 150,
      "priority": "MEDIUM"
    },
    {
      "name": "bob-shop-refresh",
      "cron": "0 */12 * * *",
      "marketplace": "bob_shop",
      "task_type": "refresh_products",
      "max_count": 100,
      "priority": "MEDIUM"
    },
    {
      "name": "buck-cheap-history",
      "cron": "0 2 * * *",
      "marketplace": "buck_cheap",
      "task_type": "extract_history",
      "max_count": 100,
      "priority": "LOW"
    },
    {
      "name": "suggestion-analysis",
      "cron": "0 2 * * 3",
      "marketplace": "takealot",
      "task_type": "extract_suggestions",
      "prefixes": ["i", "s", "a", "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "o", "p", "q", "r", "t", "u", "v", "w", "x", "y", "z"],
      "priority": "LOW"
    },
    {
      "name": "load-shedding-adaptation",
      "cron": "*/30 * * * *",
      "marketplace": "takealot",
      "task_type": "check_load_shedding",
      "priority": "CRITICAL"
    }
  ],
  "quota_distribution": {
    "daily_deals": 0.15,
    "product_details": 0.40,
    "category_browsing": 0.20,
    "search_monitoring": 0.20,
    "suggestions": 0.05
  },
  "marketplace_distribution": {
    "takealot": 0.40,
    "amazon": 0.25,
    "makro": 0.15,
    "loot": 0.10,
    "bob_shop": 0.05,
    "buck_cheap": 0.05
  },
  "retry_policies": {
    "default": {
      "max_retries": 3,
      "initial_delay": 5,
      "max_delay": 60,
      "multiplier": 2.0
    },
    "critical": {
      "max_retries": 5,
      "initial_delay": 10,
      "max_delay": 300,
      "multiplier": 2.0
    }
  },
  "circuit_breaker_enabled": true,
  "circuit_breaker_reset_duration": 10800
}
EOF

echo -e "${GREEN}Created scraper configuration file: ${CONFIG_JSON}${NC}"
echo ""
echo -e "${BLUE}Database setup completed successfully.${NC}"
echo -e "${BLUE}Firestore database is ready for use.${NC}"
echo ""