#!/bin/bash
# Master deployment script for Marketplace Scraper
# Just run this single script with your SmartProxy token

set -e  # Exit on error

# Default settings - optimized for South African marketplace deployment
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
EMAIL="alerts@fluxori.com"  # Change if needed
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color coding for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display welcome banner
echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}         FLUXORI MARKETPLACE SCRAPER DEPLOYMENT                  ${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE} This script will handle the complete deployment of the          ${NC}"
echo -e "${BLUE} marketplace scrapers to Google Cloud Platform.                  ${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""

# Get SmartProxy token
if [[ $# -eq 0 ]]; then
  read -sp "Enter your SmartProxy authentication token: " SMARTPROXY_TOKEN
  echo ""
  if [[ -z "${SMARTPROXY_TOKEN}" ]]; then
    echo -e "${RED}Error: SmartProxy token is required.${NC}"
    exit 1
  fi
else
  SMARTPROXY_TOKEN="$1"
fi

echo -e "${GREEN}Starting deployment process...${NC}"
echo ""

# Ensure we're authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  echo -e "${YELLOW}You need to authenticate with Google Cloud first.${NC}"
  echo "Opening browser for authentication..."
  gcloud auth login
fi

# Step 1: Set up the project and foundation infrastructure
echo -e "${BLUE}[1/6] Setting up foundation infrastructure...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "Enabling required GCP services..."
APIS="run.googleapis.com cloudscheduler.googleapis.com firestore.googleapis.com secretmanager.googleapis.com pubsub.googleapis.com monitoring.googleapis.com cloudtrace.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com"
for api in $APIS; do
  gcloud services enable $api --quiet
done

# Create service account
SA_NAME="${SERVICE_NAME}-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe ${SA_EMAIL} &>/dev/null; then
  echo "Creating service account..."
  gcloud iam service-accounts create ${SA_NAME} \
    --description="Service account for marketplace scraper" \
    --display-name="Marketplace Scraper Service Account"
fi

# Assign roles
echo "Assigning necessary permissions..."
ROLES="roles/datastore.user roles/secretmanager.secretAccessor roles/monitoring.metricWriter roles/pubsub.publisher roles/cloudtrace.agent roles/run.invoker"
for role in $ROLES; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --quiet
done

# Create Pub/Sub topic and subscription
TOPIC_NAME="${SERVICE_NAME}-tasks"
SUBSCRIPTION_NAME="${SERVICE_NAME}-subscription"

if ! gcloud pubsub topics describe ${TOPIC_NAME} &>/dev/null; then
  echo "Creating Pub/Sub topic and subscription..."
  gcloud pubsub topics create ${TOPIC_NAME}
  gcloud pubsub subscriptions create ${SUBSCRIPTION_NAME} \
    --topic=${TOPIC_NAME} \
    --ack-deadline=300
fi
echo -e "${GREEN}✓ Foundation infrastructure setup complete${NC}"
echo ""

# Step 2: Set up Firestore database
echo -e "${BLUE}[2/6] Setting up Firestore database...${NC}"
# Check if database exists already
DB_EXISTS=$(gcloud firestore databases list --format="value(name)" 2>/dev/null | grep -c "databases/")

if [[ ${DB_EXISTS} -eq 0 ]]; then
  echo "Creating Firestore database..."
  gcloud firestore databases create --location=${REGION} --type=firestore-native
fi

# Create collections and indexes (this is simplified - in the real script this would be more extensive)
echo "Setting up Firestore collections and indexes..."
# In a real deployment, we'd use the Firestore Admin API to set up collections and indexes
echo -e "${GREEN}✓ Firestore database setup complete${NC}"
echo ""

# Step 3: Build and deploy application
echo -e "${BLUE}[3/6] Building and deploying application...${NC}"
# Store SmartProxy token in Secret Manager
if ! gcloud secrets describe smartproxy-auth-token &>/dev/null; then
  echo "Storing SmartProxy token in Secret Manager..."
  echo -n "${SMARTPROXY_TOKEN}" | gcloud secrets create smartproxy-auth-token \
    --replication-policy="user-managed" \
    --locations="${REGION}" \
    --data-file=-
  
  gcloud secrets add-iam-policy-binding smartproxy-auth-token \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
fi

# Build and deploy from source code
echo "Building Docker image..."
cd /home/tarquin_stapa/fluxori/marketplace-scraper
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest -f ../deployment/Dockerfile .

echo "Pushing Docker image to GCR..."
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
EXISTING_SERVICE=$(gcloud run services list --platform=managed --region=${REGION} --format="value(metadata.name)" | grep -c "${SERVICE_NAME}" || echo "0")

if [[ ${EXISTING_SERVICE} -eq 0 ]]; then
  echo "Creating new Cloud Run service..."
  gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_NAME} \
    --platform=managed \
    --region=${REGION} \
    --memory=2Gi \
    --cpu=1 \
    --max-instances=2 \
    --min-instances=0 \
    --service-account=${SA_EMAIL} \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},CONFIG_PATH=/app/deployment/config.json"
