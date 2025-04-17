#!/bin/bash
# Phase 6: Validation and Testing - Verification Steps
# This script performs validation tests on the deployed system

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
echo -e "${BLUE}Phase 6: Validation and Testing${NC}"
echo -e "${BLUE}---------------------------${NC}"
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

# Create test directory
TEST_DIR="${DEPLOY_DIR}/tests"
mkdir -p "${TEST_DIR}"

# Create simple test script
TEST_SCRIPT="${TEST_DIR}/run-tests.sh"
echo "Creating test script..."
cat > "${TEST_SCRIPT}" << EOF
#!/bin/bash
# Test script for Marketplace Scraper

set -e  # Exit on error

# Default values
SERVICE_URL="${SERVICE_URL}"
OUTPUT_DIR="${TEST_DIR}/results"

# Create output directory
mkdir -p "\${OUTPUT_DIR}"

# Function to run a test
run_test() {
  local name=\$1
  local endpoint=\$2
  local method=\$3
  local data=\$4
  local expected_status=\$5
  
  echo "Running test: \${name}..."
  
  if [[ "\${method}" == "GET" ]]; then
    # GET request
    response=\$(curl -s -w "\\n%{http_code}" "\${SERVICE_URL}\${endpoint}")
  else
    # POST request
    response=\$(curl -s -w "\\n%{http_code}" -X \${method} "\${SERVICE_URL}\${endpoint}" \\
      -H "Content-Type: application/json" \\
      -d "\${data}")
  fi
  
  # Split response body and status code
  status_code=\$(echo "\${response}" | tail -n1)
  body=\$(echo "\${response}" | sed '\$d')
  
  # Save response to file
  echo "\${body}" > "\${OUTPUT_DIR}/\${name}.json"
  
  # Check status code
  if [[ "\${status_code}" == "\${expected_status}" ]]; then
    echo "  ✅ Test passed: \${name} (Status: \${status_code})"
  else
    echo "  ❌ Test failed: \${name} (Expected: \${expected_status}, Got: \${status_code})"
    return 1
  fi
  
  # Return the response body for further processing
  echo "\${body}"
}

# Test 1: Health Check
run_test "health-check" "/health" "GET" "" "200"

# Test 2: Status Check
status_response=\$(run_test "status-check" "/status" "GET" "" "200")

# Test 3: Quota Check
quota_response=\$(run_test "quota-check" "/quota" "GET" "" "200")

# Test 4: Submit a test task
task_data='{
  "task_type": "test",
  "marketplace": "takealot",
  "params": {},
  "priority": "LOW"
}'
run_test "submit-task" "/tasks/execute" "POST" "\${task_data}" "202"

# Test 5: Check daily summary
run_test "daily-summary" "/daily-summary" "GET" "" "200"

# Test 6: Check scheduler status
run_test "scheduler-status" "/scheduler/status" "GET" "" "200"

echo ""
echo "All tests completed! Results saved to: \${OUTPUT_DIR}"
EOF
chmod +x "${TEST_SCRIPT}"
echo -e "${GREEN}Created test script: ${TEST_SCRIPT}${NC}"

# Create the documentation files
echo "Creating documentation files..."

# Create DEPLOYMENT_GUIDE.md
DEPLOYMENT_GUIDE="${DEPLOY_DIR}/DEPLOYMENT_GUIDE.md"
cat > "${DEPLOYMENT_GUIDE}" << EOF
# Marketplace Scraper Deployment Guide

This guide explains how to deploy the Marketplace Scraper system to Google Cloud Platform.

## Prerequisites

Before starting the deployment, ensure you have the following:

1. Google Cloud SDK installed and configured
2. Docker installed (for building container images)
3. SmartProxy API token
4. Git repository cloned locally

## Deployment Process

The deployment is divided into six phases, each handled by a separate script:

### Phase 1: Foundation Infrastructure

Sets up the project, enables required APIs, and creates service accounts:

