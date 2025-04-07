/**
 * Azure Blob Storage to Google Cloud Storage Migration Script
 * 
 * This script migrates files from Azure Blob Storage to Google Cloud Storage.
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables
dotenv.config();

// Azure Blob Storage settings
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const AZURE_CONTAINERS = ['files', 'documents', 'backups']; // Containers to migrate

// Google Cloud Storage settings
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCS_BUCKETS = {
  'files': `${GCP_PROJECT_ID}-files`,
  'documents': `${GCP_PROJECT_ID}-documents`,
  'backups': `${GCP_PROJECT_ID}-backups`,
};

// Firestore settings for updating references
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'fluxori-db';
const UPDATE_REFERENCES = process.env.UPDATE_REFERENCES === 'true';

// Temporary directory for downloads
const TEMP_DIR = path.join(os.tmpdir(), 'fluxori-migration');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Track migration statistics
const stats = {
  totalFiles: 0,
  migratedFiles: 0,
  failedFiles: 0,
  skippedFiles: 0,
  startTime: new Date(),
  endTime: null,
};

/**
 * Migrate a single blob from Azure to GCS
 * @param {Object} blobItem Azure blob item
 * @param {Object} containerClient Azure container client
 * @param {Object} bucket GCS bucket
 * @param {string} containerName Azure container name
 * @returns {Object} Migration result
 */
async function migrateBlob(blobItem, containerClient, bucket, containerName) {
  stats.totalFiles++;
  
  try {
    const blobName = blobItem.name;
    console.log(`Migrating blob: ${containerName}/${blobName}`);
    
    // Create a temporary file path for the download
    const tempFilePath = path.join(TEMP_DIR, path.basename(blobName));
    
    // Download blob from Azure
    const blobClient = containerClient.getBlobClient(blobName);
    await blobClient.downloadToFile(tempFilePath);
    
    // Get blob properties
    const properties = await blobClient.getProperties();
    const contentType = properties.contentType;
    
    // Upload to Google Cloud Storage
    try {
      await bucket.upload(tempFilePath, {
        destination: blobName,
        metadata: {
          contentType,
          metadata: {
            source: 'azure-migration',
            originalUrl: blobClient.url,
            migratedAt: new Date().toISOString()
          }
        }
      });
      
      stats.migratedFiles++;
      console.log(`Successfully migrated: ${containerName}/${blobName}`);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      return {
        success: true,
        originalUrl: blobClient.url,
        newUrl: `https://storage.googleapis.com/${bucket.name}/${blobName}`,
        blobName,
        containerName
      };
    } catch (uploadError) {
      stats.failedFiles++;
      console.error(`Error uploading ${blobName} to GCS:`, uploadError);
      
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      return {
        success: false,
        error: uploadError.message,
        blobName,
        containerName
      };
    }
  } catch (error) {
    stats.failedFiles++;
    console.error(`Error migrating blob ${blobItem.name}:`, error);
    return {
      success: false,
      error: error.message,
      blobName: blobItem.name,
      containerName
    };
  }
}

/**
 * Update file references in Firestore
 * @param {Array} migrationResults Migration results
 * @param {Firestore} firestore Firestore instance
 */
async function updateFirestoreReferences(migrationResults, firestore) {
  console.log(`Updating ${migrationResults.length} file references in Firestore...`);
  
  // Create a map of old URLs to new URLs
  const urlMap = {};
  migrationResults.forEach(result => {
    if (result.success) {
      urlMap[result.originalUrl] = result.newUrl;
    }
  });
  
  // Collections that might contain file references
  const collections = [
    'products',
    'users',
    'organizations',
    'documents',
  ];
  
  let updatedDocs = 0;
  
  for (const collectionName of collections) {
    console.log(`Checking collection: ${collectionName}`);
    
    const collectionRef = firestore.collection(collectionName);
    const snapshot = await collectionRef.get();
    
    // Skip empty collections
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is empty, skipping`);
      continue;
    }
    
    // Process each document
    const batch = firestore.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let needsUpdate = false;
      
      // Check and update image URLs
      if (data.images && Array.isArray(data.images)) {
        for (let i = 0; i < data.images.length; i++) {
          const originalUrl = data.images[i];
          if (urlMap[originalUrl]) {
            data.images[i] = urlMap[originalUrl];
            needsUpdate = true;
          }
        }
      }
      
      // Check and update avatar/profileImage URLs
      if (data.avatar && urlMap[data.avatar]) {
        data.avatar = urlMap[data.avatar];
        needsUpdate = true;
      }
      
      if (data.profileImage && urlMap[data.profileImage]) {
        data.profileImage = urlMap[data.profileImage];
        needsUpdate = true;
      }
      
      // Check and update logo URLs
      if (data.logo && urlMap[data.logo]) {
        data.logo = urlMap[data.logo];
        needsUpdate = true;
      }
      
      // Check document URLs
      if (data.url && urlMap[data.url]) {
        data.url = urlMap[data.url];
        needsUpdate = true;
      }
      
      // If document needs update, add to batch
      if (needsUpdate) {
        batch.update(doc.ref, data);
        batchCount++;
        updatedDocs++;
        
        // Commit batch if it reaches 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch with ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining batch operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch with ${batchCount} updates`);
    }
  }
  
  console.log(`Updated ${updatedDocs} documents with new file references`);
}

