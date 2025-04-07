import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { Warehouse } from '../models/warehouse.schema';
import { WarehouseType, WarehouseLocation } from '../interfaces/types';

/**
 * DTO for creating a new warehouse
 */
export interface CreateWarehouseDto {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  type: WarehouseType;
  isDefault?: boolean;
  isActive?: boolean;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessHours?: {
    monday?: { open: string; close: string; isClosed: boolean };
    tuesday?: { open: string; close: string; isClosed: boolean };
    wednesday?: { open: string; close: string; isClosed: boolean };
    thursday?: { open: string; close: string; isClosed: boolean };
    friday?: { open: string; close: string; isClosed: boolean };
    saturday?: { open: string; close: string; isClosed: boolean };
    sunday?: { open: string; close: string; isClosed: boolean };
  };
  totalCapacity?: number;
  usedCapacity?: number;
  capacityUnit?: string;
  externalId?: string;
  integrationProvider?: string;
  integrationConfig?: Record<string, any>;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * DTO for updating a warehouse
 */
export interface UpdateWarehouseDto {
  name?: string;
  description?: string;
  type?: WarehouseType;
  isActive?: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessHours?: {
    monday?: { open: string; close: string; isClosed: boolean };
    tuesday?: { open: string; close: string; isClosed: boolean };
    wednesday?: { open: string; close: string; isClosed: boolean };
    thursday?: { open: string; close: string; isClosed: boolean };
    friday?: { open: string; close: string; isClosed: boolean };
    saturday?: { open: string; close: string; isClosed: boolean };
    sunday?: { open: string; close: string; isClosed: boolean };
  };
  totalCapacity?: number;
  usedCapacity?: number;
  capacityUnit?: string;
  externalId?: string;
  integrationProvider?: string;
  integrationConfig?: Record<string, any>;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Service for warehouse operations
 */
@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);
  
  constructor(private readonly warehouseRepository: WarehouseRepository) {}
  
  /**
   * Create a new warehouse
   * @param createWarehouseDto Warehouse creation data
   * @returns Created warehouse
   */
  async createWarehouse(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    this.logger.log(`Creating new warehouse: ${createWarehouseDto.name} (${createWarehouseDto.code})`);
    
    // Check if warehouse with code already exists
    const existingWarehouse = await this.warehouseRepository.findByCode(
      createWarehouseDto.organizationId,
      createWarehouseDto.code
    );
    
    if (existingWarehouse) {
      throw new ConflictException(`Warehouse with code ${createWarehouseDto.code} already exists`);
    }
    
    // Set defaults
    const data: CreateWarehouseDto = {
      ...createWarehouseDto,
      isActive: createWarehouseDto.isActive !== undefined ? createWarehouseDto.isActive : true,
      isDefault: createWarehouseDto.isDefault || false
    };
    
    // If this is set as default, clear other defaults
    if (data.isDefault) {
      await this.clearDefaultWarehouses(data.organizationId);
    }
    
    // Create the warehouse
    return this.warehouseRepository.create(data as Warehouse);
  }
  
  /**
   * Get warehouse by ID
   * @param id Warehouse ID
   * @returns Warehouse
   */
  async getWarehouseById(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findById(id);
    
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    
    return warehouse;
  }
  
  /**
   * Get warehouse by code
   * @param organizationId Organization ID
   * @param code Warehouse code
   * @returns Warehouse
   */
  async getWarehouseByCode(organizationId: string, code: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findByCode(organizationId, code);
    
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with code ${code} not found`);
    }
    
    return warehouse;
  }
  
  /**
   * Get warehouses for an organization
   * @param organizationId Organization ID
   * @returns Array of warehouses
   */
  async getWarehouses(organizationId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.findByOrganization(organizationId);
  }
  
  /**
   * Get active warehouses for an organization
   * @param organizationId Organization ID
   * @returns Array of active warehouses
   */
  async getActiveWarehouses(organizationId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.findActiveWarehouses(organizationId);
  }
  
  /**
   * Get default warehouse for an organization
   * @param organizationId Organization ID
   * @returns Default warehouse
   */
  async getDefaultWarehouse(organizationId: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findDefaultWarehouse(organizationId);
    
    if (!warehouse) {
      throw new NotFoundException(`No default warehouse found for organization ${organizationId}`);
    }
    
    return warehouse;
  }
  
  /**
   * Update a warehouse
   * @param id Warehouse ID
   * @param updateWarehouseDto Update data
   * @returns Updated warehouse
   */
  async updateWarehouse(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    this.logger.log(`Updating warehouse with ID: ${id}`);
    
    const updated = await this.warehouseRepository.update(id, updateWarehouseDto as any);
    
    if (!updated) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    
    return updated;
  }
  
  /**
   * Set warehouse as default
   * @param id Warehouse ID
   * @returns Updated warehouse
   */
  async setAsDefaultWarehouse(id: string): Promise<Warehouse> {
    this.logger.log(`Setting warehouse ${id} as default`);
    
    // Get the warehouse to find its organization
    const warehouse = await this.getWarehouseById(id);
    
    const success = await this.warehouseRepository.setAsDefault(id, warehouse.organizationId);
    
    if (!success) {
      throw new Error(`Failed to set warehouse ${id} as default`);
    }
    
    // Return the updated warehouse
    return this.getWarehouseById(id);
  }
  
  /**
   * Delete a warehouse
   * @param id Warehouse ID
   * @returns Success indicator
   */
  async deleteWarehouse(id: string): Promise<boolean> {
    this.logger.log(`Deleting warehouse with ID: ${id}`);
    
    // Check if warehouse has stock
    const warehouse = await this.getWarehouseById(id);
    
    // TODO: Check if warehouse has stock (would need a method from stock level repository)
    
    const result = await this.warehouseRepository.delete(id);
    
    if (!result) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    
    return true;
  }
  
  /**
   * Find warehouses with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered warehouses
   */
  async findWarehousesWithFilters(params: {
    organizationId: string;
    type?: WarehouseType;
    isActive?: boolean;
    isDefault?: boolean;
    country?: string;
    state?: string;
    city?: string;
    hasAvailableCapacity?: boolean;
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<Warehouse[]> {
    return this.warehouseRepository.findWithFilters(params);
  }
  
  /**
   * Update warehouse capacity
   * @param id Warehouse ID
   * @param usedCapacity Used capacity
   * @returns Updated warehouse
   */
  async updateCapacity(id: string, usedCapacity: number): Promise<Warehouse> {
    this.logger.log(`Updating capacity for warehouse ${id}`);
    
    const updated = await this.warehouseRepository.updateCapacity(id, usedCapacity);
    
    if (!updated) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    
    return updated;
  }
  
  /**
   * Clear default flag on all warehouses for an organization
   * @param organizationId Organization ID
   * @returns Success indicator
   */
  private async clearDefaultWarehouses(organizationId: string): Promise<boolean> {
    const warehouses = await this.warehouseRepository.findByOrganization(organizationId);
    
    const defaultWarehouses = warehouses.filter(warehouse => warehouse.isDefault);
    
    for (const warehouse of defaultWarehouses) {
      await this.warehouseRepository.update(warehouse.id, { isDefault: false });
    }
    
    return true;
  }
}