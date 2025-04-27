/**
 * Google Cloud Storage Migration Validation Script
 *
 * This script validates that all files were properly migrated from Azure Blob Storage
 * to Google Cloud Storage and checks file integrity.
 */

const { BlobServiceClient } = require("@azure/storage-blob");
const { Storage } = require("@google-cloud/storage");
const { Firestore } = require("@google-cloud/firestore");
const dotenv = require("dotenv");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Load environment variables
dotenv.config();

// Azure Blob Storage settings
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const AZURE_CONTAINERS = ["files", "documents", "backups"]; // Containers to validate

// Google Cloud Storage settings
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCS_BUCKETS = {
  files: `${GCP_PROJECT_ID}-files`,
  documents: `${GCP_PROJECT_ID}-documents`,
  backups: `${GCP_PROJECT_ID}-backups`,
};

// Firestore settings for checking references
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "fluxori-db";
const CHECK_DB_REFERENCES = process.env.CHECK_DB_REFERENCES === "true";

// Temporary directory for integrity checks
const TEMP_DIR = path.join(os.tmpdir(), "fluxori-validation");

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Track validation statistics
const stats = {
  totalFiles: 0,
  matchedFiles: 0,
  missingFiles: 0,
  integrityFailed: 0,
  startTime: new Date(),
  endTime: null,
};

/**
 * Calculate MD5 hash of a file
 * @param {string} filePath Path to the file
 * @returns {string} MD5 hash as hex string
 */
function calculateFileMd5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

/**
 * Validate a single blob against GCS
 * @param {Object} blobItem Azure blob item
 * @param {Object} containerClient Azure container client
 * @param {Object} bucket GCS bucket
 * @param {string} containerName Azure container name
 * @returns {Object} Validation result
 */
async function validateBlob(blobItem, containerClient, bucket, containerName) {
  stats.totalFiles++;

  try {
    const blobName = blobItem.name;
    console.log(`Validating blob: ${containerName}/${blobName}`);

    // Check if file exists in GCS
    const file = bucket.file(blobName);
    const [exists] = await file.exists();

    if (!exists) {
      stats.missingFiles++;
      console.log(`File missing in GCS: ${containerName}/${blobName}`);
      return {
        success: false,
        error: "Missing in GCS",
        blobName,
        containerName,
        gcsPath: `gs://${bucket.name}/${blobName}`,
      };
    }

    // Validate file content integrity
    // Create temporary file paths for both downloads
    const azureTempPath = path.join(
      TEMP_DIR,
      `azure-${path.basename(blobName)}`,
    );
    const gcsTempPath = path.join(TEMP_DIR, `gcs-${path.basename(blobName)}`);

    // Download blob from Azure
    const blobClient = containerClient.getBlobClient(blobName);
    await blobClient.downloadToFile(azureTempPath);

    // Download file from GCS
    await file.download({ destination: gcsTempPath });

    // Calculate MD5 hashes
    const azureMd5 = await calculateFileMd5(azureTempPath);
    const gcsMd5 = await calculateFileMd5(gcsTempPath);

    // Compare hashes
    if (azureMd5 !== gcsMd5) {
      stats.integrityFailed++;
      console.log(`Integrity check failed for ${containerName}/${blobName}`);

      // Clean up temp files
      fs.unlinkSync(azureTempPath);
      fs.unlinkSync(gcsTempPath);

      return {
        success: false,
        error: "Integrity check failed",
        blobName,
        containerName,
        azureMd5,
        gcsMd5,
        gcsPath: `gs://${bucket.name}/${blobName}`,
      };
    }

    // Clean up temp files
    fs.unlinkSync(azureTempPath);
    fs.unlinkSync(gcsTempPath);

    stats.matchedFiles++;
    console.log(`Successfully validated: ${containerName}/${blobName}`);

    return {
      success: true,
      blobName,
      containerName,
      gcsPath: `gs://${bucket.name}/${blobName}`,
      azureUrl: blobClient.url,
      gcsUrl: `https://storage.googleapis.com/${bucket.name}/${blobName}`,
    };
  } catch (error) {
    console.error(`Error validating blob ${blobItem.name}:`, error);

    // Clean up any temp files
    const azureTempPath = path.join(
      TEMP_DIR,
      `azure-${path.basename(blobItem.name)}`,
    );
    const gcsTempPath = path.join(
      TEMP_DIR,
      `gcs-${path.basename(blobItem.name)}`,
    );

    if (fs.existsSync(azureTempPath)) {
      fs.unlinkSync(azureTempPath);
    }

    if (fs.existsSync(gcsTempPath)) {
      fs.unlinkSync(gcsTempPath);
    }

    return {
      success: false,
      error: error.message,
      blobName: blobItem.name,
      containerName,
    };
  }
}

