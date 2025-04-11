import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  Firestore,
  DocumentReference,
  Settings,
  Timestamp,
} from "@google-cloud/firestore";

import {
  FirestoreEntity,
  TypedCollectionReference,
  FirestoreDataConverter,
} from "../types/google-cloud.types";

/**
 * Implements a type-safe converter for Firestore
 */
class FirestoreConverter<T extends FirestoreEntity>
  implements FirestoreDataConverter<T>
{
  /**
   * Convert a model object to Firestore data
   */
  toFirestore(modelObject: T): Record<string, any> {
    return modelObject;
  }

  /**
   * Convert Firestore document data to a typed model object
   */
  fromFirestore(snapshot: any): T {
    const data = snapshot.data();

    // Handle timestamp conversions
    const converted: Record<string, any> = {
      ...data,
      id: snapshot.id,
    };

    // Convert Timestamp objects to JavaScript Date objects
    if (data.createdAt instanceof Timestamp) {
      converted.createdAt = data.createdAt.toDate();
    }

    if (data.updatedAt instanceof Timestamp) {
      converted.updatedAt = data.updatedAt.toDate();
    }

    if (data.deletedAt instanceof Timestamp) {
      converted.deletedAt = data.deletedAt.toDate();
    }

    return converted as T;
  }
}

/**
 * Firestore Configuration Service
 *
 * This service provides configuration and connection to Google Cloud Firestore.
 */
@Injectable()
export class FirestoreConfigService {
  private readonly firestore: Firestore;
  private readonly logger = new Logger(FirestoreConfigService.name);
  private readonly collectionPrefix: string;
  private readonly projectId: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.projectId = this.configService.get<string>("GCP_PROJECT_ID") || "";
    this.region = this.configService.get<string>("GCP_REGION") || "us-central1";
    const databaseId = this.configService.get<string>(
      "FIRESTORE_DATABASE_ID",
      "fluxori-db",
    );
    this.collectionPrefix = this.configService.get<string>(
      "FIRESTORE_COLLECTION_PREFIX",
      "",
    );

    // Configure Firestore settings
    const settings: Settings = {
      projectId: this.projectId,
      databaseId,
      ignoreUndefinedProperties: true,
    };

    // Initialize Firestore client
    this.firestore = new Firestore(settings);
    this.logger.log(
      `Initialized Firestore connection to project ${this.projectId}, database ${databaseId}, region ${this.region}`,
    );
  }

  /**
   * Get the Firestore client instance
   */
  getFirestore(): Firestore {
    return this.firestore;
  }

  /**
   * Get a Firestore collection with the correct prefix
   * @param collectionName Base collection name
   * @returns Firestore collection reference
   */
  getCollection<T extends FirestoreEntity>(
    collectionName: string,
  ): TypedCollectionReference<T> {
    const fullCollectionName = this.collectionPrefix
      ? `${this.collectionPrefix}_${collectionName}`
      : collectionName;

    // Use the converter for type safety
    return this.firestore
      .collection(fullCollectionName)
      .withConverter(
        new FirestoreConverter<T>(),
      ) as TypedCollectionReference<T>;
  }

  /**
   * Create a document reference
   * @param collectionName Collection name
   * @param documentId Document ID
   * @returns Firestore document reference
   */
  getDocument<T extends FirestoreEntity>(
    collectionName: string,
    documentId: string,
  ): DocumentReference<T> {
    return this.getCollection<T>(collectionName).doc(
      documentId,
    ) as DocumentReference<T>;
  }

  /**
   * Generate a full collection name with prefix
   * @param collectionName Base collection name
   * @returns Full collection name with prefix
   */
  getCollectionName(collectionName: string): string {
    return this.collectionPrefix
      ? `${this.collectionPrefix}_${collectionName}`
      : collectionName;
  }

  /**
   * Get the GCP project ID
   * @returns Project ID string
   */
  getProjectId(): string {
    return this.projectId;
  }

  /**
   * Get the GCP region
   * @returns Region string
   */
  getRegion(): string {
    return this.region;
  }
}
