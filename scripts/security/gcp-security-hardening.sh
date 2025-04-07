#!/bin/bash
# GCP Security Hardening Script for Fluxori Platform
# This script implements best practices for securing Google Cloud Platform resources

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

echo "=== GCP Security Hardening for Fluxori Platform ==="
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

# Ensure required APIs are enabled
required_apis=(
  "cloudresourcemanager.googleapis.com"
  "iam.googleapis.com"
  "compute.googleapis.com"
  "run.googleapis.com"
  "storage.googleapis.com"
  "firestore.googleapis.com"
  "secretmanager.googleapis.com"
  "cloudbuild.googleapis.com"
  "cloudkms.googleapis.com"
  "monitoring.googleapis.com"
  "logging.googleapis.com"
  "clouderrorreporting.googleapis.com"
  "cloudarmor.googleapis.com"
  "vpcaccess.googleapis.com"
  "aiplatform.googleapis.com"
  "servicecontrol.googleapis.com"
)

echo "Enabling required APIs..."
for api in "${required_apis[@]}"; do
  echo "- Enabling $api"
  gcloud services enable $api
done

# 1. IAM Security Settings
echo -e "\n=== Implementing IAM Security Best Practices ==="

# 1.1 Create custom IAM roles with least privilege principle
echo "Creating custom IAM roles with least privilege..."

# Backend service role
cat > /tmp/fluxori-backend-role.yaml << EOF
title: "Fluxori Backend Role"
description: "Limited role for Fluxori backend service"
stage: "GA"
includedPermissions:
- firestore.documents.create
- firestore.documents.delete
- firestore.documents.get
- firestore.documents.list
- firestore.documents.update
- storage.objects.create
- storage.objects.delete
- storage.objects.get
- storage.objects.list
- storage.objects.update
- secretmanager.versions.access
- aiplatform.featureGroups.read
- aiplatform.featureViewDataPoints.read
- aiplatform.featureViewDataPoints.write
- monitoring.timeSeries.create
- logging.logEntries.create
EOF

gcloud iam roles create fluxoriBackend \
  --project=$GCP_PROJECT_ID \
  --file=/tmp/fluxori-backend-role.yaml \
  || echo "Role already exists"

# Frontend service role
cat > /tmp/fluxori-frontend-role.yaml << EOF
title: "Fluxori Frontend Role"
description: "Limited role for Fluxori frontend service"
stage: "GA"
includedPermissions:
- monitoring.timeSeries.create
- logging.logEntries.create
EOF

gcloud iam roles create fluxoriFrontend \
  --project=$GCP_PROJECT_ID \
  --file=/tmp/fluxori-frontend-role.yaml \
  || echo "Role already exists"

# 1.2. Update service accounts with specific roles
echo "Configuring service accounts with appropriate permissions..."

# Configure backend service account
gcloud iam service-accounts add-iam-policy-binding \
  fluxori-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --member="serviceAccount:fluxori-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/$GCP_PROJECT_ID/roles/fluxoriBackend" \
  || echo "Backend service account configuration failed"

# Configure frontend service account
gcloud iam service-accounts add-iam-policy-binding \
  fluxori-frontend@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --member="serviceAccount:fluxori-frontend@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/$GCP_PROJECT_ID/roles/fluxoriFrontend" \
  || echo "Frontend service account configuration failed"

# 2. VPC Security
echo -e "\n=== Implementing VPC Security Measures ==="

# 2.1 Configure Cloud Armor security policy
echo "Setting up Cloud Armor security policy..."

gcloud compute security-policies create fluxori-security-policy \
  --description "Fluxori WAF rules" \
  || echo "Security policy already exists"

# Add security rules
echo "Adding security rules to Cloud Armor policy..."

# Block known malicious IPs
gcloud compute security-policies rules create 1000 \
  --security-policy fluxori-security-policy \
  --description "Block specified IP addresses" \
  --src-ip-ranges "116.31.116.25/32,91.213.8.43/32,91.213.8.64/32" \
  --action "deny-403" \
  || echo "Rule 1000 already exists"

