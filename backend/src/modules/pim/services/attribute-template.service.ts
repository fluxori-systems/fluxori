import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AttributeTemplateRepository } from '../repositories/attribute-template.repository';
import { AttributeTemplate, CreateAttributeTemplateDto, UpdateAttributeTemplateDto, AttributeScope } from '../models/attribute-template.model';
import { OperationResult } from '../interfaces/types';
import { QueryOptions } from '../../../types/google-cloud.types';

/**
 * Attribute Template Service
 * 
 * Core service for managing attribute templates in the PIM module
 */
@Injectable()
export class AttributeTemplateService {
  private readonly logger = new Logger(AttributeTemplateService.name);

  constructor(
    private readonly attributeTemplateRepository: AttributeTemplateRepository
  ) {}

  /**
   * Create a new attribute template
   * 
   * @param createAttributeTemplateDto Attribute template creation DTO
   * @returns Created attribute template
   */
  async createAttributeTemplate(createAttributeTemplateDto: CreateAttributeTemplateDto): Promise<AttributeTemplate> {
    try {
      this.logger.log(`Creating attribute template ${createAttributeTemplateDto.name}`);
      
      // Set default values if not provided
      if (createAttributeTemplateDto.isActive === undefined) {
        createAttributeTemplateDto.isActive = true;
      }
      
      if (createAttributeTemplateDto.applyToAllProducts === undefined) {
        createAttributeTemplateDto.applyToAllProducts = false;
      }
      
      if (createAttributeTemplateDto.position === undefined) {
        // Get highest position value and increment
        const templates = await this.attributeTemplateRepository.findByOrganization(
          createAttributeTemplateDto.organizationId
        );
        
        const maxPosition = templates.reduce(
          (max, template) => Math.max(max, template.position || 0),
          0
        );
        
        createAttributeTemplateDto.position = maxPosition + 1;
      }
      
      // Validate template data based on scope
      if (createAttributeTemplateDto.scope === AttributeScope.REGIONAL && !createAttributeTemplateDto.region) {
        throw new Error('Region must be provided for regional attribute templates');
      }
      
      if (createAttributeTemplateDto.scope === AttributeScope.MARKETPLACE && !createAttributeTemplateDto.marketplaceId) {
        throw new Error('Marketplace ID must be provided for marketplace attribute templates');
      }
      
      // Create the attribute template
      const attributeTemplate = await this.attributeTemplateRepository.create(createAttributeTemplateDto);
      
      this.logger.log(`Attribute template created with ID ${attributeTemplate.id}`);
      
      return attributeTemplate;
    } catch (error) {
      this.logger.error(`Error creating attribute template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing attribute template
   * 
   * @param id Attribute template ID
   * @param updateAttributeTemplateDto Attribute template update DTO
   * @returns Updated attribute template
   */
  async updateAttributeTemplate(id: string, updateAttributeTemplateDto: UpdateAttributeTemplateDto): Promise<AttributeTemplate> {
    try {
      this.logger.log(`Updating attribute template with ID ${id}`);
      
      // Get current template
      const currentTemplate = await this.attributeTemplateRepository.findById(id);
      
      if (!currentTemplate) {
        throw new NotFoundException(`Attribute template with ID ${id} not found`);
      }
      
      // Validate template data based on scope
      if (updateAttributeTemplateDto.scope === AttributeScope.REGIONAL && !updateAttributeTemplateDto.region) {
        // If scope is changing to REGIONAL, region must be provided
        if (currentTemplate.scope !== AttributeScope.REGIONAL || !currentTemplate.region) {
          throw new Error('Region must be provided for regional attribute templates');
        }
      }
      
      if (updateAttributeTemplateDto.scope === AttributeScope.MARKETPLACE && !updateAttributeTemplateDto.marketplaceId) {
        // If scope is changing to MARKETPLACE, marketplaceId must be provided
        if (currentTemplate.scope !== AttributeScope.MARKETPLACE || !currentTemplate.marketplaceId) {
          throw new Error('Marketplace ID must be provided for marketplace attribute templates');
        }
      }
      
      // Update the attribute template
      const attributeTemplate = await this.attributeTemplateRepository.update(id, updateAttributeTemplateDto);
      
      this.logger.log(`Attribute template updated with ID ${id}`);
      
      return attributeTemplate;
    } catch (error) {
      this.logger.error(`Error updating attribute template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get an attribute template by ID
   * 
   * @param id Attribute template ID
   * @param organizationId Organization ID
   * @returns Attribute template or null if not found
   */
  async getAttributeTemplateById(id: string, organizationId: string): Promise<AttributeTemplate | null> {
    try {
      this.logger.log(`Getting attribute template with ID ${id}`);
      
      // Get the attribute template
      const attributeTemplate = await this.attributeTemplateRepository.findById(id);
      
      // Check if attribute template exists and belongs to the organization
      if (!attributeTemplate || attributeTemplate.organizationId !== organizationId) {
        return null;
      }
      
      return attributeTemplate;
    } catch (error) {
      this.logger.error(`Error getting attribute template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an attribute template
   * 
   * @param id Attribute template ID
   */
  async deleteAttributeTemplate(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting attribute template with ID ${id}`);
      
      // Get the attribute template to make sure it exists
      const attributeTemplate = await this.attributeTemplateRepository.findById(id);
      
      if (!attributeTemplate) {
        throw new NotFoundException(`Attribute template with ID ${id} not found`);
      }
      
      // Delete the attribute template
      await this.attributeTemplateRepository.delete(id);
      
      this.logger.log(`Attribute template deleted with ID ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting attribute template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all attribute templates for an organization
   * 
   * @param organizationId Organization ID
   * @param options Query options for pagination, sorting, etc.
   * @returns Array of attribute templates
   */
  async getAllAttributeTemplates(
    organizationId: string,
    options: QueryOptions = {}
  ): Promise<{ items: AttributeTemplate[], total: number, page: number, limit: number }> {
    try {
      this.logger.log(`Getting all attribute templates for organization ${organizationId}`);
      
      // Set default pagination values if not provided
      const page = options.pagination?.page || 1;
      const limit = options.pagination?.pageSize || 20;
      
      // Get attribute templates with pagination
      const paginationResult = await this.attributeTemplateRepository.paginate({
        advancedFilters: [
          {
            field: 'organizationId',
            operator: '==',
            value: organizationId
          }
        ],
        pagination: {
          page,
          pageSize: limit
        },
        orderBy: [
          {
            field: options.orderBy?.[0]?.field || 'createdAt',
            direction: options.orderBy?.[0]?.direction || 'desc'
          }
        ]
      });
      
      return {
        items: paginationResult.items,
        total: paginationResult.total,
        page: paginationResult.page,
        limit: paginationResult.pageSize
      };
    } catch (error) {
      this.logger.error(`Error getting all attribute templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get attribute templates by category
   * 
   * @param organizationId Organization ID
   * @param categoryId Category ID
   * @returns Array of attribute templates for the category
   */
  async getAttributeTemplatesByCategory(organizationId: string, categoryId: string): Promise<AttributeTemplate[]> {
    try {
      this.logger.log(`Getting attribute templates for category ${categoryId}`);
      
      return await this.attributeTemplateRepository.findByCategory(organizationId, categoryId);
    } catch (error) {
      this.logger.error(`Error getting attribute templates by category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get global attribute templates
   * 
   * @param organizationId Organization ID
   * @returns Array of global attribute templates
   */
  async getGlobalAttributeTemplates(organizationId: string): Promise<AttributeTemplate[]> {
    try {
      this.logger.log(`Getting global attribute templates for organization ${organizationId}`);
      
      return await this.attributeTemplateRepository.findGlobalTemplates(organizationId);
    } catch (error) {
      this.logger.error(`Error getting global attribute templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get attribute templates by region
   * 
   * @param organizationId Organization ID
   * @param region Region (e.g., 'south-africa', 'europe')
   * @returns Array of regional attribute templates
   */
  async getAttributeTemplatesByRegion(organizationId: string, region: string): Promise<AttributeTemplate[]> {
    try {
      this.logger.log(`Getting attribute templates for region ${region}`);
      
      return await this.attributeTemplateRepository.findByRegion(organizationId, region);
    } catch (error) {
      this.logger.error(`Error getting attribute templates by region: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get attribute templates by marketplace
   * 
   * @param organizationId Organization ID
   * @param marketplaceId Marketplace ID
   * @returns Array of marketplace attribute templates
   */
  async getAttributeTemplatesByMarketplace(organizationId: string, marketplaceId: string): Promise<AttributeTemplate[]> {
    try {
      this.logger.log(`Getting attribute templates for marketplace ${marketplaceId}`);
      
      return await this.attributeTemplateRepository.findByMarketplace(organizationId, marketplaceId);
    } catch (error) {
      this.logger.error(`Error getting attribute templates by marketplace: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get attribute templates by scope
   * 
   * @param organizationId Organization ID
   * @param scope Attribute scope
   * @param options Query options for pagination, sorting, etc.
   * @returns Array of attribute templates with the given scope
   */
  async getAttributeTemplatesByScope(
    organizationId: string,
    scope: AttributeScope,
    options: QueryOptions = {}
  ): Promise<AttributeTemplate[]> {
    try {
      this.logger.log(`Getting attribute templates for scope ${scope}`);
      
      return await this.attributeTemplateRepository.findByScope(organizationId, scope, options);
    } catch (error) {
      this.logger.error(`Error getting attribute templates by scope: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get applicable attribute templates for a product
   * 
   * @param organizationId Organization ID
   * @param categoryIds Category IDs that the product belongs to
   * @param region Region for regional templates
   * @param marketplaceIds Marketplace IDs for marketplace templates
   * @returns Array of applicable attribute templates
   */
  async getApplicableAttributeTemplates(
    organizationId: string,
    categoryIds: string[] = [],
    region?: string,
    marketplaceIds: string[] = []
  ): Promise<AttributeTemplate[]> {
    try {
      this.logger.log(`Getting applicable attribute templates for product in categories ${categoryIds.join(', ')}`);
      
      // Get templates that apply to all products
      const globalApplicableTemplates = await this.attributeTemplateRepository.findGlobalApplicable(organizationId);
      
      // Get templates for the product's categories
      const categoryTemplatesPromises = categoryIds.map(
        categoryId => this.attributeTemplateRepository.findByCategory(organizationId, categoryId)
      );
      
      const categoryTemplatesArrays = await Promise.all(categoryTemplatesPromises);
      const categoryTemplates = categoryTemplatesArrays.flat();
      
      // Get regional templates if region is provided
      let regionalTemplates: AttributeTemplate[] = [];
      if (region) {
        regionalTemplates = await this.attributeTemplateRepository.findByRegion(organizationId, region);
      }
      
      // Get marketplace templates if marketplaceIds are provided
      let marketplaceTemplates: AttributeTemplate[] = [];
      if (marketplaceIds.length > 0) {
        const marketplaceTemplatesPromises = marketplaceIds.map(
          marketplaceId => this.attributeTemplateRepository.findByMarketplace(organizationId, marketplaceId)
        );
        
        const marketplaceTemplatesArrays = await Promise.all(marketplaceTemplatesPromises);
        marketplaceTemplates = marketplaceTemplatesArrays.flat();
      }
      
      // Combine all templates
      const allTemplates = [
        ...globalApplicableTemplates,
        ...categoryTemplates,
        ...regionalTemplates,
        ...marketplaceTemplates
      ];
      
      // Remove duplicates (by ID)
      const uniqueTemplates = allTemplates.filter((template, index, self) =>
        index === self.findIndex(t => t.id === template.id)
      );
      
      // Sort by position
      uniqueTemplates.sort((a, b) => (a.position || 0) - (b.position || 0));
      
      return uniqueTemplates;
    } catch (error) {
      this.logger.error(`Error getting applicable attribute templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk update attribute templates
   * 
   * @param operations Array of update operations
   * @returns Operation results
   */
  async bulkUpdateAttributeTemplates(
    operations: Array<{ id: string, updates: UpdateAttributeTemplateDto }>
  ): Promise<Array<OperationResult<AttributeTemplate>>> {
    try {
      this.logger.log(`Bulk updating ${operations.length} attribute templates`);
      
      // Process operations in parallel for better performance
      const operationPromises = operations.map(async ({ id, updates }) => {
        try {
          const attributeTemplate = await this.updateAttributeTemplate(id, updates);
          return {
            success: true,
            data: attributeTemplate
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            errorCode: error.status || 'UNKNOWN_ERROR'
          };
        }
      });
      
      const operationResults = await Promise.all(operationPromises);
      
      return operationResults;
    } catch (error) {
      this.logger.error(`Error in bulk update: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk delete attribute templates
   * 
   * @param organizationId Organization ID
   * @param templateIds Array of attribute template IDs to delete
   * @returns Operation results
   */
  async bulkDeleteAttributeTemplates(
    organizationId: string,
    templateIds: string[]
  ): Promise<Array<OperationResult>> {
    try {
      this.logger.log(`Bulk deleting ${templateIds.length} attribute templates`);
      
      // Process deletions in parallel for better performance
      const deletePromises = templateIds.map(async (id) => {
        try {
          // Verify the template belongs to the organization
          const template = await this.getAttributeTemplateById(id, organizationId);
          
          if (!template) {
            return {
              success: false,
              error: `Attribute template with ID ${id} not found or does not belong to this organization`,
              errorCode: 'NOT_FOUND'
            };
          }
          
          await this.deleteAttributeTemplate(id);
          
          return {
            success: true,
            data: { id }
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            errorCode: error.status || 'UNKNOWN_ERROR'
          };
        }
      });
      
      const deleteResults = await Promise.all(deletePromises);
      
      return deleteResults;
    } catch (error) {
      this.logger.error(`Error in bulk delete: ${error.message}`, error.stack);
      throw error;
    }
  }
}