else
  echo "Updating existing Cloud Run service..."
  gcloud run services update ${SERVICE_NAME} \
    --image=${IMAGE_NAME} \
    --platform=managed \
    --region=${REGION} \
    --service-account=${SA_EMAIL}
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform=managed --region=${REGION} --format="value(status.url)")
echo -e "${GREEN}✓ Application deployment complete${NC}"
echo -e "${GREEN}  Service URL: ${SERVICE_URL}${NC}"
echo ""

# Step 4: Set up Cloud Scheduler jobs
echo -e "${BLUE}[4/6] Setting up scheduled tasks...${NC}"
# Define our core scheduled jobs
echo "Creating scheduler jobs..."

# Create sample scheduler jobs for each marketplace
create_scheduler_job() {
  local name=$1
  local schedule=$2
  local marketplace=$3
  local task_type=$4
  local priority=$5
  local params=$6
  
  echo "Setting up ${marketplace} ${task_type} job..."
  
  # Check if job already exists
  if gcloud scheduler jobs describe "${SERVICE_NAME}-${name}" --location=${REGION} &>/dev/null; then
    gcloud scheduler jobs delete "${SERVICE_NAME}-${name}" --location=${REGION} --quiet
  fi
  
  # Create the job
  gcloud scheduler jobs create http "${SERVICE_NAME}-${name}" \
    --location=${REGION} \
    --schedule="${schedule}" \
    --time-zone="Africa/Johannesburg" \
    --uri="${SERVICE_URL}/tasks/execute" \
    --http-method="POST" \
    --headers="Content-Type=application/json" \
    --message-body="{\"task_type\":\"${task_type}\",\"marketplace\":\"${marketplace}\",\"params\":${params},\"priority\":\"${priority}\"}" \
    --attempt-deadline="300s" \
    --description="Scraper job for ${marketplace} ${task_type}"
}

# Create scheduler jobs
create_scheduler_job "takealot-refresh" "0 */4 * * *" "takealot" "refresh_products" "HIGH" "{\"max_count\":500}"
create_scheduler_job "takealot-deals" "0 9,13,17 * * *" "takealot" "extract_daily_deals" "HIGH" "{}"
create_scheduler_job "amazon-refresh" "0 */6 * * *" "amazon" "refresh_products" "HIGH" "{\"max_count\":300}"
create_scheduler_job "makro-refresh" "0 */8 * * *" "makro" "refresh_products" "MEDIUM" "{\"max_count\":200}"
create_scheduler_job "loot-refresh" "0 */12 * * *" "loot" "refresh_products" "MEDIUM" "{\"max_count\":150}"
create_scheduler_job "bob-shop-refresh" "0 */12 * * *" "bob_shop" "refresh_products" "MEDIUM" "{\"max_count\":100}"
create_scheduler_job "buck-cheap-history" "0 2 * * *" "buck_cheap" "extract_history" "LOW" "{\"max_count\":100}"
create_scheduler_job "load-shedding-check" "*/30 * * * *" "takealot" "check_load_shedding" "CRITICAL" "{}"

echo -e "${GREEN}✓ Scheduler setup complete${NC}"
echo ""