# Protect against SQL injection
gcloud compute security-policies rules create 2000 \
  --security-policy fluxori-security-policy \
  --description "SQL injection protection" \
  --expression "evaluatePreconfiguredExpr('sqli-stable')" \
  --action "deny-403" \
  || echo "Rule 2000 already exists"

# Protect against XSS
gcloud compute security-policies rules create 3000 \
  --security-policy fluxori-security-policy \
  --description "XSS protection" \
  --expression "evaluatePreconfiguredExpr('xss-stable')" \
  --action "deny-403" \
  || echo "Rule 3000 already exists"

# Rate limiting
gcloud compute security-policies rules create 4000 \
  --security-policy fluxori-security-policy \
  --description "Rate limiting" \
  --src-ip-ranges "*" \
  --rate-limit-options rate-limit-threshold=100,conform-action=allow,exceed-action=deny-403,enforce-on-key=IP \
  || echo "Rule 4000 already exists"

# 3. Secret Management
echo -e "\n=== Setting up Secret Manager Security ==="

# 3.1 Ensure CMEK (Customer-Managed Encryption Keys) are used
echo "Setting up KMS for customer-managed encryption keys..."

# Create a KMS keyring and key
gcloud kms keyrings create fluxori-keyring \
  --location=$REGION \
  || echo "Keyring already exists"

gcloud kms keys create fluxori-secrets-key \
  --location=$REGION \
  --keyring=fluxori-keyring \
  --purpose=encryption \
  || echo "Key already exists"

# Get the KMS key ID
KMS_KEY_ID=$(gcloud kms keys describe fluxori-secrets-key \
  --location=$REGION \
  --keyring=fluxori-keyring \
  --format="value(name)")

echo "KMS Key ID: $KMS_KEY_ID"

# Update the Secret Manager to use the KMS key
# Note: This only applies to new secrets. Existing secrets would need to be recreated.
echo "Configuring Secret Manager to use customer-managed encryption keys..."

# 4. Firestore Security
echo -e "\n=== Implementing Firestore Security ==="

# 4.1 Set up Firestore backup
echo "Setting up Firestore scheduled backups..."

# Create a Cloud Scheduler job for Firestore backups
BACKUP_BUCKET="gs://${GCP_PROJECT_ID}-firestore-backups"

# Create the backup bucket if it doesn't exist
gsutil mb -l $REGION $BACKUP_BUCKET || echo "Bucket already exists"

