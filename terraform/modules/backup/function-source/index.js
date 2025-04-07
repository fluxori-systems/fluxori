/**
 * Cloud Function to trigger Fluxori backups
 * 
 * This function is designed to be triggered by Cloud Scheduler
 * to run scheduled backups of Fluxori GCP resources.
 */

const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
  backupBucket: 'fluxori-backups',
  backupPrefix: 'scheduled-backups',
  regions: {
    main: 'africa-south1',
    fallback: 'europe-west4'
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
  },
  logsBucket: 'fluxori-backup-logs'
};

/**
 * Main HTTP function handler
 */
exports.backupHandler = async (req, res) => {
  // Parse request
  const body = req.body || {};
  
  const action = body.action || 'backup';
  const target = body.target || 'all';
  const project = body.project || 'fluxori-prod';
  const backupId = body.backupId || generateBackupId(body.label);
  
  // Set up logging
  const logFile = path.join(os.tmpdir(), `backup-${backupId}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Log function start
  logMessage(logStream, 'INFO', `Starting backup operation: action=${action}, target=${target}, project=${project}, backupId=${backupId}`);
  
  try {
    // Process action
    switch (action) {
      case 'backup':
        await performBackup(target, project, backupId, logStream);
        break;
        
      case 'cleanup':
        await cleanupOldBackups(target, project, logStream);
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    
    // Upload log file to GCS
    await uploadLogFile(logFile, backupId, action, target);
    
    // Send success response
    res.status(200).send({
      status: 'success',
      message: `${action} operation completed successfully`,
      details: {
        action,
        target,
        project,
        backupId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    // Log error
    logMessage(logStream, 'ERROR', `Operation failed: ${error.message}`);
    console.error('Backup operation failed:', error);
    
    // Upload error log
    await uploadLogFile(logFile, backupId, action, target);
    
    // Send error response
    res.status(500).send({
      status: 'error',
      message: `${action} operation failed`,
      error: error.message
    });
  } finally {
    // Close log stream
    logStream.end();
  }
};

/**
 * Generate a timestamp-based backup ID
 */
function generateBackupId(label) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + 
                   new Date().toISOString().split('T')[1].substring(0, 8).replace(/[:.]/g, '');
  
  return `${timestamp}${label ? `-${label}` : ''}`;
}

/**
 * Log a message to both console and log file
 */
function logMessage(logStream, level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logEntry);
  logStream.write(logEntry + '\n');
}

/**
 * Upload log file to Cloud Storage
 */
async function uploadLogFile(logFile, backupId, action, target) {
  const storage = new Storage();
  const bucket = storage.bucket(CONFIG.logsBucket);
  
  const destination = `${action}-logs/${target}/${backupId}.log`;
  
  try {
    await bucket.upload(logFile, {
      destination: destination,
      metadata: {
        contentType: 'text/plain',
      },
    });
    
    console.log(`Log file uploaded to gs://${CONFIG.logsBucket}/${destination}`);
  } catch (error) {
    console.error('Failed to upload log file:', error);
  }
}

/**
 * Perform backup operation
 */
async function performBackup(target, project, backupId, logStream) {
  logMessage(logStream, 'INFO', `Starting backup for target: ${target}`);
  
  // Set project ID for GCP SDKs
  process.env.GOOGLE_CLOUD_PROJECT = project;
  
  if (target === 'firestore' || target === 'all') {
    await backupFirestore(project, backupId, logStream);
  }
  
  if (target === 'storage' || target === 'all') {
    await backupStorage(project, backupId, logStream);
  }
  
  logMessage(logStream, 'INFO', 'Backup completed successfully');
}

/**
 * Back up Firestore database
 */
