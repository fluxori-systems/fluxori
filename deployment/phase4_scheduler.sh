#!/bin/bash
# Phase 4: Scheduler Setup - Cloud Scheduler Jobs
# This script sets up Cloud Scheduler jobs for recurring tasks

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEDULER_DIR="${DEPLOY_DIR}/scheduler"

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
echo -e "${BLUE}Phase 4: Scheduler Setup${NC}"
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

# Make sure we have a service URL
if [[ -z "${SERVICE_URL}" ]]; then
  # Try to get it from gcloud
  SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --format="value(status.url)" 2>/dev/null || echo "")
  
  if [[ -z "${SERVICE_URL}" ]]; then
    echo -e "${RED}Error: Service URL not found. Make sure the service is deployed.${NC}"
    exit 1
  fi
  
  echo "Retrieved service URL: ${SERVICE_URL}"
fi

# Make sure the scheduler directory exists
mkdir -p "${SCHEDULER_DIR}"

# Create scheduler jobs definition file
JOBS_FILE="${SCHEDULER_DIR}/jobs.yaml"
if [[ ! -f "${JOBS_FILE}" ]]; then
  echo "Creating scheduler jobs definition file..."
  cat > "${JOBS_FILE}" << EOF
# Cloud Scheduler jobs for Marketplace Scraper
# These jobs are automatically created by the deployment script

jobs:
  - name: "${SERVICE_NAME}-daily-product-refresh-takealot"
    description: "Refresh product data from Takealot every 4 hours"
    schedule: "0 */4 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"refresh_products","marketplace":"takealot","params":{"max_count":500},"priority":"HIGH"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-daily-deals-takealot"
    description: "Extract daily deals from Takealot three times per day"
    schedule: "0 9,13,17 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"extract_daily_deals","marketplace":"takealot","params":{},"priority":"HIGH"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-category-discovery-takealot"
    description: "Discover products from Takealot categories once per day"
    schedule: "0 1 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"discover_products","marketplace":"takealot","params":{"categories":["electronics","computers","phones","home-kitchen","beauty","appliances","tv-video"],"max_per_category":100},"priority":"MEDIUM"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-search-monitoring-takealot"
    description: "Monitor search results for popular keywords on Takealot twice per day on weekdays"
    schedule: "0 10,15 * * 1-5"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"search","marketplace":"takealot","params":{"keywords":["iphone","samsung","laptop","headphones","smart tv"],"max_per_keyword":50},"priority":"MEDIUM"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-daily-product-refresh-amazon"
    description: "Refresh product data from Amazon SA every 6 hours"
    schedule: "0 */6 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"refresh_products","marketplace":"amazon","params":{"max_count":300},"priority":"HIGH"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-daily-product-refresh-makro"
    description: "Refresh product data from Makro every 8 hours"
    schedule: "0 */8 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"refresh_products","marketplace":"makro","params":{"max_count":200},"priority":"MEDIUM"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-daily-product-refresh-loot"
    description: "Refresh product data from Loot every 12 hours"
    schedule: "0 */12 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"refresh_products","marketplace":"loot","params":{"max_count":150},"priority":"MEDIUM"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-daily-product-refresh-bob-shop"
    description: "Refresh product data from Bob Shop every 12 hours"
    schedule: "0 */12 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"refresh_products","marketplace":"bob_shop","params":{"max_count":100},"priority":"MEDIUM"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-buck-cheap-history"
    description: "Extract historical price data from Buck.cheap once per day"
    schedule: "0 2 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"extract_history","marketplace":"buck_cheap","params":{"max_count":100},"priority":"LOW"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-suggestion-analysis-takealot"
    description: "Extract search suggestions from Takealot once per week"
    schedule: "0 2 * * 3"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"extract_suggestions","marketplace":"takealot","params":{"prefixes":["i","s","a","b","c","d","e","f","g","h","j","k","l","m","n","o","p","q","r","t","u","v","w","x","y","z"]},"priority":"LOW"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-load-shedding-check"
    description: "Check for load shedding every 30 minutes"
    schedule: "*/30 * * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"check_load_shedding","params":{},"priority":"CRITICAL"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-quota-reset"
    description: "Reset daily quota usage at midnight"
    schedule: "0 0 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"reset_daily_quota","params":{},"priority":"CRITICAL"}'
      headers:
        Content-Type: "application/json"

  - name: "${SERVICE_NAME}-daily-summary"
    description: "Generate and send daily summary report"
    schedule: "0 6 * * *"
    time_zone: "Africa/Johannesburg"
    http_target:
      http_method: "POST"
      uri: "${SERVICE_URL}/tasks/execute"
      body: '{"task_type":"generate_daily_summary","params":{"send_email":true},"priority":"HIGH"}'
      headers:
        Content-Type: "application/json"
