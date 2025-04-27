import { Injectable, Logger } from "@nestjs/common";

import { FirestoreConfigService } from "src/config/firestore.config";

import {
  FirestoreBaseRepository,
  QueryFilter as FirestoreAdvancedFilter,
} from "src/common/repositories";

import { BuyBoxStatus as BuyBoxStatusEnum } from "../interfaces/types";
import { BuyBoxStatus } from "../models/buybox-status.schema";

/**
 * Repository for BuyBox Status entities
 */
@Injectable()
export class BuyBoxStatusRepository extends FirestoreBaseRepository<BuyBoxStatus> {
  protected readonly logger = new Logger(BuyBoxStatusRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "buybox_statuses", {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: [
        "organizationId",
        "productId",
        "marketplaceId",
        "status",
      ],
    });
  }

  /**
   * Find statuses by organization ID
   * @param organizationId Organization ID
   * @returns Array of BuyBox statuses
   */
  async findByOrganization(organizationId: string): Promise<BuyBoxStatus[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
      ],
    });
  }

  /**
   * Find statuses by product ID
   * @param productId Product ID
   * @returns Array of BuyBox statuses
   */
  async findByProduct(productId: string): Promise<BuyBoxStatus[]> {
    return this.find({
      advancedFilters: [
        { field: "productId", operator: "==", value: productId },
      ],
    });
  }

  /**
   * Find status by product and marketplace
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns BuyBox status or null if not found
   */
  async findByProductAndMarketplace(
    productId: string,
    marketplaceId: string,
  ): Promise<BuyBoxStatus | null> {
    const results = await this.find({
      advancedFilters: [
        { field: "productId", operator: "==", value: productId },
        { field: "marketplaceId", operator: "==", value: marketplaceId },
      ],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find statuses by organization and status
   * @param organizationId Organization ID
   * @param status BuyBox status
   * @returns Array of BuyBox statuses
   */
  async findByStatus(
    organizationId: string,
    status: BuyBoxStatusEnum,
  ): Promise<BuyBoxStatus[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "status", operator: "==", value: status },
      ],
    });
  }

  /**
   * Find statuses that need to be monitored
   * @param organizationId Organization ID
   * @returns Array of BuyBox statuses
   */
  async findMonitored(organizationId: string): Promise<BuyBoxStatus[]> {
    return this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "isMonitored", operator: "==", value: true },
      ],
    });
  }

  /**
   * Find statuses with advanced filtering
   * @param params Query parameters
   * @returns Array of BuyBox statuses
   */
  async findWithFilters(params: {
    organizationId?: string;
    productId?: string;
    marketplaceId?: string;
    status?: BuyBoxStatusEnum;
    isMonitored?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<BuyBoxStatus[]> {
    // Build advanced filters
    const advancedFilters: FirestoreAdvancedFilter<BuyBoxStatus>[] = [];

    // Add filters based on params
    if (params.organizationId) {
      advancedFilters.push({
        field: "organizationId",
        operator: "==",
        value: params.organizationId,
      });
    }
    if (params.productId) {
      advancedFilters.push({
        field: "productId",
        operator: "==",
        value: params.productId,
      });
    }
    if (params.marketplaceId) {
      advancedFilters.push({
        field: "marketplaceId",
        operator: "==",
        value: params.marketplaceId,
      });
    }
    if (params.status) {
      advancedFilters.push({
        field: "status",
        operator: "==",
        value: params.status,
      });
    }
    if (params.isMonitored !== undefined) {
      advancedFilters.push({
        field: "isMonitored",
        operator: "==",
        value: params.isMonitored,
      });
    }

    // Execute the query with options
    return this.find({
      advancedFilters,
      queryOptions: {
        orderBy: "lastChecked",
        direction: "desc",
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  /**
   * Update BuyBox status
   * @param status BuyBox status to update
   * @returns Updated BuyBox status
   */
  async updateStatus(status: BuyBoxStatus): Promise<BuyBoxStatus | null> {
    // Ensure required fields
    if (!status.id) {
      throw new Error("Status ID is required for update");
    }

    // Set last checked timestamp
    status.lastChecked = new Date();

    return this.update(status.id, status);
  }

  /**
   * Count statuses by BuyBox status for an organization
   * @param organizationId Organization ID
   * @returns Count by status
   */
  async countByStatus(
    organizationId: string,
  ): Promise<Record<BuyBoxStatusEnum, number>> {
    const statuses = await this.findByOrganization(organizationId);

    // Initialize counts
    const counts: Record<string, number> = {};
    Object.values(BuyBoxStatusEnum).forEach((status) => {
      counts[status] = 0;
    });

    // Count by status
    statuses.forEach((status) => {
      counts[status.status] = (counts[status.status] || 0) + 1;
    });

    return counts as Record<BuyBoxStatusEnum, number>;
  }
}