async function backupFirestore(project, backupId, logStream) {
  logMessage(logStream, 'INFO', 'Starting Firestore backup...');
  
  const firestore = new Firestore();
  const collections = CONFIG.services.firestore.collections;
  const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.firestore.backupDir}/${backupId}`;
  
  // Create export for each collection
  for (const collection of collections) {
    const collectionPath = `${backupPath}/${collection}`;
    
    logMessage(logStream, 'INFO', `Exporting collection: ${collection}`);
    
    try {
      // Use gcloud command for export (the Firestore Admin API is not fully available in Node.js)
      const command = `gcloud firestore export ${collectionPath} \
        --collection-ids=${collection} \
        --project=${project}`;
      
      execSync(command, { stdio: 'inherit' });
      
      logMessage(logStream, 'INFO', `Collection ${collection} exported successfully`);
    } catch (error) {
      logMessage(logStream, 'ERROR', `Failed to export collection ${collection}: ${error.message}`);
      throw error;
    }
  }
  
  // Create metadata file
  const metadata = {
    timestamp: new Date().toISOString(),
    project: project,
    collections: collections,
    backupId: backupId,
    type: 'scheduled',
    region: CONFIG.regions.main
  };
  
  // Save metadata to GCS
  const storage = new Storage();
  const metadataPath = `${CONFIG.backupPrefix}/${CONFIG.services.firestore.backupDir}/${backupId}/metadata.json`;
  
  await storage.bucket(CONFIG.backupBucket).file(metadataPath).save(
    JSON.stringify(metadata, null, 2),
    { contentType: 'application/json' }
  );
  
  logMessage(logStream, 'INFO', 'Firestore backup completed successfully');
}

/**
 * Back up Cloud Storage buckets
 */
async function backupStorage(project, backupId, logStream) {
  logMessage(logStream, 'INFO', 'Starting Storage backup...');
  
  const storage = new Storage();
  const buckets = CONFIG.services.storage.buckets;
  const backupRoot = `${CONFIG.backupPrefix}/${CONFIG.services.storage.backupDir}/${backupId}`;
  
  // Create metadata
  const metadata = {
    timestamp: new Date().toISOString(),
    project: project,
    buckets: buckets,
    backupId: backupId,
    type: 'scheduled',
    region: CONFIG.regions.main
  };
  
  // Save metadata
  await storage.bucket(CONFIG.backupBucket).file(`${backupRoot}/metadata.json`).save(
    JSON.stringify(metadata, null, 2),
    { contentType: 'application/json' }
  );
  
  // Copy each bucket using gsutil for efficiency
  for (const bucketName of buckets) {
    logMessage(logStream, 'INFO', `Backing up bucket: ${bucketName}`);
    
    try {
      const command = `gsutil -m cp -r gs://${bucketName}/** gs://${CONFIG.backupBucket}/${backupRoot}/${bucketName}/`;
      execSync(command, { stdio: 'inherit' });
      
      logMessage(logStream, 'INFO', `Bucket ${bucketName} backed up successfully`);
    } catch (error) {
      logMessage(logStream, 'ERROR', `Failed to backup bucket ${bucketName}: ${error.message}`);
      throw error;
    }
  }
  
  logMessage(logStream, 'INFO', 'Storage backup completed successfully');
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanupOldBackups(target, project, logStream) {
  logMessage(logStream, 'INFO', 'Starting backup cleanup...');
  
  // Default retention period is 30 days
  const retentionDays = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  logMessage(logStream, 'INFO', `Cleaning up backups older than ${retentionDays} days (before ${cutoffDate.toISOString()})`);
  
  const storage = new Storage();
  
  // Determine which services to clean up
  const services = target === 'all' ? 
    Object.keys(CONFIG.services) : 
    [target];
  
  for (const service of services) {
    const backupDir = CONFIG.services[service]?.backupDir;
    if (!backupDir) {
      logMessage(logStream, 'WARN', `Unknown service: ${service}`);
      continue;
    }
    
    const prefix = `${CONFIG.backupPrefix}/${backupDir}/`;
    
    try {
      // List all backups for this service
      const [files] = await storage.bucket(CONFIG.backupBucket).getFiles({ prefix });
      
      // Group files by backup ID
      const backupGroups = {};
      
      for (const file of files) {
        // Extract backup ID from path (expected format: prefix/service/backupId/...)
        const pathParts = file.name.split('/');
        if (pathParts.length >= 4) {
          const backupId = pathParts[3];
          
          if (!backupGroups[backupId]) {
            backupGroups[backupId] = [];
          }
          
          backupGroups[backupId].push(file);
        }
      }
      
      // Process each backup group
      for (const [backupId, backupFiles] of Object.entries(backupGroups)) {
        // Try to find and read metadata
        const metadataFile = backupFiles.find(file => file.name.endsWith('metadata.json'));
        
        if (metadataFile) {
          try {
            // Download and parse metadata
            const [metadataContent] = await metadataFile.download();
            const metadata = JSON.parse(metadataContent.toString());
            
            // Check if this backup is older than the retention period
            const backupDate = new Date(metadata.timestamp);
            
            if (backupDate < cutoffDate) {
              logMessage(logStream, 'INFO', `Deleting old backup: ${backupId} (created ${backupDate.toISOString()})`);
              
              // Delete all files for this backup
              for (const file of backupFiles) {
                await file.delete();
              }
            } else {
              logMessage(logStream, 'DEBUG', `Keeping backup: ${backupId} (within retention period)`);
            }
          } catch (error) {
            logMessage(logStream, 'WARN', `Failed to process metadata for backup ${backupId}: ${error.message}`);
          }
        } else {
          logMessage(logStream, 'WARN', `No metadata found for backup ${backupId}, skipping`);
        }
      }
    } catch (error) {
      logMessage(logStream, 'ERROR', `Failed to list backups for ${service}: ${error.message}`);
      throw error;
    }
  }
  
  logMessage(logStream, 'INFO', 'Backup cleanup completed successfully');
}