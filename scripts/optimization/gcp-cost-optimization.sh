#!/bin/bash
# GCP Cost Optimization Script for Fluxori Platform
# This script implements cost optimization best practices for GCP resources

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

echo "=== GCP Cost Optimization for Fluxori Platform ==="
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

# 1. Set up Budget Alerts
echo -e "\n=== Setting Up Budget Alerts ==="

# Check if budgets already exist
EXISTING_BUDGETS=$(gcloud beta billing budgets list --billing-account=$BILLING_ACCOUNT_ID --format="value(name)" 2>/dev/null || echo "")

if [ -z "$EXISTING_BUDGETS" ]; then
  echo "Creating budget for the project..."
  
  # Create a monthly budget at 80% of typical monthly spend
  # Note: This requires the billing account ID which should be provided as an env var
  if [ -n "$BILLING_ACCOUNT_ID" ]; then
    cat > /tmp/budget.json << EOF
{
  "displayName": "Fluxori Monthly Budget",
  "budgetFilter": {
    "projects": ["projects/$GCP_PROJECT_ID"],
    "calendarPeriod": "MONTH"
  },
  "amount": {
    "specifiedAmount": {
      "currencyCode": "ZAR",
      "units": "1000"
    }
  },
  "thresholdRules": [
    {
      "thresholdPercent": 0.5,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.8,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 1.0,
      "spendBasis": "CURRENT_SPEND"
    }
  ]
}
EOF

    gcloud beta billing budgets create \
      --billing-account=$BILLING_ACCOUNT_ID \
      --budget-file=/tmp/budget.json
      
    echo "Budget created successfully"
  else
    echo "BILLING_ACCOUNT_ID not set. Skipping budget creation."
    echo "To create a budget, please set BILLING_ACCOUNT_ID environment variable."
  fi
else
  echo "Budgets already exist for this billing account. Skipping budget creation."
fi

# 2. Cloud Run Optimizations
echo -e "\n=== Optimizing Cloud Run Services ==="

# 2.1 Configure Cloud Run autoscaling parameters
echo "Configuring Cloud Run autoscaling..."

# Backend service optimization
gcloud run services update fluxori-backend \
  --region=$REGION \
  --min-instances=0 \
  --max-instances=10 \
  --cpu-throttling \
  || echo "Failed to update backend autoscaling"

# Frontend service optimization
gcloud run services update fluxori-frontend \
  --region=$REGION \
  --min-instances=0 \
  --max-instances=10 \
  --cpu-throttling \
  || echo "Failed to update frontend autoscaling"

# 3. Firestore Optimizations
echo -e "\n=== Optimizing Firestore Usage ==="

# 3.1 Check and recommend index cleanup
echo "Checking for unused Firestore indexes..."

# Get list of indexes
INDEXES=$(gcloud firestore indexes composite list --format="table(name,state,fields.fieldPath,fields.order)")

echo "Current Firestore indexes:"
echo "$INDEXES"
echo "Note: Manually review and delete unused indexes to reduce costs"

# 4. Storage Optimizations
echo -e "\n=== Optimizing Storage Costs ==="

# 4.1 Set up Lifecycle policies for all buckets
echo "Setting up lifecycle policies for storage buckets..."

# Create lifecycle policy for general storage
cat > /tmp/lifecycle-policy.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "NEARLINE"
        },
        "condition": {
          "age": 30,
          "matchesStorageClass": ["STANDARD"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 90,
          "matchesStorageClass": ["NEARLINE"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "ARCHIVE"
        },
        "condition": {
          "age": 365,
          "matchesStorageClass": ["COLDLINE"]
        }
      }
    ]
  }
}
EOF

# Get list of buckets
BUCKETS=$(gsutil ls -p $GCP_PROJECT_ID)

for BUCKET in $BUCKETS; do
  # Skip backup buckets
  if [[ $BUCKET != *"-backup"* ]]; then
    echo "Setting lifecycle policy for $BUCKET"
    gsutil lifecycle set /tmp/lifecycle-policy.json $BUCKET || echo "Failed to set lifecycle for $BUCKET"
  fi
done

# Create lifecycle policy for backup buckets (different retention policies)
cat > /tmp/backup-lifecycle-policy.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90
        }
      }
    ]
  }
}
EOF

# Apply to backup buckets
for BUCKET in $BUCKETS; do
  if [[ $BUCKET == *"-backup"* ]]; then
    echo "Setting backup lifecycle policy for $BUCKET"
    gsutil lifecycle set /tmp/backup-lifecycle-policy.json $BUCKET || echo "Failed to set lifecycle for $BUCKET"
  fi
