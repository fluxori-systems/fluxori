// This file centralizes all external dependencies to prevent circular imports

// Re-export from NestJS
import { Injectable, Logger, Inject } from '@nestjs/common';
export { Injectable, Logger, Inject };

// Re-export from config service
import { ConfigService } from '@nestjs/config';
export { ConfigService };

// Import services from other modules that marketplace module depends on
import type { InventoryService } from '../../inventory/services/inventory.service';
export type { InventoryService };

// Type definition for OrganizationService since we might not have the actual implementation yet
export interface OrganizationService {
  getOrganizationById(id: string): Promise<any>;
  getOrganizationSettings(id: string): Promise<any>;
  // Add other methods as needed
}
