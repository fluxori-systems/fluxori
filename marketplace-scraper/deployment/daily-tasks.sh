#!/bin/bash
# Daily tasks script for Marketplace Scraper
# This script can be run from your local environment to interact with
# the deployed scraper service and check its status

set -e  # Exit on error

# Default values
SERVICE_URL=""
OUTPUT_DIR="./logs"
DATE=$(date +%Y-%m-%d)

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
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --url SERVICE_URL     Service URL for the deployed scraper"
      echo "  --output OUTPUT_DIR   Directory for output logs (default: ./logs)"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get service URL if not provided
if [ -z "$SERVICE_URL" ]; then
  # Try to get from gcloud
  SERVICE_URL=$(gcloud run services describe marketplace-scraper --region=africa-south1 --format='value(status.url)' 2>/dev/null || echo "")
  
  if [ -z "$SERVICE_URL" ]; then
    echo "Error: Service URL not provided and couldn't be retrieved from gcloud."
    echo "Please provide the service URL with --url parameter."
    exit 1
  fi
fi

# Create output directory if it doesn't exist
mkdir -p ${OUTPUT_DIR}
mkdir -p ${OUTPUT_DIR}/daily

# Get authentication token
TOKEN=$(gcloud auth print-identity-token 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Warning: No authentication token available. Some operations might fail."
fi

# Function to fetch data and save to log
fetch_and_save() {
  local endpoint=$1
  local output_file=$2
  local auth_header=""
  
  if [ ! -z "$TOKEN" ]; then
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

if [ "${LOAD_SHEDDING}" == "true" ]; then
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
  Load Shedding: $(if [ "${LOAD_SHEDDING}" == "true" ]; then echo "ACTIVE until ${LOAD_SHEDDING_UNTIL}"; else echo "INACTIVE"; fi)
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
$(if [ "${LOAD_SHEDDING}" == "true" ]; then echo "  ⚠️ LOAD SHEDDING ACTIVE until ${LOAD_SHEDDING_UNTIL}"; fi)

RECOMMENDATIONS:
$(if (( $(echo "${MONTHLY_USAGE} > 90" | bc -l) )); then echo "  - Consider reducing task frequency to conserve quota"; fi)
$(if (( $(echo "${SUCCESS_RATE} < 70" | bc -l) )); then echo "  - Check logs for recurring errors"; fi)
$(if [ "${LOAD_SHEDDING}" == "true" ]; then echo "  - System operating in reduced capacity mode during load shedding"; fi)
$(if (( $(echo "${MONTHLY_USAGE} < 60" | bc -l) && $(echo "${SUCCESS_RATE} > 90" | bc -l) )); then echo "  - System operating normally, no action required"; fi)

====================================================================
Report generated at: $(date)
Full details available in the daily logs directory: ${OUTPUT_DIR}/daily/
====================================================================
EOF

echo "Daily report generated at: ${REPORT_FILE}"
echo ""
echo "Summary:"
if [ "${LOAD_SHEDDING}" == "true" ]; then
  echo "⚠️ Load shedding active - System operating in reduced capacity mode"
elif (( $(echo "${MONTHLY_USAGE} > 90" | bc -l) )); then
  echo "⚠️ High quota usage - Consider reducing task frequency"
elif (( $(echo "${SUCCESS_RATE} < 70" | bc -l) )); then
  echo "⚠️ Low success rate - Check logs for errors"
else
  echo "✅ System operating normally"
fi

echo "======================================================================"