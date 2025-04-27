import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { Bundle } from '../models/bundle.model';

/**
 * Repository for product bundles
 */
@Injectable()
export class BundleRepository extends FirestoreBaseRepository<Bundle> {
  private readonly logger = new Logger(BundleRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super('bundles', firestoreConfigService);
  }

  /**
   * Find bundles by organization
   * @param organizationId Organization ID
   * @param options Query options
   */
  async findByOrganization(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    },
  ): Promise<Bundle[]> {
    try {
      // Set default options
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;

      // Create base query
      let query = this.collection.where('organizationId', '==', organizationId);

      // Add optional filters
      if (options?.isActive !== undefined) {
        query = query.where('isActive', '==', options.isActive);
      }

      // Order by creation date (newest first)
      query = query.orderBy('createdAt', 'desc');

      // Apply offset if needed
      if (offset > 0) {
        const snapshot = await query.limit(offset).get();
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      // Apply limit
      query = query.limit(limit);

      // Execute query
      const snapshot = await query.get();

      // Convert to bundles
      const bundles = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });

      return bundles;
    } catch (error) {
      this.logger.error(
        `Error finding bundles by organization: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find bundles containing a specific product
   * @param productId Product ID
   * @param organizationId Organization ID
   */
  async findBundlesWithProduct(
    productId: string,
    organizationId: string,
  ): Promise<Bundle[]> {
    try {
      // This is a simplified implementation since Firestore doesn't support direct array element queries
      // In a real implementation, consider using a secondary index or Cloud Functions to maintain this relationship

      // Get all bundles for the organization
      const bundles = await this.findByOrganization(organizationId);

      // Filter bundles containing the product
      const bundlesWithProduct = bundles.filter((bundle) =>
        bundle.components.some(
          (component) => component.productId === productId,
        ),
      );

      return bundlesWithProduct;
    } catch (error) {
      this.logger.error(
        `Error finding bundles with product: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Convert Firestore document to entity
   * @param doc Firestore document
   */
  protected docToEntity(doc: FirebaseFirestore.QueryDocumentSnapshot): Bundle {
    const data = doc.data();

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Bundle;
  }

  /**
   * Convert entity to Firestore document
   * @param entity Bundle entity
   */
  protected entityToDoc(entity: Bundle): Record<string, any> {
    // Handle dates for Firestore
    const createdAt =
      entity.createdAt instanceof Date
        ? entity.createdAt
        : new Date(entity.createdAt || Date.now());

    const updatedAt =
      entity.updatedAt instanceof Date
        ? entity.updatedAt
        : new Date(entity.updatedAt || Date.now());

    return {
      ...entity,
      createdAt,
      updatedAt,
      id: undefined, // Remove ID as Firestore stores it separately
    };
  }
}
