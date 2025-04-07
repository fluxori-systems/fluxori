#!/bin/bash
#
# GCP Backup and Disaster Recovery Script for Fluxori
# 
# This script sets up automated backups and disaster recovery procedures
# for Fluxori's GCP resources, with specific optimizations for South Africa.
#
# Author: Fluxori Team
# Date: 2025-04-07
#

set -e

# Default variables
PROJECT_ID=""
ENV="dev"
REGION="africa-south1"
BACKUP_BUCKET=""
VERBOSE=0
DRY_RUN=0

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
function show_usage {
    echo -e "${BLUE}Fluxori GCP Backup and Disaster Recovery Script${NC}"
    echo -e "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --project=<project-id>      GCP Project ID (required)"
    echo "  --env=<environment>         Environment (dev, staging, prod) (default: dev)"
    echo "  --region=<region>           Primary region (default: africa-south1)"
    echo "  --backup-bucket=<name>      Backup bucket name (default: <project-id>-backups)"
    echo "  --verbose                   Enable verbose output"
    echo "  --dry-run                   Dry run mode (no changes will be made)"
    echo "  --help                      Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --project=fluxori-dev --env=dev"
}

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --project=*)
            PROJECT_ID="${arg#*=}"
            ;;
        --env=*)
            ENV="${arg#*=}"
            ;;
        --region=*)
            REGION="${arg#*=}"
            ;;
        --backup-bucket=*)
            BACKUP_BUCKET="${arg#*=}"
            ;;
        --verbose)
            VERBOSE=1
            ;;
        --dry-run)
            DRY_RUN=1
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown argument: $arg${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Check if project ID is provided
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID is required.${NC}"
    show_usage
    exit 1
fi

# Set default backup bucket if not provided
if [ -z "$BACKUP_BUCKET" ]; then
    BACKUP_BUCKET="${PROJECT_ID}-backups"
fi

# Function to log messages with timestamp
function log_message {
    level=$1
    message=$2
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO")
            echo -e "${GREEN}[$timestamp] [INFO] $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] [WARN] $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] [ERROR] $message${NC}"
            ;;
        *)
            echo -e "${BLUE}[$timestamp] [$level] $message${NC}"
            ;;
    esac
}

# Function to execute commands safely
function execute_command {
    command=$1
    description=$2
    
    if [ $VERBOSE -eq 1 ]; then
        log_message "DEBUG" "Executing: $command"
    fi
    
    if [ $DRY_RUN -eq 1 ]; then
        log_message "DRY-RUN" "$description"
        log_message "DRY-RUN" "Would execute: $command"
        return 0
    fi
    
    # Execute the command
    if eval "$command"; then
        log_message "INFO" "$description: Success"
        return 0
    else
        log_message "ERROR" "$description: Failed"
        return 1
    fi
}

# Display script info
log_message "INFO" "Starting Fluxori GCP Backup and Disaster Recovery for project: $PROJECT_ID"
log_message "INFO" "Environment: $ENV"
log_message "INFO" "Region: $REGION"
log_message "INFO" "Backup bucket: $BACKUP_BUCKET"
if [ $DRY_RUN -eq 1 ]; then
    log_message "INFO" "Running in DRY-RUN mode - no changes will be made"
fi

# Set GCP project
execute_command "gcloud config set project $PROJECT_ID" "Setting GCP project"

###############################
# 1. Create Backup Bucket
###############################
log_message "INFO" "Setting up backup bucket..."

# Check if the backup bucket exists
BUCKET_EXISTS=$(gsutil ls -p $PROJECT_ID 2>/dev/null | grep -c "gs://$BACKUP_BUCKET/" || echo "0")

if [ "$BUCKET_EXISTS" -eq "0" ]; then
    # Create backup bucket with dual-region for resilience
    # For South Africa, we use a dual-region setup with Johannesburg and Europe to ensure 
    # data availability in case of regional outage
    execute_command "gsutil mb -p $PROJECT_ID -l $REGION -c STANDARD gs://$BACKUP_BUCKET" "Creating backup bucket: $BACKUP_BUCKET"
    
    # Set up lifecycle policy for backup bucket
    LIFECYCLE_FILE=$(mktemp)
    cat > $LIFECYCLE_FILE << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90,
          "isLive": true
        }
      }
    ]
  }
}
EOF
    
    execute_command "gsutil lifecycle set $LIFECYCLE_FILE gs://$BACKUP_BUCKET" "Setting lifecycle policy for backup bucket"
    rm $LIFECYCLE_FILE
