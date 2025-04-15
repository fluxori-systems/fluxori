/**
 * Approval Workflow Repository
 * 
 * Repository for managing B2B approval workflow definitions.
 */
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ApprovalWorkflow } from '../models/b2b/purchase-order.model';

/**
 * Repository for approval workflows
 */
@Injectable()
export class ApprovalWorkflowRepository extends FirestoreBaseRepository<ApprovalWorkflow> {
  protected readonly logger = new Logger(ApprovalWorkflowRepository.name);
  
  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('approval_workflows');
  }
  
  /**
   * Find active approval workflows for an organization
   * @param organizationId The organization ID
   * @returns Array of active approval workflows
   */
  async findActiveWorkflows(organizationId: string): Promise<ApprovalWorkflow[]> {
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find workflows for a specific customer tier
   * @param customerTierId The customer tier ID
   * @param organizationId The organization ID
   * @returns Array of approval workflows for the specified tier
   */
  async findByCustomerTier(
    customerTierId: string,
    organizationId: string
  ): Promise<ApprovalWorkflow[]> {
    const query = this.collection
      .where('customerTierIds', 'array-contains', customerTierId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find workflows for a specific customer group
   * @param customerGroupId The customer group ID
   * @param organizationId The organization ID
   * @returns Array of approval workflows for the specified group
   */
  async findByCustomerGroup(
    customerGroupId: string,
    organizationId: string
  ): Promise<ApprovalWorkflow[]> {
    const query = this.collection
      .where('customerGroupIds', 'array-contains', customerGroupId)
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find workflows that include a specific approver role
   * @param approverRole The approver role to search for
   * @param organizationId The organization ID
   * @returns Array of approval workflows that include the specified role
   */
  async findByApproverRole(
    approverRole: string,
    organizationId: string
  ): Promise<ApprovalWorkflow[]> {
    // Due to Firestore limitations on querying nested arrays, we need to fetch all workflows
    // and filter in memory
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(query);
    const allWorkflows = snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
    
    // Filter workflows that include the specified approver role in any step
    return allWorkflows.filter(workflow => 
      workflow.steps.some(step => step.approverRole === approverRole)
    );
  }
  
  /**
   * Find workflows that include a specific approver user ID
   * @param approverUserId The approver user ID to search for
   * @param organizationId The organization ID
   * @returns Array of approval workflows that include the specified user
   */
  async findByApproverUserId(
    approverUserId: string,
    organizationId: string
  ): Promise<ApprovalWorkflow[]> {
    // Due to Firestore limitations on querying nested arrays, we need to fetch all workflows
    // and filter in memory
    const query = this.collection
      .where('isActive', '==', true)
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(query);
    const allWorkflows = snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
    
    // Filter workflows that include the specified approver user ID in any step
    return allWorkflows.filter(workflow => 
      workflow.steps.some(step => 
        step.approverUserIds && 
        step.approverUserIds.includes(approverUserId)
      )
    );
  }
}