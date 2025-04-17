#!/bin/bash
# Master setup script for the Marketplace Scraper Deployment
# This script orchestrates the entire deployment process across 6 phases

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHASE=""
SMARTPROXY_TOKEN=""
NOTIFICATION_EMAIL="alerts@fluxori.com"
START_PHASE=1
END_PHASE=6
MEMORY="2Gi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="2"

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
    --smartproxy-token)
      SMARTPROXY_TOKEN="$2"
      shift
      shift
      ;;
    --email)
      NOTIFICATION_EMAIL="$2"
      shift
      shift
      ;;
    --phase)
      PHASE="$2"
      shift
      shift
      ;;
    --start-phase)
      START_PHASE="$2"
      shift
      shift
      ;;
    --end-phase)
      END_PHASE="$2"
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
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID        Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --region REGION             Google Cloud region (default: ${REGION})"
      echo "  --service SERVICE_NAME      Cloud Run service name (default: ${SERVICE_NAME})"
      echo "  --smartproxy-token TOKEN    SmartProxy auth token"
      echo "  --email EMAIL               Notification email (default: ${NOTIFICATION_EMAIL})"
      echo "  --phase PHASE_NUMBER        Run a specific phase (1-6)"
      echo "  --start-phase PHASE_NUMBER  Start from a specific phase (default: 1)"
      echo "  --end-phase PHASE_NUMBER    End at a specific phase (default: 6)"
      echo "  --memory MEMORY             Memory allocation for Cloud Run (default: ${MEMORY})"
      echo "  --cpu CPU                   CPU allocation for Cloud Run (default: ${CPU})"
      echo "  --min-instances NUMBER      Minimum instances for Cloud Run (default: ${MIN_INSTANCES})"
      echo "  --max-instances NUMBER      Maximum instances for Cloud Run (default: ${MAX_INSTANCES})"
      echo "  --help                      Show this help message"
      echo ""
      echo "Phases:"
      echo "  1: Foundation Infrastructure - Project and IAM Setup"
      echo "  2: Database Setup - Firestore Configuration"
      echo "  3: Application Deployment - Container Build and Cloud Run"
      echo "  4: Scheduler Setup - Cloud Scheduler Jobs"
      echo "  5: Monitoring Setup - Dashboard and Alerts"
      echo "  6: Validation and Testing - Verification Steps"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Display banner
echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}         MARKETPLACE SCRAPER DEPLOYMENT - FLUXORI PLATFORM${NC}"
echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}  Project ID:       ${GREEN}${PROJECT_ID}${NC}"
echo -e "${BLUE}  Region:           ${GREEN}${REGION}${NC}"
echo -e "${BLUE}  Service Name:     ${GREEN}${SERVICE_NAME}${NC}"
echo -e "${BLUE}  Deployment Dir:   ${GREEN}${DEPLOY_DIR}${NC}"
echo -e "${BLUE}=====================================================================${NC}"
echo ""

# Check if Google Cloud SDK is installed
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}Error: Google Cloud SDK is not installed or not in PATH.${NC}"
  echo "Please install the Google Cloud SDK and try again."
  exit 1
fi

# Ensure we're authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  echo -e "${YELLOW}You need to authenticate with Google Cloud.${NC}"
  gcloud auth login
fi

# Set the Google Cloud project
echo "Setting Google Cloud project to: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

# Function to check if a phase should be executed
should_execute_phase() {
  local phase_num=$1
  
  if [[ -n "${PHASE}" ]]; then
    [[ "${PHASE}" == "${phase_num}" ]]
  else
    [[ "${phase_num}" -ge "${START_PHASE}" && "${phase_num}" -le "${END_PHASE}" ]]
  fi
}

# Function to run a deployment phase
run_phase() {
  local phase_num=$1
  local phase_name=$2
  local phase_script=$3
  
  if should_execute_phase ${phase_num}; then
    echo -e "${BLUE}=====================================================================${NC}"
    echo -e "${GREEN}PHASE ${phase_num}: ${phase_name}${NC}"
    echo -e "${BLUE}=====================================================================${NC}"
    
    # Make sure the phase script exists
    if [[ ! -f "${phase_script}" ]]; then
      echo -e "${RED}Error: Phase script not found: ${phase_script}${NC}"
      exit 1
    fi
    
    # Make the script executable
    chmod +x "${phase_script}"
    
    # Execute the phase script with arguments
    "${phase_script}" \
      --project="${PROJECT_ID}" \
      --region="${REGION}" \
      --service="${SERVICE_NAME}" \
      --notification-email="${NOTIFICATION_EMAIL}" \
      --memory="${MEMORY}" \
      --cpu="${CPU}" \
      --min-instances="${MIN_INSTANCES}" \
      --max-instances="${MAX_INSTANCES}"
    
    if [[ $? -ne 0 ]]; then
      echo -e "${RED}Phase ${phase_num} (${phase_name}) failed.${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}Phase ${phase_num} (${phase_name}) completed successfully.${NC}"
    echo ""
  else
    echo -e "${YELLOW}Skipping Phase ${phase_num}: ${phase_name}${NC}"
    echo ""
  fi
}

# Run each deployment phase
run_phase 1 "Foundation Infrastructure" "${DEPLOY_DIR}/phase1_foundation.sh"
run_phase 2 "Database Setup" "${DEPLOY_DIR}/phase2_database.sh"
run_phase 3 "Application Deployment" "${DEPLOY_DIR}/phase3_application.sh"
run_phase 4 "Scheduler Setup" "${DEPLOY_DIR}/phase4_scheduler.sh"
run_phase 5 "Monitoring Setup" "${DEPLOY_DIR}/phase5_monitoring.sh"
run_phase 6 "Validation and Testing" "${DEPLOY_DIR}/phase6_validation.sh"

# Final status
if should_execute_phase 6; then
  echo -e "${BLUE}=====================================================================${NC}"
  echo -e "${GREEN}DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
  echo -e "${BLUE}=====================================================================${NC}"
  echo ""
  echo -e "${BLUE}Your marketplace scraper is now deployed and running.${NC}"
  echo ""
  echo -e "${BLUE}Service URL:${NC} https://${SERVICE_NAME}-[HASH]-uc.a.run.app"
  echo -e "${BLUE}Dashboard:${NC} https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}"
  echo -e "${BLUE}Firestore:${NC} https://console.cloud.google.com/firestore/data?project=${PROJECT_ID}"
  echo ""
  echo -e "${BLUE}To monitor your system during your absence:${NC}"
  echo "  1. Use the daily tasks script: ${DEPLOY_DIR}/scripts/run-daily-checks.sh"
  echo "  2. Check your email for alerts at: ${NOTIFICATION_EMAIL}"
  echo "  3. View the dashboard in Google Cloud Console"
  echo ""
  echo -e "${BLUE}For troubleshooting, refer to:${NC}"
  echo "  - ${DEPLOY_DIR}/TROUBLESHOOTING.md"
  echo "  - ${DEPLOY_DIR}/EMERGENCY_RECOVERY.md"
  echo ""
  echo -e "${YELLOW}Note: The system is configured to run autonomously for 3+ weeks.${NC}"
  echo -e "${YELLOW}The quota management system will ensure you stay within your 82K monthly limit.${NC}"
  echo -e "${BLUE}=====================================================================${NC}"
fi