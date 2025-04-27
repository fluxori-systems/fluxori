/**
 * Repricing Rule Schema
 */

/**
 * Placeholder for Buybox repricing rule metadata. TODO: Add concrete fields as discovered.
 */
export interface BuyBoxRepricingMetadata {
  // TODO: Add concrete metadata fields here as they are discovered in the codebase
}

import { FirestoreEntity } from '../../../types/google-cloud.types';
import { PricingRuleOperation } from '../interfaces/types';

/**
 * Repricing Rule entity for Firestore
 */
export interface RepricingRule extends FirestoreEntity {
  version: number; // Ensure always present for FirestoreEntityWithMetadata compliance
  isDeleted: boolean; // Ensure always present for FirestoreEntityWithMetadata compliance
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number; // Lower values = higher priority

  // Rule scope
  applyToAllProducts: boolean;
  productIds?: string[];
  productCategories?: string[];

  // Marketplace scope
  applyToAllMarketplaces: boolean;
  marketplaceIds?: string[];

  // Rule conditions
  operation: PricingRuleOperation;
  targetCompetitor?: string; // 'all', 'lowest', 'highest', 'specific', 'buybox_winner'
  specificCompetitorId?: string;

  // Rule parameters
  value: number; // Amount to beat by, fixed price, percentage, etc.
  currency?: string;

  // Constraints
  minPrice?: number;
  maxPrice?: number;
  minMargin?: number;

  // Schedule
  scheduleType: 'always' | 'once' | 'recurring';
  startDate?: Date;
  endDate?: Date;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  timeOfDay?: string; // HH:MM format

  // Metadata
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  // TODO: Refine BuyBoxRepricingMetadata as requirements become clear
  metadata?: BuyBoxRepricingMetadata;
}