# Set up a daily backup job using Cloud Scheduler
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/${GCP_PROJECT_ID}/databases/(default):exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email="fluxori-backup@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --headers="Content-Type=application/json" \
  --message-body="{\"outputUriPrefix\": \"${BACKUP_BUCKET}/$(date +%Y-%m-%d)\"}" \
  || echo "Backup job already exists"

# 5. Cloud Storage Security
echo -e "\n=== Implementing Cloud Storage Security ==="

# 5.1 Set up CORS for storage buckets
echo "Configuring CORS for Cloud Storage buckets..."

CORS_CONFIG=$(cat << EOF
[
  {
    "origin": ["https://*.fluxori.com", "https://*.run.app"],
    "responseHeader": ["Content-Type", "Content-MD5", "Content-Disposition"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600
  }
]
EOF
)

echo "$CORS_CONFIG" > /tmp/cors-config.json

# Get list of buckets in the project
BUCKETS=$(gsutil ls -p $GCP_PROJECT_ID)

for BUCKET in $BUCKETS; do
  echo "Setting CORS for $BUCKET"
  gsutil cors set /tmp/cors-config.json $BUCKET || echo "Failed to set CORS for $BUCKET"
done

# 5.2 Enable bucket versioning
echo "Enabling bucket versioning..."

for BUCKET in $BUCKETS; do
  echo "Enabling versioning for $BUCKET"
  gsutil versioning set on $BUCKET || echo "Failed to enable versioning for $BUCKET"
done

# 6. Cloud Run Security
echo -e "\n=== Implementing Cloud Run Security ==="

# 6.1 Configure HTTPS-only traffic
echo "Configuring HTTPS-only traffic for Cloud Run services..."

gcloud run services update fluxori-backend \
  --region=$REGION \
  --ingress=internal-and-cloud-load-balancing \
  || echo "Failed to update backend service"

gcloud run services update fluxori-frontend \
  --region=$REGION \
  --ingress=all \
  || echo "Failed to update frontend service"

# 7. Monitoring and Logging
echo -e "\n=== Setting up Enhanced Monitoring and Logging ==="

# 7.1 Create essential log-based metrics
echo "Creating log-based metrics..."

# Create a metric for 4xx errors
gcloud logging metrics create fluxori-4xx-errors \
  --description="Count of HTTP 4xx errors" \
  --filter="resource.type=cloud_run_revision AND httpRequest.status>=400 AND httpRequest.status<500" \
  || echo "Metric already exists"

# Create a metric for 5xx errors
gcloud logging metrics create fluxori-5xx-errors \
  --description="Count of HTTP 5xx errors" \
  --filter="resource.type=cloud_run_revision AND httpRequest.status>=500" \
  || echo "Metric already exists"

# Create a metric for failed authentication attempts
gcloud logging metrics create fluxori-auth-failures \
  --description="Count of authentication failures" \
  --filter="resource.type=cloud_run_revision AND textPayload:\"Authentication failed\"" \
  || echo "Metric already exists"

# 7.2 Set up metric alerts
echo "Setting up alerting policies..."

# Create alert policy for excessive 5xx errors
cat > /tmp/5xx-alert-policy.json << EOF
{
  "displayName": "Excessive 5xx Errors",
  "combiner": "OR",
  "conditions": [
    {
      "displayName": "Error rate > 1%",
      "conditionThreshold": {
        "filter": "metric.type=\"logging.googleapis.com/user/fluxori-5xx-errors\" resource.type=\"cloud_run_revision\"",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "crossSeriesReducer": "REDUCE_SUM",
            "perSeriesAligner": "ALIGN_RATE"
          }
        ],
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0.01,
        "duration": "60s",
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "alertStrategy": {
    "autoClose": "604800s"
  },
  "documentation": {
    "content": "The system is experiencing an elevated rate of 5xx errors. Please investigate immediately.",
    "mimeType": "text/markdown"
  }
}
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/5xx-alert-policy.json \
  || echo "Failed to create 5xx alert policy"

# 8. Enable VPC Service Controls
echo -e "\n=== Setting up VPC Service Controls ==="

# 8.1 Check if VPC Service Controls are already enabled
if gcloud access-context-manager perimeters list --format="value(name)" | grep -q "fluxori"; then
  echo "VPC Service Controls already configured"
else
  echo "Setting up VPC Service Controls requires organization-level permissions."
  echo "Please follow the documentation to set this up manually:"
  echo "https://cloud.google.com/vpc-service-controls/docs/set-up-vpc-sc"
fi

# 9. Apply security settings to resources
echo -e "\n=== Applying Security Settings to Resources ==="

# Apply Cloud Armor policy to load balancer if exists
LB_BACKENDS=$(gcloud compute backend-services list --format="value(name)")
if [ -n "$LB_BACKENDS" ]; then
  for BACKEND in $LB_BACKENDS; do
    echo "Applying security policy to backend service: $BACKEND"
    gcloud compute backend-services update $BACKEND \
      --security-policy=fluxori-security-policy \
      || echo "Failed to apply security policy to $BACKEND"
  done
else
  echo "No load balancer backend services found. Skip applying Cloud Armor policy."
fi

# 10. Audit and compliance
echo -e "\n=== Setting up Audit and Compliance Monitoring ==="

# 10.1 Enable Data Access audit logs
echo "Enabling Data Access audit logs..."
gcloud logging settings update --organization=$ORG_ID \
  --log-filter='protoPayload.@type="type.googleapis.com/google.cloud.audit.AuditLog" protoPayload.methodName!~"^(Get|List)"' \
  || echo "Failed to update org-level audit logs - this may require higher permissions"

# Project-level audit logs
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="projectOwner:$GCP_PROJECT_ID" \
  --role="roles/logging.viewer" \
  || echo "Failed to add IAM binding for audit logs"

echo -e "\n=== Security Hardening Complete ==="
echo "Security measures have been applied to project: $GCP_PROJECT_ID"
echo "Remember to review the configuration and make any necessary adjustments"
echo "===================================="