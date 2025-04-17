#!/bin/bash
# Phase 5: Monitoring Setup - Dashboard and Alerts
# This script sets up Cloud Monitoring dashboard and alert policies

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
REGION="africa-south1"
SERVICE_NAME="marketplace-scraper"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="${DEPLOY_DIR}/monitoring"
NOTIFICATION_EMAIL="alerts@fluxori.com"

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
    --notification-email)
      NOTIFICATION_EMAIL="$2"
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
echo -e "${BLUE}Phase 5: Monitoring Setup${NC}"
echo -e "${BLUE}----------------------${NC}"
echo ""

# Load configuration file if it exists
CONFIG_FILE="${HOME}/.config/gcloud/${PROJECT_ID}/market-scraper.conf"
if [[ -f "${CONFIG_FILE}" ]]; then
  source "${CONFIG_FILE}"
  echo "Loaded configuration from: ${CONFIG_FILE}"
else
  echo -e "${YELLOW}Configuration file not found. Using default values.${NC}"
fi

# Make sure the monitoring directory exists
mkdir -p "${MONITORING_DIR}"

# Create monitoring dashboard file
DASHBOARD_FILE="${MONITORING_DIR}/dashboard.json"
if [[ ! -f "${DASHBOARD_FILE}" ]]; then
  echo "Creating monitoring dashboard file..."
  cat > "${DASHBOARD_FILE}" << EOF
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
            },
            "thresholds": [
              {
                "value": 80,
                "targetAxis": "Y1",
                "color": "YELLOW",
                "direction": "BELOW"
              },
              {
                "value": 50,
                "targetAxis": "Y1",
                "color": "RED",
                "direction": "BELOW"
              }
            ]
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
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Tasks"
            }
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
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Products Scraped by Marketplace",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/products_scraped\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_SUM",
                      "crossSeriesReducer": "REDUCE_SUM",
                      "groupByFields": [
                        "metric.label.\"marketplace\""
                      ]
                    }
                  }
                },
                "plotType": "STACKED_BAR",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Products"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Response Time",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/response_time\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_PERCENTILE_99"
                    }
                  },
                  "unitOverride": "s"
                },
                "plotType": "LINE",
                "legendTemplate": "p99",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              },
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/response_time\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_PERCENTILE_50"
                    }
                  },
                  "unitOverride": "s"
                },
                "plotType": "LINE",
                "legendTemplate": "p50",
                "minAlignmentPeriod": "60s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Seconds"
            },
            "thresholds": [
              {
                "value": 10,
                "targetAxis": "Y1",
                "color": "YELLOW"
              },
              {
                "value": 30,
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
          "title": "Priority Usage",
          "pieChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/priority_usage\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "3600s",
                      "perSeriesAligner": "ALIGN_SUM",
                      "crossSeriesReducer": "REDUCE_SUM",
                      "groupByFields": [
                        "metric.label.\"priority\""
                      ]
                    }
                  }
                },
                "targetAxis": "Y1"
              }
            ],
            "chartOptions": {
              "mode": "PIE"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Daily Request Volume",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/daily_requests\" resource.type=\"global\"",
                    "aggregation": {
                      "alignmentPeriod": "86400s",
                      "perSeriesAligner": "ALIGN_SUM"
                    }
                  }
                },
                "plotType": "COLUMN",
                "minAlignmentPeriod": "86400s",
                "targetAxis": "Y1"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "scale": "LINEAR",
              "label": "Requests"
            }
          }
        }
      },
      {
        "width": 12,
        "height": 1,
        "widget": {
          "title": "System Status",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/marketplace_scraper/system_health\" resource.type=\"global\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            },
            "thresholds": [
              {
                "value": 0.7,
                "color": "YELLOW",
                "direction": "BELOW"
              },
              {
                "value": 0.5,
                "color": "RED",
                "direction": "BELOW"
              }
            ],
            "spark_chart_view_window": {
              "start_time": {
                "seconds": -86400
              }
            }
          }
        }
      }
    ]
  }
}
EOF
  echo -e "${GREEN}Created monitoring dashboard file: ${DASHBOARD_FILE}${NC}"
else
  echo -e "${GREEN}Using existing monitoring dashboard file: ${DASHBOARD_FILE}${NC}"
fi