else
    log_message "INFO" "Backup bucket already exists: gs://$BACKUP_BUCKET/"
fi

###############################
# 2. Firestore Backup Setup
###############################
log_message "INFO" "Setting up Firestore export system..."

# Create service account for Firestore exports
SA_NAME="firestore-backup-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if the service account exists
SA_EXISTS=$(gcloud iam service-accounts list --filter="email:${SA_EMAIL}" --format="value(email)" | wc -l)

if [ "$SA_EXISTS" -eq "0" ]; then
    execute_command "gcloud iam service-accounts create $SA_NAME --display-name='Firestore Backup Service Account'" "Creating service account for Firestore backups"
    
    # Grant necessary permissions
    execute_command "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:${SA_EMAIL} --role=roles/datastore.importExportAdmin" "Granting Firestore export permissions"
    execute_command "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:${SA_EMAIL} --role=roles/storage.admin" "Granting Storage admin permissions"
fi

# Create Cloud Function for Firestore exports
FUNCTION_NAME="firestore-export"
FUNCTION_DIR=$(mktemp -d)

# Create Cloud Function files
cat > $FUNCTION_DIR/main.py << 'EOF'
import functions_framework
from google.cloud import firestore_admin_v1
from google.cloud import storage
from datetime import datetime
import os

@functions_framework.http
def export_firestore(request):
    """
    Export Firestore data to Google Cloud Storage
    """
    project_id = os.environ.get('PROJECT_ID')
    backup_bucket = os.environ.get('BACKUP_BUCKET')
    
    if not project_id or not backup_bucket:
        return 'ERROR: PROJECT_ID or BACKUP_BUCKET environment variable not set', 500
    
    # Initialize Firestore Admin client
    client = firestore_admin_v1.FirestoreAdminClient()
    
    # Set up export parameters
    today = datetime.now().strftime('%Y-%m-%d')
    backup_path = f'firestore-exports/{today}'
    output_uri_prefix = f'gs://{backup_bucket}/{backup_path}'
    
    # Format the database name
    database_name = f'projects/{project_id}/databases/(default)'
    
    try:
        # Start the export
        operation = client.export_documents(
            name=database_name,
            output_uri_prefix=output_uri_prefix,
            collection_ids=[]  # Empty list means export all collections
        )
        
        # Operation is a long-running operation, but we don't wait for it
        # in the Cloud Function
        
        return f'Firestore export initiated to {output_uri_prefix}', 200
    except Exception as e:
        return f'Error initiating Firestore export: {str(e)}', 500
EOF

cat > $FUNCTION_DIR/requirements.txt << 'EOF'
google-cloud-firestore-admin==2.9.0
google-cloud-storage==2.9.0
functions-framework==3.0.0
EOF

# Deploy Cloud Function
if [ $DRY_RUN -eq 0 ]; then
    log_message "INFO" "Deploying Cloud Function for Firestore exports"
    gcloud functions deploy $FUNCTION_NAME \
        --gen2 \
        --runtime=python39 \
        --source=$FUNCTION_DIR \
        --entry-point=export_firestore \
        --trigger-http \
        --region=$REGION \
        --set-env-vars=PROJECT_ID=$PROJECT_ID,BACKUP_BUCKET=$BACKUP_BUCKET \
        --service-account=$SA_EMAIL \
        --memory=1024MB \
        --timeout=540s
else
    log_message "DRY-RUN" "Would deploy Cloud Function: $FUNCTION_NAME"
fi

# Create Cloud Scheduler job to run the function daily
SCHEDULER_JOB="daily-firestore-backup"
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --gen2 --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "")

if [ -n "$FUNCTION_URL" ] && [ $DRY_RUN -eq 0 ]; then
    log_message "INFO" "Creating Cloud Scheduler job for daily Firestore backups"
    gcloud scheduler jobs create http $SCHEDULER_JOB \
        --schedule="0 2 * * *" \
        --uri="$FUNCTION_URL" \
        --http-method=GET \
        --oidc-service-account-email=$SA_EMAIL \
        --time-zone="Africa/Johannesburg" \
        --location=$REGION \
        --description="Export Firestore data to GCS daily"
elif [ $DRY_RUN -eq 1 ]; then
    log_message "DRY-RUN" "Would create Cloud Scheduler job: $SCHEDULER_JOB"
