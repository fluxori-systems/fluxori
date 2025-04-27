# Fluxori Disaster Recovery Plan

This document outlines the disaster recovery procedures for the Fluxori platform hosted on Google Cloud Platform.

## Overview

The Fluxori disaster recovery plan enables quick recovery from various disaster scenarios, from individual service failures to complete region outages. The plan focuses on minimizing data loss and service downtime while providing a clear path to restore normal operations.

## Recovery Objectives

- **Recovery Point Objective (RPO)**: 24 hours (maximum acceptable data loss)
- **Recovery Time Objective (RTO)**: 4 hours (maximum acceptable downtime)

## Backup Strategy

### Automated Daily Backups

The system performs daily automated backups of all critical data using the following schedule:

- **Database (Firestore)**: Full backup at 2:00 AM SAST
- **Storage (Cloud Storage)**: Full backup at 2:30 AM SAST
- **Configuration**: Version-controlled in Git repository

Backups are stored in a dedicated GCS bucket (`fluxori-backups`) in the primary region with versioning enabled. Backup logs are stored in a separate bucket (`fluxori-backup-logs`).

### Backup Retention

- Daily backups: 30 days
- Weekly backups: 12 weeks (automated snapshot)
- Monthly backups: 12 months (manual snapshot)

## Disaster Recovery Scenarios

### Scenario 1: Individual Service Failure

Recovery steps for when a single service is experiencing issues:

1. **Assess Impact**:

   - Identify the affected service through Cloud Monitoring alerts
   - Verify impact on system functionality
   - Check logs in Cloud Logging

2. **Containment**:

   - If necessary, disable the affected service through load balancer configuration

3. **Recovery**:

   - For Cloud Run services:
     ```bash
     # Rollback to previous revision
     gcloud run services update-traffic fluxori-[service-name] \
       --to-revisions=REVISION_ID=100
     ```
   - For configuration issues:
     ```bash
     # Apply last known good configuration
     cd /path/to/terraform
     terraform apply -var-file=environments/prod/terraform.tfvars
     ```

4. **Verification**:
   - Run health checks: `curl https://api.fluxori.com/health`
   - Verify all services are operational: `gcloud run services list`
   - Run smoke tests: `cd /scripts/tests && npm run smoke`

### Scenario 2: Database Corruption or Data Loss

Recovery steps for Firestore data corruption or accidental data deletion:

1. **Assess Impact**:

   - Determine scope of data loss/corruption
   - Identify affected collections and documents

2. **Stop Data Modifications**:

   - If necessary, temporarily block write access to affected collections

3. **Recovery**:

   ```bash
   # List available backups
   cd /scripts/backup
   npm run list-backups

   # Restore specific collections
   node backup-and-restore.js \
     --action=restore \
     --target=firestore \
     --project=fluxori-prod \
     --backupId=YYYYMMDD-HHMMSS \
     --collections=affected_collection1,affected_collection2
   ```

4. **Verification**:
   - Query restored data to confirm integrity
   - Run data validation: `cd /scripts/tests && npm run validate-data`

### Scenario 3: Storage Bucket Loss or Corruption

Recovery steps for Cloud Storage data loss:

1. **Assess Impact**:

   - Determine affected buckets and files
   - Check versioning history if available

2. **Recovery**:

   ```bash
   # List available backups
   cd /scripts/backup
   npm run list-backups

   # Restore specific buckets
   node backup-and-restore.js \
     --action=restore \
     --target=storage \
     --project=fluxori-prod \
     --backupId=YYYYMMDD-HHMMSS \
     --buckets=affected_bucket1,affected_bucket2
   ```

3. **Verification**:
   - Verify file integrity and accessibility
   - Check file metadata: `gsutil stat gs://bucket/path/to/file`

### Scenario 4: Complete Region Failure

Recovery steps for a total outage in the primary region (africa-south1):

1. **Declare Disaster**:

   - Notify the disaster recovery team
   - Start tracking actions in the incident management system

2. **Activate Failover Region**:

   - Update DNS to point to failover endpoints
   - Execute region failover script:
     ```bash
     cd /scripts/disaster-recovery
     bash failover-to-region.sh europe-west4
     ```

3. **Restore Data**:

   ```bash
   # Restore data to failover project/region
   cd /scripts/backup
   node backup-and-restore.js \
     --action=restore \
     --target=all \
     --project=fluxori-prod \
     --backupId=LATEST \
     --destination=fluxori-dr
   ```

4. **Verification and Monitoring**:
   - Execute full test suite: `cd /scripts/tests && npm run full`
   - Monitor performance in new region: `gcloud monitoring dashboards describe DASHBOARD_ID`
   - Check SLO compliance: `gcloud monitoring slo list`

### Scenario 5: Accidental Configuration Change

Recovery steps for situations where a misconfiguration is deployed:

1. **Assess Impact**:

   - Identify affected infrastructure components
   - Check Terraform state history

2. **Recovery**:

   ```bash
   # Revert to previous working Terraform state
   cd /terraform
   terraform workspace select prod
   terraform state pull > terraform.tfstate.backup
   terraform apply -var-file=environments/prod/terraform.tfvars -target=AFFECTED_RESOURCE
   ```

