#!/bin/bash
# Test script for quota system implementation

set -e  # Exit on error

# Default values
SERVICE_URL=""
TEST_MODE="basic"
OUTPUT_DIR="./test_results"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --url)
      SERVICE_URL="$2"
      shift
      shift
      ;;
    --mode)
      TEST_MODE="$2"
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
      echo "  --mode MODE           Test mode (basic, full, stress)"
      echo "  --output OUTPUT_DIR   Directory for test output (default: ./test_results)"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check for required parameters
if [ -z "$SERVICE_URL" ]; then
  echo "Error: Service URL is required. Use --url parameter."
  exit 1
fi

# Create output directory
mkdir -p $OUTPUT_DIR

echo "=========================================="
echo "Quota System Implementation Test"
echo "Mode: $TEST_MODE"
echo "Service: $SERVICE_URL"
echo "Output: $OUTPUT_DIR"
echo "=========================================="

# Function to test quota values
test_quota_values() {
  echo "Testing quota values..."
  
  # Get quota settings
  quota_response=$(curl -s "${SERVICE_URL}/quota")
  
  # Extract values
  monthly_quota=$(echo "$quota_response" | jq -r '.monthly_quota.total_quota // 0')
  daily_quota=$(echo "$quota_response" | jq -r '.daily_quota.total_quota // 0')
  warning_threshold=$(echo "$quota_response" | jq -r '.thresholds.warning // 0')
  emergency_threshold=$(echo "$quota_response" | jq -r '.thresholds.emergency // 0')
  
  # Check values
  echo " - Monthly quota: $monthly_quota (expected: 216000)... $([ "$monthly_quota" -eq 216000 ] && echo "PASS" || echo "FAIL")"
  echo " - Daily quota: $daily_quota (expected: 7200)... $([ "$daily_quota" -eq 7200 ] && echo "PASS" || echo "FAIL")"
  echo " - Warning threshold: $warning_threshold (expected: ~0.85)... $([ $(echo "$warning_threshold > 0.84 && $warning_threshold < 0.86" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
  echo " - Emergency threshold: $emergency_threshold (expected: ~0.97)... $([ $(echo "$emergency_threshold > 0.96 && $emergency_threshold < 0.98" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
  
  # Save results
  echo "$quota_response" > "$OUTPUT_DIR/quota_settings.json"
}

# Function to test priority allocation
test_priority_allocation() {
  echo "Testing priority allocation..."
  
  # Get quota settings
  quota_response=$(curl -s "${SERVICE_URL}/quota")
  
  # Extract priority allocations
  critical_allocation=$(echo "$quota_response" | jq -r '.priority_usage.CRITICAL.allocation // 0')
  high_allocation=$(echo "$quota_response" | jq -r '.priority_usage.HIGH.allocation // 0')
  medium_allocation=$(echo "$quota_response" | jq -r '.priority_usage.MEDIUM.allocation // 0')
  low_allocation=$(echo "$quota_response" | jq -r '.priority_usage.LOW.allocation // 0')
  background_allocation=$(echo "$quota_response" | jq -r '.priority_usage.BACKGROUND.allocation // 0')
  
  # Check values
  echo " - CRITICAL allocation: $critical_allocation (expected: ~0.35)... $([ $(echo "$critical_allocation > 0.34 && $critical_allocation < 0.36" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
  echo " - HIGH allocation: $high_allocation (expected: ~0.35)... $([ $(echo "$high_allocation > 0.34 && $high_allocation < 0.36" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
  echo " - MEDIUM allocation: $medium_allocation (expected: ~0.20)... $([ $(echo "$medium_allocation > 0.19 && $medium_allocation < 0.21" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
  echo " - LOW allocation: $low_allocation (expected: ~0.05)... $([ $(echo "$low_allocation > 0.04 && $low_allocation < 0.06" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
  echo " - BACKGROUND allocation: $background_allocation (expected: ~0.05)... $([ $(echo "$background_allocation > 0.04 && $background_allocation < 0.06" | bc -l) -eq 1 ] && echo "PASS" || echo "FAIL")"
}

