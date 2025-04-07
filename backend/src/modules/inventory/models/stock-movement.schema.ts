/**
 * Stock Movement Schema
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';
import { StockMovementType, StockMovementReason } from '../interfaces/types';

/**
 * Stock Movement entity for Firestore
 */
export interface StockMovement extends FirestoreEntity {
  organizationId: string;
  productId: string;
  productSku: string;
  productName: string;
  
  // Movement details
  movementType: StockMovementType;
  movementReason: StockMovementReason;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  
  // Location info
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  
  // For transfers
  targetWarehouseId?: string;
  targetWarehouseName?: string;
  targetLocationId?: string;
  targetLocationName?: string;
  
  // Related documents
  referenceNumber?: string;
  referenceType?: string;
  referenceId?: string;
  
  // User info
  userId: string;
  userName: string;
  
  // Additional info
  notes?: string;
  cost?: number;
  currency?: string;
  batchNumber?: string;
  expiryDate?: Date;
  serialNumbers?: string[];
  metadata?: Record<string, any>;
}