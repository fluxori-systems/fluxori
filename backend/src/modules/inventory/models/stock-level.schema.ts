/**
 * Stock Level Schema
 */
import { FirestoreEntity } from '../../../types/google-cloud.types';
import { InventoryMetadata } from '../interfaces/types';

/**
 * Stock Level entity for Firestore
 */
export interface StockLevel extends FirestoreEntity {
  organizationId: string;
  productId: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  onOrderQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastStockUpdateDate: Date;
  lastCountDate?: Date;
  lastReceivedDate?: Date;
  costValue: number;
  retailValue: number;
  currency: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  batchNumber?: string;
  expiryDate?: Date;
  serialNumbers?: string[];
  notes?: string;
  // TODO: Refine metadata type as requirements become clear
  metadata?: InventoryMetadata; // TODO: Refine fields as discovered
}