# Function to test marketplace settings
test_marketplace_settings() {
  echo "Testing marketplace settings..."
  
  # Get marketplace settings
  settings_response=$(curl -s "${SERVICE_URL}/settings/marketplaces")
  
  # Save results
  echo "$settings_response" > "$OUTPUT_DIR/marketplace_settings.json"
  
  # Extract marketplace settings
  takealot_max=$(echo "$settings_response" | jq -r '.marketplace_settings.takealot.max_daily_requests // 0')
  amazon_max=$(echo "$settings_response" | jq -r '.marketplace_settings.amazon.max_daily_requests // 0')
  bob_shop_max=$(echo "$settings_response" | jq -r '.marketplace_settings.bob_shop.max_daily_requests // 0')
  makro_max=$(echo "$settings_response" | jq -r '.marketplace_settings.makro.max_daily_requests // 0')
  loot_max=$(echo "$settings_response" | jq -r '.marketplace_settings.loot.max_daily_requests // 0')
  buck_cheap_max=$(echo "$settings_response" | jq -r '.marketplace_settings.buck_cheap.max_daily_requests // 0')
  
  # Check values
  echo " - Takealot max daily: $takealot_max (expected: 2500)... $([ "$takealot_max" -eq 2500 ] && echo "PASS" || echo "FAIL")"
  echo " - Amazon max daily: $amazon_max (expected: 2000)... $([ "$amazon_max" -eq 2000 ] && echo "PASS" || echo "FAIL")"
  echo " - Bob Shop max daily: $bob_shop_max (expected: 900)... $([ "$bob_shop_max" -eq 900 ] && echo "PASS" || echo "FAIL")"
  echo " - Makro max daily: $makro_max (expected: 900)... $([ "$makro_max" -eq 900 ] && echo "PASS" || echo "FAIL")"
  echo " - Loot max daily: $loot_max (expected: 600)... $([ "$loot_max" -eq 600 ] && echo "PASS" || echo "FAIL")"
  echo " - Buck Cheap max daily: $buck_cheap_max (expected: 300)... $([ "$buck_cheap_max" -eq 300 ] && echo "PASS" || echo "FAIL")"
}

# Function to test scheduler jobs
test_scheduler_jobs() {
  echo "Testing scheduler jobs..."
  
  # Get scheduler jobs
  jobs=$(gcloud scheduler jobs list --format=json)
  
  # Save results
  echo "$jobs" > "$OUTPUT_DIR/scheduler_jobs.json"
  
  # Count jobs
  job_count=$(echo "$jobs" | jq 'length')
  
  # Check if we have enough jobs
  echo " - Scheduler job count: $job_count (expected: >=20)... $([ "$job_count" -ge 20 ] && echo "PASS" || echo "FAIL")"
  
  # Check for specific required jobs
  takealot_daily_deals=$(echo "$jobs" | jq -r '.[] | select(.name | contains("takealot-daily-deals")) | .name' | wc -l)
  amazon_high_value=$(echo "$jobs" | jq -r '.[] | select(.name | contains("amazon-high-value")) | .name' | wc -l)
  opportunity_scoring=$(echo "$jobs" | jq -r '.[] | select(.name | contains("opportunity-scoring")) | .name' | wc -l)
  
  echo " - Takealot daily deals job present... $([ "$takealot_daily_deals" -ge 1 ] && echo "PASS" || echo "FAIL")"
  echo " - Amazon high value job present... $([ "$amazon_high_value" -ge 1 ] && echo "PASS" || echo "FAIL")"
  echo " - Opportunity scoring job present... $([ "$opportunity_scoring" -ge 1 ] && echo "PASS" || echo "FAIL")"
}

# Function to test monitoring configuration
test_monitoring() {
  echo "Testing monitoring configuration..."
  
  # Get alert policies
  policies=$(gcloud monitoring policies list --format=json)
  
  # Save results
  echo "$policies" > "$OUTPUT_DIR/alert_policies.json"
  
  # Count policies
  policy_count=$(echo "$policies" | jq 'length')
  
  # Check if we have policies
  echo " - Alert policy count: $policy_count (expected: >=5)... $([ "$policy_count" -ge 5 ] && echo "PASS" || echo "FAIL")"
  
  # Check for specific required policies
  quota_alert=$(echo "$policies" | jq -r '.[] | select(.displayName | contains("Quota Usage")) | .displayName' | wc -l)
  daily_quota_alert=$(echo "$policies" | jq -r '.[] | select(.displayName | contains("Daily Quota")) | .displayName' | wc -l)
  
  echo " - Quota usage alert present... $([ "$quota_alert" -ge 1 ] && echo "PASS" || echo "FAIL")"
  echo " - Daily quota alert present... $([ "$daily_quota_alert" -ge 1 ] && echo "PASS" || echo "FAIL")"
  
  # Get dashboards
  dashboards=$(gcloud monitoring dashboards list --format=json)
  
  # Save results
  echo "$dashboards" > "$OUTPUT_DIR/dashboards.json"
  
  # Check for quota dashboard
  quota_dashboard=$(echo "$dashboards" | jq -r '.[] | select(.displayName | contains("Quota")) | .displayName' | wc -l)
  
  echo " - Quota dashboard present... $([ "$quota_dashboard" -ge 1 ] && echo "PASS" || echo "FAIL")"
}