EOF
  echo -e "${GREEN}Created scheduler jobs definition file: ${JOBS_FILE}${NC}"
else
  echo -e "${GREEN}Using existing scheduler jobs definition file: ${JOBS_FILE}${NC}"
fi

# Create scheduler setup script
SETUP_SCRIPT="${SCHEDULER_DIR}/setup-scheduler.sh"
if [[ ! -f "${SETUP_SCRIPT}" ]]; then
  echo "Creating scheduler setup script..."
  cat > "${SETUP_SCRIPT}" << 'EOF'
#!/bin/bash
# Setup script for Cloud Scheduler jobs

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
SERVICE_URL=""
JOBS_FILE="$(dirname "$0")/jobs.yaml"

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
    --service-url)
      SERVICE_URL="$2"
      shift
      shift
      ;;
    --jobs)
      JOBS_FILE="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID      Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --region REGION           Google Cloud region (default: ${REGION})"
      echo "  --service SERVICE_NAME    Cloud Run service name (default: ${SERVICE_NAME})"
      echo "  --service-url SERVICE_URL Service URL (optional, will be retrieved if not provided)"
      echo "  --jobs JOBS_FILE          Path to jobs.yaml file (default: ${JOBS_FILE})"
      echo "  --help                    Show this help message"
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
echo "  Marketplace Scraper Scheduler Setup"
echo "======================================================================"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo "  Jobs file: ${JOBS_FILE}"
echo "======================================================================"

# Enable Cloud Scheduler API
echo "Enabling Cloud Scheduler API..."
gcloud services enable cloudscheduler.googleapis.com --project=${PROJECT_ID}

# Get service URL if not provided
if [ -z "${SERVICE_URL}" ]; then
  echo "Retrieving service URL..."
  SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --format="value(status.url)")
  
  if [ -z "${SERVICE_URL}" ]; then
    echo "Error: Could not retrieve service URL."
    exit 1
  fi
  
  echo "Service URL: ${SERVICE_URL}"
fi

# Get service account email
SA_EMAIL="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Service account: ${SA_EMAIL}"

# Check if jobs file exists
if [ ! -f "${JOBS_FILE}" ]; then
  echo "Error: Jobs file not found at ${JOBS_FILE}"
  exit 1
fi

# Parse jobs from YAML file
echo "Parsing jobs from ${JOBS_FILE}..."
JOBS=$(cat "${JOBS_FILE}" | grep -A 100 "jobs:" | grep "  - name:" | sed 's/  - name: //g' | sed 's/"//g')

# Get existing jobs
EXISTING_JOBS=$(gcloud scheduler jobs list --project=${PROJECT_ID} --format="value(name)")

# Create or update jobs
for job_name in $JOBS; do
  echo "Processing job: ${job_name}"
  
  # Check if job already exists
  if echo "${EXISTING_JOBS}" | grep -q "${job_name}"; then
    echo "  Job ${job_name} already exists, updating..."
    gcloud scheduler jobs delete ${job_name} --project=${PROJECT_ID} --quiet || true
  else
    echo "  Creating new job: ${job_name}"
  fi
  
  # Extract job details
  description=$(cat "${JOBS_FILE}" | grep -A 20 "name: \"${job_name}\"" | grep "description:" | head -1 | sed 's/    description: //g' | sed 's/"//g')
  schedule=$(cat "${JOBS_FILE}" | grep -A 20 "name: \"${job_name}\"" | grep "schedule:" | head -1 | sed 's/    schedule: //g' | sed 's/"//g')
  time_zone=$(cat "${JOBS_FILE}" | grep -A 20 "name: \"${job_name}\"" | grep "time_zone:" | head -1 | sed 's/    time_zone: //g' | sed 's/"//g')
  http_method=$(cat "${JOBS_FILE}" | grep -A 20 "name: \"${job_name}\"" | grep "http_method:" | head -1 | sed 's/      http_method: //g' | sed 's/"//g')
  uri=$(cat "${JOBS_FILE}" | grep -A 20 "name: \"${job_name}\"" | grep "uri:" | head -1 | sed 's/      uri: //g' | sed 's/"//g')
  
  # Extract the body - this is more complex due to JSON content
  body_start=$(grep -n "body:" "${JOBS_FILE}" | grep -A 20 "name: \"${job_name}\"" | head -1 | cut -d: -f1)
  body=$(sed -n "${body_start}p" "${JOBS_FILE}" | sed 's/      body: //g')
  
  # Create the job
  gcloud scheduler jobs create http ${job_name} \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --description="${description}" \
    --schedule="${schedule}" \
    --time-zone="${time_zone}" \
    --uri="${uri}" \
    --http-method="${http_method}" \
    --headers="Content-Type=application/json" \
    --message-body="${body}" \
    --oidc-service-account-email="${SA_EMAIL}" \
    --oidc-token-audience="${uri}"
  
  echo "  Created job: ${job_name}"