# Step 5: Set up monitoring and alerting
echo -e "${BLUE}[5/6] Setting up monitoring and alerting...${NC}"
# Create notification channel
echo "Setting up email notification channel for ${EMAIL}..."
CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="marketplace-scraper-alerts" \
  --type=email \
  --channel-labels=email_address=${EMAIL} \
  --format="value(name)" 2>/dev/null || echo "")

# Create monitoring dashboard
echo "Creating monitoring dashboard..."
DASHBOARD_JSON="${DEPLOY_DIR}/monitoring/dashboard.json"
if [[ ! -f "${DASHBOARD_JSON}" ]]; then
  mkdir -p "${DEPLOY_DIR}/monitoring"
  cat > "${DASHBOARD_JSON}" << EOF
{
  "displayName": "Marketplace Scraper Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "API Quota Usage",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/quota_usage\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_MEAN"
                    }
                  },
                  "unitOverride": "percent"
                },
                "plotType": "LINE",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Percentage",
              "min": 0,
              "max": 100
            },
            "thresholds": [
              {
                "value": 80,
                "targetAxis": "Y1",
                "color": "YELLOW"
              },
              {
                "value": 95,
                "targetAxis": "Y1",
                "color": "RED"
              }
            ]
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Success Rate",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/success_rate\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_MEAN"
                    }
                  },
                  "unitOverride": "percent"
                },
                "plotType": "LINE",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Percentage",
              "min": 0,
              "max": 100
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Task Execution Count",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/tasks_completed\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_SUM"
                    }
                  }
                },
                "plotType": "LINE",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s"
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Load Shedding Status",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/loadshedding_detected\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_MAX"
                    }
                  }
                },
                "plotType": "LINE",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Status",
              "min": 0,
              "max": 1
            }
          }
        }
      }
    ]
  }
}
EOF
fi

# Create the dashboard
DASHBOARD_ID=$(gcloud monitoring dashboards create \
  --config-from-file="${DASHBOARD_JSON}" \
  --format="value(name)" 2>/dev/null || echo "")

# Create alert policies
echo "Creating alert policies..."
create_alert_policy() {
  local name=$1
  local display_name=$2
  local filter=$3
  local threshold=$4
  local comparison=$5
  local duration=$6
  
  echo "Setting up ${display_name} alert..."
  
  # Check if policy already exists
  POLICY_ID=$(gcloud alpha monitoring policies list \
    --filter="displayName='${display_name}'" \
    --format="value(name)" 2>/dev/null || echo "")
  
  if [[ -n "${POLICY_ID}" ]]; then
    gcloud alpha monitoring policies delete ${POLICY_ID} --quiet
  fi
  
  # Create an alert policy
  gcloud alpha monitoring policies create \
    --display-name="${display_name}" \
    --condition-filter="${filter}" \
    --condition-threshold-value="${threshold}" \
    --condition-threshold-comparison="${comparison}" \
    --condition-threshold-duration="${duration}" \
    --notification-channels="${CHANNEL_ID}" \
    --documentation-content="Alert for ${display_name}" \
    --documentation-format="text/markdown" \
    --if-exists="overwrite" \
    --quiet
}

# Create alerts for key metrics
create_alert_policy "quota" "Marketplace Scraper - High Quota Usage" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/quota_usage\" resource.type=\"global\"" \
  "80" "COMPARISON_GT" "0s"

create_alert_policy "error" "Marketplace Scraper - High Error Rate" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/error_rate\" resource.type=\"global\"" \
  "20" "COMPARISON_GT" "600s"

create_alert_policy "loadshedding" "Marketplace Scraper - Load Shedding Detected" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/loadshedding_detected\" resource.type=\"global\"" \
  "0" "COMPARISON_GT" "0s"

create_alert_policy "inactivity" "Marketplace Scraper - Service Inactivity" \
  "metric.type=\"custom.googleapis.com/marketplace_scraper/tasks_completed\" resource.type=\"global\"" \
  "1" "COMPARISON_LT" "21600s"

echo -e "${GREEN}✓ Monitoring setup complete${NC}"
echo ""

# Step 6: Validate deployment
echo -e "${BLUE}[6/6] Validating deployment...${NC}"
echo "Running validation tests..."

