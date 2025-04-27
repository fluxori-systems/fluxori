#!/usr/bin/env node

/**
 * Backup and Restore Script for Fluxori GCP Resources
 *
 * This script provides automated backup and restore functionality for:
 * - Firestore databases
 * - Cloud Storage buckets
 * - Cloud SQL databases (if used)
 *
 * It supports scheduled backups and point-in-time recovery.
 *
 * Usage:
 *   node backup-and-restore.js --action=backup --target=firestore --project=my-project
 *   node backup-and-restore.js --action=restore --target=firestore --project=my-project --backupId=20250407-120000
 */

const { program } = require("commander");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  backupBucket: "fluxori-backups",
  backupPrefix: "scheduled-backups",
  backupRetentionDays: 30, // How many days to keep backups
  regions: {
    main: "africa-south1",
    fallback: "europe-west4",
  },
  services: {
    firestore: {
      collections: [
        "users",
        "organizations",
        "products",
        "orders",
        "insights",
        "documents",
      ],
      backupDir: "firestore",
    },
    storage: {
      buckets: [
        "fluxori-user-uploads",
        "fluxori-public-assets",
        "fluxori-documents",
      ],
      backupDir: "storage",
    },
  },
};

// Configure command line interface
program
  .version("1.0.0")
  .requiredOption(
    "--action <action>",
    "Action to perform: backup, restore, list-backups, cleanup",
  )
  .requiredOption(
    "--target <target>",
    "Resource to backup/restore: firestore, storage, all",
  )
  .requiredOption("--project <project>", "GCP project ID")
  .option(
    "--backupId <backupId>",
    "Backup ID for restore (required for restore)",
  )
  .option("--dryRun", "Show what would be done without making changes")
  .option(
    "--label <label>",
    'Additional label for the backup (e.g. "pre-deployment")',
  )
  .option(
    "--destination <destination>",
    "Destination for restore (different project or location)",
  )
  .option(
    "--collections <collections>",
    "Comma-separated list of Firestore collections to backup",
  )
  .option(
    "--buckets <buckets>",
    "Comma-separated list of storage buckets to backup",
  )
  .parse(process.argv);

const options = program.opts();

// Timestamp format for backup ID if none provided
const timestamp =
  new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
  "-" +
  new Date().toISOString().split("T")[1].substring(0, 8).replace(/[:.]/g, "");

// Create a unique backup ID
const backupId =
  options.backupId || `${timestamp}${options.label ? `-${options.label}` : ""}`;

// Set GCP project
process.env.GOOGLE_CLOUD_PROJECT = options.project;

// Logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  debug: (message) => options.debug && console.log(`[DEBUG] ${message}`),
};

// Utility to execute commands
function executeCommand(command, dryRun = false) {
  logger.debug(`Executing: ${command}`);
  if (dryRun) {
    logger.info(`DRY RUN: Would execute: ${command}`);
    return "dry-run-output";
  }

  try {
    const output = execSync(command, { encoding: "utf8" });
    return output;
  } catch (error) {
    logger.error(`Command failed: ${command}`);
    logger.error(error.message);
    throw error;
  }
}

// Backup Firestore
async function backupFirestore() {
  logger.info("Starting Firestore backup...");

  const collections = options.collections
    ? options.collections.split(",")
    : CONFIG.services.firestore.collections;

  const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.firestore.backupDir}/${backupId}`;

  // Create export for each collection
  for (const collection of collections) {
    const collectionPath = `${backupPath}/${collection}`;

    const command = `gcloud firestore export ${collectionPath} \
      --collection-ids=${collection} \
      --project=${options.project} \
      --async`;

    logger.info(
      `Backing up Firestore collection '${collection}' to ${collectionPath}`,
    );
    executeCommand(command, options.dryRun);
  }

  // Create metadata file with backup details
  const metadataPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.firestore.backupDir}/${backupId}/metadata.json`;
  const metadata = {
    timestamp: new Date().toISOString(),
    project: options.project,
    collections: collections,
    backupId: backupId,
    label: options.label || "scheduled",
  };

  if (!options.dryRun) {
    // Save metadata locally and upload
    const tempFile = path.join("/tmp", `metadata-${backupId}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(metadata, null, 2));
    executeCommand(`gsutil cp ${tempFile} ${metadataPath}`, options.dryRun);
    fs.unlinkSync(tempFile);
  }

  logger.info("Firestore backup process initiated.");
  return { backupId, backupPath };
}

// Backup Cloud Storage buckets
async function backupStorage() {
  logger.info("Starting Storage backup...");

  const buckets = options.buckets
    ? options.buckets.split(",")
    : CONFIG.services.storage.buckets;

  const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.storage.backupDir}/${backupId}`;

  // Create metadata file
  const metadata = {
    timestamp: new Date().toISOString(),
    project: options.project,
    buckets: buckets,
    backupId: backupId,
    label: options.label || "scheduled",
  };

  // Copy each bucket
  for (const bucket of buckets) {
    const bucketPath = `gs://${bucket}`;
    const destPath = `${backupPath}/${bucket}`;

    const command = `gsutil -m cp -r ${bucketPath}/** ${destPath}/`;

    logger.info(`Backing up Cloud Storage bucket '${bucket}' to ${destPath}`);
    executeCommand(command, options.dryRun);
  }

  // Save metadata
  if (!options.dryRun) {
    const metadataPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.storage.backupDir}/${backupId}/metadata.json`;
    const tempFile = path.join("/tmp", `metadata-storage-${backupId}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(metadata, null, 2));
    executeCommand(`gsutil cp ${tempFile} ${metadataPath}`, options.dryRun);
    fs.unlinkSync(tempFile);
  }

  logger.info("Storage backup completed.");
  return { backupId, backupPath };
}

