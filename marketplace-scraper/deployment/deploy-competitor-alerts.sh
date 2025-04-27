#!/bin/bash
#
# Deployment script for competitor alerts integration
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Starting deployment of competitor alerts integration..."

# 1. Backup current code
echo "Creating backup of current marketplace scraper code..."
BACKUP_DIR="../backups/$(date +%Y%m%d_%H%M%S)_pre_competitor_alerts"
mkdir -p "$BACKUP_DIR"
cp -r ../src "$BACKUP_DIR/"
cp -r ../test_*.py "$BACKUP_DIR/"

# 2. Upload new files to GCP bucket
echo "Uploading updated code to GCP Storage..."
gsutil cp ../src/common/alert_integration.py gs://fluxori-marketplace-scraper/src/common/
gsutil cp ../src/orchestration/ranking_orchestrator.py gs://fluxori-marketplace-scraper/src/orchestration/
gsutil cp ../test_alert_integration.py gs://fluxori-marketplace-scraper/tests/
gsutil cp ../test_alert_ranking_integration.py gs://fluxori-marketplace-scraper/tests/

# 3. Update Cloud Run service
echo "Updating Cloud Run service..."
gcloud run services update marketplace-scraper \
  --source gs://fluxori-marketplace-scraper \
  --region europe-west1 \
  --platform managed

# 4. Create competitor alert monitoring
echo "Setting up alert monitoring dashboard..."
gcloud monitoring dashboards create \
  --config-from-file=monitoring/competitor_alerts_dashboard.json

# 5. Update alert policies
echo "Updating alert policies..."
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring/competitor_alert_policies.yaml

# 6. Validation
echo "Running validation tests..."
CLOUD_RUN_URL=$(gcloud run services describe marketplace-scraper --region europe-west1 --format='value(status.url)')
VALIDATION_RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD_RUN_URL/healthcheck")

if [ "$VALIDATION_RESULT" == "200" ]; then
  echo "Validation successful. Competitor alerts system is deployed and working."
else
  echo "WARNING: Validation failed. Please check the logs and fix any issues."
  exit 1
fi

echo "Deployment completed successfully!"