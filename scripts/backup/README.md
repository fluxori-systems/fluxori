# Fluxori Backup and Recovery Tools

This directory contains scripts for backing up and restoring Fluxori's GCP resources, including Firestore databases and Cloud Storage buckets.

## Features

- **Automated Backups**: Schedule regular backups of all critical data
- **Point-in-Time Recovery**: Restore data to a specific backup point
- **Multi-Resource Support**: Back up Firestore and Cloud Storage in one operation
- **Cross-Project Recovery**: Restore to a different GCP project if needed
- **Cleanup Automation**: Automatically prune old backups based on retention policy

## Prerequisites

- Node.js 14+
- Google Cloud SDK installed and configured
- Appropriate GCP permissions:
  - `roles/datastore.importExportAdmin` for Firestore operations
  - `roles/storage.admin` for Cloud Storage operations
  - Write access to the backup bucket

## Configuration

The backup configuration is defined in the `backup-and-restore.js` file:

```javascript
const CONFIG = {
  backupBucket: 'fluxori-backups',        // Destination bucket for backups
  backupPrefix: 'scheduled-backups',       // Folder prefix in the bucket
  backupRetentionDays: 30,                 // How many days to keep backups
  regions: {
    main: 'africa-south1',                 // Primary region (Johannesburg)
    fallback: 'europe-west4'               // Fallback region (Netherlands)
  },
  services: {
    firestore: {
      collections: ['users', 'organizations', 'products', 'orders', 'insights', 'documents'],
      backupDir: 'firestore'
    },
    storage: {
      buckets: ['fluxori-user-uploads', 'fluxori-public-assets', 'fluxori-documents'],
      backupDir: 'storage'
    }
  }
};
```

## Usage

### Basic Commands

```bash
# Back up all resources
npm run backup:all

# Back up specific resources
npm run backup:firestore
npm run backup:storage

# List available backups
npm run list-backups

# Clean up old backups according to retention policy
npm run cleanup

# Restore from a backup (requires modifying the command to add the backup ID)
npm run restore:all -- --backupId=BACKUP_ID
npm run restore:firestore -- --backupId=BACKUP_ID
npm run restore:storage -- --backupId=BACKUP_ID
```

### Advanced Usage

For more advanced scenarios, use the script directly:

```bash
# Backup with a custom label (e.g., pre-deployment)
node backup-and-restore.js --action=backup --target=all --project=fluxori-prod --label=pre-deployment

# Dry run to see what would happen without making changes
node backup-and-restore.js --action=backup --target=all --project=fluxori-prod --dryRun

# Restore to a different project (for disaster recovery or testing)
node backup-and-restore.js --action=restore --target=all --project=fluxori-prod --backupId=20250407-120000 --destination=fluxori-staging

# Back up specific collections or buckets
node backup-and-restore.js --action=backup --target=firestore --project=fluxori-prod --collections=users,products
node backup-and-restore.js --action=backup --target=storage --project=fluxori-prod --buckets=fluxori-user-uploads
```

## Scheduling Backups

To set up scheduled backups using Cloud Scheduler:

1. Create a Cloud Scheduler job:

```bash
gcloud scheduler jobs create http backup-firestore-daily \
  --schedule="0 2 * * *" \
  --uri="https://cloud-function-endpoint/backup" \
  --http-method=POST \
  --message-body='{"action":"backup","target":"firestore","project":"fluxori-prod"}' \
  --headers="Content-Type=application/json" \
  --time-zone="Africa/Johannesburg"
```

2. Create a corresponding Cloud Function that calls this script.

## Monitoring and Alerts

The script logs all operations to standard output. To set up monitoring:

1. Configure Cloud Logging to capture these logs
2. Set up a log-based alert for any errors in the backup process
3. Create a dashboard showing backup success/failure rates

## Disaster Recovery Procedure

In case of a catastrophic failure:

1. Assess which resources need to be restored
2. Identify the most recent viable backup:
   ```bash
   npm run list-backups
   ```
3. Restore to the production environment:
   ```bash
   npm run restore:all -- --backupId=BACKUP_ID
   ```
4. Verify system functionality after restore

For a full failover to a new project:

1. Create necessary infrastructure in the new project
2. Restore with the destination parameter:
   ```bash
   node backup-and-restore.js --action=restore --target=all --project=fluxori-prod --backupId=BACKUP_ID --destination=fluxori-failover
   ```
3. Update DNS and routing to point to the new environment