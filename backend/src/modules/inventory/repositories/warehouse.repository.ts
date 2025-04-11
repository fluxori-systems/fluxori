import { Injectable, Logger } from "@nestjs/common";

import {
  FirestoreBaseRepository,
  FirestoreAdvancedFilter,
} from "../../../common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { WarehouseType } from "../interfaces/types";
import { Warehouse } from "../models/warehouse.schema";

/**
 * Repository for Warehouse entities
 */
@Injectable()
export class WarehouseRepository extends FirestoreBaseRepository<Warehouse> {
  protected readonly logger = new Logger(WarehouseRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "warehouses", {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 15 * 60 * 1000, // 15 minutes
      requiredFields: ["organizationId", "name", "code", "type"],
    });
  }

  /**
   * Find warehouses by organization ID
   * @param organizationId Organization ID
   * @returns Array of warehouses
   */
  async findByOrganization(organizationId: string): Promise<Warehouse[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
      ],
    });
  }

  /**
   * Find warehouse by code
   * @param organizationId Organization ID
   * @param code Warehouse code
   * @returns Warehouse or null if not found
   */
  async findByCode(
    organizationId: string,
    code: string,
  ): Promise<Warehouse | null> {
    const results = await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "code", operator: "==", value: code },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find default warehouse for an organization
   * @param organizationId Organization ID
   * @returns Default warehouse or null if not found
   */
  async findDefaultWarehouse(
    organizationId: string,
  ): Promise<Warehouse | null> {
    const results = await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "isDefault", operator: "==", value: true },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find active warehouses for an organization
   * @param organizationId Organization ID
   * @returns Array of active warehouses
   */
  async findActiveWarehouses(organizationId: string): Promise<Warehouse[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "isActive", operator: "==", value: true },
      ],
    });
  }

  /**
   * Find warehouses by type
   * @param organizationId Organization ID
   * @param type Warehouse type
   * @returns Array of warehouses
   */
  async findByType(
    organizationId: string,
    type: WarehouseType,
  ): Promise<Warehouse[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "type", operator: "==", value: type },
      ],
    });
  }

  /**
   * Set warehouse as default
   * @param id Warehouse ID
   * @param organizationId Organization ID
   * @returns Success indicator
   */
  async setAsDefault(id: string, organizationId: string): Promise<boolean> {
    return this.runTransaction(async (context) => {
      const transaction = context.transaction;
      // First, find all warehouses for the organization
      const warehouses = await this.findByOrganization(organizationId);

      // Clear the default flag on all warehouses
      for (const warehouse of warehouses) {
        if (warehouse.isDefault && warehouse.id !== id) {
          // Get document reference
          const docRef = this.getDocRef(warehouse.id);

          // Update using raw transaction
          transaction.update(docRef, {
            isDefault: false,
            updatedAt: new Date(),
          });
        }
      }

      // Set the new default
      const defaultDocRef = this.getDocRef(id);
      transaction.update(defaultDocRef, {
        isDefault: true,
        isActive: true, // Ensure it's active
        updatedAt: new Date(),
      });

      return true;
    });
  }

  /**
   * Update warehouse capacity
   * @param id Warehouse ID
   * @param usedCapacity New used capacity
   * @returns Updated warehouse
   */
  async updateCapacity(
    id: string,
    usedCapacity: number,
  ): Promise<Warehouse | null> {
    return this.update(id, { usedCapacity });
  }

  /**
   * Find warehouses with advanced filtering
   * @param params Query parameters
   * @returns Array of filtered warehouses
   */
  async findWithFilters(params: {
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
    // Build advanced filters
    const advancedFilters: FirestoreAdvancedFilter<Warehouse>[] = [
      { field: "organizationId", operator: "==", value: params.organizationId },
    ];

    if (params.type) {
      advancedFilters.push({
        field: "type",
        operator: "==",
        value: params.type,
      });
    }

    if (params.isActive !== undefined) {
      advancedFilters.push({
        field: "isActive",
        operator: "==",
        value: params.isActive,
      });
    }

    if (params.isDefault !== undefined) {
      advancedFilters.push({
        field: "isDefault",
        operator: "==",
        value: params.isDefault,
      });
    }

    // Fetch warehouses with basic filters
    let warehouses = await this.find({
      advancedFilters,
      queryOptions: {
        limit: params.limit,
        offset: params.offset,
      },
    });

    // Apply additional filters
    if (params.country) {
      warehouses = warehouses.filter(
        (warehouse) => warehouse.address.country === params.country,
      );
    }

    if (params.state) {
      warehouses = warehouses.filter(
        (warehouse) => warehouse.address.state === params.state,
      );
    }

    if (params.city) {
      warehouses = warehouses.filter(
        (warehouse) => warehouse.address.city === params.city,
      );
    }

    if (params.hasAvailableCapacity) {
      warehouses = warehouses.filter((warehouse) => {
        if (
          warehouse.totalCapacity === undefined ||
          warehouse.usedCapacity === undefined
        ) {
          return true; // If capacity isn't tracked, assume available
        }
        return warehouse.usedCapacity < warehouse.totalCapacity;
      });
    }

    if (params.searchText) {
      const searchText = params.searchText.toLowerCase();
      warehouses = warehouses.filter((warehouse) => {
        return (
          warehouse.name.toLowerCase().includes(searchText) ||
          warehouse.code.toLowerCase().includes(searchText) ||
          warehouse.description?.toLowerCase().includes(searchText) ||
          warehouse.address.line1.toLowerCase().includes(searchText) ||
          warehouse.address.city.toLowerCase().includes(searchText)
        );
      });
    }

    // Sort warehouses by name
    warehouses.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    if (params.offset !== undefined || params.limit !== undefined) {
      const start = params.offset || 0;
      const end = params.limit ? start + params.limit : undefined;
      warehouses = warehouses.slice(start, end);
    }

    return warehouses;
  }
}