// Restore Firestore
async function restoreFirestore() {
  if (!options.backupId) {
    logger.error("Backup ID is required for restore operations");
    process.exit(1);
  }

  logger.info(`Starting Firestore restore from backup ID: ${options.backupId}`);
  const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.firestore.backupDir}/${options.backupId}`;

  // Verify backup exists
  try {
    executeCommand(`gsutil ls ${backupPath}`, options.dryRun);
  } catch (error) {
    logger.error(`Backup not found at ${backupPath}`);
    process.exit(1);
  }

  // Load metadata to see which collections were backed up
  const metadataPath = `${backupPath}/metadata.json`;
  let collections = CONFIG.services.firestore.collections;

  try {
    if (!options.dryRun) {
      const tempFile = path.join("/tmp", `metadata-${options.backupId}.json`);
      executeCommand(`gsutil cp ${metadataPath} ${tempFile}`, options.dryRun);
      const metadata = JSON.parse(fs.readFileSync(tempFile, "utf8"));
      collections = metadata.collections;
      fs.unlinkSync(tempFile);
    }
  } catch (error) {
    logger.warn(
      "Could not load backup metadata, using default collection list",
    );
  }

  // Destination project for restore (default is same project)
  const destProject = options.destination || options.project;

  // Execute restore for each collection
  for (const collection of collections) {
    const collectionPath = `${backupPath}/${collection}`;

    // Check if collection backup exists
    try {
      executeCommand(`gsutil ls ${collectionPath}`, options.dryRun);
    } catch (error) {
      logger.warn(`Collection backup not found at ${collectionPath}, skipping`);
      continue;
    }

    const command = `gcloud firestore import ${collectionPath} \
      --collection-ids=${collection} \
      --project=${destProject} \
      --async`;

    logger.info(
      `Restoring Firestore collection '${collection}' from ${collectionPath} to project ${destProject}`,
    );
    executeCommand(command, options.dryRun);
  }

  logger.info("Firestore restore process initiated.");
  return { backupId: options.backupId, restorePath: backupPath };
}

// Restore Cloud Storage buckets
async function restoreStorage() {
  if (!options.backupId) {
    logger.error("Backup ID is required for restore operations");
    process.exit(1);
  }

  logger.info(`Starting Storage restore from backup ID: ${options.backupId}`);
  const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${CONFIG.services.storage.backupDir}/${options.backupId}`;

  // Verify backup exists
  try {
    executeCommand(`gsutil ls ${backupPath}`, options.dryRun);
  } catch (error) {
    logger.error(`Backup not found at ${backupPath}`);
    process.exit(1);
  }

  // Load metadata
  const metadataPath = `${backupPath}/metadata.json`;
  let buckets = CONFIG.services.storage.buckets;

  try {
    if (!options.dryRun) {
      const tempFile = path.join(
        "/tmp",
        `metadata-storage-${options.backupId}.json`,
      );
      executeCommand(`gsutil cp ${metadataPath} ${tempFile}`, options.dryRun);
      const metadata = JSON.parse(fs.readFileSync(tempFile, "utf8"));
      buckets = metadata.buckets;
      fs.unlinkSync(tempFile);
    }
  } catch (error) {
    logger.warn("Could not load backup metadata, using default bucket list");
  }

  // Restore each bucket
  for (const bucket of buckets) {
    const bucketBackup = `${backupPath}/${bucket}`;

    // Check if bucket backup exists
    try {
      executeCommand(`gsutil ls ${bucketBackup}`, options.dryRun);
    } catch (error) {
      logger.warn(`Bucket backup not found at ${bucketBackup}, skipping`);
      continue;
    }

    // Destination bucket (could be in a different project)
    const destBucket = options.destination
      ? `gs://${options.destination}-${bucket.split("-").slice(1).join("-")}`
      : `gs://${bucket}`;

    // Restore files
    const command = `gsutil -m cp -r ${bucketBackup}/** ${destBucket}/`;

    logger.info(
      `Restoring Cloud Storage bucket from '${bucketBackup}' to ${destBucket}`,
    );
    executeCommand(command, options.dryRun);
  }

  logger.info("Storage restore completed.");
  return { backupId: options.backupId, restorePath: backupPath };
}