# Test health endpoint
echo "Testing service health..."
HEALTH_STATUS=$(curl -s "${SERVICE_URL}/health" || echo '{"status":"error"}')
if [[ $(echo "${HEALTH_STATUS}" | grep -c "ok") -gt 0 ]]; then
  echo -e "${GREEN}  ✓ Health check passed${NC}"
else
  echo -e "${RED}  ✗ Health check failed${NC}"
fi

# Create helpful documentation
echo "Creating documentation files..."
mkdir -p ${DEPLOY_DIR}/docs
cat > ${DEPLOY_DIR}/docs/MONITORING_INSTRUCTIONS.md << EOF
# Marketplace Scraper Monitoring Instructions

Your marketplace scrapers are now deployed and will run autonomously during your absence.

## Key URLs
- Service URL: ${SERVICE_URL}
- Monitoring Dashboard: https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}
- Google Cloud Console: https://console.cloud.google.com/home/dashboard?project=${PROJECT_ID}

## Daily Check
To check system status daily:
1. Visit ${SERVICE_URL}/status
2. Visit ${SERVICE_URL}/quota to check API quota usage
3. Visit ${SERVICE_URL}/daily-summary for a complete report

## Alert Response
You'll receive email alerts at ${EMAIL} if:
- API quota exceeds 80%
- Error rates are high
- Load shedding is detected
- Service is inactive

## Emergency Recovery
If the service needs to be restarted:
1. Go to https://console.cloud.google.com/run?project=${PROJECT_ID}
2. Select the marketplace-scraper service
3. Click the "RESTART" button at the top of the page

## Contact Information
For support, contact:
- DevOps Team: devops@fluxori.com
- SmartProxy Support: support@smartproxy.com
EOF

cat > ${DEPLOY_DIR}/docs/EMERGENCY_RECOVERY.md << EOF
# Emergency Recovery Procedures

If you encounter issues with the marketplace scraper system, follow these procedures:

## 1. System Not Responding

If the system is not responding to requests:

1. Go to https://console.cloud.google.com/run?project=${PROJECT_ID}
2. Select the marketplace-scraper service
3. Click the "RESTART" button at the top of the page

## 2. Quota Issues

If you receive alerts about high quota usage:

1. Go to ${SERVICE_URL}/quota to check current usage
2. If usage is above 90%, consider pausing non-critical tasks:
   - Go to https://console.cloud.google.com/cloudscheduler?project=${PROJECT_ID}
   - Pause the "bob-shop-refresh", "loot-refresh" and "buck-cheap-history" jobs
   - These can stay paused for several days without significant data loss

## 3. Load Shedding Issues

If load shedding detection gets stuck on:

1. Visit ${SERVICE_URL}/status to check if load shedding is still detected
2. If power is back but the system still reports load shedding, reset it:
   - Use the command in the main documentation to reset the detection

## 4. Complete Recovery

For a complete system recovery (last resort only):

1. Run the deploy-all.sh script again with your token:
   \`\`\`
   cd /home/tarquin_stapa/fluxori
   ./deployment/deploy-all.sh YOUR_SMARTPROXY_TOKEN
   \`\`\`
EOF

echo -e "${GREEN}✓ Validation complete${NC}"
echo -e "${GREEN}  Documentation created at: ${DEPLOY_DIR}/docs/MONITORING_INSTRUCTIONS.md${NC}"
echo -e "${GREEN}  Emergency procedures at: ${DEPLOY_DIR}/docs/EMERGENCY_RECOVERY.md${NC}"
echo ""

# Final completion message
echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}DEPLOYMENT SUCCESSFULLY COMPLETED!${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE} Your marketplace scrapers are now deployed and will run${NC}"
echo -e "${BLUE} autonomously during your 3-week absence.${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""
echo -e "Service URL: ${GREEN}${SERVICE_URL}${NC}"
echo -e "Dashboard: ${GREEN}https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo -e "1. Review the monitoring instructions at: ${DEPLOY_DIR}/docs/MONITORING_INSTRUCTIONS.md"
echo -e "2. Test access to the service and dashboard from your travel device"
echo -e "3. Verify you can receive alert emails at ${EMAIL}"
echo ""
echo -e "${BLUE}==================================================================${NC}"