# Create alert policies file
ALERTS_FILE="${MONITORING_DIR}/alert-policies.yaml"
if [[ ! -f "${ALERTS_FILE}" ]]; then
  echo "Creating alert policies file..."
  cat > "${ALERTS_FILE}" << EOF
# Alert policies for Marketplace Scraper

# High quota usage alert
quota_alert:
  display_name: "Marketplace Scraper - High Quota Usage"
  documentation:
    content: "SmartProxy API quota usage exceeded 80% of monthly allocation."
    mime_type: "text/markdown"
  conditions:
    - display_name: "Quota Usage > 80%"
      condition_threshold:
        filter: 'metric.type="custom.googleapis.com/marketplace_scraper/quota_usage" AND resource.type="global"'
        comparison: COMPARISON_GT
        threshold_value: 80.0
        duration: {seconds: 0}
        trigger:
          count: 1
  alert_strategy:
    notification_rate_limit:
      period: {seconds: 3600}  # One notification per hour max

# High error rate alert
error_rate_alert:
  display_name: "Marketplace Scraper - High Error Rate"
  documentation:
    content: "Marketplace scraper error rate exceeded 20% over 10-minute window."
    mime_type: "text/markdown"
  conditions:
    - display_name: "Error Rate > 20%"
      condition_threshold:
        filter: 'metric.type="custom.googleapis.com/marketplace_scraper/error_rate" AND resource.type="global"'
        comparison: COMPARISON_GT
        threshold_value: 20.0
        duration: {seconds: 600}  # 10 minutes
        trigger:
          count: 1
  alert_strategy:
    notification_rate_limit:
      period: {seconds: 1800}  # Notification every 30 minutes max

# Load shedding detected alert
loadshedding_alert:
  display_name: "Marketplace Scraper - Load Shedding Detected"
  documentation:
    content: "Load shedding detected, scraper operating in reduced functionality mode."
    mime_type: "text/markdown"
  conditions:
    - display_name: "Load Shedding Detected"
      condition_threshold:
        filter: 'metric.type="custom.googleapis.com/marketplace_scraper/loadshedding_detected" AND resource.type="global"'
        comparison: COMPARISON_GT
        threshold_value: 0.0
        duration: {seconds: 0}
        trigger:
          count: 1
  alert_strategy:
    notification_rate_limit:
      period: {seconds: 7200}  # Notification every 2 hours max

# Service inactivity alert
inactivity_alert:
  display_name: "Marketplace Scraper - Service Inactivity"
  documentation:
    content: "Marketplace scraper has not performed any tasks for an extended period."
    mime_type: "text/markdown"
  conditions:
    - display_name: "No Tasks for 6 Hours"
      condition_threshold:
        filter: 'metric.type="custom.googleapis.com/marketplace_scraper/tasks_completed" AND resource.type="global"'
        comparison: COMPARISON_LT
        threshold_value: 1.0
        duration: {seconds: 21600}  # 6 hours
        trigger:
          count: 1
  alert_strategy:
    notification_rate_limit:
      period: {seconds: 21600}  # Notification every 6 hours max

# Response time alert
response_time_alert:
  display_name: "Marketplace Scraper - Slow Response Time"
  documentation:
    content: "Marketplace scraper experiencing slow response times from API endpoints."
    mime_type: "text/markdown"
  conditions:
    - display_name: "Response Time > 10s"
      condition_threshold:
        filter: 'metric.type="custom.googleapis.com/marketplace_scraper/response_time" AND resource.type="global"'
        comparison: COMPARISON_GT
        threshold_value: 10.0
        duration: {seconds: 300}  # 5 minutes
        trigger:
          count: 5
  alert_strategy:
    notification_rate_limit:
      period: {seconds: 3600}  # Notification every hour max

# Data quality alert
data_quality_alert:
  display_name: "Marketplace Scraper - Data Quality Issues"
  documentation:
    content: "Marketplace scraper detected data quality issues (missing fields, invalid data)."
    mime_type: "text/markdown"
  conditions:
    - display_name: "Data Quality Score < 0.8"
      condition_threshold:
        filter: 'metric.type="custom.googleapis.com/marketplace_scraper/data_quality_score" AND resource.type="global"'
        comparison: COMPARISON_LT
        threshold_value: 0.8
        duration: {seconds: 600}  # 10 minutes
        trigger:
          count: 3
  alert_strategy:
    notification_rate_limit:
      period: {seconds: 7200}  # Notification every 2 hours max
