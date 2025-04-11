import { Injectable } from "@nestjs/common";

import { FirestoreBaseRepository } from "../../../common/repositories/firestore-base.repository";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { CreditAllocation, CreditModelType } from "../interfaces/types";

/**
 * Repository for credit allocations
 */
@Injectable()
export class CreditAllocationRepository extends FirestoreBaseRepository<CreditAllocation> {
  protected readonly collectionName = "credit_allocations";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "credit_allocations", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: ["organizationId", "modelType", "totalCredits", "remainingCredits", "isActive"],
    });
  }

  /**
   * Find active allocation by organization
   * @param organizationId Organization ID
   * @returns Active credit allocation or null if not found
   */
  async findActiveByOrganization(
    organizationId: string,
  ): Promise<CreditAllocation | null> {
    const allocations = await this.find({
      filter: { 
        organizationId,
        isActive: true,
      } as Partial<CreditAllocation>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: 1,
      },
    });

    return allocations.length > 0 ? allocations[0] : null;
  }

  /**
   * Find all allocations for an organization
   * @param organizationId Organization ID
   * @returns Array of credit allocations
   */
  async findByOrganization(
    organizationId: string,
  ): Promise<CreditAllocation[]> {
    return this.find({
      filter: { organizationId } as Partial<CreditAllocation>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
      },
    });
  }

  /**
   * Find active allocation for a specific user
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Active credit allocation or null if not found
   */
  async findActiveByUser(
    organizationId: string,
    userId: string,
  ): Promise<CreditAllocation | null> {
    const allocations = await this.find({
      filter: { 
        organizationId,
        userId,
        isActive: true,
      } as Partial<CreditAllocation>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: 1,
      },
    });

    return allocations.length > 0 ? allocations[0] : null;
  }

  /**
   * Find allocations by type
   * @param organizationId Organization ID
   * @param modelType Credit model type
   * @returns Array of credit allocations
   */
  async findByType(
    organizationId: string,
    modelType: CreditModelType,
  ): Promise<CreditAllocation[]> {
    return this.find({
      filter: { 
        organizationId,
        modelType,
      } as Partial<CreditAllocation>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
      },
    });
  }
  
  /**
   * Update specific fields of an entity
   * @param id Entity ID
   * @param fields Fields to update
   * @returns Updated entity
   */
  async updateFields(
    id: string,
    fields: Partial<CreditAllocation>,
  ): Promise<CreditAllocation> {
    return this.update(id, fields);
  }

  /**
   * Decrement remaining credits in an allocation
   * @param allocationId Allocation ID
   * @param amount Amount to decrement
   * @returns Updated allocation
   */
  async decrementCredits(
    allocationId: string,
    amount: number,
  ): Promise<CreditAllocation> {
    const allocation = await this.findById(allocationId);
    
    if (!allocation) {
      throw new Error(`Credit allocation not found: ${allocationId}`);
    }
    
    if (allocation.remainingCredits < amount) {
      throw new Error(`Insufficient credits in allocation: ${allocationId}`);
    }
    
    return this.updateFields(allocationId, {
      remainingCredits: allocation.remainingCredits - amount,
    });
  }
  
  /**
   * Add credits to an allocation
   * @param allocationId Allocation ID
   * @param amount Amount to add
   * @returns Updated allocation
   */
  async addCredits(
    allocationId: string,
    amount: number,
  ): Promise<CreditAllocation> {
    const allocation = await this.findById(allocationId);
    
    if (!allocation) {
      throw new Error(`Credit allocation not found: ${allocationId}`);
    }
    
    return this.updateFields(allocationId, {
      remainingCredits: allocation.remainingCredits + amount,
    });
  }
  
  /**
   * Deactivate an allocation
   * @param allocationId Allocation ID
   * @returns Updated allocation
   */
  async deactivate(allocationId: string): Promise<CreditAllocation> {
    return this.updateFields(allocationId, {
      isActive: false,
    });
  }
}