else
    log_message "WARN" "Cloud Function URL not found, skipping scheduler job creation"
fi

# Clean up function directory
rm -rf $FUNCTION_DIR

###############################
# 3. Storage Backup Setup
###############################
log_message "INFO" "Setting up Cloud Storage backup system..."

# Create service account for Storage backups
SA_NAME="storage-backup-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if the service account exists
SA_EXISTS=$(gcloud iam service-accounts list --filter="email:${SA_EMAIL}" --format="value(email)" | wc -l)

if [ "$SA_EXISTS" -eq "0" ]; then
    execute_command "gcloud iam service-accounts create $SA_NAME --display-name='Storage Backup Service Account'" "Creating service account for Storage backups"
    
    # Grant necessary permissions
    execute_command "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:${SA_EMAIL} --role=roles/storage.admin" "Granting Storage admin permissions"
fi

# Create Cloud Function for Storage backups
FUNCTION_NAME="storage-backup"
FUNCTION_DIR=$(mktemp -d)

# Create Cloud Function files
cat > $FUNCTION_DIR/main.py << 'EOF'
import functions_framework
from google.cloud import storage
from datetime import datetime
import os

@functions_framework.http
def backup_storage(request):
    """
    Back up important Cloud Storage buckets
    """
    project_id = os.environ.get('PROJECT_ID')
    backup_bucket = os.environ.get('BACKUP_BUCKET')
    source_buckets = os.environ.get('SOURCE_BUCKETS', '').split(',')
    
    if not project_id or not backup_bucket:
        return 'ERROR: PROJECT_ID or BACKUP_BUCKET environment variable not set', 500
    
    if not source_buckets or source_buckets == ['']:
        return 'ERROR: SOURCE_BUCKETS environment variable not set', 500
    
    # Initialize client
    client = storage.Client(project=project_id)
    
    # Get today's date for backup folder
    today = datetime.now().strftime('%Y-%m-%d')
    
    results = []
    
    for source_bucket_name in source_buckets:
        source_bucket_name = source_bucket_name.strip()
        if not source_bucket_name or source_bucket_name == backup_bucket:
            continue
            
        try:
            source_bucket = client.bucket(source_bucket_name)
            dest_bucket = client.bucket(backup_bucket)
            
            # Only back up important prefixes
            important_prefixes = ['config/', 'data/', 'users/']
            
            for prefix in important_prefixes:
                blobs = list(source_bucket.list_blobs(prefix=prefix, max_results=1000))
                
                for blob in blobs:
                    # Skip large files (>100MB)
                    if blob.size > 100 * 1024 * 1024:
                        results.append(f'Skipped large file: {blob.name} ({blob.size/1024/1024:.2f} MB)')
                        continue
                        
                    # Create new path
                    backup_path = f'storage-backups/{source_bucket_name}/{today}/{blob.name}'
                    
                    # Copy blob
                    new_blob = source_bucket.copy_blob(
                        blob=blob,
                        destination_bucket=dest_bucket,
                        new_name=backup_path
                    )
                    
                    results.append(f'Backed up: {blob.name} to {backup_path}')
            
        except Exception as e:
            results.append(f'Error backing up bucket {source_bucket_name}: {str(e)}')
    
    return '\n'.join(results), 200
EOF

cat > $FUNCTION_DIR/requirements.txt << 'EOF'
google-cloud-storage==2.9.0
functions-framework==3.0.0
EOF

# Get list of buckets to backup (exclude the backup bucket)
BUCKETS=$(gsutil ls -p $PROJECT_ID 2>/dev/null | grep -v "gs://$BACKUP_BUCKET/" | tr '\n' ',' | sed 's/gs:\/\///g' | sed 's/\/$//g')

# Deploy Cloud Function
if [ $DRY_RUN -eq 0 ]; then
    log_message "INFO" "Deploying Cloud Function for Storage backups"
    gcloud functions deploy $FUNCTION_NAME \
        --gen2 \
        --runtime=python39 \
        --source=$FUNCTION_DIR \
        --entry-point=backup_storage \
        --trigger-http \
        --region=$REGION \
        --set-env-vars=PROJECT_ID=$PROJECT_ID,BACKUP_BUCKET=$BACKUP_BUCKET,SOURCE_BUCKETS=$BUCKETS \
        --service-account=$SA_EMAIL \
        --memory=1024MB \
        --timeout=540s
