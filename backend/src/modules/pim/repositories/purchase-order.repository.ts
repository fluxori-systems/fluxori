/**
 * Purchase Order Repository
 * 
 * Repository for managing B2B purchase order data.
 */
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/b2b/purchase-order.model';

/**
 * Repository for purchase orders
 */
@Injectable()
export class PurchaseOrderRepository extends FirestoreBaseRepository<PurchaseOrder> {
  protected readonly logger = new Logger(PurchaseOrderRepository.name);
  
  /**
   * Constructor initializes the repository with collection name
   */
  constructor() {
    super('purchase_orders');
  }
  
  /**
   * Find a purchase order by PO number
   * @param poNumber The purchase order number
   * @param organizationId The organization ID
   * @returns The purchase order or null if not found
   */
  async findByPurchaseOrderNumber(
    poNumber: string,
    organizationId: string
  ): Promise<PurchaseOrder | null> {
    const query = this.collection
      .where('purchaseOrderNumber', '==', poNumber)
      .where('organizationId', '==', organizationId)
      .limit(1);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.length > 0 ? this.mapSnapshotToEntity(snapshot.docs[0]) : null;
  }
  
  /**
   * Find purchase orders by customer
   * @param customerId The customer ID
   * @param organizationId The organization ID
   * @param status Optional status filter
   * @returns Array of purchase orders for the customer
   */
  async findByCustomer(
    customerId: string,
    organizationId: string,
    status?: PurchaseOrderStatus
  ): Promise<PurchaseOrder[]> {
    let query = this.collection
      .where('customerId', '==', customerId)
      .where('organizationId', '==', organizationId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Add ordering by date
    query = query.orderBy('orderDate', 'desc');
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find purchase orders by contract
   * @param contractId The contract ID
   * @param organizationId The organization ID
   * @returns Array of purchase orders for the contract
   */
  async findByContract(
    contractId: string,
    organizationId: string
  ): Promise<PurchaseOrder[]> {
    const query = this.collection
      .where('contractId', '==', contractId)
      .where('organizationId', '==', organizationId)
      .orderBy('orderDate', 'desc');
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find purchase orders by status
   * @param status The order status
   * @param organizationId The organization ID
   * @returns Array of purchase orders with the specified status
   */
  async findByStatus(
    status: PurchaseOrderStatus,
    organizationId: string
  ): Promise<PurchaseOrder[]> {
    const query = this.collection
      .where('status', '==', status)
      .where('organizationId', '==', organizationId)
      .orderBy('orderDate', 'desc');
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find orders pending approval
   * @param organizationId The organization ID
   * @returns Array of orders pending approval
   */
  async findPendingApproval(organizationId: string): Promise<PurchaseOrder[]> {
    const query = this.collection
      .where('status', '==', PurchaseOrderStatus.PENDING_APPROVAL)
      .where('organizationId', '==', organizationId)
      .orderBy('orderDate', 'desc');
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find orders created within a date range
   * @param startDate The start date
   * @param endDate The end date
   * @param organizationId The organization ID
   * @returns Array of orders within the date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<PurchaseOrder[]> {
    const query = this.collection
      .where('orderDate', '>=', startDate)
      .where('orderDate', '<=', endDate)
      .where('organizationId', '==', organizationId)
      .orderBy('orderDate', 'desc');
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find pending orders for a specific approver
   * @param approverId The approver user ID
   * @param organizationId The organization ID
   * @returns Array of orders pending approval by the specified approver
   */
  async findPendingOrdersForApprover(
    approverId: string,
    organizationId: string
  ): Promise<PurchaseOrder[]> {
    // This is a complex query that can't be performed directly in Firestore
    // First, get all pending orders
    const pendingOrders = await this.findPendingApproval(organizationId);
    
    // Then filter to those where the approverId matches the current approval step
    return pendingOrders.filter(order => {
      if (!order.approvalWorkflowId || order.currentApprovalStep === undefined) {
        return false;
      }
      
      // Check if any approval actions reference this approver as the next approver
      if (order.approvalActions && order.approvalActions.length > 0) {
        const latestAction = order.approvalActions[order.approvalActions.length - 1];
        return latestAction.nextApproverId === approverId;
      }
      
      return false;
    });
  }
  
  /**
   * Find recurring orders
   * @param organizationId The organization ID
   * @returns Array of recurring orders
   */
  async findRecurringOrders(organizationId: string): Promise<PurchaseOrder[]> {
    const query = this.collection
      .where('isRecurring', '==', true)
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(query);
    return snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
  }
  
  /**
   * Find orders containing a specific product
   * @param productId The product ID
   * @param organizationId The organization ID
   * @returns Array of orders containing the specified product
   */
  async findOrdersWithProduct(
    productId: string,
    organizationId: string
  ): Promise<PurchaseOrder[]> {
    // Due to Firestore limitations, we need to fetch all orders and filter in memory
    const allOrdersQuery = this.collection
      .where('organizationId', '==', organizationId);
    
    const snapshot = await this.executeQuery(allOrdersQuery);
    const allOrders = snapshot.docs.map(doc => this.mapSnapshotToEntity(doc));
    
    // Filter orders containing the specified product
    return allOrders.filter(order => 
      order.items.some(item => item.productId === productId)
    );
  }
}