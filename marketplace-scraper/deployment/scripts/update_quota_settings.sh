#!/bin/bash
# Script to update quota settings for the marketplace scraper

set -e  # Exit on error

echo "=== Updating Marketplace Scraper Quota Settings ==="
echo "New monthly quota: 216,000 requests"
echo "New daily quota: 7,200 requests"

# Default values
SERVICE_URL=""
CONFIG_PATH="../config.json"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --url)
      SERVICE_URL="$2"
      shift
      shift
      ;;
    --config)
      CONFIG_PATH="$2"
      shift
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --url SERVICE_URL     Service URL for the deployed scraper"
      echo "  --config CONFIG_PATH  Path to config file (default: ../config.json)"
      echo "  --dry-run             Validate settings without applying"
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

# Get authentication token
TOKEN=$(gcloud auth print-identity-token 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Warning: No authentication token available. Some operations might fail."
fi

# Function to call API
call_api() {
  local endpoint=$1
  local method=${2:-GET}
  local data=$3
  local auth_header=""
  
  if [ ! -z "$TOKEN" ]; then
    auth_header="-H \"Authorization: Bearer ${TOKEN}\""
  fi
  
  # Build curl command
  if [ "$method" == "GET" ]; then
    curl_cmd="curl -s -X ${method} \"${SERVICE_URL}${endpoint}\" ${auth_header}"
  else
    curl_cmd="curl -s -X ${method} \"${SERVICE_URL}${endpoint}\" ${auth_header} -H \"Content-Type: application/json\" -d '${data}'"
  fi
  
  # Execute command
  if [ "$DRY_RUN" == "true" ] && [ "$method" != "GET" ]; then
    echo "[DRY RUN] Would execute: $curl_cmd"
    echo "[DRY RUN] Data: $data"
    return 0
  else
    eval $curl_cmd
  fi
}

# Check current quota settings
echo "Checking current quota settings..."
current_settings=$(call_api "/quota")

current_monthly=$(echo "$current_settings" | jq -r '.monthly_quota.total_quota // 0')
current_daily=$(echo "$current_settings" | jq -r '.daily_quota.total_quota // 0')

echo "Current monthly quota: $current_monthly"
echo "Current daily quota: $current_daily"

# Read configuration file
echo "Reading configuration from $CONFIG_PATH..."
if [ ! -f "$CONFIG_PATH" ]; then
  echo "Error: Configuration file not found: $CONFIG_PATH"
  exit 1
fi

config_monthly=$(jq -r '.monthly_quota // 216000' "$CONFIG_PATH")
config_daily=$(jq -r '.daily_quota // 7200' "$CONFIG_PATH")
config_emergency=$(jq -r '.emergency_threshold // 0.97' "$CONFIG_PATH")
config_warning=$(jq -r '.warning_threshold // 0.85' "$CONFIG_PATH")

echo "Configuration values:"
echo "  Monthly quota: $config_monthly"
echo "  Daily quota: $config_daily"
echo "  Emergency threshold: $config_emergency"
echo "  Warning threshold: $config_warning"

# Prepare update data
update_data="{
  \"monthly_quota\": $config_monthly,
  \"daily_quota\": $config_daily,
  \"emergency_threshold\": $config_emergency,
  \"warning_threshold\": $config_warning
}"

# Update quota settings
echo "Updating quota settings..."
update_result=$(call_api "/quota/update" "POST" "$update_data")

if [ "$DRY_RUN" == "false" ]; then
  update_status=$(echo "$update_result" | jq -r '.status // "unknown"')

  if [ "$update_status" == "success" ]; then
    echo "✅ Quota settings updated successfully!"
  else
    echo "❌ Failed to update quota settings: $(echo "$update_result" | jq -r '.message // "Unknown error"')"
    exit 1
  fi

  # Verify updated settings
  echo "Verifying updated settings..."
  updated_settings=$(call_api "/quota")

  updated_monthly=$(echo "$updated_settings" | jq -r '.monthly_quota.total_quota // 0')
  updated_daily=$(echo "$updated_settings" | jq -r '.daily_quota.total_quota // 0')

  echo "Updated monthly quota: $updated_monthly"
  echo "Updated daily quota: $updated_daily"

  if [ "$updated_monthly" -eq "$config_monthly" ] && [ "$updated_daily" -eq "$config_daily" ]; then
    echo "✅ Verification successful!"
  else
    echo "⚠️ Verification warning: Updated values don't match configuration"
    echo "  Expected monthly: $config_monthly, Actual: $updated_monthly"
    echo "  Expected daily: $config_daily, Actual: $updated_daily"
  fi
