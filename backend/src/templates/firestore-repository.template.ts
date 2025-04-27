import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../config/firestore.config';
import { FirestoreBaseRepository } from '../common/repositories/firestore-base.repository';
import { FirestoreEntity } from '../types/google-cloud.types';

/**
 * This is a template for implementing a repository that extends FirestoreBaseRepository.
 *
 * Use this as a reference for creating repository implementations in your modules.
 *
 * Replace 'YourEntity' with your actual entity type that extends FirestoreEntity.
 */

// Define your entity interface
export interface YourEntity extends FirestoreEntity {
  // Define your entity properties here
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  // add other properties as needed
}

/**
 * Repository implementation for YourEntity
 */
@Injectable()
export class YourEntityRepository extends FirestoreBaseRepository<YourEntity> {
  // Define the collection name - must be set in every repository
  protected readonly collectionName = 'your_entities';

  /**
   * Constructor with Firestore config service dependency
   * @param firestoreConfigService Firestore configuration service
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    // Configure the base repository with options
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes cache TTL
      requiredFields: ['name', 'status'], // Define required fields
    });
  }

  /**
   * Example of a custom query method
   * Find entities by status
   * @param status Status to filter by
   * @returns Array of entities matching the status
   */
  async findByStatus(status: 'active' | 'inactive'): Promise<YourEntity[]> {
    return this.findAll({ status });
  }

  /**
   * Example of a custom update method
   * Set an entity to active status
   * @param id Entity ID
   * @returns Updated entity or null if not found
   */
  async setActive(id: string): Promise<YourEntity | null> {
    return this.update(id, {
      status: 'active',
    });
  }

  /**
   * Example of transaction usage
   * Swap status between two entities
   * @param id1 First entity ID
   * @param id2 Second entity ID
   * @returns Success indicator
   */
  async swapStatus(id1: string, id2: string): Promise<boolean> {
    return this.withTransaction(async (transaction) => {
      // Get both documents
      const doc1Ref = this.getDocRef(id1);
      const doc2Ref = this.getDocRef(id2);

      const [doc1Snapshot, doc2Snapshot] = await Promise.all([
        transaction.get(doc1Ref),
        transaction.get(doc2Ref),
      ]);

      if (!doc1Snapshot.exists || !doc2Snapshot.exists) {
        throw new Error('One or both documents do not exist');
      }

      const doc1 = doc1Snapshot.data() as YourEntity;
      const doc2 = doc2Snapshot.data() as YourEntity;

      // Swap status
      transaction.update(doc1Ref, {
        status: doc2.status,
        updatedAt: new Date(),
      });

      transaction.update(doc2Ref, {
        status: doc1.status,
        updatedAt: new Date(),
      });

      return true;
    });
  }
}
