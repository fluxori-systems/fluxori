#!/bin/bash
# Script to apply Service Level Objectives (SLOs) to the Fluxori platform

set -e

# Check if required environment variables are set
if [ -z "$GCP_PROJECT_ID" ]; then
  echo "Error: GCP_PROJECT_ID environment variable must be set."
  exit 1
fi

if [ -z "$REGION" ]; then
  REGION="africa-south1"
  echo "Using default region: $REGION"
fi

echo "=== Applying SLOs for Fluxori Platform ==="
echo "Project: $GCP_PROJECT_ID"
echo "Region: $REGION"
echo "==============================================="

# Ensure gcloud is authorized
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
  echo "Error: Not authenticated with Google Cloud. Please run 'gcloud auth login' first."
  exit 1
fi

# Set the current project
gcloud config set project $GCP_PROJECT_ID

# Create custom metrics for SLOs if they don't exist
echo "Creating custom metrics for SLOs..."

# AI Insight Generation Time metric
cat > /tmp/ai-insight-metric.json << EOF
{
  "name": "projects/$GCP_PROJECT_ID/metricDescriptors/logging.googleapis.com/user/ai_insight_generation_time",
  "description": "Time taken to generate AI insights",
  "metricKind": "DELTA",
  "valueType": "DISTRIBUTION",
  "unit": "ms",
  "labels": [
    {
      "key": "insight_type",
      "description": "Type of insight generated"
    },
    {
      "key": "model_id",
      "description": "AI model used for generation"
    }
  ]
}
EOF

gcloud logging metrics create ai_insight_generation_time \
  --description="Time taken to generate AI insights" \
  --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"fluxori-backend\" AND jsonPayload.message=~\"Insight generation completed\"" \
  --value-extractor="EXTRACT(jsonPayload.duration_ms)" \
  --bucket-options=exponential-buckets-options,growth-factor=2,num-finite-buckets=64,scale=25 \
  --metric-descriptor=/tmp/ai-insight-metric.json \
  || echo "AI insight metric already exists or failed to create"

# Order Processing Count metric
cat > /tmp/order-processing-metric.json << EOF
{
  "name": "projects/$GCP_PROJECT_ID/metricDescriptors/logging.googleapis.com/user/order_processing_count",
  "description": "Count of orders processed",
  "metricKind": "DELTA",
  "valueType": "INT64",
  "unit": "1",
  "labels": [
    {
      "key": "status",
      "description": "Status of order processing (success, failed)"
    },
    {
      "key": "source",
      "description": "Source of the order"
    }
  ]
}
EOF

gcloud logging metrics create order_processing_count \
  --description="Count of orders processed" \
  --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"fluxori-backend\" AND jsonPayload.message=~\"Order processing\"" \
  --value-extractor="EXTRACT(jsonPayload.order_count)" \
  --metric-descriptor=/tmp/order-processing-metric.json \
  || echo "Order processing metric already exists or failed to create"

# Apply SLOs from the YAML file
echo "Applying SLOs from slo-definitions.yaml..."