# Function to run the Python validation script
run_validation_script() {
  echo "Running validation script..."
  
  # Check if script exists
  if [ ! -f "./validate_quota_upgrade.py" ]; then
    echo " - Validation script not found, skipping..."
    return
  fi
  
  # Run script
  python3 ./validate_quota_upgrade.py --service-url="$SERVICE_URL" --output-file="$OUTPUT_DIR/validation_report.json"
  
  # Check result
  if [ $? -eq 0 ]; then
    echo " - Validation successful (PASS)"
  else
    echo " - Validation failed (FAIL)"
  fi
}

# Function to run full testing suite
run_full_test() {
  echo "Running full test suite..."
  
  # Run basic tests
  test_quota_values
  test_priority_allocation
  test_marketplace_settings
  test_scheduler_jobs
  test_monitoring
  
  # Run validation script
  run_validation_script
  
  # Run optimizer script if available
  if [ -f "./quota_efficiency_optimizer.py" ]; then
    echo "Running efficiency optimizer..."
    python3 ./quota_efficiency_optimizer.py --service-url="$SERVICE_URL" --output-dir="$OUTPUT_DIR/optimizer"
  fi
  
  # Run report generator if available
  if [ -f "./daily_quota_report.py" ]; then
    echo "Running quota report generator..."
    python3 ./daily_quota_report.py --service-url="$SERVICE_URL" --output-dir="$OUTPUT_DIR/reports"
  fi
}

# Function to run stress test
run_stress_test() {
  echo "Running stress test (simulating high usage)..."
  
  # Create test payload
  payload='{
    "simulate_usage": true,
    "requests": 1000,
    "distribution": {
      "takealot": 0.35,
      "amazon": 0.28,
      "bob_shop": 0.12,
      "makro": 0.12,
      "loot": 0.08,
      "buck_cheap": 0.05
    },
    "priority_distribution": {
      "CRITICAL": 0.2,
      "HIGH": 0.3,
      "MEDIUM": 0.3,
      "LOW": 0.1,
      "BACKGROUND": 0.1
    }
  }'
  
  # Send request
  response=$(curl -s -X POST "${SERVICE_URL}/admin/simulate-usage" -H "Content-Type: application/json" -d "$payload")
  
  # Save results
  echo "$response" > "$OUTPUT_DIR/stress_test_results.json"
  
  # Check result
  status=$(echo "$response" | jq -r '.status // "failed"')
  
  echo " - Stress test: $([ "$status" == "success" ] && echo "PASS" || echo "FAIL")"
  
  # Get quota status after stress test
  quota_after=$(curl -s "${SERVICE_URL}/quota")
  
  # Save results
  echo "$quota_after" > "$OUTPUT_DIR/quota_after_stress.json"
  
  # Check circuit breaker status
  circuit_breaker_status=$(echo "$quota_after" | jq -r '.circuit_breaker.tripped // false')
  
  echo " - Circuit breaker status: $circuit_breaker_status (should depend on current usage levels)"
}

# Run tests based on mode
case $TEST_MODE in
  "basic")
    test_quota_values
    test_priority_allocation
    test_marketplace_settings
    ;;
  "full")
    run_full_test
    ;;
  "stress")
    test_quota_values
    run_stress_test
    ;;
  *)
    echo "Unknown test mode: $TEST_MODE"
    exit 1
    ;;
esac

echo "=========================================="
echo "Testing completed. Results saved to $OUTPUT_DIR"
echo "=========================================="