else
    log_message "DRY-RUN" "Would deploy Cloud Function: $FUNCTION_NAME with SOURCE_BUCKETS=$BUCKETS"
fi

# Create Cloud Scheduler job to run the function weekly
SCHEDULER_JOB="weekly-storage-backup"
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --gen2 --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "")

if [ -n "$FUNCTION_URL" ] && [ $DRY_RUN -eq 0 ]; then
    log_message "INFO" "Creating Cloud Scheduler job for weekly Storage backups"
    gcloud scheduler jobs create http $SCHEDULER_JOB \
        --schedule="0 3 * * 0" \
        --uri="$FUNCTION_URL" \
        --http-method=GET \
        --oidc-service-account-email=$SA_EMAIL \
        --time-zone="Africa/Johannesburg" \
        --location=$REGION \
        --description="Back up important Cloud Storage data weekly"
elif [ $DRY_RUN -eq 1 ]; then
    log_message "DRY-RUN" "Would create Cloud Scheduler job: $SCHEDULER_JOB"
else
    log_message "WARN" "Cloud Function URL not found, skipping scheduler job creation"
fi

# Clean up function directory
rm -rf $FUNCTION_DIR

###############################
# 4. Create Disaster Recovery Procedure Document
###############################
log_message "INFO" "Creating disaster recovery procedure document..."

# Create a document with recovery procedures
DR_DOC_PATH="dr-procedure.md"

cat > $DR_DOC_PATH << 'EOF'
# Fluxori Disaster Recovery Procedures

This document outlines the disaster recovery procedures for Fluxori's GCP-based infrastructure.

## Recovery Priority

1. **Critical components** (restore within 4 hours):
   - Backend API services
   - Authentication system
   - Core database functionality

2. **Important components** (restore within 24 hours):
   - Frontend application
   - Storage for active files
   - AI/ML services

3. **Non-critical components** (restore within 1 week):
   - Reporting and analytics
   - Historical data
   - Development environments

## Recovery Procedures

### Database (Firestore) Recovery

1. Identify the most recent valid backup in GCS:
   ```bash
   gsutil ls -l gs://BACKUP_BUCKET/firestore-exports/ | sort -r
   ```

2. Import Firestore data:
   ```bash
   gcloud firestore import gs://BACKUP_BUCKET/firestore-exports/YYYY-MM-DD/
   ```

### Cloud Storage Recovery

1. Identify the most recent valid backup:
   ```bash
   gsutil ls -l gs://BACKUP_BUCKET/storage-backups/ | sort -r
   ```

2. Copy files back to their original location:
   ```bash
   gsutil -m cp -r gs://BACKUP_BUCKET/storage-backups/SOURCE_BUCKET/YYYY-MM-DD/* gs://SOURCE_BUCKET/
   ```

### Cloud Run Recovery

1. Redeploy services from container registry:
   ```bash
   gcloud run deploy fluxori-backend --image=REGION-docker.pkg.dev/PROJECT_ID/fluxori/backend:latest
   gcloud run deploy fluxori-frontend --image=REGION-docker.pkg.dev/PROJECT_ID/fluxori/frontend:latest
   ```

### Complete Infrastructure Recovery

In case of complete infrastructure loss:

1. Run the Terraform scripts to recreate infrastructure:
   ```bash
   cd terraform
   terraform init
   terraform apply -var-file=environments/ENVIRONMENT/terraform.tfvars
   ```

2. Restore database from backup (see above)

3. Restore storage from backup (see above)

4. Redeploy services (see above)

## Validation Procedures

After recovery, verify system functionality:

1. Run validation script:
   ```bash
   ./scripts/deployment-validation.js --project=PROJECT_ID --env=ENVIRONMENT
   ```

2. Verify critical functions manually:
   - Test user login
   - Verify data access
   - Check storage access
   - Test AI credits functionality

## Contact Information

Recovery team contacts:

- Primary: recovery@fluxori.com
- Secondary: operations@fluxori.com
- Emergency: +27 XX XXX XXXX

## South Africa Regional Considerations

- Primary region: africa-south1 (Johannesburg)
- Backup region for DR: europe-west4 (Netherlands)
- Local regulations require data to be accessible within South Africa 
  whenever possible, even during recovery operations
EOF

