/**
 * Approval Workflow Repository
 *
 * Repository for managing B2B approval workflow definitions.
 */
import { Injectable, Logger } from '@nestjs/common';

import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ApprovalWorkflow } from '../models/b2b/purchase-order.model';
import { FirestoreConfigService } from '../../../config/firestore.config';

/**
 * Repository for approval workflows
 */
@Injectable()
export class ApprovalWorkflowRepository extends FirestoreBaseRepository<ApprovalWorkflow> {
  protected readonly logger = new Logger(ApprovalWorkflowRepository.name);

  /**
   * Constructor initializes the repository with collection name
   */
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'approval_workflows');
  }

  /**
   * Find active approval workflows for an organization
   * @param organizationId The organization ID
   * @returns Array of active approval workflows
   */
  /**
   * Finds all active approval workflows for a given organization.
   * @param organizationId The organization ID.
   * @returns Array of active ApprovalWorkflow entities.
   */
  async findActiveWorkflows(
    organizationId: string,
  ): Promise<ApprovalWorkflow[]> {
    return this.find({ filter: { isActive: true, organizationId } });
  }

  /**
   * Find workflows for a specific customer tier
   * @param customerTierId The customer tier ID
   * @param organizationId The organization ID
   * @returns Array of approval workflows for the specified tier
   */
  /**
   * Finds approval workflows for a specific customer tier.
   * @param customerTierId The customer tier ID.
   * @param organizationId The organization ID.
   * @returns Array of approval workflows for the specified tier.
   */
  async findByCustomerTier(
    customerTierId: string,
    organizationId: string,
  ): Promise<ApprovalWorkflow[]> {
    // Firestore can only query one array-contains at a time; fallback to in-memory filtering
    const all = await this.find({ filter: { isActive: true, organizationId } });
    return all.filter(wf => wf.customerTierIds?.includes(customerTierId));
  }

  /**
   * Find workflows for a specific customer group
   * @param customerGroupId The customer group ID
   * @param organizationId The organization ID
   * @returns Array of approval workflows for the specified group
   */
  /**
   * Finds approval workflows for a specific customer group.
   * @param customerGroupId The customer group ID.
   * @param organizationId The organization ID.
   * @returns Array of approval workflows for the specified group.
   */
  async findByCustomerGroup(
    customerGroupId: string,
    organizationId: string,
  ): Promise<ApprovalWorkflow[]> {
    // Firestore can only query one array-contains at a time; fallback to in-memory filtering
    const all = await this.find({ filter: { isActive: true, organizationId } });
    return all.filter(wf => wf.customerGroupIds?.includes(customerGroupId));
  }

  /**
   * Find workflows that include a specific approver role
   * @param approverRole The approver role to search for
   * @param organizationId The organization ID
   * @returns Array of approval workflows that include the specified role
   */
  /**
   * Finds approval workflows that include a specific approver role in any step.
   * @param approverRole The approver role to search for.
   * @param organizationId The organization ID.
   * @returns Array of approval workflows that include the specified role.
   */
  async findByApproverRole(
    approverRole: string,
    organizationId: string,
  ): Promise<ApprovalWorkflow[]> {
    const all = await this.find({ filter: { isActive: true, organizationId } });
    return all.filter(workflow =>
      workflow.steps.some(step => step.approverRole === approverRole),
    );
  }

  /**
   * Find workflows that include a specific approver user ID
   * @param approverUserId The approver user ID to search for
   * @param organizationId The organization ID
   * @returns Array of approval workflows that include the specified user
   */
  /**
   * Finds approval workflows that include a specific approver user ID in any step.
   * @param approverUserId The approver user ID to search for.
   * @param organizationId The organization ID.
   * @returns Array of approval workflows that include the specified user.
   */
  async findByApproverUserId(
    approverUserId: string,
    organizationId: string,
  ): Promise<ApprovalWorkflow[]> {
    const all = await this.find({ filter: { isActive: true, organizationId } });
    return all.filter(workflow =>
      workflow.steps.some(
        step => step.approverUserIds && step.approverUserIds.includes(approverUserId),
      ),
    );
  }
}
