# Marketplace Scraper Operating Guide

This comprehensive guide explains how to operate, maintain, and troubleshoot the South African Marketplace Scraper system during a 3-week absence. It covers all critical aspects of the system, including monitoring, error handling, quota management, and emergency procedures.

## System Overview

The Marketplace Scraper is deployed on Google Cloud Platform with the following components:

- **Cloud Run Service**: Executes scraping tasks and provides REST API endpoints
- **Firestore Database**: Stores scraped data, task state, and system configuration
- **Pub/Sub**: Handles distributed task messaging
- **Cloud Scheduler**: Manages recurring task scheduling
- **Cloud Monitoring**: Provides dashboards, metrics, and alerts
- **Secret Manager**: Securely stores API credentials

The system is designed for:

- **Load Shedding Resilience**: Can detect and adapt to power outages
- **Quota Management**: Stays within 82K monthly request limit (2,700 daily)
- **Self-Healing**: Automatically recovers from most error conditions
- **Autonomous Operation**: Requires minimal human intervention

## Accessing the System

### Service URLs

- **Main Service**: `https://marketplace-scraper-[HASH]-uc.a.run.app`
- **Dashboard**: `https://console.cloud.google.com/monitoring/dashboards/custom/[DASHBOARD_ID]?project=fluxori-marketplace-data`
- **Logs**: `https://console.cloud.google.com/logs/query?project=fluxori-marketplace-data`

### Key API Endpoints

| Endpoint          | Purpose             | Authentication  | Example                                                              |
| ----------------- | ------------------- | --------------- | -------------------------------------------------------------------- |
| `/status`         | Check system status | None            | `curl https://marketplace-scraper-[HASH]-uc.a.run.app/status`        |
| `/quota`          | Check quota status  | None            | `curl https://marketplace-scraper-[HASH]-uc.a.run.app/quota`         |
| `/health`         | Health check        | None            | `curl https://marketplace-scraper-[HASH]-uc.a.run.app/health`        |
| `/daily-summary`  | Get daily stats     | None            | `curl https://marketplace-scraper-[HASH]-uc.a.run.app/daily-summary` |
| `/tasks/execute`  | Execute a task      | Service account | See examples below                                                   |
| `/tasks/schedule` | Schedule tasks      | Service account | See examples below                                                   |

## Daily Operations

Under normal circumstances, the system runs autonomously with scheduled tasks. However, there are a few daily checks you may want to perform:

### 1. Check System Status

```bash
# Check the overall system status
curl https://marketplace-scraper-[HASH]-uc.a.run.app/status

# Check quota status
curl https://marketplace-scraper-[HASH]-uc.a.run.app/quota

# Get daily summary
curl https://marketplace-scraper-[HASH]-uc.a.run.app/daily-summary
```

### 2. Review Monitoring Dashboard

1. Visit the Cloud Monitoring Dashboard
2. Key metrics to observe:
   - **Quota Usage**: Should stay below 80% of monthly allocation
   - **Success Rate**: Should remain above 80%
   - **Load Shedding Status**: Should be 0 most of the time
   - **Task Completion**: Should show regular activity patterns

### 3. Review Logs

```bash
# View recent errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=marketplace-scraper AND severity>=ERROR" --limit=20
```

## Quota Management

The system maintains a conservative quota allocation to ensure it stays within the 82,000 monthly request limit:

### Quota Distribution

| Priority Level | Allocation | Monthly Requests | Purpose                                 |
| -------------- | ---------- | ---------------- | --------------------------------------- |
| CRITICAL       | 40%        | 32,800           | Price monitoring, emergency tasks       |
| HIGH           | 30%        | 24,600           | Product details updates, daily deals    |
| MEDIUM         | 20%        | 16,400           | Category browsing, search monitoring    |
| LOW            | 5%         | 4,100            | Suggestion extraction, background tasks |
| BACKGROUND     | 5%         | 4,100            | Maintenance, cleanup                    |

### Daily Distribution

On a daily basis, the system allocates approximately 2,700 requests distributed across task types:

| Task Type         | Daily Allocation | Purpose                                |
| ----------------- | ---------------- | -------------------------------------- |
| Product refreshes | ~1,350 (50%)     | Keep product data current              |
| Daily deals       | ~270 (10%)       | Monitor deals 3x daily                 |
| Category browsing | ~540 (20%)       | Discover new products                  |
| Search monitoring | ~270 (10%)       | Track search results for keywords      |
| Suggestions       | ~135 (5%)        | Extract search suggestions             |
| System tasks      | ~135 (5%)        | Health checks, load shedding detection |

### Checking Quota Status

```bash
# Get detailed quota status
curl https://marketplace-scraper-[HASH]-uc.a.run.app/quota
```

Example response:

```json
{
  "monthly_quota": {
    "request_count": 27345,
    "total_quota": 82000,
    "remaining": 54655,
    "usage_percentage": 33.35,
    "days_remaining": 20,
    "daily_budget": 2732.75
  },
  "daily_quota": {
    "request_count": 1245,
    "total_quota": 2700,
    "remaining": 1455,
    "usage_percentage": 46.11
  },
  "priority_usage": {
    "CRITICAL": {
      "usage": 3271,
      "allocation": 0.4,
      "limit": 32800,
      "usage_percentage": 9.97
    }
    // Additional priorities...
  }
}
```

## Load Shedding Response

The system automatically detects and adapts to load shedding conditions:

### Detection Mechanisms

1. **Pattern Analysis**: Multiple consecutive network failures
2. **Timing Patterns**: Consistent with known load shedding schedules
3. **Manual Reports**: Via the Cloud Monitoring alert system

### Adaptation Responses

When load shedding is detected:

1. **Task Prioritization**: Only critical tasks continue
2. **Extended Caching**: Cache lifetime extended up to 24 hours
3. **Reduced Polling**: Background check frequency reduced
4. **Conservative Quotas**: Daily quota temporarily reduced by 30%
5. **Task Persistence**: Interrupted tasks saved for later execution

### Manual Verification

```bash
# Check load shedding status
curl https://marketplace-scraper-[HASH]-uc.a.run.app/status | jq '.scheduler.load_shedding_detected'

# If true, check when it will be considered over
curl https://marketplace-scraper-[HASH]-uc.a.run.app/status | jq '.scheduler.load_shedding_until'
```

## Common Error Scenarios and Solutions

### 1. Quota Exceeded

**Symptoms**:

- Tasks being rejected with "Quota exceeded" errors
- High quota usage in monitoring dashboard
- Quota-related alert emails

**Solutions**:

```bash
# Temporarily reduce task frequency
curl -X POST "https://marketplace-scraper-[HASH]-uc.a.run.app/tasks/execute" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
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
curl -X POST "https://marketplace-scraper-[HASH]-uc.a.run.app/tasks/execute" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
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

## Running Manual Tasks

While the system is designed to run autonomously, you may need to trigger manual tasks in certain situations:

### Extract a Specific Product

```bash
curl -X POST "https://marketplace-scraper-[HASH]-uc.a.run.app/tasks/execute" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "extract_product",
    "marketplace": "takealot",
    "params": {
      "product_id": "PLID12345678"
    },
    "priority": "HIGH"
  }'
```

### Run a Search Query

```bash
curl -X POST "https://marketplace-scraper-[HASH]-uc.a.run.app/tasks/execute" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "search",
    "marketplace": "takealot",
    "params": {
      "keyword": "smartphone",
      "page": 1,
      "limit": 20
    },
    "priority": "MEDIUM"
  }'
```

### Extract Daily Deals

```bash
curl -X POST "https://marketplace-scraper-[HASH]-uc.a.run.app/tasks/execute" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "extract_daily_deals",
    "marketplace": "takealot",
    "params": {},
    "priority": "HIGH"
  }'
```

## Emergency Recovery Procedures

In case of severe system failure:

### 1. Complete System Restart

```bash
# Stop all scheduled jobs
for JOB in daily-product-refresh daily-deals category-discovery search-monitoring load-shedding-check
do
  gcloud scheduler jobs pause marketplace-scraper-$JOB
done

# Restart the Cloud Run service
gcloud run services update marketplace-scraper --region=africa-south1 --clear-env-vars
gcloud run services update marketplace-scraper --region=africa-south1 --set-env-vars="GCP_PROJECT_ID=fluxori-marketplace-data,GCP_REGION=africa-south1"

# Resume scheduled jobs
for JOB in daily-product-refresh daily-deals category-discovery search-monitoring load-shedding-check
do
  gcloud scheduler jobs resume marketplace-scraper-$JOB
done
```

### 2. Reset Quota Tracking

If quota tracking becomes corrupted:

```bash
curl -X POST "https://marketplace-scraper-[HASH]-uc.a.run.app/tasks/execute" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "reset_quota",
    "params": {
      "monthly_usage": 27345,  # Enter actual usage from SmartProxy dashboard
      "daily_usage": 1245
    },
    "priority": "CRITICAL"
  }'
```

### 3. Emergency Contacts

For issues that cannot be resolved using this guide:

1. **Primary Support**: devops@fluxori.com
2. **SmartProxy Support**: support@smartproxy.com
3. **Google Cloud Support**: https://cloud.google.com/support

## Scheduled Maintenance Tasks

The system has the following automatic maintenance tasks:

| Task                 | Schedule        | Purpose                            |
| -------------------- | --------------- | ---------------------------------- |
| Quota redistribution | Daily at 00:00  | Rebalances quota across task types |
| Cache cleanup        | Daily at 03:00  | Purges expired cache entries       |
| Data aggregation     | Daily at 04:00  | Aggregates detailed metrics        |
| Backup creation      | Daily at 01:00  | Creates Firestore data backups     |
| Health check         | Every 5 minutes | Verifies system functionality      |

## Data Quality Monitoring

The system monitors data quality automatically:

1. **Completeness Checks**: Ensures all required fields are present
2. **Freshness Monitoring**: Alerts if data becomes stale (>24h)
3. **Consistency Validation**: Cross-references data from different sources
4. **Volume Tracking**: Monitors expected data volumes per category

You can check data quality status in the daily summary:

```bash
curl https://marketplace-scraper-[HASH]-uc.a.run.app/daily-summary | jq '.data_quality'
```

## Conclusion

This system is designed to run autonomously during your 3-week absence, handling South African market conditions including load shedding and network variability. The conservative quota settings ensure you'll remain within the 82,000 monthly limit while collecting high-value data continuously.

The built-in monitoring, alerting, and self-healing capabilities should address most issues automatically. For any unexpected problems, this guide provides comprehensive solutions to get the system back on track quickly.

If you need assistance while away, refer to the emergency contacts for support.