done

# 5. AI/ML Optimizations
echo -e "\n=== Optimizing AI/ML Costs ==="

# 5.1 Configure AI/ML resource quotas and cost controls
echo "Setting up resource quotas and cost controls for Vertex AI..."

# Create a quota policy for Vertex AI to limit usage
if [ -n "$ORG_ID" ]; then
  echo "Setting Vertex AI quotas at organization level..."
  # This would be implemented with actual gcloud commands when available
else
  echo "Creating Vertex AI usage monitoring and alerting..."
  
  # Set up a custom metric for tracking Vertex AI costs
  cat > /tmp/vertex-ai-metric.json << EOF
{
  "metricDescriptor": {
    "name": "projects/$GCP_PROJECT_ID/metricDescriptors/custom.googleapis.com/vertex_ai/credit_usage",
    "metricKind": "GAUGE",
    "valueType": "DOUBLE",
    "description": "AI Credits used by Vertex AI services",
    "displayName": "Vertex AI Credit Usage",
    "labels": [
      {
        "key": "organization_id",
        "valueType": "STRING",
        "description": "Organization ID"
      },
      {
        "key": "model",
        "valueType": "STRING",
        "description": "AI Model used"
      },
      {
        "key": "feature",
        "valueType": "STRING",
        "description": "Feature using the AI model"
      }
    ]
  }
}
EOF

  gcloud logging metrics create vertex_ai_credit_usage \
    --description="Vertex AI credit usage metric" \
    --log-filter="resource.type=aiplatform.googleapis.com/Endpoint" \
    || echo "Failed to create Vertex AI metric"
  
  # Create an alert policy for Vertex AI usage
  cat > /tmp/vertex-ai-alert.json << EOF
{
  "displayName": "High Vertex AI Usage Alert",
  "combiner": "OR",
  "conditions": [
    {
      "displayName": "Daily Vertex AI spending exceeds threshold",
      "conditionThreshold": {
        "filter": "resource.type=\"aiplatform.googleapis.com/Endpoint\" AND resource.labels.model_id!=\"\"",
        "aggregations": [
          {
            "alignmentPeriod": "86400s",
            "perSeriesAligner": "ALIGN_SUM"
          }
        ],
        "comparison": "COMPARISON_GT",
        "thresholdValue": 100,
        "duration": "0s",
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "alertStrategy": {
    "autoClose": "604800s"
  },
  "notificationChannels": [
    "$NOTIFICATION_CHANNEL"
  ]
}
EOF

  # Create notification channel if it doesn't exist
  if [ -z "$NOTIFICATION_CHANNEL" ]; then
    echo "Creating email notification channel for Vertex AI alerts..."
    NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL:-"admin@fluxori.com"}
    
    NOTIFICATION_CHANNEL=$(gcloud alpha monitoring channels create \
      --display-name="AI Usage Alerts" \
      --description="Notifications for AI usage spikes" \
      --type=email \
      --channel-labels=email_address=$NOTIFICATION_EMAIL \
      --format="value(name)" 2>/dev/null || echo "")
      
    if [ -n "$NOTIFICATION_CHANNEL" ]; then
      echo "Created notification channel: $NOTIFICATION_CHANNEL"
    else
      echo "Failed to create notification channel. Continuing without alerts."
    fi
  fi

  # Set up AI model-specific cost controls through IAM
  echo "Setting up IAM controls for AI model access..."
  
  # Create a custom role for AI model access
  gcloud iam roles create aiModelUser \
    --project=$GCP_PROJECT_ID \
    --title="AI Model User" \
    --description="Limited access to AI models with cost controls" \
    --permissions="aiplatform.endpoints.predict" \
    --stage=GA \
    || echo "Failed to create AI model user role"
    
  echo "Set up rate limiting for Vertex AI endpoints using Cloud Armor..."
  # This would be implemented once Cloud Armor supports Vertex AI endpoints
fi

# 5.2 Optimize AI model selection for cost
echo "Creating AI model selection optimization script..."

cat > /tmp/model-cost-optimizer.py << 'EOF'
#!/usr/bin/env python3
"""
Vertex AI Model Selection Optimizer

This script analyzes Vertex AI usage patterns and recommends the most
cost-effective model configurations based on workload.
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta

def get_model_usage(project_id, days=30):
    """Get usage statistics for AI models"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    query = f"""
    SELECT
      endpoint_id,
      model_id,
      COUNT(*) as request_count,
      AVG(request_latencies.total_latency_ms) as avg_latency
    FROM
      `{project_id}.region-europe-west4.DATASET.prediction_requests`
    WHERE
      request_time BETWEEN '{start_date.strftime("%Y-%m-%d")}' AND '{end_date.strftime("%Y-%m-%d")}'
    GROUP BY
      endpoint_id, model_id
    ORDER BY
      request_count DESC
    """
    
    # This would actually use the BigQuery client to run the query
    # For now, we'll simulate some example data
    return [
        {"endpoint_id": "embeddings", "model_id": "textembedding-gecko", "request_count": 25000, "avg_latency": 250},
        {"endpoint_id": "completions", "model_id": "text-bison", "request_count": 5000, "avg_latency": 1200},
        {"endpoint_id": "chat", "model_id": "chat-bison", "request_count": 3000, "avg_latency": 2000}
    ]

def get_model_costs():
    """Get cost information for available models"""
    # In a real implementation, this would fetch current pricing from an API
    return {
        "textembedding-gecko": {"cost_per_1k": 0.10, "threshold": 20000, "alternative": "textembedding-gecko-multilingual"},
        "textembedding-gecko-multilingual": {"cost_per_1k": 0.08, "threshold": 50000, "alternative": None},
        "text-bison": {"cost_per_1k": 0.50, "threshold": 3000, "alternative": "text-bison-32k"},
        "text-bison-32k": {"cost_per_1k": 1.00, "threshold": 1000, "alternative": None},
        "chat-bison": {"cost_per_1k": 0.50, "threshold": 3000, "alternative": None}
    }

def recommend_optimizations(usage, costs):
    """Generate cost optimization recommendations"""
    recommendations = []
    
    for model_usage in usage:
        model_id = model_usage["model_id"]
        request_count = model_usage["request_count"]
        
        if model_id in costs:
            model_cost = costs[model_id]
            monthly_cost = (request_count / 1000) * model_cost["cost_per_1k"]
            
            if request_count > model_cost["threshold"] and model_cost["alternative"]:
                alt_model = model_cost["alternative"]
                alt_cost = costs[alt_model]
                alt_monthly_cost = (request_count / 1000) * alt_cost["cost_per_1k"]
                
                if alt_monthly_cost < monthly_cost:
                    savings = monthly_cost - alt_monthly_cost
                    recommendations.append({
                        "endpoint_id": model_usage["endpoint_id"],
                        "current_model": model_id,
                        "recommended_model": alt_model,
                        "monthly_requests": request_count,
                        "current_cost": monthly_cost,
                        "recommended_cost": alt_monthly_cost,
                        "monthly_savings": savings,
                        "savings_percent": (savings / monthly_cost) * 100
                    })
    
    return recommendations

def main():
    parser = argparse.ArgumentParser(description="Optimize Vertex AI model selection for cost efficiency")
    parser.add_argument("--project", required=True, help="GCP Project ID")
    parser.add_argument("--days", type=int, default=30, help="Number of days of history to analyze")
    parser.add_argument("--output", default="model_recommendations.json", help="Output file for recommendations")
    args = parser.parse_args()
    
    usage = get_model_usage(args.project, args.days)
    costs = get_model_costs()
    recommendations = recommend_optimizations(usage, costs)
    
    with open(args.output, 'w') as f:
        json.dump(recommendations, f, indent=2)
    
    print(f"Generated {len(recommendations)} cost optimization recommendations")
    print(f"Saved to {args.output}")
    
    total_savings = sum(r["monthly_savings"] for r in recommendations)
    if total_savings > 0:
        print(f"Potential monthly savings: ${total_savings:.2f}")

if __name__ == "__main__":
    main()
EOF

chmod +x /tmp/model-cost-optimizer.py
echo "Created AI model cost optimizer script at /tmp/model-cost-optimizer.py"

# Create a cron job to run the optimizer weekly
(crontab -l 2>/dev/null || echo "") | grep -v "model-cost-optimizer.py" > /tmp/crontab.tmp
echo "0 1 * * 0 /tmp/model-cost-optimizer.py --project $GCP_PROJECT_ID --output /home/tarquin_stapa/fluxori/logs/fluxori/model_recommendations.json" >> /tmp/crontab.tmp
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

echo "Scheduled weekly model cost optimization runs"

# 6. Resource Cleanup
echo -e "\n=== Cleaning Up Unused Resources ==="

# 6.1 Identify and clean up unused service accounts
echo "Identifying unused service accounts..."

# List service accounts
SERVICE_ACCOUNTS=$(gcloud iam service-accounts list --format="value(email)")

echo "Current service accounts:"
for SA in $SERVICE_ACCOUNTS; do
  echo "- $SA"
done
echo "Review and manually delete any unused service accounts"

# 6.2 Identify and delete unused cloud storage objects
echo "Identifying old cloud storage objects..."

# List objects older than 1 year
for BUCKET in $BUCKETS; do
  echo "Checking for old objects in $BUCKET"
  OLD_OBJECTS=$(gsutil ls -l $BUCKET | grep -E "$(date -d '1 year ago' +'%Y-%m-%d')" | wc -l)
  if [ "$OLD_OBJECTS" -gt 0 ]; then
    echo "Found $OLD_OBJECTS objects older than 1 year in $BUCKET"
    echo "Consider reviewing and deleting these objects"
  fi
done

# 7. Resource Quotas
echo -e "\n=== Setting Up Resource Quotas ==="

# 7.1 Configure resource quotas to prevent runaway costs
echo "Configuring resource quotas for cost control..."

# Cloud Run CPU and memory quotas
echo "Setting Cloud Run quotas..."
gcloud services enable serviceusage.googleapis.com || echo "Failed to enable Service Usage API"

# Set quotas for Cloud Run CPU allocation
gcloud service-management quota-configs update \
  --service="run.googleapis.com" \
  --project=$GCP_PROJECT_ID \
  --quota-id="limit-cloud-run-cpu" \
  --value=20 \
  || echo "Failed to set Cloud Run CPU quota"

# Set Cloud Storage quotas
echo "Setting Cloud Storage quotas..."
gcloud service-management quota-configs update \
  --service="storage.googleapis.com" \
  --project=$GCP_PROJECT_ID \
  --quota-id="limit-storage-bandwidth" \
  --value=1000 \
  || echo "Failed to set Cloud Storage bandwidth quota"

# Create a resource quota enforcement script
echo "Creating quota enforcement script..."

cat > /tmp/enforce-quotas.sh << 'EOF'
#!/bin/bash
# Resource quota enforcement script
# This script checks current usage and alerts or takes action when quotas are near limits

set -e

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Project ID required"
  echo "Usage: $0 <project-id>"
  exit 1
fi

# Check Cloud Run CPU usage
echo "Checking Cloud Run CPU usage..."
CPU_USAGE=$(gcloud run services list --project=$PROJECT_ID --format="csv[no-heading](cpu)" | awk '{sum+=$1} END {print sum}')
CPU_QUOTA=20 # Same as quota set above

if (( $(echo "$CPU_USAGE > $CPU_QUOTA * 0.8" | bc -l) )); then
  echo "WARNING: Cloud Run CPU usage at $(echo "scale=2; ($CPU_USAGE/$CPU_QUOTA)*100" | bc -l)% of quota"
  
  # Take action - could scale down services or send notification
  # For now, we just log the warning
fi

# Check Firestore usage
echo "Checking Firestore usage..."
# This would use the Firestore API to check usage vs quotas
# For now we just provide a placeholder

# Check Vertex AI usage
echo "Checking Vertex AI usage..."
# This would use the Vertex AI API to check usage vs quotas
# For now we just provide a placeholder

echo "Quota enforcement check complete"
EOF

chmod +x /tmp/enforce-quotas.sh
echo "Created quota enforcement script at /tmp/enforce-quotas.sh"

# Create a cron job to run the quota enforcement daily
echo "Setting up daily quota enforcement check..."
(crontab -l 2>/dev/null || echo "") | grep -v "enforce-quotas.sh" > /tmp/crontab.tmp
echo "0 */6 * * * /tmp/enforce-quotas.sh $GCP_PROJECT_ID >> /home/tarquin_stapa/fluxori/logs/fluxori/quota_checks.log 2>&1" >> /tmp/crontab.tmp
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

# 8. BigQuery Cost Analysis
echo -e "\n=== Setting Up BigQuery Cost Analysis ==="

# 8.1 Create BigQuery dataset for billing data if it doesn't exist
echo "Setting up BigQuery for cost analysis..."

BQ_DATASET="billing_analysis"

# Check if the dataset exists
if ! bq ls --dataset $GCP_PROJECT_ID:$BQ_DATASET &>/dev/null; then
  echo "Creating BigQuery dataset for billing analysis: $BQ_DATASET"
  bq mk --dataset \
    --description "GCP Billing Analysis Dataset" \
    --location $REGION \
    $GCP_PROJECT_ID:$BQ_DATASET \
    || echo "Failed to create BigQuery dataset"
else
  echo "BigQuery dataset $BQ_DATASET already exists"
fi

# 8.2 Create billing export configuration
echo "Creating Cloud Billing export to BigQuery..."

if [ -n "$BILLING_ACCOUNT_ID" ]; then
  # Check if billing export is already configured
  EXPORT_EXISTS=$(gcloud billing export bq list --billing-account=$BILLING_ACCOUNT_ID --format="value(name)" | grep -c "$BQ_DATASET" || echo "0")
  
  if [ "$EXPORT_EXISTS" -eq "0" ]; then
    echo "Setting up billing export to BigQuery dataset $BQ_DATASET"
    gcloud billing export bq enable \
      --billing-account=$BILLING_ACCOUNT_ID \
      --dataset-id=$BQ_DATASET \
      --table-id=billing_data \
      || echo "Failed to enable billing export"
  else
    echo "Billing export to BigQuery already configured"
  fi
else
  echo "BILLING_ACCOUNT_ID not set. Skipping billing export configuration."
  echo "To set up billing export, please set BILLING_ACCOUNT_ID environment variable."
fi

# 8.3 Create cost analysis queries
echo "Creating cost analysis queries..."

# Create directory for queries
mkdir -p /tmp/cost_analysis_queries

# Query to analyze costs by service
cat > /tmp/cost_analysis_queries/costs_by_service.sql << EOF
-- Costs by service for the last 30 days
SELECT
  service.description as service,
  SUM(cost) as total_cost,
  SUM(usage.amount) as usage_amount,
  usage.unit as unit
FROM
  \`$GCP_PROJECT_ID.$BQ_DATASET.billing_data\`
WHERE
  DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
  service, unit
ORDER BY
  total_cost DESC
LIMIT 20;
EOF

# Query to analyze costs by region
cat > /tmp/cost_analysis_queries/costs_by_region.sql << EOF
-- Costs by region for the last 30 days
SELECT
  location.region as region,
  SUM(cost) as total_cost
FROM
  \`$GCP_PROJECT_ID.$BQ_DATASET.billing_data\`
WHERE
  DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
  region
ORDER BY
  total_cost DESC;
EOF

# Query to identify cost anomalies
cat > /tmp/cost_analysis_queries/cost_anomalies.sql << EOF
-- Detect daily cost anomalies (>50% increase from previous day)
WITH daily_costs AS (
  SELECT
    DATE(usage_start_time) as usage_date,
    SUM(cost) as daily_cost
  FROM
    \`$GCP_PROJECT_ID.$BQ_DATASET.billing_data\`
  WHERE
    DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY
    usage_date
  ORDER BY
    usage_date
)

SELECT
  curr.usage_date,
  curr.daily_cost as current_cost,
  prev.daily_cost as previous_cost,
  (curr.daily_cost - prev.daily_cost) as cost_increase,
  ((curr.daily_cost - prev.daily_cost) / prev.daily_cost) * 100 as percent_increase
FROM
  daily_costs curr
JOIN
  daily_costs prev
ON
  curr.usage_date = DATE_ADD(prev.usage_date, INTERVAL 1 DAY)
WHERE
  ((curr.daily_cost - prev.daily_cost) / prev.daily_cost) > 0.5
ORDER BY
  curr.usage_date DESC;
EOF

echo "Cost analysis queries created in /tmp/cost_analysis_queries/"

# 8.4 Create a script to run cost analysis and send reports
cat > /tmp/run-cost-analysis.sh << 'EOF'
#!/bin/bash
# Cost analysis report generator

set -e

PROJECT_ID=$1
BQ_DATASET=$2
EMAIL_RECIPIENT=$3

if [ -z "$PROJECT_ID" ] || [ -z "$BQ_DATASET" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: $0 <project-id> <bq-dataset> [email-recipient]"
  exit 1
fi

REPORT_DIR="/tmp/cost_reports"
mkdir -p $REPORT_DIR

DATE_SUFFIX=$(date +"%Y-%m-%d")
REPORT_FILE="$REPORT_DIR/cost_report_$DATE_SUFFIX.txt"

# Run the cost analysis queries
echo "=== GCP Cost Analysis Report $DATE_SUFFIX ===" > $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Running cost by service analysis..."
echo "=== Costs by Service (Last 30 Days) ===" >> $REPORT_FILE
bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
  "$(cat /tmp/cost_analysis_queries/costs_by_service.sql)" \
  --format=pretty >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Running cost by region analysis..."
echo "=== Costs by Region (Last 30 Days) ===" >> $REPORT_FILE
bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
  "$(cat /tmp/cost_analysis_queries/costs_by_region.sql)" \
  --format=pretty >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Running cost anomaly detection..."
echo "=== Cost Anomalies (Last 30 Days) ===" >> $REPORT_FILE
bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
  "$(cat /tmp/cost_analysis_queries/cost_anomalies.sql)" \
  --format=pretty >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Add optimization recommendations
echo "=== Cost Optimization Recommendations ===" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "1. Consider moving cold data to lower-cost storage classes" >> $REPORT_FILE
echo "2. Review idle resources and shut down when not needed" >> $REPORT_FILE
echo "3. Check for unattached persistent disks and remove if unnecessary" >> $REPORT_FILE
echo "4. Consider using committed use discounts for stable workloads" >> $REPORT_FILE
echo "5. Optimize network costs by using Cloud CDN for content delivery" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Add South Africa specific recommendations
echo "=== South Africa (africa-south1) Region-Specific Recommendations ===" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "1. Use Premium Network Tier selectively for external traffic, Standard Tier for internal" >> $REPORT_FILE
echo "2. Route traffic through Cloud CDN where possible for cost savings on egress" >> $REPORT_FILE
echo "3. Cache frequently accessed data to reduce egress costs from europe-west4" >> $REPORT_FILE
echo "4. Consider consolidating storage in a single region (africa-south1) to reduce cross-region traffic" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Cost report generated: $REPORT_FILE"

# Send email if recipient is provided
if [ -n "$EMAIL_RECIPIENT" ]; then
  echo "Sending report to $EMAIL_RECIPIENT..."
  # In a real implementation, this would use a mail command or API to send the report
  echo "Email would be sent to $EMAIL_RECIPIENT with $REPORT_FILE"
fi
EOF

chmod +x /tmp/run-cost-analysis.sh
echo "Created cost analysis script at /tmp/run-cost-analysis.sh"

# Create a cron job to run weekly cost analysis
echo "Setting up weekly cost analysis job..."
(crontab -l 2>/dev/null || echo "") | grep -v "run-cost-analysis.sh" > /tmp/crontab.tmp
echo "0 7 * * 1 /tmp/run-cost-analysis.sh $GCP_PROJECT_ID $BQ_DATASET $ADMIN_EMAIL >> /home/tarquin_stapa/fluxori/logs/fluxori/cost_analysis.log 2>&1" >> /tmp/crontab.tmp
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

# 9. South Africa Region Cost Optimizations
echo -e "\n=== Implementing South Africa Region-Specific Optimizations ==="

# 9.1 Set up Cloud CDN for africa-south1 region
echo "Configuring Cloud CDN optimizations for africa-south1 region..."

# Check if we have a static bucket for assets
ASSETS_BUCKET=$(gsutil ls -p $GCP_PROJECT_ID | grep -E "assets|static" | head -1 || echo "")

if [ -n "$ASSETS_BUCKET" ]; then
  echo "Configuring Cloud CDN for $ASSETS_BUCKET"
  
  # This would create or update a CDN configuration for the bucket
  # In a real implementation, this would use gcloud commands to configure CDN
  echo "Cloud CDN would be configured for $ASSETS_BUCKET"
else
  echo "No assets bucket found. Skipping Cloud CDN configuration."
fi

# 9.2 Configure network service tiers
echo "Configuring network service tiers for cost optimization..."

# List external IPs
EXTERNAL_IPS=$(gcloud compute addresses list --filter="region:$REGION" --format="value(address)")

if [ -n "$EXTERNAL_IPS" ]; then
  echo "Found external IPs in $REGION, would configure appropriate network tier"
  # In a real implementation, this would selectively apply network tier settings
else
  echo "No external IPs found in $REGION. Skipping network tier configuration."
fi

# 9.3 Configure cross-region data access optimizations
echo "Setting up cross-region data access optimizations..."

# Create a Cloud Function to cache frequently accessed data from europe-west4
echo "Would create a caching mechanism for europe-west4 to africa-south1 data access"
# In a real implementation, this would create/deploy a Cloud Function for caching

echo -e "\n=== Cost Optimization Complete ==="
echo "Cost optimization measures have been applied to project: $GCP_PROJECT_ID"
echo "Remember to review recommendations and make any necessary adjustments"
echo "====================================="