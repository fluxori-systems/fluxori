/**
 * MongoDB to Firestore Migration Script
 * 
 * This script exports data from MongoDB collections and imports it into Firestore.
 * It handles the conversion of MongoDB-specific fields to Firestore format.
 */

const { MongoClient } = require('mongodb');
const { Firestore } = require('@google-cloud/firestore');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// MongoDB connection settings
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = 'fluxori';

// Firestore settings
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'fluxori-db';
const COLLECTION_PREFIX = process.env.FIRESTORE_COLLECTION_PREFIX || '';

// Collections to migrate
const collections = [
  'users',
  'organizations',
  'products',
  'warehouses',
  'stockLevels',
  'orders',
  'marketplaceCredentials',
  'buyboxStatuses',
  'buyboxHistories',
  'repricingRules',
  'insights',
  'aiModelConfigs',
  'notifications',
  'notificationSettings',
  'internationalShipments',
  'hsCodes',
  'tradeRestrictions',
  'complianceRequirements',
  'documents',
  'embeddingProviders',
];

// Collection name mapping (MongoDB to Firestore)
const collectionNameMap = {
  'users': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_users` : 'users',
  'organizations': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_organizations` : 'organizations',
  'products': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_products` : 'products',
  'warehouses': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_warehouses` : 'warehouses',
  'stockLevels': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_stockLevels` : 'stockLevels',
  'orders': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_orders` : 'orders',
  'marketplaceCredentials': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_marketplaceCredentials` : 'marketplaceCredentials',
  'buyboxStatuses': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_buyboxStatuses` : 'buyboxStatuses',
  'buyboxHistories': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_buyboxHistories` : 'buyboxHistories',
  'repricingRules': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_repricingRules` : 'repricingRules',
  'insights': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_insights` : 'insights',
  'aiModelConfigs': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_aiModelConfigs` : 'aiModelConfigs',
  'notifications': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_notifications` : 'notifications',
  'notificationSettings': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_notificationSettings` : 'notificationSettings',
  'internationalShipments': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_internationalShipments` : 'internationalShipments',
  'hsCodes': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_hsCodes` : 'hsCodes',
  'tradeRestrictions': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_tradeRestrictions` : 'tradeRestrictions',
  'complianceRequirements': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_complianceRequirements` : 'complianceRequirements',
  'documents': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_documents` : 'documents',
  'embeddingProviders': COLLECTION_PREFIX ? `${COLLECTION_PREFIX}_embeddingProviders` : 'embeddingProviders',
};

// Create a backup directory for exported data
const BACKUP_DIR = path.join(__dirname, 'backup', new Date().toISOString().replace(/:/g, '-'));
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Process a MongoDB document for Firestore
 * @param {Object} doc MongoDB document
 * @returns {Object} Processed document for Firestore
 */
function processDocument(doc) {
  // Create a copy of the document
  const processedDoc = { ...doc };
  
  // Convert MongoDB _id to Firestore id
  if (processedDoc._id) {
    processedDoc.id = processedDoc._id.toString();
    delete processedDoc._id;
  }
  
  // Remove MongoDB version field
  if (processedDoc.__v !== undefined) {
    delete processedDoc.__v;
  }
  
  // Convert MongoDB ObjectId references to strings
  Object.keys(processedDoc).forEach(key => {
    const value = processedDoc[key];
    
    // Handle ObjectId
    if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
      processedDoc[key] = value.toString();
    }
    
    // Handle arrays of ObjectIds
    if (Array.isArray(value)) {
      processedDoc[key] = value.map(item => {
        if (item && typeof item === 'object' && item._bsontype === 'ObjectID') {
          return item.toString();
        }
        return item;
      });
    }
    
    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && value._bsontype !== 'ObjectID') {
      processedDoc[key] = processDocument(value);
    }
  });
  
  return processedDoc;
}

/**
 * Export a MongoDB collection to a JSON file
 * @param {Object} db MongoDB database connection
 * @param {string} collectionName Collection name
 */
async function exportCollection(db, collectionName) {
  console.log(`Exporting collection: ${collectionName}`);
  
  try {
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    console.log(`Found ${documents.length} documents in ${collectionName}`);
    
    // Process documents for Firestore
    const processedDocuments = documents.map(doc => processDocument(doc));
    
    // Write to backup file
    const backupPath = path.join(BACKUP_DIR, `${collectionName}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(processedDocuments, null, 2));
    
    console.log(`Exported ${collectionName} to ${backupPath}`);
    
    return processedDocuments;
  } catch (error) {
    console.error(`Error exporting collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Import documents into Firestore
 * @param {Firestore} firestore Firestore instance
 * @param {string} collectionName Collection name
 * @param {Array} documents Documents to import
 */
async function importToFirestore(firestore, collectionName, documents) {
  const firestoreCollectionName = collectionNameMap[collectionName] || collectionName;
  console.log(`Importing to Firestore collection: ${firestoreCollectionName}`);
  
  const batch = firestore.batch();
  const batchSize = 500;
  const batches = Math.ceil(documents.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, documents.length);
    console.log(`Processing batch ${i+1}/${batches} (${start}-${end-1})`);
    
    // For each document in the batch
    for (let j = start; j < end; j++) {
      const doc = documents[j];
      const docId = doc.id;
      
      // Create a reference to the document
      const docRef = firestore.collection(firestoreCollectionName).doc(docId);
      
      // Add to batch
      batch.set(docRef, doc);
    }
    
    // Commit the batch
    await batch.commit();
    console.log(`Committed batch ${i+1}/${batches}`);
  }
  
  console.log(`Imported ${documents.length} documents to ${firestoreCollectionName}`);
}

/**
 * Migrate a collection from MongoDB to Firestore
 * @param {Object} mongoDb MongoDB database connection
 * @param {Firestore} firestore Firestore instance
 * @param {string} collectionName Collection name
 */
async function migrateCollection(mongoDb, firestore, collectionName) {
  console.log(`\n=== Migrating collection: ${collectionName} ===`);
  
  try {
    // Export the collection
    const documents = await exportCollection(mongoDb, collectionName);
    
    // Import to Firestore
    await importToFirestore(firestore, collectionName, documents);
    
    console.log(`=== Completed migration of ${collectionName} ===\n`);
  } catch (error) {
    console.error(`Error migrating collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Migrate all collections from MongoDB to Firestore
 */
async function migrateAllCollections() {
  console.log('Starting migration from MongoDB to Firestore');
  console.log(`MongoDB URI: ${maskUri(MONGODB_URI)}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Firestore Database ID: ${FIRESTORE_DATABASE_ID}`);
  console.log(`Collection Prefix: ${COLLECTION_PREFIX || '(none)'}`);
  console.log(`Backup Directory: ${BACKUP_DIR}`);
  
  // Create connections
  const mongoClient = new MongoClient(MONGODB_URI);
  const firestore = new Firestore({
    projectId: PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
  });
  
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    
    const mongoDb = mongoClient.db(MONGODB_DB_NAME);
    
    // Migrate each collection
    for (const collectionName of collections) {
      try {
        await migrateCollection(mongoDb, firestore, collectionName);
      } catch (error) {
        console.error(`Error migrating collection ${collectionName}. Continuing with next collection.`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log('Closed MongoDB connection');
    }
  }
}

/**
 * Mask sensitive information in URI
 * @param {string} uri URI to mask
 * @returns {string} Masked URI
 */
function maskUri(uri) {
  try {
    const url = new URL(uri);
    if (url.password) {
      url.password = '****';
    }
    return url.toString();
  } catch (error) {
    return 'Invalid URI';
  }
}

// Run the migration
migrateAllCollections().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});