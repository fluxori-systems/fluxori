/**
 * Warehouse Schema
 */
import { TenantEntity } from '../../../common/types/tenant-entity';
import {
  WarehouseType,
  InventoryMetadata,
  WarehouseIntegrationConfig,
} from '../interfaces/types';

/**
 * Warehouse entity for Firestore
 */
export interface Warehouse extends TenantEntity {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  type: WarehouseType;
  isDefault: boolean;
  isActive: boolean;

  // Address
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  // Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Operational details
  businessHours?: {
    monday?: { open: string; close: string; isClosed: boolean };
    tuesday?: { open: string; close: string; isClosed: boolean };
    wednesday?: { open: string; close: string; isClosed: boolean };
    thursday?: { open: string; close: string; isClosed: boolean };
    friday?: { open: string; close: string; isClosed: boolean };
    saturday?: { open: string; close: string; isClosed: boolean };
    sunday?: { open: string; close: string; isClosed: boolean };
  };

  // Capacity and utilization
  totalCapacity?: number;
  usedCapacity?: number;
  capacityUnit?: string;

  // Integration info for 3PL
  externalId?: string;
  integrationProvider?: string;
  integrationConfig?: WarehouseIntegrationConfig; // TODO: Refine fields as discovered

  // Additional info
  notes?: string;
  tags?: string[];
  metadata?: InventoryMetadata; // TODO: Refine fields as discovered
}
