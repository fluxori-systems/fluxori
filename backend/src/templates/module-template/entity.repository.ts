import { Injectable } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { Entity } from './entity.model';

/**
 * Repository for Entity
 */
@Injectable()
export class EntityRepository extends FirestoreBaseRepository<Entity> {
  // Collection name in Firestore
  protected readonly collectionName = 'entities';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: ['organizationId', 'name', 'status'],
    });
  }
  
  /**
   * Find entities by organization ID
   * @param organizationId Organization ID
   * @returns Array of entities for the organization
   */
  async findByOrganization(organizationId: string): Promise<Entity[]> {
    return this.findAll({ organizationId });
  }
  
  /**
   * Find entities by status
   * @param status Entity status
   * @returns Array of entities with the given status
   */
  async findByStatus(status: 'active' | 'inactive'): Promise<Entity[]> {
    return this.findAll({ status });
  }
  
  /**
   * Set an entity to active status
   * @param id Entity ID
   * @returns Updated entity
   */
  async setActive(id: string): Promise<Entity | null> {
    return this.update(id, { 
      status: 'active' 
    });
  }
  
  /**
   * Set an entity to inactive status
   * @param id Entity ID
   * @returns Updated entity
   */
  async setInactive(id: string): Promise<Entity | null> {
    return this.update(id, { 
      status: 'inactive' 
    });
  }
}