/**
 * Migrate container from Azure to GCS
 * @param {string} containerName Azure container name
 * @param {Object} azureClient Azure blob service client
 * @param {Object} gcsClient GCS client
 * @returns {Array} Migration results
 */
async function migrateContainer(containerName, azureClient, gcsClient) {
  console.log(`\n=== Migrating container: ${containerName} ===`);
  
  try {
    // Get Azure container client
    const containerClient = azureClient.getContainerClient(containerName);
    
    // Check if container exists
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(`Container ${containerName} does not exist in Azure, skipping`);
      return [];
    }
    
    // Get GCS bucket
    const bucketName = GCS_BUCKETS[containerName];
    if (!bucketName) {
      console.log(`No matching GCS bucket defined for container ${containerName}, skipping`);
      return [];
    }
    
    let bucket = gcsClient.bucket(bucketName);
    
    // Check if bucket exists, create if not
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log(`Creating GCS bucket: ${bucketName}`);
        const [newBucket] = await gcsClient.createBucket(bucketName, {
          location: 'africa-south1',
          storageClass: 'STANDARD'
        });
        bucket = newBucket;
      }
    } catch (error) {
      console.error(`Error checking/creating GCS bucket ${bucketName}:`, error);
      throw error;
    }
    
    // List all blobs in the container
    const blobsIterator = containerClient.listBlobsFlat();
    
    const migrationResults = [];
    let count = 0;
    
    // Iterate through all blobs
    for await (const blobItem of blobsIterator) {
      count++;
      const result = await migrateBlob(blobItem, containerClient, bucket, containerName);
      migrationResults.push(result);
      
      // Log progress every 10 files
      if (count % 10 === 0) {
        console.log(`Progress: ${count} files processed`);
      }
    }
    
    console.log(`=== Completed migration of ${count} files from ${containerName} to ${bucketName} ===`);
    return migrationResults;
  } catch (error) {
    console.error(`Error migrating container ${containerName}:`, error);
    throw error;
  }
}

/**
 * Migrate all containers from Azure to GCS
 */
async function migrateStorage() {
  console.log('Starting migration from Azure Blob Storage to Google Cloud Storage');
  stats.startTime = new Date();
  
  // Initialize Azure Blob Storage client
  const azureClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
  console.log('Connected to Azure Blob Storage');
  
  // Initialize Google Cloud Storage client
  const gcsClient = new Storage({
    projectId: GCP_PROJECT_ID,
  });
  console.log('Connected to Google Cloud Storage');
  
  // Initialize Firestore client if updating references
  let firestore = null;
  if (UPDATE_REFERENCES) {
    firestore = new Firestore({
      projectId: GCP_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
    });
    console.log('Connected to Firestore for reference updates');
  }
  
  try {
    const allResults = [];
    
    // Migrate each container
    for (const container of AZURE_CONTAINERS) {
      const results = await migrateContainer(container, azureClient, gcsClient);
      allResults.push(...results);
    }
    
    // Update references in Firestore if enabled
    if (UPDATE_REFERENCES && firestore) {
      await updateFirestoreReferences(allResults, firestore);
    }
    
    // Update stats
    stats.endTime = new Date();
    const durationMs = stats.endTime - stats.startTime;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);
    
    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total files: ${stats.totalFiles}`);
    console.log(`Successfully migrated: ${stats.migratedFiles}`);
    console.log(`Failed: ${stats.failedFiles}`);
    console.log(`Skipped: ${stats.skippedFiles}`);
    console.log(`Duration: ${durationMin}m ${durationSec}s`);
    console.log('=========================\n');
    
    console.log('Storage migration completed successfully');
  } catch (error) {
    console.error('Storage migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateStorage().catch(error => {
  console.error('Storage migration script failed:', error);
  process.exit(1);
});