else
  echo "[DRY RUN] Would update quota settings with: $update_data"
fi

# Update marketplace settings
echo "Updating marketplace settings..."

marketplace_settings=$(jq -r '.marketplace_settings' "$CONFIG_PATH")
marketplace_update_data="{\"marketplace_settings\": $marketplace_settings}"

marketplace_result=$(call_api "/settings/marketplaces" "POST" "$marketplace_update_data")

if [ "$DRY_RUN" == "false" ]; then
  marketplace_status=$(echo "$marketplace_result" | jq -r '.status // "unknown"')

  if [ "$marketplace_status" == "success" ]; then
    echo "✅ Marketplace settings updated successfully!"
  else
    echo "❌ Failed to update marketplace settings: $(echo "$marketplace_result" | jq -r '.message // "Unknown error"')"
    exit 1
  fi
else
  echo "[DRY RUN] Would update marketplace settings"
fi

# Update scheduler with new jobs
echo "Updating scheduler jobs..."

# Check if scheduler jobs file exists
JOBS_FILE="../scheduler/jobs.yaml"
if [ ! -f "$JOBS_FILE" ]; then
  echo "⚠️ Scheduler jobs file not found: $JOBS_FILE"
  echo "Skipping scheduler update"
else
  # Convert YAML to JSON for API call
  if command -v yq &> /dev/null; then
    scheduler_jobs=$(yq -o=json eval "$JOBS_FILE")
  else
    echo "⚠️ 'yq' command not found, using Python to convert YAML"
    scheduler_jobs=$(python3 -c "import yaml, json, sys; print(json.dumps(yaml.safe_load(open('$JOBS_FILE'))))")
  fi

  scheduler_update_data="{\"jobs\": $scheduler_jobs}"
  
  scheduler_result=$(call_api "/scheduler/jobs" "POST" "$scheduler_update_data")

  if [ "$DRY_RUN" == "false" ]; then
    scheduler_status=$(echo "$scheduler_result" | jq -r '.status // "unknown"')

    if [ "$scheduler_status" == "success" ]; then
      echo "✅ Scheduler jobs updated successfully!"
      job_count=$(echo "$scheduler_result" | jq -r '.job_count // 0')
      echo "Updated $job_count scheduled jobs"
    else
      echo "❌ Failed to update scheduler jobs: $(echo "$scheduler_result" | jq -r '.message // "Unknown error"')"
      exit 1
    fi
  else
    echo "[DRY RUN] Would update scheduler jobs"
  fi
fi

# Restart services if needed
if [ "$DRY_RUN" == "false" ]; then
  echo "Do you want to restart the scraper service to apply changes? (y/n)"
  read restart_response
  
  if [[ "$restart_response" =~ ^[Yy]$ ]]; then
    echo "Restarting service..."
    restart_result=$(call_api "/admin/restart" "POST" "{}")
    restart_status=$(echo "$restart_result" | jq -r '.status // "unknown"')
    
    if [ "$restart_status" == "success" ]; then
      echo "✅ Service restart initiated"
      echo "⏳ Waiting for service to come back online..."
      
      # Wait for service to come back
      max_attempts=30
      attempts=0
      service_online=false
      
      while [ $attempts -lt $max_attempts ] && [ "$service_online" == "false" ]; do
        echo -n "."
        sleep 5
        attempts=$((attempts + 1))
        
        health_check=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/health" 2>/dev/null || echo "0")
        if [ "$health_check" == "200" ]; then
          service_online=true
        fi
      done
      
      echo ""
      if [ "$service_online" == "true" ]; then
        echo "✅ Service is back online!"
      else
        echo "⚠️ Service status unknown after waiting. Please check manually."
      fi
    else
      echo "❌ Failed to restart service: $(echo "$restart_result" | jq -r '.message // "Unknown error"')"
    fi
  else
    echo "Skipping service restart"
  fi
fi

echo ""
echo "=== Quota update process completed ==="
if [ "$DRY_RUN" == "true" ]; then
  echo "Note: This was a dry run, no changes were applied"
fi