# Function to create an SLO
create_slo() {
  SERVICE=$1
  DISPLAY_NAME=$2
  GOAL=$3
  ROLLING_PERIOD=$4
  SLI_TYPE=$5
  SLI_FILTER=$6
  
  # Check if SLO already exists
  EXISTING_SLO=$(gcloud alpha monitoring slos list \
    --service=$SERVICE \
    --filter="displayName=$DISPLAY_NAME" \
    --format="value(name)" \
    --project=$GCP_PROJECT_ID 2>/dev/null || echo "")
  
  if [ -n "$EXISTING_SLO" ]; then
    echo "SLO '$DISPLAY_NAME' already exists, updating..."
    
    # Update existing SLO
    if [ "$SLI_TYPE" == "requestBased.goodTotalRatio" ]; then
      # Parse the filters
      TOTAL_FILTER=$(echo "$SLI_FILTER" | grep -oP 'totalServiceFilter: \K.*' | sed 's/goodServiceFilter:.*//')
      GOOD_FILTER=$(echo "$SLI_FILTER" | grep -oP 'goodServiceFilter: \K.*')
      
      gcloud alpha monitoring slos update $EXISTING_SLO \
        --service=$SERVICE \
        --goal=$GOAL \
        --rolling-period=$ROLLING_PERIOD \
        --request-based \
        --good-total-ratio \
        --total-service-filter="$TOTAL_FILTER" \
        --good-service-filter="$GOOD_FILTER" \
        --project=$GCP_PROJECT_ID
    elif [ "$SLI_TYPE" == "requestBased.distributionCut" ]; then
      # Parse the filter and range
      DISTRIBUTION_FILTER=$(echo "$SLI_FILTER" | grep -oP 'distributionFilter: \K.*' | sed 's/range:.*//')
      MIN_RANGE=$(echo "$SLI_FILTER" | grep -oP 'min: \K[0-9]+')
      MAX_RANGE=$(echo "$SLI_FILTER" | grep -oP 'max: \K[0-9]+')
      
      gcloud alpha monitoring slos update $EXISTING_SLO \
        --service=$SERVICE \
        --goal=$GOAL \
        --rolling-period=$ROLLING_PERIOD \
        --request-based \
        --distribution-cut \
        --distribution-filter="$DISTRIBUTION_FILTER" \
        --range-min=$MIN_RANGE \
        --range-max=$MAX_RANGE \
        --project=$GCP_PROJECT_ID
    fi
  else
    echo "Creating new SLO '$DISPLAY_NAME'..."
    
    # Create new SLO
    if [ "$SLI_TYPE" == "requestBased.goodTotalRatio" ]; then
      # Parse the filters
      TOTAL_FILTER=$(echo "$SLI_FILTER" | grep -oP 'totalServiceFilter: \K.*' | sed 's/goodServiceFilter:.*//')
      GOOD_FILTER=$(echo "$SLI_FILTER" | grep -oP 'goodServiceFilter: \K.*')
      
      gcloud alpha monitoring slos create \
        --service=$SERVICE \
        --display-name="$DISPLAY_NAME" \
        --goal=$GOAL \
        --rolling-period=$ROLLING_PERIOD \
        --request-based \
        --good-total-ratio \
        --total-service-filter="$TOTAL_FILTER" \
        --good-service-filter="$GOOD_FILTER" \
        --project=$GCP_PROJECT_ID
    elif [ "$SLI_TYPE" == "requestBased.distributionCut" ]; then
      # Parse the filter and range
      DISTRIBUTION_FILTER=$(echo "$SLI_FILTER" | grep -oP 'distributionFilter: \K.*' | sed 's/range:.*//')
      MIN_RANGE=$(echo "$SLI_FILTER" | grep -oP 'min: \K[0-9]+')
      MAX_RANGE=$(echo "$SLI_FILTER" | grep -oP 'max: \K[0-9]+')
      
      gcloud alpha monitoring slos create \
        --service=$SERVICE \
        --display-name="$DISPLAY_NAME" \
        --goal=$GOAL \
        --rolling-period=$ROLLING_PERIOD \
        --request-based \
        --distribution-cut \
        --distribution-filter="$DISTRIBUTION_FILTER" \
        --range-min=$MIN_RANGE \
        --range-max=$MAX_RANGE \
        --project=$GCP_PROJECT_ID
    fi
  fi
}

# Parse the YAML file and create SLOs
echo "Processing SLO definitions..."

# Using yq would be ideal here, but for simplicity we'll use grep and sed
SLO_FILE="./slo-definitions.yaml"

# Get all service blocks
SERVICE_BLOCKS=$(grep -n "^- service:" $SLO_FILE | cut -d: -f1)

# Process each service block
PREV_LINE=0
for LINE in $SERVICE_BLOCKS $(wc -l < $SLO_FILE); do
  if [ $PREV_LINE -ne 0 ]; then
    # Extract the block between PREV_LINE and LINE-1
    SLO_BLOCK=$(sed -n "${PREV_LINE},${LINE}p" $SLO_FILE)
    
    # Extract values from the block
    SERVICE=$(echo "$SLO_BLOCK" | grep "service:" | head -1 | sed 's/.*service: *//' | tr -d '"')
    DISPLAY_NAME=$(echo "$SLO_BLOCK" | grep "displayName:" | head -1 | sed 's/.*displayName: *//' | tr -d '"')
    GOAL=$(echo "$SLO_BLOCK" | grep "goal:" | head -1 | sed 's/.*goal: *//')
    ROLLING_PERIOD=$(echo "$SLO_BLOCK" | grep "rollingPeriod:" | head -1 | sed 's/.*rollingPeriod: *//')
    
    # Determine SLI type and extract the filter
    if echo "$SLO_BLOCK" | grep -q "goodTotalRatio:"; then
      SLI_TYPE="requestBased.goodTotalRatio"
      SLI_FILTER=$(echo "$SLO_BLOCK" | grep -A10 "goodTotalRatio:" | grep -e "totalServiceFilter:" -e "goodServiceFilter:")
    elif echo "$SLO_BLOCK" | grep -q "distributionCut:"; then
      SLI_TYPE="requestBased.distributionCut"
      SLI_FILTER=$(echo "$SLO_BLOCK" | grep -A10 "distributionCut:" | grep -e "distributionFilter:" -e "min:" -e "max:")
    else
      echo "Unsupported SLI type in block starting at line $PREV_LINE"
      continue
    fi
    
    # Create or update the SLO
    create_slo "$SERVICE" "$DISPLAY_NAME" "$GOAL" "$ROLLING_PERIOD" "$SLI_TYPE" "$SLI_FILTER"
  fi
  
  PREV_LINE=$LINE