done

echo "======================================================================"
echo "Scheduler setup complete!"
echo ""
echo "Jobs URL: https://console.cloud.google.com/cloudscheduler?project=${PROJECT_ID}"
echo "======================================================================"
EOF
  chmod +x "${SETUP_SCRIPT}"
  echo -e "${GREEN}Created scheduler setup script: ${SETUP_SCRIPT}${NC}"
else
  echo -e "${GREEN}Using existing scheduler setup script: ${SETUP_SCRIPT}${NC}"
  chmod +x "${SETUP_SCRIPT}"
fi

# Execute the scheduler setup script
echo "Executing scheduler setup script..."
"${SETUP_SCRIPT}" --project="${PROJECT_ID}" --region="${REGION}" --service="${SERVICE_NAME}" --service-url="${SERVICE_URL}" --jobs="${JOBS_FILE}"

# Create daily checks script
DAILY_CHECKS_SCRIPT="${DEPLOY_DIR}/scripts/run-daily-checks.sh"
mkdir -p "${DEPLOY_DIR}/scripts"

echo "Creating daily checks script..."
cat > "${DAILY_CHECKS_SCRIPT}" << 'EOF'
#!/bin/bash
# Daily checks script for Marketplace Scraper
# This script can be run from your local environment to interact with
# the deployed scraper service and check its status

set -e  # Exit on error

# Default values
SERVICE_URL=""
OUTPUT_DIR="./logs"
DATE=$(date +%Y-%m-%d)
CONFIG_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --url)
      SERVICE_URL="$2"
      shift
      shift
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift
      shift
      ;;
    --config)
      CONFIG_FILE="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --url SERVICE_URL     Service URL for the deployed scraper"
      echo "  --output OUTPUT_DIR   Directory for output logs (default: ./logs)"
      echo "  --config CONFIG_FILE  Path to configuration file"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Load configuration file if provided
if [[ -n "${CONFIG_FILE}" && -f "${CONFIG_FILE}" ]]; then
  source "${CONFIG_FILE}"
  echo "Loaded configuration from: ${CONFIG_FILE}"
fi

# Get service URL if not provided
if [[ -z "${SERVICE_URL}" ]]; then
  # Try to use from config
  if [[ -n "${SERVICE_URL}" ]]; then
    echo "Using service URL from configuration: ${SERVICE_URL}"
  else
    # Try to get from gcloud
    echo "Trying to retrieve service URL from gcloud..."
    SERVICE_URL=$(gcloud run services describe marketplace-scraper --region=africa-south1 --format='value(status.url)' 2>/dev/null || echo "")
    
    if [[ -z "${SERVICE_URL}" ]]; then
      echo "Error: Service URL not provided and couldn't be retrieved from gcloud."
      echo "Please provide the service URL with --url parameter."
      exit 1
    fi
  fi
fi

echo "Using service URL: ${SERVICE_URL}"

# Create output directory if it doesn't exist
mkdir -p ${OUTPUT_DIR}
mkdir -p ${OUTPUT_DIR}/daily

# Get authentication token
TOKEN=$(gcloud auth print-identity-token 2>/dev/null || echo "")

if [[ -z "${TOKEN}" ]]; then
  echo "Warning: No authentication token available. Some operations might fail."
fi