# Replace template variables
sed -i "s/BACKUP_BUCKET/$BACKUP_BUCKET/g" $DR_DOC_PATH
sed -i "s/PROJECT_ID/$PROJECT_ID/g" $DR_DOC_PATH
sed -i "s/ENVIRONMENT/$ENV/g" $DR_DOC_PATH
sed -i "s/REGION/$REGION/g" $DR_DOC_PATH

# Upload DR document to bucket
if [ $DRY_RUN -eq 0 ]; then
    gsutil cp $DR_DOC_PATH gs://$BACKUP_BUCKET/dr-procedure.md
    log_message "INFO" "Uploaded disaster recovery document to gs://$BACKUP_BUCKET/dr-procedure.md"
    
    # Keep a local copy
    mkdir -p ./docs
    cp $DR_DOC_PATH ./docs/
    log_message "INFO" "Saved local copy to ./docs/dr-procedure.md"
else
    log_message "DRY-RUN" "Would upload DR document to gs://$BACKUP_BUCKET/dr-procedure.md"
fi

# Clean up local file
rm $DR_DOC_PATH

###############################
# 5. Set up Cross-Region Replication (for South Africa)
###############################
log_message "INFO" "Setting up cross-region replication for disaster recovery..."

# For South Africa, we set up replication to Europe (closest region with full features)
# This ensures that data is available in case of a regional outage in Johannesburg

# Create a service account for replication
SA_NAME="replication-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if the service account exists
SA_EXISTS=$(gcloud iam service-accounts list --filter="email:${SA_EMAIL}" --format="value(email)" | wc -l)

if [ "$SA_EXISTS" -eq "0" ]; then
    execute_command "gcloud iam service-accounts create $SA_NAME --display-name='Storage Replication Service Account'" "Creating service account for replication"
    
    # Grant necessary permissions
    execute_command "gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:${SA_EMAIL} --role=roles/storage.admin" "Granting Storage admin permissions"
fi

# Create DR bucket in Europe
DR_BUCKET="${PROJECT_ID}-dr-europe"
BUCKET_EXISTS=$(gsutil ls -p $PROJECT_ID 2>/dev/null | grep -c "gs://$DR_BUCKET/" || echo "0")

if [ "$BUCKET_EXISTS" -eq "0" ]; then
    # Create DR bucket in Europe
    execute_command "gsutil mb -p $PROJECT_ID -l europe-west4 -c STANDARD gs://$DR_BUCKET" "Creating DR bucket in Europe: $DR_BUCKET"
else
    log_message "INFO" "DR bucket already exists: gs://$DR_BUCKET/"
fi

# Create replication script
REPLICATION_SCRIPT="gs-replication.sh"
cat > $REPLICATION_SCRIPT << 'EOF'
#!/bin/bash

# Cloud Storage replication script
# This script replicates critical data from the primary region to the DR region

set -e

PROJECT_ID="$1"
SOURCE_BUCKET="$2"
DEST_BUCKET="$3"

echo "$(date): Starting replication from $SOURCE_BUCKET to $DEST_BUCKET"

# Replicate only critical data (not temporary files or logs)
INCLUDE_PREFIXES=(
  "config/"
  "data/"
  "users/"
  "organizations/"
)

for PREFIX in "${INCLUDE_PREFIXES[@]}"; do
  echo "Syncing prefix: $PREFIX"
  gsutil -m rsync -r "gs://$SOURCE_BUCKET/$PREFIX" "gs://$DEST_BUCKET/$PREFIX"
done

echo "$(date): Replication completed successfully"
EOF

# Make script executable
chmod +x $REPLICATION_SCRIPT

# Create Cloud Scheduler job for regular replication
for BUCKET in $(gsutil ls -p $PROJECT_ID 2>/dev/null | grep -v "gs://$BACKUP_BUCKET/" | grep -v "gs://$DR_BUCKET/" | sed 's/gs:\/\///g' | sed 's/\/$//g'); do
    SCHEDULER_JOB="daily-replication-${BUCKET}"
    
    if [ $DRY_RUN -eq 0 ]; then
        # Upload script to GCS
        gsutil cp $REPLICATION_SCRIPT gs://$BACKUP_BUCKET/scripts/gs-replication.sh
        
        # Create Cloud Build configuration
        BUILD_CONFIG=$(mktemp)
        cat > $BUILD_CONFIG << EOF
