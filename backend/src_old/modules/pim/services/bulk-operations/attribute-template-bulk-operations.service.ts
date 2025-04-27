import { Injectable, Logger } from "@nestjs/common";
import {
  BulkOperationsService,
  BulkOperationOptions,
  BulkOperationStats,
} from "./bulk-operations.service";
import { AttributeTemplateService } from "../attribute-template.service";
import { AttributeTemplate } from "../../models/attribute-template.model";
import { OperationResult } from "../../interfaces/types";

/**
 * Attribute template bulk update operation
 */
export interface AttributeTemplateBulkUpdateOperation {
  id: string;
  updates: Partial<AttributeTemplate>;
}

/**
 * Attribute template bulk attribute operation
 */
export interface AttributeTemplateBulkAttributeOperation {
  id: string;
  attributesToAdd: any[];
  attributesToRemove?: string[];
}

/**
 * Attribute template bulk marketplace mapping operation
 */
export interface AttributeTemplateBulkMarketplaceMappingOperation {
  id: string;
  marketplaceId: string;
  mappings: Array<{
    templateAttributeKey: string;
    marketplaceAttributeKey: string;
    isRequired?: boolean;
  }>;
}

/**
 * AttributeTemplateBulkOperationsService
 *
 * Service for optimized bulk operations on attribute templates with South African market optimizations
 */
@Injectable()
export class AttributeTemplateBulkOperationsService {
  private readonly logger = new Logger(
    AttributeTemplateBulkOperationsService.name,
  );

  constructor(
    private readonly bulkOperationsService: BulkOperationsService,
    private readonly attributeTemplateService: AttributeTemplateService,
  ) {}

  /**
   * Execute bulk attribute template updates
   *
   * @param operations Array of update operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateAttributeTemplates(
    operations: AttributeTemplateBulkUpdateOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<AttributeTemplate>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk attribute template update for ${operations.length} templates`,
    );

    return this.bulkOperationsService.executeBulk<
      AttributeTemplateBulkUpdateOperation,
      AttributeTemplate
    >(
      operations,
      async (operation) => {
        return await this.attributeTemplateService.updateAttributeTemplate(
          operation.id,
          operation.updates,
        );
      },
      options,
    );
  }

  /**
   * Execute bulk attribute template deletions
   *
   * @param organizationId Organization ID
   * @param templateIds Array of template IDs to delete
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkDeleteAttributeTemplates(
    organizationId: string,
    templateIds: string[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{ results: Array<OperationResult>; stats: BulkOperationStats }> {
    this.logger.log(
      `Starting bulk attribute template deletion for ${templateIds.length} templates`,
    );

    const operations = templateIds.map((id) => ({ id, organizationId }));

    return this.bulkOperationsService.executeBulk<
      { id: string; organizationId: string },
      { id: string }
    >(
      operations,
      async (operation) => {
        await this.attributeTemplateService.deleteAttributeTemplate(
          operation.id,
          operation.organizationId,
        );
        return { id: operation.id };
      },
      options,
    );
  }

  /**
   * Execute bulk attribute additions/removals
   *
   * @param organizationId Organization ID
   * @param operations Array of attribute operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkModifyTemplateAttributes(
    organizationId: string,
    operations: AttributeTemplateBulkAttributeOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<AttributeTemplate>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk attribute modification for ${operations.length} templates`,
    );

    return this.bulkOperationsService.executeBulk<
      AttributeTemplateBulkAttributeOperation,
      AttributeTemplate
    >(
      operations,
      async (operation) => {
        // Get current template
        const template =
          await this.attributeTemplateService.getAttributeTemplateById(
            operation.id,
            organizationId,
          );

        if (!template) {
          throw new Error(
            `Attribute template with ID ${operation.id} not found`,
          );
        }

        // Make a copy of current attributes
        const attributes = [...(template.attributes || [])];

        // Remove attributes if specified
        if (
          operation.attributesToRemove &&
          operation.attributesToRemove.length > 0
        ) {
          const attributeKeysToRemove = new Set(operation.attributesToRemove);
          const filteredAttributes = attributes.filter(
            (attr) => !attributeKeysToRemove.has(attr.key),
          );
          attributes.length = 0;
          attributes.push(...filteredAttributes);
        }

        // Add new attributes
        if (operation.attributesToAdd && operation.attributesToAdd.length > 0) {
          // Check for duplicates and merge
          const existingKeys = new Set(attributes.map((attr) => attr.key));

          for (const newAttr of operation.attributesToAdd) {
            if (existingKeys.has(newAttr.key)) {
              // Update existing attribute
              const index = attributes.findIndex(
                (attr) => attr.key === newAttr.key,
              );
              attributes[index] = { ...attributes[index], ...newAttr };
            } else {
              // Add new attribute
              attributes.push(newAttr);
              existingKeys.add(newAttr.key);
            }
          }
        }

        // Update template with modified attributes
        const updates: Partial<AttributeTemplate> = {
          attributes,
        };

        return await this.attributeTemplateService.updateAttributeTemplate(
          operation.id,
          updates,
        );
      },
      options,
    );
  }

  /**
   * Execute bulk marketplace mapping updates
   *
   * @param organizationId Organization ID
   * @param operations Array of marketplace mapping operations
   * @param options Bulk operation options
   * @returns Results of all operations with statistics
   */
  async bulkUpdateMarketplaceMappings(
    organizationId: string,
    operations: AttributeTemplateBulkMarketplaceMappingOperation[],
    options: Partial<BulkOperationOptions> = {},
  ): Promise<{
    results: Array<OperationResult<AttributeTemplate>>;
    stats: BulkOperationStats;
  }> {
    this.logger.log(
      `Starting bulk marketplace mapping update for ${operations.length} templates`,
    );

    return this.bulkOperationsService.executeBulk<
      AttributeTemplateBulkMarketplaceMappingOperation,
      AttributeTemplate
    >(
      operations,
      async (operation) => {
        // Get current template
        const template =
          await this.attributeTemplateService.getAttributeTemplateById(
            operation.id,
            organizationId,
          );

        if (!template) {
          throw new Error(
            `Attribute template with ID ${operation.id} not found`,
          );
        }

        // Initialize marketplace mappings if they don't exist
        const marketplaceMappings = template.marketplaceMappings || {};

        // Update marketplace mappings
        marketplaceMappings[operation.marketplaceId] = operation.mappings;

        // Update template with modified marketplace mappings
        const updates: Partial<AttributeTemplate> = {
          marketplaceMappings,
        };

        return await this.attributeTemplateService.updateAttributeTemplate(
          operation.id,
          updates,
        );
      },
      options,
    );
  }
}