# Function to fetch data and save to log
fetch_and_save() {
  local endpoint=$1
  local output_file=$2
  local auth_header=""
  
  if [[ ! -z "${TOKEN}" ]]; then
    auth_header="-H \"Authorization: Bearer ${TOKEN}\""
  fi
  
  echo "Fetching data from ${endpoint}..."
  
  # Fetch data
  local result=$(curl -s "${SERVICE_URL}${endpoint}" ${auth_header})
  
  # Save to file
  echo "${result}" > "${output_file}"
  
  echo "Saved output to ${output_file}"
  
  # Return the result for further processing
  echo "${result}"
}

# Get system status
STATUS_FILE="${OUTPUT_DIR}/daily/status-${DATE}.json"
echo "Checking system status..."
STATUS=$(fetch_and_save "/status" "${STATUS_FILE}")

# Check if the system is in load shedding mode
LOAD_SHEDDING=$(echo "${STATUS}" | jq -r '.scheduler.load_shedding_detected // false')

if [[ "${LOAD_SHEDDING}" == "true" ]]; then
  LOAD_SHEDDING_UNTIL=$(echo "${STATUS}" | jq -r '.scheduler.load_shedding_until // "unknown"')
  echo "⚠️ Load shedding detected! Active until: ${LOAD_SHEDDING_UNTIL}"
else
  echo "✓ No load shedding detected"
fi

# Get quota status
QUOTA_FILE="${OUTPUT_DIR}/daily/quota-${DATE}.json"
echo "Checking quota status..."
QUOTA=$(fetch_and_save "/quota" "${QUOTA_FILE}")

# Analyze quota
MONTHLY_USAGE=$(echo "${QUOTA}" | jq -r '.monthly_quota.usage_percentage // 0')
DAILY_USAGE=$(echo "${QUOTA}" | jq -r '.daily_quota.usage_percentage // 0')

echo "Quota Usage:"
echo "  Monthly: ${MONTHLY_USAGE}%"
echo "  Daily: ${DAILY_USAGE}%"

# Alert if quota usage is high
if (( $(echo "${MONTHLY_USAGE} > 80" | bc -l) )); then
  echo "⚠️ Monthly quota usage is high (${MONTHLY_USAGE}%)!"
  
  # If extremely high, send critical alert
  if (( $(echo "${MONTHLY_USAGE} > 95" | bc -l) )); then
    echo "🔴 CRITICAL: Monthly quota nearly exhausted (${MONTHLY_USAGE}%)!"
    echo "    Consider pausing non-essential tasks."
  fi
fi

if (( $(echo "${DAILY_USAGE} > 80" | bc -l) )); then
  echo "⚠️ Daily quota usage is high (${DAILY_USAGE}%)!"
fi

# Get daily summary
SUMMARY_FILE="${OUTPUT_DIR}/daily/summary-${DATE}.json"
echo "Getting daily summary..."
SUMMARY=$(fetch_and_save "/daily-summary" "${SUMMARY_FILE}")

# Extract key metrics
COMPLETED_TASKS=$(echo "${SUMMARY}" | jq -r '.scheduler_stats.completed_tasks // 0')
FAILED_TASKS=$(echo "${SUMMARY}" | jq -r '.scheduler_stats.failed_tasks // 0')
SUCCESS_RATE=$(echo "${SUMMARY}" | jq -r '.scheduler_stats.success_rate // 0')

echo "Task Statistics:"
echo "  Completed: ${COMPLETED_TASKS}"
echo "  Failed: ${FAILED_TASKS}"
echo "  Success Rate: ${SUCCESS_RATE}%"

# Alert if success rate is low
if (( $(echo "${SUCCESS_RATE} < 80" | bc -l) )); then
  echo "⚠️ Task success rate is low (${SUCCESS_RATE}%)!"
  
  if (( $(echo "${SUCCESS_RATE} < 50" | bc -l) )); then
    echo "🔴 CRITICAL: Very low success rate (${SUCCESS_RATE}%)!"
    echo "    Check system logs for errors."
  fi
fi

# Generate daily report
REPORT_FILE="${OUTPUT_DIR}/daily-report-${DATE}.txt"
echo "Generating daily report..."

cat > "${REPORT_FILE}" << EOF
====================================================================
  MARKETPLACE SCRAPER DAILY REPORT - ${DATE}
====================================================================

