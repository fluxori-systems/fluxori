#!/bin/bash
# 
# Fluxori Monitoring Setup Script
# 
# This script sets up comprehensive monitoring for Fluxori on Google Cloud Platform.
# It creates dashboards, alert policies, uptime checks, and notification channels
# for all critical services.
#
# Optimized for South African region (africa-south1)
#

set -e

# Configuration
PROJECT_ID=${1:-fluxori-prod}
REGION=${2:-africa-south1}
ALERT_EMAIL=${3:-"alerts@fluxori.com"}
SLACK_WEBHOOK_URL=${4:-""}
SLACK_CHANNEL=${5:-"#alerts"}
FRONTEND_URL="https://app.fluxori.com"
API_URL="https://api.fluxori.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}   Fluxori Monitoring Setup - South Africa Edition    ${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${YELLOW}Project: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"
echo -e "${YELLOW}Alert Email: ${ALERT_EMAIL}${NC}"
echo -e "${YELLOW}Frontend URL: ${FRONTEND_URL}${NC}"
echo -e "${YELLOW}API URL: ${API_URL}${NC}"

# Make sure gcloud is authenticated and set to the right project
echo -e "\n${BLUE}Configuring gcloud CLI...${NC}"
gcloud config set project ${PROJECT_ID}

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}Error: You are not logged in to gcloud.${NC}"
    echo -e "${YELLOW}Please run 'gcloud auth login' and try again.${NC}"
    exit 1
fi

# Create notification channels
echo -e "\n${BLUE}Creating notification channels...${NC}"

# Email channel
EMAIL_CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="Email Alerts" \
  --type=email \
  --labels=email_address=${ALERT_EMAIL} \
  --format="value(name)")

echo -e "${GREEN}Created email notification channel: ${EMAIL_CHANNEL_ID}${NC}"

# Slack channel (if webhook provided)
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
  SLACK_CHANNEL_ID=$(gcloud alpha monitoring channels create \
    --display-name="Slack Alerts" \
    --type=slack \
    --labels=channel_name=${SLACK_CHANNEL} \
    --channel-labels=auth_token=${SLACK_WEBHOOK_URL} \
    --format="value(name)")
  
  echo -e "${GREEN}Created Slack notification channel: ${SLACK_CHANNEL_ID}${NC}"
  
  # Set notification channels with both email and Slack
  NOTIFICATION_CHANNELS="${EMAIL_CHANNEL_ID},${SLACK_CHANNEL_ID}"
else
  # Only use email channel
  NOTIFICATION_CHANNELS="${EMAIL_CHANNEL_ID}"
  echo -e "${YELLOW}No Slack webhook provided, using email notifications only.${NC}"
fi

# Create uptime checks
echo -e "\n${BLUE}Creating uptime checks...${NC}"

# Frontend uptime check
gcloud monitoring uptime-checks create http frontend-uptime \
  --display-name="Frontend Availability" \
  --uri=${FRONTEND_URL} \
  --timeout=30s \
  --check-interval=60s \
  --content-matcher="Fluxori" \
  --selected-regions=AFRICA_SOUTH,EUROPE_WEST

echo -e "${GREEN}Created frontend uptime check${NC}"

# API uptime check
gcloud monitoring uptime-checks create http api-uptime \
  --display-name="API Availability" \
  --uri=${API_URL}/health \
  --timeout=10s \
  --check-interval=30s \
  --content-matcher="\"status\":\"ok\"" \
  --selected-regions=AFRICA_SOUTH,EUROPE_WEST

echo -e "${GREEN}Created API uptime check${NC}"

# Create alert policies
echo -e "\n${BLUE}Creating alert policies...${NC}"

# High error rate policy
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="High Error Rate" \
  --conditions="target=metric.type=\"run.googleapis.com/request_count\"
resource.type=\"cloud_run_revision\"
metric.label.response_code_class=\"5xx\"
condition.threshold.filter=\"resource.labels.service_name!=\"\"\"
condition.threshold.comparison=\"COMPARISON_GT\"
condition.threshold.threshold_value=5
condition.trigger.count=1
condition.aggregations.alignment_period=60s
condition.aggregations.per_series_aligner=ALIGN_RATE
condition.aggregations.cross_series_reducer=REDUCE_SUM
condition.aggregations.group_by_fields=\"resource.labels.service_name\"" \
  --documentation="High error rate detected in Cloud Run services. This indicates a potential service issue that requires immediate attention. Check logs for more details."