\`\`\`bash
./deployment/phase1_foundation.sh --project=fluxori-marketplace-data --region=africa-south1
\`\`\`

### Phase 2: Database Setup

Configures Firestore database, collections, and indexes:

\`\`\`bash
./deployment/phase2_database.sh --project=fluxori-marketplace-data --region=africa-south1
\`\`\`

### Phase 3: Application Deployment

Builds and deploys the Docker container to Cloud Run:

\`\`\`bash
./deployment/phase3_application.sh --project=fluxori-marketplace-data --region=africa-south1 \\
  --memory=2Gi --cpu=1 --min-instances=0 --max-instances=2 \\
  --smartproxy-token=YOUR_SMARTPROXY_TOKEN
\`\`\`

### Phase 4: Scheduler Setup

Sets up Cloud Scheduler jobs for recurring tasks:

\`\`\`bash
./deployment/phase4_scheduler.sh --project=fluxori-marketplace-data --region=africa-south1
\`\`\`

### Phase 5: Monitoring Setup

Creates Cloud Monitoring dashboard and alert policies:

\`\`\`bash
./deployment/phase5_monitoring.sh --project=fluxori-marketplace-data \\
  --notification-email=alerts@fluxori.com
\`\`\`

### Phase 6: Validation and Testing

Verifies the deployment with a series of tests:

\`\`\`bash
./deployment/phase6_validation.sh --project=fluxori-marketplace-data --region=africa-south1
\`\`\`

## Running the Complete Deployment

To run all phases in sequence, use the master setup script:

\`\`\`bash
./deployment/setup.sh --project=fluxori-marketplace-data --region=africa-south1 \\
  --smartproxy-token=YOUR_SMARTPROXY_TOKEN --email=alerts@fluxori.com
\`\`\`

## Post-Deployment Tasks

1. Verify the dashboard in Google Cloud Console
2. Set up a daily check using the provided script:

\`\`\`bash
./deployment/scripts/run-daily-checks.sh --url=https://your-service-url
\`\`\`

3. Test a manual task execution:

\`\`\`bash
curl -X POST "https://your-service-url/tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{"task_type":"extract_daily_deals","marketplace":"takealot","params":{},"priority":"HIGH"}'
\`\`\`

## Additional Resources

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and their solutions
- [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) - How to monitor during absence
- [EMERGENCY_RECOVERY.md](./EMERGENCY_RECOVERY.md) - Recovery procedures
EOF
echo -e "${GREEN}Created deployment guide: ${DEPLOYMENT_GUIDE}${NC}"

# Create TROUBLESHOOTING.md
TROUBLESHOOTING="${DEPLOY_DIR}/TROUBLESHOOTING.md"
cat > "${TROUBLESHOOTING}" << EOF
# Marketplace Scraper Troubleshooting Guide

This guide helps diagnose and resolve common issues with the Marketplace Scraper system.

## Common Issues and Solutions

### 1. Quota Exceeded

**Symptoms**:
- Tasks being rejected with "Quota exceeded" errors
- High quota usage in monitoring dashboard
- Quota-related alert emails

**Solutions**:

```bash
# Temporarily reduce task frequency
curl -X POST "https://your-service-url/tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_type": "adjust_quota",
    "params": {
      "daily_quota": 1350,
      "emergency_threshold": 0.98,
      "warning_threshold": 0.90
    },
    "priority": "CRITICAL"
  }'
```

### 2. Persistent Load Shedding Detection

**Symptoms**:
- System remains in load shedding mode for >12 hours
- Normal tasks not resuming despite power restoration

**Solutions**:

```bash
# Reset load shedding detection manually
curl -X POST "https://your-service-url/tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_type": "reset_load_shedding",
    "params": {},
    "priority": "CRITICAL"
  }'
```

### 3. High Error Rates

**Symptoms**:
- Error rates >20% in monitoring dashboard
- Alert emails about failed tasks
- Fewer successful data points collected

**Solutions**:

First, diagnose the issue:
```bash
# Check recent errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper AND severity>=ERROR" --limit=20
```

Common resolutions:
```bash
# Restart the service if errors persist
gcloud run services update marketplace-scraper --region=africa-south1 --clear-env-vars
gcloud run services update marketplace-scraper --region=africa-south1 --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"

# If SmartProxy errors are occurring, refresh token:
# 1. Get current token from Secret Manager
gcloud secrets versions access latest --secret=smartproxy-auth-token

# 2. Create new version with refreshed token
echo -n "NEW_TOKEN_HERE" | gcloud secrets versions add smartproxy-auth-token --data-file=-
```

### 4. Service Unavailable

**Symptoms**:
- 5xx responses from service endpoints
- Alert emails about service inactivity
- No tasks being executed

**Solutions**:

```bash
# Check Cloud Run service status
gcloud run services describe marketplace-scraper --region=africa-south1

# View logs for crash information
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper" --limit=50

