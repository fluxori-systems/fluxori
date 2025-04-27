import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub repository for approval workflows
 */
@Injectable()
export class ApprovalWorkflowRepository {
  private readonly logger = new Logger(ApprovalWorkflowRepository.name);

  constructor() {
    this.logger.warn("ApprovalWorkflowRepository stub initialized");
  }

  /**
   * Find active approval workflows for an organization
   */
  async findActiveWorkflows(_organizationId: string): Promise<any[]> {
    this.logger.warn("findActiveWorkflows not implemented");
    return [];
  }

  /**
   * Find workflows by customer tier
   */
  async findByCustomerTier(
    _customerTierId: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByCustomerTier not implemented");
    return [];
  }
}
