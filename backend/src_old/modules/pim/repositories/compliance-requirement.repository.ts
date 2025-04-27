/**
 * Compliance Requirement Repository
 *
 * Repository for managing compliance requirements in the advanced compliance framework
 */

import { Injectable, Logger } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { ComplianceRequirement } from "../interfaces/compliance.types";

/**
 * Repository for compliance requirements
 */
@Injectable()
export class ComplianceRequirementRepository extends FirestoreBaseRepository<ComplianceRequirement> {
  constructor() {
    super("compliance_requirements", {
      idField: "id",
      defaultOrderField: "requiredBy",
      defaultOrderDirection: "asc",
    });

    this.logger = new Logger(ComplianceRequirementRepository.name);
  }

  /**
   * Find requirements for a product
   *
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @returns Matching compliance requirements
   */
  async findByProduct(
    productId: string,
    tenantId: string,
  ): Promise<ComplianceRequirement[]> {
    return this.findWithFilters(
      [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find requirement for a specific product and rule
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @returns Matching compliance requirement or null
   */
  async findByProductAndRule(
    productId: string,
    ruleId: string,
    tenantId: string,
  ): Promise<ComplianceRequirement | null> {
    const results = await this.findWithFilters(
      [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
        {
          field: "ruleId",
          operator: "==",
          value: ruleId,
        },
      ],
      tenantId,
    );

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find requirements by status
   *
   * @param status Compliance status
   * @param tenantId Tenant ID
   * @returns Matching compliance requirements
   */
  async findByStatus(
    status: string,
    tenantId: string,
  ): Promise<ComplianceRequirement[]> {
    return this.findWithFilters(
      [
        {
          field: "status",
          operator: "==",
          value: status,
        },
      ],
      tenantId,
    );
  }

  /**
   * Find requirements with upcoming due dates
   *
   * @param date Cutoff date
   * @param tenantId Tenant ID
   * @returns Compliance requirements due by the given date
   */
  async findUpcoming(
    date: Date,
    tenantId: string,
  ): Promise<ComplianceRequirement[]> {
    return this.findWithFilters(
      [
        {
          field: "requiredBy",
          operator: "<=",
          value: date,
        },
        {
          field: "status",
          operator: "in",
          value: ["pending_verification", "in_progress"],
        },
      ],
      tenantId,
    );
  }

  /**
   * Find requirements assigned to a user
   *
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Compliance requirements assigned to the user
   */
  async findByAssignee(
    userId: string,
    tenantId: string,
  ): Promise<ComplianceRequirement[]> {
    return this.findWithFilters(
      [
        {
          field: "assignedTo",
          operator: "==",
          value: userId,
        },
      ],
      tenantId,
    );
  }
}
