import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityRepository } from './entity.repository';
import { Entity } from './entity.model';

/**
 * DTO for creating a new entity
 */
export interface CreateEntityDto {
  organizationId: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * DTO for updating an entity
 */
export interface UpdateEntityDto {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * Service for Entity operations
 */
@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(private readonly entityRepository: EntityRepository) {}

  /**
   * Create a new entity
   * @param createEntityDto Entity creation data
   * @returns Created entity
   */
  async create(createEntityDto: CreateEntityDto): Promise<Entity> {
    this.logger.log(`Creating new entity with name: ${createEntityDto.name}`);

    // Set defaults if not provided
    const data: CreateEntityDto = {
      ...createEntityDto,
      status: createEntityDto.status || 'active',
    };

    return this.entityRepository.create(data);
  }

  /**
   * Find entity by ID
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: string): Promise<Entity> {
    const entity = await this.entityRepository.findById(id);

    if (!entity) {
      this.logger.warn(`Entity with ID ${id} not found`);
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    return entity;
  }

  /**
   * Find all entities for an organization
   * @param organizationId Organization ID
   * @returns Array of entities
   */
  async findByOrganization(organizationId: string): Promise<Entity[]> {
    return this.entityRepository.findByOrganization(organizationId);
  }

  /**
   * Update an entity
   * @param id Entity ID
   * @param updateEntityDto Update data
   * @returns Updated entity
   */
  async update(id: string, updateEntityDto: UpdateEntityDto): Promise<Entity> {
    this.logger.log(`Updating entity with ID: ${id}`);

    const updated = await this.entityRepository.update(id, updateEntityDto);

    if (!updated) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Delete an entity (soft delete)
   * @param id Entity ID
   * @returns Success indicator
   */
  async delete(id: string): Promise<boolean> {
    this.logger.log(`Deleting entity with ID: ${id}`);

    const deleted = await this.entityRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    return true;
  }

  /**
   * Change entity status
   * @param id Entity ID
   * @param status New status
   * @returns Updated entity
   */
  async setStatus(id: string, status: 'active' | 'inactive'): Promise<Entity> {
    this.logger.log(`Setting entity ${id} status to: ${status}`);

    if (status === 'active') {
      return this.entityRepository.setActive(id);
    } else {
      return this.entityRepository.setInactive(id);
    }
  }
}