done

echo "SLO application complete!"

# Create alerts for SLOs
echo "Creating alerts for SLOs..."

# First, create a notification channel if it doesn't exist
NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL:-"alerts@fluxori.com"}
SLACK_CHANNEL=${SLACK_CHANNEL:-"fluxori-alerts"}

EMAIL_CHANNEL=$(gcloud alpha monitoring channels list \
  --filter="type=email AND labels.email_address=$NOTIFICATION_EMAIL" \
  --format="value(name)" \
  --project=$GCP_PROJECT_ID)

if [ -z "$EMAIL_CHANNEL" ]; then
  echo "Creating email notification channel..."
  EMAIL_CHANNEL=$(gcloud alpha monitoring channels create \
    --display-name="Fluxori Alerts Email" \
    --type=email \
    --channel-labels=email_address=$NOTIFICATION_EMAIL \
    --project=$GCP_PROJECT_ID \
    --format="value(name)")
fi

SLACK_CHANNEL_ID=$(gcloud alpha monitoring channels list \
  --filter="type=slack AND labels.channel_name=$SLACK_CHANNEL" \
  --format="value(name)" \
  --project=$GCP_PROJECT_ID)

if [ -z "$SLACK_CHANNEL_ID" ]; then
  echo "Slack channel notification requires manual setup. Please configure in the Google Cloud Console."
fi

# Create an alert policy for all SLOs
echo "Creating SLO violation alert policy..."

# List all SLOs to include in the alert
SLO_LIST=$(gcloud alpha monitoring slos list \
  --project=$GCP_PROJECT_ID \
  --format="value(name)")

# Create condition for each SLO
CONDITION_COUNT=0
CONDITIONS=""

for SLO in $SLO_LIST; do
  SLO_NAME=$(echo $SLO | sed 's|.*/||')
  SERVICE_NAME=$(echo $SLO | sed 's|.*/services/\(.*\)/serviceLevelObjectives.*|\1|')
  DISPLAY_NAME=$(gcloud alpha monitoring slos describe $SLO_NAME \
    --service=$SERVICE_NAME \
    --project=$GCP_PROJECT_ID \
    --format="value(displayName)")
  
  if [ $CONDITION_COUNT -eq 0 ]; then
    CONDITIONS="conditions { display_name: \"$DISPLAY_NAME SLO Violation\" condition_threshold { filter: \"select_slo_burn_rate($SLO, '1h')\" comparison: COMPARISON_GT threshold_value: 3 duration: { seconds: 300 } trigger: { count: 1 } aggregations { alignment_period: { seconds: 300 } per_series_aligner: ALIGN_MEAN } } }"
  else
    CONDITIONS="$CONDITIONS conditions { display_name: \"$DISPLAY_NAME SLO Violation\" condition_threshold { filter: \"select_slo_burn_rate($SLO, '1h')\" comparison: COMPARISON_GT threshold_value: 3 duration: { seconds: 300 } trigger: { count: 1 } aggregations { alignment_period: { seconds: 300 } per_series_aligner: ALIGN_MEAN } } }"
  fi
  
  CONDITION_COUNT=$((CONDITION_COUNT + 1))
done

# Create the alert policy
cat > /tmp/slo-alert-policy.json << EOF
{
  "displayName": "Fluxori SLO Violations",
  "combiner": "OR",
  $CONDITIONS,
  "alertStrategy": {
    "autoClose": "604800s",
    "notificationRateLimit": {
      "period": "300s"
    }
  },
  "notifications": [
    {
      "channel": "$EMAIL_CHANNEL"
    }
  ],
  "documentation": {
    "content": "This alert fires when an SLO is being burned too quickly, indicating that we may miss our service level objective if the issue is not addressed promptly.",
    "mimeType": "text/markdown"
  }
}
EOF

# Check if the alert policy already exists
EXISTING_POLICY=$(gcloud alpha monitoring policies list \
  --filter="displayName='Fluxori SLO Violations'" \
  --format="value(name)" \
  --project=$GCP_PROJECT_ID)

if [ -n "$EXISTING_POLICY" ]; then
  echo "Updating existing SLO alert policy..."
  gcloud alpha monitoring policies update $EXISTING_POLICY \
    --policy-from-file=/tmp/slo-alert-policy.json \
    --project=$GCP_PROJECT_ID
else
  echo "Creating new SLO alert policy..."
  gcloud alpha monitoring policies create \
    --policy-from-file=/tmp/slo-alert-policy.json \
    --project=$GCP_PROJECT_ID
fi

echo "SLO alert policy created/updated!"
echo "SLO setup complete for project: $GCP_PROJECT_ID"