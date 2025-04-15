/**
 * Attribute Template Model
 * 
 * Core model for attribute templates in the PIM module
 */

import { TenantEntity } from '../../../types/google-cloud.types';
import { ProductAttribute } from '../interfaces/types';

/**
 * Attribute type enum
 */
export enum AttributeType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  DATE = 'date',
  DATETIME = 'datetime',
  COLOR = 'color',
  IMAGE = 'image',
  FILE = 'file',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  PRICE = 'price',
  DIMENSION = 'dimension',
  WEIGHT = 'weight'
}

/**
 * Attribute scope enum
 */
export enum AttributeScope {
  GLOBAL = 'global',
  REGIONAL = 'regional',
  MARKETPLACE = 'marketplace'
}

/**
 * Attribute template entity
 */
export interface AttributeTemplate extends TenantEntity {
  /**
   * Template name
   */
  name: string;
  
  /**
   * Template description
   */
  description?: string;
  
  /**
   * Array of attributes in this template
   */
  attributes: ProductAttribute[];
  
  /**
   * Categories this template is applied to
   */
  categoryIds?: string[];
  
  /**
   * Whether this template is applied to all products
   */
  applyToAllProducts: boolean;
  
  /**
   * Attribute template scope
   */
  scope: AttributeScope;
  
  /**
   * Region this template applies to (if scope is REGIONAL)
   */
  region?: string;
  
  /**
   * Marketplace this template applies to (if scope is MARKETPLACE)
   */
  marketplaceId?: string;
  
  /**
   * Position for sorting
   */
  position?: number;
  
  /**
   * Whether template is active
   */
  isActive: boolean;
  
  /**
   * Region-specific attribute configurations
   */
  regional?: {
    /**
     * South Africa specific attribute configuration
     */
    southAfrica?: {
      /**
       * Attributes required for South African compliance
       */
      requiredAttributes?: string[];
    };
    
    /**
     * Europe specific attribute configuration
     */
    europe?: {
      /**
       * Attributes required for European compliance
       */
      requiredAttributes?: string[];
    };
  };
  
  /**
   * Marketplace-specific attribute mappings
   */
  marketplaceMappings?: {
    /**
     * Marketplace ID
     */
    marketplaceId: string;
    
    /**
     * Attribute mappings (local attribute code to marketplace attribute code)
     */
    attributeMappings: Record<string, string>;
  }[];
}

/**
 * Attribute template creation DTO
 */
export type CreateAttributeTemplateDto = Omit<AttributeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'version'>;

/**
 * Attribute template update DTO
 */
export type UpdateAttributeTemplateDto = Partial<CreateAttributeTemplateDto>;