SERVICE URL: ${SERVICE_URL}

SYSTEM STATUS:
  Load Shedding: $(if [[ "${LOAD_SHEDDING}" == "true" ]]; then echo "ACTIVE until ${LOAD_SHEDDING_UNTIL}"; else echo "INACTIVE"; fi)
  Uptime: $(echo "${STATUS}" | jq -r '.uptime // "unknown"') seconds

QUOTA STATUS:
  Monthly Usage: ${MONTHLY_USAGE}%
  Daily Usage: ${DAILY_USAGE}%
  Remaining Monthly Requests: $(echo "${QUOTA}" | jq -r '.monthly_quota.remaining // "unknown"')
  Remaining Daily Requests: $(echo "${QUOTA}" | jq -r '.daily_quota.remaining // "unknown"')

TASK STATISTICS:
  Completed Tasks: ${COMPLETED_TASKS}
  Failed Tasks: ${FAILED_TASKS}
  Success Rate: ${SUCCESS_RATE}%

PRIORITY USAGE:
$(echo "${QUOTA}" | jq -r '.priority_usage | to_entries[] | "  \(.key): \(.value.usage_percentage)% (\(.value.usage)/\(.value.limit))"')

CATEGORY USAGE:
$(echo "${QUOTA}" | jq -r '.category_usage | to_entries[] | "  \(.key): \(.value.usage) requests"')

PERFORMANCE METRICS:
$(echo "${SUMMARY}" | jq -r '.performance | to_entries[] | "  \(.key):\n    Average: \(.value.avg) seconds\n    Min: \(.value.min) seconds\n    Max: \(.value.max) seconds"')

ALERTS:
$(if (( $(echo "${MONTHLY_USAGE} > 80" | bc -l) )); then echo "  ⚠️ HIGH MONTHLY QUOTA USAGE: ${MONTHLY_USAGE}%"; fi)
$(if (( $(echo "${DAILY_USAGE} > 80" | bc -l) )); then echo "  ⚠️ HIGH DAILY QUOTA USAGE: ${DAILY_USAGE}%"; fi)
$(if (( $(echo "${SUCCESS_RATE} < 80" | bc -l) )); then echo "  ⚠️ LOW SUCCESS RATE: ${SUCCESS_RATE}%"; fi)
$(if [[ "${LOAD_SHEDDING}" == "true" ]]; then echo "  ⚠️ LOAD SHEDDING ACTIVE until ${LOAD_SHEDDING_UNTIL}"; fi)

RECOMMENDATIONS:
$(if (( $(echo "${MONTHLY_USAGE} > 90" | bc -l) )); then echo "  - Consider reducing task frequency to conserve quota"; fi)
$(if (( $(echo "${SUCCESS_RATE} < 70" | bc -l) )); then echo "  - Check logs for recurring errors"; fi)
$(if [[ "${LOAD_SHEDDING}" == "true" ]]; then echo "  - System operating in reduced capacity mode during load shedding"; fi)
$(if (( $(echo "${MONTHLY_USAGE} < 60" | bc -l) && $(echo "${SUCCESS_RATE} > 90" | bc -l) )); then echo "  - System operating normally, no action required"; fi)

====================================================================
Report generated at: $(date)
Full details available in the daily logs directory: ${OUTPUT_DIR}/daily/
====================================================================
EOF

echo "Daily report generated at: ${REPORT_FILE}"
echo ""
echo "Summary:"
if [[ "${LOAD_SHEDDING}" == "true" ]]; then
  echo "⚠️ Load shedding active - System operating in reduced capacity mode"
elif (( $(echo "${MONTHLY_USAGE} > 90" | bc -l) )); then
  echo "⚠️ High quota usage - Consider reducing task frequency"
elif (( $(echo "${SUCCESS_RATE} < 70" | bc -l) )); then
  echo "⚠️ Low success rate - Check logs for errors"
else
  echo "✅ System operating normally"
fi

echo "======================================================================"
EOF
chmod +x "${DAILY_CHECKS_SCRIPT}"
echo -e "${GREEN}Created daily checks script: ${DAILY_CHECKS_SCRIPT}${NC}"

echo ""
echo -e "${BLUE}Scheduler setup completed successfully.${NC}"
echo -e "${BLUE}Cloud Scheduler jobs are now configured and ready to run.${NC}"
echo ""