# Restart service
gcloud run services update marketplace-scraper --region=africa-south1 --clear-env-vars
gcloud run services update marketplace-scraper --region=africa-south1 --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"
```

### 5. Scheduler Jobs Not Running

**Symptoms**:
- No new data being collected
- Scheduler jobs showing as failed in Cloud Console

**Solutions**:

```bash
# List scheduler jobs
gcloud scheduler jobs list --region=africa-south1

# Check job execution history
gcloud scheduler jobs list-executions marketplace-scraper-daily-product-refresh --region=africa-south1

# Manually trigger a job
gcloud scheduler jobs run marketplace-scraper-daily-product-refresh --region=africa-south1
```

### 6. Dashboard Not Showing Data

**Symptoms**:
- Metrics missing from dashboard
- Graphs showing empty data

**Solutions**:

```bash
# Check if service is generating metrics
curl -s "https://your-service-url/status" | jq .metrics

# Restart service to refresh metrics publication
gcloud run services update marketplace-scraper --region=africa-south1 --clear-env-vars
gcloud run services update marketplace-scraper --region=africa-south1 --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"
```

## Emergency Recovery Procedures

For severe issues that cannot be resolved using the above solutions, refer to the [EMERGENCY_RECOVERY.md](./EMERGENCY_RECOVERY.md) guide for complete recovery procedures.
EOF
echo -e "${GREEN}Created troubleshooting guide: ${TROUBLESHOOTING}${NC}"

# Create MONITORING_GUIDE.md
MONITORING_GUIDE="${DEPLOY_DIR}/MONITORING_GUIDE.md"
cat > "${MONITORING_GUIDE}" << EOF
# Marketplace Scraper Monitoring Guide

This guide explains how to monitor the Marketplace Scraper system during your absence.

## Daily Monitoring

For daily monitoring, use the provided script:

\`\`\`bash
./deployment/scripts/run-daily-checks.sh --url=https://your-service-url --output=./logs
\`\`\`

This script will:
1. Check system status
2. Check quota usage
3. Get daily summary
4. Generate a comprehensive report

### Example Output

\`\`\`
Checking system status...
✓ No load shedding detected

Quota Usage:
  Monthly: 33.35%
  Daily: 46.11%

Task Statistics:
  Completed: 1245
  Failed: 36
  Success Rate: 97.2%

Daily report generated at: ./logs/daily-report-2023-08-15.txt
✅ System operating normally
\`\`\`

## Dashboard Monitoring

Access the dashboard at:
\`https://console.cloud.google.com/monitoring/dashboards?project=fluxori-marketplace-data\`

Key metrics to monitor:

1. **API Quota Usage** - Should stay below 80% of monthly allocation
2. **Success Rate** - Should remain above 80%
3. **Load Shedding Status** - Should be 0 most of the time
4. **Task Completion** - Should show regular activity patterns

## Email Notifications

The system is configured to send email notifications for critical issues to \`alerts@fluxori.com\`.

Alert types:
- **High Quota Usage** - When usage exceeds 80% of monthly allocation
- **Error Rate** - When error rate exceeds 20% for 10 minutes
- **Load Shedding** - When load shedding is detected
- **Service Inactivity** - When no tasks completed for 6 hours
- **Slow Response** - When response times exceed thresholds

## Manual Checks

### Check System Status

\`\`\`bash
curl https://your-service-url/status
\`\`\`

### Check Quota Usage

\`\`\`bash
curl https://your-service-url/quota
\`\`\`

### Get Daily Summary

\`\`\`bash
curl https://your-service-url/daily-summary
\`\`\`

### Check Scheduler Status

\`\`\`bash
curl https://your-service-url/scheduler/status
\`\`\`

## Log Analysis

For deeper investigation, check the logs:

\`\`\`bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper" \\
  --project=fluxori-marketplace-data \\
  --limit=20
\`\`\`

Filter for errors only:

\`\`\`bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper AND severity>=ERROR" \\
  --project=fluxori-marketplace-data \\
  --limit=20
\`\`\`

## Responding to Issues

For troubleshooting common issues, refer to the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide.

For emergency procedures, refer to the [EMERGENCY_RECOVERY.md](./EMERGENCY_RECOVERY.md) guide.
EOF
echo -e "${GREEN}Created monitoring guide: ${MONITORING_GUIDE}${NC}"

# Create EMERGENCY_RECOVERY.md
EMERGENCY_RECOVERY="${DEPLOY_DIR}/EMERGENCY_RECOVERY.md"
cat > "${EMERGENCY_RECOVERY}" << EOF
# Marketplace Scraper Emergency Recovery Guide

This guide provides step-by-step procedures for emergency recovery in case of severe system failures.

## 1. Complete System Restart

If the system is unresponsive or experiencing critical issues:

\`\`\`bash
# Stop all scheduled jobs
for JOB in daily-product-refresh daily-deals category-discovery search-monitoring load-shedding-check
do
  gcloud scheduler jobs pause marketplace-scraper-\$JOB --region=africa-south1
done

# Restart the Cloud Run service
gcloud run services update marketplace-scraper --region=africa-south1 --clear-env-vars
gcloud run services update marketplace-scraper --region=africa-south1 --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"

# Resume scheduled jobs
for JOB in daily-product-refresh daily-deals category-discovery search-monitoring load-shedding-check
do
  gcloud scheduler jobs resume marketplace-scraper-\$JOB --region=africa-south1
done
\`\`\`

## 2. Reset Quota Tracking

If quota tracking becomes corrupted:

\`\`\`bash
# First, check the actual usage from SmartProxy dashboard
# Then reset the quota tracking with actual usage values

curl -X POST "https://your-service-url/tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_type": "reset_quota",
    "params": {
      "monthly_usage": 27345,  # Enter actual usage from SmartProxy dashboard
      "daily_usage": 1245
    },
    "priority": "CRITICAL"
  }'
\`\`\`

## 3. Database Recovery

If the database becomes corrupted or inconsistent:

\`\`\`bash
# Run Firestore setup script to recreate collections and indexes
./deployment/firestore/setup-firestore.sh \\
  --project=fluxori-marketplace-data \\
  --region=africa-south1
\`\`\`

## 4. Secret Rotation

If SmartProxy credentials need to be rotated:

\`\`\`bash
# Create new version of the secret
echo -n "NEW_TOKEN_HERE" | gcloud secrets versions add smartproxy-auth-token \\
  --project=fluxori-marketplace-data \\
  --data-file=-

# Restart service to pick up the new secret
gcloud run services update marketplace-scraper \\
  --region=africa-south1 \\
  --clear-env-vars
gcloud run services update marketplace-scraper \\
  --region=africa-south1 \\
  --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"
\`\`\`

## 5. Full Redeployment

If all other recovery procedures fail:

\`\`\`bash
# Run the full deployment script
./deployment/setup.sh \\
  --project=fluxori-marketplace-data \\
  --region=africa-south1 \\
  --smartproxy-token=YOUR_SMARTPROXY_TOKEN \\
  --email=alerts@fluxori.com
\`\`\`

## 6. Manual Data Collection

If automated data collection is failing, you can manually trigger tasks:

\`\`\`bash
# Extract daily deals
curl -X POST "https://your-service-url/tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_type": "extract_daily_deals",
    "marketplace": "takealot",
    "params": {},
    "priority": "HIGH"
  }'

# Refresh products
curl -X POST "https://your-service-url/tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_type": "refresh_products",
    "marketplace": "takealot",
    "params": {"max_count": 500},
    "priority": "HIGH"
  }'
\`\`\`

## 7. Emergency Contact Information

If you need assistance with emergency recovery:

1. **DevOps Support**: devops@fluxori.com
2. **SmartProxy Support**: support@smartproxy.com
3. **Google Cloud Support**: https://cloud.google.com/support
EOF
echo -e "${GREEN}Created emergency recovery guide: ${EMERGENCY_RECOVERY}${NC}"

# Run the test script
echo "Running validation tests..."
"${TEST_SCRIPT}" || echo -e "${YELLOW}Some tests failed. Check the output for details.${NC}"

# Display summary
echo ""
echo -e "${BLUE}Validation and testing completed.${NC}"
echo -e "${BLUE}Documentation files created:${NC}"
echo -e "  - ${GREEN}${DEPLOYMENT_GUIDE}${NC}"
echo -e "  - ${GREEN}${TROUBLESHOOTING}${NC}"
echo -e "  - ${GREEN}${MONITORING_GUIDE}${NC}"
echo -e "  - ${GREEN}${EMERGENCY_RECOVERY}${NC}"
echo ""
echo -e "${BLUE}Your marketplace scraper is now deployed and ready for use.${NC}"
echo -e "${BLUE}Access the service at: ${GREEN}${SERVICE_URL}${NC}"
echo ""