3. **Verification**:
   - Verify configuration: `terraform plan -detailed-exitcode`
   - Check service health: `gcloud run services describe fluxori-api --format=json`

## Step-by-Step Recovery Procedures

### Data Restore from Backup

```bash
# 1. List available backups
cd /scripts/backup
npm run list-backups

# 2. Restore all data
npm run restore:all -- --backupId=YYYYMMDD-HHMMSS

# 3. Restore specific data
# Firestore only
npm run restore:firestore -- --backupId=YYYYMMDD-HHMMSS

# Storage only
npm run restore:storage -- --backupId=YYYYMMDD-HHMMSS

# 4. Advanced restore options
node backup-and-restore.js \
  --action=restore \
  --target=firestore \
  --project=fluxori-prod \
  --backupId=YYYYMMDD-HHMMSS \
  --collections=users,products \
  --destination=fluxori-staging
```

### Cloud Run Revision Rollback

```bash
# 1. List available revisions
gcloud run revisions list --service=fluxori-api --platform=managed --region=africa-south1

# 2. Rollback to specific revision
gcloud run services update-traffic fluxori-api \
  --to-revisions=REVISION_ID=100 \
  --platform=managed \
  --region=africa-south1

# 3. Verify rollback
gcloud run services describe fluxori-api --format="value(status.traffic)"
```

### Database Point-in-Time Recovery

```bash
# 1. Find available export timestamps
gsutil ls -l gs://fluxori-backups/scheduled-backups/firestore/

# 2. Perform point-in-time restore
gcloud firestore import gs://fluxori-backups/scheduled-backups/firestore/YYYYMMDD-HHMMSS/ \
  --collection-ids=users,products,orders
```

### Regional Failover Process

```bash
# 1. Switch to failover region
cd /terraform
terraform workspace select dr
terraform apply -var-file=environments/dr/terraform.tfvars -var='primary_region=europe-west4'

# 2. Update DNS
gcloud dns record-sets transaction start --zone=fluxori-zone
gcloud dns record-sets transaction update api.fluxori.com. --type=A --ttl=300 \
  --zone=fluxori-zone --rrdatas=NEW_IP_ADDRESS
gcloud dns record-sets transaction execute --zone=fluxori-zone

# 3. Restore data to failover region
cd /scripts/backup
node backup-and-restore.js --action=restore --target=all --project=fluxori-dr \
  --backupId=LATEST --destination=fluxori-dr
```

## Post-Recovery Procedures

1. **Validate System Integrity**:

   - Run full integration test suite
   - Verify data consistency
   - Check all service endpoints

2. **Performance Evaluation**:

   - Monitor system performance
   - Check for latency issues, especially for South African users
   - Verify SLO compliance

3. **Documentation and Review**:

   - Document incident timeline and response
   - Conduct post-mortem analysis
   - Update recovery plan based on learnings

4. **Return to Normal Operations**:
   - If operating in failover mode, plan return to primary region
   - Communicate status to stakeholders
   - Resume normal backup schedule

## Regular Testing

This disaster recovery plan is tested on the following schedule:

- **Table-top exercises**: Monthly
- **Backup restoration tests**: Quarterly
- **Full regional failover drill**: Bi-annually

Test results are documented and used to improve the recovery process.

## Contacts and Escalation

### Primary Contacts

- **Primary On-Call**: +27 12 345 6789
- **Secondary On-Call**: +27 12 345 6790
- **Technical Lead**: +27 12 345 6791

### Escalation Path

1. **Level 1**: Primary On-Call (15-minute response time)
2. **Level 2**: Secondary On-Call (30-minute response time)
3. **Level 3**: Technical Lead (60-minute response time)
4. **Level 4**: CTO (as required)

## Appendix

### Essential GCP Resources

- **Project IDs**:

  - Production: fluxori-prod
  - Staging: fluxori-staging
  - DR: fluxori-dr

- **Service Accounts**:

  - Backup: fluxori-backup-sa@fluxori-prod.iam.gserviceaccount.com
  - DR: fluxori-dr-sa@fluxori-dr.iam.gserviceaccount.com

- **Storage Buckets**:
  - Backup: fluxori-backups
  - Logs: fluxori-backup-logs

### Backup Verification Checklist

- [ ] Backup successfully completed within scheduled window
- [ ] All required collections were included in the backup
- [ ] Backup metadata is present and correct
- [ ] Backup can be successfully restored in test environment
- [ ] Restored data validates against schema requirements
- [ ] Application functions normally with restored data

### Recovery Testing Report Template

```
# Disaster Recovery Test Report

## Test Details
- Date: [DATE]
- Scenario Tested: [SCENARIO]
- Participants: [NAMES]

## Test Execution
- Start Time: [TIME]
- End Time: [TIME]
- Recovery Time: [DURATION]

## Results
- [ ] Successful
- [ ] Partially Successful
- [ ] Failed

## Issues Encountered
1. [ISSUE DESCRIPTION]
2. [ISSUE DESCRIPTION]

## Action Items
1. [ACTION ITEM]
2. [ACTION ITEM]

## Lessons Learned
- [INSIGHTS]
```