// List available backups
async function listBackups() {
  logger.info("Listing available backups:");

  // Determine which backup types to list
  const targets =
    options.target === "all" ? Object.keys(CONFIG.services) : [options.target];

  for (const target of targets) {
    const backupDir = CONFIG.services[target]?.backupDir;
    if (!backupDir) {
      logger.warn(`Unknown target: ${target}`);
      continue;
    }

    const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${backupDir}/`;

    try {
      logger.info(`\n${target.toUpperCase()} BACKUPS:`);
      const output = executeCommand(`gsutil ls ${backupPath}`, options.dryRun);

      if (!options.dryRun) {
        // Parse the output to get backup IDs
        const backups = output
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const parts = line.split("/");
            return parts[parts.length - 2]; // Extract backup ID from path
          });

        // For each backup, try to get metadata
        for (const backup of backups) {
          const metadataPath = `${backupPath}${backup}/metadata.json`;
          try {
            const tempFile = path.join("/tmp", `metadata-list-${backup}.json`);
            executeCommand(
              `gsutil cp ${metadataPath} ${tempFile}`,
              options.dryRun,
            );
            const metadata = JSON.parse(fs.readFileSync(tempFile, "utf8"));

            console.log(`  ID: ${backup}`);
            console.log(`    Timestamp: ${metadata.timestamp}`);
            console.log(`    Project: ${metadata.project}`);
            console.log(`    Label: ${metadata.label || "scheduled"}`);
            if (target === "firestore") {
              console.log(
                `    Collections: ${metadata.collections.join(", ")}`,
              );
            } else if (target === "storage") {
              console.log(`    Buckets: ${metadata.buckets.join(", ")}`);
            }
            console.log("");

            fs.unlinkSync(tempFile);
          } catch (error) {
            console.log(`  ID: ${backup} (metadata unavailable)`);
          }
        }
      }
    } catch (error) {
      logger.warn(`No backups found for ${target}`);
    }
  }
}

// Cleanup old backups
async function cleanupBackups() {
  logger.info("Starting backup cleanup...");

  // Determine retention date cutoff
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CONFIG.backupRetentionDays);
  const cutoffDateString = cutoffDate.toISOString();

  logger.info(
    `Deleting backups older than ${CONFIG.backupRetentionDays} days (before ${cutoffDateString})`,
  );

  // Determine which backup types to clean
  const targets =
    options.target === "all" ? Object.keys(CONFIG.services) : [options.target];

  for (const target of targets) {
    const backupDir = CONFIG.services[target]?.backupDir;
    if (!backupDir) {
      logger.warn(`Unknown target: ${target}`);
      continue;
    }

    const backupPath = `gs://${CONFIG.backupBucket}/${CONFIG.backupPrefix}/${backupDir}/`;

    try {
      logger.info(`\nCleaning up old ${target.toUpperCase()} backups:`);
      const output = executeCommand(`gsutil ls ${backupPath}`, options.dryRun);

      if (!options.dryRun) {
        // Parse the output to get backup IDs
        const backups = output
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const parts = line.split("/");
            return parts[parts.length - 2]; // Extract backup ID from path
          });

        // For each backup, check if it's older than retention period
        for (const backup of backups) {
          const metadataPath = `${backupPath}${backup}/metadata.json`;
          try {
            const tempFile = path.join(
              "/tmp",
              `metadata-cleanup-${backup}.json`,
            );
            executeCommand(
              `gsutil cp ${metadataPath} ${tempFile}`,
              options.dryRun,
            );
            const metadata = JSON.parse(fs.readFileSync(tempFile, "utf8"));

            const backupDate = new Date(metadata.timestamp);
            if (backupDate < cutoffDate) {
              logger.info(
                `  Deleting backup ${backup} from ${metadata.timestamp} (older than retention period)`,
              );

              // Delete the backup
              executeCommand(
                `gsutil -m rm -r ${backupPath}${backup}`,
                options.dryRun,
              );
            } else {
              logger.debug(
                `  Keeping backup ${backup} from ${metadata.timestamp} (within retention period)`,
              );
            }

            fs.unlinkSync(tempFile);
          } catch (error) {
            logger.warn(`  Couldn't process backup ${backup}, skipping`);
          }
        }
      }
    } catch (error) {
      logger.warn(`No backups found for ${target}`);
    }
  }

  logger.info("Backup cleanup completed.");
}

// Main execution
async function main() {
  try {
    switch (options.action) {
      case "backup":
        if (options.target === "firestore" || options.target === "all") {
          await backupFirestore();
        }
        if (options.target === "storage" || options.target === "all") {
          await backupStorage();
        }
        break;

      case "restore":
        if (options.target === "firestore" || options.target === "all") {
          await restoreFirestore();
        }
        if (options.target === "storage" || options.target === "all") {
          await restoreStorage();
        }
        break;

      case "list-backups":
        await listBackups();
        break;

      case "cleanup":
        await cleanupBackups();
        break;

      default:
        logger.error(`Unknown action: ${options.action}`);
        process.exit(1);
    }

    logger.info("Operation completed successfully.");
  } catch (error) {
    logger.error("Operation failed:");
    logger.error(error.message);
    process.exit(1);
  }
}

main();
