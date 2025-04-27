# Fluxori Operations Runbook

This runbook provides step-by-step procedures for common operational tasks and troubleshooting scenarios for the Fluxori platform running on Google Cloud Platform.

## Table of Contents

1. [Common Operations](#common-operations)

   - [Scaling Resources](#scaling-resources)
   - [Database Operations](#database-operations)
   - [Backup and Restore](#backup-and-restore)
   - [User Management](#user-management)
   - [API Key Management](#api-key-management)

2. [Troubleshooting](#troubleshooting)

   - [API Service Issues](#api-service-issues)
   - [Frontend Issues](#frontend-issues)
   - [Database Issues](#database-issues)
   - [Storage Issues](#storage-issues)
   - [Authentication Issues](#authentication-issues)

3. [Monitoring and Alerting](#monitoring-and-alerting)

   - [Alert Response Procedures](#alert-response-procedures)
   - [Service Level Objectives](#service-level-objectives)

4. [Disaster Recovery](#disaster-recovery)
   - [Backup Verification](#backup-verification)
   - [Recovery Procedures](#recovery-procedures)

---

## Common Operations

### Scaling Resources

#### Scaling Cloud Run Services

To adjust the scaling parameters for Cloud Run services:

```bash
# Set minimum and maximum instances
gcloud run services update fluxori-backend \
  --min-instances=5 \
  --max-instances=20 \
  --region=africa-south1 \
  --project=fluxori-<environment>

# Set memory and CPU limits
gcloud run services update fluxori-backend \
  --memory=2Gi \
  --cpu=2 \
  --region=africa-south1 \
  --project=fluxori-<environment>

# Scale based on concurrency
gcloud run services update fluxori-backend \
  --concurrency=80 \
  --region=africa-south1 \
  --project=fluxori-<environment>
```

#### Scaling Firestore

Firestore scales automatically, but you can optimize performance by:

1. Adjusting index configurations:

   ```bash
   gcloud firestore indexes composite create \
     --collection-group=orders \
     --field-config field-path=createdAt,order=descending \
     --field-config field-path=status,order=ascending \
     --project=fluxori-<environment>
   ```

2. Reviewing and cleaning up unused indexes:
   ```bash
   gcloud firestore indexes composite list --project=fluxori-<environment>
   gcloud firestore indexes composite delete <INDEX_ID> --project=fluxori-<environment>
   ```

### Database Operations

#### Export Firestore Data

```bash
# Export all collections
gcloud firestore export gs://fluxori-<environment>-backup/firestore/$(date +%Y-%m-%d) \
  --collection-ids='()' \
  --project=fluxori-<environment>

# Export specific collections
gcloud firestore export gs://fluxori-<environment>-backup/firestore/$(date +%Y-%m-%d) \
  --collection-ids='users,organizations,products' \
  --project=fluxori-<environment>
```

#### Import Firestore Data

```bash
gcloud firestore import gs://fluxori-<environment>-backup/firestore/YYYY-MM-DD \
  --project=fluxori-<environment>
```

#### Query Optimization

When you notice slow queries in the logs:

1. Use the Firebase console to analyze query performance
2. Create indexes for queries that are frequently used:
   ```bash
   gcloud firestore indexes composite create \
     --collection-group=products \
     --field-config field-path=organizationId,order=ascending \
     --field-config field-path=category,order=ascending \
     --field-config field-path=price,order=ascending \
     --project=fluxori-<environment>
   ```

### Backup and Restore

#### Cloud Storage Backup

```bash
# Backup a bucket to another bucket
gsutil -m rsync -r gs://fluxori-<environment>-storage gs://fluxori-<environment>-backup/storage/$(date +%Y-%m-%d)
```

#### Cloud Storage Restore

```bash
# Restore a bucket from a backup
gsutil -m rsync -r gs://fluxori-<environment>-backup/storage/YYYY-MM-DD gs://fluxori-<environment>-storage
```

#### Full System Backup

```bash
# Run the backup script
bash scripts/backup/gcp-backup-recovery.sh --mode=backup --project=fluxori-<environment>
```

#### Full System Restore

```bash
# Run the restore script
bash scripts/backup/gcp-backup-recovery.sh --mode=restore --project=fluxori-<environment> --backup-date=YYYY-MM-DD
```

### User Management

#### Create an Admin User

```bash
# Use the admin tool
node scripts/admin/create-admin-user.js \
  --email=admin@example.com \
  --password=SecurePassword123 \
  --firstName=Admin \
  --lastName=User \
  --organizationId=org123 \
  --project=fluxori-<environment>
```

#### Reset User Password

```bash
# Reset password for a user
node scripts/admin/reset-password.js \
  --email=user@example.com \
  --newPassword=NewSecurePassword123 \
  --project=fluxori-<environment>
```

#### List Users

```bash
# List all users
node scripts/admin/list-users.js --project=fluxori-<environment>

# Filter users by organization
node scripts/admin/list-users.js --organizationId=org123 --project=fluxori-<environment>
```

### API Key Management

#### Generate API Key

```bash
# Generate API key for a user or organization
node scripts/admin/generate-api-key.js \
  --userId=user123 \
  --organizationId=org123 \
  --description="Integration key" \
  --project=fluxori-<environment>
```

#### Revoke API Key

```bash
# Revoke an API key
node scripts/admin/revoke-api-key.js \
  --keyId=key123 \
  --project=fluxori-<environment>
```

#### List API Keys

```bash
# List all API keys
node scripts/admin/list-api-keys.js --project=fluxori-<environment>

# List API keys for a specific organization
node scripts/admin/list-api-keys.js --organizationId=org123 --project=fluxori-<environment>
```

---

## Troubleshooting

### API Service Issues

#### API Service Unavailable

If the API service is unavailable:

1. Check Cloud Run service status:

   ```bash
   gcloud run services describe fluxori-backend \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

2. Check recent deployments:

   ```bash
   gcloud run revisions list \
     --service=fluxori-backend \
     --region=africa-south1 \
     --project=fluxori-<environment> \
     --sort-by=~createTime \
     --limit=5
   ```

3. Check logs for errors:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND severity>=ERROR' \
     --project=fluxori-<environment> \
     --limit=20
   ```

4. Rollback to a previous revision if needed:
   ```bash
   gcloud run services update-traffic fluxori-backend \
     --to-revisions=<REVISION_ID>=100 \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

#### High API Latency

If API response times are high:

1. Check Cloud Run metrics in the Google Cloud Console
2. Check if the service is hitting resource limits:

   ```bash
   gcloud run services describe fluxori-backend \
     --region=africa-south1 \
     --project=fluxori-<environment> \
     --format="json" | jq '.status.conditions[] | select(.type=="Ready")'
   ```

3. Increase resources if needed:

   ```bash
   gcloud run services update fluxori-backend \
     --memory=2Gi \
     --cpu=2 \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

4. Check database query performance in the logs:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message="Slow query"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

### Frontend Issues

#### Frontend Not Loading

If the frontend is not loading:

1. Check Cloud Run service status:

   ```bash
   gcloud run services describe fluxori-frontend \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

2. Check for JavaScript errors in the browser console
3. Verify the API URL configuration in the environment variables
4. Check for CORS issues in the browser console

#### Slow Page Loading

If pages are loading slowly:

1. Check CDN performance:

   ```bash
   # Run CDN performance test
   cd scripts/performance-tests
   npm run test:cdn
   ```

2. Check API response times:

   ```bash
   # Run API performance test
   cd scripts/performance-tests
   npm run test:api
   ```

3. Optimize image delivery:
   ```bash
   # Set correct caching headers
   gsutil -m setmeta -h "Cache-Control:public, max-age=86400" gs://fluxori-<environment>-storage/images/**/*.jpg
   ```

### Database Issues

#### Query Timeout Errors

If queries are timing out:

1. Identify the slow query from the logs:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message="Query timeout"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

2. Create an index for the query:

   ```bash
   gcloud firestore indexes composite create \
     --collection-group=<COLLECTION> \
     --field-config field-path=<FIELD1>,order=ascending \
     --field-config field-path=<FIELD2>,order=descending \
     --project=fluxori-<environment>
   ```

3. Optimize the query in the code if possible (e.g., limit the results, use pagination)

#### Data Consistency Issues

If there are data consistency issues:

1. Check for failed transactions in the logs:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message="Transaction failed"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

2. Check for concurrent updates on the same document
3. Implement retry logic for failed transactions
4. Use batch operations for bulk updates

### Storage Issues

#### File Upload Failures

If file uploads are failing:

1. Check Cloud Storage permissions:

   ```bash
   gsutil iam get gs://fluxori-<environment>-storage
   ```

2. Verify CORS configuration:

   ```bash
   gsutil cors get gs://fluxori-<environment>-storage
   ```

3. Set proper CORS configuration:

   ```bash
   cat > cors.json << EOF
   [
     {
       "origin": ["https://app.<environment>.fluxori.com"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "Authorization"],
       "maxAgeSeconds": 3600
     }
   ]
   EOF

   gsutil cors set cors.json gs://fluxori-<environment>-storage
   ```

4. Check signed URL generation in the logs:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message="Signed URL"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

#### File Access Issues

If files cannot be accessed:

1. Check file permissions:

   ```bash
   gsutil acl get gs://fluxori-<environment>-storage/<PATH_TO_FILE>
   ```

2. Set proper ACLs:

   ```bash
   # For public files
   gsutil acl ch -u AllUsers:R gs://fluxori-<environment>-storage/<PATH_TO_FILE>

   # For private files, use signed URLs instead
   ```

3. Verify the file exists:
   ```bash
   gsutil stat gs://fluxori-<environment>-storage/<PATH_TO_FILE>
   ```

### Authentication Issues

#### Login Failures

If users cannot log in:

1. Check authentication service logs:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message=~"Authentication"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

2. Verify user exists and is not locked:

   ```bash
   node scripts/admin/check-user.js --email=user@example.com --project=fluxori-<environment>
   ```

3. Verify the JWT secret is properly set:
   ```bash
   # Check Secret Manager
   gcloud secrets versions access latest --secret=jwt-secret --project=fluxori-<environment>
   ```

#### Token Verification Issues

If token verification is failing:

1. Check for clock skew between client and server
2. Verify the token is properly formed in the logs:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message=~"Token verification"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

3. Check if the token has expired
4. Refresh the JWT secret if necessary:

   ```bash
   # Generate a new JWT secret
   NEW_SECRET=$(openssl rand -base64 64)

   # Update the secret in Secret Manager
   echo -n "$NEW_SECRET" | gcloud secrets versions add jwt-secret --data-file=- --project=fluxori-<environment>

   # Restart the backend service to pick up the new secret
   gcloud run services update fluxori-backend \
     --no-traffic \
     --revision-suffix=jwt-secret-update \
     --region=africa-south1 \
     --project=fluxori-<environment>

   gcloud run services update-traffic fluxori-backend \
     --to-latest \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

---

## Monitoring and Alerting

### Alert Response Procedures

#### High Error Rate Alert

If you receive a high error rate alert:

1. Check the error logs:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND severity>=ERROR' \
     --project=fluxori-<environment> \
     --limit=50
   ```

2. Identify the most common errors
3. Check recent deployments:

   ```bash
   gcloud run revisions list \
     --service=fluxori-backend \
     --region=africa-south1 \
     --project=fluxori-<environment> \
     --sort-by=~createTime \
     --limit=5
   ```

4. Rollback if the errors started after a recent deployment:
   ```bash
   gcloud run services update-traffic fluxori-backend \
     --to-revisions=<PREVIOUS_REVISION>=100 \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

#### High Latency Alert

If you receive a high latency alert:

1. Check CPU and memory usage in Cloud Monitoring
2. Check database query performance:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.message=~"query took"' \
     --project=fluxori-<environment> \
     --limit=20
   ```

3. Identify slow endpoints:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="fluxori-backend" AND json_payload.responseTime>1000' \
     --project=fluxori-<environment> \
     --limit=20
   ```

4. Scale up resources if needed:
   ```bash
   gcloud run services update fluxori-backend \
     --memory=2Gi \
     --cpu=2 \
     --region=africa-south1 \
     --project=fluxori-<environment>
   ```

### Service Level Objectives

#### Monitoring SLOs

To check the current SLO compliance:

```bash
# List SLOs
gcloud monitoring slos list \
  --service=fluxori-backend \
  --project=fluxori-<environment>

# Describe an SLO
gcloud monitoring slos describe <SLO_ID> \
  --service=fluxori-backend \
  --project=fluxori-<environment>
```

#### Adjusting SLO Thresholds

To adjust SLO thresholds:

```bash
# Update an SLO
cat > slo.json << EOF
{
  "serviceLevelIndicator": {
    "requestBased": {
      "goodTotalRatio": {
        "totalServiceFilter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"fluxori-backend\"",
        "goodServiceFilter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"fluxori-backend\" metric.label.\"response_code_class\"=\"2xx\""
      }
    }
  },
  "goal": 0.99,
  "rollingPeriod": "86400s",
  "displayName": "99% of requests are successful over 24h"
}
EOF

gcloud monitoring slos update <SLO_ID> \
  --service=fluxori-backend \
  --slo-definition=slo.json \
  --project=fluxori-<environment>
```

---

## Disaster Recovery

### Backup Verification

To verify backups:

```bash
# List Firestore backups
gsutil ls -l gs://fluxori-<environment>-backup/firestore/

# List Cloud Storage backups
gsutil ls -l gs://fluxori-<environment>-backup/storage/

# Verify backup integrity
node scripts/backup/verify-backup.js \
  --backup-date=YYYY-MM-DD \
  --project=fluxori-<environment>
```

### Recovery Procedures

#### Full System Recovery

In case of catastrophic failure:

```bash
# Run the full recovery script
bash scripts/backup/gcp-backup-recovery.sh \
  --mode=recover \
  --backup-date=YYYY-MM-DD \
  --project=fluxori-<environment>
```

#### Partial Recovery

To recover specific data:

```bash
# Recover specific Firestore collections
gcloud firestore import gs://fluxori-<environment>-backup/firestore/YYYY-MM-DD \
  --collection-ids=users,orders \
  --project=fluxori-<environment>

# Recover specific Cloud Storage files
gsutil -m cp gs://fluxori-<environment>-backup/storage/YYYY-MM-DD/path/to/files/* gs://fluxori-<environment>-storage/path/to/files/
```

#### Cross-Region Recovery

For regional outages:

```bash
# Redirect traffic to the backup region
gcloud compute url-maps set-default-service fluxori-url-map \
  --default-service=fluxori-backend-europe-west4 \
  --project=fluxori-<environment>

# Update DNS to point to the backup region
gcloud dns record-sets transaction start --zone=fluxori-zone --project=fluxori-<environment>
gcloud dns record-sets transaction remove --zone=fluxori-zone --name=api.<environment>.fluxori.com. --ttl=300 --type=A <AFRICA_SOUTH1_IP> --project=fluxori-<environment>
gcloud dns record-sets transaction add --zone=fluxori-zone --name=api.<environment>.fluxori.com. --ttl=300 --type=A <EUROPE_WEST4_IP> --project=fluxori-<environment>
gcloud dns record-sets transaction execute --zone=fluxori-zone --project=fluxori-<environment>
```

---

## Contact Information

- **DevOps Team**: devops@fluxori.com
- **Slack Channel**: #fluxori-ops
- **Emergency Contact**: +27 12 345 6789