echo -e "${GREEN}Created high error rate alert policy${NC}"

# High latency policy
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="High API Latency" \
  --conditions="target=metric.type=\"run.googleapis.com/request_latencies\"
resource.type=\"cloud_run_revision\"
condition.threshold.filter=\"resource.labels.service_name!=\"\"\"
condition.threshold.comparison=\"COMPARISON_GT\"
condition.threshold.threshold_value=2000
condition.trigger.count=1
condition.aggregations.alignment_period=60s
condition.aggregations.per_series_aligner=ALIGN_PERCENTILE_99
condition.aggregations.cross_series_reducer=REDUCE_MEAN
condition.aggregations.group_by_fields=\"resource.labels.service_name\"" \
  --documentation="High API latency detected (P99 > 2000ms). This may be affecting user experience. Check for performance bottlenecks in the service."

echo -e "${GREEN}Created high latency alert policy${NC}"

# Uptime check alert policy (frontend)
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="Frontend Downtime" \
  --conditions="target=uptime_url=\"${FRONTEND_URL}\"
condition.threshold.threshold_value=0.8
condition.threshold.comparison=\"COMPARISON_LT\"
condition.trigger.count=2
condition.aggregations.alignment_period=300s
condition.aggregations.per_series_aligner=ALIGN_NEXT_OLDER
condition.aggregations.cross_series_reducer=REDUCE_MEAN" \
  --documentation="Frontend uptime check is failing. The user interface may be unavailable. Check the frontend service and Cloud CDN configuration."

echo -e "${GREEN}Created frontend downtime alert policy${NC}"

# Uptime check alert policy (API)
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="API Downtime" \
  --conditions="target=uptime_url=\"${API_URL}/health\"
condition.threshold.threshold_value=0.8
condition.threshold.comparison=\"COMPARISON_LT\"
condition.trigger.count=2
condition.aggregations.alignment_period=300s
condition.aggregations.per_series_aligner=ALIGN_NEXT_OLDER
condition.aggregations.cross_series_reducer=REDUCE_MEAN" \
  --documentation="API uptime check is failing. The backend services may be unavailable. Check Cloud Run services and load balancer configuration."

echo -e "${GREEN}Created API downtime alert policy${NC}"

# High CPU utilization
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="High CPU Utilization" \
  --conditions="target=metric.type=\"run.googleapis.com/container/cpu/utilization\"
resource.type=\"cloud_run_revision\"
condition.threshold.filter=\"resource.labels.service_name!=\"\"\"
condition.threshold.comparison=\"COMPARISON_GT\"
condition.threshold.threshold_value=0.8
condition.trigger.count=1
condition.aggregations.alignment_period=300s
condition.aggregations.per_series_aligner=ALIGN_MEAN
condition.aggregations.cross_series_reducer=REDUCE_MEAN
condition.aggregations.group_by_fields=\"resource.labels.service_name\"" \
  --documentation="High CPU utilization detected (>80%). This may indicate a need to increase resources or optimize the service."

echo -e "${GREEN}Created CPU utilization alert policy${NC}"

# High memory utilization
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="High Memory Utilization" \
  --conditions="target=metric.type=\"run.googleapis.com/container/memory/utilization\"
resource.type=\"cloud_run_revision\"
condition.threshold.filter=\"resource.labels.service_name!=\"\"\"
condition.threshold.comparison=\"COMPARISON_GT\"
condition.threshold.threshold_value=0.8
condition.trigger.count=1
condition.aggregations.alignment_period=300s
condition.aggregations.per_series_aligner=ALIGN_MEAN
condition.aggregations.cross_series_reducer=REDUCE_MEAN
condition.aggregations.group_by_fields=\"resource.labels.service_name\"" \
  --documentation="High memory utilization detected (>80%). This may indicate a memory leak or a need to increase memory allocation."

echo -e "${GREEN}Created memory utilization alert policy${NC}"

# Firestore quota alert
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="Firestore Quota Approaching Limit" \
  --conditions="target=metric.type=\"firestore.googleapis.com/document_read_count\"