EOF
  echo -e "${GREEN}Created alert policies file: ${ALERTS_FILE}${NC}"
else
  echo -e "${GREEN}Using existing alert policies file: ${ALERTS_FILE}${NC}"
fi

# Create monitoring setup script
SETUP_SCRIPT="${MONITORING_DIR}/setup-monitoring.sh"
if [[ ! -f "${SETUP_SCRIPT}" ]]; then
  echo "Creating monitoring setup script..."
  cat > "${SETUP_SCRIPT}" << 'EOF'
#!/bin/bash
# Setup script for Cloud Monitoring dashboard and alerts

set -e  # Exit on error

# Default values
PROJECT_ID="fluxori-marketplace-data"
DASHBOARD_FILE="$(dirname "$0")/dashboard.json"
ALERTS_FILE="$(dirname "$0")/alert-policies.yaml"
NOTIFICATION_EMAIL="alerts@fluxori.com"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --project)
      PROJECT_ID="$2"
      shift
      shift
      ;;
    --dashboard)
      DASHBOARD_FILE="$2"
      shift
      shift
      ;;
    --alerts)
      ALERTS_FILE="$2"
      shift
      shift
      ;;
    --email)
      NOTIFICATION_EMAIL="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --project PROJECT_ID        Google Cloud project ID (default: ${PROJECT_ID})"
      echo "  --dashboard DASHBOARD_FILE  Path to dashboard.json file (default: ${DASHBOARD_FILE})"
      echo "  --alerts ALERTS_FILE        Path to alert-policies.yaml file (default: ${ALERTS_FILE})"
      echo "  --email EMAIL               Notification email address (default: ${NOTIFICATION_EMAIL})"
      echo "  --help                      Show this help message"
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
echo "  Marketplace Scraper Monitoring Setup"
echo "======================================================================"
echo "  Project: ${PROJECT_ID}"
echo "  Dashboard file: ${DASHBOARD_FILE}"
echo "  Alerts file: ${ALERTS_FILE}"
echo "  Notification email: ${NOTIFICATION_EMAIL}"
echo "======================================================================"

# Enable Cloud Monitoring API
echo "Enabling Cloud Monitoring API..."
gcloud services enable monitoring.googleapis.com --project=${PROJECT_ID}

# Create email notification channel
echo "Creating email notification channel..."
CHANNEL_NAME="marketplace-scraper-alerts"

# Check if notification channel already exists
EXISTING_CHANNEL=$(gcloud alpha monitoring channels list \
  --project=${PROJECT_ID} \
  --filter="displayName=${CHANNEL_NAME}" \
  --format="value(name)" 2>/dev/null || echo "")

if [[ -z "${EXISTING_CHANNEL}" ]]; then
  echo "Creating new notification channel..."
  CHANNEL_ID=$(gcloud alpha monitoring channels create \
    --project=${PROJECT_ID} \
    --display-name="${CHANNEL_NAME}" \
    --type=email \
    --channel-labels=email_address=${NOTIFICATION_EMAIL} \
    --format="value(name)")
  
  echo "Created notification channel: ${CHANNEL_ID}"
else
  echo "Using existing notification channel: ${EXISTING_CHANNEL}"
  CHANNEL_ID=${EXISTING_CHANNEL}
fi

# Create dashboard
echo "Creating monitoring dashboard..."
if [[ ! -f "${DASHBOARD_FILE}" ]]; then
  echo "Error: Dashboard file not found at ${DASHBOARD_FILE}"
  exit 1
fi

# Check if dashboard already exists
EXISTING_DASHBOARD=$(gcloud monitoring dashboards list \
  --project=${PROJECT_ID} \
  --filter="displayName:\"Marketplace Scraper Dashboard\"" \
  --format="value(name)" 2>/dev/null || echo "")

if [[ -n "${EXISTING_DASHBOARD}" ]]; then
  echo "Updating existing dashboard..."
  gcloud monitoring dashboards delete ${EXISTING_DASHBOARD} --project=${PROJECT_ID} --quiet
fi