/**
 * Check if database references have been updated
 * @param {Array} validationResults Validation results
 * @param {Firestore} firestore Firestore instance
 * @returns {Object} Reference check results
 */
async function checkDatabaseReferences(validationResults, firestore) {
  console.log(
    `Checking ${validationResults.length} file references in Firestore...`,
  );

  // Create a map of old URLs to new URLs for successful validations
  const urlMap = {};
  validationResults.forEach((result) => {
    if (result.success && result.azureUrl && result.gcsUrl) {
      urlMap[result.azureUrl] = result.gcsUrl;
    }
  });

  // Collections that might contain file references
  const collections = ["products", "users", "organizations", "documents"];

  const refResults = {
    totalReferences: 0,
    updatedReferences: 0,
    oldReferences: 0,
    documentsByCollection: {},
  };

  for (const collectionName of collections) {
    console.log(`Checking collection: ${collectionName}`);
    refResults.documentsByCollection[collectionName] = {
      checked: 0,
      withOldReferences: 0,
      oldReferencesList: [],
    };

    const collectionRef = firestore.collection(collectionName);
    const snapshot = await collectionRef.get();

    // Skip empty collections
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is empty, skipping`);
      continue;
    }

    // Process each document
    for (const doc of snapshot.docs) {
      refResults.documentsByCollection[collectionName].checked++;
      const data = doc.data();
      let hasOldReferences = false;

      // Check image URLs
      if (data.images && Array.isArray(data.images)) {
        for (const imageUrl of data.images) {
          refResults.totalReferences++;

          if (imageUrl.includes("blob.core.windows.net")) {
            // Found an Azure URL that should have been migrated
            if (urlMap[imageUrl]) {
              hasOldReferences = true;
              refResults.oldReferences++;
            }
          } else if (imageUrl.includes("storage.googleapis.com")) {
            // This reference was updated
            refResults.updatedReferences++;
          }
        }
      }

      // Check avatar/profileImage URLs
      for (const field of ["avatar", "profileImage", "logo", "url"]) {
        if (data[field]) {
          refResults.totalReferences++;

          if (data[field].includes("blob.core.windows.net")) {
            // Found an Azure URL that should have been migrated
            if (urlMap[data[field]]) {
              hasOldReferences = true;
              refResults.oldReferences++;
            }
          } else if (data[field].includes("storage.googleapis.com")) {
            // This reference was updated
            refResults.updatedReferences++;
          }
        }
      }

      // Record documents with old references
      if (hasOldReferences) {
        refResults.documentsByCollection[collectionName].withOldReferences++;
        refResults.documentsByCollection[collectionName].oldReferencesList.push(
          {
            id: doc.id,
            path: doc.ref.path,
          },
        );
      }
    }
  }

  return refResults;
}

/**
 * Validate container migration from Azure to GCS
 * @param {string} containerName Azure container name
 * @param {Object} azureClient Azure blob service client
 * @param {Object} gcsClient GCS client
 * @returns {Array} Validation results
 */
async function validateContainer(containerName, azureClient, gcsClient) {
  console.log(`\n=== Validating container: ${containerName} ===`);

  try {
    // Get Azure container client
    const containerClient = azureClient.getContainerClient(containerName);

    // Check if container exists
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(
        `Container ${containerName} does not exist in Azure, skipping`,
      );
      return [];
    }

    // Get GCS bucket
    const bucketName = GCS_BUCKETS[containerName];
    if (!bucketName) {
      console.log(
        `No matching GCS bucket defined for container ${containerName}, skipping`,
      );
      return [];
    }

    const bucket = gcsClient.bucket(bucketName);

    // Check if bucket exists
    const [bucketExists] = await bucket.exists();
    if (!bucketExists) {
      console.log(`GCS bucket ${bucketName} does not exist, skipping`);
      return [];
    }

    // List all blobs in the container
    const blobsIterator = containerClient.listBlobsFlat();

    const validationResults = [];
    let count = 0;

    // Iterate through all blobs
    for await (const blobItem of blobsIterator) {
      count++;
      const result = await validateBlob(
        blobItem,
        containerClient,
        bucket,
        containerName,
      );
      validationResults.push(result);

      // Log progress every 10 files
      if (count % 10 === 0) {
        console.log(`Progress: ${count} files validated`);
      }
    }

    console.log(
      `=== Completed validation of ${count} files from ${containerName} ===`,
    );
    return validationResults;
  } catch (error) {
    console.error(`Error validating container ${containerName}:`, error);
    throw error;
  }
}

/**
 * Validate migration of all containers from Azure to GCS
 */
async function validateMigration() {
  console.log("Starting validation of Azure to GCS migration");
  stats.startTime = new Date();

  // Initialize Azure Blob Storage client
  const azureClient = BlobServiceClient.fromConnectionString(
    AZURE_CONNECTION_STRING,
  );
  console.log("Connected to Azure Blob Storage");

  // Initialize Google Cloud Storage client
  const gcsClient = new Storage({
    projectId: GCP_PROJECT_ID,
  });
  console.log("Connected to Google Cloud Storage");

  // Initialize Firestore client if checking references
  let firestore = null;
  let refCheckResults = null;

  if (CHECK_DB_REFERENCES) {
    firestore = new Firestore({
      projectId: GCP_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
    });
    console.log("Connected to Firestore for reference checks");
  }

  try {
    const allResults = [];

    // Validate each container
    for (const container of AZURE_CONTAINERS) {
      const results = await validateContainer(
        container,
        azureClient,
        gcsClient,
      );
      allResults.push(...results);
    }

    // Check references in Firestore if enabled
    if (CHECK_DB_REFERENCES && firestore) {
      refCheckResults = await checkDatabaseReferences(allResults, firestore);
    }

    // Update stats
    stats.endTime = new Date();
    const durationMs = stats.endTime - stats.startTime;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);

    // Print summary
    console.log("\n=== Validation Summary ===");
    console.log(`Total files checked: ${stats.totalFiles}`);
    console.log(`Files matched: ${stats.matchedFiles}`);
    console.log(`Files missing in GCS: ${stats.missingFiles}`);
    console.log(`Files with integrity issues: ${stats.integrityFailed}`);
    console.log(`Duration: ${durationMin}m ${durationSec}s`);

    if (refCheckResults) {
      console.log("\n=== Database Reference Check ===");
      console.log(
        `Total references checked: ${refCheckResults.totalReferences}`,
      );
      console.log(`Updated references: ${refCheckResults.updatedReferences}`);
      console.log(`Old Azure references: ${refCheckResults.oldReferences}`);

      console.log("\nDocuments with old references by collection:");
      Object.keys(refCheckResults.documentsByCollection).forEach(
        (collection) => {
          const collStats = refCheckResults.documentsByCollection[collection];
          console.log(
            `- ${collection}: ${collStats.withOldReferences}/${collStats.checked}`,
          );

          if (collStats.withOldReferences > 0) {
            console.log("  Documents needing updates:");
            collStats.oldReferencesList.slice(0, 10).forEach((doc) => {
              console.log(`  - ${doc.path}`);
            });

            if (collStats.oldReferencesList.length > 10) {
              console.log(
                `  - ...and ${collStats.oldReferencesList.length - 10} more`,
              );
            }
          }
        },
      );
    }

    console.log("===========================\n");

    // Save detailed results to a file
    const resultsFile = path.join(
      process.cwd(),
      "migration-validation-results.json",
    );
    const resultsData = {
      stats,
      refCheckResults,
      failedFiles: allResults.filter((r) => !r.success),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
    console.log(`Detailed validation results saved to: ${resultsFile}`);

    // Return status code based on validation result
    if (stats.missingFiles > 0 || stats.integrityFailed > 0) {
      console.log("Validation found issues with the migration!");
      process.exit(1);
    } else {
      console.log("Storage migration validation completed successfully");
    }
  } catch (error) {
    console.error("Storage migration validation failed:", error);
    process.exit(1);
  }
}

// Run validation
validateMigration().catch((error) => {
  console.error("Storage migration validation script failed:", error);
  process.exit(1);
});