resource.type=\"firestore_instance\"
condition.threshold.comparison=\"COMPARISON_GT\"
condition.threshold.threshold_value=42000
condition.trigger.count=1
condition.aggregations.alignment_period=60s
condition.aggregations.per_series_aligner=ALIGN_RATE" \
  --documentation="Firestore read operations are approaching quota limits. This may lead to throttling. Consider optimizing queries or requesting quota increases."

echo -e "${GREEN}Created Firestore quota alert policy${NC}"

# Set up dashboard
echo -e "\n${BLUE}Creating monitoring dashboard...${NC}"

# Create a temporary dashboard definition file
DASHBOARD_FILE=$(mktemp)

cat > ${DASHBOARD_FILE} << EOL
{
  "displayName": "Fluxori System Dashboard",
  "gridLayout": {
    "columns": "2",
    "widgets": [
      {
        "title": "Frontend Availability",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "select_slo_health(\"${PROJECT_ID}\", \"projects/${PROJECT_ID}/services/frontend/serviceLevelObjectives/availability-slo\")",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "SLO Compliance",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "API Availability",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "select_slo_health(\"${PROJECT_ID}\", \"projects/${PROJECT_ID}/services/api/serviceLevelObjectives/availability-slo\")",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "SLO Compliance",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "Cloud Run Requests",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": [
                      "resource.label.service_name"
                    ],
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Requests/min",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "Cloud Run Latency (P99)",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "groupByFields": [
                      "resource.label.service_name"
                    ],
                    "perSeriesAligner": "ALIGN_PERCENTILE_99"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "P99 latency (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "HTTP Error Codes",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code_class!=\"200\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": [
                      "metric.label.response_code_class"
                    ],
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Error count/min",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "CPU Utilization",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/cpu/utilization\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "groupByFields": [
                      "resource.label.service_name"
                    ],
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "CPU utilization",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "Memory Utilization",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/memory/utilization\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "groupByFields": [
                      "resource.label.service_name"
                    ],
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Memory utilization",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "Firestore Operations",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"firestore.googleapis.com/document_read_count\" OR metric.type=\"firestore.googleapis.com/document_write_count\" OR metric.type=\"firestore.googleapis.com/document_delete_count\" resource.type=\"firestore_instance\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": [
                      "metric.type"
                    ],
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Operations/min",
            "scale": "LINEAR"
          }
        }
      }
    ]
  }
}
EOL

# Create dashboard using the definition file
gcloud monitoring dashboards create --config-from-file=${DASHBOARD_FILE}

echo -e "${GREEN}Created monitoring dashboard${NC}"
rm ${DASHBOARD_FILE}

# Create SLOs
echo -e "\n${BLUE}Creating Service Level Objectives (SLOs)...${NC}"

# API Availability SLO
gcloud alpha monitoring slos create \
  --service=api \
  --display-name="API Availability SLO" \
  --goal=0.995 \
  --rolling-period=30d \
  --request-based \
  --method="filter=\"resource.type='cloud_run_revision' AND resource.labels.service_name='fluxori-api'\"" \
  --good-total-ratio \
  --good-service-filter="metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code_class=\"200\"" \
  --bad-service-filter="metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code_class!=\"200\""

echo -e "${GREEN}Created API Availability SLO${NC}"

# API Latency SLO
gcloud alpha monitoring slos create \
  --service=api \
  --display-name="API Latency SLO" \
  --goal=0.99 \
  --rolling-period=30d \
  --request-based \
  --method="filter=\"resource.type='cloud_run_revision' AND resource.labels.service_name='fluxori-api'\"" \
  --distribution-cut \
  --good-bad-metric-filter="metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\"" \
  --threshold=1000

echo -e "${GREEN}Created API Latency SLO${NC}"

# Frontend Availability SLO (based on uptime checks)
gcloud alpha monitoring slos create \
  --service=frontend \
  --display-name="Frontend Availability SLO" \
  --goal=0.998 \
  --rolling-period=30d \
  --windows-based \
  --method="availability"

echo -e "${GREEN}Created Frontend Availability SLO${NC}"

# Create logs-based metrics
echo -e "\n${BLUE}Creating logs-based metrics...${NC}"