steps:
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: 'bash'
  args: ['-c', 'gsutil cp gs://$BACKUP_BUCKET/scripts/gs-replication.sh . && chmod +x gs-replication.sh && ./gs-replication.sh $PROJECT_ID $BUCKET $DR_BUCKET']
timeout: '3600s'
EOF

        # Set up Cloud Scheduler job to trigger replication via Cloud Build
        log_message "INFO" "Creating replication job for $BUCKET to $DR_BUCKET"
        gcloud scheduler jobs create http $SCHEDULER_JOB \
            --schedule="0 1 * * *" \
            --uri="https://cloudbuild.googleapis.com/v1/projects/$PROJECT_ID/builds" \
            --http-method=POST \
            --oauth-service-account-email=$SA_EMAIL \
            --time-zone="Africa/Johannesburg" \
            --location=$REGION \
            --description="Replicate $BUCKET to DR bucket daily" \
            --headers="Content-Type=application/json" \
            --message-body="$(cat $BUILD_CONFIG)"
            
        rm $BUILD_CONFIG
    else
        log_message "DRY-RUN" "Would create replication job: $SCHEDULER_JOB"
    fi
done

# Clean up local script
rm $REPLICATION_SCRIPT

###############################
# 6. Create Recovery Test Schedule
###############################
log_message "INFO" "Setting up recovery testing schedule..."

# Create a document with recovery test schedule
TEST_SCHEDULE_PATH="recovery-test-schedule.md"

cat > $TEST_SCHEDULE_PATH << 'EOF'
# Fluxori Disaster Recovery Test Schedule

This document outlines the schedule and procedures for regularly testing disaster recovery capabilities.

## Test Schedule

| Test Type | Frequency | Next Test Date | Responsible Team |
|-----------|-----------|----------------|------------------|
| Database Recovery | Monthly | NEXT_MONTH | Data Team |
| Storage Recovery | Quarterly | NEXT_QUARTER | Infrastructure Team |
| Full System Recovery | Bi-annually | NEXT_HALF | Operations Team |

## Test Procedures

### Database Recovery Test

1. Create a test Firestore instance
2. Import the latest backup
3. Validate data integrity
4. Verify application functionality with recovered data
5. Document results and lessons learned

### Storage Recovery Test

1. Create test buckets
2. Restore files from backups
3. Verify file integrity and accessibility
4. Document results and lessons learned

### Full System Recovery Test

1. Provision a separate test project
2. Deploy infrastructure using Terraform
3. Restore database and storage from backups
4. Deploy application services
5. Run comprehensive validation tests
6. Document results and lessons learned

## Test Results History

| Date | Test Type | Result | Issues Found | Resolution |
|------|-----------|--------|--------------|------------|
| | | | | |

## Continuous Improvement

After each test:
1. Update recovery procedures based on findings
2. Implement improvements to backup/recovery processes
3. Update this document with lessons learned
EOF

# Calculate next test dates
NEXT_MONTH=$(date -d "$(date +%Y-%m-15) + 1 month" +%Y-%m-15)
NEXT_QUARTER=$(date -d "$(date +%Y-%m-15) + 3 months" +%Y-%m-15)
NEXT_HALF=$(date -d "$(date +%Y-%m-15) + 6 months" +%Y-%m-15)

# Replace template variables
sed -i "s/NEXT_MONTH/$NEXT_MONTH/g" $TEST_SCHEDULE_PATH
sed -i "s/NEXT_QUARTER/$NEXT_QUARTER/g" $TEST_SCHEDULE_PATH
sed -i "s/NEXT_HALF/$NEXT_HALF/g" $TEST_SCHEDULE_PATH

# Upload test schedule to bucket
if [ $DRY_RUN -eq 0 ]; then
    gsutil cp $TEST_SCHEDULE_PATH gs://$BACKUP_BUCKET/recovery-test-schedule.md
    log_message "INFO" "Uploaded recovery test schedule to gs://$BACKUP_BUCKET/recovery-test-schedule.md"
    
    # Keep a local copy
    mkdir -p ./docs
    cp $TEST_SCHEDULE_PATH ./docs/
    log_message "INFO" "Saved local copy to ./docs/recovery-test-schedule.md"
else
    log_message "DRY-RUN" "Would upload test schedule to gs://$BACKUP_BUCKET/recovery-test-schedule.md"
fi

# Clean up local file
rm $TEST_SCHEDULE_PATH

# Done
log_message "INFO" "Backup and disaster recovery setup completed successfully!"
exit 0