DASHBOARD_ID=$(gcloud monitoring dashboards create \
  --project=${PROJECT_ID} \
  --config-from-file=${DASHBOARD_FILE} \
  --format="value(name)")

echo "Dashboard created: ${DASHBOARD_ID}"

# Create alert policies
echo "Creating alert policies..."
if [[ ! -f "${ALERTS_FILE}" ]]; then
  echo "Error: Alerts file not found at ${ALERTS_FILE}"
  exit 1
fi

# Parse alert policies from YAML file
POLICY_NAMES=$(cat "${ALERTS_FILE}" | grep -B 1 "display_name:" | grep -v "display_name:" | grep -v -- "---" | grep -v "^#" | sed 's/://g' | sed 's/ //g')

# Create or update each alert policy
for policy_name in ${POLICY_NAMES}; do
  echo "Processing alert policy: ${policy_name}"
  
  # Extract policy details
  display_name=$(cat "${ALERTS_FILE}" | grep -A 1 "${policy_name}:" | grep "display_name:" | sed 's/  display_name: //g' | sed 's/"//g')
  
  # Check if policy already exists
  EXISTING_POLICY=$(gcloud alpha monitoring policies list \
    --project=${PROJECT_ID} \
    --filter="displayName=\"${display_name}\"" \
    --format="value(name)" 2>/dev/null || echo "")
  
  if [[ -n "${EXISTING_POLICY}" ]]; then
    echo "  Deleting existing policy: ${display_name}"
    gcloud alpha monitoring policies delete ${EXISTING_POLICY} --project=${PROJECT_ID} --quiet
  fi
  
  # Create temporary file for policy
  TEMP_FILE=$(mktemp)
  
  # Extract policy section to temp file
  cat "${ALERTS_FILE}" | sed -n "/^${policy_name}:/,/^[a-z_]*_alert:/p" | sed '$d' > ${TEMP_FILE}
  
  # Add notification channel to the policy
  cat ${TEMP_FILE} | sed "/alert_strategy:/i\\
  notificationChannels:\\
    - ${CHANNEL_ID}" > ${TEMP_FILE}.new
  mv ${TEMP_FILE}.new ${TEMP_FILE}
  
  # Create the policy
  POLICY_ID=$(gcloud alpha monitoring policies create \
    --project=${PROJECT_ID} \
    --policy-from-file=${TEMP_FILE} \
    --format="value(name)")
  
  echo "  Created policy: ${display_name} (${POLICY_ID})"
  
  # Clean up
  rm ${TEMP_FILE}
done

echo "======================================================================"
echo "Monitoring setup complete!"
echo ""
echo "Dashboard URL: https://console.cloud.google.com/monitoring/dashboards?project=${PROJECT_ID}"
echo "Alerts URL: https://console.cloud.google.com/monitoring/alerting?project=${PROJECT_ID}"
echo "======================================================================"
EOF
  chmod +x "${SETUP_SCRIPT}"
  echo -e "${GREEN}Created monitoring setup script: ${SETUP_SCRIPT}${NC}"
else
  echo -e "${GREEN}Using existing monitoring setup script: ${SETUP_SCRIPT}${NC}"
  chmod +x "${SETUP_SCRIPT}"
fi

# Execute the monitoring setup script
echo "Executing monitoring setup script..."
"${SETUP_SCRIPT}" --project="${PROJECT_ID}" --dashboard="${DASHBOARD_FILE}" --alerts="${ALERTS_FILE}" --email="${NOTIFICATION_EMAIL}"

# Create email notification configuration
EMAIL_CONFIG="${MONITORING_DIR}/email-notification.json"
echo "Creating email notification configuration..."
cat > "${EMAIL_CONFIG}" << EOF
{
  "name": "marketplace-scraper-email-notification",
  "type": "email",
  "labels": {
    "email_address": "${NOTIFICATION_EMAIL}"
  },
  "description": "Email notification channel for marketplace scraper alerts",
  "enabled": true,
  "verification_status": "VERIFICATION_STATUS_VERIFIED"
}
EOF
echo -e "${GREEN}Created email notification configuration: ${EMAIL_CONFIG}${NC}"

echo ""
echo -e "${BLUE}Monitoring setup completed successfully.${NC}"
echo -e "${BLUE}Dashboard and alerts are now configured.${NC}"
echo ""