# Error-level logs metric
gcloud logging metrics create application_errors \
  --description="Count of ERROR level logs from the application" \
  --log-filter="severity>=ERROR" \
  --bucket-name=application_errors

echo -e "${GREEN}Created application_errors log metric${NC}"

# Authentication failures metric
gcloud logging metrics create auth_failures \
  --description="Count of authentication failures" \
  --log-filter="textPayload:\"Authentication failed\" OR jsonPayload.message=\"Authentication failed\"" \
  --bucket-name=auth_failures

echo -e "${GREEN}Created auth_failures log metric${NC}"

# Create alert for log-based metrics
gcloud alpha monitoring policies create \
  --notification-channels=${NOTIFICATION_CHANNELS} \
  --display-name="High Application Error Rate" \
  --conditions="target=metric.type=\"logging.googleapis.com/user/application_errors\"
condition.threshold.comparison=\"COMPARISON_GT\"
condition.threshold.threshold_value=10
condition.trigger.count=1
condition.aggregations.alignment_period=300s
condition.aggregations.per_series_aligner=ALIGN_RATE" \
  --documentation="High rate of application errors detected in logs. This indicates potentially serious issues in the application."

echo -e "${GREEN}Created application error rate alert policy${NC}"

# Create South Africa-specific region performance dashboard
echo -e "\n${BLUE}Creating South Africa performance dashboard...${NC}"

# Create a temporary dashboard definition file
SA_DASHBOARD_FILE=$(mktemp)

cat > ${SA_DASHBOARD_FILE} << EOL
{
  "displayName": "South Africa Performance Dashboard",
  "gridLayout": {
    "columns": "2",
    "widgets": [
      {
        "title": "API Latency from Johannesburg",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"monitoring.googleapis.com/uptime_check/request_latency\" resource.type=\"uptime_url\" metric.label.checker_location=\"AFRICA_SOUTH\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Latency (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "API Latency Comparison (ZA vs EU)",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"monitoring.googleapis.com/uptime_check/request_latency\" resource.type=\"uptime_url\" metric.label.check_id=monitoring.regex.full_match(\".*api.*\") AND (metric.label.checker_location=\"AFRICA_SOUTH\" OR metric.label.checker_location=\"EUROPE_WEST\")",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_MEAN",
                    "groupByFields": [
                      "metric.label.checker_location"
                    ],
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Latency (ms)",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "CDN Cache Hit Ratio",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"loadbalancing.googleapis.com/https/cache/hit_count\" OR metric.type=\"loadbalancing.googleapis.com/https/cache/miss_count\" resource.type=\"https_lb_rule\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "crossSeriesReducer": "REDUCE_RATIO",
                    "numeratorFilter": "metric.type=\"loadbalancing.googleapis.com/https/cache/hit_count\"",
                    "denominatorFilter": "metric.type=\"loadbalancing.googleapis.com/https/cache/hit_count\" OR metric.type=\"loadbalancing.googleapis.com/https/cache/miss_count\"",
                    "perSeriesAligner": "ALIGN_DELTA"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Cache hit ratio",
            "scale": "LINEAR"
          }
        }
      },
      {
        "title": "Cloud Storage Operations by Region",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"storage.googleapis.com/api/request_count\" resource.type=\"gcs_bucket\" AND (resource.labels.location=\"AFRICA-SOUTH1\" OR resource.labels.location=\"EUROPE-WEST4\")",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": [
                      "resource.labels.location"
                    ],
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }
          ],
          "yAxis": {
            "label": "Operations/min",
            "scale": "LINEAR"
          }
        }
      }
    ]
  }
}
EOL

# Create South Africa dashboard using the definition file
gcloud monitoring dashboards create --config-from-file=${SA_DASHBOARD_FILE}

echo -e "${GREEN}Created South Africa performance dashboard${NC}"
rm ${SA_DASHBOARD_FILE}

echo -e "\n${BLUE}=======================================================${NC}"
echo -e "${GREEN}Monitoring setup completed successfully!${NC}"
echo -e "${BLUE}=======================================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Review the dashboards in the Google Cloud Console"
echo -e "2. Verify the alert policies and notification channels"
echo -e "3. Configure additional uptime checks for critical endpoints"
echo -e "4. Adjust alert thresholds based on baseline metrics"
echo -e "5. Set up a test alert to verify notification delivery"

exit 0